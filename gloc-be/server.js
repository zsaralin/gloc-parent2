// v1.0.1

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const { findNearestDescriptors, loadDataIntoMemory, processNearestDescriptors } = require('./topDescriptors');
require('dotenv').config();
const localFolderPath = path.resolve(__dirname, '../db');  // Adjust the folder path as needed

app.use(cors());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(express.json());

const { readRandomImagesFromFolder } = require("./randomImages");
const { getDbName, setDbName } = require('./db.js');
const { getDescriptor } = require("./getDescriptor");
const { createNewScores, initializeSessionScores, testDB, createScoresTable, deleteUserEntry } = require("./scores");

let dbName = getDbName();

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
});


// Create Scores Table
createScoresTable();
// Serve static files for all images
app.use('/static/images', express.static(localFolderPath));
(async () => {
    const { default: pLimit } = await import('p-limit'); // Dynamically import ESM module

    app.post('/match', async (req, res) => {
        try {
                const { photo, numPhotos, uuid } = req.body;
                const descriptor = await getDescriptor(photo);
                console.log('descriptr' + descriptor)
                if (!descriptor) {
                    res.json(null);
                    return;
                }

                const startTime = performance.now();
                const nearestDescriptors = await findNearestDescriptors(descriptor, numPhotos + 2, uuid);
                const endTime = performance.now();
                console.log(`findNearestDescriptors took ${(endTime - startTime).toFixed(2)} ms`);

                if (!nearestDescriptors) {
                    res.json(null);
                    return;
                }

                const responseArray = await processNearestDescriptors(nearestDescriptors, localFolderPath);
                res.json(responseArray);
        } catch (error) {
            console.error('Error processing detection:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
})();


app.post('/random', async (req, res) => {
    try {
        const dbName = getDbName();
        const imagesFolder = path.join(localFolderPath, dbName);
        const numTotalGridItems = (req.body.numTotalGridItems || 0) + 10;
        const limit = numTotalGridItems || 40; // Default to 30 if not provided

        console.log(`Received numTotalGridItems: ${numTotalGridItems}`);

        const randomImages = await readRandomImagesFromFolder(imagesFolder, dbName, limit);
        res.json(randomImages);
    } catch (error) {
        console.error('Error processing detection:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/set-db-name', async (req, res) => {
    const { newName } = req.body;
    if (newName) {
        setDbName(newName);
        dbName = getDbName();
        await loadDataIntoMemory();
        res.json({ message: 'Database name updated successfully.', dbName });
    } else {
        res.status(400).json({ message: 'New name is required.' });
    }
});

app.get('/get-db-name', async (req, res) => {
    const currentName = getDbName();
    res.json({ dbName: currentName });
});

let cachedImages = null;

app.get('/get-images', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const directory = localFolderPath;

        if (!cachedImages) {
            cachedImages = await getOriginalImages(directory);
            console.log("Images loaded and cached.");
        }

        if (cachedImages && cachedImages.length > 0) {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedImages = cachedImages.slice(startIndex, endIndex);

            res.json({
                page,
                limit,
                total: cachedImages.length,
                data: paginatedImages
            });
        } else {
            res.status(404).send('No images found');
        }
    } catch (error) {
        console.error('Error reading images:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/create-scores', async (req, res) => {
    if (!req.body.userID) {
        return res.status(400).send('userID is required');
    }
    await createNewScores(req.body.userID);
    res.status(201).send(`Score created for userID: ${req.body.userID}`);
});

app.post('/delete-scores', async (req, res) => {
    if (!req.body.userID) {
        return res.status(400).send('userID is required');
    }
    try {
        res.status(204).send();
    } catch (error) {
        res.status(500).send('Error deleting user entry');
    }
});

const settingsFile = 'settings.json';

// Load settings
app.get('/settings', (req, res) => {
  if (fs.existsSync(settingsFile)) {
    fs.readFile(settingsFile, 'utf8', (err, data) => {
      if (err) {
        res.status(500).json({ error: "Error reading settings file" });
      } else {
        res.json(JSON.parse(data));
      }
    });
  } else {
    res.json({});
  }
});

// Save settings
app.post('/settings', (req, res) => {
  fs.writeFile(settingsFile, JSON.stringify(req.body, null, 2), (err) => {
    if (err) {
      res.status(500).json({ error: "Error saving settings" });
    } else {
      res.json({ message: "Settings saved successfully" });
    }
  });
});

