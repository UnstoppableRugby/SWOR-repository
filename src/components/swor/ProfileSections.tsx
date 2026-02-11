import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, BookOpen, Image, Users, Plus, Lock, Globe, Heart, Eye, Calendar, Info } from 'lucide-react';
import SectionGuidance from './SectionGuidance';
import { sectionChecklists, qualifierLabels } from '@/data/guidanceRecords';


interface ProfileSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  visibility?: 'public' | 'connections' | 'family' | 'draft';
  /** Section ID for guidance lookup */
  sectionId?: string;
  /** Show guidance (only for owners/stewards) */
  showGuidance?: boolean;
  /** Show orientation checklist */
  showChecklist?: boolean;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  description,
  icon,
  children,
  defaultOpen = false,
  isEmpty = false,
  emptyMessage = "Nothing added yet. You can add content anytime.",
  visibility,
  sectionId,
  showGuidance = true,
  showChecklist = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const visibilityIcon = {
    public: <Globe className="w-3 h-3" />,
    connections: <Users className="w-3 h-3" />,
    family: <Heart className="w-3 h-3" />,
    draft: <Lock className="w-3 h-3" />
  };

  const visibilityLabel = {
    public: 'Public',
    connections: 'Connections',
    family: 'Family',
    draft: 'Draft'
  };

  const checklist = sectionId ? sectionChecklists[sectionId] : undefined;

  return (
    <div className="border border-[#1A2332]/10 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[#F5F1E8]/30 transition-colors text-left min-h-[44px]"
        aria-expanded={isOpen}
        aria-label={`${title} section${isEmpty ? ' (optional)' : ''}`}
      >
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#8B9D83]/10 flex items-center justify-center text-[#8B9D83] flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="font-medium text-[#1A2332]">{title}</h3>
              {visibility && (
                <span className={`inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full ${
                  visibility === 'draft' ? 'bg-[#1A2332]/5 text-[#1A2332]/50' :
                  visibility === 'family' ? 'bg-[#B8826D]/10 text-[#B8826D]' :
                  visibility === 'connections' ? 'bg-[#8B9D83]/10 text-[#8B9D83]' :
                  'bg-green-50 text-green-600'
                }`}>
                  {visibilityIcon[visibility]}
                  <span>{visibilityLabel[visibility]}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-[#1A2332]/60 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {isEmpty && (
            <span className="text-xs text-[#1A2332]/40 hidden sm:inline">Optional</span>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-[#1A2332]/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#1A2332]/40" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-0 border-t border-[#1A2332]/5">
          {/* Section Guidance Toggle (private, for owners/stewards) */}
          {showGuidance && sectionId && (
            <div className="mb-3">
              <SectionGuidance sectionId={sectionId} variant="toggle" />
            </div>
          )}

          {isEmpty ? (
            <div className="py-6 sm:py-8 text-center">
              <p className="text-[#1A2332]/50 text-sm mb-4">{emptyMessage}</p>
              <button className="inline-flex items-center space-x-2 text-[#B8826D] text-sm font-medium hover:text-[#B8826D]/80 transition-colors min-h-[44px]">
                <Plus className="w-4 h-4" />
                <span>Add content</span>
              </button>
            </div>
          ) : (
            children
          )}

          {/* Orientation Checklist (non-evaluative) */}
          {showChecklist && checklist && checklist.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#1A2332]/5">
              <button
                onClick={() => setChecklistOpen(!checklistOpen)}
                className="flex items-center space-x-1.5 text-xs text-[#1A2332]/40 hover:text-[#1A2332]/60 transition-colors py-1 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/30 rounded"
                aria-expanded={checklistOpen}
              >
                <Info className="w-3.5 h-3.5" />
                <span>What others commonly include</span>
                {checklistOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              {checklistOpen && (
                <div className="mt-2 space-y-1.5">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2.5 text-sm">
                      <div className="w-4 h-4 border border-[#1A2332]/15 rounded mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[#1A2332]/60">{item.label}</span>
                        <span className="text-xs text-[#1A2332]/30 ml-1.5">
                          ({qualifierLabels[item.qualifier]})
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-[#1A2332]/30 mt-2 italic">
                    These are for orientation only and never affect submission.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ProfileSectionsProps {
  // Core Journey data
  coreJourneyContent?: React.ReactNode;
  hasCoreJourney?: boolean;
  
  // Milestone Timeline (PATCH G.2)
  milestoneContent?: React.ReactNode;
  hasMilestones?: boolean;
  
  // Reflections & Influences
  reflectionsContent?: React.ReactNode;
  hasReflections?: boolean;
  
  // Archive & Media
  archiveContent?: React.ReactNode;
  hasArchive?: boolean;
  
  // Connections & Acknowledgements
  connectionsContent?: React.ReactNode;
  hasConnections?: boolean;
  
  // Optional Additions
  optionalContent?: React.ReactNode;
  hasOptional?: boolean;
  
  // Visibility settings per section
  sectionVisibility?: {
    coreJourney?: 'public' | 'connections' | 'family' | 'draft';
    milestones?: 'public' | 'connections' | 'family' | 'draft';
    reflections?: 'public' | 'connections' | 'family' | 'draft';
    archive?: 'public' | 'connections' | 'family' | 'draft';
    connections?: 'public' | 'connections' | 'family' | 'draft';
    optional?: 'public' | 'connections' | 'family' | 'draft';
  };
  
  // Edit mode
  isEditing?: boolean;
  
  // Guidance visibility (only for owners/stewards)
  showGuidance?: boolean;
}

const ProfileSections: React.FC<ProfileSectionsProps> = ({
  coreJourneyContent,
  hasCoreJourney = false,
  milestoneContent,
  hasMilestones = false,
  reflectionsContent,
  hasReflections = false,
  archiveContent,
  hasArchive = false,
  connectionsContent,
  hasConnections = false,
  optionalContent,
  hasOptional = false,
  sectionVisibility = {},
  isEditing = false,
  showGuidance = true
}) => {
  return (
    <div className="space-y-4">
      {/* Section Group Label */}
      <div className="flex items-center space-x-2 text-xs text-[#1A2332]/40 uppercase tracking-wider">
        <span>Profile Sections</span>
        <div className="flex-1 border-t border-[#1A2332]/10" />
      </div>

      {/* 1. Core Journey - Always first, default open if has content */}
      <ProfileSection
        title="Core Journey"
        description="Your rugby story — how it began, where it took you"
        icon={<User className="w-5 h-5" />}
        defaultOpen={hasCoreJourney || hasMilestones}
        isEmpty={!hasCoreJourney && !hasMilestones && !milestoneContent}
        emptyMessage="Share your rugby journey. How did you come to the game? What clubs, teams, or roles shaped your path?"
        visibility={sectionVisibility.coreJourney}
        sectionId="core_journey"
        showGuidance={showGuidance}
      >
        <div className="space-y-6">
          {coreJourneyContent}
          
          {/* PATCH G.2: Milestone Timeline Editor */}
          {milestoneContent && (
            <div className="pt-4 border-t border-[#1A2332]/10">
              {milestoneContent}
            </div>
          )}
        </div>
      </ProfileSection>


      <ProfileSection
        title="Reflections & Influences"
        description="What rugby meant to you, who shaped your journey"
        icon={<BookOpen className="w-5 h-5" />}
        defaultOpen={false}
        isEmpty={!hasReflections}
        emptyMessage="Reflect on what rugby has meant to you. Who influenced your journey? What lessons did you learn?"
        visibility={sectionVisibility.reflections}
        sectionId="reflections"
        showGuidance={showGuidance}
      >
        {reflectionsContent}
      </ProfileSection>

      {/* 3. Archive & Media */}
      <ProfileSection
        title="Archive & Media"
        description="Photos, documents, videos, and other materials"
        icon={<Image className="w-5 h-5" />}
        defaultOpen={false}
        isEmpty={!hasArchive}
        emptyMessage="Add photos, documents, or other materials that tell your story. Old programmes, team photos, newspaper clippings — anything that matters."
        visibility={sectionVisibility.archive}
        sectionId="archive"
        showGuidance={showGuidance}
      >
        {archiveContent}
      </ProfileSection>

      {/* 4. Connections & Acknowledgements */}
      <ProfileSection
        title="Connections & Acknowledgements"
        description="People, clubs, and communities that enabled your journey"
        icon={<Users className="w-5 h-5" />}
        defaultOpen={false}
        isEmpty={!hasConnections}
        emptyMessage="Acknowledge the people and communities that made your journey possible. Teammates, coaches, clubs, family — no journey is solo."
        visibility={sectionVisibility.connections}
        sectionId="connections"
        showGuidance={showGuidance}
      >
        {connectionsContent}
      </ProfileSection>

      {/* 5. Optional Additions */}
      <ProfileSection
        title="Optional Additions"
        description="Anything else you would like to include"
        icon={<Plus className="w-5 h-5" />}
        defaultOpen={false}
        isEmpty={!hasOptional}
        emptyMessage="Is there something that doesn't fit elsewhere? Add it here. This section is entirely optional."
        visibility={sectionVisibility.optional}
        sectionId="optional"
        showGuidance={showGuidance}
      >
        {optionalContent}
      </ProfileSection>

      {/* Guidance Note */}
      <div className="mt-6 p-4 bg-[#F5F1E8] rounded-lg border border-[#1A2332]/5">
        <p className="text-sm text-[#1A2332]/60 text-center leading-relaxed">
          Sections are collapsed by default to keep things manageable. 
          Open any section to add or view content. You can return anytime.
        </p>
      </div>
    </div>
  );
};

export default ProfileSections;
export { ProfileSection };
