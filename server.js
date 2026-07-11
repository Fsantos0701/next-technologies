require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { findByEmail, findById, createUser, updatePassword, updateName, setApiKey, listUsers, setStatus, deleteUser } = require('./lib/userStore');
const { createPending, getPending, deletePending } = require('./lib/pendingSignups');
const { createPendingReset, getPendingReset, deletePendingReset } = require('./lib/pendingResets');
const { sendVerificationEmail, sendResetCodeEmail, sendSupportEmail } = require('./lib/mailer');

const PORT = process.env.PORT || 8082;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(session({
  name: 'next.sid',
  secret: process.env.SESSION_SECRET || 'next-technologies-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
}));

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || '').toLowerCase());
}

async function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const user = await findById(req.session.userId);
  if (!user || !isAdminEmail(user.email)) return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  next();
}

// ---------- API ----------

// Passo 1: valida os dados, gera um código de 6 dígitos e envia por e-mail.
// Nenhuma conta é criada ainda — os dados ficam pendentes até o código ser confirmado.
app.post('/api/signup/request-code', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: 'Informe seu nome.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  if (await findByEmail(email)) return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const code = createPending(email, { name: name.trim(), passwordHash });

  try {
    const result = await sendVerificationEmail(email, code);
    res.json({ ok: true, devMode: !!result.devMode });
  } catch (err) {
    deletePending(email);
    res.status(502).json({ error: 'Não foi possível enviar o e-mail de verificação. Tente novamente.' });
  }
});

// Passo 2: confirma o código e só então cria a conta de verdade.
app.post('/api/signup/verify-code', async (req, res) => {
  const { email, code } = req.body || {};
  if (!isValidEmail(email) || !code) return res.status(400).json({ error: 'Informe o código recebido por e-mail.' });

  const entry = getPending(email);
  if (!entry) return res.status(400).json({ error: 'Código expirado. Solicite um novo cadastro.' });
  if (entry.code !== String(code).trim()) return res.status(400).json({ error: 'Código incorreto.' });

  const user = await createUser({ name: entry.name, email, passwordHash: entry.passwordHash });
  deletePending(email);

  req.session.userId = user.id;
  res.json({ ok: true, user: { name: user.name, email: user.email } });
});

// Reenvia um novo código para um cadastro ainda pendente.
app.post('/api/signup/resend-code', async (req, res) => {
  const { email } = req.body || {};
  const entry = getPending(email || '');
  if (!entry) return res.status(400).json({ error: 'Nenhum cadastro pendente para este e-mail.' });

  const code = createPending(email, { name: entry.name, passwordHash: entry.passwordHash });
  try {
    const result = await sendVerificationEmail(email, code);
    res.json({ ok: true, devMode: !!result.devMode });
  } catch (err) {
    res.status(502).json({ error: 'Não foi possível reenviar o e-mail. Tente novamente.' });
  }
});

// Passo 1: se o e-mail existir, envia um código de redefinição.
// Sempre responde ok para não revelar se o e-mail está cadastrado.
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });

  const user = await findByEmail(email);
  if (!user) return res.json({ ok: true });

  const code = createPendingReset(email);
  try {
    const result = await sendResetCodeEmail(email, code);
    res.json({ ok: true, devMode: !!result.devMode });
  } catch (err) {
    res.status(502).json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' });
  }
});

// Passo 2: confirma o código e define a nova senha.
app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!isValidEmail(email) || !code) return res.status(400).json({ error: 'Informe o código recebido por e-mail.' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });

  const entry = getPendingReset(email);
  if (!entry) return res.status(400).json({ error: 'Código expirado. Solicite novamente.' });
  if (entry.code !== String(code).trim()) return res.status(400).json({ error: 'Código incorreto.' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(email, passwordHash);
  deletePendingReset(email);

  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await findByEmail(email || '');

  if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  const match = await bcrypt.compare(password || '', user.passwordHash);
  if (!match) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  if (user.status === 'suspended') return res.status(403).json({ error: 'Sua conta foi suspensa. Entre em contato com o suporte.' });

  req.session.userId = user.id;
  res.json({ ok: true, user: { name: user.name, email: user.email } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const user = await findById(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado.' });
  res.json({ user: { name: user.name, email: user.email, apiKey: user.apiKey || null, isAdmin: isAdminEmail(user.email) } });
});

// ---------- Conta ----------
app.post('/api/account/name', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Informe um nome válido.' });

  const user = await updateName(req.session.userId, name.trim());
  res.json({ ok: true, user: { name: user.name, email: user.email } });
});

app.post('/api/account/password', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' });

  const user = await findById(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado.' });

  const match = await bcrypt.compare(currentPassword || '', user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Senha atual incorreta.' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(user.email, passwordHash);
  res.json({ ok: true });
});

app.post('/api/account/api-key/generate', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const apiKey = 'ntk_live_' + crypto.randomBytes(24).toString('hex');
  await setApiKey(req.session.userId, apiKey);
  res.json({ ok: true, apiKey });
});

app.post('/api/account/api-key/revoke', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  await setApiKey(req.session.userId, null);
  res.json({ ok: true });
});

app.post('/api/support', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const { subject, message } = req.body || {};
  if (!subject || !subject.trim()) return res.status(400).json({ error: 'Informe um assunto.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Informe uma mensagem.' });

  const user = await findById(req.session.userId);
  try {
    const result = await sendSupportEmail({ name: user.name, email: user.email, subject: subject.trim(), message: message.trim() });
    res.json({ ok: true, devMode: !!result.devMode });
  } catch (err) {
    res.status(502).json({ error: 'Não foi possível enviar sua mensagem. Tente novamente.' });
  }
});

// ---------- Administração ----------
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const users = await listUsers();
  res.json({ users });
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const users = await listUsers();
  const now = new Date();

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const counts = Object.fromEntries(days.map((d) => [d, 0]));
  users.forEach((u) => {
    const day = new Date(u.createdAt).toISOString().slice(0, 10);
    if (counts[day] !== undefined) counts[day]++;
  });

  const last7 = users.filter((u) => now - new Date(u.createdAt) <= 7 * 24 * 60 * 60 * 1000).length;
  const last30 = users.filter((u) => now - new Date(u.createdAt) <= 30 * 24 * 60 * 60 * 1000).length;
  const suspended = users.filter((u) => u.status === 'suspended').length;

  res.json({
    total: users.length,
    last7,
    last30,
    active: users.length - suspended,
    suspended,
    daily: days.map((d) => ({ date: d, count: counts[d] })),
  });
});

app.post('/api/admin/users/:id/suspend', requireAdmin, async (req, res) => {
  await setStatus(req.params.id, 'suspended');
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/activate', requireAdmin, async (req, res) => {
  await setStatus(req.params.id, 'active');
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.session.userId) return res.status(400).json({ error: 'Você não pode excluir sua própria conta de admin.' });
  await deleteUser(req.params.id);
  res.json({ ok: true });
});

// ---------- Páginas protegidas ----------
const PROTECTED_PAGES = [
  '/dashboard.html', '/vendas.html', '/transacoes.html', '/contestacoes.html',
  '/recuperacao.html', '/taxas.html', '/saques.html', '/integracoes.html',
  '/apis.html', '/webhooks.html', '/emails.html', '/relatorios.html',
  '/configuracoes.html', '/suporte.html',
];
app.get(PROTECTED_PAGES, (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login.html');
  next();
});

app.get('/admin.html', async (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login.html');
  const user = await findById(req.session.userId);
  if (!user || !isAdminEmail(user.email)) return res.redirect('/dashboard.html');
  next();
});

// ---------- Arquivos estáticos ----------
app.use(express.static(__dirname));

(async () => {
  if (process.env.DATABASE_URL) {
    await require('./lib/db').ensureSchema();
  }
  app.listen(PORT, () => console.log(`Next Technologies rodando em http://localhost:${PORT}`));
})();
