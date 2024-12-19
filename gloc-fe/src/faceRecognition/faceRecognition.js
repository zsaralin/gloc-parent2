import { matches, startContinuousFaceRecognition, abortController as globalAbortController } from './faceRecognitionFetcher.js';
import { REFRESH_TIME, LOADING_DUR } from "../config.js";
import { stopShuffle } from "../updateGrid/shuffleManagerService.js";
import { loadImages } from "../updateGrid/ImageLoader.jsx";
import { fillGridItems } from "../updateGrid/updateGrid.jsx";
import { startLoading } from '../grid/LoadingScreen.jsx';

let isFirstUpdate = true;
let isProcessing = false;
let recognitionIntervalId = null;
let abortController = globalAbortController; // Keep reference to the global abortController

const CHECK_INTERVAL = 1000; 
const MAX_CHECKS = Math.floor((REFRESH_TIME * 1000) / CHECK_INTERVAL);

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

        // Wait for matches or timeout
        let attempts = 0;
        while ((!matches || matches.length === 0) && attempts < MAX_CHECKS) {
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
            startLoading();
            const images = await loadImages(matches, abortController.signal);
            if (abortController.signal.aborted) return;

            await new Promise(resolve => setTimeout(resolve, (LOADING_DUR) * 1000));
            stopShuffle();
            fillGridItems(images, false, true, false);
            isFirstUpdate = false;
        } else {
            const images = await loadImages(matches, abortController.signal);
            if (abortController.signal.aborted) return;
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
    if(isFirstUpdate){
        await new Promise(resolve => setTimeout(resolve, REFRESH_TIME*1000));
    }
    // Schedule subsequent runs at a fixed interval
    recognitionIntervalId = setInterval(() => {
        if (!abortController.signal.aborted) {
            performRecognitionTask();
        }
    }, REFRESH_TIME * 1000);
}

export function stopRecognitionTasks() {
    if (recognitionIntervalId) {
        clearInterval(recognitionIntervalId);
        recognitionIntervalId = null;
    }
    abortController.abort();
    console.log('Recognition tasks stopped.');
}