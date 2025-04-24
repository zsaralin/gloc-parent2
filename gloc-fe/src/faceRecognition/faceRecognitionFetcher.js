// faceRecognitionFetcher.js

import { currFace } from "../faceDetection/newFaces.js";
import { SERVER_URL } from "../config.js";
import { numTotalGridItems } from "../grid/gridLayout.jsx";
import { userID } from "./userScoresManager.js";
export let matches = null; // Initialize matches
export let abortController = new AbortController();
let faceRecogTimeout = null; // Track timeout ID
import { overlaySettings  } from "../OverlayGui.jsx";
import {getLanguage} from "../config"
const RETRY_LIMIT = 3;           // Max retries before giving up
const RETRY_INTERVAL = 3000;    // Retry every 15 seconds
const FACE_RECOG_INTERVAL = overlaySettings.refreshTime * 1000; // Run face recognition every 15 seconds

async function fetchFaceRecognitionData() {

    let attempts = 0;
    while (attempts < RETRY_LIMIT) {

    if (!currFace) {
        console.warn('currFace is not available.');
        return;
    }
    if (document.visibilityState !== "visible") {
        console.log("Window not active, skipping server call.");
        return; // Skip if the tab is not active
    }
    try {
        const response = await fetch(`${SERVER_URL}/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: currFace, numPhotos: numTotalGridItems, uuid: userID, language: getLanguage()}),
        });
        const data = await response.json();
        if (data !== null) {
            matches = data;
            return;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            return;
        } else {
            console.error('Error during face recognition fetch:', error);
        }
    }
    attempts++;
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
}}

async function continuousFaceRecognition() {
    await fetchFaceRecognitionData();
    
    if (!abortController.signal.aborted) {
        clearTimeout(faceRecogTimeout); // 🛑 Prevent duplicate timeouts
        faceRecogTimeout = setTimeout(continuousFaceRecognition, FACE_RECOG_INTERVAL);
    }
}

export async function startContinuousFaceRecognition() {
    abortController = new AbortController();

    // Wait for currFace to be available
    if (!currFace) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 🛑 Prevent multiple instances by clearing any existing timeout
    clearTimeout(faceRecogTimeout);
    
    // Start continuous face recognition
    continuousFaceRecognition();
}

export function stopContinuousFaceRecognition() {
    if (faceRecogTimeout) {
        clearTimeout(faceRecogTimeout);
        faceRecogTimeout = null;
    }
    abortController.abort(); // Ensure fetch operations are also stopped
}

export function clearMatches() {
    matches = null;
}

export async function getMockImages() {
    const response = await fetch(`${SERVER_URL}/mock-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numTotalGridItems, language: getLanguage() }) 
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}