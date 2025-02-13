import { useState, useEffect } from "react";
import "./LandscapePage.css";

function LandscapePage() {
  const getIsLandscape = () => {
    return window.orientation === 90 || window.orientation === -90;
  };

  const [isLandscape, setIsLandscape] = useState(getIsLandscape());

  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(getIsLandscape());
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    
    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return (
    true && (
      <div className="landscape-overlay">
        This experience is designed for portrait mode. Please rotate your device to continue.
      </div>
    )
  );
}

export default LandscapePage;
