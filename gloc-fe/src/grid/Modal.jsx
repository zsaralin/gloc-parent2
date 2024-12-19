import React, { useRef, useEffect, useState } from "react";
import "./Modal.css";

const Modal = ({ images, text, onClose }) => {
  const containerRef = useRef(null);
  const [imageStyle, setImageStyle] = useState({});
  const [gridStyle, setGridStyle] = useState({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Measure the container and subtract space needed for text and button
    const { clientWidth, clientHeight } = container;
    const textElem = container.querySelector(".modal-text");
    const buttonElem = container.querySelector(".genetic-bank-button");
    
    const textHeight = textElem ? textElem.offsetHeight : 0;
    const buttonHeight = buttonElem ? buttonElem.offsetHeight : 0;
    const spacing = 0; // some buffer space
    
    const availableWidth = clientWidth;
    const availableHeight = clientHeight - (textHeight + buttonHeight + spacing);

    const numImages = images.length;

    if (numImages === 1) {
      // Single image: maximize while fitting in the available area
      // We'll use objectFit contain to ensure the whole image is visible
      // We just make the image fill the space above text/button.
      setGridStyle({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: `${availableHeight}px`,
        overflow: "hidden",
      });
      // The image will just scale to fit
      setImageStyle({ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" });
    } else {
      // For multiple images, find a suitable grid layout.
      // We'll try different column counts and pick the arrangement that yields the largest cell size.
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

      // Now that we have bestCols and bestRows, we know each cell is `bestSize` x `bestSize`.
      // We'll explicitly set pixel values so no overflow occurs.
      setGridStyle({
        display: "grid",
        gridTemplateColumns: `repeat(${bestCols}, ${bestSize}px)`,
        gridTemplateRows: `repeat(${bestRows}, ${bestSize}px)`,
        width: "100%",
        // The height will match exactly the needed rows * cell size
        height: `${bestRows * bestSize}px`,
        justifyContent: "center",
        alignItems: "center",
        // gap: "10px",
        boxSizing: "border-box",
        overflow: "hidden"
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
