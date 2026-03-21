const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/settings - Get settings (public)
router.get('/', (req, res) => {
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json({ success: true, settings });
    });
});

// GET /api/settings/:key - Get specific setting
router.get('/:key', (req, res) => {
    const { key } = req.params;
    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Setting not found' });
        res.json({ success: true, [key]: row.value });
    });
});

// PUT /api/settings/:key - Update setting (Admin/DM only)
router.put('/:key', (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    const user = req.session.user;

    if (!user || (user.role || '').toLowerCase() !== 'discipline master') {
        return res.status(403).json({ error: 'Unauthorized: Discipline Master role required' });
    }

    db.run('INSERT INTO settings (key, value) ON CONFLICT(key) DO UPDATE SET value = ?', [value, value], function(err) {
        // Fallback for SQLite which doesn't support ON CONFLICT in some versions or differs in syntax
        if (err) {
            db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value], function(err2) {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true });
            });
        } else {
            res.json({ success: true });
        }
    });
});

module.exports = router;
