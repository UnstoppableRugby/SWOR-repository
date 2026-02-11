import React from 'react';
import { heroImage } from '@/data/sworData';
import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onExplore: () => void;
  onJoin: () => void;
  onHowItWorks?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onExplore, onJoin, onHowItWorks }) => {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 100,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Rugby heritage"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A2332]/70 via-[#1A2332]/50 to-[#1A2332]/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow */}
        <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-4 sm:mb-6">
          A For-Good Digital Spine
        </p>

        {/* Main Headline — PATCH v6B.3: Responsive sizes, balanced leading, max-w, no focus outline */}
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#F5F1E8] leading-tight sm:leading-snug max-w-3xl mx-auto mb-4 sm:mb-6">
          Rugby Journeys,
          <br />
          <span className="text-[#B8826D]">Connected.</span>
        </h1>


        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#F5F1E8]/80 font-light tracking-wide mb-3 sm:mb-4 leading-relaxed">
          Preserving context. Honouring contribution.
        </p>
        <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/60 font-light mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
          Collectively and across generations.
        </p>

        {/* CTAs - Invitational language only */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={onExplore}
            className="swor-btn-primary text-sm sm:text-base w-full sm:w-auto min-h-[48px]"
          >
            Explore Rugby Journeys
          </button>
          <button
            onClick={onJoin}
            className="swor-btn px-6 sm:px-8 py-3 sm:py-4 border border-[#F5F1E8]/30 text-[#F5F1E8] hover:bg-[#F5F1E8]/10 w-full sm:w-auto min-h-[48px] text-sm sm:text-base"
          >
            Contribute Your Journey
          </button>
        </div>

        {/* Read the full explainer link */}
        {onHowItWorks && (
          <button
            onClick={onHowItWorks}
            className="text-[#F5F1E8]/60 hover:text-[#F5F1E8] text-xs sm:text-sm transition-colors min-h-[44px]"
          >
            Read the full explainer
          </button>
        )}
      </div>



      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#F5F1E8]/60 hover:text-[#F5F1E8] transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-8 h-8" />
      </button>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F5F1E8] to-transparent" />
    </section>
  );
};

export default HeroSection;
