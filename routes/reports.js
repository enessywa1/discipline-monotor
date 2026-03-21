const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const fs = require('fs');

const db = require('../database/db');
const path = require('path');

// Helper for Admin Check
const isAdmin = (user) => {
    if (!user || !user.role) return false;
    const adminRoles = ['developer', 'director', 'principal', 'associate principal', 'dean of students', 'discipline master', 'assistant discipline master', 'qa', 'cie', 'maintenance'];
    return adminRoles.includes(user.role.toLowerCase());
};

// GET /api/reports/detailed - Fetch detailed records for the Weekly Report view
router.get('/detailed', async (req, res) => {
    const user = req.session.user;
    const isUserAdmin = isAdmin(user);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateStr = oneWeekAgo.toISOString().split('T')[0];

    try {
        const fetchStatements = () => new Promise((resolve, reject) => {
            const sql = `SELECT s.id, s.student_name, s.student_class, s.offence_type, s.punitive_measure, s.incident_date, s.created_at, s.description, u.full_name as recorder_name 
                    FROM statements s
                    LEFT JOIN users u ON s.recorded_by = u.id
                    WHERE s.created_at >= ? 
                    ${!isUserAdmin && user ? 'AND s.recorded_by = ?' : ''}
                    ORDER BY s.incident_date DESC LIMIT 500`;
            const params = [dateStr];
            if (!isUserAdmin && user) params.push(user.id);

            db.all(sql, params, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchTasks = () => new Promise((resolve, reject) => {
            const sql = `SELECT t.*, u_to.full_name as assigned_to_name, u_by.full_name as assigned_by_name
                    FROM tasks t
                    LEFT JOIN users u_to ON t.assigned_to = u_to.id
                    LEFT JOIN users u_by ON t.assigned_by = u_by.id
                    WHERE t.created_at >= ?
                    ${!isUserAdmin && user ? 'AND (t.assigned_to = ? OR t.assigned_by = ?)' : ''}
                    ORDER BY t.created_at DESC`;
            const params = [dateStr];
            if (!isUserAdmin && user) params.push(user.id, user.id);

            db.all(sql, params, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchStandings = () => new Promise((resolve, reject) => {
            db.all(`SELECT st.id, st.week_start_date, st.discipline_pct, st.hygiene_pct, u.full_name as staff_name, u.role
                    FROM standings st
                    LEFT JOIN users u ON st.staff_id = u.id
                    WHERE u.role IN ('Patron', 'Matron', 'Head Patron', 'Head Matron', 'Pastor')
                    ORDER BY st.week_start_date DESC LIMIT 20`, [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchDisciplineReports = () => new Promise((resolve, reject) => {
            const sql = `SELECT dr.*, u.full_name as staff_name 
                    FROM discipline_reports dr
                    LEFT JOIN users u ON dr.staff_id = u.id
                    WHERE dr.date_reported >= ? 
                    ${!isUserAdmin && user ? 'AND dr.staff_id = ?' : ''}
                    ORDER BY dr.date_reported DESC`;
            const params = [dateStr];
            if (!isUserAdmin && user) params.push(user.id);

            db.all(sql, params, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const [statements, tasks, standings, disciplineReports] = await Promise.all([
            fetchStatements(),
            fetchTasks(),
            fetchStandings(),
            fetchDisciplineReports()
        ]);

        res.json({
            success: true,
            data: { statements, tasks, standings, disciplineReports }
        });
    } catch (err) {
        console.error("Reports API Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/reports/all-time - Fetch all-time records
router.get('/all-time', async (req, res) => {
    try {
        const fetchStatements = () => new Promise((resolve, reject) => {
            db.all(`SELECT s.id, s.student_name, s.student_class, s.offence_type, s.punitive_measure, s.incident_date, s.created_at, s.description, u.full_name as recorder_name 
                    FROM statements s
                    LEFT JOIN users u ON s.recorded_by = u.id
                    ORDER BY s.incident_date DESC`, [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchTasks = () => new Promise((resolve, reject) => {
            const sql = `SELECT t.*, u_to.full_name as assigned_to_name, u_by.full_name as assigned_by_name
                    FROM tasks t
                    LEFT JOIN users u_to ON t.assigned_to = u_to.id
                    LEFT JOIN users u_by ON t.assigned_by = u_by.id
                    ${!isAdmin(req.session.user) && req.session.user ? 'WHERE (t.assigned_to = ? OR t.assigned_by = ?)' : ''}
                    ORDER BY t.created_at DESC`;
            const params = [];
            if (!isAdmin(req.session.user) && req.session.user) params.push(req.session.user.id, req.session.user.id);

            db.all(sql, params, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchStandings = () => new Promise((resolve, reject) => {
            db.all(`SELECT st.id, st.week_start_date, st.discipline_pct, st.hygiene_pct, u.full_name as staff_name, u.role
                    FROM standings st
                    LEFT JOIN users u ON st.staff_id = u.id
                    WHERE u.role IN ('Patron', 'Matron', 'Head Patron', 'Head Matron', 'Pastor')
                    ORDER BY st.week_start_date DESC`, [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchDisciplineReports = () => new Promise((resolve, reject) => {
            db.all(`SELECT dr.*, u.full_name as staff_name 
                    FROM discipline_reports dr
                    LEFT JOIN users u ON dr.staff_id = u.id
                    ORDER BY dr.date_reported DESC`, [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const [statements, tasks, standings, disciplineReports] = await Promise.all([
            fetchStatements(),
            fetchTasks(),
            fetchStandings(),
            fetchDisciplineReports()
        ]);

        res.json({
            success: true,
            data: { statements, tasks, standings, disciplineReports }
        });
    } catch (err) {
        console.error("All-Time Reports API Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/reports/stats - Fetch aggregated stats for charts
router.get('/stats', async (req, res) => {
    try {
        const fetchOffences = () => new Promise((resolve, reject) => {
            db.all(`SELECT offence_type, COUNT(*) as count FROM statements GROUP BY offence_type`, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchTasks = () => new Promise((resolve, reject) => {
            const sql = `SELECT status, COUNT(*) as count FROM tasks 
                         ${!isAdmin(req.session.user) && req.session.user ? 'WHERE (assigned_to = ? OR assigned_by = ?)' : ''} 
                         GROUP BY status`;
            const params = [];
            if (!isAdmin(req.session.user) && req.session.user) params.push(req.session.user.id, req.session.user.id);
            db.all(sql, params, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchPerformance = () => new Promise((resolve, reject) => {
            db.all(`SELECT week_start_date, AVG(discipline_pct) as avg_disc, AVG(hygiene_pct) as avg_hyg FROM standings GROUP BY week_start_date ORDER BY week_start_date DESC LIMIT 4`, [], (err, rows) => {
                if (err) reject(err); else resolve(rows || []);
            });
        });

        const fetchTodayCases = () => new Promise((resolve, reject) => {
            const sql = db.isPostgres ? 
                `SELECT COUNT(*) as count FROM discipline_reports WHERE date_reported = CURRENT_DATE` :
                `SELECT COUNT(*) as count FROM discipline_reports WHERE DATE(date_reported) = DATE('now', 'localtime')`;
            db.get(sql, [], (err, row) => {
                if (err) reject(err); else resolve((row && row.count) ? row.count : 0);
            });
        });

        const [offences, tasks, performance, todayCases] = await Promise.all([
            fetchOffences(),
            fetchTasks(),
            fetchPerformance(),
            fetchTodayCases()
        ]);

        res.json({
            success: true,
            stats: { offences, tasks, performance, todayCases }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/export - Download full professional Excel report
router.get('/export', async (req, res) => {
    const wb = xlsx.utils.book_new();

    const fetchAll = (q) => new Promise((resolve, reject) => {
        db.all(q, (err, rows) => { if (err) reject(err); else resolve(rows); });
    });

    try {
        // 1. Discipline Statements
        const stmts = await fetchAll(`
            SELECT s.id, s.student_name as Student, s.student_class as Class, s.incident_date as Date, 
            s.offence_type as Offence, s.description as Details, 
            s.punitive_measure as Action, u.full_name as RecordedBy, s.created_at as Timestamp
            FROM statements s LEFT JOIN users u ON s.recorded_by = u.id`);
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(stmts), "Statements (Students)");

        // 2. Formal Discipline Reports
        const reports = await fetchAll(`
            SELECT dr.id, dr.student_name as Student, dr.student_class as Class, dr.offence as Offence, 
            dr.description as Details, dr.action_taken as Action, 
            u.full_name as StaffMember, dr.date_reported as Date
            FROM discipline_reports dr LEFT JOIN users u ON dr.staff_id = u.id`);
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(reports), "Formal Reports");

        // 3. Weekly Standings (Full Metrics)
        const standings = await fetchAll(`
            SELECT s.week_start_date as Week, u.full_name as Staff, u.role as Role, 
            s.hygiene_pct as Hygiene, s.discipline_pct as Discipline, 
            s.time_mgmt_pct as TimeMgmt, s.supervision_pct as Supervision,
            s.preps_pct as Preps, s.dress_code_pct as DressCode,
            s.church_order_pct as ChurchOrder, s.explanation as Comments
            FROM standings s JOIN users u ON s.staff_id = u.id`);
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(standings), "Performance Standings");

        let taskSql = `
            SELECT t.title as Task, t.description as Details, 
            u_by.full_name as AssignedBy, u_to.full_name as AssignedTo, 
            t.status as Status, t.due_date as DueDate, t.created_at as CreatedTimestamp
            FROM tasks t 
            LEFT JOIN users u_by ON t.assigned_by = u_by.id
            LEFT JOIN users u_to ON t.assigned_to = u_to.id`;
        const taskParams = [];
        if (!isAdmin(req.session.user) && req.session.user) {
            taskSql += ` WHERE (t.assigned_to = ? OR t.assigned_by = ?)`;
            taskParams.push(req.session.user.id, req.session.user.id);
        }
        const tasks = await new Promise((resolve, reject) => {
            db.all(taskSql, taskParams, (err, rows) => { if (err) reject(err); else resolve(rows); });
        });
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(tasks), "Task History");

        // 5. System Announcements
        const announcements = await fetchAll(`
            SELECT a.title as Title, a.content as Message, 
            u.full_name as Author, a.visibility as Visibility, a.created_at as PostedOn
            FROM announcements a LEFT JOIN users u ON a.posted_by = u.id`);
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(announcements), "Announcements Log");

        // 6. Staff & Student Directories
        const users = await fetchAll("SELECT full_name as Name, role as Role, allocation as Area, phone_number as Phone, username as Username FROM users");
        const students = await fetchAll("SELECT name as Name, class as Class, stream as Stream, gender as Gender FROM students");
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(users), "Staff Directory");
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(students), "Student Directory");

        // Write File
        const tempFilePath = path.join(__dirname, '../public/Comprehensive_System_Data.xlsx');
        xlsx.writeFile(wb, tempFilePath);

        res.download(tempFilePath, 'Comprehensive_System_Data.xlsx');
    } catch (err) {
        console.error("Export Error:", err);
        res.status(500).send("Error generating export");
    }
});

module.exports = router;
