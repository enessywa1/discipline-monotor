const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'school_discipline.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening shared database: ' + err.message);
    } else {
        console.log('Centralized database connection established.');
        // Enable WAL mode for better concurrency
        db.run("PRAGMA journal_mode = WAL");
    }
});

module.exports = db;
