import React, { useState, useEffect } from 'react';
import './Grid.css';
import TopRow from './TopRow';
import BottomSection from './BottomSection';

function Grid() {
  const [topRowHeight, setTopRowHeight] = useState(0);
  useEffect(() => {
    const updateTopRowHeight = () => {
      const isWideScreen = window.innerWidth > window.innerHeight;
      const height = isWideScreen ? window.innerHeight * 0.4 : window.innerHeight * 0.25; // 50% or 25% of viewport height
      setTopRowHeight(height);
      document.documentElement.style.setProperty('--top-row-height', `${height}px`);
    };

    updateTopRowHeight();
    window.addEventListener('resize', updateTopRowHeight);

    return () => {
      window.removeEventListener('resize', updateTopRowHeight);
    };
  }, []);

  return (
    <div className="grid-container">
      <TopRow />
      <BottomSection topRowHeight={topRowHeight} />
    </div>
  );
}

export default Grid;
