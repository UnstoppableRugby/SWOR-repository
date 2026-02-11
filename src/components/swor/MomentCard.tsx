import React from 'react';
import { Moment } from '@/data/sworData';

interface MomentCardProps {
  moment: Moment;
  onClick: () => void;
}

const MomentCard: React.FC<MomentCardProps> = ({ moment, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-white w-full text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-[#1A2332]/10"
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={moment.image}
          alt={moment.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Year Badge */}
        <div className="absolute top-3 left-3 bg-[#B8826D] px-3 py-1 rounded">
          <span className="text-sm md:text-base font-serif font-bold text-[#F5F1E8]">{moment.year}</span>
        </div>
        
        {/* Theme Badge */}
        <div className="absolute top-3 right-3 bg-[#1A2332]/80 backdrop-blur-sm px-3 py-1 rounded">
          <span className="text-xs md:text-sm font-medium text-[#F5F1E8]">{moment.theme}</span>
        </div>
      </div>
      
      {/* Content - Light background for readability */}
      <div className="p-5 md:p-6">
        {/* Journey type label */}
        <p className="text-xs md:text-sm text-[#B8826D] font-medium tracking-wide uppercase mb-2">
          The Journey of
        </p>
        
        <h3 className="font-serif text-lg md:text-xl text-[#1A2332] mb-2 group-hover:text-[#B8826D] transition-colors leading-tight">
          {moment.title}
        </h3>
        
        <div className="mb-3">
          <span className="text-sm md:text-base text-[#1A2332]/60">{moment.country} · {moment.era}</span>
        </div>
        
        <p className="text-sm md:text-base text-[#1A2332]/70 line-clamp-2 leading-relaxed">
          {moment.description}
        </p>
        
        {/* Invitational CTA */}
        <p className="mt-4 text-sm md:text-base font-medium text-[#B8826D] group-hover:translate-x-1 transition-transform">
          Read this journey
        </p>
      </div>
    </button>
  );
};

export default MomentCard;
