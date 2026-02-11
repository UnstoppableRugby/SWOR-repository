import React, { useState } from 'react';
import { legends, rugbyJourneys } from '@/data/sworData';
import { ArrowLeft, Calendar, Award, Quote, ChevronDown, ChevronUp, Mail, UserPlus, BookOpen, ArrowLeftRight } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import JourneyShare from '../JourneyShare';
import ApprovedItemsSection from '../ApprovedItemsSection';
import ContributionPrompt from '../ContributionPrompt';
import JourneyCompare from '../JourneyCompare';

interface LegendDetailPageProps {
  legendId: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}


const LegendDetailPage: React.FC<LegendDetailPageProps> = ({ legendId, onBack, onNavigate }) => {
  const { user, isAuthenticated } = useAppContext();
  const [invitationsExpanded, setInvitationsExpanded] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  
  // Check steward status
  const isSteward = isAuthenticated && (user?.role === 'global_steward' || user?.role === 'journey_steward');
  const isOwner = isAuthenticated && user?.id === legendId;

  
  // Try to find in both legends and rugbyJourneys for compatibility
  const legend = legends.find((l) => l.id === legendId) || rugbyJourneys.find((j) => j.id === legendId);

  if (!legend) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1A2332] mb-4">Journey Not Found</h1>
          <p className="text-base sm:text-lg text-[#1A2332]/70 mb-6 max-w-md mx-auto">
            The journey you're looking for may have been moved or is no longer available.
          </p>
          <button
            onClick={onBack}
            className="swor-btn-primary"
          >
            Back to Rugby Journeys
          </button>
        </div>
      </div>
    );
  }

  // Determine if this is a rugby journey or legacy legend
  const isJourney = 'roles' in legend;
  const roles = isJourney ? (legend as any).roles : [(legend as any).position];
  const descriptors = (legend as any).descriptors || [];
  const acknowledgements = (legend as any).acknowledgements || [];

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24">
      {/* Hero - Light gradient for elder readability */}
      <div className="relative bg-gradient-to-b from-[#F5F1E8] to-white py-8 sm:py-12 md:py-16 border-b border-[#1A2332]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] mb-6 sm:mb-8 transition-colors text-sm sm:text-base md:text-lg min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5 mr-2 flex-shrink-0" />
            Back to Rugby Journeys
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8 md:gap-12">
            {/* Portrait */}
            <div className="w-32 h-40 sm:w-36 sm:h-48 md:w-44 md:h-56 rounded-xl overflow-hidden shadow-lg flex-shrink-0 border border-[#1A2332]/10 mx-auto sm:mx-0">
              <img
                src={legend.image}
                alt={legend.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              {/* Journey type label - not a structural header */}
              <p className="text-[#B8826D] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase mb-2 sm:mb-3">
                Your Rugby Journey
              </p>
              
              {/* Name as H1 - the primary heading */}
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1A2332] mb-3 sm:mb-4 leading-tight break-words">
                {legend.name}
              </h1>
              
              {/* Descriptors as derived labels - not category titles */}
              {descriptors.length > 0 && (
                <p className="text-base sm:text-lg md:text-xl text-[#1A2332]/70 font-medium mb-4 sm:mb-6">
                  {descriptors.join(' · ')}
                </p>
              )}
              
              {/* Country and era badges */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="inline-block px-3 sm:px-4 py-2 bg-[#B8826D]/10 text-[#B8826D] text-xs sm:text-sm md:text-base font-medium rounded-lg">
                  {legend.country}
                </span>
                <span className="inline-flex items-center px-3 sm:px-4 py-2 bg-[#8B9D83]/10 text-[#8B9D83] text-xs sm:text-sm md:text-base font-medium rounded-lg">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  {legend.era}
                </span>
              </div>
              
              {/* Roles as descriptors */}
              {roles.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {roles.map((role: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 sm:px-3 py-1.5 bg-white border border-[#1A2332]/10 text-[#1A2332]/70 text-xs sm:text-sm md:text-base rounded-lg"
                    >
                      <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Light background throughout for elder readability */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
        {/* Inline Share */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-[#1A2332]/10 gap-4">
          <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/60">
            Share this Rugby Journey with family, friends, or community.
          </p>
          <JourneyShare journeyTitle={legend.name} variant="inline" />
        </div>

        {/* Summary - Long form text on light background */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">About</h2>
          <div className="swor-longform">
            <p className="text-sm sm:text-base md:text-lg">{legend.summary}</p>
          </div>
        </section>

        {/* Quote - Contained in white card for visual separation */}
        {legend.quote && (
          <section className="swor-section">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10 shadow-sm border border-[#1A2332]/5">
              <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-[#B8826D] mb-3 sm:mb-4" />
              <blockquote className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A2332] italic leading-relaxed mb-3 sm:mb-4">
                "{legend.quote}"
              </blockquote>
              <cite className="text-[#B8826D] font-medium not-italic text-sm sm:text-base md:text-lg">
                - {legend.name}
              </cite>
            </div>
          </section>
        )}

        {/* Acknowledgements - Mandatory section */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">Acknowledgements</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[#1A2332]/10">
            {acknowledgements.length > 0 ? (
              <>
                <p className="text-[#1A2332]/80 leading-relaxed text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                  This journey was made possible by the support of:
                </p>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {acknowledgements.map((ack: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8826D] mt-2 sm:mt-2.5 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-[#1A2332]/70 text-sm sm:text-base md:text-lg">{ack}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-[#1A2332]/70 leading-relaxed text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                This journey was made possible by the support of teammates, coaches, family, clubs, 
                and communities who contributed along the way.
              </p>
            )}
            <p className="text-xs sm:text-sm md:text-base text-[#1A2332]/50 italic border-t border-[#1A2332]/10 pt-3 sm:pt-4">
              Acknowledgement does not imply endorsement. It simply recognises contribution.
            </p>
          </div>
        </section>

        {/* Phase 4: Approved Items Section - Display approved content publicly */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">Archive & Materials</h2>
          <ApprovedItemsSection
            journeyId={legendId}
            journeyTitle={legend.name}
            viewerUserId={user?.id || null}
            viewerRelationship={null}
            isSteward={isSteward}
            isOwner={isOwner}
            onNavigate={onNavigate}
          />

          
          {/* Contribution Prompt */}
          <div className="mt-4 sm:mt-6">
            <ContributionPrompt
              onContribute={() => onNavigate('contribute')}
              variant="card"
            />
          </div>
        </section>

        {/* Compare Button */}
        <section className="swor-section">
          <button
            onClick={() => setCompareOpen(true)}
            className="w-full flex items-center justify-center p-4 bg-white rounded-xl border border-[#1A2332]/10 hover:border-[#B8826D]/30 hover:bg-[#B8826D]/5 transition-colors group min-h-[56px]"
          >
            <ArrowLeftRight className="w-5 h-5 text-[#B8826D] mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-[#1A2332] font-medium group-hover:text-[#B8826D] transition-colors text-sm sm:text-base">
              Compare with another journey
            </span>
          </button>
        </section>

        {/* Values and Legacy */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">Values and Legacy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-[#1A2332]/5">
              <h3 className="font-medium text-[#1A2332] mb-2 text-sm sm:text-base md:text-lg">Dedication</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#1A2332]/60 leading-relaxed">
                Years of commitment to excellence at the highest level.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-[#1A2332]/5">
              <h3 className="font-medium text-[#1A2332] mb-2 text-sm sm:text-base md:text-lg">Leadership</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#1A2332]/60 leading-relaxed">
                Inspiring teammates and future generations of players.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-[#1A2332]/5 sm:col-span-2 md:col-span-1">
              <h3 className="font-medium text-[#1A2332] mb-2 text-sm sm:text-base md:text-lg">Legacy</h3>
              <p className="text-xs sm:text-sm md:text-base text-[#1A2332]/60 leading-relaxed">
                A lasting impact on the game and its community.
              </p>
            </div>
          </div>
        </section>

        {/* Connections */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">Connections</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[#1A2332]/10">
            <p className="text-[#1A2332]/70 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base md:text-lg">
              Explore the connections between {legend.name} and the wider rugby community.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => onNavigate('clubs')}
                className="swor-btn-ghost border border-[#1A2332]/20 text-sm sm:text-base"
              >
                Explore Clubs
              </button>
              <button
                onClick={() => onNavigate('moments')}
                className="swor-btn-ghost border border-[#1A2332]/20 text-sm sm:text-base"
              >
                Explore Moments
              </button>
            </div>
          </div>
        </section>

        {/* Redwoods Project */}
        <section className="swor-section">
          <div className="bg-[#8B9D83]/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 text-center border border-[#8B9D83]/20">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">
              Part of The Redwoods Project
            </h2>
            <p className="text-[#1A2332]/70 mb-4 sm:mb-6 max-w-lg mx-auto leading-relaxed text-sm sm:text-base md:text-lg">
              {legend.name}'s story is preserved as part of SWOR's mission to protect rugby's heritage 
              for future generations.
            </p>
            <button
              onClick={() => onNavigate('redwoods')}
              className="swor-btn-secondary text-sm sm:text-base"
            >
              Learn About The Redwoods Project
            </button>
          </div>
        </section>

        {/* Collapsed Invitations Module - Low prominence, optional */}
        <section className="swor-section">
          <div className="border border-[#1A2332]/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setInvitationsExpanded(!invitationsExpanded)}
              className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 bg-white hover:bg-[#F5F1E8]/50 transition-colors text-left min-h-[56px]"
            >
              <span className="text-[#1A2332]/70 text-sm sm:text-base md:text-lg font-medium">
                Invite others to contribute
              </span>
              {invitationsExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#1A2332]/50 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#1A2332]/50 flex-shrink-0" />
              )}
            </button>
            
            {invitationsExpanded && (
              <div className="p-4 sm:p-5 md:p-6 bg-[#F5F1E8] border-t border-[#1A2332]/10 space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-[#1A2332]/60 mb-3 sm:mb-4">
                  If you can help add context or correct a detail, you're welcome to contribute.
                </p>
                <button
                  onClick={() => onNavigate('contribute')}
                  className="w-full flex items-center p-3 sm:p-4 md:p-5 rounded-lg bg-white border border-[#1A2332]/10 hover:border-[#B8826D]/30 hover:bg-[#B8826D]/5 transition-colors text-left group min-h-[56px]"
                >
                  <Mail className="w-5 h-5 text-[#B8826D] mr-3 sm:mr-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1A2332] group-hover:text-[#B8826D] transition-colors text-sm sm:text-base md:text-lg">
                      Invite others to add context
                    </p>
                    <p className="text-xs sm:text-sm md:text-base text-[#1A2332]/60 mt-0.5 sm:mt-1">
                      Help enrich this journey with memories, photographs, or perspectives.
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => onNavigate('contribute')}
                  className="w-full flex items-center p-3 sm:p-4 md:p-5 rounded-lg bg-white border border-[#1A2332]/10 hover:border-[#8B9D83]/30 hover:bg-[#8B9D83]/5 transition-colors text-left group min-h-[56px]"
                >
                  <UserPlus className="w-5 h-5 text-[#8B9D83] mr-3 sm:mr-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1A2332] group-hover:text-[#8B9D83] transition-colors text-sm sm:text-base md:text-lg">
                      Invite someone to begin their own Rugby Journey
                    </p>
                    <p className="text-xs sm:text-sm md:text-base text-[#1A2332]/60 mt-0.5 sm:mt-1">
                      Know someone whose story should be preserved? Share the invitation.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Footer Share */}
        <JourneyShare journeyTitle={legend.name} variant="footer" />

        {/* How Rugby Journeys Work - Required system link */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-[#1A2332]/10">
          <button
            onClick={() => onNavigate('how-it-works')}
            className="inline-flex items-center text-[#B8826D] hover:text-[#B8826D]/80 text-sm sm:text-base md:text-lg font-medium transition-colors min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-left">Read the full explainer: How Rugby Journeys Work on SWOR</span>
          </button>
        </div>
      </div>

      {/* Compare Modal */}
      <JourneyCompare
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        initialJourneyId={legendId}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default LegendDetailPage;
