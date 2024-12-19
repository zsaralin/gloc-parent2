import React, { useEffect, useState } from 'react';
import TopRow from './TopRow'; // Assuming these are your components
import BottomSection from './BottomSection';
import './Grid.css';
import { 
  arrangeGrid, 
  numTopRowItems, 
  numBottomGridRows, 
  numBottomGridCols, 
  topRowItemWidth, 
  bottomGridItemSize // Now returns { width, height }
} from './gridLayout'; // Import arrangeGrid and variables
import { startFaceDetection } from '../faceDetection/faceDetection';
import LandingPage from '../landingPages/LandingPage';
import { setupOverlayTransparency } from '../updateGrid/updateGrid';
import LoadingScreen from './LoadingScreen';

function Grid() {
  const [isGridReady, setIsGridReady] = useState(false); // Tracks grid readiness

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
        setupOverlayTransparency()
        await startFaceDetection(); // Await the async function
      }
    };

    initializeGrid();
  }, [isGridReady]);

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
    </div>
  );
  
}

export default Grid;
