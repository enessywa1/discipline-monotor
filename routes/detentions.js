const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/detentions
router.get('/', (req, res) => {
    const { student_name, sort_by, status } = req.query;
    let sql = `SELECT d.*, u.full_name as recorder_name 
               FROM detentions d 
               LEFT JOIN users u ON d.recorded_by = u.id`;
    const params = [];
    const conditions = [];

    if (student_name) {
        conditions.push(`LOWER(d.student_name) LIKE LOWER(?)`);
        params.push(`%${student_name}%`);
    }

    if (status) {
        conditions.push(`d.status = ?`);
        params.push(status);
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

// PUT /api/detentions/:id/clear
router.put('/:id/clear', (req, res) => {
    const { id } = req.params;

    // Get current record
    db.get('SELECT id, days, status FROM detentions WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Record not found' });

        let newDays = (row.days || 1) - 1;
        let newStatus = newDays <= 0 ? 'Cleared' : 'Uncleared';
        if (newDays < 0) newDays = 0;

        db.run(
            'UPDATE detentions SET days = ?, status = ? WHERE id = ?',
            [newDays, newStatus, id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (req.io) req.io.emit('dashboard_update', { type: 'detention', action: 'update', id });
                res.json({ success: true, message: 'Detention updated', days: newDays, status: newStatus });
            }
        );
    });
});

// POST /api/detentions
router.post('/', (req, res) => {
    const { student_name, student_class, offense, incident_id, detention_date, remarks, recorded_by, days } = req.body;
    const detention_type = 'Standard'; // Default value since it's removed from UI

    db.run(
        `INSERT INTO detentions (student_name, student_class, offense, incident_id, detention_date, detention_type, remarks, recorded_by, days) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [student_name, student_class, offense, incident_id || null, detention_date, detention_type, remarks || '', recorded_by, days || 1],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'detention', action: 'create' });
            res.json({ success: true, detentionId: this.lastID });
        }
    );
});

module.exports = router;
