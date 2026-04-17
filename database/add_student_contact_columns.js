const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Running migration: Adding contact columns to students table...");

db.serialize(() => {
    // Add parent_phone
    db.run("ALTER TABLE students ADD COLUMN parent_phone TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("parent_phone already exists.");
            } else {
                console.error("Error adding parent_phone:", err.message);
            }
        } else {
            console.log("Added parent_phone column.");
        }
    });

    // Add email
    db.run("ALTER TABLE students ADD COLUMN email TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("email already exists.");
            } else {
                console.error("Error adding email:", err.message);
            }
        } else {
            console.log("Added email column.");
        }
    });

    // Add picture_data
    db.run("ALTER TABLE students ADD COLUMN picture_data TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("picture_data already exists.");
            } else {
                console.error("Error adding picture_data:", err.message);
            }
        } else {
            console.log("Added picture_data column.");
        }
    });
}, () => {
    db.close();
    console.log("Migration finished.");
});
