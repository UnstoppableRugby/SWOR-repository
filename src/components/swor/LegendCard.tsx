import React from 'react';
import { Legend } from '@/data/sworData';

interface LegendCardProps {
  legend: Legend;
  onClick: () => void;
}

const LegendCard: React.FC<LegendCardProps> = ({ legend, onClick }) => {
  const isFoundational = legend.isFoundational;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl bg-white w-full text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-[#1A2332]/10 ${
        isFoundational ? 'ring-2 ring-[#B8826D]/30' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={legend.image}
          alt={legend.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Foundational Journey Badge */}
        {isFoundational && (
          <div className="absolute top-3 left-3 bg-[#B8826D] px-2.5 py-1 rounded">
            <span className="text-xs font-medium text-[#F5F1E8] tracking-wide">
              Foundational Journey
            </span>
          </div>
        )}

        {/* Canonical Journey Indicator - replaces external legacy indicator */}
        {legend.isCanonical && (
          <div className="absolute top-3 right-3 bg-[#1A2332]/80 backdrop-blur-sm px-2.5 py-1 rounded">
            <span className="text-xs font-medium text-[#8B9D83]">Full Journey</span>
          </div>
        )}

      </div>
      
      {/* Content - Light background for readability */}
      <div className="p-5 md:p-6">
        {/* Journey type label */}
        <p className="text-xs md:text-sm text-[#B8826D] font-medium tracking-wide uppercase mb-2">
          Your Rugby Journey
        </p>
        
        {/* Name as primary heading */}
        <h3 className="font-serif text-lg md:text-xl text-[#1A2332] mb-2 group-hover:text-[#B8826D] transition-colors leading-tight">
          {legend.name}
        </h3>
        
        {/* Descriptors as derived labels - not structural headers */}
        {legend.descriptor && (
          <p className="text-sm md:text-base text-[#1A2332]/60 mb-3">
            {legend.descriptor}
          </p>
        )}
        
        {/* Country and era badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-block px-2.5 py-1 bg-[#B8826D]/10 text-[#B8826D] text-xs md:text-sm font-medium rounded">
            {legend.country}
          </span>
          <span className="inline-block px-2.5 py-1 bg-[#8B9D83]/10 text-[#8B9D83] text-xs md:text-sm font-medium rounded">
            {legend.era}
          </span>
        </div>
        
        {/* Summary preview */}
        <p className="text-sm md:text-base text-[#1A2332]/70 line-clamp-2 leading-relaxed">
          {legend.summary}
        </p>
        
        {/* Invitational CTA */}
        <p className="mt-4 text-sm md:text-base font-medium text-[#B8826D] group-hover:translate-x-1 transition-transform">
          Read this journey
        </p>
      </div>
    </button>
  );
};

export default LegendCard;
