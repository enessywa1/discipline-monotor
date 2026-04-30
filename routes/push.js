const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/push/subscribe - Register a new device for push
router.post('/subscribe', (req, res) => {
    const { subscription, user_id } = req.body;

    if (!subscription || !user_id) {
        return res.status(400).json({ success: false, error: "Missing subscription or user_id" });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Use UPSERT logic (INSERT or UPDATE on conflict)
    const sql = `
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET 
            user_id = EXCLUDED.user_id,
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth
    `;

    // SQLite fallback for ON CONFLICT (if older version) or just use separate check
    if (!db.isPostgres) {
        // Simple SQLite implementation (delete then insert)
        db.serialize(() => {
            db.run(`DELETE FROM push_subscriptions WHERE endpoint = ?`, [endpoint]);
            db.run(`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`,
                [user_id, endpoint, p256dh, auth],
                function(err) {
                    if (err) return res.status(500).json({ success: false, error: err.message });
                    res.json({ success: true });
                }
            );
        });
    } else {
        db.run(sql, [user_id, endpoint, p256dh, auth], function(err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true });
        });
    }
});

module.exports = router;
