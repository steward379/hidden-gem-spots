// src/context/NotificationContext.js
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [lastFollowers, setLastFollowers] = useState([]);
  const [lastMaps, setLastMaps] = useState({});

  return (
    <NotificationContext.Provider value={{ lastFollowers, setLastFollowers, lastMaps, setLastMaps }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);