import React from 'react';
import { redwoodsImage } from '@/data/sworData';

interface WhyItMattersProps {
  onLearnMore: () => void;
}

const WhyItMatters: React.FC<WhyItMattersProps> = ({ onLearnMore }) => {
  const stats = [
    { value: '200+', label: 'Years of rugby history' },
    { value: '120+', label: 'Countries playing' },
    { value: '10M+', label: 'Active players worldwide' },
    { value: '1000s', label: 'Stories waiting to be told' },
  ];

  return (
    <section className="py-24 bg-[#1A2332] relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-10">
        <img
          src={redwoodsImage}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <p className="text-[#B8826D] text-sm font-medium tracking-widest uppercase mb-4">
              Why It Matters
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#F5F1E8] leading-tight mb-6">
              Rugby's roots run deep.
              <br />
              <span className="text-[#8B9D83]">We're here to protect them.</span>
            </h2>
            <p className="text-lg text-[#F5F1E8]/70 leading-relaxed mb-6">
              Like the ancient redwoods, rugby's strength comes from its interconnected root system – 

              the clubs, volunteers, coaches, and communities that have nurtured the game for generations.
            </p>
            <p className="text-lg text-[#F5F1E8]/70 leading-relaxed mb-8">
              These roots face challenges. Resources are stretched. Stories are being lost. 
              Connections between generations are weakening. SWOR exists to strengthen these roots, 
              ensuring the game we love continues to grow for centuries to come.
            </p>
            <button
              onClick={onLearnMore}
              className="px-6 py-3 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 transition-all duration-300"
            >
              Discover The Redwoods Project
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl bg-[#F5F1E8]/5 backdrop-blur-sm">
                <div className="font-serif text-4xl md:text-5xl text-[#B8826D] mb-2">{stat.value}</div>
                <div className="text-sm text-[#F5F1E8]/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyItMatters;
