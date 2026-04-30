const webpush = require('web-push');
const { db, isPostgres } = require('../database/db');

// Configure VAPID keys
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
    webpush.setVapidDetails(
        'mailto:admin@system.local',
        publicKey,
        privateKey
    );
}

const PushService = {
    /**
     * Send a push notification to all staff or specific roles
     */
    sendToAll: async (payload) => {
        try {
            // 1. Fetch all active subscriptions
            const sql = `SELECT * FROM push_subscriptions`;
            const subscriptions = await new Promise((resolve, reject) => {
                db.all(sql, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            console.log(`📡 Sending push notifications to ${subscriptions.length} devices...`);

            const jsonPayload = JSON.stringify(payload);

            // 2. Send to each subscription
            const results = await Promise.allSettled(subscriptions.map(sub => {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                return webpush.sendNotification(subscription, jsonPayload)
                    .catch(async (err) => {
                        // If subscription is expired or invalid (404/410), delete it
                        if (err.statusCode === 404 || err.statusCode === 410) {
                            console.log(`🗑️ Removing expired subscription: ${sub.id}`);
                            await new Promise(res => {
                                db.run(`DELETE FROM push_subscriptions WHERE id = ?`, [sub.id], () => res());
                            });
                        }
                        throw err;
                    });
            }));

            const successes = results.filter(r => r.status === 'fulfilled').length;
            const failures = results.filter(r => r.status === 'rejected').length;
            console.log(`✅ Push complete: ${successes} sent, ${failures} failed/cleaned.`);

        } catch (error) {
            console.error("❌ PushService Error:", error.message);
        }
    }
};

module.exports = PushService;
