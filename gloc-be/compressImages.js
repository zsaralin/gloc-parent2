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

async function processOgTo100Images(baseDir) {
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(baseDir, entry.name);

            if (entry.isDirectory()) {
                await processOgTo100Images(entryPath); // Recurse into subfolders
            } else if (
                entry.isFile() &&
                /_og\.jpe?g$/i.test(entry.name)
            ) {
                const ext = path.extname(entry.name);
                const baseName = path.basename(entry.name, ext);
                const newName = baseName.replace(/_og$/, '_100') + ext;
                const outputPath = path.join(baseDir, newName);

                try {
                    const image = sharp(entryPath);
                    const metadata = await image.metadata();
                    const { width, height } = metadata;

                    console.log(`📸 Processing ${entry.name} (${width}x${height}) → ${newName}`);

                    await image
                        .resize({ width: 100, height: 100, fit: "inside" })
                        .toFile(outputPath);

                    console.log(`✅ Saved: ${outputPath}`);
                } catch (err) {
                    console.error(`⚠️ Error processing ${entryPath}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error("❌ Error traversing directory:", err.message);
    }
}


async function deleteMatchingFiles(baseDir) {
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(baseDir, entry.name);

            if (entry.isDirectory()) {
                await deleteMatchingFiles(entryPath); // Recurse into subdirectory
            } else if (
                entry.isFile() &&
                entry.name.toLowerCase().endsWith('_100.jpg')
            ) {
                console.log(`Deleting: ${entryPath}`);
                await fs.unlink(entryPath);
            }
        }
    } catch (err) {
        console.error(`Error processing ${baseDir}:`, err.message);
    }
}

async function processOgImages(baseDir) {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(baseDir, entry.name);

        if (entry.isDirectory()) {
            await processOgImages(entryPath);
        } else if (
            entry.isFile() &&
            /_og\.jpe?g$/i.test(entry.name)
        ) {
            try {
                const ext = path.extname(entry.name);
                const baseName = path.basename(entry.name, ext);
                const newName = baseName.replace(/_og$/, '') + ext;
                const outputPath = path.join(baseDir, newName);

                const image = sharp(entryPath);
                const metadata = await image.metadata();

                if (metadata.width > 800) {
                    console.log(`Resizing ${entry.name} to 800px -> ${newName}`);
                    await image
                        .resize(800)
                        .toFile(outputPath); // No compression applied
                } else {
                    console.log(`Copying as-is: ${entry.name} -> ${newName}`);
                    await fs.copyFile(entryPath, outputPath);
                }
            } catch (err) {
                console.error(`Error processing ${entryPath}:`, err.message);
            }
        }
    }
}


// Change this to the directory you want to process
const baseDirectory = "../db/";
processOgTo100Images(baseDirectory);
// Change this to your root directory
// const mainFolder = "../db/";
