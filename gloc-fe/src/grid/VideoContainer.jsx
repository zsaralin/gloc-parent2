import React, { useEffect, useState } from 'react';
import { videoRef, canvasRef } from './videoRef.jsx';
import './VideoContainer.css';
import { isShuffling } from '../updateGrid/shuffleManagerService.js';
import { startFaceDetection } from '../faceDetection/faceDetection.js';
import { resetCurrFace } from '../faceDetection/newFaces.js';

let setProgressGlobal;

function VideoContainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    setProgressGlobal = setProgress;
    
    const videoElement = videoRef.current;
    if (videoElement) {
      const handlePlay = () => {
        setIsPlaying(true);
        resetProgressBar()

        startFaceDetection(); // Call startFaceDetection on play
      };

      const handlePause = () => {
        setIsPlaying(false);
        resetCurrFace(); // Call resetCurrFace on pause
        pauseProgressBar()

      };

      // Attach event listeners
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);

      // Cleanup event listeners
      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
      };
    }
  }, []);

  function togglePlayPause() {
    const video = videoRef.current;
    if (isShuffling()) return;

    if (video && video.readyState >= 2) {
      if (video.paused) {
        video.play();
        resetProgressBar()
      } else {
        video.pause();
        pauseProgressBar()
      }
    }
  }

  return (
    <div className="video-container">
      <video ref={videoRef} className="video" muted playsInline webkitplaysinline="true"></video>
      <canvas ref={canvasRef} className="video-canvas"></canvas>
      
      <div id="face-detect-text"></div>
      <button className="play-pause-button" onClick={togglePlayPause}>
        <i className={`fa ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
      </button>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
let progressInterval = null; // Store the interval globally

export function resetProgressBar() {
  const progressBarElement = document.querySelector('.progress-bar');
  if (progressBarElement) {
    progressBarElement.style.transition = 'none'; // Instantly reset
    progressBarElement.style.width = '0%';

    // Force reflow (causes browser to register the width change)
    void progressBarElement.offsetWidth;

    requestAnimationFrame(() => {
      progressBarElement.style.transition = 'width var(--progress-duration, 5s) linear';
    });
  }
}

export function startProgressBar(durationInSeconds) {
  const video = videoRef.current;

  if (video.paused) {
    return
  }
  resetProgressBar(); // Reset before starting
  console.log('starting progress bar ');
  
  const progressBarElement = document.querySelector('.progress-bar');
  if (progressBarElement) {
    progressBarElement.style.setProperty('--progress-duration', `${durationInSeconds}s`);

    requestAnimationFrame(() => {
      progressBarElement.style.width = '100%'; // Smoothly animates via CSS
    });
  }
}

export function fastForwardProgressBar(fastDurationInSeconds = 0.3) {
  const video = videoRef.current;

  if (video.paused) {
    return
  }
  const progressBarElement = document.querySelector('.progress-bar');
  if (!progressBarElement) return;

  const totalWidth = progressBarElement.parentElement.offsetWidth;
  const currentWidth = progressBarElement.offsetWidth;
  const currentPercent = (currentWidth / totalWidth) * 100;
  const remainingPercent = 100 - currentPercent;
  if(remainingPercent < 25){
    return
  }
  // 1. Instantly stop current transition and fix current width
  progressBarElement.style.transition = 'none';
  progressBarElement.style.width = `${currentPercent}%`;

  // 2. Force reflow
  void progressBarElement.offsetWidth;

  // 3. Apply fast forward transition
  progressBarElement.style.transition = `width ${fastDurationInSeconds}s linear`;
  progressBarElement.style.width = '100%';

  console.log(`Fast forwarding from ${currentPercent.toFixed(1)}%`);
}

export function pauseProgressBar() {
  const progressBarElement = document.querySelector('.progress-bar');
  if (!progressBarElement) return;

  const totalWidth = progressBarElement.parentElement.offsetWidth;
  const currentWidth = progressBarElement.offsetWidth;
  const currentPercent = (currentWidth / totalWidth) * 100;

  // Stop current transition and fix current width
  progressBarElement.style.transition = 'none';
  progressBarElement.style.width = `${currentPercent}%`;

  console.log(`Progress bar paused at ${currentPercent.toFixed(1)}%`);
}
export default VideoContainer;