const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readUsers() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeUsers(users) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function findByEmail(email) {
  return readUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findById(id) {
  return readUsers().find(u => u.id === id);
}

function createUser({ name, email, passwordHash }) {
  const users = readUsers();
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

function updatePassword(email, passwordHash) {
  const users = readUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  user.passwordHash = passwordHash;
  writeUsers(users);
  return user;
}

function updateName(id, name) {
  const users = readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return null;
  user.name = name;
  writeUsers(users);
  return user;
}

function setApiKey(id, apiKey) {
  const users = readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return null;
  user.apiKey = apiKey;
  writeUsers(users);
  return user;
}

function listUsers() {
  return readUsers()
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ passwordHash, ...rest }) => ({ status: 'active', ...rest }));
}

function setStatus(id, status) {
  const users = readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return null;
  user.status = status;
  writeUsers(users);
  return user;
}

function deleteUser(id) {
  const users = readUsers();
  const next = users.filter(u => u.id !== id);
  writeUsers(next);
  return next.length !== users.length;
}

module.exports = { findByEmail, findById, createUser, updatePassword, updateName, setApiKey, listUsers, setStatus, deleteUser };
