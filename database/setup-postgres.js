const { db, isPostgres } = require('./supabase');
const bcrypt = require('bcrypt');

console.log("🚀 Initializing database schema...");
console.log(`Database type: ${isPostgres ? 'PostgreSQL (Supabase)' : 'SQLite (Local)'}`);

async function setupDatabase() {
    try {
        // Auto-increment syntax differs between SQLite and PostgreSQL
        const autoInc = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

        // 1. Users Table
        await db.run(`CREATE TABLE IF NOT EXISTS users (
            id ${autoInc},
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            full_name TEXT NOT NULL,
            allocation TEXT,
            phone_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log("✅ Users table created");

        // 2. Students Table
        await db.run(`CREATE TABLE IF NOT EXISTS students (
            id ${autoInc},
            name TEXT NOT NULL,
            class TEXT NOT NULL,
            stream TEXT,
            gender TEXT NOT NULL
        )`);
        console.log("✅ Students table created");

        // 3. Tasks Table
        await db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id ${autoInc},
            title TEXT NOT NULL,
            description TEXT,
            assigned_by INTEGER NOT NULL,
            assigned_to INTEGER NOT NULL,
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed')),
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_by) REFERENCES users(id),
            FOREIGN KEY (assigned_to) REFERENCES users(id)
        )`);
        console.log("✅ Tasks table created");

        // 4. Announcements Table
        await db.run(`CREATE TABLE IF NOT EXISTS announcements (
            id ${autoInc},
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            posted_by INTEGER NOT NULL,
            visibility TEXT DEFAULT 'All',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (posted_by) REFERENCES users(id)
        )`);
        console.log("✅ Announcements table created");

        // 5. Discipline Reports
        await db.run(`CREATE TABLE IF NOT EXISTS discipline_reports (
            id ${autoInc},
            student_id INTEGER,
            student_name TEXT,
            offence TEXT NOT NULL,
            description TEXT,
            staff_id INTEGER NOT NULL,
            date_reported DATE DEFAULT CURRENT_TIMESTAMP,
            action_taken TEXT,
            FOREIGN KEY (staff_id) REFERENCES users(id)
        )`);
        console.log("✅ Discipline reports table created");

        // 6. Statements
        await db.run(`CREATE TABLE IF NOT EXISTS statements (
            id ${autoInc},
            student_id INTEGER,
            student_name TEXT NOT NULL,
            incident_date DATE NOT NULL,
            offence_type TEXT NOT NULL,
            description TEXT,
            punitive_measure TEXT,
            recorded_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recorded_by) REFERENCES users(id)
        )`);
        console.log("✅ Statements table created");

        // 7. Weekly Standings
        await db.run(`CREATE TABLE IF NOT EXISTS standings (
            id ${autoInc},
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (staff_id) REFERENCES users(id)
        )`);
        console.log("✅ Standings table created");

        // 8. Watchlist Students
        await db.run(`CREATE TABLE IF NOT EXISTS watchlist (
            id ${autoInc},
            student_name TEXT NOT NULL,
            student_class TEXT NOT NULL,
            reason TEXT,
            recorded_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recorded_by) REFERENCES users(id)
        )`);
        console.log("✅ Watchlist table created");

        // 9. Improved Students
        await db.run(`CREATE TABLE IF NOT EXISTS improved_students (
            id ${autoInc},
            student_name TEXT NOT NULL,
            student_class TEXT NOT NULL,
            improvement_notes TEXT,
            recorded_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recorded_by) REFERENCES users(id)
        )`);
        console.log("✅ Improved students table created");

        // Performance Indexes
        await db.run(`CREATE INDEX IF NOT EXISTS idx_students_name ON students(name)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_discipline_reports_name ON discipline_reports(student_name)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_statements_name ON statements(student_name)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_status ON tasks(assigned_to, status)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by_status ON tasks(assigned_by, status)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_discipline_reports_date ON discipline_reports(date_reported DESC)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_discipline_reports_staff ON discipline_reports(staff_id)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_statements_incident_date ON statements(incident_date DESC)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_statements_recorded_by ON statements(recorded_by)`);
        console.log("✅ Indexes created");

        // Seed Data Check
        const userCount = await db.get("SELECT count(*) as count FROM users");
        const count = parseInt(userCount.count);

        if (count === 0) {
            console.log("📝 Seeding default users...");

            const saltRounds = 10;
            const adminHash = await bcrypt.hash("admin123", saltRounds);
            const passHash = await bcrypt.hash("pass123", saltRounds);

            // Seed users
            await db.run("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
                ["admin", adminHash, "Director", "System Admin", "Administration", "0770000000"]);

            await db.run("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
                ["director", passHash, "Director", "School Director", "Administration", "0770000001"]);

            await db.run("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
                ["principal", passHash, "Principal", "School Principal", "Administration", "0770000002"]);

            await db.run("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
                ["dean", passHash, "Dean of Students", "Dean of Students", "Administration", "0770000003"]);

            await db.run("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
                ["headpatron", passHash, "Head Patron", "John Doe", "Boys Palar", "0770000004"]);

            await db.run("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
                ["matron1", passHash, "Matron", "Jane Smith", "Girls Palar", "0770000005"]);

            await db.run("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)",
                ["patron1", passHash, "Patron", "Bob Johnson", "General", "0770000006"]);

            console.log("✅ Seeding complete!");
        } else {
            console.log(`ℹ️  Database already seeded (${count} users found)`);
        }

        console.log("\n🎉 Database setup complete!");
        console.log("\n📋 Default credentials:");
        console.log("   Username: admin");
        console.log("   Password: admin123");
        console.log("\n⚠️  Please change the default password after first login!");

    } catch (error) {
        console.error("❌ Database setup failed:", error);
        throw error;
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log("\n✅ Setup script completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ Setup script failed:", error);
            process.exit(1);
        });
}

module.exports = { setupDatabase };
