import React, { useState } from 'react';
import { Heart, User, Building2, Calendar, MessageSquare, Send, X, AlertCircle, CheckCircle, LogIn, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface CommendationFormProps {
  profileId: string;
  profileName: string;
  onClose: () => void;
  onSuccess?: () => void;
  onRequestAuth?: () => void;
}

const RELATIONSHIP_OPTIONS = [
  { value: '', label: 'Select relationship...' },
  { value: 'teammate', label: 'Teammate' },
  { value: 'coach', label: 'Coach' },
  { value: 'player_coached', label: 'Player I coached' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'opponent', label: 'Opponent' },
  { value: 'family', label: 'Family member' },
  { value: 'friend', label: 'Friend' },
  { value: 'supporter', label: 'Supporter / Fan' },
  { value: 'administrator', label: 'Club administrator' },
  { value: 'other', label: 'Other (please specify)' }
];

const CommendationForm: React.FC<CommendationFormProps> = ({
  profileId,
  profileName,
  onClose,
  onSuccess,
  onRequestAuth
}) => {
  const { user, profile } = useAppContext();
  
  const [formData, setFormData] = useState({
    commender_name: profile?.full_name || '',
    commender_email: user?.email || '',
    commender_organisation: '',
    relationship_type: '',
    relationship_context: '',
    when_context: '',
    why_it_mattered: '',
    commendation_text: '',
    visibility_suggestion: 'public'
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtherRelationship, setShowOtherRelationship] = useState(false);

  const isAuthenticated = !!user;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    if (field === 'relationship_type') {
      setShowOtherRelationship(value === 'other');
      if (value !== 'other') {
        const option = RELATIONSHIP_OPTIONS.find(o => o.value === value);
        setFormData(prev => ({ ...prev, relationship_context: option?.label || value }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.commender_name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.relationship_type) {
      setError('Please select your relationship to this person');
      return;
    }
    if (formData.relationship_type === 'other' && !formData.relationship_context.trim()) {
      setError('Please describe your relationship');
      return;
    }
    if (!formData.why_it_mattered.trim()) {
      setError('Please explain why this mattered');
      return;
    }
    if (formData.why_it_mattered.trim().length < 20) {
      setError('Please provide a bit more detail about why this mattered');
      return;
    }
    if (!formData.commendation_text.trim()) {
      setError('Please write your commendation');
      return;
    }
    if (formData.commendation_text.trim().length < 50) {
      setError('Please write a more detailed commendation (at least a few sentences)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const relationshipContext = formData.relationship_type === 'other' 
        ? formData.relationship_context 
        : RELATIONSHIP_OPTIONS.find(o => o.value === formData.relationship_type)?.label || formData.relationship_type;

      const { data, error: submitError } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'submit_commendation',
          payload: {
            profile_id: profileId,
            commender_name: formData.commender_name.trim(),
            commender_email: formData.commender_email.trim() || null,
            commender_profile_id: profile?.id || null,
            commender_organisation: formData.commender_organisation.trim() || null,
            relationship_context: relationshipContext,
            when_context: formData.when_context.trim() || null,
            why_it_mattered: formData.why_it_mattered.trim(),
            commendation_text: formData.commendation_text.trim(),
            visibility_suggestion: formData.visibility_suggestion
          }
        }
      });

      if (submitError || !data?.success) {
        throw new Error(data?.error || 'Failed to submit commendation');
      }

      // Send notification to stewards (non-blocking)
      try {
        await supabase.functions.invoke('swor-notifications', {
          body: {
            action: 'commendation_submitted',
            payload: {
              profile_id: profileId,
              commender_name: formData.commender_name.trim(),
              commender_email: formData.commender_email.trim() || null,
              recipient_name: data.recipient_name || profileName,
              relationship_context: relationshipContext,
              commendation_id: data.commendation?.id
            }
          }
        });
      } catch (notifErr) {
        console.warn('Notification error (non-blocking):', notifErr);
      }

      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }

  };

  // Success state
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#8B9D83]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#8B9D83]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1A2332] mb-2">Thank You</h3>
          <p className="text-[#1A2332]/60 mb-4">
            Your commendation has been submitted for review.
          </p>
          <p className="text-sm text-[#1A2332]/50">
            A steward will review it before it appears on {profileName}'s journey. 
            This helps ensure all contributions are thoughtful and appropriate.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#1A2332]/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#B8826D]/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-[#B8826D]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1A2332]">Write a Commendation</h2>
              <p className="text-sm text-[#1A2332]/60">for {profileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1A2332]/5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#1A2332]/60" />
          </button>
        </div>

        {/* Auth prompt for non-authenticated users */}
        {!isAuthenticated && (
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-[#B8826D]/5 border border-[#B8826D]/20 rounded-lg p-4 flex items-start space-x-3">
              <LogIn className="w-5 h-5 text-[#B8826D] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[#1A2332]/80 mb-2">
                  <strong>Sign in to link your commendation to your profile.</strong>
                </p>
                <p className="text-xs text-[#1A2332]/60 mb-3">
                  This creates a bi-directional link so others can see commendations you've written. 
                  You can still submit without signing in.
                </p>
                {onRequestAuth && (
                  <button
                    type="button"
                    onClick={onRequestAuth}
                    className="text-sm text-[#B8826D] font-medium hover:text-[#B8826D]/80 transition-colors min-h-[44px]"
                  >
                    Sign in with magic link
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Guidance */}
          <div className="bg-[#F5F1E8]/50 rounded-lg p-4">
            <p className="text-sm text-[#1A2332]/70 leading-relaxed">
              A commendation is a meaningful acknowledgement of someone's contribution, character, or impact. 
              Please keep this factual and kind. Include how you know the person and when. 
              <strong className="text-[#1A2332]/80"> Nothing is published until reviewed.</strong>
            </p>
          </div>

          {/* About You */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#1A2332] flex items-center space-x-2">
              <User className="w-4 h-4 text-[#1A2332]/40" />
              <span>About You</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="commender-name" className="block text-sm text-[#1A2332]/70 mb-1.5">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="commender-name"
                  type="text"
                  value={formData.commender_name}
                  onChange={(e) => handleChange('commender_name', e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  inputMode="text"
                  enterKeyHint="next"
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base min-h-[44px] box-border"
                />
              </div>
              <div>
                <label htmlFor="commender-email" className="block text-sm text-[#1A2332]/70 mb-1.5">
                  Your Email <span className="text-[#1A2332]/40">(for follow-up if needed)</span>
                </label>
                <input
                  id="commender-email"
                  type="email"
                  value={formData.commender_email}
                  onChange={(e) => handleChange('commender_email', e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="next"
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base min-h-[44px] box-border"
                />
              </div>
            </div>

            <div>
              <label htmlFor="commender-org" className="block text-sm text-[#1A2332]/70 mb-1.5 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Organisation <span className="text-[#1A2332]/40">(if applicable)</span></span>
              </label>
              <input
                id="commender-org"
                type="text"
                value={formData.commender_organisation}
                onChange={(e) => handleChange('commender_organisation', e.target.value)}
                placeholder="Club, school, or organisation you represent"
                autoComplete="organization"
                inputMode="text"
                enterKeyHint="next"
                className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base min-h-[44px] box-border"
              />
            </div>
          </div>

          {/* Context */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#1A2332] flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#1A2332]/40" />
              <span>Context</span>
            </h3>

            <div>
              <label htmlFor="relationship-type" className="block text-sm text-[#1A2332]/70 mb-1.5">
                Your Relationship <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#1A2332]/50 mb-2">
                How do you know this person?
              </p>
              <select
                id="relationship-type"
                value={formData.relationship_type}
                onChange={(e) => handleChange('relationship_type', e.target.value)}
                className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base min-h-[44px] box-border"
              >
                {RELATIONSHIP_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {showOtherRelationship && (
                <input
                  type="text"
                  value={formData.relationship_context}
                  onChange={(e) => handleChange('relationship_context', e.target.value)}
                  placeholder="Please describe your relationship"
                  inputMode="text"
                  enterKeyHint="next"
                  className="w-full mt-2 px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base min-h-[44px] box-border"
                />
              )}
            </div>

            <div>
              <label htmlFor="when-context" className="block text-sm text-[#1A2332]/70 mb-1.5">
                When <span className="text-[#1A2332]/40">(optional but helpful)</span>
              </label>
              <p className="text-xs text-[#1A2332]/50 mb-2">
                When did this happen or when did you know them?
              </p>
              <input
                id="when-context"
                type="text"
                value={formData.when_context}
                onChange={(e) => handleChange('when_context', e.target.value)}
                placeholder="e.g., 1985-1990, during the 1987 season, throughout the 1970s"
                inputMode="text"
                enterKeyHint="next"
                className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base min-h-[44px] box-border"
              />
            </div>
          </div>

          {/* The Commendation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#1A2332] flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#1A2332]/40" />
              <span>The Commendation</span>
            </h3>

            <div>
              <label htmlFor="why-it-mattered" className="block text-sm text-[#1A2332]/70 mb-1.5">
                Why It Mattered <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#1A2332]/50 mb-2">
                What impact did this person have? Why is their contribution worth acknowledging?
              </p>
              <textarea
                id="why-it-mattered"
                value={formData.why_it_mattered}
                onChange={(e) => handleChange('why_it_mattered', e.target.value)}
                placeholder="Share the significance of their contribution..."
                rows={3}
                className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base resize-none min-h-[80px] box-border"
              />
              <p className="text-xs text-[#1A2332]/40 mt-1 text-right">
                {formData.why_it_mattered.length} characters
              </p>
            </div>

            <div>
              <label htmlFor="commendation-text" className="block text-sm text-[#1A2332]/70 mb-1.5">
                Your Commendation <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-[#1A2332]/50 mb-2">
                Write your commendation. Be specific, be genuine, be kind.
              </p>
              <textarea
                id="commendation-text"
                value={formData.commendation_text}
                onChange={(e) => handleChange('commendation_text', e.target.value)}
                placeholder="Write your commendation here..."
                rows={5}
                className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base resize-none min-h-[120px] box-border"
              />
              <p className="text-xs text-[#1A2332]/40 mt-1 text-right">
                {formData.commendation_text.length} characters
              </p>
            </div>
          </div>

          {/* Visibility Preference */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#1A2332] flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#1A2332]/40" />
              <span>Visibility Preference</span>
            </h3>
            <p className="text-xs text-[#1A2332]/50">
              Suggest who should see this commendation after approval. The steward may adjust this.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'public', label: 'Public', desc: 'Anyone can see' },
                { value: 'connections', label: 'Connections', desc: 'Only connected profiles' },
                { value: 'family', label: 'Family', desc: 'Family members only' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('visibility_suggestion', option.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
                    formData.visibility_suggestion === option.value
                      ? 'bg-[#B8826D] text-white'
                      : 'bg-[#1A2332]/5 text-[#1A2332]/70 hover:bg-[#1A2332]/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Governance note */}
          <div className="bg-[#1A2332]/5 rounded-lg p-4">
            <p className="text-xs text-[#1A2332]/60 leading-relaxed">
              All commendations are reviewed by a steward before appearing publicly. 
              Anonymous submissions are not accepted. The person you're commending cannot edit your words, 
              but may add a brief, calm response. No ratings, stars, or rankings are used.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-[#1A2332]/20 rounded-lg text-[#1A2332]/70 font-medium hover:bg-[#1A2332]/5 transition-colors min-h-[48px] text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 min-h-[48px] text-base"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Commendation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommendationForm;
