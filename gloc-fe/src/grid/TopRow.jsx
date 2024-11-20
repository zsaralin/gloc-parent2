import React, { useRef, useEffect, useState } from 'react';
import './TopRow.css';
import { startFaceDetection } from '../faceDetection/faceDetection';

function TopRow() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [numItems, setNumItems] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);

  useEffect(() => {
    // Initialize video stream from webcam
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          if (videoRef.current && canvasRef.current) {
            startFaceDetection(videoRef.current, canvasRef.current);
          }
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    startVideo();

  }, []);

  useEffect(() => {
    // Function to update layout based on screen size
    const updateLayout = () => {
      const isWideScreen = window.innerWidth > window.innerHeight;
      const rowHeightVh = isWideScreen ? 40 : 25; // 50vh for wide, 25vh for long screens
      const aspectRatioVideo = isWideScreen ? 12 / 9 : 8 / 12; // 16:9 for wide, 8:12 for long
      const aspectRatioItem = 9 / 12; // 3:4 for other items

      // Convert vh to pixels
      const viewportHeight = window.innerHeight;
      const rowHeightPx = (rowHeightVh / 100) * viewportHeight;

      // Calculate video width based on aspect ratio
      const videoWidth = rowHeightPx * aspectRatioVideo;

      // Calculate remaining width
      const viewportWidth = window.innerWidth;
      const gap = 0; // Gap between items in pixels
      const remainingWidth = viewportWidth - videoWidth - gap;

      // Calculate width of one other item based on its aspect ratio
      const itemWidthPx = rowHeightPx * (9 / 16); // 9:12 aspect ratio = width = height * (12/9)

      // Calculate number of items that can fit
      const possibleNumItems = Math.floor((remainingWidth + gap) / (itemWidthPx + gap));
      setNumItems(possibleNumItems > 0 ? possibleNumItems : 0);
      setItemWidth(remainingWidth/possibleNumItems);

      // Set CSS variables for dynamic styling
      document.documentElement.style.setProperty('--video-height', `${rowHeightVh}vh`);
      document.documentElement.style.setProperty('--video-aspect-ratio', `${aspectRatioVideo}`);
      document.documentElement.style.setProperty('--gap', `${gap}px`);
    };

    // Initial layout calculation
    updateLayout();

    // Update layout on window resize
    window.addEventListener('resize', updateLayout);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  return (
    <div className="top-row">
      {/* Video Grid Item */}
      <div className="video-container">
      <video ref={videoRef} className="video" muted></video>

      <canvas ref={canvasRef} className="video-canvas"></canvas>
      </div>

      {/* Other Grid Items */}
      {[...Array(numItems)].map((_, index) => (
        <div
          className="other-item"
          key={index}
          style={{ width: `${itemWidth}px` }}
        ></div>
      ))}
    </div>
  );
}

export default TopRow;
