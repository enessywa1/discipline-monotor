const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Initializing database...");

db.serialize(() => {
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        allocation TEXT,
        phone_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Students Table
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class TEXT NOT NULL,
        stream TEXT,
        gender TEXT NOT NULL
    )`);

    // 3. Tasks Table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        assigned_by INTEGER NOT NULL,
        assigned_to INTEGER NOT NULL,
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed')),
        due_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
    )`);

    // 4. Announcements Table
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        posted_by INTEGER NOT NULL,
        visibility TEXT DEFAULT 'All',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (posted_by) REFERENCES users(id)
    )`);

    // 5. Discipline Reports
    db.run(`CREATE TABLE IF NOT EXISTS discipline_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        student_name TEXT,
        offence TEXT NOT NULL,
        description TEXT,
        staff_id INTEGER NOT NULL,
        date_reported DATE DEFAULT CURRENT_TIMESTAMP,
        action_taken TEXT,
        FOREIGN KEY (staff_id) REFERENCES users(id)
    )`);

    // 6. Statements
    db.run(`CREATE TABLE IF NOT EXISTS statements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        student_name TEXT NOT NULL,
        incident_date DATE NOT NULL,
        offence_type TEXT NOT NULL,
        description TEXT,
        punitive_measure TEXT,
        recorded_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recorded_by) REFERENCES users(id)
    )`);

    // 7. Weekly Standings
    db.run(`CREATE TABLE IF NOT EXISTS standings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL,
        week_start_date DATE NOT NULL,
        hygiene_pct INTEGER,
        discipline_pct INTEGER,
        time_mgmt_pct INTEGER,
        supervision_pct INTEGER,
        preps_pct INTEGER,
        dress_code_pct INTEGER,
        church_order_pct INTEGER,
        explanation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES users(id)
    )`);

    // 8. Watchlist Students
    db.run(`CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        student_class TEXT NOT NULL,
        reason TEXT,
        recorded_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recorded_by) REFERENCES users(id)
    )`);

    // 9. Improved Students
    db.run(`CREATE TABLE IF NOT EXISTS improved_students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        student_class TEXT NOT NULL,
        improvement_notes TEXT,
        recorded_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recorded_by) REFERENCES users(id)
    )`);

    // Performance Indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_students_name ON students(name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_discipline_reports_name ON discipline_reports(student_name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_statements_name ON statements(student_name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

    // New Indexes for Optimization
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_status ON tasks(assigned_to, status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by_status ON tasks(assigned_by, status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_discipline_reports_date ON discipline_reports(date_reported DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_discipline_reports_staff ON discipline_reports(staff_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_statements_incident_date ON statements(incident_date DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_statements_recorded_by ON statements(recorded_by)`);

    // Seed Data Check
    db.get("SELECT count(*) as count FROM users", async (err, row) => {
        if (err) {
            console.error("Error checking users:", err);
            db.close();
            return;
        }

        if (row.count === 0) {
            console.log("Seeding default users...");

            try {
                // Hash passwords
                const saltRounds = 10;
                const adminHash = await bcrypt.hash("admin123", saltRounds);
                const passHash = await bcrypt.hash("pass123", saltRounds);

                const stmt = db.prepare("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)");

                stmt.run("admin", adminHash, "Discipline Master", "Mr. Discipline Lead", "Administration", "0770000000");
                stmt.run("headpatron", passHash, "Head Patron", "John Doe", "Boys Palar", "0770000000");
                stmt.run("matron1", passHash, "Matron", "Jane Smith", "Girls Palar", "0770000000");

                stmt.finalize(() => {
                    console.log("Seeding complete.");
                    db.close();
                });
            } catch (hashErr) {
                console.error("Error hashing passwords:", hashErr);
                db.close();
            }
        } else {
            console.log("Database already seeded.");
            db.close();
        }
    });
});
