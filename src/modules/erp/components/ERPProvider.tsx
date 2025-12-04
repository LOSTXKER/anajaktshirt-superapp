'use client';

import { useEffect, useState, createContext, useContext } from 'react';

interface ERPContextValue {
  isInitialized: boolean;
  isSupabaseConfigured: boolean;
}

const ERPContext = createContext<ERPContextValue>({
  isInitialized: false,
  isSupabaseConfigured: false,
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
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseReady = checkSupabaseConfig();
    setIsSupabaseConfigured(supabaseReady);

    if (supabaseReady) {
      console.log('✅ ERP initialized with Supabase');
    } else {
      console.warn('⚠️ Supabase not configured - check environment variables');
    }
    
    setIsInitialized(true);
  }, []);

  return (
    <ERPContext.Provider value={{ 
      isInitialized, 
      isSupabaseConfigured,
    }}>
      {children}
    </ERPContext.Provider>
  );
}
