require('dotenv').config();
const { supabaseAuth } = require('./supabase');

async function verifyLogin() {
    if (!supabaseAuth) {
        console.error('❌ Supabase Auth client not initialized.');
        return;
    }

    const testUser = 'admin@system.local';
    const testPass = 'UpdateMe123!';

    console.log(`🧪 Testing login for ${testUser}...`);

    try {
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email: testUser,
            password: testPass,
        });

        if (error) {
            console.error('❌ Login Verification Failed:', error.message);
            process.exit(1);
        } else {
            console.log('✅ Login Verification Successful!');
            console.log('👤 User ID:', data.user.id);
            console.log('📧 Email:', data.user.email);
            console.log('🛠 Metadata:', JSON.stringify(data.user.user_metadata, null, 2));
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Unexpected Error during verification:', err.message);
        process.exit(1);
    }
}

verifyLogin();
