import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Grid from './grid/Grid'; // Import the Grid component
import { SERVER_URL } from './config';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Grid />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
