import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Users, Upload, Mail, UserPlus, FileText, Image, Shield, Lock, Wrench, Eye, MessageSquare, Edit3, LayoutDashboard, X, Loader2, CheckCircle, XCircle, Send, Plus, Clock, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { getExemplarConfig, ExemplarConfig } from '@/data/sworData';
import StewardDashboard from './StewardDashboard';
import { useJourneyContributions, JourneyContribution } from '@/hooks/useJourneyContributions';

interface Phase3BuilderProps {
  journeyId: string;
  journeyType: 'individual' | 'collective';
  journeyTitle?: string;
  onNavigate: (page: string) => void;
}

// Inline contribution form component
const InlineContributionForm: React.FC<{
  journeyId: string;
  type: string;
  placeholder: string;
  label: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ journeyId, type, placeholder, label, onClose, onSaved }) => {
  const { user, profile, globalStewardInfo } = useAppContext();
  const { createContribution, submitForReview, saving } = useJourneyContributions();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [relationship, setRelationship] = useState('');
  const [saveMode, setSaveMode] = useState<'draft' | 'submit'>('draft');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const userId = user?.id || globalStewardInfo?.email || '';
  const userName = profile?.full_name || globalStewardInfo?.name || user?.user_metadata?.full_name || '';

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) {
      setError('Please enter some content.');
      return;
    }
    setError('');

    const contributionData: any = {
      journey_id: journeyId,
      type,
      content: {
        title: title.trim() || undefined,
        body: content.trim() || undefined,
        name: type === 'person' ? content.trim() : undefined,
      },
      contributor_id: userId || undefined,
      contributor_name: userName || undefined,
      contributor_email: user?.email || undefined,
      contributor_relationship: relationship.trim() || undefined,
      visibility: 'private_draft',
      status: 'draft'
    };

    const created = await createContribution(contributionData);
    
    if (created) {
      if (saveMode === 'submit') {
        await submitForReview(created.id, userId, userName);
      }
      setSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1500);
    } else {
      setError('Failed to save. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center">
        <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
        <p className="text-sm text-green-800">
          {saveMode === 'submit' ? 'Submitted for review successfully.' : 'Saved as draft successfully.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-[#B8826D]/30 space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-[#1A2332]">{label}</h5>
        <button onClick={onClose} className="text-[#1A2332]/40 hover:text-[#1A2332]">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-center">
          <AlertCircle className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Title field for text/moment types */}
      {(type === 'text' || type === 'moment' || type === 'period') && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title or heading..."
          className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
        />
      )}

      {/* Main content */}
      {type === 'person' ? (
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
        />
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-sm resize-none focus:outline-none focus:border-[#B8826D]"
        />
      )}

      {/* Relationship declaration */}
      <input
        type="text"
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
        placeholder="Your relationship to this journey (e.g., teammate, family, historian)..."
        className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-xs focus:outline-none focus:border-[#B8826D]"
      />

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[10px] text-[#1A2332]/40">
          Saved as {userName || 'you'} - nothing published without approval
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setSaveMode('draft'); handleSave(); }}
            disabled={saving}
            className="flex items-center px-3 py-1.5 text-xs text-[#1A2332] bg-[#F5F1E8] rounded-lg hover:bg-[#F5F1E8]/80 transition-colors disabled:opacity-50"
          >
            {saving && saveMode === 'draft' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
            Save Draft
          </button>
          <button
            onClick={() => { setSaveMode('submit'); handleSave(); }}
            disabled={saving}
            className="flex items-center px-3 py-1.5 text-xs text-white bg-[#8B9D83] rounded-lg hover:bg-[#8B9D83]/90 transition-colors disabled:opacity-50"
          >
            {saving && saveMode === 'submit' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
};

// Review panel for drafts/suggestions
const ContributionReviewPanel: React.FC<{
  journeyId: string;
  statusFilter: 'draft' | 'submitted_for_review';
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
}> = ({ journeyId, statusFilter, title, icon, onClose }) => {
  const { user, profile, globalStewardInfo } = useAppContext();
  const {
    contributions,
    loading,
    fetchContributions,
    approveContribution,
    rejectContribution,
    saving
  } = useJourneyContributions();

  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const reviewerId = user?.id || globalStewardInfo?.email || '';
  const reviewerName = profile?.full_name || globalStewardInfo?.name || '';

  useEffect(() => {
    fetchContributions(journeyId, { status: statusFilter });
  }, [journeyId, statusFilter, fetchContributions]);

  const handleApprove = async (id: string, name: string) => {
    setProcessingId(id);
    const success = await approveContribution(id, reviewerId, reviewerName);
    if (success) {
      setFeedback({ type: 'success', message: `"${name}" approved.` });
      await fetchContributions(journeyId, { status: statusFilter });
    } else {
      setFeedback({ type: 'error', message: 'Failed to approve.' });
    }
    setProcessingId(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReject = async (id: string, name: string) => {
    setProcessingId(id);
    const success = await rejectContribution(id, rejectionNote, reviewerId, reviewerName);
    if (success) {
      setFeedback({ type: 'success', message: `"${name}" rejected.` });
      setRejectingId(null);
      setRejectionNote('');
      await fetchContributions(journeyId, { status: statusFilter });
    } else {
      setFeedback({ type: 'error', message: 'Failed to reject.' });
    }
    setProcessingId(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  const getContentPreview = (c: JourneyContribution): string => {
    return c.content?.title || c.content?.body?.substring(0, 80) || c.content?.name || c.type;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-[#F5F1E8]/50 p-4 sm:p-5 border-b border-[#1A2332]/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-[#1A2332] flex items-center text-sm sm:text-base">
          {icon}
          <span className="ml-2">{title}</span>
          <span className="ml-2 text-xs text-[#1A2332]/40">({contributions.length})</span>
        </h4>
        <button
          onClick={onClose}
          className="text-[#1A2332]/50 hover:text-[#1A2332] min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mb-3 p-2 rounded-lg text-xs flex items-center ${
          feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin mr-2" />
          <span className="text-sm text-[#1A2332]/50">Loading...</span>
        </div>
      ) : contributions.length === 0 ? (
        <div className="bg-white rounded-lg p-4 border border-[#1A2332]/10">
          <p className="text-sm text-[#1A2332]/60 text-center py-4">
            No {statusFilter === 'draft' ? 'pending drafts' : 'pending suggestions'} for this journey.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contributions.map(c => {
            const isProcessing = processingId === c.id;
            const isRejecting = rejectingId === c.id;
            const preview = getContentPreview(c);

            return (
              <div key={c.id} className={`bg-white rounded-lg p-3 border border-[#1A2332]/10 transition-opacity ${isProcessing ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-[#B8826D] uppercase">{c.type}</span>
                      <span className="text-[10px] text-[#1A2332]/40">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#1A2332] line-clamp-2">{preview}</p>
                    {c.content?.body && c.content.body.length > 80 && (
                      <p className="text-xs text-[#1A2332]/50 mt-1 line-clamp-2">{c.content.body.substring(0, 200)}...</p>
                    )}
                    {c.contributor_name && (
                      <p className="text-[10px] text-[#1A2332]/40 mt-1">
                        By: {c.contributor_name}
                        {c.contributor_relationship && ` (${c.contributor_relationship})`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rejection form */}
                {isRejecting && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100">
                    <textarea
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Rejection reason (optional)..."
                      rows={2}
                      className="w-full px-2 py-1.5 border border-red-200 rounded text-xs resize-none focus:outline-none focus:border-red-400 mb-2"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => { setRejectingId(null); setRejectionNote(''); }}
                        className="px-2 py-1 text-xs text-[#1A2332]/60 hover:text-[#1A2332]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(c.id, preview)}
                        disabled={isProcessing}
                        className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 flex items-center"
                      >
                        {isProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {!isRejecting && (
                  <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-[#1A2332]/5">
                    <button
                      onClick={() => setRejectingId(c.id)}
                      disabled={isProcessing}
                      className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 flex items-center"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(c.id, preview)}
                      disabled={isProcessing}
                      className="px-2.5 py-1 text-xs text-white bg-[#8B9D83] hover:bg-[#8B9D83]/90 rounded transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[#1A2332]/40 mt-3">
        {statusFilter === 'draft' 
          ? 'Drafts from contributors will appear here for review before publishing.'
          : 'Suggestions from stewards and contributors will appear here for review.'}
      </p>
    </div>
  );
};

// Main Phase3Builder Component
const Phase3Builder: React.FC<Phase3BuilderProps> = ({ journeyId, journeyType, journeyTitle = 'Rugby Journey', onNavigate }) => {
  const { user, checkJourneyOwnership, isGlobalSteward, globalStewardInfo } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [showDraftReview, setShowDraftReview] = useState(false);
  const [showSuggestionReview, setShowSuggestionReview] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Inline form states
  const [activeForm, setActiveForm] = useState<string | null>(null);
  
  // Contribution counts
  const { contributions, fetchContributions } = useJourneyContributions();
  const [draftCount, setDraftCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);

  // Get exemplar configuration
  const config = getExemplarConfig(journeyId);
  const isExemplar = !!config;
  
  // Check ownership/stewardship
  const ownership = checkJourneyOwnership(journeyId);
  const isOwnerOrSteward = ownership.isOwner || ownership.isSteward;
  const hasGlobalAccess = ownership.isGlobalSteward;
  
  // For exemplars, Phase 3 builder is only visible to owner/stewards (including global stewards)
  if (isExemplar && config?.phase3VisibleToOwnerStewardsOnly && !isOwnerOrSteward) {
    return null;
  }

  // Load contribution counts when expanded
  useEffect(() => {
    if ((expanded || hasGlobalAccess) && journeyId) {
      fetchContributions(journeyId).then(() => {
        // We'll use the contributions from the hook
      });
    }
  }, [expanded, hasGlobalAccess, journeyId]);

  // Update counts when contributions change
  useEffect(() => {
    setDraftCount(contributions.filter(c => c.status === 'draft').length);
    setSubmittedCount(contributions.filter(c => c.status === 'submitted_for_review').length);
  }, [contributions]);

  const handleFormSaved = () => {
    setActiveForm(null);
    // Refresh counts
    fetchContributions(journeyId);
  };
  
  // Determine language based on journey type
  const isCollective = journeyType === 'collective';
  const titleText = isCollective ? 'Build out our Rugby Journey' : 'Build out this Rugby Journey';
  const subtitleText = isCollective 
    ? 'This journey already stands on its own. We can add more depth over time, together, if and when appropriate.'
    : 'This journey already stands on its own. More depth or shared memory can be added over time, if and when useful.';
  
  // Contribution rules text
  const contributionRulesText = config?.noDirectPublishing 
    ? 'Contributions are suggestions until approved. All contributors must be named with their relationship stated.'
    : 'Contributions are reviewed before inclusion.';

  return (
    <>
      <div className="border border-[#1A2332]/10 rounded-xl overflow-hidden bg-white">
        {/* Global Steward Indicator */}
        {hasGlobalAccess && (
          <div className="bg-[#1A2332] px-3 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center">
              <Wrench className="w-4 h-4 text-[#B8826D] mr-2 flex-shrink-0" />
              <span className="text-sm text-[#F5F1E8] font-medium">
                Builder Access
              </span>
              <span className="text-xs text-[#F5F1E8]/60 ml-2 truncate">
                ({globalStewardInfo?.name || 'Global Steward'})
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Dashboard Button */}
              <button
                onClick={() => setShowDashboard(true)}
                className="flex items-center text-xs text-[#F5F1E8] bg-[#B8826D] hover:bg-[#B8826D]/80 px-3 py-2 rounded transition-colors min-h-[36px]"
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </button>
              {ownership.canEditJourneys && (
                <button
                  onClick={() => setExpanded(true)}
                  className="flex items-center text-xs text-[#B8826D] hover:text-[#B8826D]/80 transition-colors min-h-[36px] px-2"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Edit
                </button>
              )}
              {ownership.canReviewDrafts && (
                <button
                  onClick={() => setShowDraftReview(!showDraftReview)}
                  className="flex items-center text-xs text-[#8B9D83] hover:text-[#8B9D83]/80 transition-colors min-h-[36px] px-2"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Drafts
                  {draftCount > 0 && (
                    <span className="ml-1 w-4 h-4 bg-[#8B9D83] text-white text-[10px] rounded-full flex items-center justify-center">
                      {draftCount}
                    </span>
                  )}
                </button>
              )}
              {ownership.canReviewSuggestions && (
                <button
                  onClick={() => setShowSuggestionReview(!showSuggestionReview)}
                  className="flex items-center text-xs text-[#F5F1E8]/70 hover:text-[#F5F1E8] transition-colors min-h-[36px] px-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  Suggestions
                  {submittedCount > 0 && (
                    <span className="ml-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {submittedCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      {/* Draft Review Panel - Real data from database */}
      {showDraftReview && ownership.canReviewDrafts && (
        <ContributionReviewPanel
          journeyId={journeyId}
          statusFilter="draft"
          title="Draft Review Panel"
          icon={<Eye className="w-4 h-4 text-[#8B9D83]" />}
          onClose={() => setShowDraftReview(false)}
        />
      )}

      {/* Suggestion Review Panel - Real data from database */}
      {showSuggestionReview && ownership.canReviewSuggestions && (
        <ContributionReviewPanel
          journeyId={journeyId}
          statusFilter="submitted_for_review"
          title="Suggestion Review Panel"
          icon={<MessageSquare className="w-4 h-4 text-[#B8826D]" />}
          onClose={() => setShowSuggestionReview(false)}
        />
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 hover:bg-[#F5F1E8]/50 transition-colors text-left min-h-[72px]"
      >
        <div className="flex-1 min-w-0 pr-3">
          <span className="text-[#1A2332] text-base sm:text-lg font-medium block">
            {titleText}
          </span>
          <span className="text-[#1A2332]/50 text-xs sm:text-sm mt-1 block line-clamp-2">
            {subtitleText}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 sm:p-5 md:p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8]/30">
          {/* Phase 1 Content Protection Notice */}
          {config?.phase1Protected && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg border border-[#8B9D83]/20">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-[#8B9D83] mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                    <span className="font-medium text-[#1A2332]">Content Protection:</span> The core narrative 
                    of this journey is complete and protected. AI may only suggest additions, never overwrite 
                    existing content.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Four equal options */}
          <div className="space-y-3 sm:space-y-4">
            
            {/* Option 1: Add moments, reflections or periods */}
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#1A2332]/10">
              <div className="flex items-start">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#B8826D]/10 flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8826D]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#1A2332] text-sm sm:text-base mb-1.5 sm:mb-2">
                    {isCollective ? 'Add moments, people or periods' : 'Add moments, reflections or periods'}
                  </h4>
                  <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed">
                    {isCollective 
                      ? 'Matches, tours, committees, milestones or periods that shaped the club.'
                      : 'Experiences, conversations, teams or turning points.'}
                  </p>
                  <button
                    onClick={() => setActiveForm(activeForm === 'context' ? null : 'context')}
                    className="mt-3 sm:mt-4 text-[#B8826D] text-sm font-medium hover:text-[#B8826D]/80 transition-colors min-h-[44px] flex items-center"
                  >
                    {activeForm === 'context' ? (
                      <><X className="w-4 h-4 mr-1.5" /> Close form</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-1.5" /> Begin adding context</>
                    )}
                  </button>
                  {activeForm === 'context' && (
                    <InlineContributionForm
                      journeyId={journeyId}
                      type={isCollective ? 'moment' : 'text'}
                      placeholder={isCollective 
                        ? 'Describe a match, tour, milestone or period...'
                        : 'Describe an experience, conversation or turning point...'}
                      label="Add Context"
                      onClose={() => setActiveForm(null)}
                      onSaved={handleFormSaved}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Option 2: Upload what already exists */}
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#1A2332]/10">
              <div className="flex items-start">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#8B9D83]/10 flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#1A2332] text-sm sm:text-base mb-1.5 sm:mb-2">
                    Upload what already exists
                  </h4>
                  <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3">
                    {isCollective 
                      ? 'Programmes, minutes, photographs, newsletters or documents the club already holds.'
                      : 'Notes, documents, articles or images.'}
                  </p>
                  <p className="text-[#8B9D83] text-xs sm:text-sm leading-relaxed italic">
                    If we can read it and associate it, we can help place it correctly.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-[#F5F1E8] rounded text-[10px] sm:text-xs text-[#1A2332]/60">
                      <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" />
                      Word
                    </span>
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-[#F5F1E8] rounded text-[10px] sm:text-xs text-[#1A2332]/60">
                      <FileText className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" />
                      PDF
                    </span>
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-[#F5F1E8] rounded text-[10px] sm:text-xs text-[#1A2332]/60">
                      <Image className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" />
                      Images
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDashboard(true)}
                    className="mt-3 sm:mt-4 text-[#8B9D83] text-sm font-medium hover:text-[#8B9D83]/80 transition-colors min-h-[44px] flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    Upload materials
                  </button>
                </div>
              </div>
            </div>

            {/* Option 3: Invite others to add context or shared memory */}
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#1A2332]/10">
              <div className="flex items-start">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A2332]/5 flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A2332]/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#1A2332] text-sm sm:text-base mb-1.5 sm:mb-2">
                    {isCollective 
                      ? 'Invite others to help recall or organise material'
                      : 'Invite others to add context or shared memory'}
                  </h4>
                  <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed">
                    {isCollective 
                      ? 'Invite trusted club members, historians or families to help fill gaps or add context.'
                      : 'Teammates, colleagues or community members.'}
                  </p>
                  {/* Contribution rules for exemplars */}
                  {config?.relationshipDeclarationRequired && (
                    <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-[#1A2332]/40 space-y-0.5 sm:space-y-1">
                      <p>Named invitations only</p>
                      <p>Role or relationship must be stated</p>
                      <p>All contributions reviewed before inclusion</p>
                    </div>
                  )}
                  <button
                    onClick={() => setActiveForm(activeForm === 'invitation' ? null : 'invitation')}
                    className="mt-3 sm:mt-4 text-[#1A2332]/70 text-sm font-medium hover:text-[#1A2332] transition-colors min-h-[44px] flex items-center"
                  >
                    {activeForm === 'invitation' ? (
                      <><X className="w-4 h-4 mr-1.5" /> Close form</>
                    ) : (
                      <><Mail className="w-4 h-4 mr-1.5" /> Send an invitation</>
                    )}
                  </button>
                  {activeForm === 'invitation' && (
                    <InlineContributionForm
                      journeyId={journeyId}
                      type="invitation"
                      placeholder="Name and email of the person you'd like to invite, and why..."
                      label="Invite a Contributor"
                      onClose={() => setActiveForm(null)}
                      onSaved={handleFormSaved}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Option 4: Invite others to begin their own Rugby Journeys */}
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#1A2332]/10">
              <div className="flex items-start">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#B8826D]/5 flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8826D]/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#1A2332] text-sm sm:text-base mb-1.5 sm:mb-2">
                    Invite others to begin their own Rugby Journeys
                  </h4>
                  <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed">
                    {isCollective 
                      ? 'Know a club member whose story should be preserved? Share the invitation.'
                      : 'Pass it on and invite others to share their journeys.'}
                  </p>
                  <button
                    onClick={() => onNavigate('join')}
                    className="mt-3 sm:mt-4 text-[#B8826D]/70 text-sm font-medium hover:text-[#B8826D] transition-colors min-h-[44px] flex items-center"
                  >
                    Invite someone to begin
                  </button>
                </div>
              </div>
            </div>

            {/* Option 5 (Collective only): Propose a new section */}
            {isCollective && (
              <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#1A2332]/10">
                <div className="flex items-start">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A2332]/5 flex items-center justify-center flex-shrink-0 mr-3 sm:mr-4">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A2332]/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#1A2332] text-sm sm:text-base mb-1.5 sm:mb-2">
                      Propose a new section (if something does not fit)
                    </h4>
                    <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed">
                      Long-running themes, archives or programmes may deserve their own space.
                    </p>
                    <button
                      onClick={() => setActiveForm(activeForm === 'section' ? null : 'section')}
                      className="mt-3 sm:mt-4 text-[#1A2332]/60 text-sm font-medium hover:text-[#1A2332] transition-colors min-h-[44px] flex items-center"
                    >
                      {activeForm === 'section' ? (
                        <><X className="w-4 h-4 mr-1.5" /> Close form</>
                      ) : (
                        <><Plus className="w-4 h-4 mr-1.5" /> Propose a section</>
                      )}
                    </button>
                    {activeForm === 'section' && (
                      <InlineContributionForm
                        journeyId={journeyId}
                        type="section_proposal"
                        placeholder="Describe the section you'd like to propose and why it's needed..."
                        label="Propose a Section"
                        onClose={() => setActiveForm(null)}
                        onSaved={handleFormSaved}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stewardship note for collectives */}
          {isCollective && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#1A2332]/10">
              <p className="text-[#1A2332]/50 text-xs sm:text-sm leading-relaxed">
                This journey is stewarded on behalf of the club. All additions are reviewed before becoming part of the public record.
              </p>
            </div>
          )}

          {/* Legacy & Continuity Microcopy */}
          {config?.continuityMicrocopy && (
            <div className="mt-4 p-3 sm:p-4 bg-white rounded-lg border border-[#1A2332]/5">
              <p className="text-[#1A2332]/60 text-xs sm:text-sm leading-relaxed text-center italic">
                {config.continuityMicrocopy}
              </p>
            </div>
          )}

          {/* AI & Memory Governance - Required */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#1A2332]/10">
            <p className="text-[#1A2332]/50 text-xs sm:text-sm leading-relaxed text-center">
              Anything shared, uploaded or contributed is remembered as a reference. Nothing is added or published without {isCollective ? 'steward' : 'your'} approval.
            </p>
          </div>
        </div>
      )}
      </div>

      {/* Steward Dashboard Modal */}
      {(hasGlobalAccess || showDashboard) && (
        <StewardDashboard
          isOpen={showDashboard}
          onClose={() => setShowDashboard(false)}
          journeyId={journeyId}
          journeyTitle={journeyTitle}
          userEmail={user?.email || globalStewardInfo?.email || ''}
          userName={globalStewardInfo?.name || user?.user_metadata?.full_name || 'Steward'}
          userId={user?.id || globalStewardInfo?.email || ''}
        />
      )}

    </>
  );
};

export default Phase3Builder;
