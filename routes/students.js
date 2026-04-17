const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/students - Fetch all students
router.get('/', (req, res) => {
    db.all(`SELECT id, name, class, stream, gender, parent_phone, email, picture_data FROM students ORDER BY name ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, students: rows });
    });
});

// POST /api/students - Register a new student
router.post('/', (req, res) => {
    const { name, student_class, stream, gender, parent_phone, email, picture_data } = req.body;
    
    if (!name || !student_class) {
        return res.status(400).json({ success: false, error: 'Name and Class are required.' });
    }

    db.run(
        `INSERT INTO students (name, class, stream, gender, parent_phone, email, picture_data) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, student_class, stream || '', gender || '', parent_phone || '', email || '', picture_data || ''],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, id: this.lastID || 'postgres_inserted' });
        }
    );
});

// PUT /api/students/:id - Update an existing student
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, student_class, stream, gender, parent_phone, email, picture_data } = req.body;

    const sql = `UPDATE students SET name = ?, class = ?, stream = ?, gender = ?, parent_phone = ?, email = ?, picture_data = ? WHERE id = ?`;
    const params = [name, student_class, stream, gender, parent_phone, email, picture_data, id];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

// DELETE /api/students/:id - Delete a student
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM students WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
