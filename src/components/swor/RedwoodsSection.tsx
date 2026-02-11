import React from 'react';
import { redwoodsImage } from '@/data/sworData';

interface RedwoodsSectionProps {
  onLearnMore: () => void;
}

const RedwoodsSection: React.FC<RedwoodsSectionProps> = ({ onLearnMore }) => {
  return (
    <section className="py-24 bg-[#F5F1E8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src={redwoodsImage}
                alt="Ancient redwood forest"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#8B9D83]/20 rounded-full -z-10" />
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#B8826D]/20 rounded-full -z-10" />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <p className="text-[#8B9D83] text-sm font-medium tracking-widest uppercase mb-4">
              The Redwoods Project
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1A2332] leading-tight mb-6">
              Strengthening rugby's roots for the next century
            </h2>
            
            <div className="space-y-6 text-[#1A2332]/70 leading-relaxed">
              <p>
                <strong className="text-[#1A2332]">The Metaphor:</strong> Ancient redwood trees survive 
                for millennia not because of their individual strength, but because their roots 
                intertwine underground, supporting each other through storms and droughts.
              </p>
              <p>
                <strong className="text-[#1A2332]">The Reality:</strong> Rugby's grassroots clubs face 
                unprecedented challenges. Volunteer numbers are declining. Funding is stretched. 
                The connections between generations are weakening.
              </p>
              <p>
                <strong className="text-[#1A2332]">The Solution:</strong> SWOR preserves and connects. 
                Unstoppable Rugby activates and supports. Together, we strengthen the root system 
                that sustains the entire game.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onLearnMore}
                className="px-6 py-3 bg-[#8B9D83] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#8B9D83]/90 transition-all duration-300"
              >
                Learn About the Project
              </button>
              <button
                onClick={onLearnMore}
                className="px-6 py-3 border border-[#1A2332]/20 text-[#1A2332] font-medium rounded-lg hover:bg-[#1A2332]/5 transition-all duration-300"
              >
                See the Impact
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RedwoodsSection;
