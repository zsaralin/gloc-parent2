import React, { createContext, useState, useEffect } from 'react';
import { SERVER_URL } from './config';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [refreshTime, setRefreshTime] = useState(10);
  const [loadingDuration, setLoadingDuration] = useState(8);

  useEffect(() => {
    fetch(`${SERVER_URL}/settings`)
      .then(response => response.json())
      .then(data => {
        setRefreshTime(data.refreshTime || 10);
        setLoadingDuration(data.loadingDuration || 8);
      })
      .catch(() => console.log("No saved settings found, using defaults."));
  }, []);

  return (
    <SettingsContext.Provider value={{ refreshTime, setRefreshTime, loadingDuration, setLoadingDuration }}>
      {children}
    </SettingsContext.Provider>
  );
};
