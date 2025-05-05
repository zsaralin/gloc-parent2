import React, { useState } from 'react';
import './TopRow.css';
import VideoContainer from './VideoContainer'; // Import the new VideoContainer component
import ImageContainer from './ImageContainer';

function TopRow({ numItems, itemWidth }) {

  return (
    <div className="top-row">
      <VideoContainer /> {/* Render the VideoContainer */}

      {[...Array(numItems)].map((_, index) => (
        <div
          className="top-row-item"
          key={index}
          style={{ width: `${itemWidth}px`, height: "100%" }}
        >
          <ImageContainer/>
        </div>
      ))}
    </div>
  );
}

export default TopRow;
