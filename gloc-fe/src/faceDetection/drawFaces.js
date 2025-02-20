// import {isEyeDistanceAboveThreshold} from "../minEyeDist.js";
import {drawFacialFeatures} from "./drawFacialFeatures.js";

let canvasWidth;
let canvas;
let canvasHeight;
let ctx = false;
let canvasCleared = false;
let landmarkOpacity = 1;
let landmarkColour = '255,255,255'
let fadeInColour = '0,0,0'
const FADE_DUR = 2

// fade in face when video.paused --> video.play
export function startNewFaces() {
    ctx.clearRect(0, 0, canvasWidth, canvasWidth);
    landmarkOpacity = 0; // Increase landmark opacity by 0.1
    let intervalId = setInterval(increaseLandmarkOpacity, 10);

    function increaseLandmarkOpacity() {
        landmarkOpacity += 0.01; // Increase landmark opacity by 0.1
        if (landmarkOpacity >= 1) {
            clearInterval(intervalId); // Stop the interval when opacity reaches 1
        }
    }
}

export function drawFaces(mediapipeResult, canvas) {
    if (!ctx) setupCanvas(canvas);
    
    if (!mediapipeResult || mediapipeResult.faceLandmarks.length === 0) {
        clearCanvas(canvas); // Ensure clearCanvas is defined
        return;
    }

    const landmarks = mediapipeResult.faceLandmarks[0];
    if (!canvasCleared) {
        // ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        canvas.style.opacity = 1;

        // Ensure the line width and styles are set before drawing
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(${landmarkColour}, ${landmarkOpacity})`;

        if (landmarkColour === fadeInColour) {
            changeStrokeStyleWithTransition(landmarkColour, '255, 255, 255');
        }

        drawFacialFeatures(ctx, landmarks, landmarkOpacity, landmarkColour);
    }
}

export function setupCanvas(canvas) {
    canvasCleared = false;
    console.log('Setting up canvas');
    landmarkOpacity = 1;

    if (canvas) {
        console.log('Canvas context setup');
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Log the initial lineWidth to debug
        console.log(`Initial lineWidth: ${ctx.lineWidth}`);
        ctx.lineWidth = 3; // Set the line width
        ctx.strokeStyle = `rgba(${landmarkColour}, ${landmarkOpacity})`;
        ctx.fillStyle = `rgba(${landmarkColour}, ${landmarkOpacity})`;

        canvasWidth = canvas.width;
        canvasHeight = canvas.height;

        // Confirm lineWidth was set correctly
        console.log(`Configured lineWidth: ${ctx.lineWidth}`);
    }
}
function clearCanvas(canvas) {
    if (!canvasCleared) {
        canvasCleared = true;
        canvas.style.transition = `opacity ${FADE_DUR}s ease`;
        canvas.style.opacity = '0.1'

        setTimeout(() => {
            ctx.clearRect(0, 0, canvasWidth, canvasWidth);
            landmarkColour = fadeInColour
            canvasCleared = false;
            }, FADE_DUR * 1000);
    }
}

function changeStrokeStyleWithTransition(startColor, endColor) {
    const currentRGB = startColor.match(/\d+/g).map(Number);
    const endRGB = endColor.match(/\d+/g).map(Number);

    const diffRGB = endRGB.map((endVal, index) => endVal - currentRGB[index]);

    const interval = 1000 * FADE_DUR / Math.max(...diffRGB.map(Math.abs));

    function updateStrokeStyle() {
        currentRGB.forEach((currentVal, index) => {
            currentRGB[index] += Math.sign(diffRGB[index]) * Math.ceil(interval);
        });

        landmarkColour = `${currentRGB.join(",")}`;
        if (currentRGB[0] >= endRGB[0]) {
            return; // Stop if the first RGB component reaches or exceeds the end color
        }

        setTimeout(updateStrokeStyle, interval);
    }

    updateStrokeStyle();
}