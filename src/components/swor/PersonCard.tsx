import React from 'react';
import { Person } from '@/data/sworData';
import { Star } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  onClick: () => void;
  featuredImage?: string;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, onClick, featuredImage }) => {
  // Use featured image if available, otherwise fall back to person's default image
  const displayImage = featuredImage || person.image;
  
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-white w-full text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-[#1A2332]/10 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-1/3 aspect-square sm:aspect-auto overflow-hidden relative">
          <img
            src={displayImage}
            alt={person.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Featured image indicator */}
          {featuredImage && (
            <div className="absolute top-2 left-2 flex items-center px-2 py-1 bg-[#B8826D]/90 text-white text-[10px] font-medium rounded backdrop-blur-sm">
              <Star className="w-3 h-3 mr-1 fill-current" aria-hidden="true" />
              Featured
            </div>
          )}
        </div>
        
        {/* Content - Light background for readability */}
        <div className="sm:w-2/3 p-5 md:p-6">
          {/* Journey type label */}
          <p className="text-xs md:text-sm text-[#B8826D] font-medium tracking-wide uppercase mb-2">
            Your Rugby Journey
          </p>
          
          {/* Name as primary heading */}
          <h3 className="font-serif text-lg md:text-xl text-[#1A2332] mb-2 group-hover:text-[#B8826D] transition-colors leading-tight">
            {person.name}
          </h3>
          
          {/* Roles as derived descriptors - not structural headers */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {person.roles.map((role, index) => (
              <span 
                key={index}
                className="inline-block px-2 py-0.5 bg-[#B8826D]/10 text-[#B8826D] text-xs md:text-sm font-medium rounded"
              >
                {role}
              </span>
            ))}
          </div>
          
          {/* Club and country */}
          <p className="text-sm md:text-base text-[#1A2332]/60 mb-3">
            {person.club} · {person.country}
          </p>
          
          {/* Contribution summary */}
          <p className="text-sm md:text-base text-[#1A2332]/70 line-clamp-2 mb-4 leading-relaxed">
            {person.contribution}
          </p>
          
          {/* Footer with years and CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1A2332]/10">
            <span className="text-xs md:text-sm text-[#8B9D83] font-medium">{person.years}</span>
            <span className="text-sm md:text-base font-medium text-[#B8826D] group-hover:translate-x-1 transition-transform">
              Read this journey
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default PersonCard;
