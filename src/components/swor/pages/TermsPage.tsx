import React from 'react';
import { ArrowLeft, FileText, Target, Users, Scale, Key, XCircle, Mail } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack, onNavigate }) => {
  const sections = [
    {
      id: 'purpose',
      icon: Target,
      title: 'Purpose of the Platform',
      content: `SWOR (Small World of Rugby) is a for-good digital platform designed to preserve and celebrate rugby journeys. Our purpose is to:

• Create a lasting record of individual and collective rugby experiences
• Connect people through their shared involvement in the game
• Honour contributions to rugby at all levels
• Preserve stories, memories, and context for future generations

SWOR is not a social media platform. It is not designed for attention, engagement metrics, or viral content. It exists to serve the rugby community by holding journeys with care and respect.`
    },
    {
      id: 'contributions',
      icon: Users,
      title: 'Contributions and Moderation',
      content: `When you contribute to SWOR:

• You confirm that you have the right to share the content you upload
• You agree that content may be reviewed by stewards before becoming public
• You understand that stewards may request changes or decline content that does not meet our standards
• You retain ownership of your original content

All contributions start as private drafts. Nothing becomes public until you choose to submit it for review and a steward approves it.

We reserve the right to remove content that:
• Is inaccurate or misleading
• Violates someone's privacy without consent
• Is offensive, discriminatory, or harmful
• Does not align with the purpose of SWOR`
    },
    {
      id: 'rights',
      icon: Scale,
      title: 'Rights and Attribution',
      content: `Your content remains yours:

• You keep ownership of photos, documents, and text you create
• By uploading to SWOR, you grant us permission to display and store your content
• This permission allows us to operate the platform and preserve your journey
• You can export your data at any time
• You can request deletion of your account and content

When you contribute to someone else's journey:
• Your contribution may be credited according to your preference
• The journey owner and stewards can manage how contributions appear
• You can request removal of your contributions

Attribution matters. We encourage proper credit for photos, stories, and other contributions.`
    },
    {
      id: 'access',
      icon: Key,
      title: 'Access and Accounts',
      content: `SWOR uses a magic link system for authentication:

• You sign in using your email address
• We send you a secure link to access your account
• No passwords are required or stored
• Each magic link expires after use

You are responsible for:
• Keeping your email account secure
• Not sharing access links with others
• Using SWOR in accordance with these terms

We may suspend or terminate accounts that violate these terms or our Code of Conduct.`
    },
    {
      id: 'termination',
      icon: XCircle,
      title: 'Termination',
      content: `You can stop using SWOR at any time:

• Export your data using the archive feature
• Contact us to request account deletion
• We will remove your personal information as requested

We may terminate or suspend access if:
• You violate these terms
• You violate our Code of Conduct
• Your actions harm the platform or community
• Required by law

If we terminate your account, we will explain why when possible.`
    },
    {
      id: 'contact',
      icon: Mail,
      title: 'Contact',
      content: `If you have questions about these terms:

• Use the contact form on our website
• We will respond as soon as we can

These terms may be updated from time to time. We will notify users of significant changes.`
    }
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#1A2332]/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1A2332]/70" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332]">Terms of Use</h1>
              <p className="text-[#1A2332]/60 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">Guidelines for using SWOR</p>
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
            Welcome to SWOR. By using our platform, you agree to these terms. We have written them 
            in plain English because we believe terms of use should be understandable. If you have 
            questions, please contact us.
          </p>
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
              onClick={() => onNavigate('conduct')}
              className="text-[#B8826D] hover:underline min-h-[44px] px-2 text-sm sm:text-base"
            >
              Code of Conduct
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

export default TermsPage;
