import React, { useState, useMemo } from 'react';
import { people } from '@/data/sworData';
import PersonCard from '../PersonCard';
import { Search, BookOpen } from 'lucide-react';

interface PeoplePageProps {
  onSelectPerson: (id: string) => void;
  onNavigate?: (page: string) => void;
}

const PeoplePage: React.FC<PeoplePageProps> = ({ onSelectPerson, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Extract unique roles from all people
  const roles = useMemo(() => {
    const allRoles: string[] = [];
    people.forEach((p) => {
      p.roles.forEach(role => {
        if (!allRoles.includes(role)) allRoles.push(role);
      });
    });
    return ['all', ...allRoles.sort()];
  }, []);

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.contribution.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === 'all' || person.roles.includes(selectedRole);

      return matchesSearch && matchesRole;
    });
  }, [searchQuery, selectedRole]);

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
            The volunteers, coaches, administrators, and stewards who keep rugby alive. 
            Their dedication is the foundation of every club.
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="swor-input px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px]"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <p className="text-sm sm:text-base text-[#1A2332]/60 mb-4 sm:mb-6">
          Showing {filteredPeople.length} of {people.length} journeys
        </p>

        {filteredPeople.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onClick={() => onSelectPerson(person.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-[#1A2332]/60 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">No journeys found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('all');
              }}
              className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 text-sm sm:text-base md:text-lg min-h-[44px] px-4"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Invite CTA - Invitational language */}
        <div className="mt-10 sm:mt-12 md:mt-16 bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-12 border border-[#1A2332]/10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">
              Share a Rugby Journey
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 mb-5 sm:mb-6 leading-relaxed">
              Know a volunteer, coach, or club steward whose contribution has made a difference 
              to rugby in your community? Invite them to share their journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {onNavigate && (
                <>
                  <button 
                    onClick={() => onNavigate('contribute')}
                    className="swor-btn-primary min-h-[48px] sm:min-h-[52px] text-sm sm:text-base w-full sm:w-auto"
                  >
                    Invite Someone
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

export default PeoplePage;
