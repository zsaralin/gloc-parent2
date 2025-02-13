import React, { useEffect, useState } from 'react';
import TopRow from './TopRow'; // Assuming these are your components
import BottomSection from './BottomSection';
import './Grid.css';
import '../OverlayGui.css'; // Import overlay GUI styles
import OverlayGUI from '../OverlayGui'; // Import overlay GUI component
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

function Grid() {
  const [isGridReady, setIsGridReady] = useState(false); // Tracks grid readiness
  const [isOverlayVisible, setIsOverlayVisible] = useState(false); // Tracks overlay visibility
  useEffect(() => {
    const handleResize = () => {
      window.location.href = window.location.href; 
    };
  
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    const handleResize = async () => {
      arrangeGrid(); // Recalculate the grid layout on resize
      setIsGridReady(true); // Mark grid as ready
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const initializeGrid = async () => {
      if (isGridReady) {
        setupOverlayTransparency();
        await startFaceDetection(); // Await the async function
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

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="grid-wrapper">
      <LandingPage />
      <LoadingScreen />
      {isGridReady && (
        <div className="grid-container">
          <TopRow 
            numItems={numTopRowItems} 
            itemWidth={topRowItemWidth} 
          />
          <BottomSection 
            rows={numBottomGridRows} 
            cols={numBottomGridCols} 
            itemSize={bottomGridItemSize} // Pass as a single object
          />
        </div>
      )}
      {isOverlayVisible && <OverlayGUI />} {/* Render overlay GUI when visible */}
    </div>
  );
}

export default Grid;
