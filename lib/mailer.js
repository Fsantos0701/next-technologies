const { Resend } = require('resend');

const FROM = process.env.RESEND_FROM || 'Next Technologies <onboarding@resend.dev>';

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendVerificationEmail(to, code) {
  const client = getClient();

  if (!client) {
    console.log(`[DEV — sem RESEND_API_KEY configurada] Código de verificação para ${to}: ${code}`);
    return { devMode: true };
  }

  const { error } = await client.emails.send({
    from: FROM,
    to,
    subject: 'Seu código de verificação — Next Technologies',
    html: `
      <div style="font-family:Arial,sans-serif;background:#060B18;color:#E8ECF7;padding:32px;border-radius:16px;max-width:420px;margin:0 auto;">
        <h2 style="margin:0 0 12px;">Confirme seu e-mail</h2>
        <p style="color:#8E97B8;font-size:14px;">Use o código abaixo para concluir seu cadastro na Next Technologies:</p>
        <p style="font-size:34px;font-weight:800;letter-spacing:8px;color:#00E0C6;margin:24px 0;">${code}</p>
        <p style="color:#8E97B8;font-size:12px;">Este código expira em 10 minutos. Se você não solicitou este cadastro, ignore este e-mail.</p>
      </div>
    `,
  });

  if (error) throw new Error(error.message || 'Falha ao enviar e-mail.');
  return { devMode: false };
}

module.exports = { sendVerificationEmail };
