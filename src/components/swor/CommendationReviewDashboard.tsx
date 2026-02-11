import React, { useState, useEffect, useCallback } from 'react';
import { X, Heart, User, Calendar, Quote, CheckCircle, XCircle, Clock, Loader2, RefreshCw, MessageSquare, Link2, ExternalLink, Filter, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Commendation {
  id: string;
  profile_id: string;
  commender_name: string;
  commender_email?: string;
  commender_profile_id?: string;
  commender_profile_name?: string;
  commender_organisation?: string;
  relationship_context: string;
  when_context?: string;
  why_it_mattered: string;
  commendation_text: string;
  response_text?: string;
  response_at?: string;
  status: string;
  visibility: string;
  created_at: string;
  approved_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  recipient_name?: string;
  recipient_profile_id?: string;
  recipient_user_id?: string;
}

interface CommendationReviewDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stewardUserId?: string;
  stewardName?: string;
  onNavigateToProfile?: (profileId: string) => void;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const CommendationReviewDashboard: React.FC<CommendationReviewDashboardProps> = ({
  isOpen,
  onClose,
  stewardUserId,
  stewardName,
  onNavigateToProfile
}) => {
  const [commendations, setCommendations] = useState<Commendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; commendationId: string; commenderName: string }>({
    isOpen: false,
    commendationId: '',
    commenderName: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Expanded commendation state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const loadCommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statusMap: Record<StatusFilter, string> = {
        pending: 'submitted_for_review',
        approved: 'approved',
        rejected: 'rejected',
        all: 'all'
      };

      const { data, error: fetchError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'get_pending_commendations',
          payload: {
            steward_user_id: stewardUserId,
            status_filter: statusMap[statusFilter]
          }
        }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data?.success) {
        setCommendations(data.commendations || []);
        setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
      } else {
        throw new Error(data?.error || 'Failed to load commendations');
      }
    } catch (err: any) {
      console.error('Error loading commendations:', err);
      setError(err.message || 'Failed to load commendations');
      setCommendations([]);
    } finally {
      setLoading(false);
    }
  }, [stewardUserId, statusFilter]);

  useEffect(() => {
    if (isOpen) {
      loadCommendations();
    }
  }, [isOpen, loadCommendations]);

  const handleApprove = async (commendation: Commendation) => {
    setProcessingId(commendation.id);
    setError(null);

    try {
      const { data, error: approveError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'review_commendation',
          payload: {
            commendation_id: commendation.id,
            decision: 'approved',
            steward_id: stewardUserId,
            steward_name: stewardName
          }
        }
      });

      if (approveError) {
        throw new Error(approveError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to approve commendation');
      }

      // Send notification to recipient
      if (data.notification_data) {
        try {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'commendation_approved',
              payload: {
                profile_id: data.notification_data.profile_id,
                recipient_user_id: data.notification_data.recipient_user_id,
                recipient_name: data.notification_data.recipient_name,
                commender_name: data.notification_data.commender_name,
                relationship_context: data.notification_data.relationship_context,
                commendation_id: commendation.id
              }
            }
          });
        } catch (notifErr) {
          console.warn('Notification error (non-blocking):', notifErr);
        }
      }

      setActionFeedback({
        type: 'success',
        message: `Commendation from ${commendation.commender_name} has been approved.`
      });

      // Refresh the list
      await loadCommendations();

    } catch (err: any) {
      console.error('Approve error:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to approve commendation'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectionModal = (commendation: Commendation) => {
    setRejectionModal({
      isOpen: true,
      commendationId: commendation.id,
      commenderName: commendation.commender_name
    });
    setRejectionReason('');
  };

  const closeRejectionModal = () => {
    setRejectionModal({ isOpen: false, commendationId: '', commenderName: '' });
    setRejectionReason('');
    setIsRejecting(false);
  };

  const handleReject = async () => {
    const { commendationId, commenderName } = rejectionModal;
    if (!commendationId) return;

    setIsRejecting(true);
    setError(null);

    try {
      const commendation = commendations.find(c => c.id === commendationId);
      
      const { data, error: rejectError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'review_commendation',
          payload: {
            commendation_id: commendationId,
            decision: 'rejected',
            rejection_reason: rejectionReason.trim() || null,
            steward_id: stewardUserId,
            steward_name: stewardName
          }
        }
      });

      if (rejectError) {
        throw new Error(rejectError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to reject commendation');
      }

      // Send notification to commender
      if (data.notification_data) {
        try {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'commendation_rejected',
              payload: {
                commender_user_id: data.notification_data.commender_profile_id,
                commender_email: data.notification_data.commender_email,
                recipient_name: data.notification_data.recipient_name,
                rejection_reason: rejectionReason.trim() || null,
                commendation_id: commendationId
              }
            }
          });
        } catch (notifErr) {
          console.warn('Notification error (non-blocking):', notifErr);
        }
      }

      closeRejectionModal();

      setActionFeedback({
        type: 'success',
        message: `Commendation from ${commenderName} has been rejected.${rejectionReason ? ' Feedback sent.' : ''}`
      });

      // Refresh the list
      await loadCommendations();

    } catch (err: any) {
      console.error('Reject error:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to reject commendation'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const formatDate = (dateString: string) => {
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
        return <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#F5F1E8] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A2332]/10">
          <div>
            <h2 className="font-serif text-xl text-[#1A2332]">Commendation Review</h2>
            <p className="text-sm text-[#1A2332]/60 mt-1">Review and approve commendations for individual profiles</p>
          </div>
          <button onClick={onClose} className="text-[#1A2332]/60 hover:text-[#1A2332]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Counts */}
        <div className="px-6 py-4 bg-white/50 border-b border-[#1A2332]/10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-white text-[#1A2332]/60 hover:bg-[#1A2332]/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending</span>
              <span className="px-2 py-0.5 bg-amber-200/50 rounded-full text-xs font-medium">
                {counts.pending}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white text-[#1A2332]/60 hover:bg-[#1A2332]/5'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approved</span>
              <span className="px-2 py-0.5 bg-green-200/50 rounded-full text-xs font-medium">
                {counts.approved}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-white text-[#1A2332]/60 hover:bg-[#1A2332]/5'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Rejected</span>
              <span className="px-2 py-0.5 bg-red-200/50 rounded-full text-xs font-medium">
                {counts.rejected}
              </span>
            </button>
            <div className="flex-1" />
            <button
              onClick={loadCommendations}
              disabled={loading}
              className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Action Feedback */}
        {actionFeedback && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm border flex items-start ${
            actionFeedback.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error loading commendations</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
              <p className="text-[#1A2332]/60 mt-4">Loading commendations...</p>
            </div>
          ) : commendations.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
              <p className="text-[#1A2332]/60">
                {statusFilter === 'pending' 
                  ? 'No commendations pending review'
                  : statusFilter === 'approved'
                    ? 'No approved commendations'
                    : statusFilter === 'rejected'
                      ? 'No rejected commendations'
                      : 'No commendations found'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {commendations.map((commendation) => {
                const isProcessing = processingId === commendation.id;
                const isExpanded = expandedId === commendation.id;
                const isLongText = commendation.commendation_text.length > 200;

                return (
                  <div
                    key={commendation.id}
                    className={`bg-white rounded-xl border transition-all ${
                      isProcessing ? 'opacity-60 border-[#1A2332]/10' : 'border-[#1A2332]/10 hover:border-[#B8826D]/30'
                    }`}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-[#1A2332]/5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B8826D]/20 to-[#8B9D83]/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-[#1A2332]/40" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              {commendation.commender_profile_id && onNavigateToProfile ? (
                                <button
                                  onClick={() => onNavigateToProfile(commendation.commender_profile_id!)}
                                  className="font-medium text-[#1A2332] hover:text-[#B8826D] flex items-center"
                                >
                                  {commendation.commender_name}
                                  <Link2 className="w-3.5 h-3.5 ml-1" />
                                </button>
                              ) : (
                                <span className="font-medium text-[#1A2332]">{commendation.commender_name}</span>
                              )}
                              {getStatusBadge(commendation.status)}
                            </div>
                            <p className="text-sm text-[#1A2332]/60 mt-0.5">
                              {commendation.relationship_context}
                              {commendation.when_context && ` · ${commendation.when_context}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#1A2332]/50">{formatDate(commendation.created_at)}</p>
                        </div>
                      </div>

                      {/* Recipient Info */}
                      <div className="mt-3 flex items-center text-sm">
                        <span className="text-[#1A2332]/50 mr-2">For:</span>
                        {commendation.recipient_profile_id && onNavigateToProfile ? (
                          <button
                            onClick={() => onNavigateToProfile(commendation.recipient_profile_id!)}
                            className="text-[#B8826D] hover:text-[#B8826D]/80 flex items-center"
                          >
                            {commendation.recipient_name || 'Unknown'}
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </button>
                        ) : (
                          <span className="text-[#1A2332]">{commendation.recipient_name || 'Unknown'}</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Why It Mattered */}
                      <div className="mb-3 pl-3 border-l-2 border-[#B8826D]/30">
                        <p className="text-sm text-[#B8826D]/80 italic">
                          "{commendation.why_it_mattered}"
                        </p>
                      </div>

                      {/* Main Text */}
                      <div className="relative">
                        <Quote className="absolute -top-1 -left-1 w-5 h-5 text-[#1A2332]/10" />
                        <p className="text-[#1A2332]/80 text-sm leading-relaxed pl-5">
                          {isExpanded || !isLongText
                            ? commendation.commendation_text
                            : commendation.commendation_text.slice(0, 200) + '...'}
                        </p>
                        {isLongText && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : commendation.id)}
                            className="mt-2 text-xs text-[#B8826D] hover:text-[#B8826D]/80 pl-5 flex items-center"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5 mr-1" />
                                Read full commendation
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Rejection Reason (if rejected) */}
                      {commendation.status === 'rejected' && commendation.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className="flex items-start">
                            <MessageSquare className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">Rejection reason:</p>
                              <p className="text-sm text-red-600 italic">"{commendation.rejection_reason}"</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Owner Response (if present) */}
                      {commendation.response_text && (
                        <div className="mt-4 p-3 bg-[#8B9D83]/10 rounded-lg">
                          <div className="flex items-start">
                            <MessageSquare className="w-4 h-4 text-[#8B9D83] mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-[#8B9D83] mb-1">
                                Response from {commendation.recipient_name}:
                              </p>
                              <p className="text-sm text-[#1A2332]/70 italic">"{commendation.response_text}"</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions (only for pending) */}
                    {commendation.status === 'submitted_for_review' && (
                      <div className="px-4 py-3 bg-[#F5F1E8]/50 border-t border-[#1A2332]/5 flex items-center justify-end space-x-3">
                        <button
                          onClick={() => openRejectionModal(commendation)}
                          disabled={isProcessing}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(commendation)}
                          disabled={isProcessing}
                          className="px-4 py-2 text-sm text-white bg-[#8B9D83] hover:bg-[#8B9D83]/90 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                          )}
                          Approve
                        </button>
                      </div>
                    )}

                    {/* Review Info (for approved/rejected) */}
                    {(commendation.status === 'approved' || commendation.status === 'rejected') && commendation.reviewed_at && (
                      <div className="px-4 py-3 bg-[#F5F1E8]/50 border-t border-[#1A2332]/5">
                        <p className="text-xs text-[#1A2332]/50">
                          {commendation.status === 'approved' ? 'Approved' : 'Rejected'} on {formatDate(commendation.reviewed_at)}
                          {commendation.reviewed_by && ` by ${commendation.reviewed_by.substring(0, 8)}...`}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Governance Note */}
        <div className="px-6 py-3 bg-[#8B9D83]/10 border-t border-[#1A2332]/10">
          <p className="text-xs text-[#1A2332]/60 text-center">
            <span className="font-medium">Governance:</span> All commendations require steward approval. No ratings, no stars, no gamification.
          </p>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-[#1A2332]">Reject Commendation</h3>
                  <p className="text-sm text-[#1A2332]/60">
                    From {rejectionModal.commenderName}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                  Rejection reason (optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide feedback to help the commender revise and resubmit..."
                  className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-red-400 resize-none text-sm"
                  rows={3}
                  disabled={isRejecting}
                />
                <p className="text-xs text-[#1A2332]/40 mt-1">
                  This feedback will be shared with the commender via email.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeRejectionModal}
                  disabled={isRejecting}
                  className="flex-1 px-4 py-2.5 text-sm text-[#1A2332] bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirm Rejection
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

export default CommendationReviewDashboard;
