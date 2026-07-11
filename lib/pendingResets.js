const CODE_TTL_MS = 10 * 60 * 1000;
const pending = new Map();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createPendingReset(email) {
  const code = generateCode();
  pending.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
}

function getPendingReset(email) {
  const entry = pending.get(email.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pending.delete(email.toLowerCase());
    return null;
  }
  return entry;
}

function deletePendingReset(email) {
  pending.delete(email.toLowerCase());
}

module.exports = { createPendingReset, getPendingReset, deletePendingReset };
