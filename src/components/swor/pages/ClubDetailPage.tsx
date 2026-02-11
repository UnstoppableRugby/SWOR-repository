import React, { useState, useMemo } from 'react';
import { clubs } from '@/data/sworData';
import { BookOpen, ArrowLeftRight } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import JourneyShare from '../JourneyShare';
import ShareMeta from '../ShareMeta';
import ApprovedItemsSection from '../ApprovedItemsSection';
import ContributionPrompt from '../ContributionPrompt';
import JourneyCompare from '../JourneyCompare';
import JourneyIdentityHeader from '../JourneyIdentityHeader';
import ExploreNextSection from '../ExploreNextSection';

interface ClubDetailPageProps {
  clubId: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const ClubDetailPage: React.FC<ClubDetailPageProps> = ({ clubId, onBack, onNavigate }) => {
  const { user, isAuthenticated } = useAppContext();
  const [compareOpen, setCompareOpen] = useState(false);
  
  const actualId = clubId.startsWith('club-') ? clubId.replace('club-', '') : clubId;
  const club = useMemo(() => clubs.find(c => c.id === actualId), [actualId]);

  const isSteward = isAuthenticated && (user?.role === 'global_steward' || user?.role === 'journey_steward');


  if (!club) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1A2332] mb-4">Club Not Found</h1>
          <p className="text-base sm:text-lg text-[#1A2332]/70 mb-6 max-w-md mx-auto">
            The club you are looking for may have been moved or is no longer available.
          </p>
          <button onClick={onBack} className="swor-btn-primary">
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  const acknowledgements = club.acknowledgements || [];

  // Prepare share metadata
  const shareDescription = club.summary 
    ? club.summary.slice(0, 160) + (club.summary.length > 160 ? '...' : '')
    : `Discover the rugby journey of ${club.name} on Small World of Rugby.`;
  
  // Use club image if available, otherwise use default
  const shareImage = club.image && !club.image.includes('placeholder') 
    ? club.image 
    : undefined;

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-20">
      {/* Open Graph Meta Tags */}
      <ShareMeta
        type="club"
        title={club.name}
        description={shareDescription}
        imageUrl={shareImage}
      />

      {/* Standardized Identity Header */}
      <JourneyIdentityHeader
        type="club"
        name={club.name}
        country={club.country}
        era={`Est. ${club.founded}`}
        subtitle={`${club.location} - ${club.members} members`}
        heroImage={club.image}
        onBack={onBack}
        backLabel="Back to Clubs"
      />

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* About Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-4 sm:mb-6">About</h2>
          <p className="text-[#1A2332]/80 leading-relaxed text-base sm:text-lg">{club.summary}</p>
        </section>

        {/* Acknowledgements Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-4 sm:mb-6">Acknowledgements</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#1A2332]/10">
            {acknowledgements.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {acknowledgements.map((ack, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] mt-2 mr-3 flex-shrink-0" />
                    <span className="text-[#1A2332]/70 text-sm sm:text-base">{ack}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#1A2332]/70 mb-4 text-sm sm:text-base">
                This journey was made possible by generations of players, volunteers, and communities.
              </p>
            )}
            <p className="text-xs sm:text-sm text-[#1A2332]/50 italic border-t border-[#1A2332]/10 pt-4">
              Acknowledgement does not imply endorsement.
            </p>
          </div>
        </section>

        {/* Archive & Materials Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-4 sm:mb-6">Archive & Materials</h2>
          <ApprovedItemsSection 
            journeyId={actualId} 
            journeyTitle={club.name} 
            viewerUserId={null} 
            viewerRelationship={null} 
          />
          <div className="mt-6">
            <ContributionPrompt onContribute={() => onNavigate('contribute')} variant="card" />
          </div>
        </section>

        {/* Compare Journey Button */}
        <button 
          onClick={() => setCompareOpen(true)} 
          className="w-full flex items-center justify-center p-4 bg-white rounded-xl border border-[#1A2332]/10 hover:border-[#8B9D83]/30 transition-colors mb-8 sm:mb-10 min-h-[56px]"
        >
          <ArrowLeftRight className="w-5 h-5 text-[#8B9D83] mr-3" />
          <span className="text-[#1A2332] font-medium text-sm sm:text-base">Compare with another journey</span>
        </button>

        {/* PATCH H.1: Enhanced Share Section */}
        <section className="mb-8 sm:mb-10">
          <JourneyShare 
            journeyTitle={club.name} 
            journeyDescription={shareDescription}
            variant="section" 
          />
        </section>

        {/* Legacy Footer Share (kept for continuity) */}
        <JourneyShare journeyTitle={club.name} variant="footer" />
        
        {/* How It Works Link */}
        <div className="text-center mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-[#1A2332]/10">
          <button 
            onClick={() => onNavigate('how-it-works')} 
            className="inline-flex items-center text-[#B8826D] hover:text-[#B8826D]/80 font-medium text-sm sm:text-base min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            How Rugby Journeys Work on SWOR
          </button>
        </div>

        {/* Explore Next Section */}
        <ExploreNextSection
          currentType="club"
          currentId={actualId}
          currentCountry={club.country}
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
    </div>
  );
};

export default ClubDetailPage;
