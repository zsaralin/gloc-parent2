import React, { useEffect, useState } from 'react';
import './OverlayGUI.css';
import { SERVER_URL } from './config';

// Static storage object (Accessible from other files)
export const overlaySettings = {
  refreshTime: 10,
  loadingDuration: 8,
  zoom: 1,
  xOffset: 0,
  yOffset: 0,

  setRefreshTime(value) {
    overlaySettings.refreshTime = value;
    window.dispatchEvent(new Event('refreshTimeUpdated'));
  },
  setLoadingDuration(value) {
    overlaySettings.loadingDuration = value;
    window.dispatchEvent(new Event('loadingDurationUpdated'));
  },
  setZoom(value) {
    overlaySettings.zoom = value;
    window.dispatchEvent(new Event('zoomUpdated'));
  },
  setXOffset(value) {
    overlaySettings.xOffset = value;
    window.dispatchEvent(new Event('xOffsetUpdated'));
  },
  setYOffset(value) {
    overlaySettings.yOffset = value;
    window.dispatchEvent(new Event('yOffsetUpdated'));
  }
};

function OverlayGUI() {
  // ✅ Local state to ensure React updates when values change
  const [refreshTime, setRefreshTime] = useState(overlaySettings.refreshTime);
  const [loadingDuration, setLoadingDuration] = useState(overlaySettings.loadingDuration);
  const [zoom, setZoom] = useState(overlaySettings.zoom);
  const [xOffset, setXOffset] = useState(overlaySettings.xOffset);
  const [yOffset, setYOffset] = useState(overlaySettings.yOffset);

  // ✅ Sync local state with overlaySettings when the component mounts
  useEffect(() => {
    setRefreshTime(overlaySettings.refreshTime);
    setLoadingDuration(overlaySettings.loadingDuration);
    setZoom(overlaySettings.zoom);
    setXOffset(overlaySettings.xOffset);
    setYOffset(overlaySettings.yOffset);
  }, []);

  // ✅ Update overlaySettings and local state when sliders change
  const handleRefreshTimeChange = (e) => {
    const value = parseInt(e.target.value);
    overlaySettings.setRefreshTime(value);
    setRefreshTime(value);
  };

  const handleLoadingDurationChange = (e) => {
    const value = parseInt(e.target.value);
    overlaySettings.setLoadingDuration(value);
    setLoadingDuration(value);
  };

  const handleZoomChange = (e) => {
    const value = parseFloat(e.target.value);
    overlaySettings.setZoom(value);
    setZoom(value);
  };

  const handleXOffsetChange = (e) => {
    const value = parseFloat(e.target.value);
    overlaySettings.setXOffset(value);
    setXOffset(value);
  };

  const handleYOffsetChange = (e) => {
    const value = parseFloat(e.target.value);
    overlaySettings.setYOffset(value);
    setYOffset(value);
  };

  const saveSettings = () => {
    fetch(`${SERVER_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshTime: overlaySettings.refreshTime,
        loadingDuration: overlaySettings.loadingDuration,
        zoom: overlaySettings.zoom,
        xOffset: overlaySettings.xOffset,
        yOffset: overlaySettings.yOffset
      })
    })
      .then(() => console.log("Settings saved successfully"))
      .catch(error => console.error("Error saving settings:", error));
  };

  return (
    <div className="overlay-gui">
      {/* Refresh Time Slider */}
      <div className="slider-container">
        <label>Refresh Time: {refreshTime}</label>
        <input
          type="range"
          min="5"
          max="25"
          step="1"
          value={refreshTime}
          onChange={handleRefreshTimeChange}
        />
      </div>

      {/* Loading Duration Slider */}
      <div className="slider-container">
        <label>Loading Duration: {loadingDuration}</label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={loadingDuration}
          onChange={handleLoadingDurationChange}
        />
      </div>

      {/* Zoom Slider */}
      <div className="slider-container">
        <label>Zoom: {zoom}</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={zoom}
          onChange={handleZoomChange}
        />
      </div>

      {/* X Offset Slider */}
      <div className="slider-container">
        <label>X Offset: {xOffset}</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={xOffset}
          onChange={handleXOffsetChange}
        />
      </div>

      {/* Y Offset Slider */}
      <div className="slider-container">
        <label>Y Offset: {yOffset}</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={yOffset}
          onChange={handleYOffsetChange}
        />
      </div>

      {/* Save Button */}
      <button className="save-button" onClick={saveSettings}>Save</button>
    </div>
  );
}

export default OverlayGUI;
