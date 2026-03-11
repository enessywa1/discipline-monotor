const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = require('../database/db');

// Middleware to parse body is already in server.js

// Helper for Admin Check
const isAdmin = (user) => {
    if (!user || !user.role) return false;
    const adminRoles = ['developer', 'director', 'principal', 'associate principal', 'dean of students', 'discipline master', 'assistant discipline master', 'qa', 'cie', 'maintenance'];
    return adminRoles.includes(user.role.toLowerCase());
};

// GET /api/tasks - List tasks
// Query params: userId (optional filter), type ('assigned_to' or 'assigned_by')
router.get('/', (req, res) => {
    const user = req.session.user;
    const isUserAdmin = isAdmin(user);
    const { userId, type } = req.query;
    let sql = `
        SELECT t.*, 
        assigner.full_name as assigner_name, 
        assignee.full_name as assignee_name 
        FROM tasks t
        JOIN users assigner ON t.assigned_by = assigner.id
        JOIN users assignee ON t.assigned_to = assignee.id
    `;

    const conditions = [];
    const params = [];

    if (userId && type) {
        if (type === 'assigned_to') {
            conditions.push(`t.assigned_to = ?`);
            params.push(userId);
        } else if (type === 'assigned_by') {
            conditions.push(`t.assigned_by = ?`);
            params.push(userId);
        }
    }

    // If not admin, restrict to tasks they are involved in
    if (!isUserAdmin && user) {
        conditions.push(`(t.assigned_to = ? OR t.assigned_by = ?)`);
        params.push(user.id, user.id);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY t.created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, tasks: rows });
    });
});

// POST /api/tasks - Create a task
router.post('/', (req, res) => {
    const user = req.session.user;
    if (!isAdmin(user)) {
        return res.status(403).json({ error: "Only administrators can assign tasks" });
    }
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
    const user = req.session.user;
    const isUserAdmin = isAdmin(user);

    // Get the task first to check ownership
    db.get('SELECT assigned_to, assigned_by FROM tasks WHERE id = ?', [id], (err, task) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!task) return res.status(404).json({ error: "Task not found" });

        // Only the assignee can update status (Admins can also update)
        if (!isUserAdmin && (!user || task.assigned_to !== user.id)) {
            return res.status(403).json({ error: "You can only update tasks assigned to you" });
        }

        db.run(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (req.io) req.io.emit('dashboard_update', { type: 'task', action: 'update' });
            res.json({ success: true, changes: this.changes });
        });
    });
});

module.exports = router;
