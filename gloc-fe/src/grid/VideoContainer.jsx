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
        startFaceDetection(); // Call startFaceDetection on play
      };

      const handlePause = () => {
        setIsPlaying(false);
        resetCurrFace(); // Call resetCurrFace on pause
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
      } else {
        video.pause();
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

export default VideoContainer;