import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, BookOpen, Heart } from 'lucide-react';
import { stewardGuide, STEWARD_GUIDE_VERSION } from '@/data/guidanceRecords';

interface StewardQuickGuideProps {
  defaultOpen?: boolean;
}

/**
 * StewardQuickGuide — Patch 6B
 * 
 * Private guide visible only to stewards.
 * Collapsible, versioned, calm tone.
 * Covers: role, when to approve, feedback language, reminders.
 */
const StewardQuickGuide: React.FC<StewardQuickGuideProps> = ({ defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#8B9D83]/20 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#F5F1E8]/30 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#8B9D83]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#8B9D83]" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-[#1A2332]">Steward Quick Guide</h3>
            <p className="text-sm text-[#1A2332]/50 mt-0.5">
              Support, not gatekeeping
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-[#1A2332]/30 bg-[#1A2332]/5 px-2 py-1 rounded hidden sm:inline">
            {STEWARD_GUIDE_VERSION}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-[#1A2332]/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#1A2332]/40" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-[#1A2332]/5 p-5 pt-4">
          {/* Introductory note */}
          <div className="bg-[#8B9D83]/5 rounded-lg p-4 mb-5 border border-[#8B9D83]/10">
            <div className="flex items-start space-x-3">
              <Heart className="w-5 h-5 text-[#8B9D83] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                  As a steward, your calm and supportive presence shapes the experience 
                  for every person who shares their journey. This guide is here to help 
                  you feel confident in that role.
                </p>
              </div>
            </div>
          </div>

          {/* Guide sections */}
          <div className="space-y-2">
            {stewardGuide.map((section) => (
              <div key={section.id} className="border border-[#1A2332]/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#F5F1E8]/30 transition-colors text-left"
                  aria-expanded={expandedSections.has(section.id)}
                >
                  <span className="font-medium text-sm text-[#1A2332]">{section.title}</span>
                  {expandedSections.has(section.id) ? (
                    <ChevronUp className="w-4 h-4 text-[#1A2332]/40 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#1A2332]/40 flex-shrink-0" />
                  )}
                </button>
                {expandedSections.has(section.id) && (
                  <div className="px-4 pb-4 border-t border-[#1A2332]/5">
                    <ul className="space-y-2 mt-3">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-sm text-[#1A2332]/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] flex-shrink-0 mt-2" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-[#1A2332]/5">
            <p className="text-xs text-[#1A2332]/40 text-center">
              Steward Quick Guide {STEWARD_GUIDE_VERSION} · This guide is private and visible only to stewards
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StewardQuickGuide;
