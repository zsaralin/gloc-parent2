const fs = require('fs').promises;
const path = require('path');
const {image} = require("@tensorflow/tfjs-core");

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // ES6 array destructuring swap
    }
    return array;
}

async function getNameFromJsonFile(filePath) {
    try {
        const fileData = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(fileData);
        return jsonData.name;
    } catch (error) {
        return null; // If there's an error reading or parsing, return null
    }
}
async function readRandomImagesFromFolder(imagesFolder, dbName, limit = 100) {
    const imagePaths = [];
    const startTime = performance.now();  // Start timing for the whole function

    try {
        const dirStartTime = performance.now();
        console.log(`Opening directory: ${imagesFolder}`);

        const dir = await fs.opendir(imagesFolder);
        let selectedFolders = [];
        let countProcessed = 0;
        const maxToProcess = 500; // Process at most 500 entries for performance reasons

        for await (const entry of dir) {
            if (++countProcessed > maxToProcess && selectedFolders.length >= limit) break;

            if (entry.isDirectory()) {
                // Apply reservoir sampling logic
                if (selectedFolders.length < limit) {
                    selectedFolders.push(entry);
                } else {
                    const j = Math.floor(Math.random() * (countProcessed + 1));
                    if (j < limit) {
                        selectedFolders[j] = entry;
                    }
                }
            }
        }
        const dirEndTime = performance.now();
        console.log(`Directory reading and sampling time: ${dirEndTime - dirStartTime}ms`);

        const processingStartTime = performance.now();
        // Process each selected folder
        for (const folder of selectedFolders) {
            const folderName = folder.name;
            const imagesFolderPath = path.join(imagesFolder, folderName, 'images');
            const jsonFilePath = path.join(imagesFolder, folderName, `${folderName}.json`);

            try {
                // Read the images folder and get the first file
                const imagesDir = await fs.opendir(imagesFolderPath);
                let firstFile = null;
                for await (const imageFile of imagesDir) {
                    firstFile = imageFile.name;
                    break;
                }

                if (firstFile) {
                    const cropImagePath = path.join(imagesFolderPath, firstFile);

                    // Check if the crop image exists
                    console.log(`Checking existence of: ${cropImagePath}`);
                    await fs.access(cropImagePath);

                    // Read JSON data
                    console.log(`Reading JSON file: ${jsonFilePath}`);
                    const name = await getNameFromJsonFile(jsonFilePath) || folderName;

                    // Assuming `imagesFolder` is relative to the static directory
                    const publicCropImagePath = `/static/images/${dbName}/${folderName}/images/${firstFile}`;

                    // Push to imagePaths with random distance
                    imagePaths.push({
                        name: name,
                        distance: Math.floor(Math.random() * 21),
                        imagePath: [publicCropImagePath]
                    });
                } else {
                    console.log(`No files found in folder: ${imagesFolderPath}`);
                }
            } catch (error) {
                console.log(`Failed to process ${folderName}: ${error}`);
            }
        }
        const processingEndTime = performance.now();
        console.log(`Processing all selected folders time: ${processingEndTime - processingStartTime}ms`);
    } catch (error) {
        console.error(`Error reading directory: ${error.message}`);
    }

    const endTime = performance.now();  // End timing for the whole function
    console.log(`Total function execution time: ${endTime - startTime}ms`);
    return imagePaths;

}
module.exports = {
    readRandomImagesFromFolder
};

