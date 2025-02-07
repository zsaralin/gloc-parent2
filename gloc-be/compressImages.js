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

// Get the folder path from command line arguments
const mainFolder = '../db/'
// Start the compression process
findAndCompressImages(mainFolder)
    .then(() => console.log("✅ Image compression complete!"))
    .catch((err) => console.error("❌ Error:", err));
