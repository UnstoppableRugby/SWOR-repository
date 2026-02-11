import React, { useState, useMemo } from 'react';
import { rugbyJourneys, clubs, moments, people } from '@/data/sworData';
import { Search, X, Users, User, Calendar, MapPin, Building2, ArrowLeftRight, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface JourneyCompareProps {
  isOpen: boolean;
  onClose: () => void;
  initialJourneyId?: string;
  onNavigate?: (page: string) => void;
}

// Unified journey type for comparison
interface UnifiedJourney {
  id: string;
  name: string;
  type: 'person' | 'club' | 'moment' | 'people';
  country: string;
  era: string;
  roles?: string[];
  summary: string;
  image: string;
  acknowledgements?: string[];
  affiliations?: string[];
  founded?: number;
  members?: number;
  location?: string;
}

// Convert all journey types to unified format
const getAllJourneys = (): UnifiedJourney[] => {
  const journeys: UnifiedJourney[] = [];

  // Add rugby journeys (individuals)
  rugbyJourneys.forEach(j => {
    journeys.push({
      id: j.id,
      name: j.name,
      type: 'person',
      country: j.country,
      era: j.era,
      roles: j.roles,
      summary: j.summary,
      image: j.image,
      acknowledgements: j.acknowledgements,
      affiliations: j.affiliations,
    });
  });

  // Add clubs
  clubs.forEach(c => {
    journeys.push({
      id: c.id,
      name: c.name,
      type: 'club',
      country: c.country,
      era: `Founded ${c.founded}`,
      summary: c.summary,
      image: c.image,
      acknowledgements: c.acknowledgements,
      affiliations: c.affiliations,
      founded: c.founded,
      members: c.members,
      location: c.location,
    });
  });

  // Add moments
  moments.forEach(m => {
    journeys.push({
      id: m.id,
      name: m.title,
      type: 'moment',
      country: m.country,
      era: `${m.year}`,
      summary: m.description,
      image: m.image,
      acknowledgements: m.acknowledgements,
      roles: [m.theme],
    });
  });

  // Add people
  people.forEach(p => {
    journeys.push({
      id: p.id,
      name: p.name,
      type: 'people',
      country: p.country,
      era: p.years,
      roles: p.roles,
      summary: p.contribution,
      image: p.image,
      acknowledgements: p.acknowledgements,
      location: p.club,
    });
  });

  return journeys;
};

const JourneyCompare: React.FC<JourneyCompareProps> = ({
  isOpen,
  onClose,
  initialJourneyId,
  onNavigate,
}) => {
  const allJourneys = useMemo(() => getAllJourneys(), []);
  
  const [leftJourneyId, setLeftJourneyId] = useState<string | null>(initialJourneyId || null);
  const [rightJourneyId, setRightJourneyId] = useState<string | null>(null);
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [selectingLeft, setSelectingLeft] = useState(!initialJourneyId);
  const [selectingRight, setSelectingRight] = useState(!!initialJourneyId);
  
  // Mobile collapsible sections
  const [leftExpanded, setLeftExpanded] = useState(true);
  const [rightExpanded, setRightExpanded] = useState(true);
  const [connectionsExpanded, setConnectionsExpanded] = useState(true);

  const leftJourney = useMemo(() => 
    allJourneys.find(j => j.id === leftJourneyId) || null, 
    [allJourneys, leftJourneyId]
  );
  
  const rightJourney = useMemo(() => 
    allJourneys.find(j => j.id === rightJourneyId) || null, 
    [allJourneys, rightJourneyId]
  );

  const filteredLeftJourneys = useMemo(() => {
    if (!leftSearch.trim()) return allJourneys.slice(0, 12);
    const query = leftSearch.toLowerCase();
    return allJourneys.filter(j => 
      j.name.toLowerCase().includes(query) ||
      j.country.toLowerCase().includes(query) ||
      j.type.toLowerCase().includes(query)
    ).slice(0, 12);
  }, [allJourneys, leftSearch]);

  const filteredRightJourneys = useMemo(() => {
    if (!rightSearch.trim()) return allJourneys.filter(j => j.id !== leftJourneyId).slice(0, 12);
    const query = rightSearch.toLowerCase();
    return allJourneys.filter(j => 
      j.id !== leftJourneyId &&
      (j.name.toLowerCase().includes(query) ||
       j.country.toLowerCase().includes(query) ||
       j.type.toLowerCase().includes(query))
    ).slice(0, 12);
  }, [allJourneys, rightSearch, leftJourneyId]);

  // Find overlapping connections
  const overlaps = useMemo(() => {
    if (!leftJourney || !rightJourney) return { affiliations: [], acknowledgements: [], countries: false, eras: false };
    
    const leftAffiliations = new Set(leftJourney.affiliations || []);
    const rightAffiliations = new Set(rightJourney.affiliations || []);
    const sharedAffiliations = [...leftAffiliations].filter(a => rightAffiliations.has(a));
    
    const leftAcks = new Set(leftJourney.acknowledgements || []);
    const rightAcks = new Set(rightJourney.acknowledgements || []);
    const sharedAcks = [...leftAcks].filter(a => rightAcks.has(a));
    
    return {
      affiliations: sharedAffiliations,
      acknowledgements: sharedAcks,
      countries: leftJourney.country === rightJourney.country,
      eras: leftJourney.era === rightJourney.era,
    };
  }, [leftJourney, rightJourney]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return <User className="w-4 h-4" />;
      case 'club': return <Building2 className="w-4 h-4" />;
      case 'moment': return <Calendar className="w-4 h-4" />;
      case 'people': return <Users className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'person': return 'Individual Journey';
      case 'club': return 'Club Journey';
      case 'moment': return 'Historic Moment';
      case 'people': return 'Community Member';
      default: return 'Journey';
    }
  };

  // Render journey card content (reusable for both sides)
  const renderJourneyContent = (journey: UnifiedJourney) => (
    <>
      {journey.roles && journey.roles.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-[#1A2332]/50 mb-1">Roles</p>
          <div className="flex flex-wrap gap-1">
            {journey.roles.map(role => (
              <span key={role} className="px-2 py-0.5 bg-[#B8826D]/10 text-[#B8826D] text-xs rounded">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {journey.affiliations && journey.affiliations.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-[#1A2332]/50 mb-1">Affiliations</p>
          <div className="flex flex-wrap gap-1">
            {journey.affiliations.map(aff => (
              <span 
                key={aff} 
                className={`px-2 py-0.5 text-xs rounded ${
                  overlaps.affiliations.includes(aff) 
                    ? 'bg-[#8B9D83]/20 text-[#8B9D83] font-medium' 
                    : 'bg-[#1A2332]/5 text-[#1A2332]/70'
                }`}
              >
                {aff}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {journey.acknowledgements && journey.acknowledgements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#1A2332]/50 mb-1">Acknowledgements</p>
          <ul className="text-xs text-[#1A2332]/70 space-y-0.5">
            {journey.acknowledgements.slice(0, 4).map(ack => (
              <li 
                key={ack}
                className={overlaps.acknowledgements.includes(ack) ? 'text-[#8B9D83] font-medium' : ''}
              >
                {ack}
              </li>
            ))}
            {journey.acknowledgements.length > 4 && (
              <li className="text-[#1A2332]/40 italic">
                + {journey.acknowledgements.length - 4} more
              </li>
            )}
          </ul>
        </div>
      )}
      
      {!journey.acknowledgements?.length && !journey.affiliations?.length && (
        <p className="text-xs text-[#1A2332]/40 italic py-2">
          Not yet added
        </p>
      )}
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#F5F1E8] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#1A2332]/10 bg-white">
          <div>
            <h2 className="font-serif text-lg sm:text-xl text-[#1A2332] flex items-center">
              <ArrowLeftRight className="w-5 h-5 mr-2 text-[#B8826D]" />
              Side-by-Side View
            </h2>
            <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1">
              Reflect on connections between journeys
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#1A2332]/60 hover:text-[#1A2332] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Note */}
        <div className="px-4 sm:px-6 py-3 bg-[#8B9D83]/10 border-b border-[#1A2332]/10">
          <div className="flex items-center">
            <Info className="w-4 h-4 text-[#8B9D83] mr-2 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-[#1A2332]/70">
              This is a reflection tool, not a comparison. No rankings or scores.
            </p>
          </div>
        </div>

        {/* Main Content - Stacked on mobile, side-by-side on desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Journey */}
            <div className="space-y-4">
              {/* Mobile collapsible header */}
              <button
                onClick={() => setLeftExpanded(!leftExpanded)}
                className="lg:hidden w-full flex items-center justify-between p-3 bg-white rounded-xl border border-[#1A2332]/10"
              >
                <span className="font-medium text-[#1A2332] text-sm">
                  {leftJourney ? leftJourney.name : 'Select First Journey'}
                </span>
                {leftExpanded ? <ChevronUp className="w-4 h-4 text-[#1A2332]/40" /> : <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />}
              </button>

              <div className={`${leftExpanded ? 'block' : 'hidden lg:block'}`}>
                {selectingLeft || !leftJourney ? (
                  <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
                    <label className="block text-sm font-medium text-[#1A2332] mb-2">
                      Select First Journey
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
                      <input
                        type="text"
                        placeholder="Search journeys..."
                        value={leftSearch}
                        onChange={(e) => setLeftSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-[#B8826D] text-sm min-h-[48px]"
                      />
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {filteredLeftJourneys.map(j => (
                        <button
                          key={j.id}
                          onClick={() => {
                            setLeftJourneyId(j.id);
                            setSelectingLeft(false);
                            if (!rightJourneyId) setSelectingRight(true);
                          }}
                          className="w-full flex items-center p-3 rounded-lg hover:bg-[#F5F1E8] transition-colors text-left min-h-[56px]"
                        >
                          <img 
                            src={j.image} 
                            alt={j.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A2332] text-sm truncate">{j.name}</p>
                            <p className="text-xs text-[#1A2332]/50 flex items-center">
                              {getTypeIcon(j.type)}
                              <span className="ml-1">{j.country}</span>
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl overflow-hidden border border-[#1A2332]/10">
                    <div className="relative h-32 sm:h-40">
                      <img 
                        src={leftJourney.image} 
                        alt={leftJourney.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setSelectingLeft(true)}
                        className="absolute top-3 right-3 px-3 py-2 bg-white/90 rounded-lg text-xs font-medium text-[#1A2332] hover:bg-white transition-colors min-h-[36px]"
                      >
                        Change
                      </button>
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-[#1A2332]/80 rounded text-xs text-white flex items-center">
                        {getTypeIcon(leftJourney.type)}
                        <span className="ml-1">{getTypeLabel(leftJourney.type)}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg text-[#1A2332] mb-1">{leftJourney.name}</h3>
                      <p className="text-sm text-[#1A2332]/60 flex items-center mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {leftJourney.country}
                        <span className="mx-1">·</span>
                        {leftJourney.era}
                      </p>
                      {renderJourneyContent(leftJourney)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Journey */}
            <div className="space-y-4">
              {/* Mobile collapsible header */}
              <button
                onClick={() => setRightExpanded(!rightExpanded)}
                className="lg:hidden w-full flex items-center justify-between p-3 bg-white rounded-xl border border-[#1A2332]/10"
              >
                <span className="font-medium text-[#1A2332] text-sm">
                  {rightJourney ? rightJourney.name : 'Select Second Journey'}
                </span>
                {rightExpanded ? <ChevronUp className="w-4 h-4 text-[#1A2332]/40" /> : <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />}
              </button>

              <div className={`${rightExpanded ? 'block' : 'hidden lg:block'}`}>
                {selectingRight || !rightJourney ? (
                  <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
                    <label className="block text-sm font-medium text-[#1A2332] mb-2">
                      Select Second Journey
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
                      <input
                        type="text"
                        placeholder="Search journeys..."
                        value={rightSearch}
                        onChange={(e) => setRightSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-[#B8826D] text-sm min-h-[48px]"
                      />
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {filteredRightJourneys.map(j => (
                        <button
                          key={j.id}
                          onClick={() => {
                            setRightJourneyId(j.id);
                            setSelectingRight(false);
                          }}
                          className="w-full flex items-center p-3 rounded-lg hover:bg-[#F5F1E8] transition-colors text-left min-h-[56px]"
                        >
                          <img 
                            src={j.image} 
                            alt={j.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A2332] text-sm truncate">{j.name}</p>
                            <p className="text-xs text-[#1A2332]/50 flex items-center">
                              {getTypeIcon(j.type)}
                              <span className="ml-1">{j.country}</span>
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl overflow-hidden border border-[#1A2332]/10">
                    <div className="relative h-32 sm:h-40">
                      <img 
                        src={rightJourney.image} 
                        alt={rightJourney.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setSelectingRight(true)}
                        className="absolute top-3 right-3 px-3 py-2 bg-white/90 rounded-lg text-xs font-medium text-[#1A2332] hover:bg-white transition-colors min-h-[36px]"
                      >
                        Change
                      </button>
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-[#1A2332]/80 rounded text-xs text-white flex items-center">
                        {getTypeIcon(rightJourney.type)}
                        <span className="ml-1">{getTypeLabel(rightJourney.type)}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg text-[#1A2332] mb-1">{rightJourney.name}</h3>
                      <p className="text-sm text-[#1A2332]/60 flex items-center mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {rightJourney.country}
                        <span className="mx-1">·</span>
                        {rightJourney.era}
                      </p>
                      {renderJourneyContent(rightJourney)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connections Panel */}
          {leftJourney && rightJourney && (
            <div className="mt-6 bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
              {/* Collapsible header for mobile */}
              <button
                onClick={() => setConnectionsExpanded(!connectionsExpanded)}
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left"
              >
                <h4 className="font-serif text-lg text-[#1A2332] flex items-center">
                  <ArrowLeftRight className="w-4 h-4 mr-2 text-[#8B9D83]" />
                  Connections & Context
                </h4>
                <span className="lg:hidden">
                  {connectionsExpanded ? <ChevronUp className="w-4 h-4 text-[#1A2332]/40" /> : <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />}
                </span>
              </button>
              
              <div className={`px-4 sm:px-6 pb-4 sm:pb-6 ${connectionsExpanded ? 'block' : 'hidden lg:block'}`}>
                {/* Stacked on mobile, grid on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Shared Country */}
                  <div className={`p-4 rounded-lg ${overlaps.countries ? 'bg-[#8B9D83]/10' : 'bg-[#1A2332]/5'}`}>
                    <p className="text-xs font-medium text-[#1A2332]/50 mb-1">Country</p>
                    {overlaps.countries ? (
                      <p className="text-sm text-[#8B9D83] font-medium">
                        Both from {leftJourney.country}
                      </p>
                    ) : (
                      <p className="text-sm text-[#1A2332]/70">
                        {leftJourney.country} / {rightJourney.country}
                      </p>
                    )}
                  </div>

                  {/* Shared Affiliations */}
                  <div className={`p-4 rounded-lg ${overlaps.affiliations.length > 0 ? 'bg-[#8B9D83]/10' : 'bg-[#1A2332]/5'}`}>
                    <p className="text-xs font-medium text-[#1A2332]/50 mb-1">Shared Affiliations</p>
                    {overlaps.affiliations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {overlaps.affiliations.map(aff => (
                          <span key={aff} className="px-2 py-0.5 bg-[#8B9D83]/20 text-[#8B9D83] text-xs rounded font-medium">
                            {aff}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#1A2332]/40 italic">Not yet added</p>
                    )}
                  </div>

                  {/* Era Overlap */}
                  <div className={`p-4 rounded-lg ${overlaps.eras ? 'bg-[#8B9D83]/10' : 'bg-[#1A2332]/5'}`}>
                    <p className="text-xs font-medium text-[#1A2332]/50 mb-1">Era</p>
                    {overlaps.eras ? (
                      <p className="text-sm text-[#8B9D83] font-medium">
                        Same era: {leftJourney.era}
                      </p>
                    ) : (
                      <p className="text-sm text-[#1A2332]/70">
                        {leftJourney.era} / {rightJourney.era}
                      </p>
                    )}
                  </div>
                </div>

                {/* Shared Acknowledgements */}
                {overlaps.acknowledgements.length > 0 && (
                  <div className="mt-4 p-4 bg-[#8B9D83]/10 rounded-lg">
                    <p className="text-xs font-medium text-[#8B9D83] mb-2">Shared Acknowledgements</p>
                    <ul className="text-sm text-[#1A2332]/70 space-y-1">
                      {overlaps.acknowledgements.map(ack => (
                        <li key={ack}>{ack}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {overlaps.affiliations.length === 0 && overlaps.acknowledgements.length === 0 && !overlaps.countries && !overlaps.eras && (
                  <div className="mt-4 p-4 bg-[#1A2332]/5 rounded-lg text-center">
                    <p className="text-sm text-[#1A2332]/60">
                      No direct connections found in the current records.
                    </p>
                    <p className="text-xs text-[#1A2332]/40 mt-1 italic">
                      If you believe something is missing, you can suggest an addition.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1A2332]/10 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-[#1A2332]/40 text-center sm:text-left">
            Reflection tool for contextual discovery
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-[#1A2332] text-white rounded-lg text-sm font-medium hover:bg-[#1A2332]/90 transition-colors min-h-[48px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneyCompare;
