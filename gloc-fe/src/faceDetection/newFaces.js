// import {
//     abortController,
//     clearRecognitionIntervals,
//     resetAbortController,
//     startFaceRecognition
// } from "../faceRecognition/faceRecognition.js";
// import {clearCurrFaceDescriptor} from "../faceRecognition/faceRecognitionFetcher.js";
// import {createNewScoresDB, deletePrevScoresDB, generateUUID} from "../uuid.js";
// import {shuffleActive} from "../imageGrid/startShuffle.js";

// export let newFace = false;
// export let currFace = null;


// export function setCurrFace(mediapipeResult, imageDataUrl) {
//     if (!imageDataUrl) return;  // Exit if no image data is provided

//     if (mediapipeResult && mediapipeResult.faceLandmarks.length > 0) {
//         updateFaceDetection(mediapipeResult, imageDataUrl);
//     } else {
//         handleNoFaceDetected();
//     }
// }

// function updateFaceDetection(mediapipeResult, imageDataUrl) {
//     if (!currFace) {
//         currFace = imageDataUrl;
//         handleNewFaceDetection(mediapipeResult);
//     } else {
//         currFace = imageDataUrl;  // Always update with the latest image
//     }
//     document.getElementById('face-detect-text').innerHTML = "Face located"
// }

// function handleNewFaceDetection(mediapipeResult) {
//     console.log('New face detected');
//     newFace = true;
//     generateUUID();  // Assume UUID generation is needed for session tracking
//     resetAbortController();
//     startFaceRecognition();
// }

// function handleNoFaceDetected() {
//     if (!shuffleActive) {
//         clearRecognitionResources();
//     }
//     document.getElementById('face-detect-text').innerHTML = "Locating a face..."

// }

// function clearRecognitionResources() {
//     currFace = null;
//     clearCurrFaceDescriptor();
//     clearRecognitionIntervals();
//     abortController.abort();
//     deletePrevScoresDB();
// }

// export function resetCurrFace() {
//     currFace = null;
// }