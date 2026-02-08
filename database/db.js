const { db, isPostgres } = require('./supabase');

// Attach flag to db instance so it's accessible everywhere
db.isPostgres = isPostgres;

module.exports = db;

