import React, { useState, useMemo } from 'react';
import { moments } from '@/data/sworData';
import MomentCard from '../MomentCard';
import { Search, Calendar, BookOpen } from 'lucide-react';

interface MomentsPageProps {
  onSelectMoment: (id: string) => void;
  onNavigate?: (page: string) => void;
}

const MomentsPage: React.FC<MomentsPageProps> = ({ onSelectMoment, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');

  const eras = useMemo(() => {
    const unique = [...new Set(moments.map((m) => m.era))];
    return ['all', ...unique.sort()];
  }, []);

  const themes = useMemo(() => {
    const unique = [...new Set(moments.map((m) => m.theme))];
    return ['all', ...unique.sort()];
  }, []);

  const filteredMoments = useMemo(() => {
    return moments.filter((moment) => {
      const matchesSearch =
        moment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        moment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        moment.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEra = selectedEra === 'all' || moment.era === selectedEra;
      const matchesTheme = selectedTheme === 'all' || moment.theme === selectedTheme;

      return matchesSearch && matchesEra && matchesTheme;
    }).sort((a, b) => a.year - b.year);
  }, [searchQuery, selectedEra, selectedTheme]);

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Hero - Light background for elder readability */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-white py-8 sm:py-12 md:py-16 border-b border-[#1A2332]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#B8826D] text-xs sm:text-sm md:text-base font-medium tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
            Event Journeys
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1A2332] leading-tight mb-3 sm:mb-4">
            The Journey of Moments
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#1A2332]/70 max-w-2xl leading-relaxed">
            The defining moments that shaped rugby. A curated archive of the game's most 
            significant chapters, preserved with care.
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

      {/* Timeline */}
      <div className="border-b border-[#1A2332]/10 py-4 sm:py-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start sm:justify-center space-x-2 sm:space-x-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {['1870s', '1880s', '1920s', '1990s'].map((era) => (
              <button
                key={era}
                onClick={() => setSelectedEra(selectedEra === era ? 'all' : era)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm md:text-base font-medium transition-colors min-h-[40px] sm:min-h-[44px] ${
                  selectedEra === era
                    ? 'bg-[#B8826D] text-[#F5F1E8]'
                    : 'bg-[#1A2332]/10 text-[#1A2332]/60 hover:text-[#1A2332] active:bg-[#1A2332]/20'
                }`}
              >
                {era}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#1A2332]/40" />
            <input
              type="text"
              placeholder="Search moments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="swor-input w-full pl-9 sm:pl-10 min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
            />
          </div>

          {/* Theme Filter */}
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="swor-input min-h-[44px] sm:min-h-[48px] text-sm sm:text-base px-3 sm:px-4"
          >
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme === 'all' ? 'All Themes' : theme}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/60 mb-4 sm:mb-6">
          Showing {filteredMoments.length} of {moments.length} moments
        </p>

        {filteredMoments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {filteredMoments.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                onClick={() => onSelectMoment(moment.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-[#1A2332]/60 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">No moments found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEra('all');
                setSelectedTheme('all');
              }}
              className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 text-sm sm:text-base md:text-lg min-h-[44px] px-4"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Contribute CTA - Invitational language */}
        <div className="mt-10 sm:mt-12 md:mt-16">
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12 text-center border border-[#1A2332]/10">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-[#B8826D] mx-auto mb-3 sm:mb-4" />
            <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">
              Have a moment to share?
            </h3>
            <p className="text-[#1A2332]/70 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
              Help preserve rugby's history. Share photos, stories, and memories from your club or personal collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {onNavigate && (
                <>
                  <button 
                    onClick={() => onNavigate('contribute')}
                    className="swor-btn-primary min-h-[48px] sm:min-h-[52px] text-sm sm:text-base w-full sm:w-auto"
                  >
                    Contribute to the Archive
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

export default MomentsPage;
