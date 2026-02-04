const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/suspensions
router.get('/', (req, res) => {
    const { student_name } = req.query;
    let sql = `SELECT se.*, u.full_name as recorder_name 
               FROM suspensions_expulsions se
               LEFT JOIN users u ON se.recorded_by = u.id`;
    const params = [];

    if (student_name) {
        sql += ` WHERE LOWER(se.student_name) LIKE LOWER(?)`;
        params.push(`%${student_name}%`);
    }

    sql += ` ORDER BY se.created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, records: rows });
    });
});

// POST /api/suspensions
router.post('/', (req, res) => {
    const { student_name, student_class, type, start_date, end_date, reason, recorded_by } = req.body;

    // Basic validation
    if (!student_name || !student_class || !type || !reason || !recorded_by) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    db.run(
        `INSERT INTO suspensions_expulsions (student_name, student_class, type, start_date, end_date, reason, recorded_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [student_name, student_class, type, start_date, end_date || null, reason, recorded_by],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'suspension', action: 'create' });
            res.json({ success: true, id: this.lastID });
        }
    );
});

module.exports = router;
