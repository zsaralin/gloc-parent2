import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Grid from "./grid/Grid";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Grid />} />
      </Routes>
    </Router>
  );
}

export default App;
