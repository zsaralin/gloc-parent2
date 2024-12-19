import React, { useState } from "react";
import "./ImageContainer.css";
import { videoRef } from "./videoRef";
import { SERVER_URL } from "../config";
import Modal from "./Modal";

function formatKeyName(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
}

function ImageContainer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [wasVideoPaused, setWasVideoPaused] = useState(false);
  const [modalText, setModalText] = useState("");

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
        <div className="curr-img"></div>
        <div className="prev-img"></div>
      </div>

      {isModalOpen && (
        <Modal images={modalImages} text={modalText} onClose={closeModal} />
      )}
    </>
  );
}

export default ImageContainer;
