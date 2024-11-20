const fs = require('fs').promises
const faceapi = require('face-api.js');
const MAX_DISTANCE = 1.2385318850506823
const MinHeap = require("./minHeap");
let cachedData = null;
const { getDbName } = require('./db.js');
const {createOrUpdateScores, getSortedLabelsByUserID} = require("./scores");
let dbName = getDbName();

// cache the JSON file in memory
async function loadDataIntoMemory() {
    dbName = getDbName();
    try {
        const rawData = await fs.readFile(`./descriptors/descriptors_${dbName}.json`, 'utf8');
        cachedData = JSON.parse(rawData);

    } catch (error) {
        console.error('Error loading data into memory:', error);
    }
}

async function findNearestDescriptors(targetDescriptor, numMatches, userId) {
    try {
        if (!targetDescriptor || !cachedData) return null

        const minHeap = new MinHeap();

        for (const label of Object.keys(cachedData)) {
            const descriptors = cachedData[label].descriptors;

            if (descriptors.length === 0) {
                continue; // Skip labels with no descriptors
            }

            let distance;

            if (descriptors.length === 1) {
                distance = faceapi.euclideanDistance(Array.from(targetDescriptor), descriptors[0]);
            } else {
                const totalDistance = descriptors.reduce((acc, desc) =>
                    acc + faceapi.euclideanDistance(Array.from(targetDescriptor), desc), 0);
                distance = totalDistance / descriptors.length;
            }

            minHeap.insert({ label, distance });

            if (minHeap.size() > numMatches) {
                minHeap.extractMin(); // Remove the farthest descriptor if exceeding N
            }
        }

        // Extract the top N nearest descriptors from the min-heap
        const topNDescriptors = [];
        while (!minHeap.isEmpty()) {
            const { label, distance } = minHeap.extractMin();
            topNDescriptors.push({ label, distance });
        }
        // Normalize distances
        const normalizedDescriptors = topNDescriptors.map((item) => ({
            label: item.label,
            normalizedDistance: 1 - item.distance / MAX_DISTANCE,
        }));

        const reversedDescriptors = normalizedDescriptors.reverse()
        await createOrUpdateScores(userId, reversedDescriptors)
        return getSortedLabelsByUserID(userId); // Reverse to get closest first
    } catch (error) {
        console.error('Error reading or parsing descriptors.json:', error);
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
    const imagePathPromises = nearestDescriptors.map(async nearestDescriptor => {
        const { label, normalizedDistance } = nearestDescriptor;
        const imagesFolderPath = path.join(localFolderPath, dbName, label, 'images');
        const jsonFilePath = path.join(localFolderPath, dbName, label, 'info.json');
        const name = await getNameFromJsonFile(jsonFilePath, label);

        let jsonData = null;
        try {
            const jsonContent = await fs.readFile(jsonFilePath, 'utf8');
            jsonData = JSON.parse(jsonContent);
        } catch (error) {
            console.error(`Error reading JSON file: ${jsonFilePath}`, error);
            return null;
        }

        const numRecords = jsonData.numeroDeRegistros || 0;
        const imageFiles = [];
        for (let i = 0; i < numRecords; i++) {
            const imagePath = path.join(imagesFolderPath, `${i}.jpg`);
            try {
                await fs.access(imagePath);
                imageFiles.push(`/static/images/${dbName}/${label}/images/${encodeURIComponent(`${i}.jpg`)}`);
            } catch (error) {
                console.log(`Image file ${imagePath} does not exist.`);
            }
        }

        if (imageFiles.length > 0) {
            labels.push(name);
            return {
                label,
                name,
                distance: normalizedDistance * 100,
                imagePath: imageFiles, // Array of image paths
                jsonData // JSON file content
            };
        } else {
            console.log(`No image files found in folder: ${imagesFolderPath}`);
            return null;
        }
    });

    const responseArray = (await Promise.all(imagePathPromises)).filter(Boolean);
    return responseArray;
}


module.exports = {
    findNearestDescriptors,
    calculateMaxPossibleDistance,
    loadDataIntoMemory, processNearestDescriptors
};

