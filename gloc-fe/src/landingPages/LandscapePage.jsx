import { useState, useEffect } from "react";
import "./LandscapePage.css";
import { getLanguage, getText } from "../config";
function LandscapePage() {
  const text = getText()
  
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
    isLandscape && (
      <div className="landscape-overlay">
        {text.orientation}
      </div>
    )
  );
}

export default LandscapePage;
