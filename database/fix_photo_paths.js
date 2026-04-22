const db = require('./db');
const fs = require('fs');
const path = require('path');

async function fixPaths() {
    console.log("🛠️  Starting robust photo path fix...");

    try {
        const students = await new Promise((resolve, reject) => {
            db.all("SELECT id, name, picture_data FROM students", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log(`📊 Found ${students.length} students to check.`);

        let fixCount = 0;
        let skipCount = 0;

        for (const s of students) {
            // Skip base64 data
            if (s.picture_data && s.picture_data.startsWith('data:image')) {
                skipCount++;
                continue;
            }

            let currentPath = s.picture_data || '';
            let fileName = '';

            if (currentPath.includes('supabase.co')) {
                fileName = currentPath.split('/').pop();
            } else if (currentPath.startsWith('img/')) {
                fileName = currentPath.split('/').pop();
            } else if (!currentPath && s.name) {
                fileName = `${s.name}.jpg`;
            } else {
                skipCount++;
                continue;
            }

            // Cleanup filename (decode and handle double encoding)
            try {
                fileName = decodeURIComponent(fileName);
                if (fileName.includes('%')) fileName = decodeURIComponent(fileName);
            } catch (e) {
                // Ignore decoding errors
            }

            // Possible local paths
            const possiblePaths = [
                `img/PHOTO 2025-2026/${fileName}`,
                `img/${fileName}`
            ];

            let foundPath = null;
            for (const p of possiblePaths) {
                const fullPath = path.join(__dirname, '../public', p);
                if (fs.existsSync(fullPath)) {
                    foundPath = p;
                    break;
                }
            }

            // If found a valid local path that is different from current, update it
            if (foundPath && foundPath !== currentPath) {
                await new Promise((resolve) => {
                    db.run("UPDATE students SET picture_data = ? WHERE id = ?", [foundPath, s.id], (err) => {
                        if (err) console.error(`❌ Failed to fix ${s.name}:`, err.message);
                        else {
                            console.log(`✅ Fixed ${s.name}: ${currentPath} -> ${foundPath}`);
                            fixCount++;
                        }
                        resolve();
                    });
                });
            } else {
                skipCount++;
            }
        }

        console.log(`\n✨ Fix complete!`);
        console.log(`✅ Updated: ${fixCount}`);
        console.log(`⏭️  Skipped/Correct: ${skipCount}`);
        
    } catch (err) {
        console.error("💥 Error during path fix:", err);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

fixPaths();
