const express = require('express');
const router = express.Router();

const db = require('../database/db');
const PushService = require('../services/push');
const { isVisibleToRole, getPushRoleFilter } = require('../utils/announcement-audience');

// GET /api/announcements
router.get('/', (req, res) => {
    db.all(`SELECT a.*, u.full_name as author FROM announcements a 
            JOIN users u ON a.posted_by = u.id 
            WHERE (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
            ORDER BY a.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const role = req.session.user?.role;
        res.json({
            success: true,
            announcements: rows.filter(announcement => isVisibleToRole(announcement.visibility, role))
        });
    });
});

// POST /api/announcements
router.post('/', (req, res) => {
    const { title, content, visibility, posted_by, duration } = req.body;
    const audience = visibility || 'All';
    if (!['All', 'Patrons/Matrons', 'Teachers'].includes(audience)) {
        return res.status(400).json({ success: false, error: 'Choose a valid announcement audience.' });
    }
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
        [title, content, audience, posted_by, expiresAt],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            
            PushService.sendToAll({
                title: 'New Announcement: ' + title,
                body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                url: '/dashboard.html#announcements'
            }, getPushRoleFilter(audience));

            if (req.io) req.io.emit('dashboard_update', { type: 'announcement', action: 'create' });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// UPDATE /api/announcements/:id
router.put('/:id', (req, res) => {
    const { title, content, visibility } = req.body;
    const { id } = req.params;
    if (!['All', 'Staff', 'Patrons/Matrons', 'Teachers'].includes(visibility)) {
        return res.status(400).json({ success: false, error: 'Choose a valid announcement audience.' });
    }

    db.run(
        `UPDATE announcements SET title = ?, content = ?, visibility = ? WHERE id = ?`,
        [title, content, visibility, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'announcement', action: 'update' });
            res.json({ success: true, changes: this.changes });
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
