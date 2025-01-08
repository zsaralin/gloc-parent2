import { FilesetResolver, FaceLandmarker } from '/internal_cdn/package0/vision_bundle.mjs';
import { drawFaces } from "./drawFaces.js";
import { videoRef, canvasRef } from '../grid/videoRef.jsx';
import { setCurrFace } from './newFaces.js';

export let faceLandmarker;
let setupPromise;

/**
 * Helper to replicate "object-fit: cover" math:
 * Computes how to crop the source video so it fills the destination with no empty space.
 */
function calculateCoverCrop(srcWidth, srcHeight, destWidth, destHeight) {
  const srcAspect = srcWidth / srcHeight;
  const destAspect = destWidth / destHeight;

  let cropWidth = srcWidth;
  let cropHeight = srcHeight;
  let cropX = 0;
  let cropY = 0;

  if (srcAspect > destAspect) {
    // Crop left/right
    cropWidth = Math.floor(destAspect * srcHeight);
    cropX = Math.floor((srcWidth - cropWidth) / 2);
  } else {
    // Crop top/bottom
    cropHeight = Math.floor(srcWidth / destAspect);
    cropY = Math.floor((srcHeight - cropHeight) / 2);
  }

  return { cropX, cropY, cropWidth, cropHeight };
}

export async function setupFaceLandmarker() {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    console.log('Setting up FaceLandmarker...');
    const vision = await FilesetResolver.forVisionTasks('../dist/internal_cdn/package0/wasm');
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `../dist//internal_cdn/face_landmarker.task`,
        delegate: "GPU",
      },
      outputFaceBlendshapes: false,
      runningMode: 'VIDEO',
    });
    console.log('FaceLandmarker setup complete.');
  })();

  return setupPromise;
}

function getBoundingBox(landmarks) {
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    landmarks.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });
    return { minX, minY, maxX, maxY };
  }
  export async function startFaceDetection() {
    let video = videoRef.current;
    let canvas = canvasRef.current;
  
    await setupFaceLandmarker();
  
    if (!video || video.paused || !video.videoWidth || !video.videoHeight) return false;
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
  
    const offscreenCanvas = document.createElement('canvas');
    const offscreenContext = offscreenCanvas.getContext('2d');
  
    let lastFaceBox = null; // Store last detected face position
  
    async function detectAndZoom() {
      if (!video || video.paused) return;
  
      const { videoWidth, videoHeight } = video;
      const { width: cWidth, height: cHeight } = canvas;
  
      context.clearRect(0, 0, cWidth, cHeight);
  
      // 1️⃣ Draw the full video frame onto the **main canvas**
      context.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, cWidth, cHeight);
  
      // 2️⃣ Detect faces from the **main canvas**
      const startTimeMs = performance.now();
      const mediapipeResult = faceLandmarker.detectForVideo(canvas, startTimeMs);
  
      if (mediapipeResult && mediapipeResult.faceLandmarks.length > 0) {
        const faceLandmarks = mediapipeResult.faceLandmarks[0];
        lastFaceBox = getBoundingBox(faceLandmarks); // Update last known face box
  
        // Draw detected faces directly on the main canvas (before cropping)
        drawFaces(mediapipeResult, canvas);
  
        // Save detected face for external processing
        const imageDataURL = canvas.toDataURL('image/jpeg', 0.5);
        setCurrFace(mediapipeResult, imageDataURL);
      }
  
      if (!lastFaceBox) {
        // No face detected before → keep last known frame
        requestAnimationFrame(detectAndZoom);
        return;
      }
  
      // 3️⃣ Extract the last known **face bounding box**
      const { minX, minY, maxX, maxY } = lastFaceBox;
      const faceW = maxX - minX;
      const faceH = maxY - minY;
      const faceCenterX = minX + faceW / 2;
      const faceCenterY = minY + faceH / 2;
  
      // 4️⃣ Compute zoom level (keeping face at 50% of view)
      const desiredFaceFraction = 0.4;
      const scaleFactor = faceW > 0 ? desiredFaceFraction / faceW : 1.0;
      const clampScale = Math.min(Math.max(scaleFactor, 1.0), 4.0);
  
      const drawW = 1 / clampScale;
      const drawH = 1 / clampScale;
  
      let sourceX = faceCenterX - drawW / 2;
      let sourceY = faceCenterY - drawH / 2;
  
      if (sourceX < 0) sourceX = 0;
      if (sourceY < 0) sourceY = 0;
      if (sourceX + drawW > 1) sourceX = 1 - drawW;
      if (sourceY + drawH > 1) sourceY = 1 - drawH;
  
      // 5️⃣ Crop the **already drawn canvas** to zoom and center the face
      const sx = sourceX * cWidth;
      const sy = sourceY * cHeight;
      const sWidth = drawW * cWidth;
      const sHeight = drawH * cHeight;
  
      // 6️⃣ Use an offscreen canvas to avoid frame overlap
      offscreenCanvas.width = cWidth;
      offscreenCanvas.height = cHeight;
      offscreenContext.clearRect(0, 0, cWidth, cHeight);
      offscreenContext.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, cWidth, cHeight);
  
      // 7️⃣ Copy the **zoomed-in** face back to the main canvas
      context.clearRect(0, 0, cWidth, cHeight);
      context.drawImage(offscreenCanvas, 0, 0, cWidth, cHeight);
  
      requestAnimationFrame(detectAndZoom);
    }
  
    detectAndZoom();
  }
  