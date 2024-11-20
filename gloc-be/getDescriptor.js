const tf = require('@tensorflow/tfjs-node'); // in nodejs environments tfjs-node is required to be loaded before face-api
const faceapi = require('face-api.js');


let faceapiInitialized = false;

// Route to handle webcam capture requests
async function getDescriptor(imageDataURL) {
    // Load face-api.js models if not initialized
    if (!faceapiInitialized) {
        await initializeFaceAPI();
        faceapiInitialized = true;
    }

    // Process the image data and generate facial descriptors
    const tensor = await loadImageAsTensor(imageDataURL);
    const detections = await faceapi.detectAllFaces(tensor).withFaceLandmarks().withFaceDescriptors();
    // Return the facial descriptors
    if(detections && detections[0]) {
        return detections[0].descriptor;
    }
}


// Function to load image data URL as TensorFlow.js tensor
async function loadImageAsTensor(imageDataURL) {
    const buffer = Buffer.from(imageDataURL.split(',')[1], 'base64');
    const tensor = tf.node.decodeImage(buffer, 3);
    return tensor;
}

const minConfidence = 0.5;
const maxResults = 5;
let optionsSSDMobileNet;
// Function to initialize face-api.js
async function initializeFaceAPI() {
    await faceapi.tf.setBackend('tensorflow');
    await faceapi.tf.ready();
    const modelPath = './models';
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
        // faceapi.nets.ageGenderNet.loadFromDisk(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
        faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
        // faceapi.nets.faceExpressionNet.loadFromDisk(modelPath),
    ]);
    optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence, maxResults });
}
module.exports = {
    getDescriptor
};