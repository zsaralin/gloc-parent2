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
import { startFaceDetection } from '../faceDetection/faceDetection';
import LandingPage from '../landingPages/LandingPage';
import { setupOverlayTransparency } from '../updateGrid/updateGrid';
import LoadingScreen from './LoadingScreen';
import { updateGridImmediately } from '../faceRecognition/faceRecognition';
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

  return (
    <div className="grid-wrapper">
      <LandingPage />
      <LoadingScreen />
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
