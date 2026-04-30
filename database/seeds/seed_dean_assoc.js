const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Seeding Dean and Assoc Principal...");

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)");

    stmt.run("dean", "pass123", "Dean of Students", "Mr. Dean", "Student Affairs", "0770000007");
    stmt.run("assoc_principal", "pass123", "Associate Principal", "Mrs. Associate", "Administration", "0770000008");

    stmt.finalize(() => {
        console.log("Seeding complete.");
        db.close();
    });
});
