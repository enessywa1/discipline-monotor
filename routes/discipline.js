const express = require('express');
const router = express.Router();

const db = require('../database/db');

// GET /api/discipline/students
router.get('/students', (req, res) => {
    const { search } = req.query;
    const params = [];
    let whereClause = "";

    if (search) {
        whereClause = ` WHERE LOWER(name) LIKE LOWER(?) OR LOWER(class) LIKE LOWER(?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    // Comprehensive search across all tables
    const sql = `
        SELECT name, class FROM students ${whereClause}
        UNION
        SELECT DISTINCT student_name as name, student_class as class FROM discipline_reports ${search ? 'WHERE LOWER(student_name) LIKE LOWER(?) OR LOWER(student_class) LIKE LOWER(?)' : ''}
        UNION
        SELECT DISTINCT student_name as name, student_class as class FROM statements ${search ? 'WHERE LOWER(student_name) LIKE LOWER(?) OR LOWER(student_class) LIKE LOWER(?)' : ''}
        LIMIT 10
    `;

    if (search) {
        params.push(`%${search}%`, `%${search}%`);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, students: rows });
    });
});

// POST /api/discipline/reports
router.post('/reports', (req, res) => {
    const { student_name, student_class, offence, description, staff_id, date_reported, action_taken } = req.body;
    db.run(
        `INSERT INTO discipline_reports (student_name, student_class, offence, description, staff_id, date_reported, action_taken) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [student_name, student_class, offence, description, staff_id, date_reported || new Date(), action_taken],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'report', action: 'create' });
            res.json({ success: true, reportId: this.lastID });
        }
    );
});

// GET /api/discipline/reports
router.get('/reports', (req, res) => {
    const { student_name } = req.query;
    let sql = `SELECT dr.*, u.full_name as staff_name 
            FROM discipline_reports dr
            LEFT JOIN users u ON dr.staff_id = u.id`;
    const params = [];

    if (student_name) {
        sql += ` WHERE LOWER(dr.student_name) LIKE LOWER(?)`;
        params.push(`%${student_name}%`);
    }

    sql += ` ORDER BY dr.date_reported DESC LIMIT 50`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, reports: rows });
    });
});

// GET /api/discipline/statements
router.get('/statements', (req, res) => {
    const { student_name } = req.query;
    let sql = `SELECT * FROM statements`;
    const params = [];
    if (student_name) {
        sql += ` WHERE LOWER(student_name) LIKE LOWER(?)`;
        params.push(`%${student_name}%`);
    }
    sql += ` ORDER BY incident_date DESC`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, statements: rows });
    });
});

// POST /api/discipline/statements
router.post('/statements', (req, res) => {
    const { student_name, student_class, incident_date, offence_type, punitive_measure, recorded_by, description } = req.body;
    db.run(
        `INSERT INTO statements (student_name, student_class, incident_date, offence_type, punitive_measure, recorded_by, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [student_name, student_class, incident_date, offence_type, punitive_measure, recorded_by, description],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'statement', action: 'create' });
            res.json({ success: true, statementId: this.lastID });
        }
    );
});

// STANDINGS ROUTES (NEW)

// POST /api/discipline/standings
router.post('/standings', (req, res) => {
    const { staff_id, week_start_date, hygiene_pct, discipline_pct, time_mgmt_pct, supervision_pct, dress_code_pct, church_order_pct, explanation } = req.body;

    db.run(`INSERT INTO standings (staff_id, week_start_date, hygiene_pct, discipline_pct, time_mgmt_pct, supervision_pct, dress_code_pct, church_order_pct, explanation) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [staff_id, week_start_date, hygiene_pct, discipline_pct, time_mgmt_pct, supervision_pct, dress_code_pct, church_order_pct, explanation],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'standings', action: 'create' });
            res.json({ success: true, id: this.lastID });
        });
});

// GET /api/discipline/standings
router.get('/standings', (req, res) => {
    db.all(`SELECT * FROM standings ORDER BY created_at DESC LIMIT 10`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, standings: rows });
    });
});

// WATCHLIST ROUTES

// GET /api/discipline/watchlist
router.get('/watchlist', (req, res) => {
    db.all(`SELECT w.*, u.full_name as recorder_name 
            FROM watchlist w 
            LEFT JOIN users u ON w.recorded_by = u.id 
            ORDER BY w.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, watchlist: rows });
    });
});

// POST /api/discipline/watchlist
router.post('/watchlist', (req, res) => {
    const { student_name, student_class, reason, recorded_by } = req.body;
    db.run(`INSERT INTO watchlist (student_name, student_class, reason, recorded_by) VALUES (?, ?, ?, ?)`,
        [student_name, student_class, reason, recorded_by],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'watchlist', action: 'create' });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE /api/discipline/watchlist/:id
router.delete('/watchlist/:id', (req, res) => {
    db.run(`DELETE FROM watchlist WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (req.io) req.io.emit('dashboard_update', { type: 'watchlist', action: 'delete' });
        res.json({ success: true });
    });
});

// IMPROVED STUDENTS ROUTES

// GET /api/discipline/improved
router.get('/improved', (req, res) => {
    db.all(`SELECT i.*, u.full_name as recorder_name 
            FROM improved_students i 
            LEFT JOIN users u ON i.recorded_by = u.id 
            ORDER BY i.created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, students: rows });
    });
});

// POST /api/discipline/improved
router.post('/improved', (req, res) => {
    const { student_name, student_class, improvement_notes, recorded_by } = req.body;
    db.run(`INSERT INTO improved_students (student_name, student_class, improvement_notes, recorded_by) VALUES (?, ?, ?, ?)`,
        [student_name, student_class, improvement_notes, recorded_by],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'improved', action: 'create' });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE /api/discipline/improved/:id
router.delete('/improved/:id', (req, res) => {
    db.run(`DELETE FROM improved_students WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (req.io) req.io.emit('dashboard_update', { type: 'improved', action: 'delete' });
        res.json({ success: true });
    });
});

module.exports = router;
