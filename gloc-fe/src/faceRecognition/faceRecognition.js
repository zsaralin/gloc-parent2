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

        let attempts = 0;
        while ((!matches || matches.length === 0) && attempts < maxChecks) {
            if (abortController.signal.aborted) {
                console.log('Recognition aborted during match wait.');
                isProcessing = false;
                return;
            }
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
            attempts++;
        }

        if (!matches || matches.length === 0) {
            console.warn('No matches found; skipping this cycle.');
            isProcessing = false;
            return;
        }

        // If first update, show loading, stop shuffle
        if (isFirstUpdate) {
            preloadLoading();
            const startTime = performance.now();

            const images = await loadImages(matches, abortController.signal);
            currImages = images;
            if (abortController.signal.aborted) {
                isProcessing = false;
                return;
            }

            const elapsedTime = performance.now() - startTime;
            const remainingTime = Math.max(1000 - elapsedTime, 0);

            setTimeout(() => {
                startLoading();
            }, remainingTime);

            await new Promise(resolve => setTimeout(resolve, overlaySettings.loadingDuration * 1000));
            stopShuffle();
            fillGridItems(images, false, true, false);
            isFirstUpdate = false;
        } else {
            const images = await loadImages(matches, abortController.signal);
            if (abortController.signal.aborted) {
                isProcessing = false;
                return;
            }
            if(document.hidden) {
                isProcessing = false;
                return;
            }
            fillGridItems(images, true, false, false);
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Recognition task aborted due to an abort error.');
        } else {
            console.error('Error during recognition task:', error);
        }
    } finally {
        isProcessing = false; // ✅ Ensure this resets after completion
    }
}

export async function startRecognitionTask() {
    // ✅ Ensure previous task is fully stopped before starting
    stopRecognitionTasks();

    // ✅ Reset abort controller if needed
    abortController = new AbortController();

    startContinuousFaceRecognition();

    // Run immediately once
    await performRecognitionTask();

    if (isFirstUpdate) {
        await new Promise(resolve => setTimeout(resolve, overlaySettings.refreshTime * 1000));
    }

    // ✅ Prevent multiple intervals
    if (!recognitionIntervalId) {
        recognitionIntervalId = setInterval(() => {
            if (!abortController.signal.aborted) {
                performRecognitionTask();
            }
        }, overlaySettings.refreshTime * 1000);
    }
}

export function stopRecognitionTasks() {
    if (recognitionIntervalId) {
        clearInterval(recognitionIntervalId);
        recognitionIntervalId = null;
    }
    if (!abortController.signal.aborted) {
        abortController.abort();
    }
    isProcessing = false; // ✅ Ensure next task can start fresh
    console.log('Recognition tasks stopped.');
}

window.addEventListener('refreshTimeUpdated', () => {
    console.log("Refresh time updated, restarting recognition task...");
    stopRecognitionTasks();
    startRecognitionTask();
});

export function updateGridImmediately(){
    if(currImages){
        fillGridItems(currImages, false, false, false);
    }
}
