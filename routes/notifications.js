const express = require('express');
const router = express.Router();

const db = require('../database/db');
const PushService = require('../services/push');

const adminRoles = new Set([
    'developer', 'director', 'principal', 'associate principal', 'dean of students',
    'discipline master', 'assistant discipline master', 'qa', 'cie', 'maintenance'
]);

const requireAdmin = (req, res, next) => {
    const role = (req.session.user?.role || '').trim().toLowerCase();
    if (!adminRoles.has(role)) {
        return res.status(req.session.user ? 403 : 401).json({ success: false, error: 'Administrator access required.' });
    }
    next();
};

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
            return res.json({ success: false, error: "Session expired", auth_error: true });
        }
    }

    const notifications = [];

    db.serialize(() => {
        // 1. New Tasks Assigned to User (Pending)
        db.all(`SELECT id, title, created_at, 'task' as type FROM tasks 
                WHERE assigned_to = ? AND status = 'Pending' 
                ORDER BY created_at DESC`, [user_id], (err, tasks) => {

            if (err) {
                console.error('Error fetching task notifications:', err.message);
                return res.status(500).json({ success: false, error: 'Unable to load notifications.' });
            }
            if (tasks) {
                tasks.forEach(t => notifications.push({
                    message: `New Task Assigned: ${t.title}`,
                    date: t.created_at,
                    link: '#tasks',
                    type: 'task',
                    persistent: false
                }));
            }

            // 2. Recent Announcements (Last 7 days)
            // Handle cross-database date filtering for announcements
            let annSql;
            if (db.isPostgres) {
                annSql = `SELECT id, title, created_at, 'announcement' as type FROM announcements 
                          WHERE posted_by != ? AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`;
            } else {
                annSql = `SELECT id, title, created_at, 'announcement' as type FROM announcements 
                          WHERE posted_by != ? AND created_at >= datetime('now', '-7 days')`;
            }

            db.all(annSql, [user_id], (err, anns) => {
                if (err) {
                    console.error('Error fetching announcement notifications:', err.message);
                    return res.status(500).json({ success: false, error: 'Unable to load notifications.' });
                }
                if (anns) {
                    anns.forEach(a => notifications.push({
                        message: `New Announcement: ${a.title}`,
                        date: a.created_at,
                        link: '#announcements',
                        type: 'info',
                        persistent: false
                    }));
                }

                // 3. Persistent Notifications (from notifications table)
                const persistentSql = `SELECT id, COALESCE(title, 'Notification') AS title, message, type, link, created_at, is_read FROM notifications 
                        WHERE user_id = ? AND is_read = FALSE 
                        ORDER BY created_at DESC`;

                db.all(persistentSql, [user_id], (err, persistents) => {

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
    const user = req.session.user;
    if (!user || !user.id) return res.status(401).json({ success: false, error: 'Session expired' });
    db.run('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
    const user = req.session.user;
    if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'Session expired' });
    }

    const ids = req.body && req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 ||
        ids.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
        return res.status(400).json({ success: false, error: 'Valid notification IDs are required.' });
    }

    const placeholders = ids.map(() => '?').join(', ');
    db.run(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id IN (${placeholders})`,
        [user.id, ...ids.map(Number)],
        (err) => {
            if (err) {
                console.error('Error marking notifications as read:', err.message);
                return res.status(500).json({ success: false, error: 'Unable to clear notifications.' });
            }
            return res.json({ success: true });
        }
    );
});

router.post('/broadcast', requireAdmin, (req, res) => {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const link = typeof req.body.link === 'string' && /^#[a-zA-Z0-9_-]+$/.test(req.body.link)
        ? req.body.link
        : '#dashboard';

    if (!title || !message || title.length > 120 || message.length > 1000) {
        return res.status(400).json({ success: false, error: 'A title and message are required (maximum 120 and 1000 characters).' });
    }

    db.run(
        `INSERT INTO notifications (user_id, title, message, type, link)
         SELECT id, ?, ?, 'broadcast', ? FROM users WHERE id != ?`,
        [title, message, link, req.session.user.id],
        function (err) {
            if (err) {
                console.error('Notification broadcast database error:', err.message);
                return res.status(500).json({ success: false, error: 'Could not send the notification.' });
            }

            PushService.sendToAll({ title, body: message, url: `/dashboard.html${link}` });
            if (req.io) req.io.emit('dashboard_update', { type: 'notification', action: 'create' });
            return res.json({ success: true, recipients: this.changes || 0 });
        }
    );
});

// POST /api/notifications
router.post('/', requireAdmin, (req, res) => {
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
