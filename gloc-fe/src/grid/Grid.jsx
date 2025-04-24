import React, { useEffect, useState } from 'react';
import TopRow from './TopRow';
import BottomSection from './BottomSection';
import './Grid.css';
import '../OverlayGui.css';
import OverlayGUI from '../OverlayGui';
import { 
  arrangeGrid, 
  numTopRowItems, 
  numBottomGridRows, 
  numBottomGridCols, 
  topRowItemWidth, 
  bottomGridItemSize 
} from './gridLayout'; 
import { startFaceDetection} from '../faceDetection/faceDetection';
import { timeoutTriggered } from '../faceDetection/newFaces';
import LandingPage from '../landingPages/LandingPage';
import LandscapePage from '../landingPages/LandscapePage';
import { setupOverlayTransparency } from '../updateGrid/updateGrid';
import LoadingScreen from './LoadingScreen';
import { updateGridImmediately } from '../faceRecognition/faceRecognition';
import LightingMessage from './LightingMessage';
function Grid() {
  const [gridConfig, setGridConfig] = useState({
    numTopRowItems,
    numBottomGridRows,
    numBottomGridCols,
    topRowItemWidth,
    bottomGridItemSize,
  });

  const [isGridReady, setIsGridReady] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  

  useEffect(() => {
    const handleResize = async () => {
      arrangeGrid(); // Recalculate grid layout
  
      setGridConfig({
        numTopRowItems,
        numBottomGridRows,
        numBottomGridCols,
        topRowItemWidth,
        bottomGridItemSize,
      });
  
      setIsGridReady(true);
      setTimeout(updateGridImmediately, 200);
    };
  
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize); // Detect mobile rotation
    handleResize()
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  useEffect(() => {
    const initializeGrid = async () => {
      if (isGridReady) {
        setupOverlayTransparency();
        await startFaceDetection();
      }
    };

    initializeGrid();
  }, [isGridReady]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'g' || event.key === 'G') {
        setIsOverlayVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  useEffect(() => {
    let hideCursorTimeout;

    const showCursor = () => {
      setCursorVisible(true);
      clearTimeout(hideCursorTimeout);
      hideCursorTimeout = setTimeout(() => setCursorVisible(false), 2000); // Hide after 2 sec
    };

    window.addEventListener("mousemove", showCursor);

    return () => {
      window.removeEventListener("mousemove", showCursor);
      clearTimeout(hideCursorTimeout);
    };
  }, []);
  return (
    <div className="grid-wrapper" style={{ cursor: cursorVisible ? "default" : "none" }}>
   <LandingPage  />
<LandscapePage  />
<LoadingScreen />
<LightingMessage isLightingPoor = {timeoutTriggered}/>

      {isGridReady && (
        <div className="grid-container">
          <TopRow 
            numItems={gridConfig.numTopRowItems} 
            itemWidth={gridConfig.topRowItemWidth} 
          />
          <BottomSection 
            rows={gridConfig.numBottomGridRows} 
            cols={gridConfig.numBottomGridCols} 
            itemSize={gridConfig.bottomGridItemSize} 
          />
        </div>
      )}
      {isOverlayVisible && <OverlayGUI />}
    </div>
  );
}

export default Grid;
