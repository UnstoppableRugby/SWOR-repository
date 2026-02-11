import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, FileText, CheckSquare, Sparkles, Shield, Scale, Globe, Download, HelpCircle, Eye } from 'lucide-react';
import { GUIDANCE_VERSION, GUIDANCE_LAST_UPDATED, guidanceRecords, reassuranceCopy } from '@/data/guidanceRecords';

interface GuidanceSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const GuidanceSection: React.FC<GuidanceSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#1A2332]/10 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#F5F1E8]/50 transition-colors text-left min-h-[44px]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <span className="text-[#8B9D83]">{icon}</span>
          <span className="font-medium text-[#1A2332]">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#1A2332]/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-[#1A2332]/5">
          {children}
        </div>
      )}
    </div>
  );
};

interface ProfileGuidanceProps {
  variant?: 'drawer' | 'panel' | 'inline';
  showVersion?: boolean;
}

const ProfileGuidance: React.FC<ProfileGuidanceProps> = ({ 
  variant = 'inline',
  showVersion = true 
}) => {

  const containerClass = variant === 'drawer' 
    ? 'fixed right-0 top-0 h-full w-96 bg-[#F5F1E8] shadow-xl z-50 overflow-y-auto'
    : variant === 'panel'
    ? 'bg-[#F5F1E8] rounded-xl p-4 sm:p-6 border border-[#1A2332]/10'
    : '';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#8B9D83]" />
            <h3 className="font-serif text-lg text-[#1A2332]">Guidance & Reference</h3>
          </div>
          {showVersion && (
            <span className="text-xs text-[#1A2332]/40 bg-[#1A2332]/5 px-2 py-1 rounded">
              {GUIDANCE_VERSION}
            </span>
          )}
        </div>
        <p className="text-sm text-[#1A2332]/60 leading-relaxed">
          These guidelines are here if you find them helpful. They are entirely optional — you can proceed without reading them.
        </p>
        {showVersion && (
          <p className="text-xs text-[#1A2332]/40 mt-2">Last updated: {GUIDANCE_LAST_UPDATED}</p>
        )}
      </div>

      {/* Reassurance summary */}
      <div className="bg-[#8B9D83]/5 rounded-lg p-4 mb-4 border border-[#8B9D83]/10">
        <p className="text-sm text-[#1A2332]/60 leading-relaxed">
          {reassuranceCopy.general.noObligation} {reassuranceCopy.general.livingProfile}
        </p>
      </div>

      <div className="space-y-3">
        {/* 1. Section-by-Section Guidance */}
        <GuidanceSection
          title="Section-by-Section Guidance"
          icon={<FileText className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-4 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              Each profile section has its own guidance. Here is a summary of what each section is for.
            </p>
            <div className="space-y-3">
              {guidanceRecords.map((record) => (
                <div key={record.id} className="bg-[#F5F1E8] rounded-lg p-3">
                  <h5 className="font-medium text-[#1A2332] text-xs mb-1 capitalize">
                    {record.section.replace(/_/g, ' ')}
                  </h5>
                  <p className="text-xs text-[#1A2332]/60 leading-relaxed">
                    {record.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </GuidanceSection>

        {/* 2. Profile Field Coverage */}
        <GuidanceSection
          title="Profile Field Coverage"
          icon={<FileText className="w-4 h-4" />}
          defaultOpen={false}
        >
          <div className="space-y-4 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              An Individual Profile can include any of the following. None are required — start wherever feels right.
            </p>
            
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-[#1A2332] mb-1">Core Identity</h5>
                <ul className="list-disc list-inside space-y-1 text-[#1A2332]/60">
                  <li>Full name (as you wish to be known)</li>
                  <li>Date of birth (optional, can be approximate)</li>
                  <li>Place of origin or home region</li>
                  <li>Country or countries of connection</li>
                </ul>
              </div>

              <div>
                <h5 className="font-medium text-[#1A2332] mb-1">Rugby Journey</h5>
                <ul className="list-disc list-inside space-y-1 text-[#1A2332]/60">
                  <li>How you came to rugby</li>
                  <li>Clubs, schools, or organisations</li>
                  <li>Roles played (player, coach, volunteer, etc.)</li>
                  <li>Eras or periods of involvement</li>
                  <li>Memorable moments or turning points</li>
                </ul>
              </div>

              <div>
                <h5 className="font-medium text-[#1A2332] mb-1">Reflections</h5>
                <ul className="list-disc list-inside space-y-1 text-[#1A2332]/60">
                  <li>What rugby meant or means to you</li>
                  <li>People who influenced your journey</li>
                  <li>Lessons learned or values shaped</li>
                </ul>
              </div>

              <div>
                <h5 className="font-medium text-[#1A2332] mb-1">Connections</h5>
                <ul className="list-disc list-inside space-y-1 text-[#1A2332]/60">
                  <li>Teammates, coaches, mentors</li>
                  <li>Family members in rugby</li>
                  <li>Communities and clubs</li>
                </ul>
              </div>
            </div>
          </div>
        </GuidanceSection>

        {/* 3. Builder Checklist */}
        <GuidanceSection
          title="Builder Checklist"
          icon={<CheckSquare className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              A gentle reminder of what you might include. None of these are required.
            </p>
            <div className="space-y-2">
              {[
                'A name or title for your journey',
                'A brief introduction or opening line',
                'At least one club, school, or organisation',
                'One or more roles (player, coach, etc.)',
                'A photo or image (optional)',
                'Acknowledgement of someone who helped'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-4 h-4 border border-[#1A2332]/20 rounded mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#1A2332]/50 italic mt-3">
              You can add more over time. There is no deadline.
            </p>
          </div>
        </GuidanceSection>

        {/* 4. AI Draft & Authenticity Rules */}
        <GuidanceSection
          title="AI Assistance Guidelines"
          icon={<Sparkles className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              AI can help organise and suggest content, but authenticity is paramount.
            </p>
            <div className="bg-[#8B9D83]/10 rounded-lg p-3 space-y-2">
              <h5 className="font-medium text-[#1A2332] text-xs uppercase tracking-wide">AI Content Rules</h5>
              <ul className="space-y-1.5 text-xs">
                {[
                  'AI-generated content is always marked as draft',
                  'AI prefers incomplete over invented',
                  'Real names, dates, and events are used where available',
                  'All AI content is clearly labelled',
                  'You can edit everything before review',
                  'Human review is always required before publishing'
                ].map((rule, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-[#8B9D83] mt-0.5">{idx + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-[#1A2332]/50 italic">
              No generic or mass-produced summaries are used. Each profile is individual.
            </p>
          </div>
        </GuidanceSection>

        {/* 5. Review & Approval Process */}
        <GuidanceSection
          title="Review & Approval Process"
          icon={<Shield className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              Everything you add goes through a simple review process before becoming public.
            </p>
            <div className="space-y-3">
              {[
                { step: '1', title: 'You add content', desc: 'Text, images, documents, or links' },
                { step: '2', title: 'Content saved as draft', desc: 'Only you and stewards can see it' },
                { step: '3', title: 'Steward reviews', desc: 'A calm, supportive review when you are ready' },
                { step: '4', title: 'Published (if approved)', desc: 'Visible according to your chosen visibility' }
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full ${item.step === '4' ? 'bg-[#8B9D83]/20' : 'bg-[#B8826D]/10'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className={`text-xs font-medium ${item.step === '4' ? 'text-[#8B9D83]' : 'text-[#B8826D]'}`}>{item.step}</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#1A2332]">{item.title}</p>
                    <p className="text-xs text-[#1A2332]/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#1A2332]/50 italic mt-2">
              You can request changes or withdraw content at any time.
            </p>
          </div>
        </GuidanceSection>

        {/* 6. Rights & Attribution */}
        <GuidanceSection
          title="Rights & Attribution"
          icon={<Scale className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              Your content, your rights. Here is how attribution works.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Your Content', desc: 'You retain rights to content you create. By sharing it here, you grant permission for it to be displayed according to your visibility settings.' },
                { title: 'Third-Party Content', desc: 'If you upload content created by others, please ensure you have permission or it is in the public domain.' },
                { title: 'Attribution', desc: 'You can choose how to be credited: by name, organisation, anonymously, or no credit needed.' }
              ].map((item) => (
                <div key={item.title} className="bg-[#F5F1E8] rounded-lg p-3">
                  <h5 className="font-medium text-[#1A2332] text-xs mb-1">{item.title}</h5>
                  <p className="text-xs text-[#1A2332]/60">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#1A2332]/50 italic">
              If you are unsure about rights, your steward can help.
            </p>
          </div>
        </GuidanceSection>

        {/* 7. Country & Flag Guidelines */}
        <GuidanceSection
          title="Country & Flag Guidelines"
          icon={<Globe className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              Flags and country references are handled with care and respect.
            </p>
            <div className="space-y-2 text-xs">
              {[
                'Flags represent rugby unions, not political entities',
                'Multiple country connections are welcomed',
                'Historical country names are preserved where appropriate',
                'You choose which country or countries to associate with'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-[#8B9D83]">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#B8826D]/10 rounded-lg p-3 mt-3">
              <p className="text-xs text-[#1A2332]/70">
                <span className="font-medium">Note:</span> If you have concerns about country representation, please speak with your steward.
              </p>
            </div>
          </div>
        </GuidanceSection>

        {/* 8. Accessibility Commitment */}
        <GuidanceSection
          title="Accessibility Commitment"
          icon={<Eye className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-[#1A2332]/70">
            <p className="leading-relaxed">
              We are committed to making SWOR accessible to everyone.
            </p>
            <div className="space-y-2 text-xs">
              {[
                'Light backgrounds for long-form text',
                'Readable font sizes, especially on mobile',
                'Adequate spacing between sections',
                'Calm contrast that meets accessibility standards',
                'No unnecessary urgency or pressure'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-[#8B9D83]">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#1A2332]/50 italic mt-2">
              If you experience any accessibility issues, please let us know.
            </p>
          </div>
        </GuidanceSection>
      </div>

      {/* Download Option */}
      <div className="mt-6 pt-4 border-t border-[#1A2332]/10">
        <button className="flex items-center space-x-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] transition-colors min-h-[44px]">
          <Download className="w-4 h-4" />
          <span>Download as PDF (optional)</span>
        </button>
        <p className="text-xs text-[#1A2332]/40 mt-2">
          You do not need to read or download this to proceed.
        </p>
      </div>
    </div>
  );
};

export default ProfileGuidance;
