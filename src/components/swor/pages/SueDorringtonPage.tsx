import React, { useState } from 'react';
import { sueDorrington, sueDorringtonConfig } from '@/data/sworData';
import { ArrowLeft, Users, Heart, Leaf, Quote, ChevronDown, ChevronUp, Mail, UserPlus, Shield, BookOpen } from 'lucide-react';
import JourneyShare from '../JourneyShare';
import JourneySettings from '../JourneySettings';
import Phase3Builder from '../Phase3Builder';
import ApprovedItemsSection from '../ApprovedItemsSection';
import ApprovedContributions from '../ApprovedContributions';
import { useAppContext } from '@/contexts/AppContext';


interface SueDorringtonPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

// CANONICAL MIGRATION COMPLETE
// This is the sole canonical public version of Sue Dorrington's Rugby Journey.
// Legacy page retained as private provenance artefact only - not linked, indexed, or surfaced.
// SWOR fully owns stewardship of this journey.

// PER-JOURNEY OVERRIDE PATCH APPLIED:
// - Elder-first readability
// - Light backgrounds
// - No typographic dashes (using "to" instead of em-dashes)
// - Phase 3 visible only to owner/stewards
// - Legacy page handling: retained as private provenance, never linked

const SueDorringtonPage: React.FC<SueDorringtonPageProps> = ({ onBack, onNavigate }) => {
  const { user, isAuthenticated, checkJourneyOwnership } = useAppContext();
  const [activeTab, setActiveTab] = useState<'story' | 'redwoods' | 'connections'>('story');
  const [invitationsExpanded, setInvitationsExpanded] = useState(false);
  
  // Check if current user is owner/steward of this journey
  const journeyOwnership = checkJourneyOwnership('sue-dorrington');
  const isOwner = journeyOwnership.isOwner;
  const isOwnerOrSteward = journeyOwnership.isOwner || journeyOwnership.isSteward;

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-24">

      {/* Hero Section - Light background for readability */}
      <div className="relative bg-gradient-to-b from-[#1A2332] to-[#2A3342] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center text-[#F5F1E8]/70 hover:text-[#F5F1E8] mb-8 transition-colors text-base"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Rugby Journeys
          </button>
          
          <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
            {/* Portrait */}
            <div className="w-36 h-48 md:w-44 md:h-56 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 border-2 border-[#B8826D]/30">
              <img
                src={sueDorrington.image}
                alt={sueDorrington.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <p className="text-[#B8826D] text-sm md:text-base font-medium tracking-widest uppercase mb-4">
                {sueDorringtonConfig.framingTitle}
              </p>
              
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F5F1E8] mb-4 leading-tight">
                {sueDorrington.name}
              </h1>
              
              {/* Descriptors as derived labels - not category titles */}
              <p className="text-lg md:text-xl text-[#B8826D]/90 font-medium mb-6">
                {sueDorringtonConfig.descriptors.join(' · ')}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <span className="inline-block px-4 py-2 bg-[#B8826D] text-[#F5F1E8] text-sm font-medium rounded-lg">
                  {sueDorrington.country}
                </span>
                <span className="inline-block px-4 py-2 bg-[#8B9D83] text-[#F5F1E8] text-sm font-medium rounded-lg">
                  {sueDorrington.era}
                </span>
                <span className="inline-block px-4 py-2 bg-[#1A2332] border border-[#B8826D]/50 text-[#B8826D] text-xs font-medium rounded-lg">
                  Foundational Journey
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Light background for long-form readability (elder-first) */}
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        
        {/* Inline Share - subtle placement */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 pb-8 border-b border-[#1A2332]/10 gap-4">
          <p className="text-base text-[#1A2332]/60">
            Share this Rugby Journey with family, friends, or community.
          </p>
          <JourneyShare journeyTitle={sueDorrington.name} variant="inline" />
        </div>

        {/* Narrative Summary - Complete intro that stands alone (Phase 1 Protected) */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">A Life in Service of the Game</h2>
          <div className="swor-longform">
            <p>
              Sue Dorrington's contribution to rugby cannot be measured in caps or tries. Her legacy is woven 
              into the very fabric of women's rugby in England and beyond. As a pioneer, administrator, and 
              tireless advocate, she helped build the foundations upon which today's game stands.
            </p>
            <p>
              Her work spans decades of quiet, determined effort: organising matches when none existed, 
              fighting for recognition when doors were closed, and nurturing the next generation of players 
              and leaders. This is a story of stewardship, not statistics.
            </p>
            <p>
              Sue understood that rugby's true strength lies not in individual glory but in collective effort. 
              She worked alongside countless others who shared her vision, and she would be the first to 
              acknowledge that her journey was made possible by the support of teammates, administrators, 
              families, and communities who embraced women's rugby when it was far from mainstream.
            </p>
          </div>
        </section>

        {/* Quote - On light background for readability */}
        {sueDorrington.quote && (
          <section className="swor-section">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-[#1A2332]/5">
              <Quote className="w-8 h-8 text-[#B8826D] mb-4" />
              <blockquote className="font-serif text-xl md:text-2xl text-[#1A2332] italic leading-relaxed mb-4">
                "{sueDorrington.quote}"
              </blockquote>
              <cite className="text-[#B8826D] font-medium not-italic text-base">
                – {sueDorrington.name}

              </cite>
            </div>
          </section>
        )}

        {/* Why Sue Matters */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">Why Sue Matters</h2>
          <div className="swor-longform">
            <p>
              In an era when women's rugby was often dismissed or ignored, Sue Dorrington refused to accept 
              the status quo. Her contribution extends far beyond any single achievement:
            </p>
          </div>
          <ul className="space-y-4 mt-6">
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                She helped establish pathways for women to play, coach, and lead in rugby
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                Her administrative work created structures that still support the game today
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                She mentored countless individuals who went on to shape rugby at all levels
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                Her story represents the unsung heroes who build sport from the ground up
              </span>
            </li>
          </ul>
        </section>

        {/* Acknowledgements - Mandatory */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">Acknowledgements</h2>
          <div className="bg-white rounded-xl p-6 md:p-8 border border-[#1A2332]/10">
            <p className="text-[#1A2332]/80 leading-relaxed text-lg mb-6">
              Sue's journey was made possible by the support of countless individuals, clubs, and organisations:
            </p>
            <ul className="space-y-3 mb-6">
              {sueDorrington.acknowledgements?.map((ack, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] mt-2.5 mr-3 flex-shrink-0" />
                  <span className="text-[#1A2332]/70 text-base">{ack}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A2332]/50 italic border-t border-[#1A2332]/10 pt-4">
              Acknowledgement does not imply endorsement. It simply recognises contribution.
            </p>
          </div>
        </section>

        {/* Living Legacy */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">A Living Legacy</h2>
          <div className="swor-longform">
            <p>
              Sue's legacy is not confined to history books. It lives on in every women's match played, 
              every young girl who picks up a rugby ball, and every club that welcomes players regardless 
              of gender. The structures she helped build continue to grow and evolve.
            </p>
            <p>
              SWOR is honoured to preserve and share her story, not as a static record, but as a living 
              connection between rugby's past and its future.
            </p>
          </div>
        </section>

        {/* ============================================
            PHASE 4: APPROVED ITEMS SECTION
            Display approved content publicly with attribution
            Only shows items with status='approved' and appropriate visibility
            ============================================ */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">Archive & Materials</h2>
          <ApprovedItemsSection
            journeyId="sue-dorrington"
            journeyTitle={sueDorrington.name}
            viewerUserId={user?.id || null}
            viewerRelationship={null}
            isSteward={journeyOwnership.isSteward}
            isOwner={isOwner}
            onNavigate={onNavigate}
          />
        </section>



        {/* ============================================
            APPROVED COMMUNITY CONTRIBUTIONS
            Fetches approved contributions from journey_contributions table
            Renders text as narrative blocks, moments on timeline, people as connection cards
            ============================================ */}
        <section className="swor-section">
          <ApprovedContributions
            journeyId="sue-dorrington"
            journeyTitle={sueDorrington.name}
            isCollective={false}
          />
        </section>


        {/* Tabs - CANONICAL: No external legacy link */}
        <section className="swor-section">
          <div className="mb-8">
            <div className="flex flex-wrap border-b border-[#1A2332]/10">
              <button
                onClick={() => setActiveTab('story')}
                className={`px-4 md:px-6 py-3 font-medium text-base transition-colors ${
                  activeTab === 'story'
                    ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                    : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                }`}
              >
                The Full Story
              </button>
              <button
                onClick={() => setActiveTab('redwoods')}
                className={`px-4 md:px-6 py-3 font-medium text-base transition-colors ${
                  activeTab === 'redwoods'
                    ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                    : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                }`}
              >
                The Redwoods Project
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-4 md:px-6 py-3 font-medium text-base transition-colors ${
                  activeTab === 'connections'
                    ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                    : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                }`}
              >
                Connections
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'story' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#1A2332]/5">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-[#B8826D] mr-3" />
                <h3 className="font-serif text-xl text-[#1A2332]">
                  The Canonical Journey
                </h3>
              </div>
              <div className="swor-longform">
                <p>
                  This is the complete, canonical record of Sue Dorrington's Rugby Journey on SWOR. 
                  All enrichment, collaboration, and future additions to this journey occur here, 
                  ensuring a single source of truth that can grow and deepen over time.
                </p>
                <p>
                  Sue's story represents the gold standard for how SWOR preserves and presents 
                  Rugby Journeys: with dignity, care, and respect for the individual and the 
                  communities that shaped them.
                </p>
              </div>
              <div className="mt-6 p-4 bg-[#F5F1E8] rounded-lg border border-[#1A2332]/5">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-[#8B9D83] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                      <span className="font-medium text-[#1A2332]">Stewardship:</span> SWOR holds 
                      stewardship of this journey. All future enrichment, Phase 3 activity, and 
                      collaboration occurs exclusively on this page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'redwoods' && (
            <div className="bg-[#8B9D83]/10 rounded-2xl p-6 md:p-8 border border-[#8B9D83]/20">
              <div className="flex items-center mb-6">
                <Leaf className="w-6 h-6 text-[#8B9D83] mr-3" />
                <h3 className="font-serif text-xl text-[#1A2332]">
                  Why This Story Matters Now
                </h3>
              </div>
              <div className="swor-longform">
                <p>
                  The Redwoods Project exists to preserve rugby's heritage before it is lost. Sue Dorrington's 
                  journey represents the gold standard for how SWOR approaches legacy preservation:
                </p>
              </div>
              <ul className="space-y-3 my-6">
                <li className="flex items-start text-[#1A2332]/80">
                  <span className="w-2 h-2 rounded-full bg-[#8B9D83] mt-2.5 mr-4 flex-shrink-0" />
                  <span className="text-base">Stories captured with care and respect</span>
                </li>
                <li className="flex items-start text-[#1A2332]/80">
                  <span className="w-2 h-2 rounded-full bg-[#8B9D83] mt-2.5 mr-4 flex-shrink-0" />
                  <span className="text-base">A single canonical source of truth maintained by SWOR</span>
                </li>
                <li className="flex items-start text-[#1A2332]/80">
                  <span className="w-2 h-2 rounded-full bg-[#8B9D83] mt-2.5 mr-4 flex-shrink-0" />
                  <span className="text-base">Connections to the wider rugby ecosystem maintained</span>
                </li>
                <li className="flex items-start text-[#1A2332]/80">
                  <span className="w-2 h-2 rounded-full bg-[#8B9D83] mt-2.5 mr-4 flex-shrink-0" />
                  <span className="text-base">Legacy protected for future generations</span>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('redwoods')}
                className="swor-btn-secondary inline-flex items-center"
              >
                Learn More About The Redwoods Project
              </button>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('moments')}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#1A2332]/5 text-left hover:shadow-md transition-shadow group"
              >
                <Users className="w-8 h-8 text-[#B8826D] mb-4" />
                <h3 className="font-medium text-[#1A2332] mb-2 group-hover:text-[#B8826D] transition-colors text-lg">
                  Women's Rugby
                </h3>
                <p className="text-base text-[#1A2332]/60">
                  Explore the history and moments of women's rugby that Sue helped shape.
                </p>
              </button>
              
              <button
                onClick={() => onNavigate('people')}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#1A2332]/5 text-left hover:shadow-md transition-shadow group"
              >
                <Heart className="w-8 h-8 text-[#8B9D83] mb-4" />
                <h3 className="font-medium text-[#1A2332] mb-2 group-hover:text-[#8B9D83] transition-colors text-lg">
                  Leadership
                </h3>
                <p className="text-base text-[#1A2332]/60">
                  Explore other leaders and volunteers who serve the game behind the scenes.
                </p>
              </button>
              
              <button
                onClick={() => onNavigate('clubs')}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#1A2332]/5 text-left hover:shadow-md transition-shadow group"
              >
                <Leaf className="w-8 h-8 text-[#1A2332] mb-4" />
                <h3 className="font-medium text-[#1A2332] mb-2 group-hover:text-[#1A2332]/70 transition-colors text-lg">
                  Grassroots Continuity
                </h3>
                <p className="text-base text-[#1A2332]/60">
                  Explore the clubs that carry forward the values Sue championed.
                </p>
              </button>
            </div>
          )}
        </section>

        {/* Closing Reflection */}
        <section className="swor-section">
          <div className="bg-white rounded-xl p-8 border border-[#1A2332]/10 text-center">
            <p className="font-serif text-xl md:text-2xl text-[#1A2332] italic leading-relaxed mb-4">
              "The game belongs to everyone who loves it."
            </p>
            <p className="text-[#1A2332]/60 text-base leading-relaxed">
              Sue Dorrington's story reminds us that rugby's greatest strength lies not in its stars, 
              but in the countless individuals who give their time, energy, and heart to the game. 
              Her legacy continues: in every match played, every hand extended, every door opened.
            </p>
          </div>
        </section>

        {/* ============================================
            PHASE 3 ACTIVATION MODULE
            Build out this Rugby Journey
            Collapsed by default, visible only to owner/stewards
            ============================================ */}
        <section className="swor-section">
          <Phase3Builder
            journeyId="sue-dorrington"
            journeyType="individual"
            journeyTitle={sueDorrington.name}
            onNavigate={onNavigate}
          />
        </section>


        {/* Collapsed Invitations Module - kept separate, lower prominence */}
        {isOwnerOrSteward && (
          <section className="swor-section">
            <div className="border border-[#1A2332]/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setInvitationsExpanded(!invitationsExpanded)}
                className="w-full flex items-center justify-between p-4 md:p-6 bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 transition-colors text-left"
              >
                <span className="text-[#1A2332]/70 text-base font-medium">
                  Invite others to contribute
                </span>
                {invitationsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#1A2332]/50" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#1A2332]/50" />
                )}
              </button>
              
              {invitationsExpanded && (
                <div className="p-4 md:p-6 bg-white border-t border-[#1A2332]/10 space-y-4">
                  <button
                    onClick={() => onNavigate('contribute')}
                    className="w-full flex items-center p-4 rounded-lg border border-[#1A2332]/10 hover:border-[#B8826D]/30 hover:bg-[#B8826D]/5 transition-colors text-left group"
                  >
                    <Mail className="w-5 h-5 text-[#B8826D] mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#1A2332] group-hover:text-[#B8826D] transition-colors">
                        Invite others to add context
                      </p>
                      <p className="text-sm text-[#1A2332]/60 mt-1">
                        Help enrich this journey with memories, photographs, or perspectives.
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => onNavigate('contribute')}
                    className="w-full flex items-center p-4 rounded-lg border border-[#1A2332]/10 hover:border-[#8B9D83]/30 hover:bg-[#8B9D83]/5 transition-colors text-left group"
                  >
                    <UserPlus className="w-5 h-5 text-[#8B9D83] mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#1A2332] group-hover:text-[#8B9D83] transition-colors">
                        Invite someone to begin their own Rugby Journey
                      </p>
                      <p className="text-sm text-[#1A2332]/60 mt-1">
                        Know someone whose story should be preserved? Share the invitation.
                      </p>
                    </div>
                  </button>

                  {/* Contribution rules */}
                  <div className="pt-4 border-t border-[#1A2332]/10">
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
            journeyId="sue-dorrington"
            journeyType="individual"
            isOwner={isOwner}
          />
        </section>

        {/* Footer Share */}

        <JourneyShare journeyTitle={sueDorrington.name} variant="footer" />

        {/* How Rugby Journeys Work */}
        <div className="text-center mt-12 pt-8 border-t border-[#1A2332]/10">
          <button
            onClick={() => onNavigate('how-it-works')}
            className="text-[#B8826D] hover:text-[#B8826D]/80 text-base font-medium transition-colors"
          >
            Read the full explainer: How Rugby Journeys Work on SWOR
          </button>
        </div>
      </div>
    </div>
  );
};

export default SueDorringtonPage;
