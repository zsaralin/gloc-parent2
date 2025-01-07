import React, { useState, useEffect } from "react";
import "./ImageContainer.css";
import { videoRef } from "./videoRef";
import { SERVER_URL } from "../config";
import Modal from "./Modal";
import { overlaySettings } from "../OverlayGui"; // ✅ Import overlay settings

function formatKeyName(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
}

function ImageContainer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [wasVideoPaused, setWasVideoPaused] = useState(false);
  const [modalText, setModalText] = useState("");

  // ✅ Track zoom, xOffset, and yOffset
  const [zoom, setZoom] = useState(overlaySettings.zoom);
  const [xOffset, setXOffset] = useState(overlaySettings.xOffset);
  const [yOffset, setYOffset] = useState(overlaySettings.yOffset);

  // ✅ Sync zoom, xOffset, and yOffset when overlaySettings updates
  useEffect(() => {
    const updateZoom = () => setZoom(overlaySettings.zoom);
    const updateXOffset = () => setXOffset(overlaySettings.xOffset);
    const updateYOffset = () => setYOffset(overlaySettings.yOffset);

    window.addEventListener("zoomUpdated", updateZoom);
    window.addEventListener("xOffsetUpdated", updateXOffset);
    window.addEventListener("yOffsetUpdated", updateYOffset);

    return () => {
      window.removeEventListener("zoomUpdated", updateZoom);
      window.removeEventListener("xOffsetUpdated", updateXOffset);
      window.removeEventListener("yOffsetUpdated", updateYOffset);
    };
  }, []);

  const openModal = (event) => {
    const video = videoRef.current;

    if (video) {
      setWasVideoPaused(video.paused);
      if (!video.paused) video.pause();
    }

    const infoString = event.currentTarget.getAttribute("data-info");
    const imageData = JSON.parse(infoString);

    if (imageData?.imagePath) {
      setModalImages(imageData.imagePath.map((path) => `${SERVER_URL}${path}`));
    }

    let contentHtml = `<div>${imageData.jsonData.nombre}</div>`;
    for (const [key, value] of Object.entries(imageData.jsonData)) {
      if (!["numRecords", "name", "nombre"].includes(key)) {
        contentHtml += `<div>${formatKeyName(key)}: ${value}</div>`;
      }
    }

    setModalText(contentHtml);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    const video = videoRef.current;

    setIsModalOpen(false);
    setModalImages([]);
    setModalText("");

    if (video && !wasVideoPaused) video.play();
  };

  return (
    <>
      <div
        className="image-container"
        onClick={openModal}
        data-info='{"label":"Sample Image","imagePath":["/images/image1.jpg", "/images/image2.jpg"],"jsonData":{"age":25,"gender":"male","height":"6ft"}}'
      >
        <div className="overlay">
          <div className="text-overlay top-text"></div>
          <div className="text-overlay bottom-text"></div>
          <div className="vert-bar-bg"></div>
          <div className="vert-bar-fill"></div>
        </div>

        {/* ✅ Apply zoom, xOffset, and yOffset dynamically */}
        <div
          className="curr-img"
          style={{
            transform: `scale(${zoom}) translate(${xOffset * 100}%, ${yOffset * 100}%)`,
          }}
        ></div>
        <div
          className="prev-img"
          style={{
            transform: `scale(${zoom}) translate(${xOffset * 100}%, ${yOffset * 100}%)`,
          }}
        ></div>
      </div>

      {isModalOpen && (
        <Modal images={modalImages} text={modalText} onClose={closeModal} />
      )}
    </>
  );
}

export default ImageContainer;
