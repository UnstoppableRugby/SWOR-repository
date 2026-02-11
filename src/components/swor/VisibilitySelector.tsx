import React, { useState } from 'react';
import { Globe, Users, Heart, Lock, ChevronDown, Check, HelpCircle, Shield } from 'lucide-react';

export type VisibilityLevel = 'public' | 'connections' | 'family' | 'draft';

interface VisibilitySelectorProps {
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  compact?: boolean;
  disabled?: boolean;
  showExplanations?: boolean;
}

const visibilityOptions: { 
  value: VisibilityLevel; 
  label: string; 
  description: string; 
  whoCanSee: string;
  explanation: string;
  icon: React.ReactNode 
}[] = [
  {
    value: 'draft',
    label: 'Private Draft',
    description: 'Only you and stewards can see this',
    whoCanSee: 'You and your assigned stewards',
    explanation: 'This is the safest option. Your content stays completely private while you work on it. Stewards can see it to help you, but no one else can.',
    icon: <Lock className="w-4 h-4" />
  },
  {
    value: 'family',
    label: 'Family / Trusted Circle',
    description: 'Only your closest trusted people',
    whoCanSee: 'People you have marked as family or trusted',
    explanation: 'Share with your inner circle only. This might include family members, close friends, or people you have specifically trusted with access.',
    icon: <Heart className="w-4 h-4" />
  },
  {
    value: 'connections',
    label: 'Connections Only',
    description: 'People you have connected with',
    whoCanSee: 'Anyone you have accepted as a connection',
    explanation: 'Visible to people in your network. These are people you have connected with on SWOR, typically rugby contacts, teammates, or colleagues.',
    icon: <Users className="w-4 h-4" />
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can see this',
    whoCanSee: 'Anyone visiting SWOR, including search engines',
    explanation: 'Fully public. Anyone can see this content, and it may appear in search results. Choose this for content you want to share widely.',
    icon: <Globe className="w-4 h-4" />
  }
];

const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({ 
  value, 
  onChange, 
  compact = false,
  disabled = false,
  showExplanations = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const selectedOption = visibilityOptions.find(opt => opt.value === value) || visibilityOptions[0];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label={`Visibility: ${selectedOption.label}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
            disabled 
              ? 'bg-[#1A2332]/5 text-[#1A2332]/40 cursor-not-allowed' 
              : 'bg-[#1A2332]/5 text-[#1A2332]/70 hover:bg-[#1A2332]/10'
          }`}
        >
          {selectedOption.icon}
          <span>{selectedOption.label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-[#1A2332]/10 py-1 min-w-[280px]" role="listbox">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={value === option.value}
                  className={`w-full flex items-start space-x-3 px-3 py-2.5 text-left hover:bg-[#1A2332]/5 transition-colors min-h-[44px] ${
                    value === option.value ? 'bg-[#B8826D]/10' : ''
                  }`}
                >
                  <span className={`mt-0.5 ${value === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]/60'}`}>
                    {option.icon}
                  </span>
                  <div className="flex-1">
                    <span className={`block text-sm ${value === option.value ? 'text-[#B8826D] font-medium' : 'text-[#1A2332]'}`}>
                      {option.label}
                    </span>
                    <span className="block text-xs text-[#1A2332]/50 mt-0.5">
                      {option.whoCanSee}
                    </span>
                  </div>
                  {value === option.value && (
                    <Check className="w-4 h-4 text-[#B8826D] mt-0.5" aria-hidden="true" />
                  )}
                </button>
              ))}
              {/* Reassurance note in dropdown */}
              <div className="px-3 py-2 border-t border-[#1A2332]/5">
                <p className="text-xs text-[#1A2332]/40">
                  Nothing becomes public without your approval.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with help toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[#1A2332]/80">
          Visibility
        </label>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center space-x-1 text-xs text-[#1A2332]/50 hover:text-[#1A2332]/70 transition-colors min-h-[44px]"
          aria-expanded={showHelp}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHelp ? 'Hide help' : 'What does this mean?'}</span>
        </button>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="bg-[#8B9D83]/10 rounded-lg p-4 border border-[#8B9D83]/20">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-[#8B9D83] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-2 text-sm text-[#1A2332]/70">
              <p className="font-medium text-[#1A2332]">Understanding Visibility</p>
              <p>
                Visibility controls who can see your content. You can change this setting 
                at any time. Your privacy is always respected.
              </p>
              <p className="text-xs text-[#1A2332]/50">
                Everything starts as a private draft. Nothing becomes visible to others until 
                it has been reviewed and approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Intro text */}
      <p className="text-xs text-[#1A2332]/50">
        Choose who can see this content. You can change this at any time.
      </p>

      {/* Options */}
      <div className="space-y-2" role="radiogroup" aria-label="Visibility level">
        {visibilityOptions.map((option) => (
          <label
            key={option.value}
            className={`block p-4 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
              value === option.value
                ? 'border-[#B8826D] bg-[#B8826D]/5 ring-1 ring-[#B8826D]/20'
                : 'border-[#1A2332]/10 hover:border-[#1A2332]/20 hover:bg-[#F5F1E8]/30'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only"
              aria-label={`${option.label}: ${option.whoCanSee}`}
            />
            <div className="flex items-start space-x-3">
              <span className={`mt-0.5 ${value === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]/60'}`}>
                {option.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    value === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]'
                  }`}>
                    {option.label}
                  </span>
                  {value === option.value && (
                    <Check className="w-4 h-4 text-[#B8826D]" aria-hidden="true" />
                  )}
                </div>
                
                {/* Who can see */}
                <p className="text-xs text-[#1A2332]/60 mt-1">
                  <span className="font-medium">Who can see:</span> {option.whoCanSee}
                </p>
                
                {/* Detailed explanation - only for selected option */}
                {showExplanations && value === option.value && (
                  <p className="text-xs text-[#1A2332]/50 mt-2 leading-relaxed bg-white/50 p-2 rounded">
                    {option.explanation}
                  </p>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Reassurance note */}
      <div className="flex items-start space-x-2 pt-2">
        <Lock className="w-3.5 h-3.5 text-[#8B9D83] flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-[#1A2332]/50 leading-relaxed">
          Your privacy is always respected. Nothing becomes public without your approval.
          You can change visibility settings at any time.
        </p>
      </div>
    </div>
  );
};

export default VisibilitySelector;
