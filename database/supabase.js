require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION);
const isPostgres = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

// Supabase Auth Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const { createClient } = require('@supabase/supabase-js');

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
    db.isPostgres = true;
} else if (isProduction) {
    console.warn('⚠️ DATABASE_URL missing! Running in offline-diagnostic mode.');
    db = {
        isPostgres: true,
        run: async () => { throw new Error('Database not configured. Check Vercel Environment Variables.'); },
        get: async () => { throw new Error('Database not configured. Check Vercel Environment Variables.'); },
        all: async () => { throw new Error('Database not configured. Check Vercel Environment Variables.'); }
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
