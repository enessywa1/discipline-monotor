const { db, isPostgres } = require('./supabase');

async function addSupabaseIdColumn() {
    console.log('🔗 Checking Supabase database schema...');

    if (!isPostgres) {
        console.log('⚠️ Not connected to PostgreSQL. Skipping.');
        return;
    }

    try {
        const type = 'UUID'; // Supabase/Postgres specific
        await db.run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id ${type}`);
        console.log('✅ Column "supabase_id" ensured in "users" table.');
    } catch (err) {
        console.error('❌ Error adding column:', err.message);
    }
}

if (require.main === module) {
    addSupabaseIdColumn().then(() => process.exit(0));
}
