import React, { useState, useEffect, useRef } from "react";
import "./LandingPage.css";
import { videoRef, canvasRef } from "../grid/videoRef";
import { startFaceDetection } from "../faceDetection/faceDetection";
import { startShuffle } from "../updateGrid/shuffleManagerService";

function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLandingVisible, setIsLandingVisible] = useState(true); // Manage landing page visibility
  const isInitializedRef = useRef(false); // Track if face detection and shuffle have been initialized

  const handleAccessCamera = async () => {
    setIsLoading(true);
  
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // Use front camera if available
        }
      };
  
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
  
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
  
          if (!isInitializedRef.current) {
            isInitializedRef.current = true; // Mark as initialized
  
            try {
              console.log("🚀 Starting Face Detection...");
              await startFaceDetection(); 
              console.log("✅ Face Detection Initialized");
  
              console.log("🔄 Starting Shuffle...");
              await startShuffle(); 
              console.log("✅ Shuffle Initialized");
  
              setIsLandingVisible(false); // Hide the landing page
            } catch (error) {
              console.error("❌ Error in Face Detection or Shuffle:", error);
            }
          }
        };
      }
    } catch (error) {
      console.error("❌ Camera access denied:", error);
      alert("Camera access is required to proceed.");
      setIsLoading(false);
    }
  };
  

  // Cleanup effect: Stop camera when the component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop()); // Stop all video tracks
      }
    };
  }, []);

  return (
    <div className={`grid-overlay ${isLandingVisible ? "visible" : "hidden"}`}>
      <button className="language-button">ENGLISH</button>
      <div className="overlay-content">
        <header className="header">
          <h1>Global Level of Confidence</h1>
        </header>
        <main className="content">
          <p>[Placeholder for Project Info]</p>
          <p>[Placeholder for Legal Lease]</p>
          <ul>
            <li>We will require access to your camera.</li>
            <li>Your facial landmarks will be extracted.</li>
            <li>No data is retained.</li>
          </ul>
          <button
            className="camera-button"
            onClick={handleAccessCamera}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            ) : (
              "Access My Camera"
            )}
          </button>
        </main>
      </div>
    </div>
  );
}

export default LandingPage;
