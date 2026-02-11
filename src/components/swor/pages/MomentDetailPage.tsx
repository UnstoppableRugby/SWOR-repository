import React, { useState, useMemo } from 'react';
import { moments } from '@/data/sworData';
import { useAppContext } from '@/contexts/AppContext';

import { BookOpen, ArrowLeftRight } from 'lucide-react';
import JourneyShare from '../JourneyShare';
import ShareMeta from '../ShareMeta';
import ApprovedItemsSection from '../ApprovedItemsSection';
import ContributionPrompt from '../ContributionPrompt';
import JourneyCompare from '../JourneyCompare';
import JourneyIdentityHeader from '../JourneyIdentityHeader';
import ExploreNextSection from '../ExploreNextSection';

interface MomentDetailPageProps {
  momentId: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const MomentDetailPage: React.FC<MomentDetailPageProps> = ({ momentId, onBack, onNavigate }) => {
  const { user, isAuthenticated } = useAppContext();
  const [compareOpen, setCompareOpen] = useState(false);
  const actualId = momentId.startsWith('moment-') ? momentId.replace('moment-', '') : momentId;
  const moment = useMemo(() => moments.find(m => m.id === actualId), [actualId]);

  // Check steward/owner status
  const isSteward = isAuthenticated && (user?.role === 'global_steward' || user?.role === 'journey_steward');
  const isOwner = false; // Moments are collective - no single owner


  if (!moment) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1A2332] mb-4">Moment Not Found</h1>
          <p className="text-[#1A2332]/70 mb-6 max-w-md mx-auto">
            The moment you are looking for may have been moved or is no longer available.
          </p>
          <button onClick={onBack} className="swor-btn-primary">Back to Moments</button>
        </div>
      </div>
    );
  }

  // Prepare share metadata
  const shareDescription = moment.description 
    ? moment.description.slice(0, 160) + (moment.description.length > 160 ? '...' : '')
    : `Discover this historic rugby moment from ${moment.year} on Small World of Rugby.`;
  
  // Use moment image if available, otherwise use default
  const shareImage = moment.image && !moment.image.includes('placeholder') 
    ? moment.image 
    : undefined;

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-20">
      {/* Open Graph Meta Tags */}
      <ShareMeta
        type="moment"
        title={moment.title}
        description={shareDescription}
        imageUrl={shareImage}
      />

      {/* Standardized Identity Header */}
      <JourneyIdentityHeader
        type="moment"
        name={moment.title}
        country={moment.country}
        era={`${moment.year}`}
        roles={[moment.theme]}
        heroImage={moment.image}
        onBack={onBack}
        backLabel="Back to Moments"
      />

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* The Story Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-4 sm:mb-6">The Story</h2>
          <p className="text-[#1A2332]/80 leading-relaxed text-base sm:text-lg">{moment.description}</p>
        </section>

        {/* Archive & Materials Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-4 sm:mb-6">Archive & Materials</h2>
          <ApprovedItemsSection 
            journeyId={actualId} 
            journeyTitle={moment.title} 
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

        {/* Compare Journey Button */}
        <button 
          onClick={() => setCompareOpen(true)} 
          className="w-full flex items-center justify-center p-4 bg-white rounded-xl border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors mb-8 sm:mb-10 min-h-[56px]"
        >
          <ArrowLeftRight className="w-5 h-5 text-[#B8826D] mr-3" />
          <span className="text-[#1A2332]/70 text-sm sm:text-base">Compare with another journey</span>
        </button>

        {/* PATCH H.1: Enhanced Share Section */}
        <section className="mb-8 sm:mb-10">
          <JourneyShare 
            journeyTitle={moment.title} 
            journeyDescription={shareDescription}
            variant="section" 
          />
        </section>

        {/* Legacy Footer Share (kept for continuity) */}
        <JourneyShare journeyTitle={moment.title} variant="footer" />

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
          currentType="moment"
          currentId={actualId}
          currentCountry={moment.country}
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

export default MomentDetailPage;
