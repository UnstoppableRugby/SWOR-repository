import React, { useState, useRef } from 'react';
import {
  Search, AlertTriangle, Shield, Loader2, CheckCircle, X,
  MapPin, RotateCcw, Trash2, Archive, ChevronDown, ChevronUp,
  Clock, FileText, Info, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StewardResetGuidance from './StewardResetGuidance';

interface SafeResetPanelProps {
  userId: string | null;
  userEmail: string;
  isGlobalSteward: boolean;
}

interface SearchResult {
  profile_id: string;
  profile_name: string;
  full_name: string | null;
  known_as: string | null;
  title: string | null;
  country: string | null;
  era: string | null;
  roles: string[] | null;
  status: string;
}

interface ResetHistoryEntry {
  id: string;
  profile_id: string;
  reset_mode: string;
  requested_by_email: string;
  reason: string | null;
  counts_json: any;
  created_at: string;
}

const REQUIRED_CONFIRM_PHRASE = 'RESET THIS PROFILE';

// Reason options with codes
const REASON_OPTIONS: { code: string; label: string }[] = [
  { code: '', label: 'Select a reason...' },
  { code: 'testing_clean_slate', label: 'Testing clean slate' },
  { code: 'remove_duplicates', label: 'Remove old duplicate uploads' },
  { code: 'governance_update', label: 'Rebuild after governance update' },
  { code: 'requested_by_owner', label: 'Requested by profile owner' },
  { code: 'other', label: 'Other (add a short note)' },
];

const SafeResetPanel: React.FC<SafeResetPanelProps> = ({ userId, userEmail, isGlobalSteward }) => {
  // Profile search state
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SearchResult | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset config state
  const [resetMode, setResetMode] = useState<'soft' | 'hard'>('soft');
  const [reasonCode, setReasonCode] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [showHardWarning, setShowHardWarning] = useState(false);

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [resetError, setResetError] = useState('');

  // Reset history state
  const [resetHistory, setResetHistory] = useState<ResetHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Derived values
  const isConfirmValid = confirmPhrase === REQUIRED_CONFIRM_PHRASE;
  const selectedReasonOption = REASON_OPTIONS.find(r => r.code === reasonCode);
  const reasonLabel = selectedReasonOption?.label || '';
  const isReasonValid = reasonCode !== '' && (reasonCode !== 'other' || (reasonNote.trim().length > 0 && reasonNote.trim().length <= 240));
  const isFormComplete = !!selectedProfile && isReasonValid && isConfirmValid;

  // Build the combined reason string for the backend
  const buildReasonString = (): string => {
    if (reasonCode === 'other') {
      return reasonNote.trim();
    }
    return reasonLabel;
  };

  // Profile search with debounce
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    setSelectedProfile(null);
    setResetResult(null);
    setResetError('');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => searchProfiles(value), 350);
    } else {
      setSearchResults([]);
    }
  };

  const searchProfiles = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'search_profiles_for_assignment',
          payload: { query: query.trim(), limit: 20, user_id: userId, user_email: userEmail }
        }
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        setSearchResults(data.profiles || []);
      }
    } catch (err: any) {
      console.error('Profile search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectProfile = (profile: SearchResult) => {
    setSelectedProfile(profile);
    setSearchInput('');
    setSearchResults([]);
    setResetResult(null);
    setResetError('');
    setConfirmPhrase('');
    setResetMode('soft');
    setReasonCode('');
    setReasonNote('');
    setShowHistory(false);
    setResetHistory([]);
  };

  const clearProfile = () => {
    setSelectedProfile(null);
    setSearchInput('');
    setSearchResults([]);
    setResetResult(null);
    setResetError('');
    setConfirmPhrase('');
    setReasonCode('');
    setReasonNote('');
    setShowHistory(false);
    setResetHistory([]);
  };

  // Execute reset
  const handleExecuteReset = async () => {
    if (!selectedProfile) return;
    if (!isFormComplete) return;

    setExecuting(true);
    setResetError('');
    setResetResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'reset_profile',
          payload: {
            profile_id: selectedProfile.profile_id,
            user_id: userId,
            user_email: userEmail,
            reset_mode: resetMode,
            reason: buildReasonString(),
            reason_code: reasonCode,
            reason_note: reasonCode === 'other' ? reasonNote.trim() : undefined,
            confirm_phrase: confirmPhrase,
          }
        }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || data?.error || 'Reset failed');
      setResetResult(data);
      setConfirmPhrase('');
    } catch (err: any) {
      setResetError(err.message || 'Reset failed. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  // Fetch reset history
  const fetchResetHistory = async () => {
    if (!selectedProfile) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'get_profile_reset_history',
          payload: { profile_id: selectedProfile.profile_id, user_id: userId, user_email: userEmail }
        }
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        setResetHistory(data.resets || []);
      }
    } catch (err: any) {
      console.error('Failed to load reset history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!isGlobalSteward) {
    return (
      <div className="bg-white rounded-xl p-8 border border-[#1A2332]/10 text-center">
        <Shield className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
        <p className="text-[#1A2332]/60">Safe Reset is only available to global stewards.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">Safe Profile Reset</h3>
            <p className="text-sm text-amber-800 mt-1">
              This tool resets a profile's content back to a clean slate for onboarding or testing.
              It does <strong>not</strong> delete system tables, auth records, roles, or audit logs.
              All reset actions are permanently recorded.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-amber-700">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Steward-only</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Fully audited</span>
              <span className="flex items-center gap-1"><Archive className="w-3 h-3" /> Recovery possible (soft)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Guidance Panel */}
      <StewardResetGuidance />

      {/* Step 1: Select Profile */}
      <div className="bg-white rounded-xl p-6 border border-[#1A2332]/10">
        <h3 className="font-medium text-[#1A2332] mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#1A2332] text-white text-xs flex items-center justify-center font-bold">1</span>
          Select Profile
        </h3>

        {selectedProfile ? (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-[#8B9D83]/40 bg-[#8B9D83]/5">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle className="w-5 h-5 text-[#8B9D83] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1A2332] truncate">{selectedProfile.profile_name}</p>
                <div className="flex items-center gap-2 text-xs text-[#1A2332]/50">
                  {selectedProfile.country && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{selectedProfile.country}</span>}
                  {selectedProfile.era && <span>{selectedProfile.era}</span>}
                  <span className="px-1.5 py-0.5 bg-[#1A2332]/5 rounded">{selectedProfile.status}</span>
                </div>
              </div>
            </div>
            <button onClick={clearProfile} className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[36px] min-w-[36px] flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search by name (e.g. Harry Roberts, Sue Dorrington)..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-[#B8826D] animate-spin" />
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-[#1A2332]/20 shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.profile_id}
                    onClick={() => selectProfile(p)}
                    className="w-full text-left px-4 py-3 hover:bg-[#F5F1E8] transition-colors border-b border-[#1A2332]/5 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-[#1A2332]">{p.profile_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[#1A2332]/50 mt-0.5">
                      {p.country && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.country}</span>}
                      {p.era && <span>{p.era}</span>}
                      <span className="px-1.5 py-0.5 bg-[#1A2332]/5 rounded">{p.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchInput.trim().length >= 2 && !searching && searchResults.length === 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-[#1A2332]/20 shadow-lg px-4 py-3">
                <p className="text-sm text-[#1A2332]/40">No profiles found matching "{searchInput}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Choose Reset Mode (only shown after profile selected) */}
      {selectedProfile && !resetResult && (
        <div className="bg-white rounded-xl p-6 border border-[#1A2332]/10">
          <h3 className="font-medium text-[#1A2332] mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#1A2332] text-white text-xs flex items-center justify-center font-bold">2</span>
            Choose Reset Mode
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Soft Reset */}
            <button
              onClick={() => { setResetMode('soft'); setShowHardWarning(false); }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                resetMode === 'soft'
                  ? 'border-[#8B9D83] bg-[#8B9D83]/5 ring-1 ring-[#8B9D83]/20'
                  : 'border-[#1A2332]/10 hover:border-[#1A2332]/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Archive className={`w-5 h-5 ${resetMode === 'soft' ? 'text-[#8B9D83]' : 'text-[#1A2332]/40'}`} />
                <span className="font-medium text-[#1A2332]">Soft Reset</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#8B9D83]/20 text-[#8B9D83] font-medium">RECOMMENDED</span>
              </div>
              <ul className="text-xs text-[#1A2332]/60 space-y-1 ml-7">
                <li>Profile reverted to draft state</li>
                <li>Content fields cleared to empty</li>
                <li>Archive items set to "archived" (hidden, recoverable)</li>
                <li>Commendations set to "archived" (hidden, recoverable)</li>
                <li>Storage files kept for recovery</li>
              </ul>
            </button>

            {/* Hard Reset */}
            <button
              onClick={() => { setResetMode('hard'); setShowHardWarning(true); }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                resetMode === 'hard'
                  ? 'border-red-400 bg-red-50 ring-1 ring-red-200'
                  : 'border-[#1A2332]/10 hover:border-[#1A2332]/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className={`w-5 h-5 ${resetMode === 'hard' ? 'text-red-500' : 'text-[#1A2332]/40'}`} />
                <span className="font-medium text-[#1A2332]">Hard Reset</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600 font-medium">ADVANCED</span>
              </div>
              <ul className="text-xs text-[#1A2332]/60 space-y-1 ml-7">
                <li>Profile reverted to draft state</li>
                <li>Content fields cleared to empty</li>
                <li>Archive items <strong>deleted</strong> from database</li>
                <li>Commendations <strong>deleted</strong> from database</li>
                <li>Milestones <strong>deleted</strong> from database</li>
                <li>Storage files queued for cleanup (not deleted immediately)</li>
              </ul>
            </button>
          </div>

          {/* Hard reset extra warning */}
          {showHardWarning && resetMode === 'hard' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Hard reset permanently deletes content rows.</p>
                  <p className="text-xs text-red-700 mt-1">
                    Archive items, commendations, and milestones will be removed from the database.
                    Storage files will be queued for manual cleanup. Audit logs are never deleted.
                    Only use this if you are certain the content should not be recovered.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Reason + Confirmation (only shown after profile selected and no result yet) */}
      {selectedProfile && !resetResult && (
        <div className="bg-white rounded-xl p-6 border border-[#1A2332]/10">
          <h3 className="font-medium text-[#1A2332] mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#1A2332] text-white text-xs flex items-center justify-center font-bold">3</span>
            Confirm Reset
          </h3>

          <div className="space-y-4">
            {/* Reason for reset (required) */}
            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">
                Reason for reset <span className="text-red-500">*</span>
              </label>
              <select
                value={reasonCode}
                onChange={(e) => {
                  setReasonCode(e.target.value);
                  if (e.target.value !== 'other') setReasonNote('');
                }}
                disabled={executing}
                className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 appearance-none bg-white ${
                  reasonCode ? 'border-[#8B9D83] text-[#1A2332]' : 'border-[#1A2332]/20 text-[#1A2332]/50'
                }`}
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} disabled={opt.code === ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {!reasonCode && (
                <p className="text-xs text-[#1A2332]/40 mt-1">A reason is required before you can reset.</p>
              )}
            </div>

            {/* Other note (shown only when "Other" is selected) */}
            {reasonCode === 'other' && (
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">
                  Short note <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reasonNote}
                  onChange={(e) => {
                    if (e.target.value.length <= 240) setReasonNote(e.target.value);
                  }}
                  placeholder="One sentence is enough."
                  rows={2}
                  className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 resize-none ${
                    reasonNote.trim().length > 0 ? 'border-[#8B9D83]' : 'border-[#1A2332]/20'
                  }`}
                  disabled={executing}
                />
                <div className="flex items-center justify-between mt-1">
                  {reasonNote.trim().length === 0 && (
                    <p className="text-xs text-amber-600">A short note is required when selecting "Other".</p>
                  )}
                  <p className={`text-xs ml-auto ${reasonNote.length > 220 ? 'text-amber-600' : 'text-[#1A2332]/30'}`}>
                    {reasonNote.length}/240
                  </p>
                </div>
              </div>
            )}

            {/* Typed confirmation */}
            <div>
              <label className="block text-sm font-medium text-[#1A2332] mb-1">
                Type <span className="font-mono bg-[#1A2332]/5 px-1.5 py-0.5 rounded text-[#B8826D]">{REQUIRED_CONFIRM_PHRASE}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => { setConfirmPhrase(e.target.value); setResetError(''); }}
                placeholder={REQUIRED_CONFIRM_PHRASE}
                className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  confirmPhrase === REQUIRED_CONFIRM_PHRASE
                    ? 'border-[#8B9D83] bg-[#8B9D83]/5 focus:ring-[#8B9D83]/50'
                    : confirmPhrase.length > 0
                    ? 'border-amber-300 bg-amber-50/30 focus:ring-amber-300/50'
                    : 'border-[#1A2332]/20 bg-white focus:ring-[#B8826D]/50'
                }`}
                disabled={executing}
              />
              {confirmPhrase.length > 0 && !isConfirmValid && (
                <p className="text-xs text-amber-600 mt-1">Phrase doesn't match yet. Keep typing.</p>
              )}
              {isConfirmValid && (
                <p className="text-xs text-[#8B9D83] mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Confirmation phrase matches.
                </p>
              )}
            </div>

            {/* Error display */}
            {resetError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{resetError}</p>
              </div>
            )}

            {/* Calm confirmation microcopy */}
            <div className={`p-4 rounded-lg border ${resetMode === 'hard' ? 'bg-red-50/50 border-red-200' : 'bg-[#F5F1E8] border-[#1A2332]/10'}`}>
              <p className="text-sm text-[#1A2332]">
                <strong>{resetMode === 'soft' ? 'Soft' : 'Hard'} reset</strong> will be applied to{' '}
                <strong>"{selectedProfile.profile_name}"</strong>
              </p>
              <p className="text-xs text-[#1A2332]/50 mt-1">
                {resetMode === 'soft'
                  ? 'Soft reset is recommended for testing. It hides previous drafts but keeps recovery possible.'
                  : 'Content rows will be permanently deleted. Storage files will be queued for manual cleanup. The profile record remains.'}
              </p>
            </div>

            {/* Execute button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={clearProfile}
                disabled={executing}
                className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#F5F1E8] transition-colors min-h-[44px] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={executing || !isFormComplete}
                className={`px-6 py-2 text-white rounded-lg transition-colors min-h-[44px] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                  resetMode === 'hard'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Execute {resetMode === 'soft' ? 'Soft' : 'Hard'} Reset
                  </>
                )}
              </button>
            </div>

            {/* Readiness checklist (subtle) */}
            {!isFormComplete && (
              <div className="pt-1">
                <p className="text-[10px] text-[#1A2332]/30">
                  Reset requires: profile selected
                  {!isReasonValid && ' + reason selected'}
                  {reasonCode === 'other' && reasonNote.trim().length === 0 && ' + short note'}
                  {!isConfirmValid && ' + confirmation phrase'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Result */}
      {resetResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">Reset complete</h3>
              <p className="text-sm text-green-800 mt-1">
                {resetResult.reset_mode === 'soft'
                  ? 'This profile is back in draft state. Previous drafts are hidden but recoverable.'
                  : 'This profile is back in draft state. Content rows have been removed.'}
              </p>

              {/* Counts */}
              {resetResult.counts && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-green-800">{resetResult.counts.archive_items_affected || 0}</p>
                    <p className="text-[10px] text-green-700">Archive items {resetResult.reset_mode === 'soft' ? 'archived' : 'deleted'}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-green-800">{resetResult.counts.commendations_affected || 0}</p>
                    <p className="text-[10px] text-green-700">Commendations {resetResult.reset_mode === 'soft' ? 'archived' : 'deleted'}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-green-800">{resetResult.counts.milestones_affected || 0}</p>
                    <p className="text-[10px] text-green-700">Milestones {resetResult.reset_mode === 'soft' ? 'preserved' : 'deleted'}</p>
                  </div>
                  {resetResult.reset_mode === 'hard' && (
                    <div className="bg-white/60 rounded-lg px-3 py-2">
                      <p className="text-lg font-bold text-green-800">{resetResult.counts.cleanup_queue_count || 0}</p>
                      <p className="text-[10px] text-green-700">Files queued for cleanup</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button
                  onClick={clearProfile}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors min-h-[40px] text-sm"
                >
                  Done
                </button>
                {resetResult.profile_id && (
                  <button
                    onClick={() => {
                      // Navigate to profile (open in same window context)
                      window.open(`/people/${resetResult.profile_id}`, '_blank');
                    }}
                    className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors min-h-[40px] text-sm flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open profile
                  </button>
                )}
                <span className="text-xs text-green-700">
                  Reset at {resetResult.reset_at ? formatDate(resetResult.reset_at) : 'just now'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset History (expandable, only when profile selected) */}
      {selectedProfile && (
        <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
          <button
            onClick={() => {
              if (!showHistory) {
                setShowHistory(true);
                fetchResetHistory();
              } else {
                setShowHistory(false);
              }
            }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F5F1E8]/50 transition-colors min-h-[44px] text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1A2332]/50" />
              <span className="text-sm font-medium text-[#1A2332]">Reset History for this Profile</span>
              {showHistory && resetHistory.length > 0 && (
                <span className="text-xs text-[#1A2332]/40">({resetHistory.length} entries)</span>
              )}
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-[#1A2332]/40" /> : <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />}
          </button>

          {showHistory && (
            <div className="px-6 py-4 border-t border-[#1A2332]/10">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" />
                  <span className="text-sm text-[#1A2332]/50 ml-2">Loading history...</span>
                </div>
              ) : resetHistory.length === 0 ? (
                <p className="text-sm text-[#1A2332]/40 py-2 text-center">No previous resets for this profile.</p>
              ) : (
                <div className="space-y-3">
                  {resetHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 bg-[#F5F1E8]/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        entry.reset_mode === 'hard' ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        {entry.reset_mode === 'hard' ? (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        ) : (
                          <Archive className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                            entry.reset_mode === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {entry.reset_mode === 'hard' ? 'Hard Reset' : 'Soft Reset'}
                          </span>
                          <span className="text-xs text-[#1A2332]/40">{formatDate(entry.created_at)}</span>
                        </div>
                        <p className="text-xs text-[#1A2332]/60 mt-1">By: {entry.requested_by_email}</p>
                        {entry.reason && (
                          <p className="text-xs text-[#1A2332]/50 mt-1 italic">"{entry.reason}"</p>
                        )}
                        {entry.counts_json && (
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-[#1A2332]/40">
                            <span>Archive: {entry.counts_json.archive_items_affected || 0}</span>
                            <span>Commendations: {entry.counts_json.commendations_affected || 0}</span>
                            <span>Milestones: {entry.counts_json.milestones_affected || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info box when no profile selected */}
      {!selectedProfile && (
        <div className="bg-white rounded-xl p-6 border border-[#1A2332]/10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#1A2332]/30 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-[#1A2332]/60">How Safe Reset Works</h4>
              <div className="mt-2 space-y-2 text-xs text-[#1A2332]/50">
                <p><strong>Soft Reset (recommended):</strong> Archives all content (hidden but recoverable). Profile returns to draft state. Storage files are preserved. Best for re-onboarding.</p>
                <p><strong>Hard Reset:</strong> Permanently deletes content rows from the database. Storage files are queued for manual cleanup. Use only when content should not be recovered.</p>
                <p className="pt-1 border-t border-[#1A2332]/5"><strong>Never affected:</strong> User accounts, authentication, roles, steward assignments, and all audit logs are never touched by either reset mode.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeResetPanel;
