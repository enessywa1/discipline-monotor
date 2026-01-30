const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');

const db = require('../database/db');

// GET /api/users - List users
router.get('/', (req, res) => {
    db.all(`SELECT id, username, role, full_name, allocation, phone_number, created_at FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, users: rows });
    });
});

// POST /api/users - Create new user (Admin only)
router.post('/', async (req, res) => {
    const { username, password, role, full_name, allocation, phone_number } = req.body;

    try {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        db.run(`INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, password_hash, role, full_name, allocation, phone_number],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Username already exists" });
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, id: this.lastID });
            }
        );
    } catch (err) {
        res.status(500).json({ error: "Encryption error" });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, role, full_name, allocation, phone_number } = req.body;

    try {
        let sql, params;
        if (password && password.trim() !== '') {
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);
            sql = `UPDATE users SET username = ?, password_hash = ?, role = ?, full_name = ?, allocation = ?, phone_number = ? WHERE id = ?`;
            params = [username, password_hash, role, full_name, allocation, phone_number, id];
        } else {
            sql = `UPDATE users SET username = ?, role = ?, full_name = ?, allocation = ?, phone_number = ? WHERE id = ?`;
            params = [username, role, full_name, allocation, phone_number, id];
        }

        db.run(sql, params, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Username already exists" });
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        });
    } catch (err) {
        res.status(500).json({ error: "Encryption error" });
    }
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

router.get('/log/activity', (req, res) => {
    const sql = `
        SELECT full_name, role FROM users 
        WHERE last_login::date = CURRENT_DATE
        ORDER BY last_login DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Activity Log Error:", err);
            return res.json({ success: false, active: [] });
        }
        res.json({ success: true, active: rows });
    });
});

module.exports = router;
