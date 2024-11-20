// v1.0.1

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
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

// Other routes and middleware
app.post('/match', async (req, res) => {
    try {
        const { photo, numPhotos, uuid } = req.body;
        const descriptor = await getDescriptor(photo);
        if (!descriptor) {
            res.json(null);
            return;
        }
        const nearestDescriptors = await findNearestDescriptors(descriptor, numPhotos, uuid);
        if (!nearestDescriptors) {
            res.json(null);
            return;
        }
        const responseArray = await processNearestDescriptors(
            nearestDescriptors,localFolderPath
        );

        res.json(responseArray);
    } catch (error) {
        console.error('Error processing detection:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/random', async (req, res) => {
    try {
        const dbName = getDbName();
        const imagesFolder = path.join(localFolderPath, dbName);
        const randomImages = await readRandomImagesFromFolder(imagesFolder, dbName);
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

app.post('/save-settings', (req, res) => {
    fs.writeFile('settings.json', JSON.stringify(req.body, null, 2), err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to save settings');
        }
        res.send('Settings updated successfully');
    });
});

app.get('/get-settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.json'));
});

