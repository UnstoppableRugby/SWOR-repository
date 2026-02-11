import React, { useState } from 'react';
import { harryRoberts, harryRobertsConfig } from '@/data/sworData';
import { ArrowLeft, Users, Heart, Quote, ChevronDown, ChevronUp, Mail, UserPlus, Shield, BookOpen, Award, MessageCircle, Lightbulb, Zap } from 'lucide-react';
import JourneyShare from '../JourneyShare';
import JourneySettings from '../JourneySettings';
import Phase3Builder from '../Phase3Builder';
import ApprovedItemsSection from '../ApprovedItemsSection';
import ApprovedContributions from '../ApprovedContributions';
import { useAppContext } from '@/contexts/AppContext';


interface HarryRobertsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

// HARRY ROBERTS - SWOR RUGBY JOURNEY
// Created directly on SWOR using authoritative source inputs.
// Phase 3 activated as exemplar living connector journey.
// No migration required - this is the original canonical version.

// PER-JOURNEY OVERRIDE PATCH APPLIED:
// - Phase 3 used as live trial
// - Intake-first workflow
// - Memory reuse validation
// - Phase 3 visible only to owner/stewards
// - Created directly on SWOR (no legacy page)

const HarryRobertsPage: React.FC<HarryRobertsPageProps> = ({ onBack, onNavigate }) => {
  const { user, checkJourneyOwnership } = useAppContext();
  const [activeTab, setActiveTab] = useState<'insights' | 'connections' | 'values'>('insights');
  const [invitationsExpanded, setInvitationsExpanded] = useState(false);
  
  // Check if current user is owner/steward of this journey
  const journeyOwnership = checkJourneyOwnership('harry-roberts');
  const isOwner = journeyOwnership.isOwner;
  const isOwnerOrSteward = journeyOwnership.isOwner || journeyOwnership.isSteward;


  // Harry's curated insights / reflections - preserved original wording
  const insights = [
    {
      title: 'On Connection',
      text: 'Rugby gave me a language before I had the words. It taught me that showing up matters more than standing out, and that the strongest bonds are forged in shared struggle.',
    },
    {
      title: 'On Coaching',
      text: 'Coaching isn\'t about what you know. It\'s about what you notice. The best coaches I\'ve known were the ones who saw something in me before I saw it myself.',
    },
    {
      title: 'On Values',
      text: 'The values of rugby aren\'t unique to rugby. They\'re human values that rugby happens to teach well: respect, discipline, solidarity, integrity. The game is just the classroom.',
    },
    {
      title: 'On Community',
      text: 'Every club I\'ve been part of was held together by people who never played a minute but gave everything. The game belongs to them as much as anyone.',
    },
  ];

  return (

    <div className="min-h-screen bg-[#F5F1E8] pt-24">
      {/* Hero Section */}
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
                src={harryRoberts.image}
                alt={harryRoberts.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <p className="text-[#B8826D] text-sm md:text-base font-medium tracking-widest uppercase mb-4">
                {harryRobertsConfig.framingTitle}
              </p>
              
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#F5F1E8] mb-4 leading-tight">
                {harryRoberts.name}
              </h1>
              
              {/* Descriptors as derived labels */}
              <p className="text-lg md:text-xl text-[#B8826D]/90 font-medium mb-6">
                {harryRobertsConfig.descriptors.join(' · ')}
              </p>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-block px-4 py-2 bg-[#B8826D] text-[#F5F1E8] text-sm font-medium rounded-lg">
                  {harryRoberts.country}
                </span>
                <span className="inline-block px-4 py-2 bg-[#8B9D83] text-[#F5F1E8] text-sm font-medium rounded-lg">
                  {harryRoberts.era}
                </span>
                <span className="inline-block px-4 py-2 bg-[#1A2332] border border-[#B8826D]/50 text-[#B8826D] text-xs font-medium rounded-lg">
                  Foundational Journey
                </span>
              </div>

              {/* Multiple concurrent roles - no hierarchy, no ranking */}
              <div className="flex flex-wrap gap-2">
                {harryRoberts.roles.map((role, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-[#F5F1E8]/10 border border-[#F5F1E8]/20 text-[#F5F1E8]/80 text-sm rounded-lg"
                  >
                    <Award className="w-3.5 h-3.5 mr-1.5" />
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        
        {/* Inline Share */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 pb-8 border-b border-[#1A2332]/10 gap-4">
          <p className="text-base text-[#1A2332]/60">
            Share this Rugby Journey with family, friends, or community.
          </p>
          <JourneyShare journeyTitle={harryRoberts.name} variant="inline" />
        </div>

        {/* Narrative Introduction - Complete and standalone (Phase 1 Protected) */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">A Journey of Connection</h2>
          <div className="swor-longform">
            <p>
              Harry Roberts doesn't measure his rugby journey in caps, tries, or trophies. He measures it in 
              connections: the teammates who became brothers, the young players who found their confidence, 
              the communities that discovered rugby could be more than a game.
            </p>
            <p>
              His journey began like many others: a young player learning the basics at a local club, 
              discovering that the pitch was a place where he belonged. But what set Harry apart was 
              never his speed or his strength. It was his ability to see the game as a vehicle for 
              something larger: bringing people together.
            </p>
            <p>
              From playing to coaching, from coaching to connecting, Harry's path has been one of 
              continuous evolution. He understood early that rugby's greatest gift isn't what happens 
              on the field, but what it enables off it: friendships that span decades, values that 
              shape character, communities that support each other through life's challenges.
            </p>
          </div>
        </section>

        {/* Quote */}
        {harryRoberts.quote && (
          <section className="swor-section">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-[#1A2332]/5">
              <Quote className="w-8 h-8 text-[#B8826D] mb-4" />
              <blockquote className="font-serif text-xl md:text-2xl text-[#1A2332] italic leading-relaxed mb-4">
                "{harryRoberts.quote}"
              </blockquote>
              <cite className="text-[#B8826D] font-medium not-italic text-base">
                – {harryRoberts.name}

              </cite>
            </div>
          </section>
        )}

        {/* The Connector's Path */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">The Connector's Path</h2>
          <div className="swor-longform">
            <p>
              Harry's roles have never been sequential: they've been concurrent. While coaching youth teams, 
              he was building bridges between clubs. While advocating for rugby's values, he was mentoring 
              coaches who would carry those values forward. This is the nature of a connector: multiple 
              threads woven together, each strengthening the others.
            </p>
          </div>
          <ul className="space-y-4 mt-6">
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                <strong>As a Player:</strong> Learned that the best teams are built on trust, not talent alone
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                <strong>As a Coach:</strong> Discovered that developing people matters more than winning games
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                <strong>As a Connector:</strong> Realised that rugby's true power lies in the relationships it creates
              </span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-[#B8826D] mt-3 mr-4 flex-shrink-0" />
              <span className="text-[#1A2332]/80 text-lg leading-relaxed">
                <strong>As an Advocate:</strong> Committed to ensuring rugby's values reach beyond the game itself
              </span>
            </li>
          </ul>
        </section>

        {/* Acknowledgements - Mandatory */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">Acknowledgements</h2>
          <div className="bg-white rounded-xl p-6 md:p-8 border border-[#1A2332]/10">
            <p className="text-[#1A2332]/80 leading-relaxed text-lg mb-6">
              Harry's journey was made possible by the support of countless individuals, clubs, and communities:
            </p>
            <ul className="space-y-3 mb-6">
              {harryRoberts.acknowledgements?.map((ack, index) => (
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

        {/* ============================================
            PHASE 4: APPROVED ITEMS SECTION
            Display approved content publicly with attribution
            Only shows items with status='approved' and appropriate visibility
            ============================================ */}
        <section className="swor-section">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332] mb-6">Archive & Materials</h2>
          <ApprovedItemsSection
            journeyId="harry-roberts"
            journeyTitle={harryRoberts.name}
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
            journeyId="harry-roberts"
            journeyTitle={harryRoberts.name}
            isCollective={false}
          />
        </section>


        {/* Tabs - Insights, Connections, Values */}
        <section className="swor-section">
          <div className="mb-8">
            <div className="flex flex-wrap border-b border-[#1A2332]/10">
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-4 md:px-6 py-3 font-medium text-base transition-colors ${
                  activeTab === 'insights'
                    ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                    : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                }`}
              >
                Insights & Reflections
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
              <button
                onClick={() => setActiveTab('values')}
                className={`px-4 md:px-6 py-3 font-medium text-base transition-colors ${
                  activeTab === 'values'
                    ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                    : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                }`}
              >
                Rugby Values
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Insights preserved with original wording */}
              {insights.map((insight, index) => (
                <div key={index} className="bg-white rounded-xl p-6 border border-[#1A2332]/5">
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-[#B8826D] mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-[#1A2332] text-lg mb-2">{insight.title}</h3>
                      <p className="text-[#1A2332]/70 leading-relaxed">{insight.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('clubs')}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#1A2332]/5 text-left hover:shadow-md transition-shadow group"
              >
                <Users className="w-8 h-8 text-[#B8826D] mb-4" />
                <h3 className="font-medium text-[#1A2332] mb-2 group-hover:text-[#B8826D] transition-colors text-lg">
                  Clubs & Communities
                </h3>
                <p className="text-base text-[#1A2332]/60">
                  Explore the clubs and communities that form rugby's grassroots network.
                </p>
              </button>
              
              <button
                onClick={() => onNavigate('people')}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#1A2332]/5 text-left hover:shadow-md transition-shadow group"
              >
                <Heart className="w-8 h-8 text-[#8B9D83] mb-4" />
                <h3 className="font-medium text-[#1A2332] mb-2 group-hover:text-[#8B9D83] transition-colors text-lg">
                  People of the Game
                </h3>
                <p className="text-base text-[#1A2332]/60">
                  Meet the coaches, volunteers, and stewards who make rugby possible.
                </p>
              </button>
              
              <button
                onClick={() => onNavigate('journeys')}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#1A2332]/5 text-left hover:shadow-md transition-shadow group"
              >
                <MessageCircle className="w-8 h-8 text-[#1A2332] mb-4" />
                <h3 className="font-medium text-[#1A2332] mb-2 group-hover:text-[#1A2332]/70 transition-colors text-lg">
                  Other Journeys
                </h3>
                <p className="text-base text-[#1A2332]/60">
                  Discover more Rugby Journeys preserved on SWOR.
                </p>
              </button>
            </div>
          )}

          {activeTab === 'values' && (
            <div className="bg-[#8B9D83]/10 rounded-2xl p-6 md:p-8 border border-[#8B9D83]/20">
              <h3 className="font-serif text-xl text-[#1A2332] mb-6">The Values That Matter</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-5">
                  <h4 className="font-medium text-[#1A2332] mb-2">Respect</h4>
                  <p className="text-sm text-[#1A2332]/60">For teammates, opponents, officials, and the game itself.</p>
                </div>
                <div className="bg-white rounded-lg p-5">
                  <h4 className="font-medium text-[#1A2332] mb-2">Discipline</h4>
                  <p className="text-sm text-[#1A2332]/60">The foundation of trust and the basis of teamwork.</p>
                </div>
                <div className="bg-white rounded-lg p-5">
                  <h4 className="font-medium text-[#1A2332] mb-2">Solidarity</h4>
                  <p className="text-sm text-[#1A2332]/60">Standing together through challenge and celebration.</p>
                </div>
                <div className="bg-white rounded-lg p-5">
                  <h4 className="font-medium text-[#1A2332] mb-2">Integrity</h4>
                  <p className="text-sm text-[#1A2332]/60">Doing what's right, even when no one is watching.</p>
                </div>
              </div>
              <p className="text-[#1A2332]/60 text-sm mt-6 italic">
                "These values aren't unique to rugby. They're human values that rugby happens to teach well."
              </p>
            </div>
          )}
        </section>

        {/* Closing Reflection */}
        <section className="swor-section">
          <div className="bg-white rounded-xl p-8 border border-[#1A2332]/10 text-center">
            <p className="font-serif text-xl md:text-2xl text-[#1A2332] italic leading-relaxed mb-4">
              "Rugby is the excuse. Connection is the reason."
            </p>
            <p className="text-[#1A2332]/60 text-base leading-relaxed">
              Harry Roberts' story reminds us that the game's greatest impact often happens off the field: 
              in the friendships formed, the values instilled, and the communities strengthened. His journey 
              continues, and so do the connections he helps create.
            </p>
          </div>
        </section>

        {/* Live Trial Indicator - Harry-specific */}
        {isOwnerOrSteward && (
          <section className="swor-section">
            <div className="bg-[#B8826D]/10 rounded-xl p-5 border border-[#B8826D]/20">
              <div className="flex items-start">
                <Zap className="w-5 h-5 text-[#B8826D] mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                    <span className="font-medium text-[#1A2332]">Live Trial:</span> This journey is being used 
                    to test Phase 3 intake workflows and memory reuse validation. All contributions are processed 
                    through the intake-first workflow.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================
            PHASE 3 ACTIVATION MODULE
            Build out this Rugby Journey
            Collapsed by default, visible only to owner/stewards
            ============================================ */}
        <section className="swor-section">
          <Phase3Builder
            journeyId="harry-roberts"
            journeyType="individual"
            journeyTitle={harryRoberts.name}
            onNavigate={onNavigate}
          />
        </section>


        {/* Collapsed Invitations Module - visible only to owner/stewards */}
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
            journeyId="harry-roberts"
            journeyType="individual"
            isOwner={isOwner}
          />
        </section>

        {/* Footer Share */}
        <JourneyShare journeyTitle={harryRoberts.name} variant="footer" />

        {/* How Rugby Journeys Work */}
        <div className="text-center mt-12 pt-8 border-t border-[#1A2332]/10">
          <button
            onClick={() => onNavigate('how-it-works')}
            className="inline-flex items-center text-[#B8826D] hover:text-[#B8826D]/80 text-base font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Read the full explainer: How Rugby Journeys Work on SWOR
          </button>
        </div>
      </div>
    </div>
  );
};

export default HarryRobertsPage;
