require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

const isVercel = !!process.env.VERCEL;
const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
    console.log('🔗 Database Mode: PostgreSQL (Supabase)');
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 5,
        keepAlive: true,
        allowExitOnIdle: true
    });

    const prepareSql = (sql) => {
        let count = 0;
        return sql.replace(/\?/g, () => `$${++count}`);
    };

    const execute = async (type, sql, params = []) => {
        try {
            let pgSql = prepareSql(sql);
            if (type === 'run' && /^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
                pgSql += ' RETURNING id';
            }
            const result = await db.query(pgSql, params);
            if (type === 'get') return result.rows[0];
            if (type === 'all') return result.rows;
            return { lastID: result.rows?.[0]?.id, changes: result.rowCount };
        } catch (err) {
            console.error(`❌ Postgres ${type} Error:`, err.message);
            throw err;
        }
    };

    db.run = (sql, params) => execute('run', sql, params);
    db.get = (sql, params) => execute('get', sql, params);
    db.all = (sql, params) => execute('all', sql, params);
    db.isPostgres = true;
} else if (isVercel) {
    console.error('❌ FATAL: DATABASE_URL environment variable is missing in Vercel Settings!');
    // Throwing a clearer error for the logs
    db = {
        isPostgres: true, // Force it to prevent fallback errors elsewhere
        run: () => { throw new Error('Database not configured. Add DATABASE_URL to Vercel environment variables.'); },
        get: () => { throw new Error('Database not configured. Add DATABASE_URL to Vercel environment variables.'); },
        all: () => { throw new Error('Database not configured. Add DATABASE_URL to Vercel environment variables.'); }
    };
} else {
    // SQLite Fallback (Only for local development)
    try {
        const sqlite3 = require('sqlite3').verbose();
        console.log('🔗 Database Mode: SQLite (Local)');
        const dbPath = path.resolve(__dirname, 'school_discipline.db');
        const sqliteDb = new sqlite3.Database(dbPath);

        db = {
            isPostgres: false,
            run: (sql, params = []) => new Promise((resolve, reject) => {
                sqliteDb.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            }),
            get: (sql, params = []) => new Promise((resolve, reject) => {
                sqliteDb.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            }),
            all: (sql, params = []) => new Promise((resolve, reject) => {
                sqliteDb.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            close: () => new Promise((resolve) => sqliteDb.close(resolve))
        };
    } catch (e) {
        console.error('❌ SQLite failed to load. Ensure sqlite3 is installed for local dev.');
        db = { isPostgres: false, run: () => Promise.reject('DB Error'), get: () => Promise.reject('DB Error'), all: () => Promise.reject('DB Error') };
    }
}

module.exports = { db, isPostgres, supabaseAuth, supabaseAdmin };
