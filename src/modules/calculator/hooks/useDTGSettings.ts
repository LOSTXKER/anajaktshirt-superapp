'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { DTGSettings, DEFAULT_SETTINGS } from '../types';

export function useDTGSettings() {
  const [settings, setSettings] = useState<DTGSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error: queryError } = await supabase
        .from('dtg_settings')
        .select('key, value');

      if (queryError) {
        // If table doesn't exist, use defaults
        console.warn('DTG settings table not found, using defaults');
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      if (data && data.length > 0) {
        const settingsObj = { ...DEFAULT_SETTINGS };
        data.forEach((row: { key: string; value: number }) => {
          if (row.key in settingsObj) {
            (settingsObj as any)[row.key] = row.value;
          }
        });
        setSettings(settingsObj);
      }
    } catch (err: any) {
      console.error('DTG settings fetch error:', err);
      setError(err.message);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = async (newSettings: Partial<DTGSettings>) => {
    try {
      const supabase = createClient();

      // Upsert each setting
      for (const [key, value] of Object.entries(newSettings)) {
        await supabase
          .from('dtg_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
      return { success: true };
    } catch (err: any) {
      console.error('Save settings error:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, refetch: fetchSettings, saveSettings };
}

