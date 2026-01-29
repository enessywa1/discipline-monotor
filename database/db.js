// This file now uses the abstraction layer that supports both SQLite and PostgreSQL
const { db, isPostgres } = require('./supabase');

module.exports = db;

