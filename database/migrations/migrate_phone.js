const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath);

console.log('Running migration: Add phone_number to users table...');

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN phone_number TEXT", (err) => {
        if (err) {
            console.log('Column likely exists or error:', err.message);
        } else {
            console.log('Column phone_number added successfully.');
        }

        // Update valid seed data with dummy phones if needed
        db.run("UPDATE users SET phone_number = '0770000000' WHERE phone_number IS NULL");
    });
});

db.close();
