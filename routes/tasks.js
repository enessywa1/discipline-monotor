const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = require('../database/db');

// Middleware to parse body is already in server.js

// GET /api/tasks - List tasks
// Query params: userId (optional filter), type ('assigned_to' or 'assigned_by')
router.get('/', (req, res) => {
    const { userId, type } = req.query;
    let sql = `
        SELECT t.*, 
        assigner.full_name as assigner_name, 
        assignee.full_name as assignee_name 
        FROM tasks t
        JOIN users assigner ON t.assigned_by = assigner.id
        JOIN users assignee ON t.assigned_to = assignee.id
    `;

    const params = [];

    if (userId && type) {
        if (type === 'assigned_to') {
            sql += ` WHERE t.assigned_to = ?`;
            params.push(userId);
        } else if (type === 'assigned_by') {
            sql += ` WHERE t.assigned_by = ?`;
            params.push(userId);
        }
    }

    sql += ` ORDER BY t.created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, tasks: rows });
    });
});

// POST /api/tasks - Create a task
router.post('/', (req, res) => {
    const { title, description, assigned_by, assigned_to, due_date } = req.body;

    if (!title || !assigned_by || !assigned_to) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO tasks (title, description, assigned_by, assigned_to, due_date) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [title, description, assigned_by, assigned_to, due_date], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (req.io) req.io.emit('dashboard_update', { type: 'task', action: 'create' });
        res.json({ success: true, taskId: this.lastID });
    });
});

// PUT /api/tasks/:id/status - Update Status
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    db.run(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (req.io) req.io.emit('dashboard_update', { type: 'task', action: 'update' });
        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;
