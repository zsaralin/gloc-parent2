import React from "react";
import "./ImageModal.css";

const ImageModal = ({ src, onClose }) => {
  if (!src) return null; // Don't render if no image is selected

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Full View" className="full-image" />
      </div>
    </div>
  );
};

export default ImageModal;
