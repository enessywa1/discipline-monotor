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

const { supabaseAdmin } = require('../database/supabase');

// POST /api/users - Create new user (Admin only)
router.post('/', async (req, res) => {
    const { username, password, role, full_name, allocation, phone_number, email } = req.body;

    try {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // 1. Create in Local DB
        db.run(`INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, password_hash, role, full_name, allocation, phone_number],
            async function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Username already exists" });
                    return res.status(500).json({ error: err.message });
                }
                const lastID = this.lastID;

                // 2. Sync to Supabase Auth if available
                if (supabaseAdmin) {
                    try {
                        const userEmail = email || `${username}@system.local`;
                        const { data, error } = await supabaseAdmin.auth.admin.createUser({
                            email: userEmail,
                            password: password,
                            email_confirm: true,
                            user_metadata: { username, full_name, role }
                        });
                        if (data && data.user) {
                            await db.run('UPDATE users SET supabase_id = ? WHERE id = ?', [data.user.id, lastID]);
                        }
                    } catch (supaErr) {
                        console.error("⚠️ Supabase Sync Error (Creation):", supaErr.message);
                    }
                }

                res.json({ success: true, id: lastID });
            }
        );
    } catch (err) {
        res.status(500).json({ error: "Encryption error" });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, role, full_name, allocation, phone_number, email } = req.body;

    try {
        let sql, params;
        const saltRounds = 10;

        // 1. Prepare Local DB Update
        if (password && password.trim() !== '') {
            const password_hash = await bcrypt.hash(password, saltRounds);
            sql = `UPDATE users SET username = ?, password_hash = ?, role = ?, full_name = ?, allocation = ?, phone_number = ? WHERE id = ?`;
            params = [username, password_hash, role, full_name, allocation, phone_number, id];
        } else {
            sql = `UPDATE users SET username = ?, role = ?, full_name = ?, allocation = ?, phone_number = ? WHERE id = ?`;
            params = [username, role, full_name, allocation, phone_number, id];
        }

        // 2. Fetch supabase_id for sync
        db.get('SELECT supabase_id FROM users WHERE id = ?', [id], async (err, user) => {
            if (user && user.supabase_id && supabaseAdmin) {
                try {
                    const updateData = {
                        user_metadata: { username, full_name, role }
                    };
                    if (password && password.trim() !== '') {
                        updateData.password = password;
                    }
                    if (email) {
                        updateData.email = email;
                    }
                    await supabaseAdmin.auth.admin.updateUserById(user.supabase_id, updateData);
                } catch (supaErr) {
                    console.error("⚠️ Supabase Sync Error (Update):", supaErr.message);
                }
            }

            // 3. Update Local DB
            db.run(sql, params, function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Username already exists" });
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
            });
        });
    } catch (err) {
        res.status(500).json({ error: "Encryption error" });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Get supabase_id first
    db.get('SELECT supabase_id FROM users WHERE id = ?', [id], async (err, user) => {
        if (user && user.supabase_id && supabaseAdmin) {
            try {
                await supabaseAdmin.auth.admin.deleteUser(user.supabase_id);
            } catch (supaErr) {
                console.error("⚠️ Supabase Sync Error (Deletion):", supaErr.message);
            }
        }

        db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

router.get('/log/activity', (req, res) => {
    // Standardize query to work with both SQLite and Postgres
    const sql = `
        SELECT full_name, role FROM users 
        WHERE last_login IS NOT NULL 
        AND (
            (DATE(last_login) = DATE('now')) -- SQLite
            OR 
            (last_login::date = CURRENT_DATE) -- Postgres
        )
        ORDER BY last_login DESC
    `;

    // However, since we have isPostgres available in db, let's be more precise
    const actualSql = db.isPostgres ?
        `SELECT full_name, role FROM users WHERE last_login::date = CURRENT_DATE ORDER BY last_login DESC` :
        `SELECT full_name, role FROM users WHERE DATE(last_login) = DATE('now') ORDER BY last_login DESC`;

    db.all(actualSql, [], (err, rows) => {
        if (err) {
            console.error("❌ Activity Log API Error:", err);
            return res.status(500).json({ success: false, error: "Database error fetching activity log" });
        }
        res.json({ success: true, active: rows || [] });
    });
});

module.exports = router;
