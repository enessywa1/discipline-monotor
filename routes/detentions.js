const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/detentions
router.get('/', (req, res) => {
    const { student_name, detention_type, sort_by } = req.query;
    let sql = `SELECT d.*, u.full_name as recorder_name 
               FROM detentions d 
               LEFT JOIN users u ON d.recorded_by = u.id`;
    const params = [];
    const conditions = [];

    if (student_name) {
        conditions.push(`LOWER(d.student_name) LIKE LOWER(?)`);
        params.push(`%${student_name}%`);
    }

    if (detention_type && detention_type !== 'All') {
        conditions.push(`d.detention_type = ?`);
        params.push(detention_type);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
    }

    // Sorting logic
    const allowedSortFields = ['detention_date', 'student_name', 'created_at'];
    const sortBy = allowedSortFields.includes(sort_by) ? sort_by : 'detention_date';
    sql += ` ORDER BY ${sortBy} DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, detentions: rows });
    });
});

// POST /api/detentions
router.post('/', (req, res) => {
    const { student_name, student_class, offense, incident_id, detention_date, detention_type, remarks, recorded_by } = req.body;

    db.run(
        `INSERT INTO detentions (student_name, student_class, offense, incident_id, detention_date, detention_type, remarks, recorded_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [student_name, student_class, offense, incident_id || null, detention_date, detention_type, remarks, recorded_by],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'detention', action: 'create' });
            res.json({ success: true, detentionId: this.lastID });
        }
    );
});

module.exports = router;
