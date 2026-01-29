const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Seeding Director...");

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number) VALUES (?, ?, ?, ?, ?, ?)");

    // Director
    stmt.run("director", "pass123", "Director", "Mr. Director", "Board of Governors", "0770000004", (err) => {
        if (!err) console.log("Added Director");
        else console.log(err.message);
    });

    stmt.finalize(() => {
        console.log("Director seeding complete.");
        db.close();
    });
});
