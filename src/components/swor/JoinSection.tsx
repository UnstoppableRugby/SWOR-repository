import React from 'react';
import { joinPaths } from '@/data/sworData';
import { User, Building, Users, Heart, Camera, Handshake, Archive, ExternalLink } from 'lucide-react';

interface JoinSectionProps {
  onSelectPath: (path: string) => void;
  onReadExplainer?: () => void;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  user: User,
  building: Building,
  users: Users,
  heart: Heart,
  camera: Camera,
  handshake: Handshake,
  archive: Archive,
};

const JoinSection: React.FC<JoinSectionProps> = ({ onSelectPath, onReadExplainer }) => {
  return (
    <section className="swor-section bg-[#1A2332]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-[#B8826D] text-sm font-medium tracking-widest uppercase mb-4">
            Contribute Your Journey
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#F5F1E8] leading-tight mb-6">
            Every journey matters
          </h2>
          <p className="text-lg text-[#F5F1E8]/80 max-w-2xl mx-auto leading-relaxed">
            Whether you are a player, coach, volunteer, or supporter, your journey is part of 
            something larger. Let us help you preserve and connect it.
          </p>
        </div>

        {/* Join Paths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {joinPaths.map((path) => {
            const IconComponent = iconMap[path.icon];
            return (
              <button
                key={path.id}
                onClick={() => onSelectPath(path.id)}
                className="group bg-[#F5F1E8]/5 hover:bg-[#F5F1E8]/10 rounded-xl p-8 text-left transition-all duration-300 border border-[#F5F1E8]/10 hover:border-[#B8826D]/30"
              >
                <div className="w-14 h-14 rounded-full bg-[#B8826D]/20 flex items-center justify-center mb-6 group-hover:bg-[#B8826D]/30 transition-colors">
                  {IconComponent && <IconComponent className="w-7 h-7 text-[#B8826D]" />}
                </div>
                <h3 className="font-serif text-xl text-[#F5F1E8] mb-3 group-hover:text-[#B8826D] transition-colors">
                  {path.title}
                </h3>
                <p className="text-sm text-[#F5F1E8]/60 leading-relaxed mb-4">
                  {path.description}
                </p>
                <span className="text-sm font-medium text-[#B8826D] opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Explore
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>

        {/* Acknowledgement Note */}
        <div className="mt-12 bg-[#F5F1E8]/5 rounded-xl p-6 text-center border border-[#F5F1E8]/10">
          <p className="text-sm text-[#F5F1E8]/70 leading-relaxed">
            All journeys acknowledge the people, clubs, and communities that enabled them. 
            No journey is framed as a solo achievement.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-[#F5F1E8]/60 mb-4">Not sure where to start?</p>
          {onReadExplainer ? (
            <button
              onClick={onReadExplainer}
              className="inline-flex items-center text-[#B8826D] font-medium hover:text-[#B8826D]/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Read the full explainer
            </button>
          ) : (
            <button
              onClick={() => onSelectPath('general')}
              className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 transition-colors"
            >
              Explore how SWOR works
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default JoinSection;
