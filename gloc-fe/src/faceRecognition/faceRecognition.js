import { matches, startContinuousFaceRecognition, abortController as globalAbortController } from './faceRecognitionFetcher.js';
import { overlaySettings } from '../OverlayGui';
import { stopShuffle } from "../updateGrid/shuffleManagerService.js";
import { loadImages } from "../updateGrid/ImageLoader.jsx";
import { fillGridItems } from "../updateGrid/updateGrid.jsx";
import { preloadLoading, startLoading } from '../grid/LoadingScreen.jsx';

let isFirstUpdate = true;
let isProcessing = false;
let recognitionIntervalId = null;
let abortController = globalAbortController; // Keep reference to the global abortController
let currImages = null; 
const CHECK_INTERVAL = 1000; 

async function performRecognitionTask() {
    if (isProcessing) {
        console.warn('Recognition task already in progress. Skipping.');
        return;
    }

    if (abortController.signal.aborted) {
        console.log('Recognition task aborted before start.');
        return;
    }

    isProcessing = true;

    try {
        console.log('Starting recognition task cycle.');

        // Calculate max checks based on the current refresh time
        const maxChecks = Math.floor((overlaySettings.refreshTime * 1000) / CHECK_INTERVAL);

        // Wait for matches or timeout
        let attempts = 0;
        while ((!matches || matches.length === 0) && attempts < maxChecks) {
            if (abortController.signal.aborted) {
                console.log('Recognition aborted during match wait.');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
            attempts++;
        }

        if (!matches || matches.length === 0) {
            console.warn('No matches found; skipping this cycle.');
            return;
        }

        // If first update, show loading, stop shuffle
        if (isFirstUpdate) {
            preloadLoading();
            const startTime = performance.now(); // Record start time

            const images = await loadImages(matches, abortController.signal);
            currImages = images
            if (abortController.signal.aborted) return;

            const elapsedTime = performance.now() - startTime;
            const remainingTime = Math.max(1000 - elapsedTime, 0); // Ensure at least 1s delay

            setTimeout(() => {
                startLoading();
            }, remainingTime);

            // Use the dynamically updated loading duration
            await new Promise(resolve => setTimeout(resolve, overlaySettings.loadingDuration * 1000));
            stopShuffle();
            fillGridItems(images, false, true, false);
            isFirstUpdate = false;
        } else {
            const images = await loadImages(matches, abortController.signal);
            if (abortController.signal.aborted) return;
            if(document.hidden) return
            fillGridItems(images, true, false, false);
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Recognition task aborted due to an abort error.');
        } else {
            console.error('Error during recognition task:', error);
        }
    } finally {
        isProcessing = false;
    }
}

export async function startRecognitionTask() {
    // Prevent multiple intervals
    if (recognitionIntervalId) {
        console.warn('Recognition task already running. Stop it before starting again.');
        return;
    }

    // Reset the abort controller if it's already aborted
    if (abortController.signal.aborted) {
        abortController = new AbortController();
    }

    startContinuousFaceRecognition();

    // Run immediately once
    performRecognitionTask();

    if (isFirstUpdate) {
        await new Promise(resolve => setTimeout(resolve, overlaySettings.refreshTime * 1000));
    }

    // Schedule subsequent runs at a fixed interval
    recognitionIntervalId = setInterval(() => {
        if (!abortController.signal.aborted) {
            performRecognitionTask();
        }
    }, overlaySettings.refreshTime * 1000);
}

export function stopRecognitionTasks() {
    if (recognitionIntervalId) {
        clearInterval(recognitionIntervalId);
        recognitionIntervalId = null;
    }
    abortController.abort();
    console.log('Recognition tasks stopped.');
}

window.addEventListener('refreshTimeUpdated', () => {
    console.log("Refresh time updated, restarting recognition task...");
    stopRecognitionTasks();
    startRecognitionTask();
});

export function updateGridImmediately(){
    if(currImages){
        fillGridItems(currImages, false, false, false)
    }
}