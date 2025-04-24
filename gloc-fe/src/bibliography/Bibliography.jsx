import React from "react";
import "./Bibliography.css";
import { getText } from "../config";

function Bibliography() {
    const text = getText()
    const references = text.references;

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