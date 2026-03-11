const express = require('express');
const router = express.Router();

const db = require('../database/db');

// GET /api/notifications?user_id=X&role=Y
router.get('/', (req, res) => {
    let { user_id, role } = req.query;
    const sessionUser = req.session.user;

    // Helper for Admin Check
    const isAdmin = (user) => {
        if (!user || !user.role) return false;
        const adminRoles = ['developer', 'director', 'principal', 'associate principal', 'dean of students', 'discipline master', 'assistant discipline master', 'qa', 'cie', 'maintenance'];
        return adminRoles.includes(user.role.toLowerCase());
    };

    // Security: Non-admins can only see THEIR OWN notifications
    if (!isAdmin(sessionUser)) {
        if (sessionUser) {
            user_id = sessionUser.id;
        } else {
            return res.status(401).json({ error: "Unauthorized" });
        }
    }

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
                db.all(`SELECT id, title, message, type, link, created_at FROM notifications 
                        WHERE user_id = ? AND is_read = FALSE 
                        ORDER BY created_at DESC`, [user_id], (err, persistents) => {

                    if (err) console.error("Error fetching notifications:", err);
                    // console.log("Fetched notifications for user", user_id, ":", persistents);

                    if (!err && persistents) {
                        persistents.forEach(p => notifications.push({
                            id: p.id,
                            title: p.title,
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
    const { user_id, title, message, type, link } = req.body;
    db.run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
        [user_id, title || 'Notification', message, type || 'info', link],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

module.exports = router;
