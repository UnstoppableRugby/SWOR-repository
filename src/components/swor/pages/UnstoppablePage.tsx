import React from 'react';
import { communityImages } from '@/data/sworData';
import { Target, Zap, MapPin, Users, TrendingUp, Heart } from 'lucide-react';

interface UnstoppablePageProps {
  onJoin: () => void;
}

const UnstoppablePage: React.FC<UnstoppablePageProps> = ({ onJoin }) => {
  const howItActivates = [
    {
      icon: Target,
      title: 'Identify Needs',
      description: 'SWOR data reveals which clubs and communities need support most.',
    },
    {
      icon: Zap,
      title: 'Channel Resources',
      description: 'Partner investment and community support flows to where it matters.',
    },
    {
      icon: MapPin,
      title: 'Local Impact',
      description: 'Support arrives at grassroots level – equipment, coaching, facilities.',

    },
    {
      icon: TrendingUp,
      title: 'Measure & Report',
      description: 'Track outcomes and demonstrate real change in rugby communities.',
    },
  ];

  const impactAreas = [
    { title: 'Youth Development', description: 'Supporting pathways for young players' },
    { title: 'Volunteer Support', description: 'Reducing burnout, recognising contribution' },
    { title: 'Club Infrastructure', description: 'Equipment, facilities, and resources' },
    { title: 'Community Programs', description: 'Rugby as a force for social good' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-24">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img
          src={communityImages[0]}
          alt="Grassroots rugby"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A2332] via-[#1A2332]/80 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
            <div className="max-w-xl">
              <p className="text-[#8B9D83] text-sm font-medium tracking-widest uppercase mb-4">
                Activation Layer
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-[#F5F1E8] leading-tight mb-4">
                Unstoppable Rugby
              </h1>
              <p className="text-lg text-[#F5F1E8]/80">
                Where preservation meets action. Channeling resources and support 
                to grassroots clubs where impact matters most.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl text-[#1A2332] mb-6">
            Our Mission
          </h2>
          <p className="text-xl text-[#1A2332]/70 leading-relaxed">
            Unstoppable Rugby exists to ensure that every grassroots rugby club – 
            no matter how small, how remote, or how under-resourced – has the support 
            it needs to thrive. We turn the insights from SWOR into real-world action, 
            connecting resources with the communities that need them most.
          </p>
        </div>
      </div>


      {/* How It Activates */}
      <div className="py-24 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl text-[#1A2332] mb-4">
              How It Activates
            </h2>
            <p className="text-[#1A2332]/70 max-w-2xl mx-auto">
              A clear flow from insight to impact, ensuring every resource reaches 
              where it's needed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItActivates.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="bg-white rounded-xl p-6 shadow-sm h-full">
                  <div className="w-10 h-10 rounded-full bg-[#8B9D83] flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-[#F5F1E8]" />
                  </div>
                  <h3 className="font-medium text-[#1A2332] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#1A2332]/70">{step.description}</p>
                </div>
                {index < howItActivates.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-[#8B9D83]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Where Impact Goes */}
      <div className="py-24 bg-[#1A2332]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl text-[#F5F1E8] mb-6">
                Where Impact Goes
              </h2>
              <p className="text-[#F5F1E8]/70 mb-8">
                Every resource channeled through Unstoppable Rugby goes directly to 
                strengthening grassroots rugby. We focus on four key areas that make 
                the biggest difference.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {impactAreas.map((area) => (
                  <div key={area.title} className="bg-[#F5F1E8]/5 rounded-lg p-4 border border-[#F5F1E8]/10">
                    <h3 className="font-medium text-[#F5F1E8] mb-1 text-sm">{area.title}</h3>
                    <p className="text-xs text-[#F5F1E8]/60">{area.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src={communityImages[1]}
                alt="Community rugby impact"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* How to Get Involved */}
      <div className="py-24 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl text-[#1A2332] mb-4">
              How to Get Involved
            </h2>
            <p className="text-[#1A2332]/70 max-w-2xl mx-auto">
              Everyone can play a part in making grassroots rugby unstoppable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#B8826D]/10 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-7 h-7 text-[#B8826D]" />
              </div>
              <h3 className="font-serif text-xl text-[#1A2332] mb-3">Support</h3>
              <p className="text-sm text-[#1A2332]/70 mb-6">
                Contribute directly to grassroots rugby through one-time or recurring support.
              </p>
              <button
                onClick={onJoin}
                className="text-[#B8826D] font-medium text-sm hover:text-[#B8826D]/80"
              >
                Make a contribution →
              </button>
            </div>

            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#8B9D83]/10 flex items-center justify-center mx-auto mb-6">
                <Users className="w-7 h-7 text-[#8B9D83]" />
              </div>
              <h3 className="font-serif text-xl text-[#1A2332] mb-3">Volunteer</h3>
              <p className="text-sm text-[#1A2332]/70 mb-6">
                Share your skills and time to help clubs in your area or around the world.
              </p>
              <button
                onClick={onJoin}
                className="text-[#8B9D83] font-medium text-sm hover:text-[#8B9D83]/80"
              >
                Find opportunities →
              </button>
            </div>

            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#1A2332]/10 flex items-center justify-center mx-auto mb-6">
                <Target className="w-7 h-7 text-[#1A2332]" />
              </div>
              <h3 className="font-serif text-xl text-[#1A2332] mb-3">Partner</h3>
              <p className="text-sm text-[#1A2332]/70 mb-6">
                Organizations can make a strategic investment in rugby's grassroots future.
              </p>
              <button
                onClick={onJoin}
                className="text-[#1A2332] font-medium text-sm hover:text-[#1A2332]/80"
              >
                Start a conversation →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#8B9D83] py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl text-[#F5F1E8] mb-6">
            Join the Movement
          </h2>
          <p className="text-lg text-[#F5F1E8]/90 mb-8 max-w-2xl mx-auto">
            Grassroots rugby needs champions. Whether you can give time, resources, 
            or simply spread the word – you can help make rugby unstoppable.
          </p>

          <button
            onClick={onJoin}
            className="px-8 py-4 bg-[#F5F1E8] text-[#1A2332] font-medium rounded-lg hover:bg-[#F5F1E8]/90 transition-all duration-300"
          >
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnstoppablePage;
