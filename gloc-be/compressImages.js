const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

async function findAndCompressImages(baseDir) {
    try {
        const folders = await fs.readdir(baseDir, { withFileTypes: true });

        for (const folder of folders) {
            if (folder.isDirectory()) {
                const imagesFolder = path.join(baseDir, folder.name, "images");
                const imagePath = path.join(imagesFolder, "0.jpg");
                const compressedImagePath = path.join(imagesFolder, "0_comp.jpg");

                if (await fs.pathExists(imagePath)) {
                    console.log(`Compressing: ${imagePath}`);

                    await sharp(imagePath)
                        .resize(100) // Resize to approx. 1/2 of 800x800, change as needed
                        .jpeg({ quality: 75 }) // Compression setting (tweakable)
                        .toFile(compressedImagePath);

                    console.log(`Saved compressed image: ${compressedImagePath}`);
                }

                // Recursively check subfolders
                await findAndCompressImages(path.join(baseDir, folder.name));
            }
        }
    } catch (err) {
        console.error("Error processing images:", err);
    }
}

async function processLargeImages(baseDir) {
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(baseDir, entry.name);

            if (entry.isDirectory()) {
                if (!entry.name.endsWith("_comp")) {
                    // Check if this folder is an 'images' folder
                    if (entry.name === "images") {
                        const imageFiles = await fs.readdir(entryPath);

                        for (const file of imageFiles) {
                            const ext = path.extname(file).toLowerCase();
                            const baseName = path.basename(file, ext);

                            // Skip non-images and ones ending in _comp or _resized
                            if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;
                            if (baseName.endsWith("_comp") || baseName.endsWith("_resized")) continue;

                            const inputImagePath = path.join(entryPath, file);
                            const outputImagePath = path.join(entryPath, `${baseName}_resized.jpg`);

                            try {
                                const metadata = await sharp(inputImagePath).metadata();
                                const { width, height } = metadata;

                                if (width > 300 || height > 300) {
                                    console.log(`📸 Resizing large image: ${inputImagePath} (${width}x${height})`);

                                    await sharp(inputImagePath)
                                        .resize({ width: 300, height: 300, fit: "inside" })
                                        .jpeg({ quality: 80 })
                                        .toFile(outputImagePath);

                                    console.log(`✅ Saved resized image: ${outputImagePath}`);
                                }
                            } catch (err) {
                                console.error(`⚠️ Error processing image: ${inputImagePath}`, err);
                            }
                        }
                    }

                    // Recurse into subdirectories
                    await processLargeImages(entryPath);
                }
            }
        }
    } catch (err) {
        console.error("❌ Error traversing directory:", err);
    }
}

// Change this to your root directory
const mainFolder = "../db/";

// processLargeImages(mainFolder)
//     .then(() => console.log("✅ Done checking for large images!"))
//     .catch((err) => console.error("❌ Script failed:", err));

// // Start the compression process
// findAndCompressImages(mainFolder)
//     .then(() => console.log("✅ Image compression complete!"))
//     .catch((err) => console.error("❌ Error:", err));

async function renameSizedImages(baseDir) {
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(baseDir, entry.name);

            if (entry.isDirectory()) {
                if (!entry.name.endsWith("_comp")) {
                    // Check if this is an 'images' folder
                    if (entry.name === "images") {
                        const imageFiles = await fs.readdir(entryPath);

                        for (const file of imageFiles) {
                            const ext = path.extname(file).toLowerCase();
                            const baseName = path.basename(file, ext);

                            if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;

                            let newName = null;

                            if (baseName.endsWith("_resized")) {
                                newName = baseName.replace(/_resized$/, "_300") + ext;
                            } else if (baseName.endsWith("_comp")) {
                                newName = baseName.replace(/_comp$/, "_100") + ext;
                            }

                            if (newName) {
                                const oldPath = path.join(entryPath, file);
                                const newPath = path.join(entryPath, newName);
                                await fs.rename(oldPath, newPath);
                                console.log(`🔁 Renamed: ${file} → ${newName}`);
                            }
                        }
                    }

                    // Recurse into subdirectories
                    await renameSizedImages(entryPath);
                }
            }
        }
    } catch (err) {
        console.error("❌ Error traversing directory:", err);
    }
}

renameSizedImages(mainFolder)
    .then(() => console.log("✅ Done renaming images!"))
    .catch((err) => console.error("❌ Script failed:", err));