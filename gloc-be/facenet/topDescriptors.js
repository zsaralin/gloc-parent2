const fs = require('fs').promises
const faceapi = require('face-api.js');
const MAX_DISTANCE = 1.2385318850506823
const MinHeap = require("./minHeap");
let cachedData = null;
const { getDbName } = require('./db.js');
const {createOrUpdateScores, getSortedLabelsByUserID} = require("./scores");
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = "./face_embeddings.db"; // Adjust path as needed

let dbName = getDbName();
loadDataIntoMemory();

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

loadDataIntoMemory();

// Cache JSON descriptors in memory
async function loadDataIntoMemory() {
    dbName = getDbName();
    try {
        const rawData = await fs.readFile(`./descriptors/descriptors_${dbName}.json`, 'utf8');
        cachedData = JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading data into memory:', error);
    }
}

// Function to call Python script and get face descriptor
async function getPythonDescriptor(photo) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', ['facenet_descriptor.py', photo]);

        let descriptor = '';
        pythonProcess.stdout.on('data', (data) => {
            descriptor += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (!descriptor.trim()) {
                console.error('No descriptor returned from Python.');
                resolve(null);
            } else {
                try {
                    resolve(JSON.parse(descriptor));
                } catch (e) {
                    console.error('Failed to parse descriptor:', e);
                    resolve(null);
                }
            }
        });
    });
}
// 2) Helper: compute Euclidean distance between 2 float arrays
function euclideanDistance(arr1, arr2) {
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
      const diff = arr1[i] - arr2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
  
async function findNearestDescriptors(targetDescriptor, numMatches, userId) {
    try {
      // B) Convert to float array for distance calculation
      const targetArr = Float32Array.from(targetDescriptor);
  
      // C) Read from face_embeddings.db
      const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);
      const rows = await new Promise((resolve, reject) => {
        db.all("SELECT folder, embeddings FROM embeddings", [], (err, rowData) => {
          if (err) return reject(err);
          resolve(rowData);
        });
      });
      db.close();
  
      // D) For each row: parse the stored embeddings, compute distance
      const minHeap = new MinHeap();
  
      for (const row of rows) {
        const folderName = row.folder;
        const embeddingBlob = row.embeddings; // This is a Buffer
        // Convert buffer -> Float32Array
        const storedArray = new Float32Array(embeddingBlob.buffer);
        // NOTE: Each folder can have multiple embeddings. If so, they are
        // concatenated. For example, if folder has 3 embeddings => shape [3,512].
        // We'll separate them by 512 steps or compute an average. Example below uses average.
  
        const dimension = 512; // FaceNet descriptor size
        const numEmbeddings = storedArray.length / dimension;
  
        if (numEmbeddings < 1) {
          // no embeddings for this folder
          continue;
        }
  
        let totalDistance = 0;
        for (let i = 0; i < numEmbeddings; i++) {
          const start = i * dimension;
          const end = start + dimension;
          const subEmbedding = storedArray.slice(start, end);
  
          // Compute distance to target
          const dist = euclideanDistance(targetArr, subEmbedding);
          totalDistance += dist;
        }
        const avgDistance = totalDistance / numEmbeddings;
  
        // Insert into min-heap
        minHeap.insert({ label: folderName, distance: avgDistance });
        if (minHeap.size() > numMatches) {
          minHeap.extractMin();
        }
      }
  
      // E) Extract top N matches
      const topNDescriptors = [];
      while (!minHeap.isEmpty()) {
        topNDescriptors.push(minHeap.extractMin());
      }
  
      // F) Normalize distances
      const normalizedDescriptors = topNDescriptors.map((item) => ({
        label: item.label,
        normalizedDistance: item.distance /// MAX_DISTANCE,
      }));
  
      // G) Optionally store results in your DB
      await createOrUpdateScores(userId, normalizedDescriptors);
  
      // Return closest first => reverse the min-heap array
      return normalizedDescriptors.reverse();
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

