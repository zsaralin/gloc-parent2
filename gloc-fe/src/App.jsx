import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './LandingPage'; // Import the LandingPage component
import Grid from './grid/Grid'; // Import the Grid component

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Define routes for each page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/grid" element={<Grid />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
