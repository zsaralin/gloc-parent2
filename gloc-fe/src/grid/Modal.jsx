import React, { useRef, useEffect, useState } from "react";
import "./Modal.css";
import ImageModal from "./ImageModal"; // Import the new modal component
import { getText } from "../config";
import { getLanguage } from "../config";

// converts keys of the format dateOfAbduction to Date of Abduction 
function formatKeyName(key) {
  const lowercaseWords = ['of', 'and', 'in', 'on', 'at', 'for', 'with', 'a', 'an', 'the', 'to', 'by', 'from'];

  return key
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .trim()
    .split(" ")
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0 || !lowercaseWords.includes(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join(" ");
}
const Modal = ({ images, text, onClose }) => {
  const containerRef = useRef(null);
  const [imageStyle, setImageStyle] = useState({});
  const [gridStyle, setGridStyle] = useState({});
  const [selectedImage, setSelectedImage] = useState(null); // Track clicked image
  const [button_text, setText] = useState(null);

  const nameText = getLanguage() === 'es' ? text.nombre : text.name;

  let detailsHTML = '';
  for (const [key, value] of Object.entries(text)) {
  if (!["numRecords", "numeroDeRegistros", "name", "nombre"].includes(key)) {
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    detailsHTML += `<div>${formatKeyName(key)}: ${displayValue}</div>`;
  }
}
  useEffect(() => {
    async function loadText() {
      const result = await getText();
      setText(result);
    }
    loadText();
    const container = containerRef.current;
    if (!container) return;
  }, [images]);

  if(!button_text) return null
  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          ref={containerRef}
        > 
    <button className="modal-close-button" onClick={onClose}>×</button>
    <div className="modal-name">{nameText}</div>

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
          <div className="modal-text" dangerouslySetInnerHTML={{ __html: detailsHTML }}></div>

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
      <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
};

export default Modal;
