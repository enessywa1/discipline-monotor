require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

// Use DATABASE_URL for Postgres (Supabase), fallback to SQLite for local development
const isPostgres = !!process.env.DATABASE_URL;

// Supabase Auth Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAuth = null;
if (supabaseUrl && supabaseAnonKey) {
    supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
}

let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

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
} else {
    // SQLite Fallback (Lazy Load for Vercel/Production)
    const sqlite3 = require('sqlite3').verbose();
    console.log('🔗 Database Mode: SQLite (Local)');
    const dbPath = path.resolve(__dirname, 'school_discipline.db');
    const sqliteDb = new sqlite3.Database(dbPath);

    // Promisify SQLite
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
}

module.exports = { db, isPostgres, supabaseAuth, supabaseAdmin };
