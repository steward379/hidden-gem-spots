import React, { createContext, useContext, useState } from 'react';

const GlobeContext = createContext({ isVisible: true, setIsVisible: (isVisible: boolean) => {} });

export const GlobeProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <GlobeContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </GlobeContext.Provider>
  );
};

export const useGlobe = () => {
  return useContext(GlobeContext);
};

