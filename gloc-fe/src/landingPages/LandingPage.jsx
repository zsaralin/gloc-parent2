import React, { useState, useEffect, useRef } from "react";
import WideLandingPage from "./WideLandingPage";
import NarrowLandingPage from "./NarrowLandingPage";
import { videoRef } from "../grid/videoRef";
import { startFaceDetection } from "../faceDetection/faceDetection";
import { startShuffle } from "../updateGrid/shuffleManagerService";
import {loadTextJson, setLanguage } from "../config"; // adjust the path as needed
import { preloadLoading, showFirstLoadingMessage } from "../grid/LoadingScreen";

function LandingPage() {
  const [isWideLayout, setIsWideLayout] = useState(true);
  const [isLandingVisible, setIsLandingVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const isInitializedRef = useRef(false);
  const [currLanguage, setCurrLanguage] = useState("es");
  useEffect(() => {
    setLanguage(currLanguage); // update config.js and localStorage
    console.log(currLanguage)
  }, [currLanguage]);
  useEffect(() => {
    const checkWindowDimensions = () => {
      setIsWideLayout(window.innerWidth >900);
    };

    checkWindowDimensions();
    window.addEventListener("resize", checkWindowDimensions);
    loadTextJson()

    return () => window.removeEventListener("resize", checkWindowDimensions);
  }, []);
  useEffect(() => {
    async function fetchData() {

    await loadTextJson()
    }
    fetchData()
  }, []);
  const handleAccessCamera = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (stream && videoRef.current) {
        localStorage.setItem("cameraAccessGranted", "true");
        videoRef.current.srcObject = stream;
        videoRef.current.onplaying = async () => {
          if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            try {
              window.history.pushState({}, '', '/camera-active');

              await startShuffle();
              await startFaceDetection();
              await new Promise(resolve => setTimeout(resolve, 1500));
              setIsLandingVisible(false);
              showFirstLoadingMessage()
              preloadLoading()
            } catch (error) {
              console.error("Error during initialization:", error);
            }
          }
        };

        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      setIsLoading(false);
    }
  };
  const sharedProps = {
    isLoading,
    isLandingVisible,
    handleAccessCamera,
    currLanguage,
    setCurrLanguage
  };

  return isWideLayout ? (
    <WideLandingPage {...sharedProps} />
  ) : (
    <NarrowLandingPage {...sharedProps} />
  );
}

export default LandingPage;
