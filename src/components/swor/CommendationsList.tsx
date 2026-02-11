import React, { useState, useEffect } from 'react';
import { Heart, User, Calendar, Link2, Quote, MessageSquare, ChevronDown, ChevronUp, ExternalLink, PenLine, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Commendation {
  id: string;
  profile_id: string;
  commender_name: string;
  commender_email?: string;
  commender_profile_id?: string;
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
  // For bi-directional display (commendations I've written)
  recipient_name?: string;
  recipient_profile_id?: string;
}

interface CommendationsListProps {
  profileId: string;
  profileName: string;
  onNavigateToProfile?: (profileId: string) => void;
  variant?: 'recipient' | 'commender';
  maxInitialDisplay?: number;
  // For owner response capability
  isOwner?: boolean;
  ownerUserId?: string;
  onResponseAdded?: () => void;
}

const CommendationsList: React.FC<CommendationsListProps> = ({
  profileId,
  profileName,
  onNavigateToProfile,
  variant = 'recipient',
  maxInitialDisplay = 3,
  isOwner = false,
  ownerUserId,
  onResponseAdded
}) => {
  const [commendations, setCommendations] = useState<Commendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadCommendations();
  }, [profileId, variant]);

  const loadCommendations = async () => {
    setLoading(true);

    try {
      const action = variant === 'commender' 
        ? 'get_commendations_by_commender'
        : 'get_commendations';
      
      const payload = variant === 'commender'
        ? { commender_profile_id: profileId, status: 'approved' }
        : { profile_id: profileId, status: 'approved' };

      const { data, error: fetchError } = await supabase.functions.invoke('swor-profile', {
        body: { action, payload }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data?.success) {
        setCommendations(data.commendations || []);
      } else {
        setCommendations([]);
      }
    } catch (err) {
      console.error('Error loading commendations:', err);
      setCommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseUpdated = () => {
    loadCommendations();
    if (onResponseAdded) {
      onResponseAdded();
    }
  };

  const displayedCommendations = showAll 
    ? commendations 
    : commendations.slice(0, maxInitialDisplay);

  const hasMore = commendations.length > maxInitialDisplay;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border border-[#1A2332]/10 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-[#1A2332]/10" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-[#1A2332]/10 rounded w-1/3" />
                <div className="h-3 bg-[#1A2332]/10 rounded w-1/4" />
                <div className="h-16 bg-[#1A2332]/10 rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (commendations.length === 0) {
    return (
      <div className="bg-[#F5F1E8]/50 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#B8826D]/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-[#B8826D]/60" />
        </div>
        <p className="text-[#1A2332]/60 mb-2">
          {variant === 'commender' 
            ? "No commendations written yet."
            : "No commendations have been added yet."
          }
        </p>
        <p className="text-sm text-[#1A2332]/40">
          {variant === 'commender'
            ? "When you write commendations for others, they'll appear here."
            : "If you shared the journey, you're welcome to add one."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedCommendations.map((commendation) => (
        <CommendationCard
          key={commendation.id}
          commendation={commendation}
          variant={variant}
          profileName={profileName}
          onNavigateToProfile={onNavigateToProfile}
          isOwner={isOwner}
          ownerUserId={ownerUserId}
          onResponseUpdated={handleResponseUpdated}
        />
      ))}

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center space-x-2 py-3 text-[#B8826D] hover:text-[#B8826D]/80 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Show fewer</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Show all {commendations.length} commendations</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

interface CommendationCardProps {
  commendation: Commendation;
  variant: 'recipient' | 'commender';
  profileName: string;
  onNavigateToProfile?: (profileId: string) => void;
  isOwner?: boolean;
  ownerUserId?: string;
  onResponseUpdated?: () => void;
}

const CommendationCard: React.FC<CommendationCardProps> = ({
  commendation,
  variant,
  profileName,
  onNavigateToProfile,
  isOwner = false,
  ownerUserId,
  onResponseUpdated
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState(commendation.response_text || '');
  const [savingResponse, setSavingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  
  const isLongText = commendation.commendation_text.length > 300;
  const displayText = expanded || !isLongText 
    ? commendation.commendation_text 
    : commendation.commendation_text.slice(0, 300) + '...';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleProfileClick = (profileId: string) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(profileId);
    }
  };

  const handleSaveResponse = async () => {
    setSavingResponse(true);
    setResponseError(null);

    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'respond_to_commendation',
          payload: {
            commendation_id: commendation.id,
            response_text: responseText.trim() || null,
            user_id: ownerUserId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to save response');
      }

      setShowResponseModal(false);
      if (onResponseUpdated) {
        onResponseUpdated();
      }
    } catch (err: any) {
      console.error('Error saving response:', err);
      setResponseError(err.message || 'Failed to save response');
    } finally {
      setSavingResponse(false);
    }
  };

  const isCommenderVariant = variant === 'commender';

  return (
    <>
      <div className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/20 transition-colors">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B8826D]/20 to-[#8B9D83]/20 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-[#1A2332]/40" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isCommenderVariant ? (
              // Commender variant: Show who the commendation was written FOR
              <>
                <p className="text-sm text-[#1A2332]/60 mb-0.5">Commendation for</p>
                {commendation.recipient_profile_id && onNavigateToProfile ? (
                  <button
                    onClick={() => handleProfileClick(commendation.recipient_profile_id!)}
                    className="font-medium text-[#1A2332] hover:text-[#B8826D] transition-colors flex items-center space-x-1"
                  >
                    <span>{commendation.recipient_name || 'Unknown'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="font-medium text-[#1A2332]">
                    {commendation.recipient_name || 'Unknown'}
                  </span>
                )}
              </>
            ) : (
              // Recipient variant: Show who WROTE the commendation
              <>
                <div className="flex items-center space-x-2">
                  {commendation.commender_profile_id && onNavigateToProfile ? (
                    <button
                      onClick={() => handleProfileClick(commendation.commender_profile_id!)}
                      className="font-medium text-[#1A2332] hover:text-[#B8826D] transition-colors flex items-center space-x-1"
                    >
                      <span>{commendation.commender_name}</span>
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="font-medium text-[#1A2332]">
                      {commendation.commender_name}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Relationship Context */}
            <p className="text-sm text-[#1A2332]/60 mt-0.5">
              {commendation.relationship_context}
              {commendation.commender_organisation && (
                <span className="text-[#1A2332]/40"> · {commendation.commender_organisation}</span>
              )}
            </p>

            {/* When Context */}
            {commendation.when_context && (
              <div className="flex items-center space-x-1.5 mt-1 text-xs text-[#1A2332]/50">
                <Calendar className="w-3 h-3" />
                <span>{commendation.when_context}</span>
              </div>
            )}
          </div>
        </div>

        {/* Why It Mattered */}
        <div className="mb-4 pl-4 border-l-2 border-[#B8826D]/30">
          <p className="text-sm text-[#B8826D]/80 italic">
            "{commendation.why_it_mattered}"
          </p>
        </div>

        {/* Main Commendation Text */}
        <div className="relative">
          <Quote className="absolute -top-1 -left-1 w-6 h-6 text-[#1A2332]/10" />
          <p className="text-[#1A2332]/80 leading-relaxed pl-6">
            {displayText}
          </p>
          
          {isLongText && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-sm text-[#B8826D] hover:text-[#B8826D]/80 transition-colors pl-6"
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Owner Response - only show for recipient variant */}
        {!isCommenderVariant && commendation.response_text && (
          <div className="mt-4 pt-4 border-t border-[#1A2332]/10">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-4 h-4 text-[#8B9D83] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-[#8B9D83] mb-1">
                  Response from {profileName}
                </p>
                <p className="text-sm text-[#1A2332]/70 italic">
                  "{commendation.response_text}"
                </p>
              </div>
              {/* Edit response button for owner */}
              {isOwner && (
                <button
                  onClick={() => {
                    setResponseText(commendation.response_text || '');
                    setShowResponseModal(true);
                  }}
                  className="text-xs text-[#B8826D] hover:text-[#B8826D]/80 flex items-center"
                >
                  <PenLine className="w-3 h-3 mr-1" />
                  Edit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Add Response Button - only for owner viewing recipient variant without existing response */}
        {!isCommenderVariant && isOwner && !commendation.response_text && (
          <div className="mt-4 pt-4 border-t border-[#1A2332]/10">
            <button
              onClick={() => {
                setResponseText('');
                setShowResponseModal(true);
              }}
              className="flex items-center text-sm text-[#8B9D83] hover:text-[#8B9D83]/80 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Add a response
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#1A2332]/5 flex items-center justify-between">
          <span className="text-xs text-[#1A2332]/40">
            {commendation.approved_at 
              ? `Approved ${formatDate(commendation.approved_at)}`
              : formatDate(commendation.created_at)
            }
          </span>
          
          {/* View Profile Link for commender variant */}
          {isCommenderVariant && commendation.recipient_profile_id && onNavigateToProfile && (
            <button
              onClick={() => handleProfileClick(commendation.recipient_profile_id!)}
              className="text-xs text-[#B8826D] hover:text-[#B8826D]/80 flex items-center space-x-1"
            >
              <span>View journey</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#8B9D83]/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#8B9D83]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A2332]">
                      {commendation.response_text ? 'Edit Response' : 'Add Response'}
                    </h3>
                    <p className="text-sm text-[#1A2332]/60">
                      To {commendation.commender_name}'s commendation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-[#1A2332]/40 hover:text-[#1A2332]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guidance */}
              <div className="mb-4 p-3 bg-[#8B9D83]/5 rounded-lg border border-[#8B9D83]/20">
                <p className="text-xs text-[#1A2332]/60">
                  Keep your response calm and gracious. This will be visible publicly alongside the commendation.
                </p>
              </div>

              {responseError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                  {responseError}
                </div>
              )}

              <div className="mb-4">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Thank you for this kind commendation..."
                  className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-[#8B9D83] resize-none text-sm"
                  rows={4}
                  disabled={savingResponse}
                  maxLength={500}
                />
                <p className="text-xs text-[#1A2332]/40 mt-1 text-right">
                  {responseText.length}/500 characters
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  disabled={savingResponse}
                  className="flex-1 px-4 py-2.5 text-sm text-[#1A2332] bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {commendation.response_text && (
                  <button
                    onClick={() => {
                      setResponseText('');
                    }}
                    disabled={savingResponse || !responseText}
                    className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={handleSaveResponse}
                  disabled={savingResponse}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-[#8B9D83] hover:bg-[#8B9D83]/90 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {savingResponse ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Response'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommendationsList;
