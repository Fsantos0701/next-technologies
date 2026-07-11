require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { findByEmail, createUser, updatePassword } = require('./lib/userStore');
const { createPending, getPending, deletePending } = require('./lib/pendingSignups');
const { createPendingReset, getPendingReset, deletePendingReset } = require('./lib/pendingResets');
const { sendVerificationEmail, sendResetCodeEmail } = require('./lib/mailer');

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

// ---------- API ----------

// Passo 1: valida os dados, gera um código de 6 dígitos e envia por e-mail.
// Nenhuma conta é criada ainda — os dados ficam pendentes até o código ser confirmado.
app.post('/api/signup/request-code', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: 'Informe seu nome.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  if (findByEmail(email)) return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });

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
app.post('/api/signup/verify-code', (req, res) => {
  const { email, code } = req.body || {};
  if (!isValidEmail(email) || !code) return res.status(400).json({ error: 'Informe o código recebido por e-mail.' });

  const entry = getPending(email);
  if (!entry) return res.status(400).json({ error: 'Código expirado. Solicite um novo cadastro.' });
  if (entry.code !== String(code).trim()) return res.status(400).json({ error: 'Código incorreto.' });

  const user = createUser({ name: entry.name, email, passwordHash: entry.passwordHash });
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

  const user = findByEmail(email);
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
  updatePassword(email, passwordHash);
  deletePendingReset(email);

  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = findByEmail(email || '');

  if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  const match = await bcrypt.compare(password || '', user.passwordHash);
  if (!match) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

  req.session.userId = user.id;
  res.json({ ok: true, user: { name: user.name, email: user.email } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const users = require('./lib/userStore').readUsers();
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado.' });
  res.json({ user: { name: user.name, email: user.email } });
});

// ---------- Páginas protegidas ----------
app.get('/dashboard.html', (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login.html');
  next();
});

// ---------- Arquivos estáticos ----------
app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`Next Technologies rodando em http://localhost:${PORT}`));
