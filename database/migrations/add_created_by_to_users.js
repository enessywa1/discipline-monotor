const db = require('./db');

async function migrate() {
    console.log('🚀 Starting migration: Adding created_by to users table...');
    
    try {
        if (db.isPostgres) {
            console.log('🐘 PostgreSQL detected');
            await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)');
        } else {
            console.log('📁 SQLite detected');
            // SQLite doesn't support ADD COLUMN IF NOT EXISTS or references in ALTER TABLE easily in some versions, 
            // but we'll try a basic ALTER TABLE.
            // Check if column exists first
            db.all("PRAGMA table_info(users)", [], (err, rows) => {
                if (err) {
                    console.error('❌ Error checking table info:', err);
                    process.exit(1);
                }
                const exists = rows.some(row => row.name === 'created_by');
                if (!exists) {
                    db.run('ALTER TABLE users ADD COLUMN created_by INTEGER REFERENCES users(id)', (err) => {
                        if (err) {
                            console.error('❌ Error adding column:', err);
                        } else {
                            console.log('✅ Column created_by added to users table');
                        }
                        process.exit(0);
                    });
                } else {
                    console.log('ℹ️ Column created_by already exists');
                    process.exit(0);
                }
            });
            return; // SQLite uses callbacks so we don't finish here
        }
        console.log('✅ Migration complete');
        process.exit(0);
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column created_by already exists');
        } else {
            console.error('❌ Migration failed:', err.message);
        }
        process.exit(1);
    }
}

migrate();
