import React from 'react';
import { rugbyJourneys, sueDorrington } from '@/data/sworData';
import LegendCard from './LegendCard';

interface LegendsSectionProps {
  onViewAll: () => void;
  onSelectLegend: (id: string) => void;
}

const LegendsSection: React.FC<LegendsSectionProps> = ({ onViewAll, onSelectLegend }) => {
  // Feature Sue Dorrington first, then other journeys
  // Convert to legend format for LegendCard compatibility
  const featuredJourneys = rugbyJourneys.slice(0, 4).map(journey => ({
    ...journey,
    position: journey.roles[1] || journey.roles[0],
    caps: 0,
    descriptor: journey.descriptors?.join(' · '),
  }));

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12">
          <div>
            <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4">
              Rugby Journeys
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1A2332] leading-tight">
              Your Rugby Journey
            </h2>
            <p className="text-[#1A2332]/70 mt-2 sm:mt-3 max-w-xl text-sm sm:text-base">
              Players, pioneers, coaches, and stewards – their journeys preserved for generations to come. 
              Every journey acknowledges those who made it possible.
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="mt-4 md:mt-0 text-[#B8826D] font-medium hover:text-[#B8826D]/80 transition-colors flex items-center text-sm sm:text-base min-h-[44px]"
          >
            Explore all journeys
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Journeys Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredJourneys.map((journey) => (
            <LegendCard
              key={journey.id}
              legend={journey}
              onClick={() => onSelectLegend(journey.id)}
            />
          ))}
        </div>

        {/* Featured Quote - Sue Dorrington */}
        <div className="mt-12 sm:mt-16 bg-[#1A2332] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-4 sm:mb-6 overflow-hidden ring-2 ring-[#B8826D]/30">
              <img
                src={sueDorrington.image}
                alt={sueDorrington.name}
                className="w-full h-full object-cover"
              />
            </div>
            <blockquote className="font-serif text-lg sm:text-xl md:text-2xl text-[#F5F1E8] italic leading-relaxed mb-4 sm:mb-6">
              "{sueDorrington.quote}"
            </blockquote>
            <cite className="text-[#B8826D] font-medium not-italic text-sm sm:text-base">
              {sueDorrington.name}
            </cite>
            <p className="text-[#F5F1E8]/60 text-xs sm:text-sm mt-1">
              {sueDorrington.descriptors?.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );

};

export default LegendsSection;
