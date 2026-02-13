require('dotenv').config();
const { db, supabaseAdmin } = require('./supabase');

async function migrateUsers() {
    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin client not initialized. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
        return;
    }

    try {
        console.log('🔍 Fetching users from local database...');
        const users = await db.all('SELECT * FROM users');
        console.log(`📊 Found ${users.length} users to migrate.`);

        for (const user of users) {
            console.log(`👤 Migrating user: ${user.username} (${user.email || user.username + '@system.local'})`);

            // Supabase Auth requires an email. If users don't have emails, we generate a placeholder.
            const sanitizedUsername = user.username.replace(/\s+/g, '_').toLowerCase();
            const email = user.email || `${sanitizedUsername}@system.local`;
            const tempPassword = 'UpdateMe123!';

            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role,
                    allocation: user.allocation,
                    phone_number: user.phone_number
                }
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    console.log(`ℹ️  User ${user.username} already exists in Supabase Auth. Fetching ID...`);
                    // Fetch the existing user to get their ID and link it
                    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                    if (!listError) {
                        const existingUser = existingUsers.users.find(u => u.email === email);
                        if (existingUser) {
                            await db.run('UPDATE users SET supabase_id = ? WHERE id = ?', [existingUser.id, user.id]);
                            console.log(`🔗 Linked existing Supabase ID for ${user.username}`);
                        }
                    }
                } else {
                    console.error(`❌ Failed to migrate ${user.username}:`, error.message);
                }
            } else {
                console.log(`✅ Successfully migrated ${user.username} (ID: ${data.user.id})`);

                // Optional: Store the Supabase UUID in our local users table
                await db.run('UPDATE users SET supabase_id = ? WHERE id = ?', [data.user.id, user.id]);
            }
        }

        console.log('🎉 Migration finished!');
    } catch (err) {
        console.error('❌ Migration Error:', err.message);
    }
}

if (require.main === module) {
    migrateUsers();
}

module.exports = migrateUsers;
