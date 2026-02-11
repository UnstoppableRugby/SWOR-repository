import React from 'react';
import { ArrowRight, Globe, Heart, BookOpen, Palette, Leaf, Sun, Trophy, Users } from 'lucide-react';
import { beyondRugbyDomains } from '@/data/sworData';

interface BeyondRugbyPageProps {
  onNavigate: (page: string) => void;
}

const iconMap: { [key: string]: React.ReactNode } = {
  trophy: <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />,
  palette: <Palette className="w-6 h-6 sm:w-8 sm:h-8" />,
  book: <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />,
  heart: <Heart className="w-6 h-6 sm:w-8 sm:h-8" />,
  leaf: <Leaf className="w-6 h-6 sm:w-8 sm:h-8" />,
  sun: <Sun className="w-6 h-6 sm:w-8 sm:h-8" />,
};

const BeyondRugbyPage: React.FC<BeyondRugbyPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F5F1E8] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 bg-[#1A2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block text-[#B8826D] text-xs sm:text-sm font-medium tracking-wide mb-3 sm:mb-4">
              For-Good OS Digital Spine
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-[#F5F1E8] mb-4 sm:mb-6 leading-tight">
              Beyond Rugby
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#F5F1E8]/80 leading-relaxed mb-6 sm:mb-8">
              A for-good identity spine that connects journeys across domains – 
              because the people who shape rugby also shape the world around them.
            </p>
          </div>
        </div>
      </section>

      {/* Core Concept */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1A2332] mb-4 sm:mb-6">
              One Identity, Many Domains
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 leading-relaxed">
              Rugby is the entry point, but journeys don't end at the touchline. 
              The same values that define great rugby people – integrity, teamwork, 
              respect, discipline – extend into every aspect of life.
            </p>
          </div>

          {/* Visual Diagram */}
          <div className="relative max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="flex flex-col items-center">
                {/* Central Hub */}
                <div className="relative mb-8 sm:mb-10 md:mb-12">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#1A2332] flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[#B8826D] mx-auto mb-1" />
                      <span className="text-[#F5F1E8] text-[10px] sm:text-xs font-medium">Your Journey</span>
                    </div>
                  </div>
                  {/* Connection Lines - hidden on mobile for cleaner look */}
                  <div className="hidden md:block absolute top-1/2 left-full w-16 h-0.5 bg-[#B8826D]/30" />
                  <div className="hidden md:block absolute top-1/2 right-full w-16 h-0.5 bg-[#B8826D]/30" />
                  <div className="hidden md:block absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-[#B8826D]/30" />
                </div>

                {/* Domain Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
                  {beyondRugbyDomains.map((domain) => (
                    <div
                      key={domain.id}
                      className="bg-[#F5F1E8] rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#1A2332]/10 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 text-[#1A2332]">
                        {iconMap[domain.icon]}
                      </div>
                      <h3 className="font-medium text-[#1A2332] mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">{domain.title}</h3>
                      <p className="text-[10px] sm:text-xs md:text-sm text-[#1A2332]/60 line-clamp-2">{domain.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connection, Not Expansion */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-block text-[#B8826D] text-xs sm:text-sm font-medium tracking-wide mb-3 sm:mb-4">
                Principle
              </span>
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1A2332] mb-4 sm:mb-6">
                Connection, Not Expansion
              </h2>
              <p className="text-sm sm:text-base text-[#1A2332]/70 mb-3 sm:mb-4">
                <strong className="text-[#1A2332]">Cross-Domain Visibility:</strong> See how journeys connect across 
                different areas of life – while respecting the integrity and 
                governance of each domain.
              </p>
              <p className="text-sm sm:text-base text-[#1A2332]/70 mb-4 sm:mb-6">
                <strong className="text-[#1A2332]">Unified Identity:</strong> Whether someone contributes to rugby, art, or community 
                work – these journeys are connected, not compartmentalised.
              </p>

              <div className="bg-[#F5F1E8] rounded-lg sm:rounded-xl p-4 sm:p-6">
                <p className="text-sm sm:text-base text-[#1A2332]/80 italic font-serif">
                  "Rugby remains the entry point. But the journey continues wherever 
                  the values of the game take you."
                </p>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-[#F5F1E8] rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8">
                <h3 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-3 sm:mb-4">What This Means</h3>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#B8826D]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B8826D]" />
                    </div>
                    <span className="text-sm sm:text-base text-[#1A2332]/70">One identity that travels across domains</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#B8826D]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B8826D]" />
                    </div>
                    <span className="text-sm sm:text-base text-[#1A2332]/70">Contributions acknowledged across contexts</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#B8826D]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B8826D]" />
                    </div>
                    <span className="text-sm sm:text-base text-[#1A2332]/70">Value flows back to grassroots communities</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#B8826D]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B8826D]" />
                    </div>
                    <span className="text-sm sm:text-base text-[#1A2332]/70">Continuity preserved across generations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Alignment */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#1A2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16">
            <span className="inline-block text-[#B8826D] text-xs sm:text-sm font-medium tracking-wide mb-3 sm:mb-4">
              Research Alignment
            </span>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#F5F1E8] mb-4 sm:mb-6">
              Aligned with Global Wellbeing Research
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/70 leading-relaxed">
              The for-good identity spine aligns with emerging research on social capital, 
              legacy preservation, and intergenerational wellbeing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-[#F5F1E8]/10 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-[#B8826D] mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#F5F1E8] mb-2 sm:mb-3">Social Capital</h3>
              <p className="text-[#F5F1E8]/70 text-xs sm:text-sm leading-relaxed">
                Connected journeys strengthen community bonds and create networks 
                of trust that benefit everyone.
              </p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#B8826D] mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#F5F1E8] mb-2 sm:mb-3">Legacy Research</h3>
              <p className="text-[#F5F1E8]/70 text-xs sm:text-sm leading-relaxed">
                Preserved journeys provide context and meaning for future generations, 
                supporting identity formation and belonging.
              </p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 sm:col-span-2 md:col-span-1">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-[#B8826D] mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#F5F1E8] mb-2 sm:mb-3">Intergenerational Wellbeing</h3>
              <p className="text-[#F5F1E8]/70 text-xs sm:text-sm leading-relaxed">
                Acknowledging contributions across time creates continuity that 
                supports mental health and community resilience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Posthumous & Living Legacy */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <span className="inline-block text-[#B8826D] text-xs sm:text-sm font-medium tracking-wide mb-3 sm:mb-4">
                Legacy Continuity
              </span>
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1A2332] mb-4 sm:mb-6">
                Posthumous & Living Legacy
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 lg:p-12">
              <p className="text-sm sm:text-base text-[#1A2332]/70 mb-4 sm:mb-6">
                The for-good identity spine is designed to support journeys that grow 
                over time – including posthumously. This is handled with consent, 
                stewardship, and care.
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="border-l-4 border-[#B8826D] pl-4 sm:pl-6">
                  <h3 className="font-medium text-[#1A2332] mb-1 sm:mb-2 text-sm sm:text-base">Posthumous Rugby Journeys</h3>
                  <p className="text-[#1A2332]/60 text-xs sm:text-sm">
                    Journeys can be created and maintained after a person has passed, 
                    preserving their contribution for future generations.
                  </p>
                </div>
                <div className="border-l-4 border-[#B8826D] pl-4 sm:pl-6">
                  <h3 className="font-medium text-[#1A2332] mb-1 sm:mb-2 text-sm sm:text-base">Private Family Access</h3>
                  <p className="text-[#1A2332]/60 text-xs sm:text-sm">
                    Full legacy profiles can be made available privately to family 
                    and friends, with appropriate access controls.
                  </p>
                </div>
                <div className="border-l-4 border-[#B8826D] pl-4 sm:pl-6">
                  <h3 className="font-medium text-[#1A2332] mb-1 sm:mb-2 text-sm sm:text-base">Collaborative Enrichment</h3>
                  <p className="text-[#1A2332]/60 text-xs sm:text-sm">
                    Journeys can be enriched by others over time – with consent and 
                    attribution – allowing stories to grow and deepen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1A2332] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 text-center">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#F5F1E8] mb-4 sm:mb-6">
              Your Journey Extends Beyond Rugby
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Whether you're a player, coach, volunteer, or supporter – your journey 
              is part of something larger. Let us help you preserve and connect it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => onNavigate('contribute')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 transition-colors flex items-center justify-center space-x-2 min-h-[44px] sm:min-h-[48px]"
              >
                <span className="text-sm sm:text-base">Contribute Your Journey</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </button>
              <button
                onClick={() => onNavigate('how-it-works')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent border border-[#F5F1E8]/30 text-[#F5F1E8] font-medium rounded-lg hover:bg-[#F5F1E8]/10 transition-colors min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
              >
                Learn How SWOR Works
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BeyondRugbyPage;
