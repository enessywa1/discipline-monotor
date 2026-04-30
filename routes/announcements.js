const express = require('express');
const router = express.Router();

const db = require('../database/db');
const PushService = require('../services/push');

// GET /api/announcements
router.get('/', (req, res) => {
    // Fetch non-expired announcements
    db.all(`SELECT a.*, u.full_name as author FROM announcements a 
            JOIN users u ON a.posted_by = u.id 
            WHERE (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
            ORDER BY a.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, announcements: rows });
    });
});

// POST /api/announcements
router.post('/', (req, res) => {
    const { title, content, visibility, posted_by, duration } = req.body;
    let expiresAt = null;

    if (duration && duration !== 'Permanent') {
        const days = parseInt(duration);
        if (!isNaN(days)) {
            const date = new Date();
            date.setDate(date.getDate() + days);
            expiresAt = date.toISOString();
        }
    }

    db.run(`INSERT INTO announcements (title, content, visibility, posted_by, expires_at) VALUES (?, ?, ?, ?, ?)`,
        [title, content, visibility || 'All', posted_by, expiresAt],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Trigger Push Notification for everyone
            PushService.sendToAll({
                title: 'New Announcement: ' + title,
                body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                url: '/dashboard.html#announcements'
            });

            if (req.io) req.io.emit('dashboard_update', { type: 'announcement', action: 'create' });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE /api/announcements/:id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM announcements WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (req.io) req.io.emit('dashboard_update', { type: 'announcement', action: 'delete' });
        res.json({ success: true });
    });
});

module.exports = router;
