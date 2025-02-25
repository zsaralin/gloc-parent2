import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Grid from './grid/Grid';
import { SERVER_URL } from './config'; // Import server URL

function App() {
  useEffect(() => {
    let checkInterval;

    async function checkServer() {
      // try {
      //   const response = await fetch(SERVER_URL, { method: "HEAD", cache: "no-store" });
      //   if (!response.ok) {
      //     throw new Error("Server unreachable");
      //   }
      // } catch (error) {
      //   console.error("Server is down:", error);
      //   // alert("Connection to server lost. The app will close.");
        window.location.href = "/error"; // Redirect to an error page or force reload
        clearInterval(checkInterval);
      // }
    }

    checkInterval = setInterval(checkServer, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval); // Cleanup on unmount
  }, []);

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
