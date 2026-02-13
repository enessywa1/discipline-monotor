require('dotenv').config();
const { db, supabaseAdmin } = require('./supabase');

async function listUsers() {
    console.log('--- Database (PostgreSQL) Users ---');
    try {
        const dbUsers = await db.all('SELECT id, username, role, full_name, supabase_id FROM users');
        console.table(dbUsers);
    } catch (err) {
        console.error('❌ Error fetching from DB:', err.message);
    }

    if (supabaseAdmin) {
        console.log('\n--- Supabase Auth Users ---');
        try {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers();
            if (error) throw error;

            const authUsers = data.users.map(u => ({
                id: u.id,
                email: u.email,
                username: u.user_metadata.username,
                role: u.user_metadata.role,
                last_sign_in: u.last_sign_in_at
            }));
            console.table(authUsers);
        } catch (err) {
            console.error('❌ Error fetching from Auth:', err.message);
        }
    } else {
        console.log('\n⚠️ Supabase Auth keys not configured. Skipping Auth user list.');
    }
}

if (require.main === module) {
    listUsers().then(() => process.exit(0));
}
