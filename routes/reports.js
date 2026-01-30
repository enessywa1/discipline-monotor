const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');

const db = require('../database/db');

// GET /api/reports/detailed - Fetch detailed records for the Weekly Report view
router.get('/detailed', async (req, res) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateStr = oneWeekAgo.toISOString().split('T')[0];

    try {
        const fetchStatements = () => new Promise((resolve, reject) => {
            db.all(`SELECT s.*, u.full_name as recorder_name 
                    FROM statements s 
                    LEFT JOIN users u ON s.recorded_by = u.id
                    WHERE s.created_at >= ? 
                    ORDER BY s.incident_date DESC`, [dateStr], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchTasks = () => new Promise((resolve, reject) => {
            db.all(`SELECT t.*, u_to.full_name as assigned_to_name, u_by.full_name as assigned_by_name
                    FROM tasks t
                    LEFT JOIN users u_to ON t.assigned_to = u_to.id
                    LEFT JOIN users u_by ON t.assigned_by = u_by.id
                    WHERE t.created_at >= ?
                    ORDER BY t.created_at DESC`, [dateStr], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchStandings = () => new Promise((resolve, reject) => {
            db.all(`SELECT st.*, u.full_name as staff_name, u.role
                    FROM standings st
                    LEFT JOIN users u ON st.staff_id = u.id
                    WHERE u.role IN ('Patron', 'Matron', 'Head Patron')
                    ORDER BY st.week_start_date DESC LIMIT 20`, [], (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchDisciplineReports = () => new Promise((resolve, reject) => {
            db.all(`SELECT dr.*, u.full_name as staff_name 
                    FROM discipline_reports dr
                    LEFT JOIN users u ON dr.staff_id = u.id
                    WHERE dr.date_reported >= ? 
                    ORDER BY dr.date_reported DESC`, [dateStr], (err, rows) => {
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

// GET /api/reports/stats - Fetch aggregated stats for charts
router.get('/stats', async (req, res) => {
    try {
        const fetchOffences = () => new Promise((resolve, reject) => {
            db.all(`SELECT offence_type, COUNT(*) as count FROM statements GROUP BY offence_type`, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchTasksCount = () => new Promise((resolve, reject) => {
            db.all(`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const fetchPerformance = () => new Promise((resolve, reject) => {
            // Fix for Postgres: Aggregate must be over a subquery if we want to limit first
            db.all(`SELECT avg(discipline_pct) as discipline, avg(hygiene_pct) as hygiene 
                    FROM (SELECT discipline_pct, hygiene_pct FROM standings ORDER BY week_start_date DESC LIMIT 5) as recent`, (err, rows) => {
                if (err) reject(err); else resolve(rows[0] || { discipline: 85, hygiene: 90 });
            });
        });

        const fetchTodayCases = () => new Promise((resolve, reject) => {
            db.get(`
                SELECT (
                    (SELECT COUNT(*) FROM statements WHERE created_at::date = CURRENT_DATE) +
                    (SELECT COUNT(*) FROM discipline_reports WHERE date_reported::date = CURRENT_DATE)
                ) as total`, (err, row) => {
                if (err) reject(err); else resolve(row ? row.total : 0);
            });
        });

        const [offences, tasks, performance, todayCases] = await Promise.all([
            fetchOffences(),
            fetchTasksCount(),
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
            SELECT s.id, s.student_name as Student, s.incident_date as Date, 
            s.offence_type as Offence, s.description as Details, 
            s.punitive_measure as Action, u.full_name as RecordedBy, s.created_at as Timestamp
            FROM statements s LEFT JOIN users u ON s.recorded_by = u.id`);
        xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(stmts), "Statements (Students)");

        // 2. Formal Discipline Reports
        const reports = await fetchAll(`
            SELECT dr.id, dr.student_name as Student, dr.offence as Offence, 
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

        // 4. Task Management History
        const tasks = await fetchAll(`
            SELECT t.title as Task, t.description as Details, 
            u_by.full_name as AssignedBy, u_to.full_name as AssignedTo, 
            t.status as Status, t.due_date as DueDate, t.created_at as CreatedTimestamp
            FROM tasks t 
            LEFT JOIN users u_by ON t.assigned_by = u_by.id
            LEFT JOIN users u_to ON t.assigned_to = u_to.id`);
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
