import React, { useState, useEffect, useRef } from 'react';
import './BottomSection.css';

function BottomSection({ topRowHeight }) {
  const gridContainerRef = useRef(null);
  const [numRows, setNumRows] = useState(0);
  const [numColumns, setNumColumns] = useState(0);
  const [itemSize, setItemSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const calculateGridLayout = () => {
      if (gridContainerRef.current) {
        const containerWidth = gridContainerRef.current.offsetWidth;
        const containerHeight = window.innerHeight - topRowHeight; // Remaining height
  
        const itemAspectRatio = 9 / 16; // Aspect ratio for items
        const targetAreaFraction = 1 / 30; // Each item should occupy ~1/10th of the screen space
  
        const totalContainerArea = containerWidth * containerHeight;
        const targetItemArea = totalContainerArea * targetAreaFraction;
  
        // Calculate item dimensions based on target area and aspect ratio
        const approximateItemWidth = Math.sqrt(targetItemArea * itemAspectRatio);
        const approximateItemHeight = approximateItemWidth / itemAspectRatio;
  
        // Calculate number of columns and rows
        const columns = Math.floor(containerWidth / approximateItemWidth);
        const rows = Math.floor(containerHeight / approximateItemHeight);
        console.log(columns, rows)
        // Final dimensions for each item
        const finalItemWidth = containerWidth / columns;
        const finalItemHeight = containerHeight / rows;
  
        // Set state
        setNumColumns(columns);
        setNumRows(rows);
        setItemSize({
          width: finalItemWidth,
          height: finalItemHeight,
        });
      }
    };
  
    calculateGridLayout();
    window.addEventListener('resize', calculateGridLayout);
  
    return () => {
      window.removeEventListener('resize', calculateGridLayout);
    };
  }, [topRowHeight]);


  return (
    <div className="bottom-section" ref={gridContainerRef}>
      {[...Array(numRows)].map((_, rowIndex) => (
        <div
          className="bottom-row"
          key={rowIndex}
          style={{ gridTemplateColumns: `repeat(${numColumns}, ${itemSize.width}px)` }}
        >
          {[...Array(numColumns)].map((_, colIndex) => (
            <div
              className="grid-item"
              key={colIndex}
              style={{ width: `${itemSize.width}px`, height: `${itemSize.height}px` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default BottomSection;
