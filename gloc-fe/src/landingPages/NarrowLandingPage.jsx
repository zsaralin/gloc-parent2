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

  useEffect(() => {
    async function loadText() {
      const result = await getText();
      setText(result);
    }
    loadText();
  }, [currLanguage]);

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (pageIndex < 2) {
      setPageIndex(pageIndex + 1);
      scrollToTop();
    }
  };

  const handleBack = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
      scrollToTop();
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
      <LanguageButton
        currLanguage={currLanguage}
        setCurrLanguage={setCurrLanguage}
      />

      <div className="overlay-content">
        <header className="header">
          <h1>{text.title}</h1>
        </header>
        <div className="nav-divider-line">
          <button
            onClick={handleBack}
            disabled={pageIndex === 0}
            className="nav-arrow"
          >
            ‹
          </button>
          <div className="nav-line" />
          <button
            onClick={handleNext}
            disabled={pageIndex === 2}
            className="nav-arrow"
          >
            ›
          </button>
        </div>
        <main className="content">
          <div className="side">
            {pageIndex === 0 && Array.isArray(text.technical_description) &&
            text.technical_description.map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}

            {pageIndex === 1 && Array.isArray(text.description) &&
              text.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}

              {pageIndex === 2 && (
                <div className = "side">
                  <p>{text.instructions[0]}</p>
                  <ul>
                    {text.instructions.slice(1).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

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
              )}
  
          </div>
        </main>
      </div>

      <footer className="narrow-footer">
        <p>{text.antimetric}</p>
                  <p>
                    <a href="https://www.abuelas.org.ar/donaciones" target="_blank" rel="noopener noreferrer">
                      {text.abuelas}
                    </a>
                  </p>
                  <p>
                  <Link to="/bibliography" className="narrow-footer-link">
                    {text.bibliography}
                  </Link>
                  </p>
                  <p>{text.legal_lease}</p>
      </footer>
    </div>
  );
}

export default NarrowLandingPage;