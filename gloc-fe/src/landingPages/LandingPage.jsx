import React, { useState, useEffect, useRef } from "react";
import "./LandingPage.css";
import { videoRef, canvasRef } from "../grid/videoRef";
import { startFaceDetection } from "../faceDetection/faceDetection";
import { startShuffle } from "../updateGrid/shuffleManagerService";
function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLandingVisible, setIsLandingVisible] = useState(true); // Manage landing page visibility
  const isInitializedRef = useRef(false); // Track if face detection and shuffle have been initialized

  // Function to update grid dimensions dynamically
  const updateGridSize = () => {
    const preferredCellSize = 40; // Preferred base size (adjustable)
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Calculate exact column and row sizes
    const cols = Math.floor(width / preferredCellSize);
    const rows = Math.floor(height / preferredCellSize);

    // Compute exact cell width and height to ensure a perfect fit
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    // Apply computed values as CSS variables
    document.documentElement.style.setProperty("--grid-cell-width", `${cellWidth}px`);
    document.documentElement.style.setProperty("--grid-cell-height", `${cellHeight}px`);
  };

  useEffect(() => {
    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  const handleAccessCamera = async () => {
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (stream) {
        localStorage.setItem("cameraAccessGranted", "true");

        // Assign stream to videoRef
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Add an onplaying handler for the first-time initialization
          videoRef.current.onplaying = async () => {
            if (!isInitializedRef.current) {
              isInitializedRef.current = true; // Mark as initialized
              try {
                await startFaceDetection(); // Start face detection
                await startShuffle(); // Start shuffle manager
                setIsLandingVisible(false); // Hide the landing page
              } catch (error) {
                console.error("Error during initialization:", error);
              }
            }
          };

          // Play the video
          await videoRef.current.play();
        }
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      alert("Camera access is required to proceed.");
      setIsLoading(false); // Reset loading state on error
    }
  };
  return (
    <div
      className={`grid-overlay ${isLandingVisible ? "visible" : "hidden"}`}
    >
      <button className="language-button">ENGLISH</button>
      <div className="overlay-content">
        <header className="header">
          <h1>Global Level of Caaaaonfidence</h1>
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
