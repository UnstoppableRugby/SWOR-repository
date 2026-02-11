import React, { useState } from 'react';
import { Shield, Mail, MessageCircle, User, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Steward {
  id: string;
  name: string;
  email?: string;
  role: 'global_steward' | 'journey_steward';
  avatarUrl?: string;
}

interface StewardContactProps {
  assignedStewards?: Steward[];
  journeyTitle?: string;
  variant?: 'inline' | 'card' | 'minimal';
  showFallback?: boolean;
}

const StewardContact: React.FC<StewardContactProps> = ({
  assignedStewards = [],
  journeyTitle,
  variant = 'card',
  showFallback = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Fallback steward (Alun)
  const fallbackSteward: Steward = {
    id: 'alun-fallback',
    name: 'Alun',
    email: 'alun@adesignbranding.co.za',
    role: 'global_steward'
  };

  const stewardsToShow = assignedStewards.length > 0 ? assignedStewards : (showFallback ? [fallbackSteward] : []);
  const hasStewards = stewardsToShow.length > 0;
  const isUsingFallback = assignedStewards.length === 0 && showFallback;

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    // Simulate sending - in production this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSending(false);
    setSent(true);
    setMessage('');
    
    // Reset after a few seconds
    setTimeout(() => {
      setSent(false);
      setShowContactForm(false);
    }, 3000);
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Shield className="w-4 h-4 text-[#8B9D83]" />
        {hasStewards ? (
          <span className="text-[#1A2332]/70">
            Stewarded by {stewardsToShow.map(s => s.name).join(', ')}
          </span>
        ) : (
          <span className="text-[#1A2332]/50">No steward assigned</span>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between py-3 border-t border-[#1A2332]/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#8B9D83]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#8B9D83]" />
          </div>
          <div>
            {hasStewards ? (
              <>
                <p className="text-sm font-medium text-[#1A2332]">
                  {stewardsToShow.map(s => s.name).join(', ')}
                </p>
                <p className="text-xs text-[#1A2332]/50">
                  {isUsingFallback ? 'SWOR Steward' : 'Journey Steward'}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#1A2332]/50">No steward assigned yet</p>
            )}
          </div>
        </div>
        {hasStewards && (
          <button
            onClick={() => setShowContactForm(true)}
            className="text-sm text-[#B8826D] hover:text-[#B8826D]/80 transition-colors"
          >
            Contact
          </button>
        )}
      </div>
    );
  }

  // Default: card variant
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
            <h4 className="font-medium text-[#1A2332]">Steward Support</h4>
            <p className="text-sm text-[#1A2332]/60">
              {hasStewards 
                ? `${stewardsToShow.length} steward${stewardsToShow.length > 1 ? 's' : ''} available`
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
              You are not on your own. Stewards are here to help with questions, 
              review content, and guide you through the process.
            </p>
          </div>

          {/* Steward list */}
          <div className="space-y-3 mb-4">
            {stewardsToShow.map((steward) => (
              <div 
                key={steward.id}
                className="flex items-center justify-between p-3 bg-[#F5F1E8]/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A2332]/10 flex items-center justify-center overflow-hidden">
                    {steward.avatarUrl ? (
                      <img src={steward.avatarUrl} alt={steward.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#1A2332]/40" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A2332]">{steward.name}</p>
                    <p className="text-xs text-[#1A2332]/50">
                      {steward.role === 'global_steward' ? 'SWOR Steward' : 'Journey Steward'}
                    </p>
                  </div>
                </div>
                {steward.email && (
                  <a
                    href={`mailto:${steward.email}?subject=SWOR Journey Support${journeyTitle ? ` - ${journeyTitle}` : ''}`}
                    className="flex items-center space-x-1 text-sm text-[#B8826D] hover:text-[#B8826D]/80 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Contact form toggle */}
          {!showContactForm ? (
            <button
              onClick={() => setShowContactForm(true)}
              className="w-full flex items-center justify-center space-x-2 py-3 border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332]/70 hover:bg-[#F5F1E8]/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send a message</span>
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help? Ask a question or share a concern..."
                className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] resize-none text-sm"
                rows={3}
                disabled={sending || sent}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 py-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] transition-colors"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending || sent}
                  className="flex-1 py-2 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : sent ? 'Sent!' : 'Send'}
                </button>
              </div>
            </div>
          )}

          {/* Help note */}
          <div className="mt-4 pt-3 border-t border-[#1A2332]/5">
            <div className="flex items-start space-x-2 text-xs text-[#1A2332]/50">
              <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>
                Stewards can help with content review, privacy questions, 
                technical issues, or anything else you need.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StewardContact;
