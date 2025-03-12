const fs = require('fs').promises
const faceapi = require('face-api.js');
const { euclideanDistance } = require("face-api.js");

const MAX_DISTANCE = 1.2385318850506823
const MinHeap = require("./minHeap");
let cachedData = null;
const { getDbName } = require('./db.js');
const {createOrUpdateScores, getSortedLabelsByUserID, checkIfUserExists} = require("./scores");
const path = require('path');
const FastPriorityQueue = require("fastpriorityqueue");

let dbName = getDbName();
loadDataIntoMemory();

let descriptorData = { labels: [], labelIndex: {}, descriptors: [] }; // Optimized structure

async function loadDataIntoMemory() {
    try {
        const rawData = await fs.readFile(`./descriptors/descriptors_${dbName}.json`, 'utf8');
        descriptorData = JSON.parse(rawData); // Directly store into optimized structure

        console.log(`✅ Loaded ${descriptorData.labels.length} labels into memory`);
    } catch (error) {
        console.error('Error loading data into memory:', error);
    }
}
function manhattanDistance(vec1, vec2) {
    return vec1.reduce((sum, v, i) => sum + Math.abs(v - vec2[i]), 0);
}
async function findNearestDescriptors(targetDescriptor, numMatches, userId) {
    try {
        if (!targetDescriptor || !descriptorData.labels.length) return null;

        const pq = new FastPriorityQueue((a, b) => a.distance > b.distance); // Max-Heap
        const targetVector = new Float32Array(targetDescriptor); // Convert once
        let allDistances = [];

        // Compute distances and update heap
        await Promise.all(Object.entries(descriptorData.labelIndex).map(async ([label, indices]) => {
            const distances = indices.map(index => manhattanDistance(targetVector, descriptorData.descriptors[index]));
            const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;

            pq.add({ label, distance: averageDistance });
            allDistances.push(averageDistance); // Store for normalization
            if (pq.size > numMatches) {
                pq.poll(); // Remove farthest match
            }
        }));

        if (allDistances.length === 0) return [];

        // Compute min and max for dynamic normalization
        const minOriginal = Math.min(...allDistances); // Closest match
        const maxOriginal = Math.max(...allDistances); // Farthest match
        const maxRandom = 2.5 + Math.random(); // Randomized upper range [2.5, 3.5]

        // Extract closest matches and normalize distances
        const topNDescriptors = Array.from({ length: pq.size }, () => pq.poll()).reverse();
        const normalizedDescriptors = topNDescriptors.map(item => ({
            label: item.label,
            normalizedDistance: (0.5 + ((maxOriginal - item.distance) / (maxOriginal - minOriginal)) * (maxRandom - 0.5)).toFixed(2),
        }));

        // **Do NOT wait for scores to update** (runs in the background)
        createOrUpdateScores(userId, normalizedDescriptors).catch(err =>
            console.error(`Failed to update scores for userID: ${userId}`, err)
        );

        // **Check if user exists in Scores table**
        const userExists = await checkIfUserExists(userId);
        if (!userExists) {
            return normalizedDescriptors; // No need to fetch scores if user is new
        }
        // Fetch sorted labels after updating scores
        const sortedLabels = await getSortedLabelsByUserID(userId);
        return sortedLabels.length ? sortedLabels : normalizedDescriptors;
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
                distance: normalizedDistance ,
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