import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Shield, Archive, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'swor_reset_guidance_expanded';

const StewardResetGuidance: React.FC = () => {
  const [expanded, setExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(expanded));
    } catch {
      // localStorage unavailable
    }
  }, [expanded]);

  return (
    <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F5F1E8]/50 transition-colors min-h-[48px] text-left"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-[#8B9D83]" />
          <span className="text-sm font-medium text-[#1A2332]">When to reset (and when not to)</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#1A2332]/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#1A2332]/10">
          <p className="text-sm text-[#1A2332]/70 mt-4 mb-5">
            Resets are for testing and clean onboarding. They should not be used on profiles already shared publicly or signed off.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Soft Reset guidance */}
            <div className="bg-[#8B9D83]/5 border border-[#8B9D83]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Archive className="w-4 h-4 text-[#8B9D83]" />
                <h4 className="text-sm font-medium text-[#1A2332]">Soft Reset</h4>
                <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-[#8B9D83]/20 text-[#8B9D83] font-medium">RECOMMENDED</span>
              </div>
              <p className="text-xs text-[#1A2332]/50 mb-2">Use when:</p>
              <ul className="space-y-1.5">
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8B9D83] mt-1.5 flex-shrink-0" />
                  Testing onboarding and you need a clean slate
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8B9D83] mt-1.5 flex-shrink-0" />
                  Old draft uploads are confusing the flow
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8B9D83] mt-1.5 flex-shrink-0" />
                  Nothing has been approved or shared externally
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8B9D83] mt-1.5 flex-shrink-0" />
                  You want to rebuild calmly but keep recoverability
                </li>
              </ul>
            </div>

            {/* Do not reset guidance */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-medium text-[#1A2332]">Do not reset when</h4>
              </div>
              <ul className="space-y-1.5">
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  The profile is already public and shared externally
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  Family or third parties have contributed
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  The profile has been used in partner conversations
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  You are unsure whether it has been signed off
                </li>
              </ul>
            </div>

            {/* Hard Reset guidance */}
            <div className="bg-red-50/50 border border-red-200/60 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-medium text-[#1A2332]">Hard Reset</h4>
                <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-red-100 text-red-600 font-medium">ADVANCED</span>
              </div>
              <p className="text-xs text-[#1A2332]/50 mb-2">Only when:</p>
              <ul className="space-y-1.5">
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  You are certain the profile is internal/testing only
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  You have confirmed nothing needs to be preserved
                </li>
                <li className="text-xs text-[#1A2332]/60 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  You understand records are removed and storage may be queued for cleanup
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 px-4 py-2.5 bg-[#F5F1E8] rounded-lg">
            <p className="text-xs text-[#1A2332]/60 font-medium">
              Rule of thumb: If in doubt, use Soft Reset.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StewardResetGuidance;
