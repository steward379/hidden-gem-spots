// context/LastUpdateContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LastUpdateContextType {
  lastUpdate: Date;
  setLastUpdate: (date: Date) => void;
}

const LastUpdateContext = createContext<LastUpdateContextType | null>(null);

export const useLastUpdate = () => {
  const context = useContext(LastUpdateContext);
  if (!context) {
    throw new Error('useLastUpdate must be used within a LastUpdateProvider');
  }
  return context;
};

export const LastUpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date(0));

  return (
    <LastUpdateContext.Provider value={{ lastUpdate, setLastUpdate }}>
      {children}
    </LastUpdateContext.Provider>
  );
};
