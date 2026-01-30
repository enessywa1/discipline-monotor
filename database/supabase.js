require('dotenv').config();
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use DATABASE_URL for Postgres (Supabase), fallback to SQLite for local development
const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
    console.log('🔗 Connecting to PostgreSQL database (Supabase)...');
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000, // Fail after 5 seconds if can't connect
        idleTimeoutMillis: 30000
    });

    // Wrapper to match sqlite3's API
    db.run = async (sql, params = []) => {
        // Convert ? to $1, $2, etc. for PostgreSQL
        let count = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++count}`);
        return db.query(pgSql, params);
    };

    db.get = async (sql, params = []) => {
        let count = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++count}`);
        const result = await db.query(pgSql, params);
        return result.rows[0];
    };

    db.all = async (sql, params = []) => {
        let count = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++count}`);
        const result = await db.query(pgSql, params);
        return result.rows;
    };

    // Test connection immediately
    db.connect()
        .then(client => {
            console.log('✅ PostgreSQL connection established');
            client.release();
        })
        .catch(err => {
            console.error('❌ FATAL: Could not connect to PostgreSQL:', err.message);
        });
} else {
    // SQLite Fallback for local development
    console.log('🔗 Using SQLite database (local development)...');
    const dbPath = path.resolve(__dirname, 'school_discipline.db');
    const sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error opening SQLite database:', err.message);
        } else {
            console.log('✅ Connected to SQLite database');
        }
    });

    // Promisify SQLite for consistency with PostgreSQL
    db = {
        run: (sql, params = []) => new Promise((resolve, reject) => {
            sqliteDb.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
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
        })
    };
}

module.exports = { db, isPostgres };
