import React from 'react';
import { Archive, Users, Globe, Heart, HandHeart, ExternalLink } from 'lucide-react';

interface WhatIsSWORProps {
  onLearnMore?: () => void;
}

const WhatIsSWOR: React.FC<WhatIsSWORProps> = ({ onLearnMore }) => {
  const pillars = [
    {
      icon: Archive,
      title: 'Preserve',
      description: 'Capturing and protecting the journeys, records, and memories of rugby\'s people and places.',
    },
    {
      icon: Users,
      title: 'Connect',
      description: 'Linking individuals to clubs, clubs to communities, and generations to each other.',
    },
    {
      icon: HandHeart,
      title: 'Acknowledge',
      description: 'Every journey acknowledges the people, clubs and organisations that enabled it.',
    },
    {
      icon: Heart,
      title: 'Sustain',
      description: 'Channeling value back to grassroots communities where impact matters most.',
    },
  ];

  return (
    <section className="swor-section bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4">
            For-Good Digital Spine
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1A2332] leading-tight mb-4 sm:mb-6">
            Holding journeys. Preserving context. Honouring contribution.
          </h2>
          <p className="text-base sm:text-lg text-[#1A2332]/70 leading-relaxed">
            SWOR is not a platform for attention. It is a for-good digital spine designed 
            to hold journeys, preserve context and honour contribution, collectively and 
            across generations.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className="bg-white rounded-xl p-5 sm:p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#8B9D83]/20 flex items-center justify-center mb-4 sm:mb-6">
                <pillar.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B9D83]" />
              </div>
              <h3 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-2 sm:mb-3">{pillar.title}</h3>
              <p className="text-[#1A2332]/70 text-xs sm:text-sm leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>

        {/* Core Principles */}
        <div className="mt-12 sm:mt-16 bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <h4 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Rugby Journeys</h4>
              <p className="text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
                Your Rugby Journey. Our Rugby Journey. The Journey of events and moments.
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">No Hierarchy</h4>
              <p className="text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
                No tiered status categories. All journeys are valued equally.
              </p>
            </div>
            <div className="text-center">
              <h4 className="font-serif text-base sm:text-lg text-[#1A2332] mb-2">Continuity</h4>
              <p className="text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
                Journeys can be enriched over time, including posthumously with consent.
              </p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-12 sm:mt-16 max-w-3xl mx-auto text-center">
          <blockquote className="relative">
            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 text-4xl sm:text-6xl text-[#B8826D]/20 font-serif">"</div>
            <p className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A2332] italic leading-relaxed">
              This has always existed. We just finally built it properly.
            </p>
          </blockquote>
        </div>

        {/* Read the full explainer */}
        {onLearnMore && (
          <div className="mt-8 sm:mt-12 text-center">
            <button
              onClick={onLearnMore}
              className="inline-flex items-center text-[#B8826D] hover:text-[#B8826D]/80 transition-colors text-sm sm:text-base min-h-[44px]"
            >
              <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Read the full explainer</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default WhatIsSWOR;
