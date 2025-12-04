'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { initializeLocalStorage, getStorageStats, clearLocalStorage } from '../storage/localStorage';

interface ERPContextValue {
  isInitialized: boolean;
  stats: Record<string, number>;
  resetData: () => void;
}

const ERPContext = createContext<ERPContextValue>({
  isInitialized: false,
  stats: {},
  resetData: () => {},
});

export function useERP() {
  return useContext(ERPContext);
}

interface ERPProviderProps {
  children: React.ReactNode;
}

export function ERPProvider({ children }: ERPProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    // Initialize localStorage with mock data on first load
    initializeLocalStorage();
    setStats(getStorageStats());
    setIsInitialized(true);
  }, []);

  const resetData = () => {
    clearLocalStorage();
    initializeLocalStorage(true);
    setStats(getStorageStats());
  };

  return (
    <ERPContext.Provider value={{ isInitialized, stats, resetData }}>
      {children}
    </ERPContext.Provider>
  );
}

