import React, { useMemo } from 'react';
import { ArrowRight, Users, Building2, Calendar, BookOpen, Heart } from 'lucide-react';
import { rugbyJourneys, clubs, moments, people } from '@/data/sworData';

interface ExploreNextSectionProps {
  currentType: 'person' | 'club' | 'moment' | 'journey';
  currentId: string;
  currentCountry?: string;
  onNavigate: (page: string) => void;
}

const ExploreNextSection: React.FC<ExploreNextSectionProps> = ({
  currentType,
  currentId,
  currentCountry,
  onNavigate,
}) => {
  // Get related items based on current context
  const relatedItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      type: string;
      country: string;
      image: string;
      page: string;
    }> = [];

    // Add related people (same country or different type)
    people
      .filter(p => p.id !== currentId)
      .filter(p => currentCountry ? p.country === currentCountry : true)
      .slice(0, 2)
      .forEach(p => {
        items.push({
          id: p.id,
          name: p.name,
          type: 'Person',
          country: p.country,
          image: p.image,
          page: `person-${p.id}`,
        });
      });

    // Add related clubs
    clubs
      .filter(c => c.id !== currentId)
      .filter(c => currentCountry ? c.country === currentCountry : true)
      .slice(0, 2)
      .forEach(c => {
        items.push({
          id: c.id,
          name: c.name,
          type: 'Club',
          country: c.country,
          image: c.image,
          page: `club-${c.id}`,
        });
      });

    // Add related moments
    moments
      .filter(m => m.id !== currentId)
      .filter(m => currentCountry ? m.country === currentCountry : true)
      .slice(0, 2)
      .forEach(m => {
        items.push({
          id: m.id,
          name: m.title,
          type: 'Moment',
          country: m.country,
          image: m.image,
          page: `moment-${m.id}`,
        });
      });

    // Shuffle and return top 3
    return items.sort(() => Math.random() - 0.5).slice(0, 3);
  }, [currentId, currentCountry, currentType]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Person': return <Users className="w-3.5 h-3.5" />;
      case 'Club': return <Building2 className="w-3.5 h-3.5" />;
      case 'Moment': return <Calendar className="w-3.5 h-3.5" />;
      default: return <Users className="w-3.5 h-3.5" />;
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-[#1A2332]/10">
      <h3 className="font-serif text-xl text-[#1A2332] mb-6">Explore Next</h3>
      
      {/* Related Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {relatedItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.page)}
            className="group bg-white rounded-xl overflow-hidden border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-all text-left"
          >
            <div className="relative h-24 sm:h-28">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/90 rounded text-xs text-[#1A2332]/70 flex items-center">
                {getTypeIcon(item.type)}
                <span className="ml-1">{item.type}</span>
              </span>
            </div>
            <div className="p-3">
              <p className="font-medium text-[#1A2332] text-sm group-hover:text-[#B8826D] transition-colors line-clamp-1">
                {item.name}
              </p>
              <p className="text-xs text-[#1A2332]/50 mt-0.5">{item.country}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('contribute')}
          className="flex items-center justify-between p-4 bg-[#B8826D]/5 rounded-xl hover:bg-[#B8826D]/10 transition-colors group"
        >
          <div className="flex items-center">
            <Heart className="w-5 h-5 text-[#B8826D] mr-3" />
            <div className="text-left">
              <p className="font-medium text-[#1A2332] text-sm">Contribute a memory</p>
              <p className="text-xs text-[#1A2332]/50">Share your connection to this journey</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#B8826D] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => onNavigate('journeys')}
          className="flex items-center justify-between p-4 bg-[#1A2332]/5 rounded-xl hover:bg-[#1A2332]/10 transition-colors group"
        >
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 text-[#1A2332]/70 mr-3" />
            <div className="text-left">
              <p className="font-medium text-[#1A2332] text-sm">Find another journey</p>
              <p className="text-xs text-[#1A2332]/50">Browse all rugby journeys</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#1A2332]/40 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};

export default ExploreNextSection;
