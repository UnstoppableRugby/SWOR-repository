import React from 'react';
import { Club } from '@/data/sworData';
import { MapPin, Calendar, Users } from 'lucide-react';

interface ClubCardProps {
  club: Club;
  onClick: () => void;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-white w-full text-left transition-all duration-300 hover:shadow-lg border border-[#1A2332]/5"
    >
      {/* Phase 3 Indicator - subtle badge for clubs with Phase 3 activated */}
      {club.hasPhase3 && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-1 bg-[#8B9D83]/90 text-white text-xs font-medium rounded">
            Phase 3
          </span>
        </div>
      )}
      
      {/* Image */}
      <div className="aspect-[3/2] overflow-hidden bg-[#8B9D83]/10">
        <img
          src={club.image}
          alt={club.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      
      {/* Content */}
      <div className="p-5 md:p-6">
        {/* Journey Type Label */}
        <p className="text-[#8B9D83] text-xs font-medium tracking-widest uppercase mb-3">
          Our Rugby Journey
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block px-2.5 py-1 bg-[#8B9D83]/10 text-[#8B9D83] text-sm font-medium rounded">
            {club.country}
          </span>
          <div className="flex items-center text-[#1A2332]/60 text-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Est. {club.founded}
          </div>
        </div>
        
        <h3 className="font-serif text-xl text-[#1A2332] mb-2 group-hover:text-[#8B9D83] transition-colors leading-tight">
          {club.name}
        </h3>
        
        <div className="flex items-center text-base text-[#1A2332]/60 mb-3">
          <MapPin className="w-4 h-4 mr-1.5" />
          {club.location}
        </div>
        
        <p className="text-base text-[#1A2332]/70 line-clamp-2 mb-4 leading-relaxed">
          {club.summary}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-[#1A2332]/10">
          <div className="flex items-center text-sm text-[#1A2332]/60">
            <Users className="w-4 h-4 mr-1.5" />
            {club.members.toLocaleString()} members
          </div>
          <span className="text-sm font-medium text-[#8B9D83] opacity-0 group-hover:opacity-100 transition-opacity">
            Explore
          </span>
        </div>
      </div>
    </button>
  );
};

export default ClubCard;
