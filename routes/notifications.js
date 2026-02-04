const express = require('express');
const router = express.Router();

const db = require('../database/db');

// GET /api/notifications?user_id=X&role=Y
router.get('/', (req, res) => {
    const { user_id, role } = req.query;

    const notifications = [];

    db.serialize(() => {
        // 1. New Tasks Assigned to User (Pending)
        db.all(`SELECT id, title, created_at, 'task' as type FROM tasks 
                WHERE assigned_to = ? AND status = 'Pending' 
                ORDER BY created_at DESC`, [user_id], (err, tasks) => {

            if (!err && tasks) {
                tasks.forEach(t => notifications.push({
                    message: `New Task Assigned: ${t.title}`,
                    date: t.created_at,
                    link: '#tasks',
                    type: 'task',
                    persistent: false
                }));
            }

            // 2. Recent Announcements (Last 7 days)
            let annSql = `SELECT id, title, created_at, 'announcement' as type FROM announcements 
                          WHERE posted_by != ? AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`;

            db.all(annSql, [user_id], (err, anns) => {
                if (!err && anns) {
                    anns.forEach(a => notifications.push({
                        message: `New Announcement: ${a.title}`,
                        date: a.created_at,
                        link: '#announcements',
                        type: 'info',
                        persistent: false
                    }));
                }

                // 3. Persistent Notifications (from notifications table)
                db.all(`SELECT id, message, type, link, created_at FROM notifications 
                        WHERE user_id = ? AND is_read = 0 
                        ORDER BY created_at DESC`, [user_id], (err, persistents) => {

                    if (!err && persistents) {
                        persistents.forEach(p => notifications.push({
                            id: p.id,
                            message: p.message,
                            date: p.created_at,
                            link: p.link || '#',
                            type: p.type,
                            persistent: true
                        }));
                    }

                    // Sort by date desc
                    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

                    res.json({ success: true, notifications });
                });
            });
        });
    });
});

// PUT /api/notifications/read/:id
router.put('/read/:id', (req, res) => {
    const { id } = req.params;
    db.run('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// POST /api/notifications
router.post('/', (req, res) => {
    const { user_id, message, type, link } = req.body;
    db.run(`INSERT INTO notifications (user_id, message, type, link) VALUES (?, ?, ?, ?)`,
        [user_id, message, type || 'info', link],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

module.exports = router;
