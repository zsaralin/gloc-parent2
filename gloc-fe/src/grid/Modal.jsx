import React, { useRef, useEffect, useState } from "react";
import "./Modal.css";
import ImageModal from "./ImageModal"; // Import the new modal component
import { getText } from "../config";

const Modal = ({ images, text, onClose }) => {
  const containerRef = useRef(null);
  const [imageStyle, setImageStyle] = useState({});
  const [gridStyle, setGridStyle] = useState({});
  const [selectedImage, setSelectedImage] = useState(null); // Track clicked image
  const button_text = getText()
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { clientWidth, clientHeight } = container;
    const textElem = container.querySelector(".modal-text");
    const buttonElem = container.querySelector(".genetic-bank-button");

    const textHeight = textElem ? textElem.offsetHeight : 0;
    const buttonHeight = buttonElem ? buttonElem.offsetHeight : 0;
    const spacing = 0;

    const availableWidth = clientWidth;
    const availableHeight = clientHeight - (textHeight + buttonHeight + spacing);

    const numImages = images.length;

    if (numImages === 1) {
      setGridStyle({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: `${availableHeight}px`,
        overflow: "hidden",
      });

      setImageStyle({
        width: "100%",
        height: "100%",
        objectFit: "contain",
        objectPosition: "center",
        display: "block",      // removes baseline whitespace from inline images
        flexShrink: 0,
        flexGrow: 1,
        cursor: "pointer",
      });
      return;
    }

    let bestCols = 1;
    let bestRows = numImages;
    let bestSize = 0;

    for (let cols = 1; cols <= numImages; cols++) {
      const rows = Math.ceil(numImages / cols);
      const cellWidth = availableWidth / cols;
      const cellHeight = availableHeight / rows;
      const size = Math.min(cellWidth, cellHeight) - 15;
      if (size > bestSize) {
        bestSize = size;
        bestCols = cols;
        bestRows = rows;
      }
    }

    setGridStyle({
      display: "grid",
      gridTemplateColumns: `repeat(${bestCols}, ${bestSize}px)`,
      gridTemplateRows: `repeat(${bestRows}, ${bestSize}px)`,
      width: "100%",
      height: `${bestRows * bestSize}px`,
      justifyContent: "center",
      alignContent: "center",
      overflow: "hidden",
    });

    setImageStyle({
      width: "100%",
      height: "100%",
      objectFit: "contain",
      cursor: "pointer",
    });
  }, [images]);

  return (
    <>
      {/* Parent Modal */}
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
                onClick={() => setSelectedImage(src)} // Open separate modal
              />
            ))}
          </div>
          <div
            className="modal-text"
            dangerouslySetInnerHTML={{ __html: text }}
          ></div>
          <a 
            href="https://www.argentina.gob.ar/ciencia/bndg" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="genetic-bank-button"
          >
            {button_text.appointment}
          </a>
        </div>
      </div>

      {/* Separate Image Modal */}
      <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
};

export default Modal;
