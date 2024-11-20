import React, { useState } from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const [language, setLanguage] = useState('ENGLISH');

  // Toggle between ENGLISH and SPANISH
  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === 'ENGLISH' ? 'SPANISH' : 'ENGLISH'));
  };
  const navigate = useNavigate();

  const handleAccessCamera = async () => {
    // Check if permission has already been granted
    const cameraAccessGranted = localStorage.getItem('cameraAccessGranted');
    if (cameraAccessGranted) {
      navigate('/grid'); // Navigate directly if access was already granted
      return;
    }

    try {
      // Request access to the user's camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (stream) {
        localStorage.setItem('cameraAccessGranted', 'true'); // Save access status
        navigate('/grid'); // Navigate to the Grid page
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access is required to proceed.');
    }
  };
  return (
    <div className="landing-page">
      {/* Language Toggle Button */}
      <button className="language-button" onClick={toggleLanguage}>
        {language}
      </button>

      <header className="header">
        <h1>Global Level of Confidence</h1>
      </header>
      <main className="content">
        <p>{language === 'ENGLISH' ? '[Placeholder for Project Info]' : '[Espacio reservado para la información del proyecto]'}</p>
        <p>{language === 'ENGLISH' ? '[Placeholder for Legal Lease]' : '[Espacio reservado para el contrato legal]'}</p>
        <ul>
          <li>
            {language === 'ENGLISH'
              ? 'We will require access to your camera.'
              : 'Requeriremos acceso a su cámara.'}
          </li>
          <li>
            {language === 'ENGLISH'
              ? 'Your facial landmarks will be extracted.'
              : 'Se extraerán los puntos faciales.'}
          </li>
          <li>
            {language === 'ENGLISH'
              ? 'No data is retained.'
              : 'No se retendrán datos.'}
          </li>
        </ul>
        <button className="camera-button" onClick={handleAccessCamera}>
        Access My Camera
      </button>      </main>
    </div>
  );
}

export default LandingPage;
