import React, { useRef, useState, useEffect } from "react";
import "./NarrowLandingPage.css";
import LanguageButton from "./LanguageButton";
import { getText } from "../config";
import { Link } from "react-router-dom";

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
 const isDropdownClicked = useRef(false);
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

  isDropdownClicked.current = false;
  setIsMenuOpen(false);
};


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


  const handleNext = () => {
    if (pageIndex < 1) {
      setPageIndex(pageIndex + 1);
      // scrollToTop();
    }
  };

  const handleBack = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
      // scrollToTop();
    }
  };
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // Only consider horizontal swipes
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext(); // Swipe left → next page
      } else {
        handleBack(); // Swipe right → previous page
      }
    }

  };
  if (!text) return null;

  return (
    <div
      className={`grid-overlay ${isLandingVisible ? "visible" : "hidden"}`}
      ref={contentRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="top-bar">
      <h2 className="top-bar-title">{text.title}</h2>
      
      <div className="top-bar-controls">
        <LanguageButton
          currLanguage={currLanguage}
          setCurrLanguage={setCurrLanguage}
        />
        <div
          className="menu-container"
        >
          <button
            className="hamburger-button"
            onClick={() => {
              isDropdownClicked.current = true;
              setIsMenuOpen((prev) => !prev);
            }}
          >
            ☰
          </button>

          {isMenuOpen && (
            <div
              className="dropdown-menu"
            >
            <p onClick={() => handleDropdownClick("technical_description")}>
                {text.technical_description?.[0]}
              </p>
              <p onClick={() => handleDropdownClick("description")}>
                {text.description?.[0]}
              </p>
              <p onClick={() => handleDropdownClick("instructions")}>
                {text.instructions?.[0]}
              </p>

            </div>
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
        <main className="content">
          <div className="side">
          {pageIndex === 0 && (
            <div id="technical_description">
              {text.technical_description.map((paragraph, index) => (
                <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
              ))}
            </div>
          )}

          {pageIndex === 1 && (
            <div id="description">
              {text.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
          </div>

          <div className="arrow-navigation">
            <span
              className="arrow arrow-left"
              onClick={handleBack}
              style={{
                opacity: pageIndex === 0 ? "0.5" : "1",
                pointerEvents: pageIndex === 0 ? "none" : "auto",
                cursor: pageIndex === 0 ? "default" : "pointer"
              }}          >
              ‹
            </span>
            <span
              className="arrow arrow-right"
              onClick={handleNext}
              style={{
                opacity: pageIndex === 1 ? "0.5" : "1",
                pointerEvents: pageIndex === 1 ? "none" : "auto",
                cursor: pageIndex === 1 ? "default" : "pointer"
              }}            >
              ›
            </span>
          </div>
          <div className="dot-navigation">
            {[0, 1].map((i) => (
              <span
                key={i}
                className={`dot ${pageIndex === i ? "active" : ""}`}
              />
            ))}
          </div>

        </main>
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