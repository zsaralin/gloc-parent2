import React, { useEffect, useState } from "react";
import "./LoadingScreen.css";
import { overlaySettings } from '../OverlayGui';

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleShowLoading = () => {
      setIsVisible(true);
      startLoading();
    };

    window.addEventListener('showLoadingScreen', handleShowLoading);

    return () => {
      window.removeEventListener('showLoadingScreen', handleShowLoading);
    };
  }, []);

  return (
    <div id="loading-screen" className="loading-screen" >
      <div className="loading-overlay"></div>
      <div className="loading-bar-container">
        <div className="loading-bar">
          <div id="loading-fill" className="loading-fill"></div>
        </div>
        <div id="loading-prompt" className="loading-prompt">Extracting facial landmarks...</div>
      </div>
    </div>
  );
};

export default LoadingScreen;

export const startLoading = () => {
  const duration = overlaySettings.loadingDuration * 1000; // Get the latest loading duration

  const loadingFill = document.getElementById("loading-fill");
  const loadingScreen = document.getElementById("loading-screen");
  const promptElement = document.getElementById("loading-prompt");

  if (!loadingScreen) return;

  // loadingScreen.style.display = "block"; // Show loading screen
  loadingScreen.style.opacity = "1"; // Reset opacity for re-use

  const prompts = [
    "Extracting facial landmarks...",
    "Sending numerical description...",
    "Comparing biometric data...",
    "Searching through database for similarities...",
    "Retrieving top matches"
  ];

  // Add a slight delay before starting
  setTimeout(() => {
    // Start the animation
    if (loadingFill) {
      console.log('starting LOADINGGGG')
      loadingFill.style.animation = `loadingAnimation ${duration}ms ease-in-out forwards`;
    }

    // Update prompts at specific times
    if (promptElement) {
      const promptTimings = [
        0, // First prompt is already set
        duration * 0.8,
        duration * 0.4,
        duration * 0.6,
        duration * 0.9
      ];

      for (let i = 1; i < prompts.length; i++) {
        setTimeout(() => {
          promptElement.innerText = prompts[i];
        }, promptTimings[i]);
      }
    }

    // Fade out the loading screen after loading finishes
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.transition = "opacity 1s ease";
        loadingScreen.style.opacity = "0"; // Fade out
        setTimeout(() => {
          loadingScreen.style.display = "none"; // Hide after fade-out
        }, 1000); // Match fade-out duration
      }
    }, duration); // Sync with total loading duration
  }, 2000); // Add a small delay before starting
};
