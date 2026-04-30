const db = require('./db');
const path = require('path');
const fs = require('fs');

const photosDir = path.resolve(__dirname, '../public/img/PHOTO 2025-2026');

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.match(/\.(jpg|jpeg|png)$/i)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

async function seed() {
    console.log("🚀 [RE-SEED] Starting student seeding from photos...");

    try {
        // 1. Force Clear existing students
        console.log("🗑️  Forcing clear of existing student records...");
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM students", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Verify clear
        const countBefore = await new Promise((resolve) => {
            db.get("SELECT COUNT(*) as count FROM students", [], (err, row) => resolve(row ? row.count : 0));
        });
        console.log(`📊 Count after deletion: ${countBefore}`);

        // 2. Scan for photos
        const photoFiles = getAllFiles(photosDir);
        console.log(`📸 Found ${photoFiles.length} photos in ${photosDir}`);

        // 3. Insert each student
        let successCount = 0;
        for (const fullPath of photoFiles) {
            const fileName = path.basename(fullPath);
            const name = fileName.replace(/\.[^/.]+$/, "").trim();
            
            // RELATIVE PATH for web server
            // Ensure we use forward slashes for the web, even on Windows if applicable
            const relativePath = 'img/PHOTO 2025-2026' + fullPath.split('PHOTO 2025-2026')[1].replace(/\\/g, '/');

            await new Promise((resolve) => {
                db.run(
                    "INSERT INTO students (name, class, gender, picture_data) VALUES (?, ?, ?, ?)",
                    [name, 'Unassigned', 'N/A', relativePath],
                    (err) => {
                        if (err) {
                            console.error(`❌ Failed to insert ${name}:`, err.message);
                        } else {
                            successCount++;
                        }
                        resolve();
                    }
                );
            });
        }

        console.log(`✨ Seeding complete! Successfully inserted ${successCount} out of ${photoFiles.length} students.`);
        
        // Final verification
        const finalCheck = await new Promise((resolve) => {
            db.all("SELECT name, picture_data FROM students LIMIT 3", [], (err, rows) => resolve(rows));
        });
        console.log("🔍 Final Verification Samples:", JSON.stringify(finalCheck, null, 2));

    } catch (err) {
        console.error("💥 Critical Error during seeding:", err);
    } finally {
        // We don't close the DB here because it might be shared or the pool might be needed elsewhere in some environments
        // but for a standalone script we should. However, since db.js might be a singleton...
        setTimeout(() => process.exit(0), 1000); 
    }
}

seed();
