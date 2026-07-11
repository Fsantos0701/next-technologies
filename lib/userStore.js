// Usa Postgres quando DATABASE_URL está configurada (produção); caso contrário,
// cai para o armazenamento local em JSON (desenvolvimento sem banco).
module.exports = process.env.DATABASE_URL
  ? require('./userStore.pg')
  : require('./userStore.local');
