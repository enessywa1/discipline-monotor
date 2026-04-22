#!/bin/bash

# Directory containing the photos
PHOTO_DIR="PHOTO 2025-2026"

if [ ! -d "$PHOTO_DIR" ]; then
    echo "❌ Error: Directory '$PHOTO_DIR' not found."
    exit 1
fi

echo "🚀 Starting compression for images in $PHOTO_DIR..."
echo "📊 Current size: $(du -sh "$PHOTO_DIR" | cut -f1)"

# Find all jpg/jpeg/png files and process them
# -Z 500: Resizes the image so that neither its width nor its height exceeds 500 pixels.
# -s formatOptions 80: Sets JPEG quality to 80%

find "$PHOTO_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r img; do
    sips -Z 500 -s formatOptions 80 "$img" &> /dev/null
done

echo "✅ Compression complete!"
echo "📊 New size: $(du -sh "$PHOTO_DIR" | cut -f1)"
