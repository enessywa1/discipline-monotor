const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = require('../database/db');

// GET /api/notifications?user_id=X&role=Y
router.get('/', (req, res) => {
    const { user_id, role } = req.query;

    const notifications = [];

    db.serialize(() => {
        // 1. New Tasks Assigned to User (Pending)
        db.all(`SELECT id, title, created_at, 'task' as type FROM tasks 
                WHERE assigned_to = ? AND status = 'Pending' 
                ORDER BY created_at DESC`, [user_id], (err, tasks) => {

            if (!err && tasks) {
                tasks.forEach(t => notifications.push({
                    message: `New Task Assigned: ${t.title}`,
                    date: t.created_at,
                    link: '#tasks',
                    type: 'task'
                }));
            }

            // 2. Recent Announcements (Last 7 days)
            // If posted_by != user_id
            let annSql = `SELECT id, title, created_at, 'announcement' as type FROM announcements 
                          WHERE posted_by != ? AND created_at >= date('now', '-7 days')`;

            // Logic for 'Staff' vs 'All' visibility could be refined here, but simplified:
            // If role is staff, see 'Staff' and 'All'. 

            db.all(annSql, [user_id], (err, anns) => {
                if (!err && anns) {
                    anns.forEach(a => notifications.push({
                        message: `New Announcement: ${a.title}`,
                        date: a.created_at,
                        link: '#announcements',
                        type: 'info'
                    }));
                }

                // Sort by date desc
                notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

                res.json({ success: true, notifications });
            });
        });
    });
});

module.exports = router;
