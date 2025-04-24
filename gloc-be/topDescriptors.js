const fs = require('fs').promises
const faceapi = require('face-api.js');
const MAX_DISTANCE = 1.2385318850506823
let cachedData = null;
const { getDbName } = require('./db.js');
const {createOrUpdateScores, getSortedLabelsByUserID, checkIfUserExists} = require("./scores");
const path = require('path');
const FastPriorityQueue = require('fastpriorityqueue'); // Import FastPriorityQueue

let dbName = getDbName();
loadDataIntoMemory();

// cache the JSON file in memory
async function loadDataIntoMemory() {
    dbName = getDbName();
    try {
        const rawData = await fs.readFile(`./descriptors/descriptors_arg.json`, 'utf8');
        cachedData = JSON.parse(rawData);

    } catch (error) {
        console.error('Error loading data into memory:', error);
    }
}
async function findNearestDescriptors(targetDescriptor, numMatches, userId, language) {
    try {
        if (!targetDescriptor || !cachedData) return null;

        const pq = new FastPriorityQueue((a, b) => a.distance < b.distance); // Min-Heap: closest first

        // Convert target descriptor to array once for efficiency
        const targetArray = Array.from(targetDescriptor);
        const dimensionSize = targetArray.length;
        const normalizationFactor = Math.sqrt(dimensionSize); // Adjust for Manhattan Distance

        if (!cachedData.labels || !cachedData.labelIndex || !cachedData.descriptors) {
            console.error("Invalid cached data structure.");
            return null;
        }

        // Iterate through all labels
        for (const label of cachedData.labels) {
            const descriptorIndices = cachedData.labelIndex[label]; // Get index/indices for the label
            
            if (!descriptorIndices || descriptorIndices.length === 0) continue;

            let distance;
            if (descriptorIndices.length === 1) {
                const descriptor = cachedData.descriptors[descriptorIndices[0]]; // Retrieve descriptor by index
                distance = targetArray.reduce((acc, val, i) => acc + Math.abs(val - descriptor[i]), 0) / normalizationFactor;
            } else {
                // Compute average normalized Manhattan distance across all stored descriptors for this label
                distance = descriptorIndices.reduce((total, index) =>
                    total + targetArray.reduce((acc, val, i) => acc + Math.abs(val - cachedData.descriptors[index][i]), 0), 0) 
                    / descriptorIndices.length / normalizationFactor;
            }

            pq.add({ label, distance });
        }

        // Extract the top N nearest descriptors
        const normalizedDescriptors = Array.from({ length: Math.min(numMatches, pq.size) }, () => {
            const item = pq.poll();
            return { label: item.label, normalizedDistance: (1 - item.distance) * 100 };
        });

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
async function processNearestDescriptors(nearestDescriptors, localFolderPath, language) {
    const jsonKey = language === 'es' ? 'numeroDeRegistros' : 'numberOfRecords';
    const jsonFileName = language === 'es' ? 'info.json' : 'info_en.json';
  
    const results = await Promise.all(
      nearestDescriptors.map(async ({ label, normalizedDistance }) => {
        const basePath = path.join(localFolderPath, dbName, label);
        const jsonPath = path.join(basePath, jsonFileName);
        const imagesPath = path.join(basePath, 'images');
  
        if (!(await fileExists(jsonPath))) return null;
  
        let jsonData;
        try {
          jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
        } catch (err) {
          console.error(`❌ Failed to parse JSON for ${label}:`, err);
          return null;
        }
  
        const numRecords = jsonData[jsonKey];
        if (!numRecords) return null;
  
        const imagePairs = await Promise.all(
          Array.from({ length: numRecords }, async (_, i) => {
            const file300 = `${i}_300.jpg`;
            const fileOriginal = `${i}.jpg`;
  
            const path300 = path.join(imagesPath, file300);
            const pathOriginal = path.join(imagesPath, fileOriginal);
  
            if (await fileExists(path300)) {
              return {
                preview: `/static/images/${dbName}/${label}/images/${encodeURIComponent(file300)}`,
                full: `/static/images/${dbName}/${label}/images/${encodeURIComponent(fileOriginal)}`
              };
            } else if (await fileExists(pathOriginal)) {
              return {
                preview: `/static/images/${dbName}/${label}/images/${encodeURIComponent(fileOriginal)}`,
                full: `/static/images/${dbName}/${label}/images/${encodeURIComponent(fileOriginal)}`,
              };
            }
            return null;
          })
        );
  
        const validPairs = imagePairs.filter(Boolean);
        if (validPairs.length === 0) return null;
  
        return {
          label,
          name: jsonData.name || label,
          distance: normalizedDistance,
          imagePath: validPairs.map(img => img.preview),
          fullImagePath: validPairs.map(img => img.full),
          jsonData
        };
      })
    );
  
    return results
  }

// return random descriptors with distance = 0
async function findMockNearestDescriptors(_, numMatches) {
    try {
        if (!cachedData || !cachedData.labels || !cachedData.labelIndex || !cachedData.descriptors) {
            console.error("Invalid cached data structure.");
            return null;
        }

        // Select random labels
        const shuffledLabels = cachedData.labels.sort(() => 0.5 - Math.random());
        const selectedLabels = shuffledLabels.slice(0, numMatches);

        const mockResults = selectedLabels.map(label => ({
            label,
            normalizedDistance: 0 // (1 - 0) * 100 since distance is always 0
        }));

        return mockResults;
    } catch (error) {
        console.error("Error processing descriptors:", error);
        throw error;
    }
}


module.exports = {
    findNearestDescriptors,
    calculateMaxPossibleDistance,
    loadDataIntoMemory, processNearestDescriptors,
    findMockNearestDescriptors
};

