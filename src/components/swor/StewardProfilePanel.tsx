import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, User, Mail, Plus, X, Loader2, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Crown, UserPlus, Trash2, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Steward {
  id: string;
  profile_id: string;
  steward_user_id: string | null;
  steward_name: string;
  steward_email: string | null;
  steward_type: 'global' | 'journey';
  assigned_at: string;
  is_active: boolean;
}

interface StewardProfilePanelProps {
  profileId: string;
  profileName?: string;
  isOwner?: boolean;
  isSteward?: boolean;
  currentUserId?: string;
  variant?: 'compact' | 'full';
}

const StewardProfilePanel: React.FC<StewardProfilePanelProps> = ({
  profileId,
  profileName,
  isOwner = false,
  isSteward = false,
  currentUserId,
  variant = 'full'
}) => {
  const [stewards, setStewards] = useState<Steward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(variant === 'full');
  
  // Assignment form state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [newStewardName, setNewStewardName] = useState('');
  const [newStewardEmail, setNewStewardEmail] = useState('');
  const [newStewardType, setNewStewardType] = useState<'global' | 'journey'>('journey');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);
  
  // Remove state
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Fallback steward (Alun)
  const fallbackSteward = {
    id: 'fallback',
    profile_id: profileId,
    steward_user_id: null,
    steward_name: 'Alun',
    steward_email: 'alun@adesignbranding.co.za',
    steward_type: 'global' as const,
    assigned_at: new Date().toISOString(),
    is_active: true
  };

  const fetchStewards = useCallback(async () => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'get_stewards',
          payload: { profile_id: profileId }
        }
      });

      if (fetchError || !data?.success) {
        throw new Error(data?.error || 'Failed to fetch stewards');
      }

      setStewards(data.stewards || []);
    } catch (err) {
      console.error('[StewardProfilePanel] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stewards');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchStewards();
  }, [fetchStewards]);

  const handleAssignSteward = async () => {
    if (!newStewardName.trim()) {
      setAssignError('Steward name is required');
      return;
    }

    setAssigning(true);
    setAssignError(null);
    setAssignSuccess(false);

    try {
      const { data, error: assignErr } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'assign_steward',
          payload: {
            profile_id: profileId,
            steward_name: newStewardName.trim(),
            steward_email: newStewardEmail.trim() || null,
            steward_type: newStewardType,
            assigned_by: currentUserId
          }
        }
      });

      if (assignErr || !data?.success) {
        throw new Error(data?.error || data?.detail || 'Failed to assign steward');
      }

      setAssignSuccess(true);
      setNewStewardName('');
      setNewStewardEmail('');
      setShowAssignForm(false);
      
      // Refresh stewards list
      await fetchStewards();
      
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign steward');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveSteward = async (assignmentId: string) => {
    setRemovingId(assignmentId);
    
    try {
      const { data, error: removeErr } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'remove_steward',
          payload: {
            assignment_id: assignmentId,
            removed_by: currentUserId
          }
        }
      });

      if (removeErr || !data?.success) {
        throw new Error(data?.error || 'Failed to remove steward');
      }

      // Refresh stewards list
      await fetchStewards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove steward');
    } finally {
      setRemovingId(null);
    }
  };

  const displayStewards = stewards.length > 0 ? stewards : [fallbackSteward];
  const hasStewards = stewards.length > 0;
  const canAssign = isSteward && stewards.length < 2;

  // Compact variant for inline display
  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Shield className="w-4 h-4 text-[#8B9D83]" />
        <span className="text-[#1A2332]/70">
          {hasStewards 
            ? `Stewarded by ${stewards.map(s => s.steward_name).join(', ')}`
            : 'Supported by Alun (SWOR Steward)'
          }
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#F5F1E8]/30 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#8B9D83]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#8B9D83]" />
          </div>
          <div>
            <h4 className="font-medium text-[#1A2332]">Your Steward{displayStewards.length > 1 ? 's' : ''}</h4>
            <p className="text-sm text-[#1A2332]/60">
              {hasStewards 
                ? `${stewards.length} steward${stewards.length > 1 ? 's' : ''} assigned`
                : 'Help is available'
              }
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#1A2332]/40" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#1A2332]/40" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-[#1A2332]/5">
          {/* Reassurance message */}
          <div className="bg-[#8B9D83]/5 rounded-lg p-3 mb-4">
            <p className="text-sm text-[#1A2332]/70 leading-relaxed">
              You are not on your own. Your steward{displayStewards.length > 1 ? 's are' : ' is'} here to help 
              with questions, review your content, and guide you through the process.
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" />
              <span className="ml-2 text-sm text-[#1A2332]/60">Loading stewards...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg text-red-600 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success message */}
          {assignSuccess && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg text-green-600 mb-4">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Steward assigned successfully</span>
            </div>
          )}

          {/* Steward list */}
          {!loading && (
            <div className="space-y-3 mb-4">
              {displayStewards.map((steward) => (
                <div 
                  key={steward.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    steward.id === 'fallback' 
                      ? 'bg-amber-50/50 border border-amber-100' 
                      : 'bg-[#F5F1E8]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      steward.steward_type === 'global' 
                        ? 'bg-amber-100' 
                        : 'bg-[#8B9D83]/20'
                    }`}>
                      {steward.steward_type === 'global' ? (
                        <Crown className="w-5 h-5 text-amber-600" />
                      ) : (
                        <User className="w-5 h-5 text-[#8B9D83]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#1A2332]">{steward.steward_name}</p>
                      <p className="text-xs text-[#1A2332]/50">
                        {steward.steward_type === 'global' ? 'SWOR Steward' : 'Journey Steward'}
                      </p>
                      {steward.id !== 'fallback' && (
                        <p className="text-xs text-[#1A2332]/40 mt-0.5">
                          Assigned {new Date(steward.assigned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {steward.steward_email && (
                      <a
                        href={`mailto:${steward.steward_email}?subject=SWOR Journey Support${profileName ? ` - ${profileName}` : ''}`}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-[#B8826D] hover:bg-[#B8826D]/10 rounded-lg transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Contact</span>
                      </a>
                    )}
                    {isSteward && steward.id !== 'fallback' && steward.steward_type !== 'global' && (
                      <button
                        onClick={() => handleRemoveSteward(steward.id)}
                        disabled={removingId === steward.id}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove steward"
                      >
                        {removingId === steward.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assign steward form (for stewards only) */}
          {canAssign && (
            <>
              {!showAssignForm ? (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 border border-dashed border-[#8B9D83]/30 rounded-lg text-sm text-[#8B9D83] hover:bg-[#8B9D83]/5 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Assign Another Steward</span>
                </button>
              ) : (
                <div className="border border-[#1A2332]/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-[#1A2332]">Assign Steward</h5>
                    <button
                      onClick={() => {
                        setShowAssignForm(false);
                        setAssignError(null);
                      }}
                      className="text-[#1A2332]/40 hover:text-[#1A2332]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2332]/60 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newStewardName}
                      onChange={(e) => setNewStewardName(e.target.value)}
                      placeholder="Steward's name"
                      className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2332]/60 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={newStewardEmail}
                      onChange={(e) => setNewStewardEmail(e.target.value)}
                      placeholder="steward@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2332]/60 mb-1">Steward Type</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setNewStewardType('journey')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          newStewardType === 'journey'
                            ? 'bg-[#8B9D83] text-white'
                            : 'bg-[#1A2332]/5 text-[#1A2332]/60 hover:bg-[#1A2332]/10'
                        }`}
                      >
                        Journey Steward
                      </button>
                      <button
                        onClick={() => setNewStewardType('global')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          newStewardType === 'global'
                            ? 'bg-amber-500 text-white'
                            : 'bg-[#1A2332]/5 text-[#1A2332]/60 hover:bg-[#1A2332]/10'
                        }`}
                      >
                        Global Steward
                      </button>
                    </div>
                  </div>

                  {assignError && (
                    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded text-red-600 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{assignError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleAssignSteward}
                    disabled={assigning || !newStewardName.trim()}
                    className="w-full py-2 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Steward
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Limit notice */}
          {isSteward && stewards.length >= 2 && (
            <p className="text-xs text-[#1A2332]/50 text-center mt-3">
              Maximum of 2 stewards per profile
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StewardProfilePanel;
