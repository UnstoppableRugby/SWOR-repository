import React, { useState, useMemo } from 'react';
import { rugbyJourneys, clubs, moments, people } from '@/data/sworData';
import { Search, User, Building2, Calendar, Users, MapPin, Filter, X, ArrowLeftRight, ChevronDown } from 'lucide-react';
import JourneyCompare from '../JourneyCompare';

interface SearchPageProps {
  onNavigate: (page: string) => void;
  initialQuery?: string;
}

// Unified search result type
interface SearchResult {
  id: string;
  name: string;
  type: 'person' | 'club' | 'moment' | 'people';
  typeLabel: string;
  country: string;
  era: string;
  summary: string;
  image: string;
  roles?: string[];
  navigateTo: string;
}

const SearchPage: React.FC<SearchPageProps> = ({ onNavigate, initialQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareJourneyId, setCompareJourneyId] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Build unified search index
  const allResults = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    // Add rugby journeys
    rugbyJourneys.forEach(j => {
      results.push({
        id: j.id,
        name: j.name,
        type: 'person',
        typeLabel: 'Rugby Journey',
        country: j.country,
        era: j.era,
        summary: j.summary,
        image: j.image,
        roles: j.roles,
        navigateTo: `journey-${j.id}`,
      });
    });

    // Add clubs
    clubs.forEach(c => {
      results.push({
        id: c.id,
        name: c.name,
        type: 'club',
        typeLabel: 'Club',
        country: c.country,
        era: `Founded ${c.founded}`,
        summary: c.summary,
        image: c.image,
        navigateTo: `club-${c.id}`,
      });
    });

    // Add moments
    moments.forEach(m => {
      results.push({
        id: m.id,
        name: m.title,
        type: 'moment',
        typeLabel: 'Historic Moment',
        country: m.country,
        era: `${m.year}`,
        summary: m.description,
        image: m.image,
        roles: [m.theme],
        navigateTo: `moment-${m.id}`,
      });
    });

    // Add people
    people.forEach(p => {
      results.push({
        id: p.id,
        name: p.name,
        type: 'people',
        typeLabel: 'Community Member',
        country: p.country,
        era: p.years,
        summary: p.contribution,
        image: p.image,
        roles: p.roles,
        navigateTo: `person-${p.id}`,
      });
    });

    return results;
  }, []);

  // Get unique filter options
  const countries = useMemo(() => {
    const unique = [...new Set(allResults.map(r => r.country))];
    return ['all', ...unique.sort()];
  }, [allResults]);

  const eras = ['all', '1870s-1900s', '1900s-1950s', '1950s-1980s', '1980s-2000s', '2000s-present', "Women's Rugby"];

  const typeOptions = [
    { value: 'all', label: 'All', icon: Search },
    { value: 'person', label: 'People', icon: User },
    { value: 'club', label: 'Clubs', icon: Building2 },
    { value: 'moment', label: 'Moments', icon: Calendar },
    { value: 'people', label: 'Community', icon: Users },
  ];

  // Filter results
  const filteredResults = useMemo(() => {
    return allResults.filter(result => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = result.name.toLowerCase().includes(query);
        const matchesCountry = result.country.toLowerCase().includes(query);
        const matchesSummary = result.summary.toLowerCase().includes(query);
        const matchesRoles = result.roles?.some(r => r.toLowerCase().includes(query)) ?? false;
        
        if (!matchesName && !matchesCountry && !matchesSummary && !matchesRoles) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all' && result.type !== selectedType) {
        return false;
      }

      // Country filter
      if (selectedCountry !== 'all' && result.country !== selectedCountry) {
        return false;
      }

      // Era filter (simplified)
      if (selectedEra !== 'all') {
        if (selectedEra === "Women's Rugby") {
          const isWomensRugby = result.era === "Women's Rugby" || 
            result.roles?.some(r => ['Advocate', 'Trailblazer', 'Pioneer'].includes(r)) ||
            result.name.includes('Women');
          if (!isWomensRugby) return false;
        }
        // Other era filters could be implemented based on year parsing
      }

      return true;
    });
  }, [allResults, searchQuery, selectedType, selectedCountry, selectedEra]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return <User className="w-4 h-4" />;
      case 'club': return <Building2 className="w-4 h-4" />;
      case 'moment': return <Calendar className="w-4 h-4" />;
      case 'people': return <Users className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCountry('all');
    setSelectedEra('all');
  };

  const hasActiveFilters = searchQuery || selectedType !== 'all' || selectedCountry !== 'all' || selectedEra !== 'all';
  const activeFilterCount = [
    selectedType !== 'all',
    selectedCountry !== 'all',
    selectedEra !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-white py-8 sm:py-12 md:py-16 border-b border-[#1A2332]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#B8826D] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase mb-2 sm:mb-4">
            Discover
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1A2332] leading-tight mb-3 sm:mb-4">
            Search All Journeys
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#1A2332]/70 max-w-2xl leading-relaxed">
            Find people, clubs, moments, and communities across the entire SWOR ecosystem.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-[#1A2332]/10 sticky top-16 sm:top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Main Search */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-[#1A2332]/40" />
            <input
              type="text"
              placeholder="Search by name, country, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-xl border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-[#B8826D] text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#1A2332]/40 hover:text-[#1A2332] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="flex items-center justify-between sm:hidden mb-3">
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
            
            {/* Compare Button - Mobile */}
            <button
              onClick={() => {
                setCompareJourneyId(undefined);
                setCompareOpen(true);
              }}
              className="flex items-center px-3 py-2 bg-[#8B9D83]/10 text-[#8B9D83] rounded-lg text-sm font-medium min-h-[44px]"
            >
              <ArrowLeftRight className="w-4 h-4 mr-1.5" />
              Compare
            </button>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="sm:hidden space-y-3 pb-3 border-b border-[#1A2332]/10 mb-3">
              {/* Type Filter - Mobile */}
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedType(option.value)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      selectedType === option.value
                        ? 'bg-[#B8826D] text-white'
                        : 'bg-[#F5F1E8] text-[#1A2332]/70'
                    }`}
                  >
                    <option.icon className="w-4 h-4 mr-1.5" />
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Country & Era Filters - Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-h-[44px]"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country === 'all' ? 'All Countries' : country}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-h-[44px]"
                >
                  {eras.map(era => (
                    <option key={era} value={era}>
                      {era === 'all' ? 'All Eras' : era}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters - Mobile */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 text-sm text-[#B8826D] font-medium min-h-[44px]"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Desktop Filters Row */}
          <div className="hidden sm:flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="flex items-center bg-[#F5F1E8] rounded-lg p-1">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedType === option.value
                      ? 'bg-white text-[#B8826D] shadow-sm'
                      : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                  }`}
                >
                  <option.icon className="w-4 h-4 mr-1.5" />
                  {option.label}
                </button>
              ))}
            </div>

            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-h-[40px]"
            >
              {countries.map(country => (
                <option key={country} value={country}>
                  {country === 'all' ? 'All Countries' : country}
                </option>
              ))}
            </select>

            {/* Era Filter */}
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] text-sm focus:outline-none focus:border-[#B8826D] min-h-[40px]"
            >
              {eras.map(era => (
                <option key={era} value={era}>
                  {era === 'all' ? 'All Eras' : era}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm text-[#B8826D] hover:text-[#B8826D]/80 font-medium"
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </button>
            )}

            {/* Compare Button - Desktop */}
            <button
              onClick={() => {
                setCompareJourneyId(undefined);
                setCompareOpen(true);
              }}
              className="ml-auto flex items-center px-4 py-2 bg-[#8B9D83]/10 text-[#8B9D83] rounded-lg text-sm font-medium hover:bg-[#8B9D83]/20 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Compare Journeys
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Results Count - quiet, not prominent */}
        <p className="text-xs sm:text-sm text-[#1A2332]/50 mb-4 sm:mb-6">
          {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} found
        </p>

        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredResults.map(result => (
              <div
                key={`${result.type}-${result.id}`}
                className="bg-white rounded-xl overflow-hidden border border-[#1A2332]/10 hover:border-[#B8826D]/30 hover:shadow-lg transition-all group cursor-pointer active:scale-[0.98]"
                onClick={() => onNavigate(result.navigateTo)}
              >
                <div className="relative h-32 sm:h-40 overflow-hidden">
                  <img
                    src={result.image}
                    alt={result.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 py-1 bg-[#1A2332]/80 rounded text-[10px] sm:text-xs text-white flex items-center">
                    {getTypeIcon(result.type)}
                    <span className="ml-1">{result.typeLabel}</span>
                  </div>
                  {/* Compare button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareJourneyId(result.id);
                      setCompareOpen(true);
                    }}
                    className="absolute top-2 sm:top-3 right-2 sm:right-3 p-2 bg-white/90 rounded-lg text-[#1A2332]/60 hover:text-[#8B9D83] hover:bg-white opacity-0 group-hover:opacity-100 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Compare with another journey"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-1 group-hover:text-[#B8826D] transition-colors line-clamp-1">
                    {result.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#1A2332]/60 flex items-center mb-2">
                    <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate">{result.country} · {result.era}</span>
                  </p>
                  {result.roles && result.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {result.roles.slice(0, 2).map(role => (
                        <span key={role} className="px-1.5 sm:px-2 py-0.5 bg-[#B8826D]/10 text-[#B8826D] text-[10px] sm:text-xs rounded">
                          {role}
                        </span>
                      ))}
                      {result.roles.length > 2 && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-[#1A2332]/5 text-[#1A2332]/40 text-[10px] sm:text-xs rounded">
                          +{result.roles.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-[#1A2332]/70 line-clamp-2">
                    {result.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <Search className="w-10 sm:w-12 h-10 sm:h-12 text-[#1A2332]/20 mx-auto mb-4" />
            <p className="text-[#1A2332]/60 mb-3 sm:mb-4 text-base sm:text-lg">No results found</p>
            <p className="text-[#1A2332]/40 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={clearFilters}
              className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 min-h-[44px] px-4"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Incomplete Records Note */}
        {filteredResults.length > 0 && (
          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-xs sm:text-sm text-[#1A2332]/40 italic px-4">
              Some records are still growing. If you believe something is missing, you can suggest an addition.
            </p>
          </div>
        )}
      </div>

      {/* Side-by-Side Compare Modal */}
      <JourneyCompare
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        initialJourneyId={compareJourneyId}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default SearchPage;
