import React, { useEffect, useState } from "react";
import "./LoadingScreen.css";
import { overlaySettings } from '../OverlayGui';
import { getText } from "../config";

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    async function loadTextAndListen() {
      const text = await getText();
      setPrompts(text?.loading_bar || []);

      const handleShowLoading = () => {
        setIsVisible(true);
        startLoading(text); // Pass loaded text to startLoading
      };

      window.addEventListener('showLoadingScreen', handleShowLoading);

      return () => {
        window.removeEventListener('showLoadingScreen', handleShowLoading);
      };
    }

    loadTextAndListen();
  }, []);

  return (
    <div id="loading-screen" className="loading-screen">
      <div className="loading-overlay"></div>
      <div className="loading-bar-container">
        <div className="loading-bar">
          <div id="loading-fill" className="loading-fill"></div>
        </div>
        <div id="loading-prompt" className="loading-prompt">
          {isVisible && prompts.length > 0 ? prompts[0] : ""}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

// ------------------------------
// External Loading Utilities
// ------------------------------

export const preloadLoading = () => {
  const loadingFill = document.getElementById("loading-fill");
  if (loadingFill) {
    loadingFill.style.transition = "width 1s linear";
    loadingFill.style.width = "10%";
  }
};

export const showFirstLoadingMessage = async () => {
  const promptElement = document.getElementById("loading-prompt");
  const text = await getText();
  if (promptElement && text?.loading_bar?.[0]) {
    promptElement.innerText = text.loading_bar[0];
  }
};

export const showLoadingMessage = async () => {
  const promptElement = document.getElementById("loading-prompt");
  const text = await getText();
  if (promptElement && text?.lighting_message) {
    promptElement.innerText = text.lighting_message;
  }
};

export const startLoading = async (text, fromTimeout = false) => {
  if (!text) text = await getText(); // fallback if text wasn't passed
  const prompts = text?.loading_bar || [];
  const duration = overlaySettings.loadingDuration * 1000;

  const loadingFill = document.getElementById("loading-fill");
  const loadingScreen = document.getElementById("loading-screen");
  const promptElement = document.getElementById("loading-prompt");

  if (!fromTimeout && promptElement && prompts[0]) {
    promptElement.innerText = prompts[0];
  }

  if (!loadingScreen) return;

  loadingScreen.style.opacity = "1";

  setTimeout(() => {
    if (loadingFill) {
      loadingFill.style.animation = `loadingAnimation ${duration}ms ease-in-out forwards`;
    }

    if (promptElement && !fromTimeout) {
      const promptTimings = [
        0,
        duration * 0.2,
        duration * 0.4,
        duration * 0.6,
        duration * 0.9,
      ];

      for (let i = 1; i < Math.min(prompts.length, promptTimings.length); i++) {
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
