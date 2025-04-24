const fs = require('fs').promises;
const faceapi = require('face-api.js');
const canvas = require('canvas');
const sharp = require('sharp');
const path = require('path');
const MODEL_URI = './models';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
const { getDbName } = require('../db.js');
const dbName = getDbName();

const util = require("util");

const targetDB = 'arg';
const resultsFilePath = process.env.RESULTS_PATH || path.join(__dirname, `descriptors/descriptors_${targetDB}_new.json`);
const mtcnnParams = {
  minFaceSize: 20,
  scaleFactor: 0.5,
  maxNumScales: 10,
  scoreThresholds: [0.3, 0.4, 0.5],
  maxNumBoxes: 10,
};

async function generateDescriptors() {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URI);
    await faceapi.nets.mtcnn.loadFromDisk(MODEL_URI);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URI);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URI);

    const targetDirectory = '../db/' + targetDB;
    const files = await getAllImageFiles(targetDirectory);

    const results = {};

    for (const filePath of files) {
      if (filePath.endsWith('0_comp.jpg')) {
        console.log(`Skipping ${filePath} (excluded file)`);
        continue;
      }
      console.log(`Processing ${filePath}`);
      try {
        // --- Check image size ---
        const metadata = await sharp(filePath).metadata();
        let buffer = await fs.readFile(filePath);

        if (metadata.width > 2000 || metadata.height > 2000) {
          console.log(`Resizing ${filePath} from ${metadata.width}x${metadata.height}`);
          buffer = await sharp(buffer)
            .resize({ width: 2000, height: 2000, fit: 'inside' }) // maintains aspect ratio
            .toBuffer();
        }

        // Load image from buffer
        const img = await canvas.loadImage(buffer);

        // Face detection
        let allDetections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (allDetections.length > 0) {
          const detections = allDetections[0];
          const descriptor = new Float32Array(detections.descriptor);
          const { x, y, width, height } = detections.detection.box;
          const boundingBox = { x, y, width, height };
          const label = path.basename(path.resolve(filePath, '..', '..'));

          results[label] = { label, descriptors: [Array.from(descriptor)], boundingBoxes: [boundingBox] };
        } else {
          console.log(`No face detected in ${filePath}`);
        }
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }

    await fs.writeFile(resultsFilePath, JSON.stringify(results, null, 2));
    console.log(`✅ Results saved to: ${resultsFilePath}`);
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
    } else if (stats.isFile() && file.endsWith('.jpg')) {
      imageFiles.push(filePath);
    }
  }
  return imageFiles;
}

module.exports = {
  generateDescriptors,
};

generateDescriptors();

