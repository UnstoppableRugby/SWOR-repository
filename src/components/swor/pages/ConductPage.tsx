import React from 'react';
import { ArrowLeft, Heart, Users, CheckCircle, Shield, Lock, AlertTriangle, Mail } from 'lucide-react';

interface ConductPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const ConductPage: React.FC<ConductPageProps> = ({ onBack, onNavigate }) => {
  const sections = [
    {
      id: 'respect',
      icon: Heart,
      title: 'Respect and Dignity',
      content: `Every person's rugby journey matters. We expect all members of the SWOR community to:

• Treat others with respect, regardless of their level of involvement in rugby
• Celebrate achievements without diminishing others
• Recognise that rugby means different things to different people
• Be kind in how you describe others and their contributions
• Remember that behind every journey is a real person with real feelings

Discrimination, harassment, or bullying of any kind is not acceptable. This includes discrimination based on race, gender, sexuality, religion, disability, or any other characteristic.`
    },
    {
      id: 'accuracy',
      icon: CheckCircle,
      title: 'Accuracy and Attribution',
      content: `SWOR exists to preserve accurate rugby history. We expect:

• Truthful information about matches, achievements, and experiences
• Proper attribution when sharing photos, stories, or other content
• Correction of errors when they are identified
• Respect for the historical record

Do not:
• Exaggerate or fabricate achievements
• Claim credit for others' contributions
• Misrepresent your involvement or role
• Share content without appropriate permission

If you spot an error on SWOR, please let us know so we can correct it.`
    },
    {
      id: 'consent',
      icon: Lock,
      title: 'Consent and Privacy',
      content: `Respect others' privacy:

• Only share information about others with their knowledge or consent
• Be thoughtful about what you share, especially regarding living people
• Respect visibility settings and access controls
• Do not share private content outside of SWOR without permission

When contributing to someone else's journey:
• Ensure they are comfortable with what you are sharing
• Respect their wishes about what should be public
• Remember that families may have different views about what to share

If someone asks you to remove content about them, please do so promptly.`
    },
    {
      id: 'no-politics',
      icon: AlertTriangle,
      title: 'No Political or Activist Content',
      content: `SWOR is for rugby journeys, not political debate:

• Do not use SWOR to promote political causes or campaigns
• Do not use journeys to make political statements
• Keep discussions focused on rugby and the people involved
• Avoid content that could be seen as divisive or inflammatory

Rugby brings people together across many divides. SWOR should reflect that spirit of unity.

This does not mean ignoring history. Rugby's history includes moments of social significance. These can be documented factually and respectfully, without turning SWOR into a platform for activism.`
    },
    {
      id: 'stewards',
      icon: Shield,
      title: 'Steward Standards',
      content: `Stewards are trusted members of the community who help maintain SWOR. Stewards must:

• Act fairly and consistently when reviewing content
• Provide clear, helpful feedback when requesting changes
• Respect the privacy of content they review
• Avoid conflicts of interest
• Follow SWOR guidelines and policies
• Treat all contributors with respect

Stewards should not:
• Approve content that violates these guidelines
• Use their position for personal advantage
• Share private information from reviews
• Show favouritism or bias

If you have concerns about a steward's conduct, please contact us.`
    },
    {
      id: 'reporting',
      icon: Mail,
      title: 'Reporting and Escalation',
      content: `If you see something that concerns you:

• Use the contact form to report issues
• Provide as much detail as you can
• We will review all reports and respond appropriately

What happens when something is reported:
• We will review the content or behaviour
• We may contact the people involved
• We may remove content or restrict access
• Serious violations may result in account suspension

We aim to resolve issues fairly and calmly. Our goal is to maintain a welcoming community, not to punish people.`
    }
  ];

  const appliesTo = [
    { label: 'Contributors', description: 'Anyone who adds content to SWOR' },
    { label: 'Stewards', description: 'Those who review and approve content' },
    { label: 'Partners', description: 'Organisations working with SWOR' }
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E8] overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#1A2332]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] transition-colors mb-3 sm:mb-4 min-h-[44px] -ml-1"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            <span className="text-sm sm:text-base">Back</span>
          </button>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#8B9D83]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#8B9D83]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332]">Code of Conduct</h1>
              <p className="text-[#1A2332]/60 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">How we treat each other on SWOR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Version Info */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#1A2332]/10 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-1 sm:gap-0">
            <span className="text-[#1A2332]/60">Version: v1.0</span>
            <span className="text-[#1A2332]/60">Last updated: February 2026</span>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[#1A2332]/10 mb-6 sm:mb-8">
          <p className="text-[#1A2332]/80 leading-relaxed swor-prose text-sm sm:text-base">
            SWOR is a community built on respect for rugby and the people who play, support, and 
            contribute to the game. This Code of Conduct sets out how we expect everyone to behave. 
            It applies to all interactions on SWOR.
          </p>
        </div>

        {/* Applies To */}
        <div className="bg-[#8B9D83]/10 rounded-xl p-4 sm:p-5 md:p-6 border border-[#8B9D83]/20 mb-6 sm:mb-8">
          <h2 className="font-medium text-[#1A2332] mb-3 sm:mb-4 text-sm sm:text-base">This Code Applies To:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {appliesTo.map((item) => (
              <div key={item.label} className="bg-white rounded-lg p-3 sm:p-4">
                <p className="font-medium text-[#1A2332] text-sm sm:text-base">{item.label}</p>
                <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-0.5 sm:mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4 sm:space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[#1A2332]/10"
            >
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#B8826D]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8826D]" />
                </div>
                <h2 className="font-serif text-lg sm:text-xl text-[#1A2332]">{section.title}</h2>
              </div>
              <div className="text-[#1A2332]/70 leading-relaxed whitespace-pre-line swor-prose text-sm sm:text-base">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 sm:mt-8 bg-[#1A2332] rounded-xl p-4 sm:p-6 md:p-8 text-white">
          <h2 className="font-serif text-lg sm:text-xl mb-3 sm:mb-4">In Summary</h2>
          <p className="text-white/80 leading-relaxed text-sm sm:text-base">
            Be kind. Be honest. Be respectful. Remember that SWOR exists to celebrate rugby and 
            the people who make it special. If everyone follows these principles, SWOR will be 
            a place where every rugby journey is valued and preserved with care.
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-[#1A2332]/10">
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center items-center">
            <button
              onClick={() => onNavigate('privacy')}
              className="text-[#B8826D] hover:underline min-h-[44px] px-2 text-sm sm:text-base"
            >
              Privacy Policy
            </button>
            <span className="text-[#1A2332]/30 hidden sm:inline">|</span>
            <button
              onClick={() => onNavigate('terms')}
              className="text-[#B8826D] hover:underline min-h-[44px] px-2 text-sm sm:text-base"
            >
              Terms of Use
            </button>
            <span className="text-[#1A2332]/30 hidden sm:inline">|</span>
            <button
              onClick={() => onNavigate('contact')}
              className="text-[#B8826D] hover:underline min-h-[44px] px-2 text-sm sm:text-base"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConductPage;
