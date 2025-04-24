import "./LightingMessage.css";
import { getText } from "../config";
import { useState, useEffect } from "react";
function LightingMessage() {
  const [text, setText] = useState(null);

  useEffect(() => {
    async function loadText() {
      const result = await getText();
      setText(result);
    }
    loadText();
  }, []);
  if(!text) return

  const handleOkClick = () => {
    const overlay = document.querySelector(".poor-lighting-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";

    }
  };

  return (
    <div className="poor-lighting-overlay">
      <span className="lighting-text">
        {text.no_landmarks}
        {text.lighting_message}
      </span>
      <button className="lighting-ok-button" onClick={handleOkClick}>
        {text.ok}
      </button>
    </div>
  );
}

export default LightingMessage;
