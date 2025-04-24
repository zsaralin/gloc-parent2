import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Grid from './grid/Grid'; // Import the Grid component
import { SERVER_URL } from './config';
import Bibliography from './bibliography/Bibliography'

function App() {
  useEffect(() => {
      const path = window.location.pathname;
  
      // 🔁 Case 2: If user refreshes on /camera-active, redirect back to previous path
      if (path === '/camera-active') {
        // Replace the URL and refresh the page
        window.history.replaceState({}, '', '/');
        window.location.reload();
        return;
      }
  
      // 🔙 Case 1: If user presses back from /camera-active
      const handlePopState = () => {
        if (window.location.pathname !== '/camera-active') {
          window.location.reload();
        }
      };
  
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }, []);
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Grid />} />\
          <Route path="/bibliography" element={<Bibliography />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
