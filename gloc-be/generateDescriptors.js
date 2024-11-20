const fs = require('fs').promises;
const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const MODEL_URI = './models';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
const { getDbName } = require('../db.js');
const dbName = getDbName();

// Assuming you have set GOOGLE_APPLICATION_CREDENTIALS environment variable

const util = require("util"); // Import your config file after loading env variables

const targetDB = 'arg'
const resultsFilePath = process.env.RESULTS_PATH || path.join(__dirname, `../descriptors/descriptors_${targetDB}.json`);
const mtcnnParams = {
    // These are example parameters, adjust them according to your needs
    minFaceSize: 20,
    scaleFactor: 0.5,
    maxNumScales: 10,
    scoreThresholds:  [0.3, 0.4, 0.5],
    maxNumBoxes: 10,
};
async function generateDescriptors() {
    try {
        // Load face detection models
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URI);
        await faceapi.nets.mtcnn.loadFromDisk(MODEL_URI);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URI);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URI);

        const targetDirectory = '../../db/' + targetDB; // Adjust the directory path as needed
        const files = await getAllImageFiles(targetDirectory);

        const results = {};

        for (const filePath of files) {
            console.log(`Processing ${filePath}`);
            try {
                const img = await canvas.loadImage(filePath);

                // First attempt to detect faces using SSD MobileNet V1
                let allDetections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence:.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                // If no faces detected with SSD MobileNet V1, fall back to MTCNN
                if (allDetections.length === 0) {
                    allDetections = await faceapi.detectAllFaces(img, new faceapi.MtcnnOptions(mtcnnParams))
                        .withFaceLandmarks()
                        .withFaceDescriptors();
                }

                if (allDetections.length > 0) {
                    const detections = allDetections[0];
                    const descriptor = new Float32Array(detections.descriptor);
                    const { x, y, width, height } = detections.detection.box;
                    const boundingBox = { x, y, width, height };
                    const label = path.basename(filePath, path.extname(filePath));
                    results[label] = { label, descriptors: [Array.from(descriptor)], boundingBoxes: [boundingBox] };
                } else {
                    console.log(`No face detected in ${filePath}`);
                }
            } catch (err) {
                console.error(`Error processing file ${filePath}:`, err);
            }
        }

        await fs.writeFile(resultsFilePath, JSON.stringify(results, null, 2));
        console.log(`Results saved to: ${resultsFilePath}`);

        return results;
    } catch (error) {
        console.error('Error processing face descriptors:', error);
        return null;
    }
}

async function getAllImageFiles(directory) {
    const files = await fs.readdir(directory);
    const imageFiles = [];

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            const subDirectoryImageFiles = await getAllImageFiles(filePath);
            imageFiles.push(...subDirectoryImageFiles);
        } else if (stats.isFile() && file.endsWith('.png')) {
            imageFiles.push(filePath);
        }
    }

    return imageFiles;
}
module.exports = {
    generateDescriptors,
};
