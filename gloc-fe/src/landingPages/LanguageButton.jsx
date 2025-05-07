import React, { useState } from "react";
import { setLanguage } from "../config";
import styles from './LanguageButton.module.css';

function LanguageButton({ currLanguage, setCurrLanguage }) {
    const handleClick = () => {
      const newLang = currLanguage === "es" ? "en" : "es";
      setCurrLanguage(newLang);
      setLanguage(newLang)
    };
  
    return (
      <button className= {styles.languageButton} onClick={handleClick}>
        {currLanguage === "es" ? "English" : "Español"}
      </button>
    );
  }
  

export default LanguageButton;
