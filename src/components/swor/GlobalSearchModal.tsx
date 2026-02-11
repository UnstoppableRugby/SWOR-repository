import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, User, Building2, Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { rugbyJourneys, clubs, moments, people } from '@/data/sworData';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'journey' | 'club' | 'moment' | 'person';
  country: string;
  subtitle: string;
  image: string;
  page: string;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Build search results
  const allResults = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    rugbyJourneys.forEach(j => {
      results.push({
        id: j.id,
        name: j.name,
        type: 'journey',
        country: j.country,
        subtitle: j.roles?.join(', ') || j.era,
        image: j.image,
        page: `journey-${j.id}`,
      });
    });

    clubs.forEach(c => {
      results.push({
        id: c.id,
        name: c.name,
        type: 'club',
        country: c.country,
        subtitle: `Founded ${c.founded}`,
        image: c.image,
        page: `club-${c.id}`,
      });
    });

    moments.forEach(m => {
      results.push({
        id: m.id,
        name: m.title,
        type: 'moment',
        country: m.country,
        subtitle: `${m.year} - ${m.theme}`,
        image: m.image,
        page: `moment-${m.id}`,
      });
    });

    people.forEach(p => {
      results.push({
        id: p.id,
        name: p.name,
        type: 'person',
        country: p.country,
        subtitle: p.roles?.join(', ') || p.club,
        image: p.image,
        page: `person-${p.id}`,
      });
    });

    return results;
  }, []);

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allResults.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [allResults, query]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      journey: [],
      person: [],
      club: [],
      moment: [],
    };
    filteredResults.forEach(r => {
      groups[r.type].push(r);
    });
    return groups;
  }, [filteredResults]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'journey': return <User className="w-4 h-4" />;
      case 'club': return <Building2 className="w-4 h-4" />;
      case 'moment': return <Calendar className="w-4 h-4" />;
      case 'person': return <Users className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'journey': return 'Individual Journeys';
      case 'club': return 'Clubs';
      case 'moment': return 'Moments';
      case 'person': return 'People';
      default: return 'Results';
    }
  };

  const handleSelect = (page: string) => {
    onNavigate(page);
    onClose();
    setQuery('');
  };

  const handleViewAll = () => {
    onNavigate('search');
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 md:pt-32 px-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-[#1A2332]/10">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A2332]/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search journeys, clubs, moments, people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-14 pr-12 py-5 text-lg bg-transparent focus:outline-none text-[#1A2332] placeholder-[#1A2332]/40"
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#1A2332]/40 hover:text-[#1A2332] transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-6 text-center">
              <p className="text-[#1A2332]/60 text-sm">
                Start typing to search across all journeys
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => onNavigate('journeys')}
                  className="px-3 py-1.5 bg-[#F5F1E8] text-[#1A2332]/70 text-sm rounded-lg hover:bg-[#1A2332]/5 transition-colors"
                >
                  Browse Journeys
                </button>
                <button
                  onClick={() => onNavigate('clubs')}
                  className="px-3 py-1.5 bg-[#F5F1E8] text-[#1A2332]/70 text-sm rounded-lg hover:bg-[#1A2332]/5 transition-colors"
                >
                  Browse Clubs
                </button>
                <button
                  onClick={() => onNavigate('moments')}
                  className="px-3 py-1.5 bg-[#F5F1E8] text-[#1A2332]/70 text-sm rounded-lg hover:bg-[#1A2332]/5 transition-colors"
                >
                  Browse Moments
                </button>
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[#1A2332]/60 text-sm">
                No results found for "{query}"
              </p>
              <p className="text-[#1A2332]/40 text-xs mt-2">
                Try a different search term or browse our collections
              </p>
            </div>
          ) : (
            <div className="p-4">
              {/* Result count */}
              <p className="text-xs text-[#1A2332]/50 mb-3 px-2">
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
              </p>

              {/* Grouped results */}
              {Object.entries(groupedResults).map(([type, results]) => {
                if (results.length === 0) return null;
                return (
                  <div key={type} className="mb-4">
                    <h3 className="text-xs font-medium text-[#1A2332]/50 uppercase tracking-wider px-2 mb-2 flex items-center">
                      {getTypeIcon(type)}
                      <span className="ml-2">{getTypeLabel(type)}</span>
                    </h3>
                    <div className="space-y-1">
                      {results.map(result => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result.page)}
                          className="w-full flex items-center p-3 rounded-xl hover:bg-[#F5F1E8] transition-colors text-left group"
                        >
                          <img
                            src={result.image}
                            alt={result.name}
                            className="w-12 h-12 rounded-lg object-cover mr-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A2332] truncate group-hover:text-[#B8826D] transition-colors">
                              {result.name}
                            </p>
                            <p className="text-sm text-[#1A2332]/50 truncate flex items-center">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              {result.country}
                              <span className="mx-1.5">·</span>
                              {result.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#1A2332]/20 group-hover:text-[#B8826D] transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* View all results */}
              {filteredResults.length > 0 && (
                <button
                  onClick={handleViewAll}
                  className="w-full mt-2 p-3 text-center text-sm text-[#B8826D] font-medium hover:bg-[#B8826D]/5 rounded-xl transition-colors"
                >
                  View all results on Search page
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 bg-[#F5F1E8] border-t border-[#1A2332]/10">
          <p className="text-xs text-[#1A2332]/40 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white rounded text-[#1A2332]/60 font-mono text-xs">Esc</kbd> to close
          </p>
        </div>
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

export default GlobalSearchModal;
