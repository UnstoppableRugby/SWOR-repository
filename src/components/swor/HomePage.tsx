import React from 'react';
import HeroSection from './HeroSection';
import WhatIsSWOR from './WhatIsSWOR';
import WhyItMatters from './WhyItMatters';
import LegendsSection from './LegendsSection';
import ClubsSection from './ClubsSection';
import MomentsSection from './MomentsSection';
import RedwoodsSection from './RedwoodsSection';
import UnstoppableSection from './UnstoppableSection';
import JoinSection from './JoinSection';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div>
      <HeroSection
        onExplore={() => onNavigate('journeys')}
        onJoin={() => onNavigate('contribute')}
        onHowItWorks={() => onNavigate('how-it-works')}
      />
      <WhatIsSWOR onLearnMore={() => onNavigate('how-it-works')} />
      <WhyItMatters onLearnMore={() => onNavigate('redwoods')} />
      <LegendsSection
        onViewAll={() => onNavigate('journeys')}
        onSelectLegend={(id) => onNavigate(`journey-${id}`)}
      />

      <ClubsSection
        onViewAll={() => onNavigate('clubs')}
        onSelectClub={(id) => onNavigate(`club-${id}`)}
      />
      <MomentsSection
        onViewAll={() => onNavigate('moments')}
        onSelectMoment={(id) => onNavigate(`moment-${id}`)}
      />
      <RedwoodsSection onLearnMore={() => onNavigate('redwoods')} />
      <UnstoppableSection onJoin={() => onNavigate('unstoppable')} />
      <JoinSection 
        onSelectPath={(path) => onNavigate('contribute')} 
        onReadExplainer={() => onNavigate('how-it-works')}
      />
    </div>
  );
};

export default HomePage;
