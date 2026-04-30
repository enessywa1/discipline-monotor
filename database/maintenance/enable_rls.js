const { db, isPostgres } = require('./supabase');

const tables = [
    'users',
    'students',
    'tasks',
    'announcements',
    'discipline_reports',
    'statements',
    'standings',
    'watchlist',
    'improved_students',
    'suspensions_expulsions',
    'notifications',
    'detentions'
];

async function enableRLS() {
    console.log("🔒 Enabling Row Level Security (RLS) on all tables...");

    if (!isPostgres) {
        console.log("⚠️  Not connected to PostgreSQL. RLS is a Postgres feature. Skipping.");
        return;
    }

    try {
        for (const table of tables) {
            console.log(`Processing table: ${table}...`);

            // 1. Enable RLS
            try {
                await db.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
                console.log(`   - RLS Enabled.`);
            } catch (e) {
                console.log(`   - RLS Enable Error (likely already enabled): ${e.message}`);
            }

            // 2. Create Permissive Policy (Allow All)
            // We use DO logic or simple try/catch because "IF NOT EXISTS" for policies is Postgres 9.5+ but syntax can vary
            try {
                // Drop if exists to ensure clean state or just try creating
                // A common pattern is: CREATE POLICY "name" ON "table" ...
                // If it exists, it throws.
                await db.query(`
                    CREATE POLICY "Enable all access" 
                    ON "${table}" 
                    FOR ALL 
                    TO public 
                    USING (true) 
                    WITH CHECK (true);
                `);
                console.log(`   - Policy 'Enable all access' created.`);
            } catch (e) {
                if (e.message.includes("already exists")) {
                    console.log(`   - Policy 'Enable all access' already exists.`);
                } else {
                    console.error(`   ❌ Failed to create policy: ${e.message}`);
                }
            }
        }
        console.log("\n✅ RLS Setup Completed!");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Fatal Error:", err);
        process.exit(1);
    }
}

enableRLS();
