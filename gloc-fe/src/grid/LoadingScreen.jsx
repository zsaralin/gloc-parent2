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
    <div id="loading-screen" className="loading-screen">
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

export const preloadLoading = () => {
  const loadingFill = document.getElementById("loading-fill");
  if (loadingFill) {
    loadingFill.style.transition = "width 1s linear";
    loadingFill.style.width = "10%"; // Set initial width to 10% with transition
  }
};

export const startLoading = () => {
  const duration = overlaySettings.loadingDuration * 1000;

  const loadingFill = document.getElementById("loading-fill");
  const loadingScreen = document.getElementById("loading-screen");
  const promptElement = document.getElementById("loading-prompt");

  if (!loadingScreen) return;

  loadingScreen.style.opacity = "1";

  const prompts = [
    "Extracting facial landmarks...",
    "Sending numerical description...",
    "Comparing biometric data...",
    "Searching through database for similarities...",
    "Retrieving top matches"
  ];

  setTimeout(() => {
    if (loadingFill) {
      loadingFill.style.animation = `loadingAnimation ${duration}ms ease-in-out forwards`;
    }

    if (promptElement) {
      const promptTimings = [
        0, duration * 0.2, duration * 0.4, duration * 0.6, duration * 0.9
      ];

      for (let i = 1; i < prompts.length; i++) {
        setTimeout(() => {
          promptElement.innerText = prompts[i];
        }, promptTimings[i]);
      }
    }

    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.transition = "opacity 1s ease";
        loadingScreen.style.opacity = "0";
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 1200);
      }
    }, duration);
  }, 0);
};
