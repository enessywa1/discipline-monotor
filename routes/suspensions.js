const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper for Admin Check
const isAdmin = (user) => {
    if (!user || !user.role) return false;
    const adminRoles = ['developer', 'director', 'principal', 'associate principal', 'dean of students', 'discipline master', 'assistant discipline master', 'qa', 'cie', 'maintenance'];
    return adminRoles.includes(user.role.toLowerCase());
};

// GET /api/suspensions
router.get('/', (req, res) => {
    const { student_name } = req.query;
    const user = req.session.user;
    const isUserAdmin = isAdmin(user);

    let sql = `SELECT se.*, u.full_name as recorder_name 
               FROM suspensions_expulsions se
               LEFT JOIN users u ON se.recorded_by = u.id`;
    const params = [];
    const conditions = [];

    if (student_name) {
        conditions.push(`LOWER(se.student_name) LIKE LOWER(?)`);
        params.push(`%${student_name}%`);
    }

    if (!isUserAdmin && user) {
        conditions.push(`se.recorded_by = ?`);
        params.push(user.id);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
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
