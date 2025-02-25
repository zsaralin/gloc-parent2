import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Grid from './grid/Grid'; // Import the Grid component
// function setHeight() {
//   document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
// }

// window.addEventListener('resize', setHeight);
// setHeight();
const socket = new WebSocket("ws://sandbx.levelofconfidence.net");

// When the connection opens
socket.onopen = () => {
    console.log("Connected to WebSocket server");
};

// When the connection closes
socket.onclose = () => {
    console.log("Disconnected from WebSocket server");
};

// Handle incoming messages (if needed)
socket.onmessage = (event) => {
    console.log("Message from server:", event.data);
};

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
