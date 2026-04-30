const db = require('../db');

async function testNotifications() {
    console.log("🧪 Testing Notification Generation...");

    try {
        // 1. Get a sample user
        const user = await new Promise((resolve, reject) => {
            db.get("SELECT id, full_name FROM users LIMIT 1", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            console.error("❌ No users found to test with.");
            process.exit(1);
        }

        console.log(`👤 Testing with user: ${user.full_name} (ID: ${user.id})`);

        // 2. Create a test report
        const studentName = "Test Student " + Date.now();
        console.log(`📝 Creating test report for ${studentName}...`);
        
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO discipline_reports (student_name, student_class, offence, description, staff_id) VALUES (?, ?, ?, ?, ?)`,
                [studentName, 'Test Class', 'Test Offence', 'Test Description', user.id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        console.log("✅ Report created. Waiting for async notification seeding...");

        // 3. Wait a bit for the setImmediate/async logic to finish
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Check if a notification exists for this user
        const notification = await new Promise((resolve, reject) => {
            db.get(
                "SELECT * FROM notifications WHERE user_id = ? AND message LIKE ? ORDER BY created_at DESC LIMIT 1",
                [user.id, `%${studentName}%`],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (notification) {
            console.log("🎉 SUCCESS: Notification found in database!");
            console.log("   Message:", notification.message);
            console.log("   Type:", notification.type);
            console.log("   Link:", notification.link);
        } else {
            console.error("❌ FAILURE: No notification found in database after 2 seconds.");
            
            // Debug: count notifications
            const count = await new Promise(res => db.get("SELECT COUNT(*) as c FROM notifications", (e, r) => res(r.c)));
            console.log(`   Total notifications in table: ${count}`);
        }

    } catch (err) {
        console.error("💥 Test Error:", err.message);
    } finally {
        process.exit(0);
    }
}

testNotifications();
