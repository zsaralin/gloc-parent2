// faceRecognitionFetcher.js

import { currFace } from "../faceDetection/newFaces.js";
import { SERVER_URL } from "../config.js";
import { numTotalGridItems } from "../grid/gridLayout.jsx";
import { userID } from "./userScoresManager.js";

export let matches = null; // Initialize matches
export let abortController = new AbortController();

const RETRY_LIMIT = 5;           // Max retries before giving up
const RETRY_INTERVAL = 2000;     // Retry every 2 seconds if data is null
const FACE_RECOG_INTERVAL = 5000; // Run face recognition every 3 seconds

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
                body: JSON.stringify({ photo: currFace, numPhotos: numTotalGridItems, uuid: userID }),
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
    }
    console.error('Failed to fetch valid face recognition data after retries.');
}

async function continuousFaceRecognition() {
    await fetchFaceRecognitionData();
    if (!abortController.signal.aborted) {
        setTimeout(continuousFaceRecognition, FACE_RECOG_INTERVAL);
    }
}

export async function startContinuousFaceRecognition() {
    abortController = new AbortController();
    // Wait for currFace to be available
    if (!currFace) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Start continuous face recognition
    continuousFaceRecognition();
}

export function clearMatches() {
    matches = null;
}

