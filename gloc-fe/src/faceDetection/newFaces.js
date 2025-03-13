import {
    stopRecognitionTasks,
    startRecognitionTask
} from "../faceRecognition/faceRecognition.js";
import { clearMatches } from "../faceRecognition/faceRecognitionFetcher.js";
import {deletePrevScoresDB, generateUUID} from "../faceRecognition/userScoresManager.js";
import { isShuffling } from "../updateGrid/shuffleManagerService.js";
import { resetProgressBar, startProgressBar } from "../grid/VideoContainer.jsx";
export let newFace = false;
export let currFace = null;


export function setCurrFace(mediapipeResult, imageDataUrl) {
    if (!imageDataUrl) return;  // Exit if no image data is provided

    if (mediapipeResult && mediapipeResult.faceLandmarks.length > 0) {
        updateFaceDetection(mediapipeResult, imageDataUrl);
    } else {
        handleNoFaceDetected();
    }
}

function updateFaceDetection(mediapipeResult, imageDataUrl) {
    if (!currFace) {
        currFace = imageDataUrl;
        handleNewFaceDetection(mediapipeResult);
    } else {
        currFace = imageDataUrl;  // Always update with the latest image
    }
    document.getElementById('face-detect-text').innerHTML = "Face located"
}

function handleNewFaceDetection() {
    console.log('New face detected');
    newFace = true;
    generateUUID();  // Assume UUID generation is needed for session tracking
    startRecognitionTask();
}

function handleNoFaceDetected() {
    if (isShuffling()) {
        return
    }
    resetProgressBar()
    resetCurrFace()
    stopRecognitionTasks();
    deletePrevScoresDB();
    document.getElementById('face-detect-text').innerHTML = "Locating a face..."
}

export function resetCurrFace() {
    currFace = null;
    clearMatches()
}