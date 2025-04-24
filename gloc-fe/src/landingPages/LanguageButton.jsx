import React, { useState } from "react";
import { setLanguage } from "../config";
function LanguageButton({ currLanguage, setCurrLanguage }) {
    const handleClick = () => {
      const newLang = currLanguage === "es" ? "en" : "es";
      setCurrLanguage(newLang);
      setLanguage(newLang)
    };
  
    return (
      <button className="language-button" onClick={handleClick}>
        {currLanguage === "es" ? "English" : "Español"}
      </button>
    );
  }
  

export default LanguageButton;
