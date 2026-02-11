import React, { useState, useMemo } from 'react';
import { legends } from '@/data/sworData';
import LegendCard from '../LegendCard';
import { Search, BookOpen } from 'lucide-react';

interface LegendsPageProps {
  onSelectLegend: (id: string) => void;
  onNavigate?: (page: string) => void;
}

const LegendsPage: React.FC<LegendsPageProps> = ({ onSelectLegend, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');

  const countries = useMemo(() => {
    const unique = [...new Set(legends.map((l) => l.country))];
    return ['all', ...unique.sort()];
  }, []);

  // Extract unique roles from all legends
  const roles = useMemo(() => {
    const allRoles: string[] = [];
    legends.forEach(l => {
      if (l.descriptor) {
        l.descriptor.split(' · ').forEach(d => {
          if (!allRoles.includes(d)) allRoles.push(d);
        });
      }
    });
    return ['all', ...allRoles.sort()];
  }, []);

  const eras = ['all', '1970s-1980s', '1980s-1990s', '1990s-2000s', '2000s-2010s', '2010s-2020s', "Women's Rugby"];

  // Separate foundational legends from standard legends
  const foundationalLegends = useMemo(() => {
    return legends.filter((legend) => legend.isFoundational);
  }, []);

  const filteredLegends = useMemo(() => {
    return legends.filter((legend) => {
      // Always include foundational legends at the top unless specifically filtered out
      if (legend.isFoundational) {
        const matchesSearch =
          legend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          legend.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (legend.descriptor?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        
        const matchesCountry = selectedCountry === 'all' || legend.country === selectedCountry;
        const matchesEra = selectedEra === 'all' || selectedEra === "Women's Rugby";
        const matchesRole = selectedRole === 'all' || (legend.descriptor?.includes(selectedRole) ?? false);
        
        return matchesSearch && matchesCountry && matchesEra && matchesRole;
      }

      const matchesSearch =
        legend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        legend.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (legend.descriptor?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCountry = selectedCountry === 'all' || legend.country === selectedCountry;
      const matchesRole = selectedRole === 'all' || (legend.descriptor?.includes(selectedRole) ?? false);

      let matchesEra = true;
      if (selectedEra !== 'all' && selectedEra !== "Women's Rugby") {
        const [startDecade] = selectedEra.split('-');
        const startYear = parseInt(startDecade.replace('s', ''));
        const legendStartYear = parseInt(legend.era.split('-')[0]);
        matchesEra = legendStartYear >= startYear && legendStartYear < startYear + 20;
      } else if (selectedEra === "Women's Rugby") {
        // Show women's rugby legends
        matchesEra = legend.era === "Women's Rugby" || 
          ['Sarah Mitchell', 'Marie Dubois', 'Emma Williams', 'Aoife O\'Brien'].includes(legend.name);
      }

      return matchesSearch && matchesCountry && matchesRole && matchesEra;
    });
  }, [searchQuery, selectedCountry, selectedRole, selectedEra]);

  // Sort to ensure foundational profiles appear first
  const sortedLegends = useMemo(() => {
    return [...filteredLegends].sort((a, b) => {
      if (a.isFoundational && !b.isFoundational) return -1;
      if (!a.isFoundational && b.isFoundational) return 1;
      return 0;
    });
  }, [filteredLegends]);

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero - Light background for elder readability */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-white py-8 sm:py-12 md:py-16 border-b border-[#1A2332]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#B8826D] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
            Explore
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1A2332] leading-tight mb-3 sm:mb-4">
            Rugby Journeys
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#1A2332]/70 max-w-2xl leading-relaxed">
            The players, pioneers, and leaders who shaped rugby's history. Their stories, their wisdom, 
            their legacy, preserved for generations to come.
          </p>
          
          {/* Read the full explainer link */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('how-it-works')}
              className="mt-4 sm:mt-6 inline-flex items-center text-[#B8826D] hover:text-[#B8826D]/80 font-medium transition-colors min-h-[44px] text-sm sm:text-base"
            >
              <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
              Read the full explainer
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-[#1A2332]/10 sticky top-16 sm:top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#1A2332]/40" />
              <input
                type="text"
                placeholder="Search journeys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="swor-input w-full pl-9 sm:pl-10 pr-4 min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="swor-input px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px] flex-1 sm:flex-none"
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
                className="swor-input px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px] flex-1 sm:flex-none"
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
                className="swor-input px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px] flex-1 sm:flex-none"
              >
                {eras.map((era) => (
                  <option key={era} value={era}>
                    {era === 'all' ? 'All Eras' : era}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <p className="text-sm sm:text-base text-[#1A2332]/60 mb-4 sm:mb-6">
          Showing {sortedLegends.length} of {legends.length} journeys
        </p>

        {sortedLegends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {sortedLegends.map((legend) => (
              <LegendCard
                key={legend.id}
                legend={legend}
                onClick={() => onSelectLegend(legend.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-[#1A2332]/60 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">No journeys found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('all');
                setSelectedRole('all');
                setSelectedEra('all');
              }}
              className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 text-sm sm:text-base md:text-lg min-h-[44px] px-4"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Footer CTA - Invitational language */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12 border border-[#1A2332]/10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">
              Share a Rugby Journey
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 mb-5 sm:mb-6 leading-relaxed">
              Know someone whose story should be preserved? Invite them to begin their own Rugby Journey, 
              or contribute to an existing one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {onNavigate && (
                <>
                  <button 
                    onClick={() => onNavigate('contribute')}
                    className="swor-btn-primary min-h-[48px] sm:min-h-[52px] text-sm sm:text-base w-full sm:w-auto"
                  >
                    Begin a Journey
                  </button>
                  <button 
                    onClick={() => onNavigate('how-it-works')}
                    className="swor-btn-ghost border border-[#1A2332]/20 min-h-[48px] sm:min-h-[52px] text-sm sm:text-base w-full sm:w-auto"
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

export default LegendsPage;
