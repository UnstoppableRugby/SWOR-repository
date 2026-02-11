import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Type,
  Clock,
  Users,
  Building2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Quote,
  MapPin,
  Layers,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContributionContent {
  title?: string;
  body?: string;
  name?: string;
  description?: string;
  date?: string;
  year?: string;
  location?: string;
  role?: string;
  relationship?: string;
  era?: string;
  period_start?: string;
  period_end?: string;
  quote?: string;
}

interface ApprovedContribution {
  id: string;
  journey_id: string;
  contributor_name: string | null;
  contributor_relationship: string | null;
  type: string;
  content: ContributionContent;
  visibility: string;
  reviewed_at: string | null;
  created_at: string;
}

interface ContributionsByType {
  text: ApprovedContribution[];
  moment: ApprovedContribution[];
  person: ApprovedContribution[];
  organisation: ApprovedContribution[];
  period: ApprovedContribution[];
  section_proposal: ApprovedContribution[];
  [key: string]: ApprovedContribution[];
}

interface ApprovedContributionsProps {
  journeyId: string;
  journeyTitle?: string;
  /** If true, use collective voice ("our") instead of individual ("this") */
  isCollective?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Attribution line showing contributor name and relationship */
const ContributorAttribution: React.FC<{
  name: string | null;
  relationship: string | null;
  date: string | null;
}> = ({ name, relationship, date }) => {
  if (!name && !relationship) return null;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#1A2332]/50 mt-3">
      {name && (
        <span className="inline-flex items-center">
          <User className="w-3 h-3 mr-1 flex-shrink-0" />
          {name}
        </span>
      )}
      {relationship && (
        <>
          <span className="text-[#1A2332]/20">·</span>
          <span className="italic">{relationship}</span>
        </>
      )}
      {formattedDate && (
        <>
          <span className="text-[#1A2332]/20">·</span>
          <span>{formattedDate}</span>
        </>
      )}
    </div>
  );
};

/** A single narrative/text contribution block */
const NarrativeBlock: React.FC<{ contribution: ApprovedContribution }> = ({ contribution }) => {
  const { content, contributor_name, contributor_relationship, reviewed_at } = contribution;
  const title = content.title;
  const body = content.body || content.description || '';

  if (!body && !title) return null;

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#1A2332]/8 shadow-sm">
      {title && (
        <h4 className="font-serif text-lg text-[#1A2332] mb-3">{title}</h4>
      )}
      <div className="text-[#1A2332]/75 text-base leading-relaxed whitespace-pre-wrap">
        {body}
      </div>
      {content.quote && (
        <div className="mt-4 pl-4 border-l-2 border-[#B8826D]/30">
          <p className="text-[#1A2332]/70 italic text-base leading-relaxed">
            "{content.quote}"
          </p>
        </div>
      )}
      <ContributorAttribution
        name={contributor_name}
        relationship={contributor_relationship}
        date={reviewed_at}
      />
    </div>
  );
};

/** A single moment/event on the timeline */
const TimelineEntry: React.FC<{
  contribution: ApprovedContribution;
  isLast: boolean;
}> = ({ contribution, isLast }) => {
  const { content, contributor_name, contributor_relationship, reviewed_at } = contribution;
  const title = content.title || content.name || 'Moment';
  const body = content.body || content.description || '';
  const date = content.date || content.year || '';
  const location = content.location || '';

  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-[#B8826D] border-2 border-[#F5F1E8] shadow-sm z-10 mt-1.5" />
        {!isLast && (
          <div className="w-px flex-1 bg-[#B8826D]/20 mt-1" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-8 ${isLast ? 'pb-0' : ''}`}>
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#1A2332]/8 shadow-sm">
          {/* Date/location badges */}
          {(date || location) && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {date && (
                <span className="inline-flex items-center px-2.5 py-1 bg-[#B8826D]/10 text-[#B8826D] text-xs font-medium rounded-md">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  {date}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center px-2.5 py-1 bg-[#8B9D83]/10 text-[#8B9D83] text-xs font-medium rounded-md">
                  <MapPin className="w-3 h-3 mr-1.5" />
                  {location}
                </span>
              )}
            </div>
          )}

          <h4 className="font-medium text-[#1A2332] text-base mb-2">{title}</h4>

          {body && (
            <p className="text-[#1A2332]/70 text-sm leading-relaxed">{body}</p>
          )}

          <ContributorAttribution
            name={contributor_name}
            relationship={contributor_relationship}
            date={reviewed_at}
          />
        </div>
      </div>
    </div>
  );
};

/** A single period block (spans of time) */
const PeriodBlock: React.FC<{ contribution: ApprovedContribution }> = ({ contribution }) => {
  const { content, contributor_name, contributor_relationship, reviewed_at } = contribution;
  const title = content.title || 'Period';
  const body = content.body || content.description || '';
  const start = content.period_start || content.year || '';
  const end = content.period_end || '';
  const era = content.era || '';

  return (
    <div className="bg-gradient-to-r from-[#B8826D]/5 to-transparent rounded-xl p-5 sm:p-6 border border-[#B8826D]/15">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#B8826D]/10 flex items-center justify-center flex-shrink-0">
          <Layers className="w-4 h-4 text-[#B8826D]" />
        </div>
        <div>
          <h4 className="font-serif text-lg text-[#1A2332]">{title}</h4>
          {(start || end || era) && (
            <p className="text-xs text-[#B8826D] font-medium mt-0.5">
              {start && end ? `${start} to ${end}` : start || era}
            </p>
          )}
        </div>
      </div>
      {body && (
        <p className="text-[#1A2332]/70 text-sm leading-relaxed ml-11">{body}</p>
      )}
      <div className="ml-11">
        <ContributorAttribution
          name={contributor_name}
          relationship={contributor_relationship}
          date={reviewed_at}
        />
      </div>
    </div>
  );
};

/** A single person connection card */
const PersonCard: React.FC<{ contribution: ApprovedContribution }> = ({ contribution }) => {
  const { content, contributor_name, contributor_relationship, reviewed_at } = contribution;
  const name = content.name || content.title || 'Person';
  const body = content.body || content.description || '';
  const role = content.role || content.relationship || '';

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#1A2332]/8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#8B9D83]/15 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-[#8B9D83]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#1A2332] text-base">{name}</h4>
          {role && (
            <p className="text-xs text-[#8B9D83] font-medium mt-0.5">{role}</p>
          )}
          {body && (
            <p className="text-[#1A2332]/65 text-sm leading-relaxed mt-2">{body}</p>
          )}
          <ContributorAttribution
            name={contributor_name}
            relationship={contributor_relationship}
            date={reviewed_at}
          />
        </div>
      </div>
    </div>
  );
};

/** A single organisation connection card */
const OrganisationCard: React.FC<{ contribution: ApprovedContribution }> = ({ contribution }) => {
  const { content, contributor_name, contributor_relationship, reviewed_at } = contribution;
  const name = content.name || content.title || 'Organisation';
  const body = content.body || content.description || '';
  const role = content.role || '';

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#1A2332]/8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A2332]/5 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-[#1A2332]/60" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#1A2332] text-base">{name}</h4>
          {role && (
            <p className="text-xs text-[#1A2332]/50 font-medium mt-0.5">{role}</p>
          )}
          {body && (
            <p className="text-[#1A2332]/65 text-sm leading-relaxed mt-2">{body}</p>
          )}
          <ContributorAttribution
            name={contributor_name}
            relationship={contributor_relationship}
            date={reviewed_at}
          />
        </div>
      </div>
    </div>
  );
};

/** Collapsible section wrapper */
const ContributionSection: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  accentColor?: string;
}> = ({ title, subtitle, icon, count, defaultExpanded = true, children, accentColor = '#B8826D' }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-8 last:mb-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group mb-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            {icon}
          </div>
          <div className="text-left">
            <h3 className="font-serif text-xl text-[#1A2332] leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[#1A2332]/50 mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium text-white" style={{ backgroundColor: accentColor }}>
            {count}
          </span>
        </div>
        <div className="text-[#1A2332]/40 group-hover:text-[#1A2332]/60 transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && children}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const ApprovedContributions: React.FC<ApprovedContributionsProps> = ({
  journeyId,
  journeyTitle = 'this journey',
  isCollective = false
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionsByType, setContributionsByType] = useState<ContributionsByType | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchApproved = async () => {
      if (!journeyId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('swor-contributions', {
          body: {
            action: 'get_approved_contributions',
            payload: { journey_id: journeyId }
          }
        });

        if (fnError) {
          console.error('[ApprovedContributions] Edge function error:', fnError);
          setError('Failed to load contributions');
          return;
        }

        if (data?.success) {
          setContributionsByType(data.contributions_by_type || null);
          setTotalCount(data.total_count || 0);
        } else {
          // No error, just no data
          setContributionsByType(null);
          setTotalCount(0);
        }
      } catch (err) {
        console.error('[ApprovedContributions] Error:', err);
        setError('Failed to load contributions');
      } finally {
        setLoading(false);
      }
    };

    fetchApproved();
  }, [journeyId]);

  // Don't render anything if no approved contributions
  if (!loading && totalCount === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" />
        <span className="ml-3 text-sm text-[#1A2332]/50">Loading contributions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/50 rounded-xl p-5 text-center border border-red-100">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!contributionsByType) return null;

  const textItems = contributionsByType.text || [];
  const momentItems = contributionsByType.moment || [];
  const periodItems = contributionsByType.period || [];
  const personItems = contributionsByType.person || [];
  const orgItems = contributionsByType.organisation || [];
  const sectionItems = contributionsByType.section_proposal || [];

  // Combine moments and periods for the timeline
  const timelineItems = [...momentItems, ...periodItems].sort((a, b) => {
    // Sort by date/year in content if available, otherwise by created_at
    const dateA = a.content.date || a.content.year || a.content.period_start || a.created_at;
    const dateB = b.content.date || b.content.year || b.content.period_start || b.created_at;
    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
  });

  // Combine people and organisations for connections
  const connectionItems = [...personItems, ...orgItems];

  const hasNarratives = textItems.length > 0 || sectionItems.length > 0;
  const hasTimeline = timelineItems.length > 0;
  const hasConnections = connectionItems.length > 0;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-[#B8826D]" />
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A2332]">
            Community Contributions
          </h2>
        </div>
        <p className="text-sm text-[#1A2332]/55 leading-relaxed">
          {isCollective
            ? `Approved contributions from stewards, members, and the wider community enriching our collective story.`
            : `Approved contributions from those connected to ${journeyTitle}, adding depth and shared memory.`
          }
        </p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-[#1A2332]/40 bg-[#1A2332]/5 px-2.5 py-1 rounded-md">
            {totalCount} approved {totalCount === 1 ? 'contribution' : 'contributions'}
          </span>
        </div>
      </div>

      {/* ─── Narrative & Reflections ─── */}
      {hasNarratives && (
        <ContributionSection
          title="Narrative & Reflections"
          subtitle={isCollective ? 'Shared memories and perspectives from our community' : 'Memories, reflections, and added context'}
          icon={<Type className="w-4 h-4 text-[#B8826D]" />}
          count={textItems.length + sectionItems.length}
          accentColor="#B8826D"
        >
          <div className="space-y-4">
            {textItems.map((c) => (
              <NarrativeBlock key={c.id} contribution={c} />
            ))}
            {sectionItems.map((c) => (
              <NarrativeBlock key={c.id} contribution={c} />
            ))}
          </div>
        </ContributionSection>
      )}

      {/* ─── Timeline ─── */}
      {hasTimeline && (
        <ContributionSection
          title="Moments & Milestones"
          subtitle={isCollective ? 'Key events and periods in our history' : 'Key moments and turning points'}
          icon={<Clock className="w-4 h-4 text-[#B8826D]" />}
          count={timelineItems.length}
          accentColor="#B8826D"
        >
          <div className="ml-1">
            {timelineItems.map((c, index) => {
              if (c.type === 'period') {
                return <PeriodBlock key={c.id} contribution={c} />;
              }
              return (
                <TimelineEntry
                  key={c.id}
                  contribution={c}
                  isLast={index === timelineItems.length - 1}
                />
              );
            })}
          </div>
        </ContributionSection>
      )}

      {/* ─── Connections ─── */}
      {hasConnections && (
        <ContributionSection
          title="People & Connections"
          subtitle={isCollective ? 'Individuals and organisations connected to our journey' : 'People and organisations connected to this journey'}
          icon={<Users className="w-4 h-4 text-[#8B9D83]" />}
          count={connectionItems.length}
          accentColor="#8B9D83"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {personItems.map((c) => (
              <PersonCard key={c.id} contribution={c} />
            ))}
            {orgItems.map((c) => (
              <OrganisationCard key={c.id} contribution={c} />
            ))}
          </div>
        </ContributionSection>
      )}

      {/* Attribution footer */}
      <div className="pt-5 border-t border-[#1A2332]/8 mt-6">
        <p className="text-[10px] sm:text-xs text-[#1A2332]/35 text-center leading-relaxed">
          All contributions reviewed and approved by journey stewards before publication.
          <br />
          Contributors are attributed by name and relationship as declared at time of submission.
        </p>
      </div>
    </div>
  );
};

export default ApprovedContributions;
