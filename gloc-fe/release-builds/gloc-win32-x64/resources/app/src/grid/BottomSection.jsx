import React from 'react';
import './BottomSection.css';
import ImageContainer from './ImageContainer';

function BottomSection({ rows, cols, itemSize }) {
  return (
    <div className="bottom-section">
      {[...Array(rows)].map((_, rowIndex) => (
        <div
          className="bottom-row"
          key={rowIndex}
          style={{
            gridTemplateColumns: `repeat(${cols}, ${itemSize.width}px)`,
          }}
        >
          {[...Array(cols)].map((_, colIndex) => (
            <div
              className="bottom-grid-item"
              key={colIndex}
              style={{
                width: `${itemSize.width}px`,
                height: `${itemSize.height}px`,
              }}
            >
             <ImageContainer/>

        </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default BottomSection;
