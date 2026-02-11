import React from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export type ContentState = 'draft' | 'submitted_for_review' | 'approved' | 'rejected' | 'needs_changes';

interface ContentStateIndicatorProps {
  state: ContentState;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  variant?: 'badge' | 'inline' | 'detailed';
  showVisibilityHint?: boolean;
  onResubmit?: () => void;
}

const stateConfig: Record<ContentState, {
  label: string;
  description: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  borderColor: string;
  visibilityHint: string;
}> = {
  draft: {
    label: 'Draft',
    description: 'Saved automatically. You can return at any time.',
    icon: FileText,
    bgColor: 'bg-[#1A2332]/5',
    textColor: 'text-[#1A2332]/70',
    borderColor: 'border-[#1A2332]/20',
    visibilityHint: 'Only you and stewards can see this'
  },
  submitted_for_review: {
    label: 'With Your Steward',
    description: 'Your steward will review this in their own time. There is no rush.',
    icon: Clock,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    visibilityHint: 'Awaiting a calm, supportive review'
  },
  approved: {
    label: 'Approved',
    description: 'This content has been reviewed and is visible according to your settings.',
    icon: CheckCircle,
    bgColor: 'bg-[#8B9D83]/10',
    textColor: 'text-[#8B9D83]',
    borderColor: 'border-[#8B9D83]/30',
    visibilityHint: 'Visible according to your privacy settings'
  },
  rejected: {
    label: 'Steward Feedback',
    description: 'Your steward has shared some thoughts. Review when you are ready — there is no urgency.',
    icon: XCircle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    visibilityHint: 'Not visible to others until updated and approved'
  },
  needs_changes: {
    label: 'Steward Feedback',
    description: 'Your steward has shared some thoughts. Review when you are ready — there is no urgency.',
    icon: XCircle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    visibilityHint: 'Not visible to others until updated and approved'
  }
};

const ContentStateIndicator: React.FC<ContentStateIndicatorProps> = ({
  state,
  rejectionReason,
  submittedAt,
  approvedAt,
  rejectedAt,
  approvedBy,
  variant = 'badge',
  showVisibilityHint = false,
  onResubmit
}) => {
  const config = stateConfig[state] || stateConfig.draft;
  const Icon = config.icon;

  // Badge variant - compact
  if (variant === 'badge') {
    return (
      <div 
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.textColor} text-xs font-medium`}
        role="status"
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{config.label}</span>
      </div>
    );
  }

  // Inline variant - single line with icon
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between" role="status">
        <div className={`flex items-center space-x-2 ${config.textColor}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        {showVisibilityHint && (
          <div className="flex items-center space-x-1 text-xs text-[#1A2332]/50">
            {state === 'approved' ? (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{config.visibilityHint}</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant - full explanation
  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`} role="status">
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.textColor}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${config.textColor}`}>{config.label}</h4>
            {state === 'approved' && approvedBy && (
              <span className="text-xs text-[#1A2332]/50">by {approvedBy}</span>
            )}
          </div>
          <p className="text-sm text-[#1A2332]/60 mt-0.5">{config.description}</p>
          
          {/* Visibility hint */}
          {showVisibilityHint && (
            <div className="flex items-center space-x-1.5 mt-2 text-xs text-[#1A2332]/50">
              {state === 'approved' ? (
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{config.visibilityHint}</span>
            </div>
          )}

          {/* Steward feedback */}
          {(state === 'rejected' || state === 'needs_changes') && rejectionReason && (
            <div className="mt-3 p-3 bg-white/50 rounded-lg border border-amber-100">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Thoughts from your steward:</p>
                  <p className="text-sm text-amber-600/80 mt-1">{rejectionReason}</p>
                  <p className="text-xs text-amber-500/70 mt-2">
                    Feedback is part of the process, not a judgement. Take your time with any changes.
                  </p>
                </div>
              </div>
              {onResubmit && (
                <button
                  onClick={onResubmit}
                  className="mt-3 w-full py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors min-h-[44px]"
                >
                  Make Changes and Resubmit When Ready
                </button>
              )}
            </div>
          )}

          {/* Timestamps */}
          {(submittedAt || approvedAt || rejectedAt) && (
            <div className="mt-2 text-xs text-[#1A2332]/40">
              {state === 'submitted_for_review' && submittedAt && (
                <span>Submitted {new Date(submittedAt).toLocaleDateString()}</span>
              )}
              {state === 'approved' && approvedAt && (
                <span>Approved {new Date(approvedAt).toLocaleDateString()}</span>
              )}
              {(state === 'rejected' || state === 'needs_changes') && rejectedAt && (
                <span>Feedback received {new Date(rejectedAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentStateIndicator;
