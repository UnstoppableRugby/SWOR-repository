import React from 'react';
import { moments } from '@/data/sworData';
import MomentCard from './MomentCard';

interface MomentsSectionProps {
  onViewAll: () => void;
  onSelectMoment: (id: string) => void;
}

const MomentsSection: React.FC<MomentsSectionProps> = ({ onViewAll, onSelectMoment }) => {
  const featuredMoments = moments.slice(0, 3);

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-[#1A2332]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12">
          <div>
            <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4">
              The Journey of...
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F5F1E8] leading-tight">
              Moments & History
            </h2>
            <p className="text-[#F5F1E8]/70 mt-2 sm:mt-3 max-w-xl text-sm sm:text-base">
              The defining moments that shaped rugby. Each event acknowledges those who 
              made it possible – preserved with care for future generations.
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="mt-4 md:mt-0 text-[#B8826D] font-medium hover:text-[#B8826D]/80 transition-colors flex items-center text-sm sm:text-base min-h-[44px]"
          >
            Explore the archive
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Moments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {featuredMoments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onClick={() => onSelectMoment(moment.id)}
            />
          ))}
        </div>

        {/* Timeline Preview */}
        <div className="mt-12 sm:mt-16 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#F5F1E8]/20 hidden sm:block" />
          <div className="flex justify-start sm:justify-center items-center space-x-4 sm:space-x-8 overflow-x-auto py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {['1870s', '1900s', '1920s', '1950s', '1970s', '1990s', '2020s'].map((era, index) => (
              <button
                key={era}
                onClick={onViewAll}
                className="flex-shrink-0 group min-h-[44px] flex flex-col items-center justify-center"
              >
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#B8826D] group-hover:scale-125 transition-transform" />
                <span className="block mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#F5F1E8]/60 group-hover:text-[#F5F1E8] transition-colors">
                  {era}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

};

export default MomentsSection;
