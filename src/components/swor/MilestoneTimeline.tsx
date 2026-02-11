import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Image as ImageIcon, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LinkedEntity {
  type: 'club' | 'org';
  id: string;
  name: string;
  is_suggestion?: boolean;
}

interface Milestone {
  id: string;
  title: string;
  approx_date?: string;
  description?: string;
  optional_photo_archive_item_id?: string;
  optional_linked_entity_ids?: LinkedEntity[];
  display_order: number;
  photo_url?: string;
}

interface MilestoneTimelineProps {
  profileId: string;
  profileName: string;
  isOwner?: boolean;
  isSteward?: boolean;
  onNavigate?: (page: string) => void;
}

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  profileId,
  profileName,
  isOwner = false,
  isSteward = false,
  onNavigate
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMilestones();
  }, [profileId]);

  const loadMilestones = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'get_milestones',
          payload: {
            profile_id: profileId,
            include_drafts: isOwner || isSteward
          }
        }
      });

      if (error) throw error;
      
      if (data?.success && data.milestones) {
        setMilestones(data.milestones);
      }
    } catch (err) {
      console.error('Failed to load milestones:', err);
      setError('Unable to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  // Format approximate date for display
  const formatApproxDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    
    // Year only: YYYY
    if (/^\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Year-month: YYYY-MM
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [year, month] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    // Full date: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    return dateStr;
  };

  const handleEntityClick = (entity: LinkedEntity) => {
    if (entity.is_suggestion || !onNavigate) return;
    
    if (entity.type === 'club') {
      onNavigate(`club-${entity.id}`);
    } else if (entity.type === 'org') {
      onNavigate(`org-${entity.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#B8826D]" />
        <span className="ml-2 text-sm text-[#1A2332]/60">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-[#1A2332]/50 text-sm">
        {error}
      </div>
    );
  }

  if (milestones.length === 0) {
    return null; // Don't show empty timeline on public view
  }

  return (
    <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-[#F5F1E8]/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="milestone-timeline-content"
      >
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-[#8B9D83]" />
          <h2 className="font-serif text-lg sm:text-xl text-[#1A2332]">
            Rugby Journey Timeline
          </h2>
          <span className="text-sm text-[#1A2332]/40">
            ({milestones.length} {milestones.length === 1 ? 'milestone' : 'milestones'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#1A2332]/40" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#1A2332]/40" />
        )}
      </button>

      {/* Timeline Content */}
      {isExpanded && (
        <div id="milestone-timeline-content" className="px-4 sm:px-6 pb-6">
          {/* Vertical Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div 
              className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-[#1A2332]/10"
              aria-hidden="true"
            />

            {/* Milestones */}
            <ol className="space-y-6" role="list" aria-label={`Timeline of ${profileName}'s rugby journey`}>
              {milestones.map((milestone, index) => (
                <li 
                  key={milestone.id}
                  className="relative pl-10 sm:pl-14"
                >
                  {/* Timeline dot */}
                  <div 
                    className="absolute left-2.5 sm:left-4.5 w-3 h-3 bg-[#B8826D] rounded-full border-2 border-white shadow-sm"
                    style={{ top: '0.375rem' }}
                    aria-hidden="true"
                  />

                  {/* Milestone Card */}
                  <article className="bg-[#F5F1E8]/50 rounded-lg p-4 hover:bg-[#F5F1E8] transition-colors">
                    {/* Date */}
                    {milestone.approx_date && (
                      <time 
                        className="text-sm font-medium text-[#B8826D] block mb-1"
                        dateTime={milestone.approx_date}
                      >
                        {formatApproxDate(milestone.approx_date)}
                      </time>
                    )}

                    {/* Title */}
                    <h3 className="font-medium text-[#1A2332] text-base sm:text-lg mb-2">
                      {milestone.title}
                    </h3>

                    {/* Description */}
                    {milestone.description && (
                      <p className="text-sm text-[#1A2332]/70 leading-relaxed mb-3">
                        {milestone.description}
                      </p>
                    )}

                    {/* Photo thumbnail */}
                    {milestone.photo_url && (
                      <div className="mb-3">
                        <img
                          src={milestone.photo_url}
                          alt={`Photo for ${milestone.title}`}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-[#1A2332]/10"
                        />
                      </div>
                    )}

                    {/* Linked entities */}
                    {milestone.optional_linked_entity_ids && milestone.optional_linked_entity_ids.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {milestone.optional_linked_entity_ids
                          .filter(entity => !entity.is_suggestion) // Only show approved links publicly
                          .map((entity, idx) => (
                            <button
                              key={`${entity.type}-${entity.id}-${idx}`}
                              onClick={() => handleEntityClick(entity)}
                              className="inline-flex items-center px-2.5 py-1 bg-white rounded-full text-xs text-[#1A2332]/70 hover:bg-[#B8826D]/10 hover:text-[#B8826D] transition-colors border border-[#1A2332]/10"
                              disabled={entity.is_suggestion}
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              {entity.name}
                              {!entity.is_suggestion && (
                                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTimeline;
