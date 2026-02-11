import React, { useState, useMemo } from 'react';
import { clubs } from '@/data/sworData';
import ClubCard from '../ClubCard';
import { Search, MapPin, Calendar, Users, ArrowRight, BookOpen } from 'lucide-react';

interface ClubsPageProps {
  onSelectClub: (id: string) => void;
  onNavigate?: (page: string) => void;
}

const ClubsPage: React.FC<ClubsPageProps> = ({ onSelectClub, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const countries = useMemo(() => {
    const unique = [...new Set(clubs.map((c) => c.country))];
    return ['all', ...unique.sort()];
  }, []);

  // Separate foundational clubs from others
  const foundationalClubs = useMemo(() => {
    return clubs.filter(club => club.isFoundational);
  }, []);

  const filteredClubs = useMemo(() => {
    let result = clubs.filter((club) => {
      // Exclude foundational clubs from main grid (they're featured separately)
      if (club.isFoundational) return false;
      
      const matchesSearch =
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = selectedCountry === 'all' || club.country === selectedCountry;

      return matchesSearch && matchesCountry;
    });

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'founded') {
      result.sort((a, b) => a.founded - b.founded);
    } else if (sortBy === 'members') {
      result.sort((a, b) => b.members - a.members);
    }

    return result;
  }, [searchQuery, selectedCountry, sortBy]);

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">

      {/* Hero - Light background for elder readability */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-white py-10 sm:py-12 md:py-16 border-b border-[#1A2332]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#8B9D83] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase mb-3 sm:mb-4">
            Collective Journeys
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1A2332] leading-tight mb-4 sm:mb-6">
            Our Rugby Journeys
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#1A2332]/70 max-w-2xl leading-relaxed">
            The beating hearts of rugby. From historic institutions to grassroots clubs, 
            each with a story worth preserving. These are collective journeys, shaped by 
            generations of players, volunteers, and families.
          </p>
          
          {/* Read the full explainer link */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('how-it-works')}
              className="mt-5 sm:mt-6 inline-flex items-center text-[#8B9D83] hover:text-[#8B9D83]/80 font-medium transition-colors text-sm sm:text-base min-h-[44px]"
            >
              <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Read the full explainer</span>
            </button>
          )}
        </div>
      </div>

      {/* Featured Foundational Journey */}
      {foundationalClubs.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          <p className="text-xs sm:text-sm text-[#1A2332]/60 font-medium tracking-widest uppercase mb-4 sm:mb-6">
            Featured Journey
          </p>
          {foundationalClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => onSelectClub(club.id)}
              className="w-full bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-[#1A2332]/5 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 bg-[#8B9D83]/10 mx-auto sm:mx-0">
                  <img
                    src={club.image}
                    alt={club.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                    <p className="text-[#8B9D83] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase">
                      Our Rugby Journey
                    </p>
                    {club.hasPhase3 && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-[#8B9D83]/10 text-[#8B9D83] text-xs font-medium rounded">
                        Phase 3 Active
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-2 sm:mb-3 group-hover:text-[#8B9D83] transition-colors">
                    {club.name}
                  </h2>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <span className="inline-flex items-center text-xs sm:text-sm md:text-base text-[#1A2332]/60">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      <span className="truncate">{club.location}, {club.country}</span>
                    </span>
                    <span className="inline-flex items-center text-xs sm:text-sm md:text-base text-[#1A2332]/60">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      <span>Est. {club.founded}</span>
                    </span>
                    <span className="inline-flex items-center text-xs sm:text-sm md:text-base text-[#1A2332]/60">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      <span>{club.members} members</span>
                    </span>
                  </div>

                  <p className="text-[#1A2332]/70 leading-relaxed text-sm sm:text-base md:text-lg mb-3 sm:mb-4">
                    {club.summary}
                  </p>
                  <span className="inline-flex items-center text-[#8B9D83] font-medium group-hover:text-[#8B9D83]/80 transition-colors text-sm sm:text-base md:text-lg">
                    <span>Explore this journey</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-y border-[#1A2332]/10 sticky top-16 sm:top-20 z-40">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#1A2332]/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] sm:min-h-[48px] pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base border border-[#1A2332]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50 focus:border-[#8B9D83] bg-white box-border"
              />

            </div>

            {/* Filters Row */}
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="flex-1 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 text-sm sm:text-base border border-[#1A2332]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50 focus:border-[#8B9D83] bg-white appearance-none cursor-pointer box-border min-w-0"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country === 'all' ? 'All Countries' : country}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 text-sm sm:text-base border border-[#1A2332]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50 focus:border-[#8B9D83] bg-white appearance-none cursor-pointer box-border min-w-0"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="name">Sort by Name</option>
                <option value="founded">Sort by Founded</option>
                <option value="members">Sort by Members</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/60 mb-6 sm:mb-8">
          Showing {filteredClubs.length} clubs
        </p>

        {filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onClick={() => onSelectClub(club.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-[#1A2332]/60 mb-4 text-base sm:text-lg">No clubs found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('all');
              }}
              className="text-[#8B9D83] font-medium hover:text-[#8B9D83]/80 text-sm sm:text-base md:text-lg min-h-[44px]"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Invite CTA - Invitational language */}
        <div className="mt-10 sm:mt-12 md:mt-16">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-center border border-[#1A2332]/10">
            <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">
              Is your club part of rugby's story?
            </h3>
            <p className="text-[#1A2332]/70 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
              Connect your club's history and community to the global rugby family. 
              Every club has a journey worth preserving.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {onNavigate && (
                <>
                  <button 
                    onClick={() => onNavigate('contribute')}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-[#8B9D83] text-white font-medium rounded-lg hover:bg-[#8B9D83]/90 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Share Your Club's Journey
                  </button>
                  <button 
                    onClick={() => onNavigate('how-it-works')}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-transparent text-[#1A2332] font-medium rounded-lg border border-[#1A2332]/20 hover:bg-[#1A2332]/5 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Read the full explainer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubsPage;
