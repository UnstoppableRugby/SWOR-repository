import React, { useState, useMemo } from 'react';
import { rugbyJourneys } from '@/data/sworData';
import LegendCard from '../LegendCard';
import { Search, Users, User, Calendar, BookOpen, Filter, ChevronDown, X } from 'lucide-react';

interface RugbyJourneysPageProps {
  onSelectJourney: (id: string) => void;
  onNavigate?: (page: string) => void;
}

const RugbyJourneysPage: React.FC<RugbyJourneysPageProps> = ({ onSelectJourney, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const countries = useMemo(() => {
    const unique = [...new Set(rugbyJourneys.map((j) => j.country))];
    return ['all', ...unique.sort()];
  }, []);

  const roles = useMemo(() => {
    const allRoles = rugbyJourneys.flatMap((j) => j.roles);
    const unique = [...new Set(allRoles)].filter(r => 
      !['Pioneer', 'Leader', 'Administrator', 'Steward of the Game'].includes(r)
    );
    return ['all', ...unique.sort()];
  }, []);

  const eras = ['all', '1970s-1980s', '1980s-1990s', '1990s-2000s', '2000s-2010s', '2010s-2020s', "Women's Rugby"];

  const filteredJourneys = useMemo(() => {
    return rugbyJourneys.filter((journey) => {
      // Handle foundational profiles
      if (journey.isFoundational) {
        const matchesSearch =
          journey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          journey.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (journey.descriptors?.some(d => d.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);
        
        const matchesCountry = selectedCountry === 'all' || journey.country === selectedCountry;
        const matchesEra = selectedEra === 'all' || selectedEra === "Women's Rugby";
        
        return matchesSearch && matchesCountry && matchesEra;
      }

      const matchesSearch =
        journey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journey.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journey.roles.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCountry = selectedCountry === 'all' || journey.country === selectedCountry;
      const matchesRole = selectedRole === 'all' || journey.roles.includes(selectedRole);

      let matchesEra = true;
      if (selectedEra !== 'all' && selectedEra !== "Women's Rugby") {
        const [startDecade] = selectedEra.split('-');
        const startYear = parseInt(startDecade.replace('s', ''));
        const journeyStartYear = parseInt(journey.era.split('-')[0]);
        matchesEra = journeyStartYear >= startYear && journeyStartYear < startYear + 20;
      } else if (selectedEra === "Women's Rugby") {
        matchesEra = journey.era === "Women's Rugby" || 
          journey.roles.some(r => ['Advocate', 'Trailblazer'].includes(r)) ||
          ['Sarah Mitchell', 'Marie Dubois', 'Emma Williams', 'Aoife O\'Brien', 'Sue Dorrington'].includes(journey.name);
      }

      return matchesSearch && matchesCountry && matchesRole && matchesEra;
    });
  }, [searchQuery, selectedCountry, selectedRole, selectedEra]);

  // Sort to ensure foundational profiles appear first
  const sortedJourneys = useMemo(() => {
    return [...filteredJourneys].sort((a, b) => {
      if (a.isFoundational && !b.isFoundational) return -1;
      if (!a.isFoundational && b.isFoundational) return 1;
      return 0;
    });
  }, [filteredJourneys]);

  // Convert to legend format for LegendCard compatibility
  const journeysAsLegends = sortedJourneys.map(journey => ({
    ...journey,
    position: journey.roles[1] || journey.roles[0],
    caps: 0,
    descriptor: journey.descriptors?.join(' · '),
  }));

  const hasActiveFilters = selectedCountry !== 'all' || selectedRole !== 'all' || selectedEra !== 'all';
  const activeFilterCount = [
    selectedCountry !== 'all',
    selectedRole !== 'all',
    selectedEra !== 'all'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedRole('all');
    setSelectedEra('all');
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero - Light background for elder readability */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-white py-8 sm:py-12 md:py-16 border-b border-[#1A2332]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#B8826D] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase mb-2 sm:mb-4">
            Explore
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1A2332] leading-tight mb-3 sm:mb-4">
            Rugby Journeys
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#1A2332]/70 max-w-2xl mb-6 sm:mb-8 leading-relaxed">
            Every journey matters. Players, pioneers, coaches, volunteers, and stewards, 
            their stories preserved for generations to come.
          </p>
          
          {/* Journey Type Indicators */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 text-[#1A2332]/60 text-xs sm:text-sm md:text-base">
              <User className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span>Your Rugby Journey</span>
            </div>
            <div className="flex items-center space-x-2 text-[#1A2332]/60 text-xs sm:text-sm md:text-base">
              <Users className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span>Our Rugby Journey</span>
            </div>
            <div className="flex items-center space-x-2 text-[#1A2332]/60 text-xs sm:text-sm md:text-base">
              <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span>The Journey of...</span>
            </div>
          </div>

          {/* Read the full explainer */}
          <button
            onClick={() => onNavigate?.('how-it-works')}
            className="inline-flex items-center text-[#B8826D] hover:text-[#B8826D]/80 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Read the full explainer
          </button>
        </div>
      </div>

      {/* Governance Note */}
      <div className="bg-[#B8826D]/10 border-b border-[#B8826D]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <p className="text-xs sm:text-sm md:text-base text-[#1A2332]/70 text-center leading-relaxed">
            All journeys acknowledge the people, clubs, and communities that enabled them. 
            No journey is framed as a solo achievement.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-[#1A2332]/10 sticky top-16 sm:top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Search - Always visible */}
          <div className="relative mb-3 sm:mb-0 sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-[#1A2332]/40" />
            <input
              type="text"
              placeholder="Search journeys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-[#B8826D] text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A2332]/40 hover:text-[#1A2332] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="flex items-center justify-between sm:hidden mt-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 bg-[#F5F1E8] rounded-lg text-sm font-medium text-[#1A2332] min-h-[44px]"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 w-5 h-5 bg-[#B8826D] text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#B8826D] font-medium min-h-[44px] px-3"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="sm:hidden space-y-3 pt-3 mt-3 border-t border-[#1A2332]/10">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-h-[44px]"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country === 'all' ? 'All Countries' : country}
                  </option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-h-[44px]"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role}
                  </option>
                ))}
              </select>

              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-h-[44px]"
              >
                {eras.map((era) => (
                  <option key={era} value={era}>
                    {era === 'all' ? 'All Eras' : era}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Desktop Filters */}
          <div className="hidden sm:flex flex-col lg:flex-row gap-4 mt-4">
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-w-[140px] min-h-[40px]"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country === 'all' ? 'All Countries' : country}
                  </option>
                ))}
              </select>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-w-[120px] min-h-[40px]"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role}
                  </option>
                ))}
              </select>

              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-w-[120px] min-h-[40px]"
              >
                {eras.map((era) => (
                  <option key={era} value={era}>
                    {era === 'all' ? 'All Eras' : era}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 text-sm text-[#B8826D] hover:text-[#B8826D]/80 font-medium"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12">
        <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/60 mb-4 sm:mb-6">
          Showing {sortedJourneys.length} of {rugbyJourneys.length} journeys
        </p>

        {sortedJourneys.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {journeysAsLegends.map((journey) => (
              <LegendCard
                key={journey.id}
                legend={journey}
                onClick={() => onSelectJourney(journey.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-[#1A2332]/60 mb-4 text-base sm:text-lg">No journeys found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 text-sm sm:text-base md:text-lg min-h-[44px] px-4"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Invite CTA - Invitational language */}
        <div className="mt-12 sm:mt-16 md:mt-20">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-center border border-[#1A2332]/10">
            <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">
              Share a Rugby Journey
            </h3>
            <p className="text-[#1A2332]/70 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
              Know someone whose story should be preserved? Invite them to begin their own Rugby Journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {onNavigate && (
                <>
                  <button 
                    onClick={() => onNavigate('contribute')}
                    className="px-6 py-3 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors min-h-[48px] text-sm sm:text-base"
                  >
                    Begin a Journey
                  </button>
                  <button 
                    onClick={() => onNavigate('how-it-works')}
                    className="px-6 py-3 border border-[#1A2332]/20 text-[#1A2332] rounded-lg font-medium hover:bg-[#1A2332]/5 transition-colors min-h-[48px] text-sm sm:text-base"
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

export default RugbyJourneysPage;
