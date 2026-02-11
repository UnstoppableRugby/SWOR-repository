import React from 'react';
import { Plus } from 'lucide-react';

interface ContributionPromptProps {
  onContribute?: () => void;
  className?: string;
  variant?: 'inline' | 'card';
}

/**
 * Phase 5: Contextual Contribution Prompt
 * 
 * GOVERNANCE RULES:
 * - Appears only when something is missing
 * - Contextual and optional
 * - Uses invitational language only
 * 
 * APPROVED COPY (exact):
 * "If you believe something is missing, you can suggest an addition."
 * 
 * NEVER USE:
 * - "Complete"
 * - "Improve"
 * - "Boost"
 * - "Score"
 */
const ContributionPrompt: React.FC<ContributionPromptProps> = ({
  onContribute,
  className = '',
  variant = 'inline',
}) => {
  if (variant === 'card') {
    return (
      <div className={`bg-[#F5F1E8] rounded-lg p-4 border border-[#1A2332]/10 ${className}`}>
        <p className="text-sm text-[#1A2332]/60 mb-3">
          If you believe something is missing, you can suggest an addition.
        </p>
        {onContribute && (
          <button
            onClick={onContribute}
            className="inline-flex items-center text-sm text-[#B8826D] hover:text-[#B8826D]/80 font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Suggest an addition
          </button>
        )}
      </div>
    );
  }

  // Inline variant - more subtle
  return (
    <div className={`flex items-center text-sm text-[#1A2332]/50 ${className}`}>
      <span className="italic">
        If you believe something is missing, you can{' '}
        {onContribute ? (
          <button
            onClick={onContribute}
            className="text-[#B8826D] hover:text-[#B8826D]/80 underline underline-offset-2 transition-colors"
          >
            suggest an addition
          </button>
        ) : (
          <span className="text-[#B8826D]">suggest an addition</span>
        )}
        .
      </span>
    </div>
  );
};

export default ContributionPrompt;
