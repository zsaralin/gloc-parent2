import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Grid from './grid/Grid'; // Import the Grid component
import { io } from "socket.io-client";
import { SERVER_URL } from './config';
const socket = io(SERVER_URL);

// Listen for reload command from the backend
socket.on("forceReload", () => {
    console.warn("Server requested a forced reload.");
    window.location.reload(); // 🔴 Force page reload
});

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
