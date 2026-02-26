/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';

interface GlobalAiDrawerContextValue {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const GlobalAiDrawerContext = createContext<GlobalAiDrawerContextValue | undefined>(undefined);

export const GlobalAiDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<GlobalAiDrawerContextValue>(() => ({
    isOpen,
    openDrawer: () => setIsOpen(true),
    closeDrawer: () => setIsOpen(false),
    toggleDrawer: () => setIsOpen((current) => !current),
  }), [isOpen]);

  return (
    <GlobalAiDrawerContext.Provider value={value}>
      {children}
    </GlobalAiDrawerContext.Provider>
  );
};

export const useGlobalAiDrawer = () => {
  const context = useContext(GlobalAiDrawerContext);
  if (!context) {
    throw new Error('useGlobalAiDrawer deve ser usado dentro de GlobalAiDrawerProvider.');
  }

  return context;
};
