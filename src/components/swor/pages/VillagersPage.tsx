import React, { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Users, Quote, ChevronDown, ChevronUp, Mail, UserPlus, Archive, Shield, Clock } from 'lucide-react';
import JourneyShare from '../JourneyShare';
import JourneySettings from '../JourneySettings';
import Phase3Builder from '../Phase3Builder';
import ApprovedContributions from '../ApprovedContributions';
import { useAppContext } from '@/contexts/AppContext';
import { villagersConfig } from '@/data/sworData';

interface VillagersPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

// Villagers Rugby Club data
const villagersClub = {
  id: 'villagers-rfc',
  name: 'Villagers Rugby Club',
  location: 'Cape Town',
  country: 'South Africa',
  founded: 1876,
  image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716855567_f23cba98.png',
  summary: 'One of the oldest rugby clubs in South Africa, Villagers has been a cornerstone of Cape Town rugby for nearly 150 years. Our journey is one of continuity, community, and the countless individuals who have worn the jersey.',
  quote: 'We are not just a club. We are generations of families, friendships, and shared purpose.',
  journeyType: 'collective' as const,
  descriptors: ['Community', 'Continuity', 'Stewardship'],
  acknowledgements: [
    'The founding members who established the club in 1876',
    'Generations of players, coaches, and volunteers',
    'The families who have supported the club across decades',
    'The Cape Town rugby community',
    'Western Province Rugby Football Union',
    'The schools and youth programmes that have nurtured talent',
  ],
  affiliations: ['Western Province Rugby', 'South African Rugby Union'],
  governanceNote: 'Governance documented as it existed at the time. Western Province functions as the regional union.',
};

// PER-JOURNEY OVERRIDE PATCH APPLIED:
// - Multi-steward support
// - Archive-heavy ingestion
// - Long timeline tolerance
// - Collective voice ("we", "our")
// - Phase 3 visible only to owner/stewards

const VillagersPage: React.FC<VillagersPageProps> = ({ onBack, onNavigate }) => {
  const { checkJourneyOwnership } = useAppContext();
  const [invitationsExpanded, setInvitationsExpanded] = useState(false);
  
  // Check if current user is owner/steward of this journey
  const journeyOwnership = checkJourneyOwnership('villagers-rfc');
  const isOwner = journeyOwnership.isOwner;
  const isOwnerOrSteward = journeyOwnership.isOwner || journeyOwnership.isSteward;


  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-[#1A2332] to-[#2A3342] py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center text-[#F5F1E8]/70 hover:text-[#F5F1E8] mb-6 sm:mb-8 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            <span>Back to Clubs & Communities</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8 md:gap-12">
            {/* Club Image */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 border-2 border-[#8B9D83]/30 bg-white flex items-center justify-center mx-auto sm:mx-0">
              <img
                src={villagersClub.image}
                alt={villagersClub.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[#8B9D83] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase mb-3 sm:mb-4">
                {villagersConfig.framingTitle}
              </p>
              
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#F5F1E8] mb-3 sm:mb-4 leading-tight">
                {villagersClub.name}
              </h1>
              
              {/* Descriptors */}
              <p className="text-base sm:text-lg md:text-xl text-[#8B9D83]/90 font-medium mb-4 sm:mb-6">
                {villagersConfig.descriptors.join(' · ')}
              </p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
                <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#8B9D83] text-[#F5F1E8] text-xs sm:text-sm font-medium rounded-lg">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{villagersClub.location}, {villagersClub.country}</span>
                </span>
                <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#B8826D] text-[#F5F1E8] text-xs sm:text-sm font-medium rounded-lg">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  Est. {villagersClub.founded}
                </span>
                <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-[#1A2332] border border-[#8B9D83]/50 text-[#8B9D83] text-xs font-medium rounded-lg">
                  Foundational Collective Journey
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        
        {/* Inline Share */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 pb-6 sm:pb-8 border-b border-[#1A2332]/10 gap-3 sm:gap-4">
          <p className="text-sm sm:text-base text-[#1A2332]/60">
            Share our Rugby Journey with family, friends, or community.
          </p>
          <JourneyShare journeyTitle={villagersClub.name} variant="inline" />
        </div>

        {/* Our Story - Collective voice (Phase 1 Protected) */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">Our Story</h2>
          <div className="swor-longform text-sm sm:text-base">
            <p>
              Villagers Rugby Club was founded in 1876, making us one of the oldest rugby clubs in South Africa. 
              For nearly 150 years, we have been a home for rugby in Cape Town, a place where generations have 
              learned the game, formed lifelong friendships, and contributed to our community.
            </p>
            <p>
              Our journey is not the story of any single individual. It is the collective story of thousands 
              of players, coaches, administrators, volunteers, and families who have given their time, energy, 
              and love to this club. We are stewards of a tradition that was passed to us, and which we will 
              pass on to those who come after.
            </p>
            <p>
              We have seen rugby change enormously since 1876. We have adapted, grown, and evolved. But our 
              core purpose remains the same: to provide a place where people can play rugby, belong to a 
              community, and carry forward the values that the game teaches.
            </p>
          </div>
        </section>

        {/* Quote */}
        <section className="swor-section">
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10 shadow-sm border border-[#1A2332]/5">
            <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-[#8B9D83] mb-3 sm:mb-4 flex-shrink-0" />
            <blockquote className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A2332] italic leading-relaxed mb-3 sm:mb-4">
              "{villagersClub.quote}"
            </blockquote>
            <cite className="text-[#8B9D83] font-medium not-italic text-sm sm:text-base">
              – Villagers Rugby Club
            </cite>
          </div>
        </section>

        {/* Continuity & Stewardship */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">Continuity & Stewardship</h2>
          <div className="swor-longform text-sm sm:text-base">
            <p>
              We understand that we are temporary custodians of something larger than ourselves. The club 
              existed before any of us were born, and it will continue long after we are gone. This perspective 
              shapes how we approach everything we do.
            </p>
            <p>
              Our responsibility is to honour those who came before us by maintaining the standards they set, 
              while also adapting to serve the needs of current and future generations. We invest in youth 
              development, welcome new members, and work to ensure that the club remains financially sustainable 
              and socially relevant.
            </p>
          </div>
          <ul className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8B9D83] mt-2 sm:mt-3 mr-3 sm:mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-sm sm:text-base md:text-lg leading-relaxed">
                We preserve our history while building for the future
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8B9D83] mt-2 sm:mt-3 mr-3 sm:mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-sm sm:text-base md:text-lg leading-relaxed">
                We welcome all who share our values and love of the game
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8B9D83] mt-2 sm:mt-3 mr-3 sm:mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-sm sm:text-base md:text-lg leading-relaxed">
                We invest in youth programmes and community engagement
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8B9D83] mt-2 sm:mt-3 mr-3 sm:mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-sm sm:text-base md:text-lg leading-relaxed">
                We maintain our facilities and traditions for future generations
              </span>
            </li>
          </ul>
        </section>

        {/* Acknowledgements - Mandatory */}
        <section className="swor-section">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">Acknowledgements</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[#1A2332]/10">
            <p className="text-[#1A2332]/80 leading-relaxed text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
              Our journey has been made possible by the contributions of countless individuals and organisations:
            </p>
            <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {villagersClub.acknowledgements.map((ack, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#8B9D83] mt-2 sm:mt-2.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-[#1A2332]/70 text-xs sm:text-sm md:text-base">{ack}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs sm:text-sm text-[#1A2332]/50 italic border-t border-[#1A2332]/10 pt-3 sm:pt-4">
              Acknowledgement does not imply endorsement. It simply recognises contribution.
            </p>
          </div>
        </section>

        {/* Governance Note */}
        <section className="swor-section">
          <div className="bg-[#F5F1E8] rounded-xl p-4 sm:p-6 border border-[#1A2332]/10">
            <p className="text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
              <strong className="text-[#1A2332]/70">Governance note:</strong> {villagersClub.governanceNote}
            </p>
            <p className="text-xs sm:text-sm text-[#1A2332]/50 mt-2">
              Affiliations: {villagersClub.affiliations.join(', ')}
            </p>
          </div>
        </section>

        {/* ============================================
            APPROVED COMMUNITY CONTRIBUTIONS
            Fetches approved contributions from journey_contributions table
            Renders text as narrative blocks, moments on timeline, people as connection cards
            Uses collective voice for Villagers
            ============================================ */}
        <section className="swor-section">
          <ApprovedContributions
            journeyId="villagers-rfc"
            journeyTitle={villagersClub.name}
            isCollective={true}
          />
        </section>

        {/* Closing Reflection */}

        <section className="swor-section">
          <div className="bg-white rounded-xl p-5 sm:p-6 md:p-8 border border-[#1A2332]/10 text-center">
            <p className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A2332] italic leading-relaxed mb-3 sm:mb-4">
              "The jersey is borrowed. What we leave behind is permanent."
            </p>
            <p className="text-[#1A2332]/60 text-xs sm:text-sm md:text-base leading-relaxed">
              Villagers Rugby Club continues to write its story, one season at a time. We are grateful 
              to all who have contributed to our journey, and we look forward to welcoming the next 
              generation of players, supporters, and friends.
            </p>
          </div>
        </section>

        {/* Archive & Timeline Tolerance Indicator - Villagers-specific */}
        {isOwnerOrSteward && (
          <section className="swor-section">
            <div className="bg-[#8B9D83]/10 rounded-xl p-4 sm:p-5 border border-[#8B9D83]/20">
              <div className="flex items-start mb-3 sm:mb-4">
                <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                    <span className="font-medium text-[#1A2332]">Archive Support:</span> This collective journey 
                    supports archive-heavy ingestion. Programmes, minutes, photographs, newsletters and historical 
                    documents can be uploaded and organised over time.
                  </p>
                </div>
              </div>
              <div className="flex items-start mb-3 sm:mb-4">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                    <span className="font-medium text-[#1A2332]">Long Timeline:</span> We understand that 
                    building a complete record of nearly 150 years takes time. There is no rush.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2.5 sm:mr-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                    <span className="font-medium text-[#1A2332]">Multi-Steward:</span> This journey supports 
                    multiple stewards. Committee members, historians, and trusted volunteers can all contribute 
                    to maintaining this record.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================== */}
        {/* PHASE 3 MODULE - Build out our Rugby Journey */}
        {/* Collapsed by default, visible only to owner/stewards */}
        {/* ============================================== */}
        <section className="swor-section">
          <Phase3Builder
            journeyId="villagers-rfc"
            journeyType="collective"
            journeyTitle={villagersClub.name}
            onNavigate={onNavigate}
          />
        </section>


        {/* Collapsed Invitations Module - visible only to owner/stewards */}
        {isOwnerOrSteward && (
          <section className="swor-section">
            <div className="border border-[#1A2332]/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setInvitationsExpanded(!invitationsExpanded)}
                className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 transition-colors text-left min-h-[52px]"
              >
                <span className="text-[#1A2332]/70 text-sm sm:text-base font-medium">
                  Invite others to contribute
                </span>
                {invitationsExpanded ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A2332]/50 flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A2332]/50 flex-shrink-0 ml-2" />
                )}
              </button>
              
              {invitationsExpanded && (
                <div className="p-4 sm:p-5 md:p-6 bg-white border-t border-[#1A2332]/10 space-y-3 sm:space-y-4">
                  <button
                    onClick={() => onNavigate('contribute')}
                    className="w-full flex items-start p-3 sm:p-4 rounded-lg border border-[#1A2332]/10 hover:border-[#8B9D83]/30 hover:bg-[#8B9D83]/5 transition-colors text-left group min-h-[60px]"
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-3 sm:mr-4 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-[#1A2332] group-hover:text-[#8B9D83] transition-colors">
                        Invite others to add context
                      </p>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1">
                        Help enrich our journey with memories, photographs, or perspectives.
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => onNavigate('contribute')}
                    className="w-full flex items-start p-3 sm:p-4 rounded-lg border border-[#1A2332]/10 hover:border-[#B8826D]/30 hover:bg-[#B8826D]/5 transition-colors text-left group min-h-[60px]"
                  >
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8826D] mr-3 sm:mr-4 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-[#1A2332] group-hover:text-[#B8826D] transition-colors">
                        Invite someone to begin their own Rugby Journey
                      </p>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1">
                        Know a club member whose story should be preserved? Share the invitation.
                      </p>
                    </div>
                  </button>

                  {/* Contribution rules */}
                  <div className="pt-3 sm:pt-4 border-t border-[#1A2332]/10">
                    <p className="text-xs text-[#1A2332]/40 leading-relaxed">
                      Named invitations only. Role or relationship must be stated. All contributions reviewed before inclusion.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Journey Settings - Stewards, Legacy Mode, Audit Trail */}
        <section className="swor-section">
          <JourneySettings
            journeyId="villagers-rfc"
            journeyType="club"
            isOwner={isOwner}
          />
        </section>

        {/* Footer Share */}
        <JourneyShare journeyTitle={villagersClub.name} variant="footer" />


        {/* How Rugby Journeys Work */}
        <div className="text-center mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[#1A2332]/10">
          <button
            onClick={() => onNavigate('how-it-works')}
            className="text-[#8B9D83] hover:text-[#8B9D83]/80 text-sm sm:text-base font-medium transition-colors min-h-[44px] px-4 py-2"
          >
            Read the full explainer: How Rugby Journeys Work on SWOR
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillagersPage;
