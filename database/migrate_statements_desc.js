const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log("Migrating Statements table...");

db.serialize(() => {
    db.run("ALTER TABLE statements ADD COLUMN description TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'description' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Added 'description' column to 'statements' table.");
        }
    });

    db.close();
});
