const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = require('../database/db');

// GET /api/announcements
router.get('/', (req, res) => {
    // For MVP, fetch all reverse chronological
    db.all(`SELECT a.*, u.full_name as author FROM announcements a 
            JOIN users u ON a.posted_by = u.id 
            ORDER BY a.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, announcements: rows });
    });
});

// POST /api/announcements
router.post('/', (req, res) => {
    const { title, content, visibility, posted_by } = req.body;
    db.run(`INSERT INTO announcements (title, content, visibility, posted_by) VALUES (?, ?, ?, ?)`,
        [title, content, visibility || 'All', posted_by],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE /api/announcements/:id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM announcements WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
