import React, { useRef, useEffect,useLayoutEffect, useState } from "react";
import "./Modal.css";
import ImageModal from "./ImageModal";
import { getText } from "../config";
import { getLanguage } from "../config";

/* ───────────────────────────────────────── helpers ────────────────────────── */
function formatKeyName(key) {
  const stop = ['of','and','in','on','at','for','with','a','an','the','to','by','from'];
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map((w, i) =>
      i === 0 || !stop.includes(w.toLowerCase())
        ? w[0].toUpperCase() + w.slice(1)
        : w.toLowerCase()
    )
    .join(" ");
}

export default function Modal({ images, fullImages, text, onClose }) {
  const stripRef          = useRef(null);
 
  const dragState         = useRef({ startX: 0, startLeft: 0 });
  const pointerIsDownRef  = useRef(false);          // ← NEW
  const isDraggingRef     = useRef(false);
  const [selected, setSelected] = useState(null);
  const [btnText,  setBtnText]  = useState(null);
  const clickStartRef = useRef({ x: 0, y: 0 });

  const nameText = getLanguage() === "es" ? text.nombre : text.name;

  /* build details HTML */
  let detailsHTML = "";
  for (const [k, v] of Object.entries(text)) {
    if (!["numRecords","numeroDeRegistros","name","nombre"].includes(k)) {
      detailsHTML += `<div>${formatKeyName(k)}: ${Array.isArray(v) ? v.join(", ") : v}</div>`;
    }
  }

  useEffect(() => { getText().then(setBtnText); }, []);
  useEffect(() => { stripRef.current?.scrollTo({ left: 0 }); }, [images]);
  const handlePointerDown = (e) => {
    if (e.pointerType === "touch" || e.button !== 0) return; // left-button desktop only
    pointerIsDownRef.current = true;
    dragState.current = {
      startX: e.clientX,
      startLeft: stripRef.current.scrollLeft
    };
    isDraggingRef.current = false;
    stripRef.current.classList.add("dragging");
  };

  const handlePointerMove = (e) => {
    if (!pointerIsDownRef.current) return;                  // ← only while held
    const { startX, startLeft } = dragState.current;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) isDraggingRef.current = true;
    stripRef.current.scrollLeft = startLeft - dx;
  };

  const finishPointer = () => {
    pointerIsDownRef.current = false;
    stripRef.current.classList.remove("dragging");
    // clear drag flag on next frame so img onPointerUp executes first
    requestAnimationFrame(() => { isDraggingRef.current = false; });
  };

  if (!btnText) return null;

  const stripClass =
    images.length === 1 ? "modal-images single" : "modal-images multiple";
    return (
      <>
       <div
  className="modal-overlay"
  onPointerDown={(e) => {
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  }}
  onClick={(e) => {
    const dx = e.clientX - clickStartRef.current.x;
    const dy = e.clientY - clickStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      onClose(); // Real click, not drag
    }
  }}
>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} onMouseLeave={() => {
    isDraggingRef.current = false;
    pointerIsDownRef.current = false;
    stripRef.current?.classList.remove("dragging");
  }}>
            <button className="modal-close-button" onClick={onClose}>×</button>
            <div className="modal-name">{getLanguage() === "es" ? text.nombre : text.name}</div>
  
            <div
  className={`${stripClass}`}
  ref={stripRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
            >
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Modal ${i + 1}`}
                  draggable={false}
                  tabIndex={-1}
                  onPointerUp={() => {
                    if (!isDraggingRef.current) setSelected(fullImages[i]);
                  }}
                />
              ))}
            </div>
  
            <div className="modal-text" dangerouslySetInnerHTML={{ __html: detailsHTML  }} />
  
            <a
              href="https://www.argentina.gob.ar/ciencia/bndg"
              target="_blank"
              rel="noopener noreferrer"
              className="genetic-bank-button"
            >
              {btnText?.appointment}
            </a>
          </div>
        </div>
  
        <ImageModal src={selected} onClose={() => setSelected(null)} />
      </>
    );
  }