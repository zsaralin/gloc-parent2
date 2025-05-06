import React, { useRef, useState, useEffect } from "react";
import "./NarrowLandingPage.css";
import LanguageButton from "./LanguageButton";
import { getText } from "../config";
import { Link } from "react-router-dom";
import DropdownMenu from "./DropdownMenu.jsx";

function NarrowLandingPage({
  isLoading,
  isLandingVisible,
  handleAccessCamera,
  currLanguage,
  setCurrLanguage,
}) {
  const contentRef = useRef(null);
  const [text, setText] = useState(null);
  const [pageIndex, setPageIndex] = useState(0); // page 0, 1, or 2
  const videoRef = useRef(null);
  const [textVisible, setTextVisible] = useState(false);
  const [isWorkModalVisible, setWorkModalVisible] = useState(false);
  const [isContextModalVisible, setContextModalVisible] = useState(false);
  const workModalRef = useRef(null);
  const contextModalRef = useRef(null);

  useEffect(() => {
    async function loadText() {
      const result = await getText();
      setText(result);
    }
    loadText();
  }, [currLanguage]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setTextVisible(true);
    };

    video.addEventListener("play", handlePlay);

    return () => {
      video.removeEventListener("play", handlePlay);
    };
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleDropdownClick = (id) => {
    let targetPage = null;

    if (id === "technical_description") targetPage = 0;
    else if (id === "description") targetPage = 1;
    else targetPage = pageIndex; // instructions is in the bottom section

    const goAndScroll = () => {
      setTimeout(() => {
        scrollToSection(id);
      }, 50); // wait for content to render
    };

    if (targetPage !== pageIndex) {
      setPageIndex(targetPage);
      goAndScroll(); // still call scroll after delay
    } else {
      scrollToSection(id);
    }

    setIsMenuOpen(false);
  };
  const menuContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const scrollToSection = (id) => {
    const container = contentRef.current;
    const el = document.getElementById(id);
    if (!container || !el) return;

    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const offset = elTop - containerTop;

    const topOffset = 80; // adjust based on your fixed header *inside the container*

    container.scrollTo({
      top: container.scrollTop + offset - topOffset,
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (isWorkModalVisible && workModalRef.current && !workModalRef.current.contains(event.target)) {
        setWorkModalVisible(false);
      }
      if (isContextModalVisible && contextModalRef.current && !contextModalRef.current.contains(event.target)) {
        setContextModalVisible(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isWorkModalVisible, isContextModalVisible]);

  if (!text) return null;

  return (
    <div
      className={`grid-overlay ${isLandingVisible ? "visible" : "hidden"}`}
      ref={contentRef}
    >
      <div className="top-bar">
        <h2 className="top-bar-title">{text.title}</h2>

        <div className="top-bar-controls">
          <LanguageButton
            currLanguage={currLanguage}
            setCurrLanguage={setCurrLanguage}
          />
          <div className="menu-container" ref={menuContainerRef}>

            <button
              className="hamburger-button"
              onClick={(e) => {
                e.stopPropagation(); // prevent outside click handler from firing
                setIsMenuOpen((prev) => !prev);
              }}
            >
              ☰
            </button>

            {isMenuOpen && (
              <DropdownMenu
                ref={dropdownRef}

                text={text}
                currLanguage={currLanguage}
                handleDropdownClick={handleDropdownClick}
              />
            )}
          </div>
        </div>
      </div>

      <div className="overlay-content">
        <div className="hero-video-wrapper">
          <video
            className="hero-video"
            ref={videoRef}

            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          // poster="/videos/preview.jpg"
          >
            <source src="/video.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay"></div>

          <div className={`hero-video-text ${textVisible ? "visible" : ""}`}>
            <h1>{text.title}</h1>
            <h2>{text.rafael}</h2>
          </div>

        </div>
        <div className="content" id="work" style={{ marginTop: 0 }}>
          <div id="technical_description">
            {text.technical_description.slice(0, 2).map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
          </div>
          <button className="plus-button" onClick={() => setWorkModalVisible(true)}>+</button>
        </div>
        <div className="content" id="context">
          <div id="description">
            {text.description.slice(0, 2).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <button className="plus-button" onClick={() => setContextModalVisible(true)}>+</button>
        </div>
        <div className={`modal-overlay ${isWorkModalVisible ? 'visible' : ''}`}>
          <div className="modal-content" ref={workModalRef}>
            <button className="modal-close" onClick={() => setWorkModalVisible(false)}>×</button>
            {text.technical_description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className={`modal-overlay ${isContextModalVisible ? 'visible' : ''}`}>
        <div className="modal-content" ref={contextModalRef}>

          <button className="modal-close" onClick={() => setContextModalVisible(false)}>×</button>
          {text.description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          </div>

        <div className="instructions-wrapper" id="instructions">
          <p>{text.instructions[0]}</p>
          <p>
            {text.instructions.slice(1).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </p>
          <button
            className="narrow-camera-button"
            onClick={handleAccessCamera}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            ) : (
              text.camera_access
            )}
          </button>
        </div>
      </div>

      <footer className="narrow-footer">
        <p>{text.antimetric}</p>
        <p>
          <a href="https://www.abuelas.org.ar/donaciones" target="_blank" rel="noopener noreferrer">
            {text.abuelas}
          </a>
        </p>
        <p>
          <Link
            to={`/bibliography?lang=${currLanguage}`}
            className="narrow-footer-link"
          >
            {text.bibliography}
          </Link>
        </p>
        <p>{text.legal_lease}</p>
      </footer>
    </div>
  );
}

export default NarrowLandingPage;