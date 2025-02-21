import React, { useEffect, useState } from 'react';
import { videoRef, canvasRef } from './videoRef.jsx';
import './VideoContainer.css';
import { isShuffling } from '../updateGrid/shuffleManagerService.js';
import { startFaceDetection } from '../faceDetection/faceDetection.js';
import { resetCurrFace } from '../faceDetection/newFaces.js';

function VideoContainer() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
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
    </div>
  );
}

export default VideoContainer;
