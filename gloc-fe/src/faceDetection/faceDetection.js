import { FilesetResolver, FaceLandmarker } from '/internal_cdn/package0/vision_bundle.mjs';
import { drawFaces } from "./drawFaces.js";
import { videoRef, canvasRef } from '../grid/videoRef.jsx';
import { setCurrFace } from './newFaces.js';
export let faceLandmarker;
let setupPromise;

export async function setupFaceLandmarker() {
    if (setupPromise) return setupPromise; // Return the same promise if already in progress
    setupPromise = (async () => {
        console.log('Setting up FaceLandmarker...');
        const vision = await FilesetResolver.forVisionTasks('/internal_cdn/package0/wasm');
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `/internal_cdn/face_landmarker.task`,
                delegate: "GPU",
            },
            outputFaceBlendshapes: false,
            runningMode: 'VIDEO',
        });
        console.log('FaceLandmarker setup complete.');
    })();
    return setupPromise;
}

export async function startFaceDetection() {
    let video = videoRef.current
    let canvas = canvasRef.current
    await setupFaceLandmarker(); // Ensure setup happens only once
    console.log(video)
    if (!video || video.paused || !video.videoWidth || !video.videoHeight) return false;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    async function detectAndDraw() {
        if (!video || video.paused) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
        const imageDataURL = canvas.toDataURL('image/jpeg', .5); // Adjust quality

        const startTimeMs = performance.now();
        
        const mediapipeResult = faceLandmarker.detectForVideo(canvas, startTimeMs);
        setCurrFace(mediapipeResult, imageDataURL); // Update face processing with detected results

        if (mediapipeResult) drawFaces(mediapipeResult, canvas);

        requestAnimationFrame(detectAndDraw);
    }

    detectAndDraw();
}
