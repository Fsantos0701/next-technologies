const { pool } = require('./db');

function mapRow(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    apiKey: row.api_key,
  };
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return mapRow(rows[0]);
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

async function createUser({ name, email, passwordHash }) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const { rows } = await pool.query(
    'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, name, email.toLowerCase(), passwordHash]
  );
  return mapRow(rows[0]);
}

async function updatePassword(email, passwordHash) {
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE lower(email) = lower($2) RETURNING *',
    [passwordHash, email]
  );
  return mapRow(rows[0]);
}

async function updateName(id, name) {
  const { rows } = await pool.query('UPDATE users SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
  return mapRow(rows[0]);
}

async function setApiKey(id, apiKey) {
  const { rows } = await pool.query('UPDATE users SET api_key = $1 WHERE id = $2 RETURNING *', [apiKey, id]);
  return mapRow(rows[0]);
}

module.exports = { findByEmail, findById, createUser, updatePassword, updateName, setApiKey };
