const db = require('./db');

const up = () => {
    db.serialize(() => {
        db.run("ALTER TABLE notifications ADD COLUMN link TEXT", (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('Column "link" already exists in notifications table.');
                } else {
                    console.error('Error adding column "link":', err.message);
                }
            } else {
                console.log('Successfully added column "link" to notifications table.');
            }
        });
    });
};

up();
