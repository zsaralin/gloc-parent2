import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Grid from './grid/Grid'; // Import the Grid component
import { SERVER_URL } from './config';
import Bibliography from './bibliography/Bibliography'

function App() {
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
