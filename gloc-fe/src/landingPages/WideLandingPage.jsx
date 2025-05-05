import React, { useRef , useState, useEffect} from "react";
import "./WideLandingPage.css";
import LanguageButton from "./LanguageButton";
import { getText } from "../config";
import { Link } from "react-router-dom";

function WideLandingPage({ isLoading, isLandingVisible, handleAccessCamera, currLanguage, setCurrLanguage}) {
    const contentRef = useRef(null); // NEW
    const [text, setText] = useState(null);

    useEffect(() => {
      async function loadText() {
        const result = await getText();
        setText(result);
      }
      loadText();
    }, [currLanguage]); // 👈 this makes it re-run when the language changes
    if (!text) return null;

    const scrollToTop = () => {
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  return (
    <div className={`wide-grid-overlay ${isLandingVisible ? "visible" : "hidden"}`}ref={contentRef}>
    <LanguageButton
      currLanguage={currLanguage}
      setCurrLanguage={setCurrLanguage}
    />
      <div className="wide-overlay-content">
        <header className="header">
          <h1>{text.title}</h1>
        </header>
        <main className="wide-content">
          <div className="wide-row-wrapper">
          <div className="wide-row-layout">
          <div className="wide-col scrollable-info">
            {Array.isArray(text.technical_description) &&
            text.technical_description.map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
            </div>
            <div className="wide-col scrollable-info">
            {Array.isArray(text.description) &&
            text.description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
            ))}
            </div>
            <div className="wide-col scrollable-info" >
            <p>{text.instructions[0]}</p> {/* First item as paragraph */}

            <div>
            {text.instructions.slice(1).map((item, index) => (
                <li key={index}>{item}</li>
            ))}
            </div>
            <button
                className="camera-button"
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
          </div>
        </main>
      </div>
      <footer className="footer">
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

export default WideLandingPage;
