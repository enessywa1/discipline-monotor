// add_last_login_column.js
const { db, isPostgres } = require('./supabase');

async function runMigration() {
    try {
        console.log("🚀 Running migration: Adding last_login column to users table...");

        // Add last_login to users
        const sql = isPostgres
            ? "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP"
            : "ALTER TABLE users ADD COLUMN last_login TIMESTAMP";

        try {
            await db.run(sql);
            console.log("✅ last_login column ensured in users table");
        } catch (e) {
            if (e.message.includes("already exists") || e.message.includes("duplicate column")) {
                console.log("ℹ️  last_login column already exists.");
            } else {
                throw e;
            }
        }

        console.log("🎉 Migration finished successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

runMigration();
