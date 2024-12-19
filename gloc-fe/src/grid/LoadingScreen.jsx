import React, { useEffect } from "react";
import "./LoadingScreen.css";
import { LOADING_DUR } from "../config";
const LoadingScreen = () => {
  useEffect(() => {
    // Set the initial prompt before any animation starts
    const promptElement = document.getElementById("loading-prompt");
    if (promptElement) {
      promptElement.innerText = "Extracting facial landmarks...";
    }
  }, []);

  return (
    <div id="loading-screen" className="loading-screen">
      <div className="loading-overlay"></div>
      <div className="loading-bar-container">
        <div className="loading-bar">
          <div id="loading-fill" className="loading-fill"></div>
        </div>
        <div id="loading-prompt" className="loading-prompt"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
export const startLoading = () => {
  const duration = LOADING_DUR * 1000;
  const loadingFill = document.getElementById("loading-fill");
  const loadingScreen = document.getElementById("loading-screen");
  const promptElement = document.getElementById("loading-prompt");

  const prompts = [
    "Extracting facial landmarks...",
    "Sending numerical description...",
    "Comparing biometric data...",
    "Searching through database for similarities...",
    "Retrieving top matches",
  ];

  // Add a one-second delay before starting
  setTimeout(() => {
    // Start the animation
    if (loadingFill) {
      loadingFill.style.animation = `loadingAnimation ${duration}ms ease-in-out forwards`;
    }

    // Update prompts at specific times
    if (promptElement) {
      const promptTimings = [
        0, // First prompt is already set
        duration * 0.1666, // After the pause (16.66% of duration)
        duration * 0.375,  // Next prompt
        duration * 0.5833, // Next prompt
        duration * 0.7916, // Final prompt
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
  }, 100); // Add a 1-second delay before starting
};