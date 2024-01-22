import React, { createContext, useContext, useState } from 'react';

// 在 createContext 中提供一個初始值（defaultValue）
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

