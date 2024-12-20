import React, { useRef, useEffect, useState } from "react";
import "./Modal.css";

const Modal = ({ images, text, onClose }) => {
  const containerRef = useRef(null);
  const [imageStyle, setImageStyle] = useState({});
  const [gridStyle, setGridStyle] = useState({});
  const [wrapperStyle, setWrapperStyle] = useState({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Measure container and allocated space
    const { clientWidth, clientHeight } = container;
    const textElem = container.querySelector(".modal-text");
    const buttonElem = container.querySelector(".genetic-bank-button");
    
    const textHeight = textElem ? textElem.offsetHeight : 0;
    const buttonHeight = buttonElem ? buttonElem.offsetHeight : 0;
    const spacing = 20; // some buffer space
    
    const availableWidth = clientWidth;
    const availableHeight = clientHeight - (textHeight + buttonHeight + spacing);

    const numImages = images.length;

    if (numImages === 1) {
      // Single image: just center it in the available space
      setWrapperStyle({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: `${availableHeight}px`,
        width: "100%",
        overflow: "hidden",
      });
      setGridStyle({});
      setImageStyle({
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain"
      });
    } else {
      // For multiple images, find the best grid layout
      let bestCols = 1;
      let bestRows = numImages;
      let bestSize = 0;

      for (let cols = 1; cols <= numImages; cols++) {
        const rows = Math.ceil(numImages / cols);
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;
        const size = Math.min(cellWidth, cellHeight);
        if (size > bestSize) {
          bestSize = size;
          bestCols = cols;
          bestRows = rows;
        }
      }

      // We'll set the grid to the needed size and center it inside a wrapper
      const gridWidth = bestCols * bestSize;
      const gridHeight = bestRows * bestSize;

      setWrapperStyle({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: `${availableHeight}px`,
        width: "100%",
        overflow: "hidden",
      });

      setGridStyle({
        display: "grid",
        gridTemplateColumns: `repeat(${bestCols}, ${bestSize}px)`,
        gridTemplateRows: `repeat(${bestRows}, ${bestSize}px)`,
        width: `${gridWidth}px`,
        height: `${gridHeight}px`,
        gap: "10px",
        boxSizing: "border-box",
      });

      setImageStyle({
        width: "100%",
        height: "100%",
        objectFit: "contain"
      });
    }
  }, [images]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        <div className="modal-images-wrapper" style={wrapperStyle}>
          <div className="modal-images" style={gridStyle}>
            {images.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Modal Image ${index + 1}`}
                style={imageStyle}
              />
            ))}
          </div>
        </div>
        <div
          className="modal-text"
          dangerouslySetInnerHTML={{ __html: text }}
        ></div>
        <div className="genetic-bank-button">
          Set Up Appointment At Genetic Bank
        </div>
      </div>
    </div>
  );
};

export default Modal;
