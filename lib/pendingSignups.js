const CODE_TTL_MS = 10 * 60 * 1000;
const pending = new Map();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createPending(email, { name, passwordHash }) {
  const code = generateCode();
  pending.set(email.toLowerCase(), {
    name,
    passwordHash,
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
}

function getPending(email) {
  const entry = pending.get(email.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pending.delete(email.toLowerCase());
    return null;
  }
  return entry;
}

function deletePending(email) {
  pending.delete(email.toLowerCase());
}

module.exports = { createPending, getPending, deletePending };
