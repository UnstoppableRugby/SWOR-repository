import React, { useState, useMemo } from 'react';
import { people } from '@/data/sworData';
import { BookOpen, ArrowLeftRight, Heart, Shield } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import JourneyShare from '../JourneyShare';
import ShareMeta from '../ShareMeta';
import ApprovedItemsSection from '../ApprovedItemsSection';
import ContributionPrompt from '../ContributionPrompt';
import JourneyCompare from '../JourneyCompare';
import CommendationsList from '../CommendationsList';
import CommendationForm from '../CommendationForm';
import CommendationReviewDashboard from '../CommendationReviewDashboard';
import JourneyIdentityHeader from '../JourneyIdentityHeader';
import ExploreNextSection from '../ExploreNextSection';
import MilestoneTimeline from '../MilestoneTimeline';


interface PersonDetailPageProps {
  personId: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const PersonDetailPage: React.FC<PersonDetailPageProps> = ({ personId, onBack, onNavigate }) => {
  const { user, isAuthenticated } = useAppContext();
  const [compareOpen, setCompareOpen] = useState(false);
  const [showCommendationForm, setShowCommendationForm] = useState(false);
  const [showCommendationReview, setShowCommendationReview] = useState(false);
  const [commendationsKey, setCommendationsKey] = useState(0);
  
  const actualId = personId.startsWith('person-') ? personId.replace('person-', '') : personId;
  const person = useMemo(() => people.find(p => p.id === actualId), [actualId]);

  // Check if current user is the profile owner
  const isOwner = isAuthenticated && user?.id === actualId;
  
  // Check if current user is a steward
  const isSteward = isAuthenticated && (user?.role === 'global_steward' || user?.role === 'journey_steward');

  const handleWriteCommendation = () => {
    setShowCommendationForm(true);
  };

  const handleCommendationSuccess = () => {
    setShowCommendationForm(false);
    setCommendationsKey(prev => prev + 1);
  };

  const handleRequestAuth = () => {
    setShowCommendationForm(false);
    onNavigate('join');
  };

  const handleNavigateToProfile = (profileId: string) => {
    onNavigate(`person-${profileId}`);
  };

  const handleResponseAdded = () => {
    setCommendationsKey(prev => prev + 1);
  };

  if (!person) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1A2332] mb-4">Journey Not Found</h1>
          <p className="text-[#1A2332]/70 mb-6 max-w-md mx-auto">
            The person you are looking for may have been moved or is no longer available.
          </p>
          <button onClick={onBack} className="swor-btn-primary">Back to People</button>
        </div>
      </div>
    );
  }

  // Prepare share metadata
  const shareDescription = person.contribution 
    ? person.contribution.slice(0, 160) + (person.contribution.length > 160 ? '...' : '')
    : `Discover the rugby journey of ${person.name} on Small World of Rugby.`;
  
  // Use profile image if available, otherwise use default
  const shareImage = person.image && !person.image.includes('placeholder') 
    ? person.image 
    : undefined;

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-20">
      {/* Open Graph Meta Tags */}
      <ShareMeta
        type="person"
        title={person.name}
        description={shareDescription}
        imageUrl={shareImage}
      />

      {/* Standardized Identity Header */}
      <JourneyIdentityHeader
        type="person"
        name={person.name}
        country={person.country}
        era={person.years}
        subtitle={person.club}
        roles={person.roles}
        heroImage={person.image}
        onBack={onBack}
        backLabel="Back to People"
      >
        {/* Steward Review Access */}
        {isSteward && (
          <div className="mt-4 sm:mt-6">
            <button
              onClick={() => setShowCommendationReview(true)}
              className="inline-flex items-center px-4 py-2.5 bg-[#8B9D83] text-white rounded-lg text-sm font-medium hover:bg-[#8B9D83]/90 transition-colors min-h-[44px]"
            >
              <Shield className="w-4 h-4 mr-2" />
              Review Commendations
            </button>
          </div>
        )}
      </JourneyIdentityHeader>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Contribution Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-4 sm:mb-6">Contribution</h2>
          <p className="text-[#1A2332]/80 leading-relaxed text-base sm:text-lg">{person.contribution}</p>
        </section>

        {/* PATCH G.2: Milestone Timeline */}
        <section className="mb-8 sm:mb-10">
          <MilestoneTimeline
            profileId={actualId}
            profileName={person.name}
            isOwner={isOwner}
            isSteward={isSteward}
            onNavigate={onNavigate}
          />
        </section>

        {/* Archive & Materials Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-4 sm:mb-6">Archive & Materials</h2>
          <ApprovedItemsSection 
            journeyId={actualId} 
            journeyTitle={person.name} 
            viewerUserId={user?.id || null} 
            viewerRelationship={null}
            isSteward={isSteward}
            isOwner={isOwner}
            onNavigate={onNavigate}
          />

          <div className="mt-6">
            <ContributionPrompt onContribute={() => onNavigate('contribute')} variant="card" />
          </div>
        </section>


        {/* Commendations & Experiences Section */}
        <section className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332]">Commendations & Experiences</h2>
          </div>
          
          {/* Commendations List */}
          <CommendationsList 
            key={commendationsKey}
            profileId={actualId}
            profileName={person.name}
            onNavigateToProfile={handleNavigateToProfile}
            variant="recipient"
            maxInitialDisplay={3}
            isOwner={isOwner}
            ownerUserId={user?.id}
            onResponseAdded={handleResponseAdded}
          />

          {/* Write a Commendation CTA */}
          <div className="mt-6 bg-white rounded-xl border border-[#1A2332]/10 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#B8826D]/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-[#B8826D]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[#1A2332] mb-1 text-base sm:text-lg">Share your experience</h3>
                <p className="text-sm text-[#1A2332]/60 mb-4 leading-relaxed">
                  Did you know {person.name}? Share a commendation about their contribution, character, or impact on your journey.
                </p>
                <button
                  onClick={handleWriteCommendation}
                  className="inline-flex items-center px-5 py-2.5 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors min-h-[44px]"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Write a commendation
                </button>
                <p className="text-xs text-[#1A2332]/40 mt-3">
                  All commendations are reviewed before appearing publicly. No ratings or stars.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compare Journey */}
        <button 
          onClick={() => setCompareOpen(true)} 
          className="w-full flex items-center justify-center p-4 bg-white rounded-xl border border-[#1A2332]/10 mb-8 sm:mb-10 hover:border-[#B8826D]/30 transition-colors min-h-[56px]"
        >
          <ArrowLeftRight className="w-5 h-5 text-[#B8826D] mr-3" />
          <span className="text-[#1A2332]/70 text-sm sm:text-base">Compare with another journey</span>
        </button>

        {/* PATCH H.1: Enhanced Share Section */}
        <section className="mb-8 sm:mb-10">
          <JourneyShare 
            journeyTitle={person.name} 
            journeyDescription={shareDescription}
            variant="section" 
          />
        </section>

        {/* Legacy Footer Share (kept for continuity) */}
        <JourneyShare journeyTitle={person.name} variant="footer" />

        {/* How It Works Link */}
        <div className="text-center mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[#1A2332]/10">
          <button 
            onClick={() => onNavigate('how-it-works')} 
            className="inline-flex items-center text-[#B8826D] font-medium hover:text-[#B8826D]/80 transition-colors min-h-[44px] text-sm sm:text-base"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            How Rugby Journeys Work on SWOR
          </button>
        </div>

        {/* Explore Next Section */}
        <ExploreNextSection
          currentType="person"
          currentId={actualId}
          currentCountry={person.country}
          onNavigate={onNavigate}
        />
      </div>

      {/* Journey Compare Modal */}
      <JourneyCompare 
        isOpen={compareOpen} 
        onClose={() => setCompareOpen(false)} 
        initialJourneyId={actualId} 
        onNavigate={onNavigate} 
      />

      {/* Commendation Form Modal */}
      {showCommendationForm && (
        <CommendationForm
          profileId={actualId}
          profileName={person.name}
          onClose={() => setShowCommendationForm(false)}
          onSuccess={handleCommendationSuccess}
          onRequestAuth={handleRequestAuth}
        />
      )}

      {/* Commendation Review Dashboard (Stewards Only) */}
      {showCommendationReview && (
        <CommendationReviewDashboard
          isOpen={showCommendationReview}
          onClose={() => setShowCommendationReview(false)}
          stewardUserId={user?.id}
          stewardName={user?.name || user?.email}
          onNavigateToProfile={handleNavigateToProfile}
        />
      )}
    </div>
  );
};

export default PersonDetailPage;
