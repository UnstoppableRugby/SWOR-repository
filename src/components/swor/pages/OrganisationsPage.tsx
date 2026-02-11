import React from 'react';
import { Building2, Globe, Users, Shield, ArrowRight } from 'lucide-react';

interface OrganisationsPageProps {
  onNavigate: (page: string) => void;
}

const OrganisationsPage: React.FC<OrganisationsPageProps> = ({ onNavigate }) => {
  const organisations = [
    {
      id: 'world-rugby',
      name: 'World Rugby',
      type: 'Global Governing Body',
      description: 'The international federation for rugby union, responsible for the Laws of the Game and global development.',
      location: 'Dublin, Ireland',
      founded: 1886,
      image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716843365_18094df4.jpg',
    },
    {
      id: 'rfu',
      name: 'Rugby Football Union',
      type: 'National Union',
      description: 'The governing body for rugby union in England, one of the founding members of the sport.',
      location: 'Twickenham, England',
      founded: 1871,
      image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716852404_9836500f.png',
    },
    {
      id: 'nzr',
      name: 'New Zealand Rugby',
      type: 'National Union',
      description: 'The national governing body for rugby in New Zealand, home of the All Blacks.',
      location: 'Wellington, New Zealand',
      founded: 1892,
      image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716854701_14023eed.png',
    },
    {
      id: 'saru',
      name: 'South African Rugby Union',
      type: 'National Union',
      description: 'The governing body for rugby union in South Africa, custodians of the Springbok legacy.',
      location: 'Cape Town, South Africa',
      founded: 1889,
      image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716857163_20ac8754.png',
    },
    {
      id: 'irfu',
      name: 'Irish Rugby Football Union',
      type: 'National Union',
      description: 'The all-island governing body for rugby in Ireland, representing both the Republic and Northern Ireland.',
      location: 'Dublin, Ireland',
      founded: 1879,
      image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716855567_f23cba98.png',
    },
    {
      id: 'wru',
      name: 'Welsh Rugby Union',
      type: 'National Union',
      description: 'The governing body for rugby union in Wales, with a rich history of international success.',
      location: 'Cardiff, Wales',
      founded: 1881,
      image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716848102_d077b7c6.jpg',
    },
  ];

  const foundations = [
    {
      id: 'rugby-foundation',
      name: 'Rugby Players Foundation',
      focus: 'Player Welfare',
      description: 'Supporting current and former players through welfare programmes and career transition.',
    },
    {
      id: 'grassroots-trust',
      name: 'Grassroots Rugby Trust',
      focus: 'Community Development',
      description: 'Investing in local clubs and youth programmes to grow the game at community level.',
    },
    {
      id: 'womens-rugby-foundation',
      name: 'Women\'s Rugby Foundation',
      focus: 'Women\'s Game',
      description: 'Advancing opportunities and support for women and girls in rugby worldwide.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero */}
      <div className="bg-[#1A2332] py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4">
            Our Rugby Journey
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#F5F1E8] leading-tight mb-3 sm:mb-4">
            Organisations & Foundations
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/70 max-w-2xl">
            The governing bodies, unions, and foundations that steward the game. 
            Their journeys are collective – shaped by generations of contributors.
          </p>
        </div>
      </div>

      {/* Governance Note */}
      <div className="bg-[#B8826D]/10 border-b border-[#B8826D]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <p className="text-xs sm:text-sm text-[#1A2332]/70 text-center leading-relaxed">
            SWOR recognises that provinces, states, counties, and regions may function as unions. 
            Governance is documented as it existed at the time.
          </p>
        </div>
      </div>

      {/* Unions Section */}
      <section className="py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-[#B8826D] flex-shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332]">Rugby Unions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {organisations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={org.image}
                    alt={org.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <span className="text-xs text-[#B8826D] font-medium tracking-wide">{org.type}</span>
                  <h3 className="font-serif text-lg sm:text-xl text-[#1A2332] mt-1 mb-2">{org.name}</h3>
                  <p className="text-xs sm:text-sm text-[#1A2332]/60 mb-3 sm:mb-4 line-clamp-3">{org.description}</p>
                  <div className="flex items-center justify-between text-xs text-[#1A2332]/50">
                    <span className="truncate mr-2">{org.location}</span>
                    <span className="flex-shrink-0">Est. {org.founded}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Foundations Section */}
      <section className="py-10 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#B8826D] flex-shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332]">Foundations & Trusts</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {foundations.map((foundation) => (
              <div
                key={foundation.id}
                className="bg-[#F5F1E8] rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow"
              >
                <span className="inline-block px-2.5 sm:px-3 py-1 bg-[#B8826D]/10 text-[#B8826D] text-xs font-medium rounded-full mb-3 sm:mb-4">
                  {foundation.focus}
                </span>
                <h3 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-2 sm:mb-3">{foundation.name}</h3>
                <p className="text-xs sm:text-sm text-[#1A2332]/60">{foundation.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance Principles */}
      <section className="py-10 sm:py-12 md:py-16 bg-[#1A2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#F5F1E8] mb-3 sm:mb-4">
              How SWOR Documents Organisations
            </h2>
            <p className="text-sm sm:text-base text-[#F5F1E8]/70">
              Relationships and affiliations are described, not standardised. 
              We respect the complexity of rugby's governance structures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <div className="bg-[#F5F1E8]/10 rounded-xl p-4 sm:p-5 md:p-6">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#B8826D] mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="font-medium text-sm sm:text-base text-[#F5F1E8] mb-2">Contextual Documentation</h3>
              <p className="text-xs sm:text-sm text-[#F5F1E8]/60">
                Governance documented as it existed at the time of each journey.
              </p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-xl p-4 sm:p-5 md:p-6">
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-[#B8826D] mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="font-medium text-sm sm:text-base text-[#F5F1E8] mb-2">Regional Recognition</h3>
              <p className="text-xs sm:text-sm text-[#F5F1E8]/60">
                Provinces, states, and regions recognised as they function locally.
              </p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-xl p-4 sm:p-5 md:p-6">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#B8826D] mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="font-medium text-sm sm:text-base text-[#F5F1E8] mb-2">Collective Journeys</h3>
              <p className="text-xs sm:text-sm text-[#F5F1E8]/60">
                Organisations represented as collective journeys, not monolithic entities.
              </p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-xl p-4 sm:p-5 md:p-6">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#B8826D] mb-3 sm:mb-4 flex-shrink-0" />
              <h3 className="font-medium text-sm sm:text-base text-[#F5F1E8] mb-2">No Hierarchy</h3>
              <p className="text-xs sm:text-sm text-[#F5F1E8]/60">
                No tiered status categories. All journeys are valued equally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-12 md:py-16 bg-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-xl sm:text-2xl text-[#1A2332] mb-3 sm:mb-4">
            Represent Your Organisation
          </h2>
          <p className="text-sm sm:text-base text-[#1A2332]/70 mb-6 sm:mb-8 max-w-xl mx-auto">
            If you represent a rugby union, foundation, or organisation, we'd love to 
            help document your collective journey.
          </p>
          <button
            onClick={() => onNavigate('contribute')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 sm:px-6 py-3 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 transition-colors min-h-[44px] sm:min-h-[48px]"
          >
            <span>Get in Touch</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default OrganisationsPage;
