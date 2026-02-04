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
        idleTimeoutMillis: 30000,
        max: 5, // Reduced from 10 to avoid MaxClientsInSessionMode on Free Tier
        keepAlive: true, // Maintain connection socket
        allowExitOnIdle: true
    });

    // Pool error handling
    db.on('error', (err) => {
        console.error('❌ Unexpected Database Pool Error:', err.message);
    });

    // Helper to standardize parameter replacement ($1, $2...)
    const prepareSql = (sql) => {
        let count = 0;
        return sql.replace(/\?/g, () => `$${++count}`);
    };

    // Helper to handle optional callbacks and Promises with RETRY logic
    const execute = async (type, sql, params = [], callback, retryCount = 0) => {
        const MAX_RETRIES = 2;

        // Handle optional params
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        try {
            let pgSql = prepareSql(sql);

            // For 'run' (INSERT), try to return ID to emulate sqlite3's this.lastID
            if (type === 'run' && /^\s*INSERT\s+INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
                pgSql += ' RETURNING id';
            }

            const result = await db.query(pgSql, params);

            if (callback) {
                const context = {};
                if (type === 'run') {
                    context.changes = result.rowCount;
                    if (result.rows && result.rows.length > 0 && result.rows[0].id) {
                        context.lastID = result.rows[0].id;
                    }
                }

                let data = null;
                if (type === 'get') data = result.rows[0];
                if (type === 'all') data = result.rows;

                callback.call(context, null, data);
            }

            if (type === 'get') return result.rows[0];
            if (type === 'all') return result.rows;
            return result;

        } catch (err) {
            const isRetryable = err.message.includes('ECONNRESET') ||
                err.message.includes('timeout') ||
                err.message.includes('terminated unexpectedly');

            if (isRetryable && retryCount < MAX_RETRIES) {
                console.warn(`⚠️  Database retry ${retryCount + 1}/${MAX_RETRIES} for: ${err.message}`);
                // Wait slightly before retry
                await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
                return execute(type, sql, params, callback, retryCount + 1);
            }

            console.error('❌ Database Error:', err.message);
            if (callback) callback(err);
            else throw err;
        }
    };

    // Wrapper API to match sqlite3
    db.run = (sql, params, callback) => execute('run', sql, params, callback);
    db.get = (sql, params, callback) => execute('get', sql, params, callback);
    db.all = (sql, params, callback) => execute('all', sql, params, callback);
    db.serialize = (callback) => { if (callback) callback(); };

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
