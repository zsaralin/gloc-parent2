import {
    stopRecognitionTasks,
    startRecognitionTask
} from "../faceRecognition/faceRecognition.js";
import { clearMatches } from "../faceRecognition/faceRecognitionFetcher.js";
import {deletePrevScoresDB, generateUUID} from "../faceRecognition/userScoresManager.js";
import { isShuffling } from "../updateGrid/shuffleManagerService.js";
import { resetProgressBar, startProgressBar } from "../grid/VideoContainer.jsx";
import { getText } from "../config.js";
import { overlaySettings } from '../OverlayGui';
import { showLoadingMessage } from "../grid/LoadingScreen.jsx";
export let newFace = false;
export let currFace = null;
let firstFaceDetected = false;
let noFaceTimeoutTimer = null;

export let timeoutTriggered = false;
const NO_FACE_SECOND_TIMEOUT = 20000; // 15 seconds
const NO_FACE_FIRST_TIMEOUT = 10000; // 15 seconds


export function setCurrFace(mediapipeResult, imageDataUrl) {
    // if (!imageDataUrl) return;  // Exit if no image data is provided
    if (mediapipeResult && mediapipeResult.faceLandmarks.length > 0) {
        updateFaceDetection(mediapipeResult, imageDataUrl);
    } else {
        handleNoFaceDetected();
    }
}

function updateFaceDetection(mediapipeResult, imageDataUrl) {
    const text = getText();

    if (!currFace) {
        currFace = imageDataUrl;
        firstFaceDetected = true; // ✅ Set this when we see the first face
        handleNewFaceDetection();
    } else {
        currFace = imageDataUrl;
    }

    clearTimeout(noFaceTimeoutTimer); // ✅ Clear timeout since a face is now detected
    document.getElementById('face-detect-text').innerHTML = text.face_located;
}

function handleNewFaceDetection(fromTimeout = false) {
    console.log('New face detected');
    newFace = true;
    generateUUID();  // Assume UUID generation is needed for session tracking
    startRecognitionTask(fromTimeout);
}

function handleNoFaceDetected() {
    const text = getText();
        // First timeout triggers loading message
        if (!noFaceTimeoutTimer) {
            noFaceTimeoutTimer = setTimeout(() => {
                console.log("First timeout: showing loading message");
                showLoadingMessage();
    
                // Schedule second timeout
                noFaceTimeoutTimer = setTimeout(() => {
                    console.log("Second timeout: triggering new face detection due to prolonged absence");
                    timeoutTriggered = true;
    
                    const overlay = document.querySelector(".poor-lighting-overlay");
                    if (overlay) {
                        setTimeout(() => {
                            overlay.style.opacity = "1";
                            overlay.style.pointerEvents = "auto";

                        }, (overlaySettings.loadingDuration + 4) * 1000);
                    }
    
                    handleNewFaceDetection({ onTimeout: true });
                }, NO_FACE_SECOND_TIMEOUT - NO_FACE_FIRST_TIMEOUT); // Remaining time
            }, NO_FACE_FIRST_TIMEOUT);
        }
    
    if (isShuffling()) {
        return;
    }


    resetProgressBar();
    resetCurrFace();
    stopRecognitionTasks();
    deletePrevScoresDB();

    document.getElementById('face-detect-text').innerHTML = text.no_face_located;
    
}


export function resetCurrFace() {
    currFace = null;
    clearMatches();
    clearTimeout(noFaceTimeoutTimer); // ✅ Cancel if a reset is triggered
    noFaceTimeoutTimer = null;
}
