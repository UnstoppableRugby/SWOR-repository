import React, { useState } from 'react';
import { Shield, Target, BarChart3, Heart, Building, Briefcase, Globe } from 'lucide-react';

interface PartnersPageProps {
  onContact: () => void;
}

const PartnersPage: React.FC<PartnersPageProps> = ({ onContact }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    partnerType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const benefits = [
    {
      icon: Target,
      title: 'Purpose-Driven Investment',
      description: 'Your support goes directly to strengthening grassroots rugby, with clear impact metrics.',
    },
    {
      icon: Shield,
      title: 'Values Alignment',
      description: 'Associate your brand with rugby\'s core values: respect, integrity, passion, and community.',
    },
    {
      icon: BarChart3,
      title: 'Measurable Outcomes',
      description: 'Transparent reporting on how your partnership creates real change in rugby communities.',
    },
    {
      icon: Heart,
      title: 'Authentic Connection',
      description: 'Access to rugby\'s global family – legends, clubs, volunteers, and passionate fans.',
    },
  ];

  const partnerTypes = [
    {
      icon: Building,
      title: 'Foundation Partners',
      description: 'Long-term strategic partnerships that shape the future of SWOR and Unstoppable Rugby.',
    },
    {
      icon: Briefcase,
      title: 'Corporate Partners',
      description: 'Businesses aligned with rugby values, supporting specific initiatives or regions.',
    },
    {
      icon: Globe,
      title: 'Regional Partners',
      description: 'Organizations focused on strengthening rugby in specific countries or communities.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero */}
      <div className="bg-[#1A2332] py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4">
            Partnership
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#F5F1E8] leading-tight mb-3 sm:mb-4">
            Partner With Us
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/70 max-w-2xl">
            Align your brand with rugby's values and make a measurable difference 
            in communities around the world.
          </p>
        </div>
      </div>

      {/* Why Partnership Matters */}
      <div className="py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">
              Why Partnership Matters
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70">
              SWOR isn't a traditional sponsorship opportunity. We're building something 
              different – a foundation that will serve rugby for generations. Partners 
              who join us now become part of that legacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#B8826D]/10 flex items-center justify-center mb-3 sm:mb-4">
                  <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#B8826D]" />
                </div>
                <h3 className="font-medium text-sm sm:text-base text-[#1A2332] mb-2">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-[#1A2332]/70">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What Makes This Different */}
      <div className="bg-white py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-start lg:items-center">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-4 sm:mb-6">
                What Makes This Different
              </h2>
              <div className="space-y-4 sm:space-y-6 text-sm sm:text-base text-[#1A2332]/70">
                <p>
                  <strong className="text-[#1A2332]">Governance & Protection:</strong> SWOR operates 
                  with clear governance principles. Partner relationships are transparent, 
                  values-aligned, and designed for long-term sustainability – not short-term gain.
                </p>
                <p>
                  <strong className="text-[#1A2332]">Impact First:</strong> Every partnership is 
                  structured to maximise impact on grassroots rugby. We measure success not by 
                  logos displayed, but by clubs strengthened and communities supported.
                </p>
                <p>
                  <strong className="text-[#1A2332]">Authentic Access:</strong> Partners gain genuine 
                  connection to rugby's global family – not just branding opportunities, but 
                  meaningful relationships with legends, clubs, and communities.
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {partnerTypes.map((type) => (
                <div key={type.title} className="bg-[#F5F1E8] rounded-xl p-4 sm:p-5 md:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#8B9D83]/20 flex items-center justify-center flex-shrink-0">
                      <type.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base text-[#1A2332] mb-1">{type.title}</h3>
                      <p className="text-xs sm:text-sm text-[#1A2332]/70">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="py-12 sm:py-16 md:py-24 bg-[#1A2332]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#F5F1E8] mb-3 sm:mb-4">
              Start a Partnership Conversation
            </h2>
            <p className="text-sm sm:text-base text-[#F5F1E8]/70">
              Tell us about your organization and how you'd like to support rugby's future.
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#8B9D83]/20 rounded-xl p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#8B9D83] flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#F5F1E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-lg sm:text-xl text-[#F5F1E8] mb-2">Thank you for your interest</h3>
              <p className="text-sm sm:text-base text-[#F5F1E8]/70">
                We'll be in touch within 48 hours to discuss how we can work together.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#F5F1E8]/80 mb-1.5 sm:mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#F5F1E8]/10 border border-[#F5F1E8]/20 text-[#F5F1E8] placeholder-[#F5F1E8]/40 focus:outline-none focus:border-[#B8826D] text-sm sm:text-base min-h-[44px] sm:min-h-[48px] box-border"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#F5F1E8]/80 mb-1.5 sm:mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#F5F1E8]/10 border border-[#F5F1E8]/20 text-[#F5F1E8] placeholder-[#F5F1E8]/40 focus:outline-none focus:border-[#B8826D] text-sm sm:text-base min-h-[44px] sm:min-h-[48px] box-border"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#F5F1E8]/80 mb-1.5 sm:mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#F5F1E8]/10 border border-[#F5F1E8]/20 text-[#F5F1E8] placeholder-[#F5F1E8]/40 focus:outline-none focus:border-[#B8826D] text-sm sm:text-base min-h-[44px] sm:min-h-[48px] box-border"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#F5F1E8]/80 mb-1.5 sm:mb-2">
                    Partnership Interest
                  </label>
                  <select
                    required
                    value={formData.partnerType}
                    onChange={(e) => setFormData({ ...formData, partnerType: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#F5F1E8]/10 border border-[#F5F1E8]/20 text-[#F5F1E8] focus:outline-none focus:border-[#B8826D] text-sm sm:text-base min-h-[44px] sm:min-h-[48px] box-border appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23F5F1E8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25em 1.25em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="" className="bg-[#1A2332]">Select type...</option>
                    <option value="foundation" className="bg-[#1A2332]">Foundation Partner</option>
                    <option value="corporate" className="bg-[#1A2332]">Corporate Partner</option>
                    <option value="regional" className="bg-[#1A2332]">Regional Partner</option>
                    <option value="other" className="bg-[#1A2332]">Other / Not Sure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#F5F1E8]/80 mb-1.5 sm:mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[#F5F1E8]/10 border border-[#F5F1E8]/20 text-[#F5F1E8] placeholder-[#F5F1E8]/40 focus:outline-none focus:border-[#B8826D] resize-none text-sm sm:text-base box-border"
                  placeholder="Tell us about your organization and how you'd like to support rugby..."
                />
              </div>

              <button
                type="submit"
                className="w-full px-5 sm:px-6 py-3 sm:py-4 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 transition-colors text-sm sm:text-base min-h-[48px] sm:min-h-[52px]"
              >
                Start the Conversation
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;
