import React, { useState, useEffect } from 'react';
import { X, Heart, Clock, Shield, Sparkles } from 'lucide-react';

interface OnboardingReassuranceProps {
  onDismiss?: () => void;
  userId?: string;
  variant?: 'banner' | 'panel' | 'modal';
}

const OnboardingReassurance: React.FC<OnboardingReassuranceProps> = ({
  onDismiss,
  userId,
  variant = 'panel'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  // Check if user has dismissed this before
  useEffect(() => {
    const dismissedKey = `swor_onboarding_dismissed_${userId || 'guest'}`;
    const dismissed = localStorage.getItem(dismissedKey);
    if (dismissed === 'true') {
      setHasBeenDismissed(true);
      setIsVisible(false);
    }
  }, [userId]);

  const handleDismiss = () => {
    setIsVisible(false);
    const dismissedKey = `swor_onboarding_dismissed_${userId || 'guest'}`;
    localStorage.setItem(dismissedKey, 'true');
    onDismiss?.();
  };

  if (!isVisible || hasBeenDismissed) {
    return null;
  }

  const reassurances = [
    {
      icon: <Heart className="w-5 h-5" />,
      title: "There is no obligation to complete everything",
      description: "Add what feels right. Leave the rest for later, or not at all."
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "You can start anywhere",
      description: "There is no correct order. Begin with whatever comes to mind."
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Everything begins as a private draft",
      description: "Nothing becomes public without your approval."
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "You can pause and return at any time",
      description: "There is no deadline. Your work is saved automatically."
    }
  ];

  if (variant === 'banner') {
    return (
      <div className="bg-[#8B9D83]/10 border-b border-[#8B9D83]/20" role="status">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-6 flex-wrap gap-y-2">
              {reassurances.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-[#1A2332]/70">
                  <span className="text-[#8B9D83]">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="text-[#1A2332]/40 hover:text-[#1A2332]/60 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss welcome message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <div className="bg-[#F5F1E8] rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-[#1A2332]/40 hover:text-[#1A2332]/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close welcome message"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl text-[#1A2332] mb-3">
              Welcome to Your Rugby Journey
            </h2>
            <p className="text-[#1A2332]/70 leading-relaxed">
              Before you begin, here are a few things to know.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {reassurances.map((item, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-[#1A2332]/5">
                <div className="w-10 h-10 rounded-full bg-[#8B9D83]/10 flex items-center justify-center flex-shrink-0 text-[#8B9D83]">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-medium text-[#1A2332] mb-1">{item.title}</h4>
                  <p className="text-sm text-[#1A2332]/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleDismiss}
              className="px-8 py-3 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors min-h-[48px]"
            >
              I understand, let me begin
            </button>
            <p className="text-xs text-[#1A2332]/40 mt-3">
              You can always find this information in the Guidance section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default: panel variant
  return (
    <div className="bg-white rounded-xl border border-[#8B9D83]/20 overflow-hidden" role="status">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-serif text-lg text-[#1A2332] mb-1">
              Before you begin
            </h3>
            <p className="text-sm text-[#1A2332]/60">
              A few gentle reminders. You can dismiss this anytime.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#1A2332]/40 hover:text-[#1A2332]/60 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2"
            aria-label="Dismiss welcome message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reassurances.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#8B9D83]/10 flex items-center justify-center flex-shrink-0 text-[#8B9D83]">
                {item.icon}
              </div>
              <div>
                <h4 className="font-medium text-[#1A2332] text-sm mb-0.5">{item.title}</h4>
                <p className="text-xs text-[#1A2332]/60 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 bg-[#F5F1E8]/50 border-t border-[#1A2332]/5">
        <p className="text-xs text-[#1A2332]/50 text-center">
          This message will not appear again once dismissed.
        </p>
      </div>
    </div>
  );
};

export default OnboardingReassurance;
