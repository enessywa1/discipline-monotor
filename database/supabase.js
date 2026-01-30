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
        connectionTimeoutMillis: 5000, // Fail after 5 seconds
        idleTimeoutMillis: 30000
    });

    // Helper to standardize parameter replacement ($1, $2...)
    const prepareSql = (sql) => {
        let count = 0;
        return sql.replace(/\?/g, () => `$${++count}`);
    };

    // Helper to handle optional callbacks and Promises
    const execute = async (type, sql, params = [], callback) => {
        // Handle optional params
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        try {
            let pgSql = prepareSql(sql);

            // For 'run' (INSERT), try to return ID to emulate sqlite3's this.lastID
            // Only IF it's an INSERT and doesn't already have RETURNING
            if (type === 'run' && /^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
                pgSql += ' RETURNING id';
            }

            const result = await db.query(pgSql, params);

            if (callback) {
                // Emulate sqlite3 context (this.lastID, this.changes)
                const context = {};
                if (type === 'run') {
                    context.changes = result.rowCount;
                    if (result.rows && result.rows.length > 0 && result.rows[0].id) {
                        context.lastID = result.rows[0].id;
                    }
                }

                // Determine data to return
                let data = null;
                if (type === 'get') data = result.rows[0];
                if (type === 'all') data = result.rows;

                callback.call(context, null, data);
            }

            // For Promise users
            if (type === 'get') return result.rows[0];
            if (type === 'all') return result.rows;
            return result;

        } catch (err) {
            console.error('❌ Database Error:', err.message);
            if (callback) callback(err);
            else throw err;
        }
    };

    // Wrapper API to match sqlite3
    db.run = (sql, params, callback) => execute('run', sql, params, callback);
    db.get = (sql, params, callback) => execute('get', sql, params, callback);
    db.all = (sql, params, callback) => execute('all', sql, params, callback);

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
    // SQLite Fallback
    console.log('🔗 Using SQLite database (local development)...');
    const dbPath = path.resolve(__dirname, 'school_discipline.db');
    const sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('❌ SQLite Error:', err.message);
        else console.log('✅ Connected to SQLite database');
    });

    db = sqliteDb;
}

module.exports = { db, isPostgres };
