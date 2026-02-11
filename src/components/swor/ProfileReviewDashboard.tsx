import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Clock, CheckCircle, AlertCircle, Loader2, Eye, Shield, MessageSquare, RefreshCw, Globe, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SubmittedProfile {
  id: string;
  full_name: string;
  known_as?: string;
  title?: string;
  introduction?: string;
  country?: string;
  region?: string;
  era?: string;
  status: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  photo_signed_url?: string;
  steward_note?: string;
  steward_note_by?: string;
  steward_note_at?: string;
}

interface ProfileReviewDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stewardUserId?: string;
  stewardName?: string;
  onNavigateToProfile?: (profileId: string) => void;
}

type StatusFilter = 'pending' | 'approved' | 'needs_changes' | 'all';

const ProfileReviewDashboard: React.FC<ProfileReviewDashboardProps> = ({
  isOpen,
  onClose,
  stewardUserId,
  stewardName,
  onNavigateToProfile
}) => {
  const [profiles, setProfiles] = useState<SubmittedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, needs_changes: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Request changes modal
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [requestChangesProfileId, setRequestChangesProfileId] = useState<string | null>(null);
  const [requestChangesProfileName, setRequestChangesProfileName] = useState('');
  const [stewardNote, setStewardNote] = useState('');

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'get_submitted_profiles',
          payload: {
            status_filter: statusFilter === 'pending' ? 'submitted_for_review' : statusFilter,
            steward_user_id: stewardUserId
          }
        }
      });
      
      if (fetchError) throw new Error(fetchError.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to fetch profiles');
      
      setProfiles(data.profiles || []);
      setCounts(data.counts || { pending: 0, approved: 0, needs_changes: 0 });
      
    } catch (err: any) {
      console.error('Failed to fetch profiles:', err);
      setError(err.message || 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, stewardUserId]);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen, fetchProfiles]);

  const handleApprove = async (profile: SubmittedProfile) => {
    setProcessingId(profile.id);
    setError(null);
    
    try {
      const { data, error: approveError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'approve_profile',
          payload: {
            profile_id: profile.id,
            steward_id: stewardUserId,
            steward_name: stewardName
          }
        }
      });
      
      if (approveError) throw new Error(approveError.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to approve profile');
      
      // Send notification
      try {
        await supabase.functions.invoke('swor-notifications', {
          body: {
            action: 'profile_approved',
            payload: {
              profile_id: profile.id,
              profile_name: profile.full_name || profile.title,
              owner_user_id: data.notification_data?.owner_user_id
            }
          }
        });
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr);
      }
      
      // Refresh list
      fetchProfiles();
      
    } catch (err: any) {
      console.error('Approve failed:', err);
      setError(err.message || 'Failed to approve profile');
    } finally {
      setProcessingId(null);
    }
  };

  const openRequestChangesModal = (profile: SubmittedProfile) => {
    setRequestChangesProfileId(profile.id);
    setRequestChangesProfileName(profile.full_name || profile.title || 'Profile');
    setStewardNote('');
    setShowRequestChangesModal(true);
  };

  const handleRequestChanges = async () => {
    if (!requestChangesProfileId) return;
    
    setProcessingId(requestChangesProfileId);
    setError(null);
    
    try {
      const { data, error: requestError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'request_changes',
          payload: {
            profile_id: requestChangesProfileId,
            steward_note: stewardNote.trim() || null,
            steward_id: stewardUserId,
            steward_name: stewardName
          }
        }
      });
      
      if (requestError) throw new Error(requestError.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to request changes');
      
      // Send notification
      try {
        await supabase.functions.invoke('swor-notifications', {
          body: {
            action: 'profile_needs_changes',
            payload: {
              profile_id: requestChangesProfileId,
              profile_name: requestChangesProfileName,
              owner_user_id: data.notification_data?.owner_user_id,
              steward_note: stewardNote.trim() || null
            }
          }
        });
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr);
      }
      
      setShowRequestChangesModal(false);
      setRequestChangesProfileId(null);
      setStewardNote('');
      
      // Refresh list
      fetchProfiles();
      
    } catch (err: any) {
      console.error('Request changes failed:', err);
      setError(err.message || 'Failed to request changes');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted_for_review':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Pending Review</span>;
      case 'approved':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Approved</span>;
      case 'needs_changes':
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Needs Changes</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{status}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#F5F1E8] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A2332]/10">
          <div>
            <h2 className="font-serif text-xl text-[#1A2332]">Profile Review Dashboard</h2>
            <p className="text-sm text-[#1A2332]/60 mt-1">Review submitted individual profiles</p>
          </div>
          <button onClick={onClose} className="text-[#1A2332]/60 hover:text-[#1A2332]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Notice */}
        <div className="px-6 py-3 bg-[#8B9D83]/10 border-b border-[#1A2332]/10">
          <div className="flex items-center">
            <Shield className="w-4 h-4 text-[#8B9D83] mr-2 flex-shrink-0" />
            <p className="text-sm text-[#1A2332]/70">
              <span className="font-medium">Draft-first governance.</span> Nothing becomes public until you approve it.
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex border-b border-[#1A2332]/10">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              statusFilter === 'pending'
                ? 'text-[#B8826D] border-b-2 border-[#B8826D] bg-white/50'
                : 'text-[#1A2332]/60 hover:text-[#1A2332]'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Pending
            {counts.pending > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {counts.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('needs_changes')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              statusFilter === 'needs_changes'
                ? 'text-[#B8826D] border-b-2 border-[#B8826D] bg-white/50'
                : 'text-[#1A2332]/60 hover:text-[#1A2332]'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Needs Changes
            {counts.needs_changes > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {counts.needs_changes}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'text-[#B8826D] border-b-2 border-[#B8826D] bg-white/50'
                : 'text-[#1A2332]/60 hover:text-[#1A2332]'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Approved
            <span className="ml-2 text-[#1A2332]/40">({counts.approved})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Refresh Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={fetchProfiles}
              disabled={isLoading}
              className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
              <p className="text-[#1A2332]/60 mt-4">Loading profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
              <p className="text-[#1A2332]/60">No profiles in this category</p>
              <p className="text-sm text-[#1A2332]/40 mt-2">
                {statusFilter === 'pending' 
                  ? 'All caught up! No profiles awaiting review.'
                  : statusFilter === 'needs_changes'
                    ? 'No profiles currently need changes.'
                    : 'No approved profiles yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => {
                const isExpanded = expandedId === profile.id;
                const isProcessing = processingId === profile.id;
                
                return (
                  <div
                    key={profile.id}
                    className={`bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden transition-all ${
                      isProcessing ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Profile Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {/* Photo */}
                          {profile.photo_signed_url ? (
                            <img
                              src={profile.photo_signed_url}
                              alt={profile.full_name || 'Profile'}
                              className="w-14 h-14 rounded-lg object-cover border border-[#1A2332]/10"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-[#F5F1E8] flex items-center justify-center">
                              <User className="w-6 h-6 text-[#1A2332]/30" />
                            </div>
                          )}
                          
                          {/* Info */}
                          <div>
                            <h3 className="font-medium text-[#1A2332]">
                              {profile.full_name || profile.title || 'Unnamed Profile'}
                            </h3>
                            {profile.known_as && (
                              <p className="text-sm text-[#1A2332]/60">Known as: {profile.known_as}</p>
                            )}
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                              {profile.country && (
                                <span className="flex items-center text-xs text-[#1A2332]/50">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {profile.country}
                                </span>
                              )}
                              {profile.era && (
                                <span className="flex items-center text-xs text-[#1A2332]/50">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {profile.era}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#1A2332]/40 mt-1">
                              Submitted: {formatDate(profile.submitted_at || profile.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(profile.status)}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                            className="p-1 text-[#1A2332]/40 hover:text-[#1A2332]"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Steward Note (if needs_changes) */}
                      {profile.status === 'needs_changes' && profile.steward_note && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="text-xs text-orange-700 font-medium mb-1">
                            Feedback from {profile.steward_note_by || 'Steward'}:
                          </p>
                          <p className="text-sm text-orange-800 italic">"{profile.steward_note}"</p>
                        </div>
                      )}
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#1A2332]/5 pt-4">
                        {/* Introduction Preview */}
                        {profile.introduction && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-[#1A2332]/50 mb-1">Introduction</p>
                            <p className="text-sm text-[#1A2332]/70 line-clamp-4">{profile.introduction}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#1A2332]/5">
                          <button
                            onClick={() => onNavigateToProfile?.(profile.id)}
                            className="flex items-center text-sm text-[#B8826D] hover:text-[#B8826D]/80"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Full Profile
                          </button>
                          
                          {profile.status === 'submitted_for_review' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openRequestChangesModal(profile)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                )}
                                Request Changes
                              </button>
                              <button
                                onClick={() => handleApprove(profile)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 text-sm text-white bg-[#8B9D83] hover:bg-[#8B9D83]/90 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                )}
                                Approve
                              </button>
                            </div>
                          )}
                          
                          {profile.status === 'needs_changes' && (
                            <button
                              onClick={() => handleApprove(profile)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 text-sm text-white bg-[#8B9D83] hover:bg-[#8B9D83]/90 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              Approve Now
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Changes Modal */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-[#1A2332]">Request Changes</h3>
                  <p className="text-sm text-[#1A2332]/60">{requestChangesProfileName}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                  Feedback for the profile owner (optional)
                </label>
                <textarea
                  value={stewardNote}
                  onChange={(e) => setStewardNote(e.target.value)}
                  placeholder="What changes would you like to see? Keep it calm and constructive..."
                  className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none text-sm"
                  rows={4}
                />
                <p className="text-xs text-[#1A2332]/50 mt-1">
                  This note will be shown to the profile owner and sent via email if they have notifications enabled.
                </p>
              </div>

              <div className="bg-[#F5F1E8] rounded-lg p-3 mb-4">
                <p className="text-xs text-[#1A2332]/70">
                  The profile will return to draft status. The owner can make changes and resubmit when ready. There is no deadline.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRequestChangesModal(false);
                    setRequestChangesProfileId(null);
                    setStewardNote('');
                  }}
                  disabled={processingId === requestChangesProfileId}
                  className="flex-1 px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={processingId === requestChangesProfileId}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {processingId === requestChangesProfileId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Request Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileReviewDashboard;
