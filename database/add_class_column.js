const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Running migration: Adding student_class column...");

db.serialize(() => {
    // Add student_class to statements
    db.run("ALTER TABLE statements ADD COLUMN student_class TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("student_class already exists in statements table.");
            } else {
                console.error("Error adding student_class to statements:", err.message);
            }
        } else {
            console.log("Added student_class column to statements table.");
        }
    });

    // Add student_class to discipline_reports
    db.run("ALTER TABLE discipline_reports ADD COLUMN student_class TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("student_class already exists in discipline_reports table.");
            } else {
                console.error("Error adding student_class to discipline_reports:", err.message);
            }
        } else {
            console.log("Added student_class column to discipline_reports table.");
        }
    });
}, () => {
    db.close();
    console.log("Migration finished.");
});
