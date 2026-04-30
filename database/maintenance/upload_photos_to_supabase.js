const { db, supabaseAdmin } = require('../supabase');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const photosDir = path.resolve(__dirname, '../public/img/PHOTO 2025-2026');
const bucketName = 'student-photos';

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

async function uploadAndSync() {
    if (!supabaseAdmin) {
        console.error("❌ Supabase Admin client not initialized. Check your SUPABASE_SERVICE_ROLE_KEY.");
        return;
    }

    console.log("🚀 Starting photo upload to Supabase Storage...");

    // 1. Ensure bucket exists and is public
    try {
        const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
        if (bucketError) throw bucketError;

        const bucketExists = buckets.find(b => b.name === bucketName);
        if (!bucketExists) {
            console.log(`📦 Creating public bucket: ${bucketName}`);
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
                fileSizeLimit: 52428800 // 50MB
            });
            if (createError) throw createError;
        } else {
            console.log(`📦 Updating bucket settings: ${bucketName}`);
            const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
                fileSizeLimit: 52428800 // 50MB
            });
            if (updateError) throw updateError;
        }
    } catch (err) {
        console.error("❌ Storage Initialization Error:", err.message);
        return;
    }

    // 2. Scan local photos
    const photoFiles = getAllFiles(photosDir);
    console.log(`📸 Found ${photoFiles.length} photos to process.`);

    let uploadCount = 0;
    let updateCount = 0;
    let skipCount = 0;

    for (const fullPath of photoFiles) {
        // Small delay to prevent pool starvation
        await new Promise(resolve => setTimeout(resolve, 150));

        const fileName = path.basename(fullPath);
        const name = fileName.replace(/\.[^/.]+$/, "").trim();
        
        // Relative path within photos dir for storage path organization
        const relativeStoragePath = fullPath.split('PHOTO 2025-2026')[1].replace(/\\/g, '/').substring(1); 
        
        try {
            const fileBuffer = fs.readFileSync(fullPath);
            
            // 3. Upload to Storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from(bucketName)
                .upload(relativeStoragePath, fileBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error(`❌ Failed to upload ${fileName}:`, uploadError.message);
                continue;
            }
            
            uploadCount++;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from(bucketName)
                .getPublicUrl(relativeStoragePath);

            // 5. Update Database
            await new Promise((resolve) => {
                db.run(
                    "UPDATE students SET picture_data = ? WHERE name = ?",
                    [publicUrl, name],
                    function(err) {
                        if (err) {
                            console.error(`❌ Failed to update DB for ${name}:`, err.message);
                        } else if (this.changes === 0) {
                            // console.warn(`⚠️  No student found in DB with name: ${name}`);
                            skipCount++;
                        } else {
                            updateCount++;
                        }
                        resolve();
                    }
                );
            });

            if (uploadCount % 20 === 0) {
                console.log(`⏳ Progress: ${uploadCount}/${photoFiles.length} uploaded...`);
            }

        } catch (err) {
            console.error(`💥 Error processing ${fileName}:`, err.message);
        }
    }

    console.log(`\n✨ Migration Summary:`);
    console.log(`✅ Uploaded: ${uploadCount} photos`);
    console.log(`✅ Updated: ${updateCount} student records`);
    if (skipCount > 0) console.log(`⚠️  Skipped: ${skipCount} photos (no matching student in DB)`);
    console.log(`🚀 Done! All student photos are now hosted online.`);
    
    // Exit after a small delay
    setTimeout(() => process.exit(0), 1000);
}

uploadAndSync();
