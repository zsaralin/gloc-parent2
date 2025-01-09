

import {  FaceLandmarker } from '/internal_cdn/package0/vision_bundle.mjs';
// import {drawBox, drawLandmarks} from "../uiElements/sidePanel.js";

export function drawFacialFeatures(ctx, landmarks, opacity, color) {
     drawFaceBox(ctx, landmarks, opacity, color);
        drawMouth(ctx, landmarks, opacity, color); // Mouth
        drawEyesWithCurves(ctx, landmarks, opacity, color); // Left eye
        drawNose(ctx, landmarks, opacity, color)
        drawNoseCurve(ctx, landmarks, opacity, color)
        drawEyebrows(ctx, landmarks, opacity, color)
        drawOval(ctx, landmarks, opacity, color)
    
}

function drawNoseCurve(ctx, landmarks, opacity, color) {
    ctx.strokeStyle = `rgba(${color}, ${opacity})`; // Set the stroke style with opacity

    const noseLeft = { x: landmarks[240].x * ctx.canvas.width, y: landmarks[240].y * ctx.canvas.height };
    const noseCenter = { x: landmarks[164].x * ctx.canvas.width, y: landmarks[164].y * ctx.canvas.height };
    const noseRight = { x: landmarks[460].x * ctx.canvas.width, y: landmarks[460].y * ctx.canvas.height };
    ctx.beginPath();
    ctx.moveTo(noseLeft.x, noseLeft.y);
    ctx.bezierCurveTo(noseLeft.x, noseLeft.y, noseCenter.x, noseCenter.y, noseRight.x, noseRight.y);
    ctx.stroke();
    ctx.closePath();
}

function drawEyebrows(ctx, landmarks, opacity, color) {
    ctx.strokeStyle = `rgba(${color}, ${opacity})`; // Set the stroke style with opacity
    ctx.beginPath();

    const rightEyebrowTopIndices = [336, 296, 334, 293, 300]; // Adjust these indices according to your needs
    const rightEyebrowBottomIndices = [285, 295, 334, 283, 276]; // Adjust these indices according to your needs
    const rightEyebrowMidpoints = calculateMidpoints(rightEyebrowTopIndices, rightEyebrowBottomIndices, landmarks);
    drawEyebrowBezier(rightEyebrowMidpoints);

    const leftEyebrowTopIndices = [70, 63, 105, 66, 107]; // Adjust these indices according to your needs
    const leftEyebrowBottomIndices = [46, 53, 105, 65, 55]; // Adjust these indices according to your needs
    const leftEyebrowMidpoints = calculateMidpoints(leftEyebrowTopIndices, leftEyebrowBottomIndices, landmarks);
    drawEyebrowBezier(leftEyebrowMidpoints);

    function calculateMidpoints(topIndices, bottomIndices, landmarks) {
        let midpoints = [];
        for (let i = 0; i < topIndices.length; i++) {
            const topPoint = landmarks[topIndices[i]];
            const bottomPoint = landmarks[bottomIndices[i]];
            const midpoint = {
                x: (topPoint.x + bottomPoint.x) / 2 * ctx.canvas.width,
                y: (topPoint.y + bottomPoint.y) / 2 * ctx.canvas.height,
            };
            midpoints.push(midpoint);
        }
        return midpoints;
    }

    function drawEyebrowBezier(midpoints) {
        if (midpoints.length < 3) return; // Ensure there are enough points for a curve
        const start = midpoints[0];
        const end = midpoints[midpoints.length - 1];
        const control = midpoints[Math.floor(midpoints.length / 2)]; // Use the midpoint as the control point

        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
        ctx.stroke();
    }
    ctx.closePath();
}

function drawFaceBox(ctx, landmarks, opacity, color) {
    ctx.strokeStyle = `rgba(${color}, ${opacity})`; // Set the stroke style with opacity
    ctx.beginPath();

    const horizontalPadding = 30;
    const verticalPadding = 10;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    landmarks.forEach(landmark => {
        if (landmark.x < minX) minX = landmark.x;
        if (landmark.x > maxX) maxX = landmark.x;
        if (landmark.y < minY) minY = landmark.y;
        if (landmark.y > maxY) maxY = landmark.y;
    });

    // Calculate dimensions and apply padding
    const boxWidth = (maxX - minX) * ctx.canvas.width + horizontalPadding;
    const boxHeight = (maxY - minY) * ctx.canvas.height + verticalPadding;

    // Adjusting start position based on padding and min coordinates
    const startX = minX * ctx.canvas.width - horizontalPadding / 2;
    const startY = minY * ctx.canvas.height - verticalPadding / 2;

    ctx.rect(startX, startY, boxWidth, boxHeight);
    ctx.stroke();
    ctx.closePath();
}

function drawNose(ctx, landmarks, opacity, color) {
    ctx.strokeStyle = `rgba(${color}, ${opacity})`; // Set the stroke style with opacity
    ctx.beginPath();

    const noseBottom = { x: landmarks[4].x * ctx.canvas.width, y: landmarks[4].y * ctx.canvas.height };
    const noseTop = { x: landmarks[6].x * ctx.canvas.width, y: landmarks[6].y * ctx.canvas.height };
    const start = noseBottom;
    const end = noseTop;
    if (start && end) {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y - 20);
        ctx.stroke();
    }
    ctx.closePath();
}

function drawOval(ctx, landmarks, opacity, color) {
    ctx.strokeStyle = `rgba(${color}, ${opacity})`; // Set the stroke style with opacity
    ctx.beginPath();

    const ovalCoordinates = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
    const startPoint = landmarks[ovalCoordinates[0].start];
    ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
    for (let i = 0; i < ovalCoordinates.length; i++) {
        const endIdx = ovalCoordinates[i].end;
        const end = landmarks[endIdx];
        ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawMouth(ctx, landmarks, opacity, color) {
    ctx.strokeStyle = `rgba(${color}, ${opacity})`; // Set the stroke style with opacity
    ctx.beginPath();

    const lipLandmarks = FaceLandmarker.FACE_LANDMARKS_LIPS;
    for (let i = 0; i < lipLandmarks.length; i++) {
        const start = landmarks[lipLandmarks[i].start];
        const end = landmarks[lipLandmarks[i].end];
        const startX = start.x * ctx.canvas.width;
        const startY = start.y * ctx.canvas.height;
        const endX = end.x * ctx.canvas.width;
        const endY = end.y * ctx.canvas.height;
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawEyesWithCurves(ctx, landmarks, opacity, color) {
    ctx.strokeStyle = `rgba(${color}, ${opacity})`; // Set the stroke style with opacity

    const leftEyeLandmarks = FaceLandmarker.FACE_LANDMARKS_LEFT_EYE;
    const rightEyeLandmarks = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE;

    // Draw left eye
    ctx.beginPath();
    for (let i = 0; i < leftEyeLandmarks.length; i++) {
        const start = landmarks[leftEyeLandmarks[i].start];
        const end = landmarks[leftEyeLandmarks[i].end];
        ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
        ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw right eye
    ctx.beginPath();
    for (let i = 0; i < rightEyeLandmarks.length; i++) {
        const start = landmarks[rightEyeLandmarks[i].start];
        const end = landmarks[rightEyeLandmarks[i].end];
        ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
        ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
    }
    ctx.closePath();
    ctx.stroke();
}
