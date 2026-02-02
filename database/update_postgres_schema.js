// update_postgres_schema.js
const { db, isPostgres } = require('./supabase');

if (!isPostgres) {
    console.log("Not using Postgres. Skipping.");
    process.exit(0);
}

async function runUpdates() {
    try {
        console.log("Checking schema for missing columns...");

        // Add student_class to discipline_reports
        try {
            await db.run("ALTER TABLE discipline_reports ADD COLUMN IF NOT EXISTS student_class TEXT");
            console.log("✅ student_class ensured in discipline_reports");
        } catch (e) {
            console.log("ℹ️  discipline_reports.student_class check/update skipped or already exists");
        }

        // Add student_class to statements
        try {
            await db.run("ALTER TABLE statements ADD COLUMN IF NOT EXISTS student_class TEXT");
            console.log("✅ student_class ensured in statements");
        } catch (e) {
            console.log("ℹ️  statements.student_class check/update skipped or already exists");
        }

        console.log("Schema update finished!");
        process.exit(0);
    } catch (err) {
        console.error("Schema update failed:", err.message);
        process.exit(1);
    }
}

runUpdates();
