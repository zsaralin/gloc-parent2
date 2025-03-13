const fs = require('fs').promises
const faceapi = require('face-api.js');
const MAX_DISTANCE = 1.2385318850506823
const MinHeap = require("./minHeap");
let cachedData = null;
const { getDbName } = require('./db.js');
const {createOrUpdateScores, getSortedLabelsByUserID} = require("./scores");
const path = require('path');
const FastPriorityQueue = require('fastpriorityqueue'); // Import FastPriorityQueue

let dbName = getDbName();
loadDataIntoMemory();

// cache the JSON file in memory
async function loadDataIntoMemory() {
    dbName = getDbName();
    try {
        const rawData = await fs.readFile(`./descriptors/descriptors_${dbName}_old.json`, 'utf8');
        cachedData = JSON.parse(rawData);

    } catch (error) {
        console.error('Error loading data into memory:', error);
    }
}
async function findNearestDescriptors(targetDescriptor, numMatches, userId) {
    try {
        if (!targetDescriptor || !cachedData) return null;

        const pq = new FastPriorityQueue((a, b) => a.distance < b.distance); // Min-Heap: closest first

        // Convert target descriptor to array once for efficiency
        const targetArray = Array.from(targetDescriptor);
        const dimensionSize = targetArray.length;
        const normalizationFactor = Math.sqrt(dimensionSize); // Adjust for Manhattan Distance

        for (const label of Object.keys(cachedData)) {
            const descriptors = cachedData[label].descriptors;
            if (!descriptors || descriptors.length === 0) continue;

            let distance;
            if (descriptors.length === 1) {
                // Compute normalized Manhattan distance
                distance = targetArray.reduce((acc, val, i) => acc + Math.abs(val - descriptors[0][i]), 0) / normalizationFactor;
            } else {
                // Compute average normalized Manhattan distance
                distance = descriptors.reduce((total, desc) =>
                    total + targetArray.reduce((acc, val, i) => acc + Math.abs(val - desc[i]), 0), 0) / descriptors.length / normalizationFactor;
            }

            pq.add({ label, distance });
        }

        // Extract the top N nearest descriptors
        const topNDescriptors = [];
        for (let i = 0; i < numMatches && !pq.isEmpty(); i++) {
            topNDescriptors.push(pq.poll());
        }
        
        // Normalize distances
        const normalizedDescriptors = topNDescriptors.map((item) => ({
            label: item.label,
            normalizedDistance: (1-item.distance)*100, // Keeps it in the 0-1 range
        }));

        // await createOrUpdateScores(userId, normalizedDescriptors);

        return normalizedDescriptors; // Closest first
    } catch (error) {
        console.error("Error processing descriptors:", error);
        throw error;
    }
}


// max distance between two descriptors, only run with new dataset
async function calculateMaxPossibleDistance() {
    const dbName = getDbName();

    const data = await fs.readFile(`./descriptors/descriptors_${dbName}.json`, 'utf8');
    const descriptorList = JSON.parse(data);
    let maxDistance = 0;

    for (let i = 0; i < descriptorList.length; i++) {

        const descriptor1 = descriptorList[i].descriptors;

        for (let j = i + 1; j < descriptorList.length; j++) {
            const descriptor2 = descriptorList[j].descriptors;

            const distance = faceapi.euclideanDistance(descriptor1, descriptor2);

            if (distance > maxDistance) {
                maxDistance = distance;
            }
        }
    }
    return maxDistance;
}


async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

async function getNameFromJsonFile(filePath, defaultLabel) {
    const exists = await fileExists(filePath);
    if (exists) {
        try {
            const fileData = await fs.readFile(filePath, 'utf8');
            const jsonData = JSON.parse(fileData);
            return jsonData.name || defaultLabel;
        } catch (error) {
            console.error('Error reading or parsing JSON:', error);
            return defaultLabel;
        }
    } else {
        return defaultLabel;
    }
}
async function processNearestDescriptors(nearestDescriptors, localFolderPath) {
    const labels = [];
    
    // Use `Promise.all` to parallelize descriptor processing
    const imagePathPromises = nearestDescriptors.map(async nearestDescriptor => {
        const { label, normalizedDistance } = nearestDescriptor;
        const imagesFolderPath = path.join(localFolderPath, dbName, label, 'images');
        const jsonFilePath = path.join(localFolderPath, dbName, label, 'info.json');

        // Start async file existence check early
        const jsonExists = await fileExists(jsonFilePath);
        if (!jsonExists) return null;

        // Read JSON file in parallel
        let jsonData;
        try {
            const jsonContent = await fs.readFile(jsonFilePath, 'utf8');
            jsonData = JSON.parse(jsonContent);
        } catch (error) {
            console.error(`Error reading JSON file: ${jsonFilePath}`, error);
            return null;
        }

        const numRecords = jsonData.numeroDeRegistros || 0;
        if (numRecords === 0) return null; // Skip if no images

        // Generate image paths in bulk
        const imagePaths = Array.from({ length: numRecords }, (_, i) =>
            path.join(imagesFolderPath, `${i}.jpg`)
        );

        // Check all images in parallel
        const validImages = await Promise.all(
            imagePaths.map(async (imagePath) => {
                try {
                    return `/static/images/${dbName}/${label}/images/${encodeURIComponent(`${path.basename(imagePath)}`)}`;
                } catch {
                    return null; // Skip missing images
                }
            })
        );

        const filteredImages = validImages.filter(Boolean);
        if (filteredImages.length === 0) return null;

        // Get name from JSON
        const name = jsonData.name || label;
        labels.push(name);

        return {
            label,
            name,
            distance: normalizedDistance,
            imagePath: filteredImages, // Array of image paths
            jsonData // JSON file content
        };
    });

    const responseArray = (await Promise.all(imagePathPromises)).filter(Boolean);
    return responseArray;
}



module.exports = {
    findNearestDescriptors,
    calculateMaxPossibleDistance,
    loadDataIntoMemory, processNearestDescriptors
};

