const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Seeding extra users...");

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)");

    // Principal
    stmt.run("principal", "pass123", "Principal", "Dr. Principal", "Main Office", "0770000001", (err) => {
        if (!err) console.log("Added Principal");
    });

    // Assistant Admin
    stmt.run("assist_dm", "pass123", "Assistant Discipline Master", "Mr. Assistant", "Discipline Office", "0770000002", (err) => {
        if (!err) console.log("Added Assistant Discipline Master");
    });

    // Regular Patron
    stmt.run("patron1", "pass123", "Patron", "Mr. Smith", "Unallocated", "0770000003", (err) => {
        if (!err) console.log("Added Regular Patron");
    });

    stmt.finalize(() => {
        console.log("Extra seeding complete.");
        db.close();
    });
});
