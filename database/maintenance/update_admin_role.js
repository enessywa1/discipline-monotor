require('dotenv').config();
const { db, isPostgres } = require('./supabase');

async function updateAdminRole() {
    console.log('🔄 Updating Admin user role to "Developer"...');

    try {
        // Update user 'admin' to have role 'Developer'
        // Using db.run with standard SQL
        // Note: db.run wrapper in supabase.js handles correct parameter syntax emulation if needed, 
        // but explicit $1 is safer for Postgres if checking isPostgres.
        // However, our wrapper transforms ? to $1. So use ? for compatibility.

        // Wait, supabase.js wrapper:
        // if (isPostgres) { ... sql.replace(/\?/g, ... $N) ... }

        const sql = "UPDATE users SET role = ? WHERE username = ?";

        // We use the Promise-based behavior (or callback). Promise is cleaner here.
        // But previously I added callback support. Let's use Promise which 'supabase.js' also supports (async execute returns result).

        // Wait, db.run returns a Result object (Postgres) or Statement (SQLite).
        // Let's use the callback form to be 100% sure with my recent changes? 
        // Actually, my recent change returns 'result' if no callback.

        // Just use async/await
        await db.run(sql, ['Developer', 'admin']);

        console.log('✅ Successfully updated "admin" user to role "Developer".');

    } catch (err) {
        console.error('❌ Error updating role:', err);
    }
}

// Run if main
if (require.main === module) {
    updateAdminRole();
}

module.exports = updateAdminRole;
