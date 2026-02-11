import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { guidanceRecords, GUIDANCE_VERSION, type GuidanceRecord } from '@/data/guidanceRecords';

interface SectionGuidanceProps {
  sectionId: string;
  /** Only show to owners/stewards */
  isVisible?: boolean;
  /** Compact inline variant vs expanded */
  variant?: 'inline' | 'toggle' | 'icon';
}

/**
 * SectionGuidance — Patch 6B
 * 
 * Renders contextual guidance for a specific profile section.
 * Only visible to profile owners and stewards.
 * Collapsible, calm, documentary tone.
 */
const SectionGuidance: React.FC<SectionGuidanceProps> = ({
  sectionId,
  isVisible = true,
  variant = 'toggle'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible) return null;

  const record = guidanceRecords.find(r => r.section === sectionId);
  if (!record) return null;

  if (variant === 'icon') {
    return (
      <div className="relative group inline-flex">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-[#8B9D83]/60 hover:text-[#8B9D83] transition-colors rounded focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/30"
          aria-label={`Guidance: ${record.title}`}
          aria-expanded={isOpen}
        >
          <Info className="w-4 h-4" />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-40 bg-white rounded-lg shadow-lg border border-[#1A2332]/10 p-4 min-w-[280px] max-w-[340px]">
              <p className="text-sm text-[#1A2332]/70 leading-relaxed">{record.body}</p>
              <p className="text-xs text-[#1A2332]/30 mt-2">Guidance {record.version}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-[#8B9D83]/5 rounded-lg p-3 border border-[#8B9D83]/10">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-[#8B9D83]/60 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#1A2332]/60 leading-relaxed">{record.body}</p>
            <p className="text-xs text-[#1A2332]/30 mt-1.5">Guidance {record.version}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default: toggle variant
  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 text-xs text-[#8B9D83]/70 hover:text-[#8B9D83] transition-colors py-1 rounded focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/30"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Hide' : 'Show'} guidance for ${record.title}`}
      >
        <Info className="w-3.5 h-3.5" />
        <span>Guidance</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 bg-[#8B9D83]/5 rounded-lg p-3 border border-[#8B9D83]/10 animate-in fade-in duration-200">
          <p className="text-sm text-[#1A2332]/60 leading-relaxed">{record.body}</p>
          <p className="text-xs text-[#1A2332]/30 mt-2">Guidance {record.version}</p>
        </div>
      )}
    </div>
  );
};

export default SectionGuidance;
