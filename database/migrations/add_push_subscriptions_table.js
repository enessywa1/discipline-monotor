const { db, isPostgres } = require('../supabase');

const up = async () => {
    console.log(`🚀 Creating push_subscriptions table (${isPostgres ? 'Postgres' : 'SQLite'})...`);

    const sql = isPostgres ? 
        `CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )` :
        `CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;

    try {
        if (isPostgres) {
            await db.query(sql);
        } else {
            await new Promise((resolve, reject) => {
                db.run(sql, (err) => err ? reject(err) : resolve());
            });
        }
        console.log("✅ push_subscriptions table is ready.");
    } catch (err) {
        console.error("❌ Migration Error:", err.message);
    } finally {
        process.exit(0);
    }
};

up();
