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
    console.log("🚀 Starting student seeding from photos...");

    try {
        // 1. Clear existing students as requested ("remove them because i dont have their classes")
        console.log("🗑️ Clearing existing student records...");
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM students", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 2. Scan for photos
        const photoFiles = getAllFiles(photosDir);
        console.log(`📸 Found ${photoFiles.length} photos in ${photosDir}`);

        // 3. Insert each student
        for (const fullPath of photoFiles) {
            const fileName = path.basename(fullPath);
            const name = fileName.replace(/\.[^/.]+$/, "").trim(); // Remove extension and trim
            
            // Get relative path for the web (ensure forward slashes)
            // Example: img/PHOTO 2025-2026/Y12 PHOTO/Mukunzi Joyce.jpg
            const relativePath = 'img/PHOTO 2025-2026' + fullPath.split('PHOTO 2025-2026')[1].replace(/\\/g, '/');

            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO students (name, class, gender, picture_data) VALUES (?, ?, ?, ?)",
                    [name, 'Unassigned', 'N/A', relativePath],
                    (err) => {
                        if (err) {
                            console.error(`❌ Failed to insert ${name}:`, err.message);
                            resolve(); // Continue anyway
                        } else {
                            console.log(`✅ Seeded: ${name}`);
                            resolve();
                        }
                    }
                );
            });
        }

        console.log("✨ Seeding complete!");
    } catch (err) {
        console.error("💥 Critical Error during seeding:", err);
    } finally {
        if (typeof db.close === 'function') db.close();
        else if (typeof db.end === 'function') db.end(); // Postgres pool
    }
}

seed();
