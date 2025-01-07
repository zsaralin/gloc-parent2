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
  let video = videoRef.current;
  let canvas = canvasRef.current;

  await setupFaceLandmarker();

  if (!video || video.paused || !video.videoWidth || !video.videoHeight) return false;

  // Make sure the canvas matches the displayed size
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d');

  // **Offscreen canvas** for cropped face detection
  const offscreenCanvas = document.createElement('canvas');
  const offscreenContext = offscreenCanvas.getContext('2d');

  async function detectAndDraw() {
    if (!video || video.paused) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Compute crop area
    const { cropX, cropY, cropWidth, cropHeight } = calculateCoverCrop(
      video.videoWidth,
      video.videoHeight,
      canvas.width,
      canvas.height
    );

    // 1️⃣ Draw the visible video portion on the main canvas
    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight, // Source crop
      0, 0, canvas.width, canvas.height // Destination
    );

    // 2️⃣ Use a separate offscreen canvas for face detection
    offscreenCanvas.width = cropWidth;
    offscreenCanvas.height = cropHeight;
    offscreenContext.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // 3️⃣ Run face detection on **only the cropped offscreen canvas**
    const startTimeMs = performance.now();
    const mediapipeResult = faceLandmarker.detectForVideo(offscreenCanvas, startTimeMs);

    // Debug: Draw a border to verify the detection area
    // context.strokeStyle = "red";
    // context.lineWidth = 2;
    context.strokeRect(0, 0, canvas.width, canvas.height);

    // Update face tracking
    const imageDataURL = offscreenCanvas.toDataURL('image/jpeg', 0.5);
    setCurrFace(mediapipeResult, imageDataURL);

    // Draw detected faces
    if (mediapipeResult) {
      drawFaces(mediapipeResult, canvas);
    }

    requestAnimationFrame(detectAndDraw);
  }

  detectAndDraw();
}
