const { db, isPostgres } = require('./supabase');

async function optimize() {
    console.log(`🚀 Starting database optimization (${isPostgres ? 'Postgres' : 'SQLite'})...`);

    const queries = [
        // Indexes for Statements
        "CREATE INDEX IF NOT EXISTS idx_statements_student ON statements(student_name)",
        "CREATE INDEX IF NOT EXISTS idx_statements_recorded_by ON statements(recorded_by)",
        "CREATE INDEX IF NOT EXISTS idx_statements_date ON statements(incident_date)",
        "CREATE INDEX IF NOT EXISTS idx_statements_created_at ON statements(created_at)",

        // Indexes for Discipline Reports
        "CREATE INDEX IF NOT EXISTS idx_reports_student ON discipline_reports(student_name)",
        "CREATE INDEX IF NOT EXISTS idx_reports_staff ON discipline_reports(staff_id)",
        "CREATE INDEX IF NOT EXISTS idx_reports_date ON discipline_reports(date_reported)",

        // Indexes for Detentions
        "CREATE INDEX IF NOT EXISTS idx_detentions_student ON detentions(student_name)",
        "CREATE INDEX IF NOT EXISTS idx_detentions_status ON detentions(status)",

        // Indexes for Tasks
        "CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
        "CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)"
    ];

    for (const q of queries) {
        try {
            if (isPostgres) {
                await db.query(q);
            } else {
                await new Promise((resolve, reject) => {
                    db.run(q, (err) => err ? reject(err) : resolve());
                });
            }
            console.log(`✅ Executed: ${q}`);
        } catch (err) {
            console.error(`❌ Error executing "${q}":`, err.message);
        }
    }

    console.log("🏁 Optimization complete.");
    process.exit(0);
}

optimize();
