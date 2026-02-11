import React from 'react';
import { ArrowLeft, Shield, Eye, Database, Users, Download, Mail } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack, onNavigate }) => {
  const sections = [
    {
      id: 'what-we-collect',
      icon: Database,
      title: 'What We Collect',
      content: `When you use SWOR, we collect information that you provide directly:

• Account information: Your email address when you sign in using our magic link system
• Profile information: Name, biographical details, rugby history, and other information you choose to add to your journey
• Contributions: Photos, documents, text, and other materials you upload or submit
• Communications: Messages you send through our contact form

We also collect some information automatically:
• Basic usage data to help us improve the platform
• Technical information needed to deliver the service securely`
    },
    {
      id: 'how-used',
      icon: Eye,
      title: 'How Information Is Used',
      content: `We use your information to:

• Operate and maintain SWOR
• Display your rugby journey as you have configured it
• Enable stewards to review and approve content
• Respond to your questions and support requests
• Improve the platform based on how it is used
• Send important updates about your account or the service

We do not sell your personal information. We do not use your data for advertising. SWOR exists to preserve rugby journeys, not to monetise personal data.`
    },
    {
      id: 'visibility',
      icon: Users,
      title: 'Visibility and Permissions',
      content: `You control who can see your content:

• Private Draft: Only you can see this content
• Family or Trusted Circle: Visible to people you have specifically invited
• Connections: Visible to your approved connections
• Public: Visible to anyone visiting SWOR

All content starts as a private draft. Nothing becomes public until you choose to make it so and a steward has approved it. You can change visibility settings at any time.

Stewards can view content submitted for review as part of the approval process.`
    },
    {
      id: 'steward-review',
      icon: Shield,
      title: 'Steward Review',
      content: `SWOR uses a steward review system to maintain quality and accuracy:

• Stewards are trusted members of the rugby community
• They review content submitted for public visibility
• They can approve, request changes, or decline submissions
• Steward actions are logged for accountability
• Stewards cannot edit your content directly without your involvement

This review process helps ensure that public rugby journeys are accurate, respectful, and appropriate.`
    },
    {
      id: 'data-exports',
      icon: Download,
      title: 'Data Exports',
      content: `You can export your data at any time:

• Use the archive export feature to download a copy of your journey
• Exports include your profile information, uploaded files, and approved content
• Export links are time-limited for security
• You can generate new exports whenever you need them

If you wish to delete your account entirely, please contact us and we will assist you.`
    },
    {
      id: 'contact',
      icon: Mail,
      title: 'Contact',
      content: `If you have questions about this privacy policy or how we handle your data, please contact us:

• Use the contact form on our website
• We will respond as soon as we can

We take privacy seriously and are happy to explain our practices in more detail.`
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
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1A2332]/70" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332]">Privacy Policy</h1>
              <p className="text-[#1A2332]/60 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">How we handle your information</p>
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
            SWOR (Small World of Rugby) is committed to protecting your privacy. This policy explains 
            what information we collect, how we use it, and the choices you have. We have written this 
            in plain English because we believe you should be able to understand how your data is handled.
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#8B9D83]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83]" />
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
              onClick={() => onNavigate('terms')}
              className="text-[#B8826D] hover:underline min-h-[44px] px-2 text-sm sm:text-base"
            >
              Terms of Use
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

export default PrivacyPage;
