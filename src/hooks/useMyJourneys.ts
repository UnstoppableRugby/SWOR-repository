import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserJourney {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  journey_id: string;
  journey_name: string;
  journey_type: 'individual' | 'collective' | 'event';
  role: 'owner' | 'steward' | 'contributor';
  status: 'draft' | 'published' | 'archived';
  cover_image: string | null;
  description: string | null;
  country: string | null;
  era: string | null;
  last_edited_at: string;
  created_at: string;
  updated_at: string;
  stats?: {
    pending_contributions: number;
    total_contributions: number;
    approved_contributions: number;
    draft_contributions: number;
  };
}

interface UseMyJourneysReturn {
  journeys: UserJourney[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  fetchJourneys: (userId: string, userEmail?: string) => Promise<void>;
  createJourney: (data: {
    user_id: string;
    user_email: string;
    user_name?: string;
    journey_id: string;
    journey_name: string;
    journey_type?: string;
    role?: string;
    status?: string;
    cover_image?: string;
    description?: string;
    country?: string;
    era?: string;
  }) => Promise<UserJourney | null>;
  updateJourney: (id: string, data: Partial<UserJourney>) => Promise<UserJourney | null>;
  deleteJourney: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useMyJourneys(): UseMyJourneysReturn {
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const invokeFunction = async (action: string, payload: any) => {
    const { data, error: fnError } = await supabase.functions.invoke('swor-contributions', {
      body: { action, payload }
    });

    if (fnError) {
      throw new Error(fnError.message || 'Edge function error');
    }

    if (!data?.success) {
      throw new Error(data?.detail || data?.error || 'Operation failed');
    }

    return data;
  };

  const fetchJourneys = useCallback(async (userId: string, userEmail?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction('get_user_journeys', {
        user_id: userId,
        user_email: userEmail
      });
      setJourneys(data.journeys || []);
    } catch (err: any) {
      console.error('[useMyJourneys] fetchJourneys error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJourney = useCallback(async (journeyData: {
    user_id: string;
    user_email: string;
    user_name?: string;
    journey_id: string;
    journey_name: string;
    journey_type?: string;
    role?: string;
    status?: string;
    cover_image?: string;
    description?: string;
    country?: string;
    era?: string;
  }): Promise<UserJourney | null> => {
    setSaving(true);
    setError(null);
    try {
      const data = await invokeFunction('create_user_journey', journeyData);
      const newJourney = {
        ...data.journey,
        stats: {
          pending_contributions: 0,
          total_contributions: 0,
          approved_contributions: 0,
          draft_contributions: 0
        }
      };
      setJourneys(prev => [newJourney, ...prev]);
      return newJourney;
    } catch (err: any) {
      console.error('[useMyJourneys] createJourney error:', err);
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateJourney = useCallback(async (id: string, updateData: Partial<UserJourney>): Promise<UserJourney | null> => {
    setSaving(true);
    setError(null);
    try {
      const data = await invokeFunction('update_user_journey', {
        id,
        ...updateData
      });
      const updated = data.journey;
      setJourneys(prev => prev.map(j => j.id === id ? { ...j, ...updated } : j));
      return updated;
    } catch (err: any) {
      console.error('[useMyJourneys] updateJourney error:', err);
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteJourney = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await invokeFunction('delete_user_journey', { id });
      setJourneys(prev => prev.filter(j => j.id !== id));
      return true;
    } catch (err: any) {
      console.error('[useMyJourneys] deleteJourney error:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    journeys,
    loading,
    saving,
    error,
    fetchJourneys,
    createJourney,
    updateJourney,
    deleteJourney,
    clearError
  };
}
