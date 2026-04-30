const { db, isPostgres } = require('./supabase');

async function migrate() {
    console.log('🚀 Starting migration: Adding status column to detentions table...');

    const addColumnQuery = `ALTER TABLE detentions ADD COLUMN status TEXT DEFAULT 'Uncleared'`;

    if (isPostgres) {
        try {
            await db.query(addColumnQuery);
            console.log('✅ PostgreSQL: status column added.');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('ℹ️ PostgreSQL: status column already exists.');
            } else {
                console.error('❌ PostgreSQL Migration Error:', err.message);
            }
        }
    } else {
        // SQLite
        db.run(addColumnQuery, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('ℹ️ SQLite: status column already exists.');
                } else {
                    console.error('❌ SQLite Migration Error:', err.message);
                }
            } else {
                console.log('✅ SQLite: status column added.');
            }
        });
    }
}

migrate();
