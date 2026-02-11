import React from 'react';
import { clubs } from '@/data/sworData';
import ClubCard from './ClubCard';

interface ClubsSectionProps {
  onViewAll: () => void;
  onSelectClub: (id: string) => void;
}

const ClubsSection: React.FC<ClubsSectionProps> = ({ onViewAll, onSelectClub }) => {
  const featuredClubs = clubs.slice(0, 3);

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12">
          <div>
            <p className="text-[#8B9D83] text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4">
              Our Rugby Journey
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1A2332] leading-tight">
              Clubs & Communities
            </h2>
            <p className="text-[#1A2332]/70 mt-2 sm:mt-3 max-w-xl text-sm sm:text-base">
              The beating hearts of rugby. Each club's journey is collective – shaped by 
              generations of players, volunteers, and supporters.
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="mt-4 md:mt-0 text-[#8B9D83] font-medium hover:text-[#8B9D83]/80 transition-colors flex items-center text-sm sm:text-base min-h-[44px]"
          >
            Explore all clubs
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {featuredClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onClick={() => onSelectClub(club.id)}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="inline-block bg-[#F5F1E8] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 w-full sm:w-auto">
            <h3 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-3 sm:mb-4">
              Is your club part of rugby's story?
            </h3>
            <p className="text-[#1A2332]/70 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
              Connect your club's journey to the global rugby family. 
              Preserve your heritage for future generations.
            </p>
            <button
              onClick={onViewAll}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#8B9D83] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#8B9D83]/90 transition-all duration-300 text-sm sm:text-base min-h-[44px]"
            >
              Contribute Your Club's Journey
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};


export default ClubsSection;
