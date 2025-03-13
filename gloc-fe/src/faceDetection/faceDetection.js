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
    const vision = await FilesetResolver.forVisionTasks('./internal_cdn/package0/wasm');
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `.//internal_cdn/face_landmarker.task`,
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
      if (mediapipeResult && mediapipeResult.faceLandmarks.length > 0) {
          // Crop face region using the extracted bounding box
          const croppedFaceCanvas = cropFaceFromCanvas(mediapipeResult.faceLandmarks[0], offscreenCanvas, canvas.width, canvas.height);
  
          if (croppedFaceCanvas) {
              setCurrFace(mediapipeResult, croppedFaceCanvas.toDataURL("image/jpeg", 0.5));
          }
         drawFaces(mediapipeResult, canvas);

      }
      else{
        setCurrFace(mediapipeResult, offscreenCanvas.toDataURL("image/jpeg", 0.5));
      }

      animationFrameId = requestAnimationFrame(detectAndDraw);
  }
  
  // 🆕 Function to crop and add padding based on face distance
  function cropFaceFromCanvas(faceLandmarks, inputCanvas, canvasWidth, canvasHeight) {
      const faceBox = getBoundingBox(faceLandmarks);
    
      // Convert to pixel coordinates
      let minX = Math.floor(faceBox.minX * canvasWidth);
      let minY = Math.floor(faceBox.minY * canvasHeight);
      let maxX = Math.ceil(faceBox.maxX * canvasWidth);
      let maxY = Math.ceil(faceBox.maxY * canvasHeight);
    
      // Compute original face width and height
      let faceWidth = maxX - minX;
      let faceHeight = maxY - minY;
    
      // ✅ Ensure face is not cropped too small (minimum 10% of canvas width)
      const minFaceSize = canvasWidth * 0.1;
      faceWidth = Math.max(faceWidth, minFaceSize);
      faceHeight = Math.max(faceHeight, minFaceSize);
    
      // ✅ Adaptive Padding: More padding for smaller faces
      const sizeFactor = Math.max(0.1, 1 - (faceWidth / canvasWidth)); // Inversely proportional
      const adaptivePadding = 0.2 + 0.6 * sizeFactor; // Min 20%, Max 80% for small faces
      const paddingX = faceWidth * adaptivePadding;
      const paddingY = faceHeight * adaptivePadding;
    
      // ✅ Apply padding while ensuring within bounds
      minX = Math.max(0, minX - paddingX);
      minY = Math.max(0, minY - paddingY);
      maxX = Math.min(canvasWidth, maxX + paddingX);
      maxY = Math.min(canvasHeight, maxY + paddingY);
    
      // Recalculate width/height after padding
      faceWidth = maxX - minX;
      faceHeight = maxY - minY;
  
      // ✅ Create cropped face canvas
      const croppedFaceCanvas = document.createElement("canvas");
      const croppedFaceContext = croppedFaceCanvas.getContext("2d");
      
      croppedFaceCanvas.width = faceWidth;
      croppedFaceCanvas.height = faceHeight;
      
      croppedFaceContext.drawImage(
          inputCanvas,
          minX, minY, faceWidth, faceHeight, // Source (from full image)
          0, 0, faceWidth, faceHeight         // Destination (cropped face)
      );
  
      return croppedFaceCanvas;
  }
  
    function runFaceDetection(inputCanvas) {
      const startTimeMs = performance.now();
      return faceLandmarker.detectForVideo(inputCanvas, startTimeMs);
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
  