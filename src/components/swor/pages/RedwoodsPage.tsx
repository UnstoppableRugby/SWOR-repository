import React from 'react';
import { redwoodsImage, communityImages, sueDorrington } from '@/data/sworData';
import { TreePine, AlertTriangle, Layers, Users, TrendingUp, Shield, ArrowRight } from 'lucide-react';

interface RedwoodsPageProps {
  onJoin: () => void;
  onNavigate?: (page: string) => void;
}

const RedwoodsPage: React.FC<RedwoodsPageProps> = ({ onJoin, onNavigate }) => {
  const sections = [
    {
      icon: TreePine,
      title: 'The Metaphor',
      content: `Ancient redwood trees survive for millennia not because of their individual strength, but because their roots intertwine underground, supporting each other through storms and droughts. A single redwood might fall, but a grove stands together for centuries.

Rugby is the same. The game's strength has never come from its stars alone – it comes from the interconnected network of clubs, volunteers, coaches, and communities that have nurtured players and traditions for generations.`,
    },
    {
      icon: AlertTriangle,
      title: 'The Reality',
      content: `Rugby's grassroots face unprecedented challenges. This isn't about blame or decline – it's about recognising that the world has changed, and the game must adapt.

Volunteer numbers are stretched thin. Funding models that worked for decades are under pressure. The connections between generations – the passing down of knowledge, traditions, and values – are harder to maintain in our busy, digital world.

These aren't failures. They're challenges that every community organisation faces. But rugby has something special: a global family that cares deeply about the game's future.`,
    },
    {
      icon: Layers,
      title: "What's at Risk",
      content: `Without intervention, we risk losing more than matches. We risk losing:

• The stories of legends who shaped the game
• The institutional knowledge held by long-serving volunteers
• The connections between clubs and their communities
• The pathways that turn young players into lifelong rugby people
• The values and traditions that make rugby unique

These aren't just nice-to-haves. They're the root system that sustains everything above ground.`,
    },
  ];


  const stakeholders = [
    { title: 'Legends', description: 'Share wisdom, mentor the next generation, preserve their stories' },
    { title: 'Clubs', description: 'Connect to resources, share best practices, strengthen communities' },
    { title: 'Volunteers', description: 'Get recognition, access support, reduce burnout' },
    { title: 'Partners', description: 'Invest with purpose, see measurable impact, align with values' },
    { title: 'Fans', description: 'Engage meaningfully, support clubs, become part of the story' },
    { title: 'Governing Bodies', description: 'Access insights, coordinate efforts, strengthen the ecosystem' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero */}
      <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
        <img
          src={redwoodsImage}
          alt="Ancient redwood forest"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2332] via-[#1A2332]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <p className="text-[#8B9D83] text-xs sm:text-sm font-medium tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
              The Redwoods Project
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-[#F5F1E8] leading-tight mb-4 sm:mb-6">
              Strengthening rugby's roots
              <br className="hidden sm:block" />
              <span className="text-[#8B9D83]"> for the next century</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16">
        {sections.map((section, index) => (
          <div key={section.title} className="mb-10 sm:mb-12 md:mb-16">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#8B9D83]/20 flex items-center justify-center flex-shrink-0">
                <section.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B9D83]" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332]">{section.title}</h2>
            </div>
            <div className="prose prose-lg max-w-none">
              {section.content.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-[#1A2332]/70 leading-relaxed mb-3 sm:mb-4 whitespace-pre-line text-sm sm:text-base md:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Example Case: Sue Dorrington - CANONICAL */}
      <div className="bg-white py-10 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#B8826D]/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#B8826D]" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332]">The Gold Standard</h2>
          </div>
          
          <div className="bg-[#1A2332] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-[#B8826D]/30 mx-auto sm:mx-0">
                <img
                  src={sueDorrington.image}
                  alt={sueDorrington.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3 justify-center sm:justify-start">
                  <span className="inline-block px-2 py-1 bg-[#B8826D] text-[#F5F1E8] text-xs font-medium rounded">
                    Foundational Profile
                  </span>
                  <span className="inline-block px-2 py-1 bg-[#8B9D83] text-[#F5F1E8] text-xs font-medium rounded">
                    Canonical Journey
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl text-[#F5F1E8] mb-1 sm:mb-2">{sueDorrington.name}</h3>
                <p className="text-[#B8826D] text-xs sm:text-sm mb-3 sm:mb-4">{sueDorrington.descriptors?.join(' · ')}</p>
                <p className="text-[#F5F1E8]/70 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                  Sue Dorrington's journey represents how SWOR approaches legacy preservation: stories captured 
                  with care, a single canonical source of truth maintained by SWOR, and connections to the wider 
                  rugby ecosystem preserved for future generations.
                </p>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('legend-detail-sue-dorrington')}
                    className="inline-flex items-center px-4 py-2.5 bg-[#B8826D] text-[#F5F1E8] text-xs sm:text-sm font-medium rounded-lg hover:bg-[#B8826D]/90 transition-colors min-h-[44px]"
                  >
                    Read Sue's Rugby Journey
                    <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Governance Rule - Updated for Canonical Migration */}
          <div className="mt-6 sm:mt-8 bg-[#F5F1E8] rounded-xl p-4 sm:p-5 md:p-6 border border-[#1A2332]/10">
            <div className="flex items-start">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-[#1A2332] mb-2 sm:mb-3 text-sm sm:text-base">Governance Principle</h4>
                <p className="text-[#1A2332]/70 text-xs sm:text-sm italic leading-relaxed">
                  "SWOR Rugby Journeys are the sole canonical public versions. All enrichment, collaboration, 
                  and future additions occur on SWOR, ensuring a single source of truth that can grow and 
                  deepen over time."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Two-Layer Solution */}
      <div className="bg-[#1A2332] py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <Layers className="w-10 h-10 sm:w-12 sm:h-12 text-[#B8826D] mx-auto mb-3 sm:mb-4" />
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F5F1E8] mb-4 sm:mb-6">
              The Two-Layer Solution
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/70 max-w-2xl mx-auto leading-relaxed">
              SWOR and Unstoppable Rugby work together as complementary layers, 
              each essential to the whole.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* SWOR Layer */}
            <div className="bg-[#F5F1E8]/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-[#F5F1E8]/10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#B8826D]/20 flex items-center justify-center mb-4 sm:mb-6">
                <span className="font-serif text-lg sm:text-xl text-[#B8826D] font-bold">S</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#F5F1E8] mb-3 sm:mb-4">SWOR: Preserve & Connect</h3>
              <ul className="space-y-2 sm:space-y-3 text-[#F5F1E8]/70">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8826D] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Captures and protects stories, records, and memories</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8826D] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Links legends to clubs, clubs to communities</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8826D] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Reveals patterns and opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8826D] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Builds the foundation for informed action</span>
                </li>
              </ul>
            </div>

            {/* Unstoppable Rugby Layer */}
            <div className="bg-[#F5F1E8]/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-[#F5F1E8]/10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#8B9D83]/20 flex items-center justify-center mb-4 sm:mb-6">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-[#8B9D83]" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#F5F1E8] mb-3 sm:mb-4">Unstoppable Rugby: Activate & Support</h3>
              <ul className="space-y-2 sm:space-y-3 text-[#F5F1E8]/70">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Channels resources to grassroots clubs</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Turns insights into real-world impact</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Measures and reports outcomes</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B9D83] mt-2 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Strengthens the ecosystem continuously</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stakeholder Roles */}
      <div className="py-12 sm:py-16 md:py-24 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[#B8826D] mx-auto mb-3 sm:mb-4" />
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1A2332] mb-4 sm:mb-6">
              Everyone Has a Role
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 max-w-2xl mx-auto leading-relaxed">
              The Redwoods Project succeeds when every part of the rugby family contributes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {stakeholders.map((stakeholder) => (
              <div
                key={stakeholder.title}
                className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-1 sm:mb-2">{stakeholder.title}</h3>
                <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">{stakeholder.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#8B9D83] py-10 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#F5F1E8] mb-4 sm:mb-6">
            Join the Journey
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            The roots of rugby need strengthening. Whether you're a legend, a club volunteer, 
            or a passionate fan – there's a place for you in this project.

          </p>
          <button
            onClick={onJoin}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-[#F5F1E8] text-[#1A2332] font-medium rounded-lg hover:bg-[#F5F1E8]/90 transition-all duration-300 min-h-[48px] sm:min-h-[52px] text-sm sm:text-base"
          >
            Find Your Place
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedwoodsPage;
