const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Seeding QA and CIE...");

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)");

    stmt.run("qa_user", "pass123", "QA", "Quality Assurance", "Standards Dept", "0770000005");
    stmt.run("cie_user", "pass123", "CIE", "Chief Examiner", "Academics", "0770000006");

    stmt.finalize(() => {
        console.log("Seeding complete.");
        db.close();
    });
});
