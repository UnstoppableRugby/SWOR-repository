import React, { useState } from 'react';
import { ArrowLeft, BookOpen, CheckSquare, Users, Download, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface HelpGuidesPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

// Guide content with versioning
const guides = {
  'build-journey': {
    title: 'How to Build Your Journey',
    version: '1.2',
    lastUpdated: '2026-02-01',
    icon: BookOpen,
    sections: [
      {
        title: 'Getting Started',
        content: `Your Rugby Journey is a place to preserve and share your story with the rugby community. This guide will help you build a meaningful, lasting record.

Before you begin, remember: there is no rush. Take your time. Your journey has unfolded over years or decades. Building your record can happen at your own pace.`
      },
      {
        title: 'What to Include',
        content: `Your journey can include:

- Basic information (name, country, era of involvement)
- Roles you have held (player, coach, volunteer, supporter, etc.)
- Clubs and organisations you have been part of
- Key moments and memories
- Photos, documents, and other materials
- Acknowledgements of people who shaped your journey

You do not need to include everything at once. Start with what feels comfortable.`
      },
      {
        title: 'Privacy and Visibility',
        content: `You control who sees your journey:

- Draft: Only you can see it
- Submitted: Visible to stewards for review
- Approved: Visible to the public

You can change visibility settings at any time. Nothing is published without your consent.`
      },
      {
        title: 'Working with Stewards',
        content: `Stewards are trusted members of the community who help maintain the quality and accuracy of journeys on SWOR.

When you submit your journey for review, a steward will:
- Check for accuracy and completeness
- Ensure content meets community guidelines
- Provide feedback if changes are needed
- Approve your journey for public viewing

This process typically takes a few days. You will be notified of any updates.`
      },
      {
        title: 'Tips for a Meaningful Journey',
        content: `- Be authentic: Share your real experiences
- Include context: Dates, places, and people help others understand your story
- Acknowledge others: Rugby is a team sport. Mention those who helped you along the way
- Add materials gradually: Photos and documents bring your journey to life
- Review periodically: Your journey can grow over time`
      }
    ]
  },
  'checklist': {
    title: 'Journey Checklist',
    version: '1.1',
    lastUpdated: '2026-01-15',
    icon: CheckSquare,
    sections: [
      {
        title: 'Before You Start',
        content: `- Gather basic information about your rugby involvement
- Collect any photos or documents you might want to include
- Think about the key moments in your journey
- Consider who you would like to acknowledge`
      },
      {
        title: 'Essential Information',
        content: `- Full name (as you would like it displayed)
- Country or countries of involvement
- Era or years active
- Primary roles (player, coach, administrator, etc.)
- Main club or organisation affiliations`
      },
      {
        title: 'Recommended Additions',
        content: `- A brief summary of your journey (2-3 sentences)
- Key achievements or contributions
- At least one photo
- Acknowledgements of mentors, teammates, or supporters`
      },
      {
        title: 'Before Submitting',
        content: `- Review all information for accuracy
- Check that photos are appropriate and clear
- Ensure you have permission to share any materials involving others
- Read through your acknowledgements
- Preview how your journey will appear to others`
      },
      {
        title: 'After Approval',
        content: `- Share your journey with friends and family
- Invite others to contribute memories or commendations
- Continue adding materials over time
- Keep your information up to date`
      }
    ]
  },
  'contributions': {
    title: 'How Contributions Work',
    version: '1.0',
    lastUpdated: '2026-01-10',
    icon: Users,
    sections: [
      {
        title: 'What Are Contributions?',
        content: `Contributions are ways that others can add to your journey or the journeys of others. This includes:

- Commendations: Personal testimonials about someone's character or impact
- Archive materials: Photos, documents, or other materials
- Memories: Specific recollections of shared experiences
- Corrections: Factual updates or additions`
      },
      {
        title: 'Contributing to Someone Else\'s Journey',
        content: `If you knew someone and want to contribute to their journey:

1. Visit their journey page
2. Look for the "Contribute" or "Write a commendation" button
3. Share your memory or upload materials
4. Your contribution will be reviewed before appearing

All contributions are reviewed by stewards to ensure quality and appropriateness.`
      },
      {
        title: 'Receiving Contributions',
        content: `When someone contributes to your journey:

1. You will be notified (if you have notifications enabled)
2. You can review the contribution
3. You can respond to commendations
4. You can request removal if something is inaccurate

You remain in control of your journey. Contributions enhance but do not replace your own story.`
      },
      {
        title: 'Contribution Guidelines',
        content: `All contributions should:

- Be truthful and accurate
- Be respectful and constructive
- Add genuine value to the journey
- Not include private information without consent
- Not be promotional or commercial

Contributions that do not meet these guidelines may be removed.`
      }
    ]
  }
};

const HelpGuidesPage: React.FC<HelpGuidesPageProps> = ({ onBack, onNavigate }) => {
  const { isAuthenticated } = useAppContext();
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // These guides are private - only for logged-in users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-[#1A2332]/30 mx-auto mb-4" />
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">Help Guides</h1>
          <p className="text-sm sm:text-base text-[#1A2332]/70 mb-6 max-w-md mx-auto leading-relaxed">
            These guides are available to logged-in users who are building their journey.
          </p>
          <button
            onClick={() => onNavigate('join')}
            className="swor-btn-primary min-h-[44px] sm:min-h-[48px] px-6 sm:px-8"
          >
            Sign In to Access
          </button>
        </div>
      </div>
    );
  }

  const toggleSection = (guideId: string, sectionIndex: number) => {
    const key = `${guideId}-${sectionIndex}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSectionExpanded = (guideId: string, sectionIndex: number) => {
    const key = `${guideId}-${sectionIndex}`;
    return expandedSections[key] !== false; // Default to expanded
  };

  const handleDownloadPDF = (guideId: string) => {
    // In a real implementation, this would generate/download a PDF
    alert(`PDF download for "${guides[guideId as keyof typeof guides].title}" would be generated here.`);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-20 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-white py-6 sm:py-10 md:py-12 border-b border-[#1A2332]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] mb-4 sm:mb-6 min-h-[44px] active:text-[#1A2332] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm sm:text-base">Back</span>
          </button>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-2">Help Guides</h1>
          <p className="text-sm sm:text-base text-[#1A2332]/70 leading-relaxed">
            Everything you need to know about building and managing your rugby journey.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12">
        {/* Guide Selection */}
        {!activeGuide ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(guides).map(([id, guide]) => {
              const Icon = guide.icon;
              return (
                <button
                  key={id}
                  onClick={() => setActiveGuide(id)}
                  className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-all text-left group min-h-[120px] sm:min-h-[140px] active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-[#B8826D]/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[#B8826D]/20 transition-colors">
                    <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-[#B8826D]" />
                  </div>
                  <h3 className="font-medium text-[#1A2332] mb-1 text-sm sm:text-base">{guide.title}</h3>
                  <p className="text-xs text-[#1A2332]/50">
                    Version {guide.version} · Updated {guide.lastUpdated}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          /* Active Guide View */
          <div>
            {/* Guide Header */}
            <div className="swor-guide-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <button
                  onClick={() => setActiveGuide(null)}
                  className="text-[#B8826D] text-sm font-medium mb-2 hover:text-[#B8826D]/80 flex items-center min-h-[44px] active:text-[#B8826D]/60 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  All Guides
                </button>
                <h2 className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A2332]">
                  {guides[activeGuide as keyof typeof guides].title}
                </h2>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-0 sm:text-right">
                <p className="swor-guide-version text-xs sm:text-sm bg-[#8B9D83]/10 px-2 py-1 rounded">
                  v{guides[activeGuide as keyof typeof guides].version}
                </p>
                <p className="text-xs text-[#1A2332]/40 sm:mt-1">
                  {guides[activeGuide as keyof typeof guides].lastUpdated}
                </p>
                <button
                  onClick={() => handleDownloadPDF(activeGuide)}
                  className="sm:mt-2 inline-flex items-center text-xs text-[#B8826D] hover:text-[#B8826D]/80 min-h-[44px] active:text-[#B8826D]/60 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 sm:w-3 sm:h-3 mr-1" />
                  Download PDF
                </button>
              </div>
            </div>

            {/* Guide Sections */}
            <div className="space-y-3 sm:space-y-4">
              {guides[activeGuide as keyof typeof guides].sections.map((section, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(activeGuide, index)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left min-h-[56px] sm:min-h-[60px] active:bg-[#F5F1E8]/50 transition-colors"
                  >
                    <h3 className="font-medium text-[#1A2332] text-sm sm:text-base pr-3">{section.title}</h3>
                    {isSectionExpanded(activeGuide, index) ? (
                      <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" />
                    )}
                  </button>
                  {isSectionExpanded(activeGuide, index) && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                      <div className="swor-guide-content whitespace-pre-line text-sm sm:text-base text-[#1A2332]/70 leading-relaxed">
                        {section.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Back to All Guides */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setActiveGuide(null)}
                className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 min-h-[44px] text-sm sm:text-base active:text-[#B8826D]/60 transition-colors"
              >
                View All Guides
              </button>
            </div>
          </div>
        )}

        {/* Help Note */}
        <div className="mt-10 sm:mt-12 p-4 sm:p-5 md:p-6 bg-[#8B9D83]/10 rounded-xl">
          <h3 className="font-medium text-[#1A2332] mb-2 text-sm sm:text-base">Need more help?</h3>
          <p className="text-xs sm:text-sm text-[#1A2332]/70 mb-4 leading-relaxed">
            If you have questions not covered in these guides, you can reach out to a steward or contact support.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="text-sm text-[#B8826D] font-medium hover:text-[#B8826D]/80 min-h-[44px] flex items-center active:text-[#B8826D]/60 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpGuidesPage;
