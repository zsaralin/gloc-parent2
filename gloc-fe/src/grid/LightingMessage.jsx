import "./LightingMessage.css";
import { getText } from "../config";

function LightingMessage() {
  const text = getText();

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
