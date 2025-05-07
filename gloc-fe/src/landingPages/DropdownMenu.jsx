// DropdownMenu.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./DropdownMenu.css";

const DropdownMenu = React.forwardRef(
  ({ text, currLanguage, handleDropdownClick, className = '', style = {} }, ref) => (
    <div className={`dropdown-menu ${className}`} style={style} ref={ref}>
      <p onClick={() => handleDropdownClick("technical_description")}>
        {text.technical_description?.[0]}
      </p>
      <p onClick={() => handleDropdownClick("description")}>
        {text.description?.[0]}
      </p>
      <p onClick={() => handleDropdownClick("instructions")}>
        {text.instructions?.[0]}
      </p>
      <hr style={{ margin: "0.75rem 0", border: "0.5px solid #444" }} />
      <p>
        <Link
          to={`/bibliography?lang=${currLanguage}`}
          className="narrow-footer-link"
        >
          {text.bibliography}
        </Link>
      </p>
      <p style={{ opacity: 0.6 }}>{text.legal_lease}</p>
    </div>
  )
);

export default DropdownMenu;
