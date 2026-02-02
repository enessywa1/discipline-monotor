const { db, isPostgres } = require('./supabase');

async function migrate() {
    console.log('🚀 Starting migration: Creating detentions table...');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS detentions (
            id SERIAL PRIMARY KEY,
            student_name TEXT NOT NULL,
            student_class TEXT NOT NULL,
            offense TEXT NOT NULL,
            incident_id INTEGER,
            detention_date DATE NOT NULL,
            detention_type TEXT NOT NULL,
            remarks TEXT,
            recorded_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recorded_by) REFERENCES users(id)
        )
    `;

    const createTableQuerySQLite = `
        CREATE TABLE IF NOT EXISTS detentions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            student_class TEXT NOT NULL,
            offense TEXT NOT NULL,
            incident_id INTEGER,
            detention_date DATE NOT NULL,
            detention_type TEXT NOT NULL,
            remarks TEXT,
            recorded_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recorded_by) REFERENCES users(id)
        )
    `;

    if (isPostgres) {
        try {
            await db.query(createTableQuery);
            console.log('✅ PostgreSQL: detentions table created or already exists.');
        } catch (err) {
            console.error('❌ PostgreSQL Migration Error:', err.message);
        }
    } else {
        // SQLite
        db.run(createTableQuerySQLite, (err) => {
            if (err) console.error('❌ SQLite Migration Error:', err.message);
            else console.log('✅ SQLite: detentions table created or already exists.');
        });
    }
}

migrate();
