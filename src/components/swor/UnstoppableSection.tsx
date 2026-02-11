import React from 'react';
import { communityImages } from '@/data/sworData';
import { Target, Zap, TrendingUp, Users } from 'lucide-react';

interface UnstoppableSectionProps {
  onJoin: () => void;
}

const UnstoppableSection: React.FC<UnstoppableSectionProps> = ({ onJoin }) => {
  const features = [
    {
      icon: Target,
      title: 'Targeted Support',
      description: 'Resources directed where they\'re needed most – grassroots clubs building the future.',

    },
    {
      icon: Zap,
      title: 'Activation',
      description: 'Turning insights into action, connecting support with opportunity.',
    },
    {
      icon: TrendingUp,
      title: 'Measurable Impact',
      description: 'Tracking outcomes to ensure lasting positive change in communities.',
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Built by rugby people, for rugby people, with rugby values at the core.',
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231A2332' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-[#B8826D] text-sm font-medium tracking-widest uppercase mb-4">
            SWOR × Unstoppable Rugby
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1A2332] leading-tight mb-6">
            Where preservation meets activation
          </h2>
          <p className="text-lg text-[#1A2332]/70 max-w-2xl mx-auto">
            SWOR preserves and connects. Unstoppable Rugby takes that foundation and channels 
            it into real-world impact for grassroots clubs and communities.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] rounded-xl overflow-hidden">
              <img
                src={communityImages[0]}
                alt="Grassroots rugby"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/5] rounded-xl overflow-hidden mt-8">
              <img
                src={communityImages[1]}
                alt="Community rugby"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-[#B8826D]/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-[#B8826D]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#1A2332] mb-1">{feature.title}</h3>
                  <p className="text-sm text-[#1A2332]/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={onJoin}
            className="px-8 py-4 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 transition-all duration-300 hover:shadow-lg"
          >
            Join the Movement
          </button>
        </div>
      </div>
    </section>
  );
};

export default UnstoppableSection;
