'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { initializeLocalStorage, getStorageStats, clearLocalStorage } from '../storage/localStorage';

// Data source type
export type DataSource = 'mock' | 'supabase';

interface ERPContextValue {
  isInitialized: boolean;
  dataSource: DataSource;
  isSupabaseConfigured: boolean;
  stats: Record<string, number>;
  resetData: () => void;
  switchDataSource: (source: DataSource) => void;
}

const ERPContext = createContext<ERPContextValue>({
  isInitialized: false,
  dataSource: 'mock',
  isSupabaseConfigured: false,
  stats: {},
  resetData: () => {},
  switchDataSource: () => {},
});

export function useERP() {
  return useContext(ERPContext);
}

interface ERPProviderProps {
  children: React.ReactNode;
}

// Check if Supabase is configured
function checkSupabaseConfig(): boolean {
  if (typeof window === 'undefined') return false;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!(supabaseUrl && supabaseKey && 
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseKey !== 'your-anon-key-here');
}

export function ERPProvider({ children }: ERPProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseReady = checkSupabaseConfig();
    setIsSupabaseConfigured(supabaseReady);

    // Determine initial data source
    // If Supabase is configured, use it; otherwise use mock
    const savedSource = typeof window !== 'undefined' 
      ? localStorage.getItem('erp_data_source') as DataSource 
      : null;
    
    if (savedSource === 'supabase' && supabaseReady) {
      setDataSource('supabase');
      console.log('🗄️ ERP using Supabase');
    } else {
      // Initialize localStorage with mock data
      initializeLocalStorage();
      setStats(getStorageStats());
      console.log('🧪 ERP using Mock Data (localStorage)');
    }
    
    setIsInitialized(true);
  }, []);

  const resetData = useCallback(() => {
    if (dataSource === 'mock') {
      clearLocalStorage();
      initializeLocalStorage(true);
      setStats(getStorageStats());
    } else {
      // For Supabase, we would need to call a server action or API
      console.warn('Reset data is not supported for Supabase. Use Supabase dashboard.');
    }
  }, [dataSource]);

  const switchDataSource = useCallback((source: DataSource) => {
    if (source === 'supabase' && !isSupabaseConfigured) {
      console.error('Cannot switch to Supabase: not configured');
      return;
    }
    
    setDataSource(source);
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_data_source', source);
    }
    
    if (source === 'mock') {
      initializeLocalStorage();
      setStats(getStorageStats());
      console.log('🧪 Switched to Mock Data');
    } else {
      console.log('🗄️ Switched to Supabase');
    }
  }, [isSupabaseConfigured]);

  return (
    <ERPContext.Provider value={{ 
      isInitialized, 
      dataSource,
      isSupabaseConfigured,
      stats, 
      resetData,
      switchDataSource,
    }}>
      {children}
    </ERPContext.Provider>
  );
}
