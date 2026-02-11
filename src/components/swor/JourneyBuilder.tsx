import React, { useState } from 'react';
import { Upload, ChevronDown, ChevronUp, Clock, Users, Image, FileText, Heart, Leaf, UserPlus, Info, ExternalLink } from 'lucide-react';

interface JourneyBuilderProps {
  journeyId: string;
  journeyName: string;
  onNavigate: (page: string) => void;
}

const JourneyBuilder: React.FC<JourneyBuilderProps> = ({ journeyId, journeyName, onNavigate }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const builderSections = [
    {
      id: 'moments',
      title: 'Moments and Memory',
      icon: Clock,
      description: 'Key moments, matches, achievements, and memories from your journey.',
    },
    {
      id: 'people',
      title: 'People and Acknowledgements',
      icon: Users,
      description: 'Teammates, coaches, mentors, family, and others who shaped your journey.',
    },
    {
      id: 'clubs',
      title: 'Clubs, Organisations and Events',
      icon: FileText,
      description: 'Clubs you played for, organisations you worked with, events you attended.',
    },
    {
      id: 'media',
      title: 'Media and Public Record',
      icon: FileText,
      description: 'Articles, interviews, broadcasts, and other media coverage.',
    },
    {
      id: 'images',
      title: 'Images and Visual Material',
      icon: Image,
      description: 'Photographs, programmes, tickets, and other visual memories.',
    },
    {
      id: 'perspectives',
      title: 'Shared Perspectives',
      icon: Heart,
      description: 'Contributions from others who shared part of your journey.',
    },
    {
      id: 'legacy',
      title: 'Legacy and Continuity',
      icon: Leaf,
      description: 'How your journey connects to the future of the game.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-2">
            Stage 3: Full Interactive Journey
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1A2332] mb-2">
            Building: {journeyName}
          </h1>
          <p className="text-sm sm:text-base text-[#1A2332]/70">
            Add depth to your journey at your own pace. All sections are optional.
          </p>
        </div>

        {/* Persistent Reassurance */}
        <div className="bg-[#8B9D83]/10 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 flex items-start">
          <Info className="w-5 h-5 text-[#8B9D83] mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm sm:text-base text-[#1A2332]/70">
              You do not need to organise anything perfectly. If we can read it and associate it, 
              we can help place it correctly.
            </p>
            {lastSaved && (
              <p className="text-xs text-[#1A2332]/50 mt-2">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Upload Panel */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="flex items-center mb-3 sm:mb-4">
            <Upload className="w-5 h-5 text-[#B8826D] mr-3" />
            <h2 className="font-serif text-lg sm:text-xl text-[#1A2332]">Upload What You Already Have</h2>
          </div>
          <p className="text-[#1A2332]/70 text-sm mb-4">
            Word documents, PDFs, images, scans. Dates and names are helpful but not required. 
            We will help organise it.
          </p>
          
          <div className="border-2 border-dashed border-[#1A2332]/20 rounded-lg p-6 sm:p-8 text-center hover:border-[#B8826D]/50 transition-colors cursor-pointer active:bg-[#F5F1E8]/50">
            <Upload className="w-8 sm:w-10 h-8 sm:h-10 text-[#1A2332]/30 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-[#1A2332]/60 mb-2">Drag and drop files here, or tap to browse</p>
            <p className="text-xs sm:text-sm text-[#1A2332]/40">Word, PDF, JPG, PNG, WebP. Max 10MB per file.</p>
          </div>
          
          <p className="text-xs text-[#1A2332]/50 mt-4 italic">
            After upload, we will suggest groupings and placements. Nothing is published without your approval.
          </p>
        </div>

        {/* Builder Sections */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {builderSections.map((section) => {
            const IconComponent = section.icon;
            const isExpanded = expandedSections.includes(section.id);
            
            return (
              <div key={section.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[#F5F1E8]/50 transition-colors min-h-[72px] sm:min-h-[80px]"
                >
                  <div className="flex items-start sm:items-center flex-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#8B9D83]/20 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm sm:text-base text-[#1A2332]">{section.title}</h3>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 line-clamp-2">{section.description}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#1A2332]/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#1A2332]/40" />
                    )}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-[#1A2332]/10">
                    <div className="pt-4 sm:pt-6">
                      <textarea
                        className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-[#B8826D] text-sm sm:text-base resize-none"
                        rows={4}
                        placeholder={`Add content for ${section.title.toLowerCase()}...`}
                      />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                        <button className="text-sm text-[#B8826D] hover:text-[#B8826D]/80 min-h-[44px] flex items-center">
                          + Add another entry
                        </button>
                        <button className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg text-sm hover:bg-[#F5F1E8] transition-colors min-h-[44px]">
                          Save section
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Collaborative Gap-Filling */}
        <div className="bg-[#1A2332] rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="font-serif text-lg sm:text-xl text-[#F5F1E8] mb-3 sm:mb-4">Invite Others to Help</h2>
          <p className="text-[#F5F1E8]/70 text-sm mb-4 sm:mb-6">
            Teammates, family, and friends may remember details you have forgotten. 
            Invite them to contribute to your journey.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button className="flex items-center justify-center gap-3 p-4 rounded-lg bg-[#F5F1E8]/10 hover:bg-[#F5F1E8]/15 active:bg-[#F5F1E8]/20 transition-colors text-[#F5F1E8] min-h-[56px]">
              <UserPlus className="w-5 h-5" />
              <span className="text-sm sm:text-base">Invite to add context</span>
            </button>
            <button className="flex items-center justify-center gap-3 p-4 rounded-lg bg-[#F5F1E8]/10 hover:bg-[#F5F1E8]/15 active:bg-[#F5F1E8]/20 transition-colors text-[#F5F1E8] min-h-[56px]">
              <Users className="w-5 h-5" />
              <span className="text-sm sm:text-base">Invite to fill gaps</span>
            </button>
          </div>
        </div>

        {/* Auto-save Notice */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm text-[#1A2332]/60 italic">
            You can stop at any point and return later. Partial journeys are valid.
          </p>
        </div>

        {/* Read the full explainer */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('how-it-works')}
            className="inline-flex items-center text-sm text-[#B8826D] hover:text-[#B8826D]/80 min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Read the full explainer
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneyBuilder;
