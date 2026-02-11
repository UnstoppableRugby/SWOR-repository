import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface JourneyContribution {
  id: string;
  journey_id: string;
  contributor_id: string | null;
  contributor_name: string | null;
  contributor_email: string | null;
  contributor_relationship: string | null;
  type: 'text' | 'moment' | 'person' | 'organisation' | 'image' | 'document' | 'period' | 'section_proposal' | 'invitation';
  content: Record<string, any>;
  status: 'draft' | 'submitted_for_review' | 'approved' | 'rejected' | 'archived';
  visibility: 'private_draft' | 'family' | 'connections' | 'public';
  rejection_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  storage_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributionAuditEntry {
  id: string;
  contribution_id: string | null;
  journey_id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  before_snapshot: any;
  after_snapshot: any;
  created_at: string;
}

interface UseJourneyContributionsReturn {
  contributions: JourneyContribution[];
  auditLog: ContributionAuditEntry[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // CRUD operations
  fetchContributions: (journeyId: string, filters?: { status?: string; type?: string }) => Promise<void>;
  createContribution: (data: Partial<JourneyContribution> & { journey_id: string; type: string }) => Promise<JourneyContribution | null>;
  updateContribution: (id: string, data: Partial<JourneyContribution>, actorId?: string, actorName?: string) => Promise<JourneyContribution | null>;
  deleteContribution: (id: string, actorId?: string, actorName?: string) => Promise<boolean>;
  submitForReview: (id: string, actorId?: string, actorName?: string) => Promise<boolean>;
  approveContribution: (id: string, reviewerId?: string, reviewerName?: string) => Promise<boolean>;
  rejectContribution: (id: string, rejectionNote?: string, reviewerId?: string, reviewerName?: string) => Promise<boolean>;
  batchSave: (journeyId: string, items: any[], actorId?: string, actorName?: string) => Promise<{ saved: any[]; errors: any[] }>;
  fetchAuditLog: (journeyId: string) => Promise<void>;
  clearError: () => void;
}

export function useJourneyContributions(): UseJourneyContributionsReturn {
  const [contributions, setContributions] = useState<JourneyContribution[]>([]);
  const [auditLog, setAuditLog] = useState<ContributionAuditEntry[]>([]);
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

  const fetchContributions = useCallback(async (journeyId: string, filters?: { status?: string; type?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await invokeFunction('get_contributions', {
        journey_id: journeyId,
        status: filters?.status,
        type: filters?.type
      });
      setContributions(data.contributions || []);
    } catch (err: any) {
      console.error('[useJourneyContributions] fetchContributions error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createContribution = useCallback(async (contributionData: Partial<JourneyContribution> & { journey_id: string; type: string }): Promise<JourneyContribution | null> => {
    setSaving(true);
    setError(null);
    try {
      const data = await invokeFunction('create_contribution', contributionData);
      const newContribution = data.contribution;
      setContributions(prev => [newContribution, ...prev]);
      return newContribution;
    } catch (err: any) {
      console.error('[useJourneyContributions] createContribution error:', err);
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateContribution = useCallback(async (id: string, updateData: Partial<JourneyContribution>, actorId?: string, actorName?: string): Promise<JourneyContribution | null> => {
    setSaving(true);
    setError(null);
    try {
      const data = await invokeFunction('update_contribution', {
        id,
        ...updateData,
        actor_id: actorId,
        actor_name: actorName
      });
      const updated = data.contribution;
      setContributions(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      return updated;
    } catch (err: any) {
      console.error('[useJourneyContributions] updateContribution error:', err);
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteContribution = useCallback(async (id: string, actorId?: string, actorName?: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await invokeFunction('delete_contribution', { id, actor_id: actorId, actor_name: actorName });
      setContributions(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err: any) {
      console.error('[useJourneyContributions] deleteContribution error:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const submitForReview = useCallback(async (id: string, actorId?: string, actorName?: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await invokeFunction('submit_for_review', { id, actor_id: actorId, actor_name: actorName });
      setContributions(prev => prev.map(c => c.id === id ? { ...c, status: 'submitted_for_review' as const } : c));
      return true;
    } catch (err: any) {
      console.error('[useJourneyContributions] submitForReview error:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const approveContribution = useCallback(async (id: string, reviewerId?: string, reviewerName?: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const data = await invokeFunction('approve_contribution', { id, reviewer_id: reviewerId, reviewer_name: reviewerName });
      setContributions(prev => prev.map(c => c.id === id ? { ...c, ...data.contribution } : c));
      return true;
    } catch (err: any) {
      console.error('[useJourneyContributions] approveContribution error:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const rejectContribution = useCallback(async (id: string, rejectionNote?: string, reviewerId?: string, reviewerName?: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const data = await invokeFunction('reject_contribution', { id, rejection_note: rejectionNote, reviewer_id: reviewerId, reviewer_name: reviewerName });
      setContributions(prev => prev.map(c => c.id === id ? { ...c, ...data.contribution } : c));
      return true;
    } catch (err: any) {
      console.error('[useJourneyContributions] rejectContribution error:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const batchSave = useCallback(async (journeyId: string, items: any[], actorId?: string, actorName?: string): Promise<{ saved: any[]; errors: any[] }> => {
    setSaving(true);
    setError(null);
    try {
      const data = await invokeFunction('batch_save', {
        journey_id: journeyId,
        items,
        actor_id: actorId,
        actor_name: actorName
      });
      // Refresh contributions after batch save
      await fetchContributions(journeyId);
      return { saved: data.saved || [], errors: data.errors || [] };
    } catch (err: any) {
      console.error('[useJourneyContributions] batchSave error:', err);
      setError(err.message);
      return { saved: [], errors: [{ error: err.message }] };
    } finally {
      setSaving(false);
    }
  }, [fetchContributions]);

  const fetchAuditLog = useCallback(async (journeyId: string) => {
    try {
      const data = await invokeFunction('get_contribution_audit', { journey_id: journeyId });
      setAuditLog(data.entries || []);
    } catch (err: any) {
      console.error('[useJourneyContributions] fetchAuditLog error:', err);
    }
  }, []);

  return {
    contributions,
    auditLog,
    loading,
    saving,
    error,
    fetchContributions,
    createContribution,
    updateContribution,
    deleteContribution,
    submitForReview,
    approveContribution,
    rejectContribution,
    batchSave,
    fetchAuditLog,
    clearError
  };
}
