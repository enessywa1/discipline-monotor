const express = require('express');
const router = express.Router();
const db = require('../database/db');

const MAX_IMPORT_ROWS = 500;

// Helper for Admin Check
const isAdmin = (user) => {
    if (!user || !user.role) return false;
    const adminRoles = ['developer', 'director', 'principal', 'associate principal', 'dean of students', 'discipline master', 'assistant discipline master', 'qa', 'cie', 'maintenance'];
    return adminRoles.includes(user.role.toLowerCase());
};

// GET /api/detentions
router.get('/', (req, res) => {
    const { student_name, sort_by, status } = req.query;
    const user = req.session.user;
    const isUserAdmin = isAdmin(user);

    let sql = `SELECT d.*, u.full_name as recorder_name, st.picture_data 
               FROM detentions d 
               LEFT JOIN users u ON d.recorded_by = u.id
               LEFT JOIN students st ON LOWER(d.student_name) = LOWER(st.name)`;
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

    if (!isUserAdmin && user) {
        conditions.push(`d.recorded_by = ?`);
        params.push(user.id);
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
    const user = req.session.user;

    // Block Teachers from clearing detentions
    if (user && user.role && user.role.toLowerCase() === 'teacher') {
        return res.status(403).json({ error: 'Teachers are not authorized to clear detentions' });
    }

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

router.post('/import', (req, res) => {
    const user = req.session.user;
    if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'Please sign in before importing detention records.' });
    }

    const rows = req.body && req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, error: 'The spreadsheet has no detention rows to import.' });
    }
    if (rows.length > MAX_IMPORT_ROWS) {
        return res.status(400).json({ success: false, error: `Import no more than ${MAX_IMPORT_ROWS} detention records at a time.` });
    }

    const records = [];
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const rowNumber = index + 2;
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            return res.status(400).json({ success: false, error: `Row ${rowNumber} is not a valid record.` });
        }

        const studentName = typeof row.student_name === 'string' ? row.student_name.trim() : '';
        const studentClass = typeof row.student_class === 'string' ? row.student_class.trim() : '';
        const offense = typeof row.offense === 'string' ? row.offense.trim() : '';
        const detentionDate = typeof row.detention_date === 'string' ? row.detention_date.trim() : '';
        const remarks = typeof row.remarks === 'string' ? row.remarks.trim() : '';
        const days = Number(row.days);
        const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(detentionDate);
        const parsedDate = dateParts
            ? new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])))
            : null;
        const validDate = parsedDate &&
            parsedDate.getUTCFullYear() === Number(dateParts[1]) &&
            parsedDate.getUTCMonth() === Number(dateParts[2]) - 1 &&
            parsedDate.getUTCDate() === Number(dateParts[3]);

        if (!studentName || !studentClass || !offense || !dateParts || !validDate ||
            !Number.isInteger(days) || days < 1 || days > 365 ||
            studentName.length > 150 || studentClass.length > 100 ||
            offense.length > 500 || remarks.length > 2000) {
            return res.status(400).json({
                success: false,
                error: `Row ${rowNumber} has missing or invalid values. Check student name, class, offense, date (YYYY-MM-DD), and days (1-365).`
            });
        }

        records.push({ studentName, studentClass, offense, detentionDate, remarks, days });
    }

    const placeholders = records.map(() => "(?, ?, ?, NULL, ?, 'Standard', ?, ?, ?, 'Uncleared')").join(', ');
    const params = records.flatMap((record) => [
        record.studentName,
        record.studentClass,
        record.offense,
        record.detentionDate,
        record.remarks,
        user.id,
        record.days
    ]);

    db.run(
        `INSERT INTO detentions (student_name, student_class, offense, incident_id, detention_date, detention_type, remarks, recorded_by, days, status) VALUES ${placeholders}`,
        params,
        (err) => {
            if (err) {
                console.error('❌ Detention Import Error:', err.message);
                return res.status(500).json({ success: false, error: 'The detention records could not be imported.' });
            }
            if (req.io) req.io.emit('dashboard_update', { type: 'detention', action: 'create' });
            return res.json({ success: true, imported: records.length });
        }
    );
});

module.exports = router;
