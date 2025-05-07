import React, { useRef, useState, useEffect } from "react";
import styles from './WideLandingPage.module.css';
import LanguageButton from "./LanguageButton";
import { getText } from "../config";
import { Link } from "react-router-dom";
import DropdownMenu from "./DropdownMenu.jsx";

function WideLandingPage({
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
  className={`${styles.gridOverlay} ${isLandingVisible ? styles.visible : styles.hidden}`}
  ref={contentRef}
>  

<div className={styles.pageContainer}>

  <div className={styles.topBar}>
  <div className={styles.topBarContainer}>

    <h2 className={styles.topBarTitle}>{text.title}</h2>

    <div className={styles.topBarControls}>
      <LanguageButton currLanguage={currLanguage} setCurrLanguage={setCurrLanguage} />

      <div className={styles.menuContainer} ref={menuContainerRef}>
        <button
          className={styles.hamburgerButton}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
        >
          ☰
        </button>

        {isMenuOpen && (
          <DropdownMenu style = {{marginTop: '4rem', marginRight:'17rem'}}
            ref={dropdownRef}
            text={text}
            currLanguage={currLanguage}
            handleDropdownClick={handleDropdownClick}
          />
        )}
      </div>
    </div>
    </div>

  </div>

  <div className={styles.overlayContent}>
  <div className={styles.heroVideoWrapper}>
      <video
        className={styles.heroVideo}
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        poster="/video_frame.jpg"
        autoPlay
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>
      <div className={styles.heroVideoOverlay}></div>

      <div className={`${styles.heroVideoText} ${textVisible ? styles.visible : ''}`}>
        <h1>{text.title}</h1>
        <h2>{text.rafael}</h2>
      </div>
    </div>

  <div className={`${styles.content} ${styles.wideWork}`} style={{ marginTop: 0 }}>
      <div id="technical_description">
        {text.technical_description.slice(0, 3).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <button className={styles.plusButton} onClick={() => setWorkModalVisible(true)}>+</button>
    </div>

    <div className={`${styles.content} ${styles.wideContext}`}>
    <div id="description">
        {text.description.slice(0, 3).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <button className={styles.plusButton} onClick={() => setContextModalVisible(true)}>+</button>
    </div>

    <div className={`${styles.modalOverlay} ${isWorkModalVisible ? styles.visible : ''}`}>
      <div className={styles.modalContent} ref={workModalRef}>
        <button className={styles.modalClose} onClick={() => setWorkModalVisible(false)}>×</button>
        {text.technical_description.map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
      </div>
    </div>

    <div className={`${styles.modalOverlay} ${isContextModalVisible ? styles.visible : ''}`}>
      <div className={styles.modalContent} ref={contextModalRef}>
        <button className={styles.modalClose} onClick={() => setContextModalVisible(false)}>×</button>
        {text.description.map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
      </div>

    </div>

    <div className={styles.instructionsWrapper} id="instructions">
      <p>{text.instructions[0]}</p>
      <p>
        {text.instructions.slice(1).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </p>
      <button
        className={styles.narrowCameraButton}
        onClick={handleAccessCamera}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className={styles.loadingDots}>
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

  <footer className={styles.narrowFooter}>
    <p>{text.antimetric}</p>
    <p>
      <a href="https://www.abuelas.org.ar/donaciones" target="_blank" rel="noopener noreferrer">
        {text.abuelas}
      </a>
    </p>
    <p>
      <Link to={`/bibliography?lang=${currLanguage}`} className={styles.narrowFooterLink}>
        {text.bibliography}
      </Link>
    </p>
    <p>{text.legal_lease}</p>
  </footer>
</div>
</div>

  );
}

export default WideLandingPage;