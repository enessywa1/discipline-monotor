const { db, isPostgres } = require('./supabase');

async function migrate() {
    console.log('🚀 Starting migration: Adding expires_at to announcements...');

    if (isPostgres) {
        try {
            await db.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP');
            console.log('✅ PostgreSQL: expires_at column added or already exists.');
        } catch (err) {
            console.error('❌ PostgreSQL Migration Error:', err.message);
        }
    } else {
        // SQLite
        db.all("PRAGMA table_info(announcements)", (err, columns) => {
            if (err) {
                console.error('❌ SQLite Error checking columns:', err.message);
                return;
            }

            const hasExpiresAt = columns.some(col => col.name === 'expires_at');
            if (!hasExpiresAt) {
                db.run('ALTER TABLE announcements ADD COLUMN expires_at DATETIME', (alterErr) => {
                    if (alterErr) console.error('❌ SQLite Migration Error:', alterErr.message);
                    else console.log('✅ SQLite: expires_at column added.');
                });
            } else {
                console.log('ℹ️  SQLite: expires_at column already exists.');
            }
        });
    }
}

migrate();
