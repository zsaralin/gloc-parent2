import React, { useState, useEffect } from "react";
import "./Bibliography.css";
import { getText } from "../config";
import { useLocation } from "react-router-dom";

function Bibliography() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const lang = params.get("lang");

  const [text, setText] = useState(null);
  const [references, setReferences] = useState([]);

  useEffect(() => {
    async function loadText() {
      const result = await getText(lang); // optionally pass lang
      setText(result);
      setReferences(result.references || []);
    }

    if (lang) {
      loadText();
    }
  }, [lang]);

  if (!text) return null;

  return (
    <div className="bibliography-page">
      <h1>{text.bibliography}</h1>
      <ul className="bibliography-list">
        {references.map((ref, index) => (
          <li key={index}>
            <a href={ref.url} target="_blank" rel="noopener noreferrer">
              {ref.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Bibliography;
