import { FilesetResolver, FaceLandmarker } from '/internal_cdn/package0/vision_bundle.mjs';
import { drawFaces } from "./drawFaces.js";
import { videoRef, canvasRef } from '../grid/videoRef.jsx';
import { setCurrFace } from './newFaces.js';
import { overlaySettings } from '../OverlayGui';

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
  let animationFrameId = null; // Track requestAnimationFrame

  export async function startFaceDetection() {
    let video = videoRef.current;
    let canvas = canvasRef.current;
  
    await setupFaceLandmarker();
    if (!video || video.paused || !video.videoWidth || !video.videoHeight) return false;
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
  
    const offscreenCanvas = document.createElement("canvas");
    const offscreenContext = offscreenCanvas.getContext("2d");
  
    let lastFaceBox = null; // Store last detected face position
  
    function stopCurrentLoop() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  
    async function detectAndZoom() {
      if (!video || video.paused) return;
  
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
  
      const mediapipeResult = runFaceDetection(canvas);
      if (mediapipeResult && mediapipeResult.faceLandmarks.length > 0) {
        lastFaceBox = getBoundingBox(mediapipeResult.faceLandmarks[0]);
        drawFaces(mediapipeResult, canvas);
        setCurrFace(mediapipeResult, canvas.toDataURL("image/jpeg", 0.5));
      }
  
      if (!lastFaceBox) {
        animationFrameId = requestAnimationFrame(detectAndZoom);
        return;
      }
  
      // Compute zoomed-in area
      const { sx, sy, sWidth, sHeight } = computeZoomArea(lastFaceBox, canvas.width, canvas.height);
  
      // Draw zoomed-in image using an offscreen canvas
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      offscreenContext.clearRect(0, 0, canvas.width, canvas.height);
      offscreenContext.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
  
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
  
      animationFrameId = requestAnimationFrame(detectAndZoom);
    }
  
    async function detectAndDraw() {
      if (!video || video.paused) return;
  
      context.clearRect(0, 0, canvas.width, canvas.height);
  
      const { cropX, cropY, cropWidth, cropHeight } = calculateCoverCrop(
        video.videoWidth,
        video.videoHeight,
        canvas.width,
        canvas.height
      );
  
      context.drawImage(
        video,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, canvas.width, canvas.height
      );
  
      offscreenCanvas.width = cropWidth;
      offscreenCanvas.height = cropHeight;
      offscreenContext.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  
      const mediapipeResult = runFaceDetection(offscreenCanvas);
      setCurrFace(mediapipeResult, offscreenCanvas.toDataURL("image/jpeg", 0.5));
  
      if (mediapipeResult) drawFaces(mediapipeResult, canvas);
  
      animationFrameId = requestAnimationFrame(detectAndDraw);
    }
  
    function runFaceDetection(inputCanvas) {
      const startTimeMs = performance.now();
      return faceLandmarker.detectForVideo(inputCanvas, startTimeMs);
    }
  
    function computeZoomArea(faceBox, cWidth, cHeight) {
      const { minX, minY, maxX, maxY } = faceBox;
      const faceW = maxX - minX;
      const faceH = maxY - minY;
      const faceCenterX = minX + faceW / 2;
      const faceCenterY = minY + faceH / 2;
  
      const desiredFaceFraction = 0.4;
      const scaleFactor = faceW > 0 ? desiredFaceFraction / faceW : 1.0;
      const clampScale = Math.min(Math.max(scaleFactor, 1.0), 4.0);
  
      const drawW = 1 / clampScale;
      const drawH = 1 / clampScale;
  
      let sourceX = faceCenterX - drawW / 2;
      let sourceY = faceCenterY - drawH / 2;
  
      sourceX = Math.max(0, Math.min(1 - drawW, sourceX));
      sourceY = Math.max(0, Math.min(1 - drawH, sourceY));
  
      return {
        sx: sourceX * cWidth,
        sy: sourceY * cHeight,
        sWidth: drawW * cWidth,
        sHeight: drawH * cHeight
      };
    }
  
    function restartDetection() {
      stopCurrentLoop(); // Stop any existing loop
  
      if (overlaySettings.zoomVideo) {
        detectAndZoom();
      } else {
        detectAndDraw();
      }
    }
  
    // Listen for zoomVideo changes and restart detection
    window.addEventListener("zoomVideoUpdated", restartDetection);
  
    // Start the initial loop
    restartDetection();
  }
  