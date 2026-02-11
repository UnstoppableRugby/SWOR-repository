// SWOR Data - Small World of Rugby
// FOR-GOOD OS DIGITAL SPINE
// GOVERNANCE RULE: Pre-existing legacy profiles are wrapped, not re-ingested.
// GOVERNANCE RULE: All journeys may include multiple concurrent roles.
// GOVERNANCE RULE: Journeys are never framed as solo achievements.
// GOVERNANCE RULE: Acknowledgement of others is mandatory.
// CANONICAL MIGRATION: SWOR Rugby Journeys are the sole canonical public versions.
// CANONICAL MIGRATION: Legacy pages are retained as private provenance artefacts only.
// PHASE 3 GOVERNANCE: Phase 3 modules are collapsed by default, visually quiet, clearly optional.
// PHASE 3 GOVERNANCE: No auto-open, no task counts, no completion states, no timelines.
// PHASE 3 GOVERNANCE: All contributions reviewed before inclusion. Named invitations only.
// PHASE 3 COLLECTIVE: Collective journeys use "our" language and include stewardship notes.

// Import governance configuration
import { 
  CANONICAL_GLOBAL_STEWARD, 
  isCanonicalGlobalSteward,
  type Visibility,
  type Status,
  type SiteRole,
  type StewardPermission,
} from '@/config/governance';

// Re-export governance types for convenience
export type { Visibility, Status, SiteRole, StewardPermission };

// ============================================
// GLOBAL STEWARDS CONFIGURATION
// Site-wide builder access (invisible to public)
// ============================================

export interface GlobalSteward {
  email: string;
  name: string;
  role: 'global_steward';  // Updated to use canonical role type
  permissions: {
    phase3Builder: boolean;
    editJourneys: boolean;
    reviewDrafts: boolean;
    reviewSuggestions: boolean;
    accessAllJourneys?: boolean;  // New permission
  };
  addedAt: string;
  addedBy: string;
  note?: string;
}

// Global Stewards List
// These users have site-wide access to all journeys
// The canonical steward is imported from governance config
export const globalStewards: GlobalSteward[] = [
  {
    email: CANONICAL_GLOBAL_STEWARD.email,
    name: CANONICAL_GLOBAL_STEWARD.name,
    role: 'global_steward',
    permissions: {
      phase3Builder: CANONICAL_GLOBAL_STEWARD.permissions.phase3Builder,
      editJourneys: CANONICAL_GLOBAL_STEWARD.permissions.editJourneys,
      reviewDrafts: CANONICAL_GLOBAL_STEWARD.permissions.reviewDrafts,
      reviewSuggestions: CANONICAL_GLOBAL_STEWARD.permissions.reviewSuggestions,
      accessAllJourneys: CANONICAL_GLOBAL_STEWARD.permissions.accessAllJourneys,
    },
    addedAt: CANONICAL_GLOBAL_STEWARD.addedAt,
    addedBy: CANONICAL_GLOBAL_STEWARD.addedBy,
    note: CANONICAL_GLOBAL_STEWARD.note,
  },
];

// Helper function to check if an email is a global steward
export const isGlobalSteward = (email: string | undefined | null): boolean => {
  if (!email) return false;
  // Check canonical steward first
  if (isCanonicalGlobalSteward(email)) return true;
  // Then check additional stewards list
  return globalStewards.some(
    steward => steward.email.toLowerCase() === email.toLowerCase()
  );
};

// Helper function to get global steward by email
export const getGlobalSteward = (email: string | undefined | null): GlobalSteward | undefined => {
  if (!email) return undefined;
  return globalStewards.find(
    steward => steward.email.toLowerCase() === email.toLowerCase()
  );
};

// Helper function to check specific permission for global steward
export const hasGlobalStewardPermission = (
  email: string | undefined | null,
  permission: keyof GlobalSteward['permissions']
): boolean => {
  const steward = getGlobalSteward(email);
  if (!steward) return false;
  return steward.permissions[permission] ?? false;
};




// ============================================
// PER-JOURNEY OVERRIDE PATCH
// Exemplar-specific configurations
// ============================================

// Exemplar Configuration Interface
export interface ExemplarConfig {
  journeyId: string;
  journeyType: 'individual' | 'collective';
  
  // Journey Framing
  framingTitle: string; // "Your Rugby Journey" or "Our Rugby Journey"
  descriptors: string[]; // Dynamic descriptors (Pioneer, Steward, Leader, etc.)
  
  // Phase 1 Content Protection
  phase1Protected: boolean; // Phase 1 must read as complete, never overwritten by AI
  aiCanOnlySuggest: boolean; // AI may only suggest additions, never overwrite
  
  // Phase 3 Visibility
  phase3CollapsedByDefault: boolean;
  phase3VisibleToOwnerStewardsOnly: boolean;
  publicNeverSeesDrafts: boolean;
  
  // Contribution Handling
  multipleContributorsAllowed: boolean;
  relationshipDeclarationRequired: boolean;
  attributionPerContribution: boolean;
  noAnonymousInput: boolean;
  noDirectPublishing: boolean;
  
  // Legacy & Continuity
  stewardNominationVisible: boolean;
  legacyModeExplanationVisible: boolean;
  calmLanguageOnly: boolean;
  continuityMicrocopy: string;
  
  // Exemplar-Specific Notes
  specificNotes: string[];
}

// Sue Dorrington Exemplar Configuration
export const sueDorringtonConfig: ExemplarConfig = {
  journeyId: 'sue-dorrington',
  journeyType: 'individual',
  framingTitle: 'Your Rugby Journey',
  descriptors: ['Pioneer', 'Leader', 'Steward of the Game'],
  phase1Protected: true,
  aiCanOnlySuggest: true,
  phase3CollapsedByDefault: true,
  phase3VisibleToOwnerStewardsOnly: true,
  publicNeverSeesDrafts: true,
  multipleContributorsAllowed: true,
  relationshipDeclarationRequired: true,
  attributionPerContribution: true,
  noAnonymousInput: true,
  noDirectPublishing: true,
  stewardNominationVisible: true,
  legacyModeExplanationVisible: true,
  calmLanguageOnly: true,
  continuityMicrocopy: 'This journey can continue with care over time.',
  specificNotes: [
    'Elder-first readability',
    'Light backgrounds',
    'No typographic dashes',
    'Legacy page retained as private provenance only',
    'SWOR page is canonical',
  ],
};

// Harry Roberts Exemplar Configuration
export const harryRobertsConfig: ExemplarConfig = {
  journeyId: 'harry-roberts',
  journeyType: 'individual',
  framingTitle: 'Your Rugby Journey',
  descriptors: ['Connector', 'Community Builder', 'Advocate'],
  phase1Protected: true,
  aiCanOnlySuggest: true,
  phase3CollapsedByDefault: true,
  phase3VisibleToOwnerStewardsOnly: true,
  publicNeverSeesDrafts: true,
  multipleContributorsAllowed: true,
  relationshipDeclarationRequired: true,
  attributionPerContribution: true,
  noAnonymousInput: true,
  noDirectPublishing: true,
  stewardNominationVisible: true,
  legacyModeExplanationVisible: true,
  calmLanguageOnly: true,
  continuityMicrocopy: 'This journey can continue with care over time.',
  specificNotes: [
    'Phase 3 used as live trial',
    'Intake-first workflow',
    'Memory reuse validation',
    'Created directly on SWOR (no legacy page)',
  ],
};

// Villagers Rugby Club Exemplar Configuration
export const villagersConfig: ExemplarConfig = {
  journeyId: 'villagers-rfc',
  journeyType: 'collective',
  framingTitle: 'Our Rugby Journey',
  descriptors: ['Community', 'Continuity', 'Stewardship'],
  phase1Protected: true,
  aiCanOnlySuggest: true,
  phase3CollapsedByDefault: true,
  phase3VisibleToOwnerStewardsOnly: true,
  publicNeverSeesDrafts: true,
  multipleContributorsAllowed: true,
  relationshipDeclarationRequired: true,
  attributionPerContribution: true,
  noAnonymousInput: true,
  noDirectPublishing: true,
  stewardNominationVisible: true,
  legacyModeExplanationVisible: true,
  calmLanguageOnly: true,
  continuityMicrocopy: 'This journey can continue with care over time, together.',
  specificNotes: [
    'Multi-steward support',
    'Archive-heavy ingestion',
    'Long timeline tolerance',
    'Collective voice ("we", "our")',
  ],
};

// All exemplar configurations
export const exemplarConfigs: ExemplarConfig[] = [
  sueDorringtonConfig,
  harryRobertsConfig,
  villagersConfig,
];

// Helper function to get exemplar config by journey ID
export const getExemplarConfig = (journeyId: string): ExemplarConfig | undefined => {
  return exemplarConfigs.find(config => config.journeyId === journeyId);
};

// Helper function to check if a journey is an exemplar
export const isExemplarJourney = (journeyId: string): boolean => {
  return exemplarConfigs.some(config => config.journeyId === journeyId);
};


export const heroImage = 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716768412_4c4786d5.jpg';
export const redwoodsImage = 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716900344_0c7770f7.jpg';
export const communityImages = [
  'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716926310_a3a03455.png',
  'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716920583_d83e61f2.jpg',
];

// Rugby Journey Interface (replaces Legend)
// Recognition terms (Legend, Pioneer, Steward, Supporter, etc.) are descriptive outcomes, never containers.
export interface RugbyJourney {
  id: string;
  name: string;
  country: string;
  roles: string[]; // Multiple concurrent roles supported
  era: string;
  image: string;
  summary: string;
  quote?: string;
  // Acknowledgements - mandatory
  acknowledgements?: string[];
  // Journey metadata
  journeyType: 'individual' | 'collective' | 'event';
  // Recognition descriptors (not categories)
  descriptors?: string[];
  // Canonical status fields
  status?: 'gold-standard' | 'standard';
  isFoundational?: boolean;
  isCanonical?: boolean; // SWOR is the sole canonical public version
  // Legacy provenance (private reference only - NOT for public display)
  hasLegacyProvenance?: boolean; // Indicates a legacy artefact exists for provenance
  legacyProvenanceUrl?: string; // Private reference only - NEVER surface publicly
  legacyProvenanceNote?: string; // Internal documentation of provenance
  // Governance
  governanceNote?: string;
  affiliations?: string[];
}

// Legacy interface for backwards compatibility
export interface Legend extends RugbyJourney {
  position: string;
  caps: number;
  descriptor?: string;
}

// Sue Dorrington - SWOR Rugby Journey (CANONICAL)
// CANONICAL MIGRATION COMPLETE: SWOR is the sole canonical public version.
// Legacy page retained as private provenance artefact only - not linked, indexed, or surfaced.
export const sueDorrington: RugbyJourney = {
  id: 'sue-dorrington',
  name: 'Sue Dorrington',
  country: 'England',
  roles: ['Pioneer', 'Leader', 'Administrator', 'Steward of the Game'],
  era: "Women's Rugby",
  image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716811672_11d0722b.jpg',
  summary: 'A pioneer of women\'s rugby whose leadership and stewardship helped shape the modern game. Her legacy extends far beyond statistics.',
  quote: 'The game belongs to everyone who loves it.',
  journeyType: 'individual',
  descriptors: ['Pioneer', 'Leader', 'Steward of the Game'],
  acknowledgements: [
    'The women who played alongside her',
    'The clubs that provided a home for women\'s rugby',
    'The administrators who fought for recognition',
    'The families who supported the journey',
  ],
  status: 'gold-standard',
  isFoundational: true,
  isCanonical: true, // SWOR is the sole canonical public version
  // Legacy provenance - private reference only, NOT for public display
  hasLegacyProvenance: true,
  legacyProvenanceUrl: 'https://preview-1jp71nov--legacy-interactive-respectful.deploypad.app/',
  legacyProvenanceNote: 'Pre-existing legacy profile retained as private provenance artefact. Not linked, indexed, or surfaced within SWOR. SWOR fully owns stewardship of this journey.',
  governanceNote: 'Canonical migration complete. SWOR is the sole canonical public version.',
  affiliations: ['England Women\'s Rugby', 'RFUW', 'World Rugby'],
};

// Harry Roberts - SWOR Rugby Journey (CREATED DIRECTLY ON SWOR)
// PHASE 3 ACTIVATED: Exemplar living connector journey.
// Created from scratch using authoritative source inputs - no migration required.
export const harryRoberts: RugbyJourney = {
  id: 'harry-roberts',
  name: 'Harry Roberts',
  country: 'England',
  roles: ['Player', 'Coach', 'Connector', 'Community Builder', 'Advocate for Rugby Values'],
  era: 'Modern Era',
  image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716782097_855cdaa0.jpg',
  summary: 'A connector who sees rugby not as a destination but as a vehicle for bringing people together. His journey spans playing, coaching, and building bridges across communities, generations, and the values that make the game meaningful.',
  quote: 'Rugby is the excuse. Connection is the reason.',
  journeyType: 'individual',
  descriptors: ['Connector', 'Community Builder', 'Advocate'],
  acknowledgements: [
    'The clubs that welcomed and shaped him',
    'The coaches who saw potential and invested time',
    'The teammates who became lifelong friends',
    'The communities that embraced rugby as a force for good',
    'The families who make grassroots rugby possible',
  ],
  status: 'gold-standard',
  isFoundational: true,
  isCanonical: true, // Created directly on SWOR - no legacy page exists
  governanceNote: 'Created directly on SWOR. Phase 3 activated as exemplar living connector journey.',
  affiliations: ['Grassroots Rugby', 'Community Rugby', 'Rugby Values Advocacy'],
};





// Rugby Journeys (formerly Legends)
export const rugbyJourneys: RugbyJourney[] = [
  // Sue Dorrington - First Position (Foundational Profile)
  sueDorrington,
  // Harry Roberts - Second Position (Foundational Living Connector Journey)
  harryRoberts,
  // Standard Journeys

  {
    id: 'journey-1',
    name: 'James McAllister',
    country: 'New Zealand',
    roles: ['Player', 'Fly-half', 'Coach'],
    era: '1985-1997',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716782097_855cdaa0.jpg',
    summary: 'A master tactician whose vision transformed modern back play.',
    quote: 'Rugby taught me that greatness is built in the quiet moments.',
    journeyType: 'individual',
    descriptors: ['Tactician', 'Mentor'],
    acknowledgements: ['Auckland RFC', 'All Blacks coaching staff', 'Family'],
  },
  {
    id: 'journey-2',
    name: 'Thomas Beaumont',
    country: 'France',
    roles: ['Player', 'Lock', 'Captain'],
    era: '1990-2003',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716782881_17da486f.jpg',
    summary: 'The heartbeat of French forward play for over a decade.',
    quote: 'The scrum is where rugby finds its soul.',
    journeyType: 'individual',
    descriptors: ['Leader', 'Forward'],
    acknowledgements: ['Stade Français', 'French Federation', 'Teammates'],
  },
  {
    id: 'journey-3',
    name: 'William Edwards',
    country: 'Wales',
    roles: ['Player', 'Scrum-half', 'Broadcaster'],
    era: '1978-1991',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716793528_8ec1e5ff.png',
    summary: 'Quick hands and quicker thinking defined his era.',
    quote: 'Every pass carries the weight of those who came before.',
    journeyType: 'individual',
    descriptors: ['Playmaker', 'Memory Keeper'],
    acknowledgements: ['Cardiff RFC', 'Welsh Rugby Union', 'Broadcasting colleagues'],
  },
  {
    id: 'journey-4',
    name: 'David O\'Sullivan',
    country: 'Ireland',
    roles: ['Player', 'Hooker', 'Captain', 'Community Leader'],
    era: '1995-2008',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716798422_b8f3e5ba.png',
    summary: 'A leader who embodied the spirit of Irish rugby.',
    quote: 'Leadership is earned in training, not in speeches.',
    journeyType: 'individual',
    descriptors: ['Leader', 'Community Builder'],
    acknowledgements: ['Leinster Rugby', 'IRFU', 'Youth programmes'],
  },
  {
    id: 'journey-5',
    name: 'Michael Thompson',
    country: 'England',
    roles: ['Player', 'Centre', 'Defence Coach'],
    era: '1988-2001',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716793432_45f0d5e5.png',
    summary: 'A defensive wall with the vision of a playmaker.',
    quote: 'Defence wins matches; character wins respect.',
    journeyType: 'individual',
    descriptors: ['Defender', 'Mentor'],
    acknowledgements: ['Bath RFC', 'RFU', 'Coaching staff'],
  },
  {
    id: 'journey-6',
    name: 'Robert van der Berg',
    country: 'South Africa',
    roles: ['Player', 'Flanker', 'Ambassador'],
    era: '1992-2005',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716795388_d85cfbf3.png',
    summary: 'Relentless at the breakdown, inspirational in spirit.',
    quote: 'The jersey is borrowed. What you leave behind is permanent.',
    journeyType: 'individual',
    descriptors: ['Ambassador', 'Inspiration'],
    acknowledgements: ['Western Province', 'Springboks', 'Community programmes'],
  },
  {
    id: 'journey-7',
    name: 'Sarah Mitchell',
    country: 'England',
    roles: ['Player', 'Fullback', 'Captain', 'Advocate'],
    era: '2005-2019',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716811672_11d0722b.jpg',
    summary: 'A trailblazer who elevated women\'s rugby globally.',
    quote: 'We play for the girls who never got the chance.',
    journeyType: 'individual',
    descriptors: ['Trailblazer', 'Advocate'],
    acknowledgements: ['England Women', 'RFU Women\'s programme', 'Grassroots clubs'],
  },
  {
    id: 'journey-8',
    name: 'Marie Dubois',
    country: 'France',
    roles: ['Player', 'Wing', 'Youth Coach'],
    era: '2008-2022',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716815551_62c35424.jpg',
    summary: 'Speed and grace that redefined attacking rugby.',
    quote: 'The try line is just the beginning of the story.',
    journeyType: 'individual',
    descriptors: ['Attacker', 'Youth Developer'],
    acknowledgements: ['French Women\'s team', 'Local academies', 'Family'],
  },
  {
    id: 'journey-9',
    name: 'Emma Williams',
    country: 'New Zealand',
    roles: ['Player', 'Number 8', 'Captain', 'Mentor'],
    era: '2010-2024',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716820277_8c91f206.png',
    summary: 'A dominant force who carried the Black Ferns to new heights.',
    quote: 'Strength is nothing without purpose.',
    journeyType: 'individual',
    descriptors: ['Leader', 'Mentor'],
    acknowledgements: ['Black Ferns', 'Canterbury', 'Women\'s rugby pioneers'],
  },
  {
    id: 'journey-10',
    name: 'Aoife O\'Brien',
    country: 'Ireland',
    roles: ['Player', 'Fly-half', 'Playmaker'],
    era: '2012-2025',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716816690_06b03d44.jpg',
    summary: 'A playmaker whose creativity inspired a generation.',
    quote: 'Rugby is poetry written in movement.',
    journeyType: 'individual',
    descriptors: ['Creative', 'Inspiration'],
    acknowledgements: ['Ireland Women', 'Connacht', 'Youth programmes'],
  },
];

// Legacy export for backwards compatibility
export const legends: Legend[] = rugbyJourneys.map(journey => ({
  ...journey,
  position: journey.roles[1] || journey.roles[0],
  caps: 0, // Not used in new framework
  descriptor: journey.descriptors?.join(' · '),
}));

// Clubs & Communities (Our Rugby Journey)
export interface Club {
  id: string;
  name: string;
  location: string;
  country: string;
  founded: number;
  members: number;
  image: string;
  summary: string;
  journeyType: 'collective';
  acknowledgements?: string[];
  affiliations?: string[];
  isFoundational?: boolean;
  hasDetailPage?: boolean;
  // Phase 3 activation status
  hasPhase3?: boolean; // Phase 3 module activated for this journey
  phase3Note?: string; // Internal documentation of Phase 3 status
}

// Villagers Rugby Club - Phase 1 Collective Journey (Foundational)
// PHASE 3 ACTIVATED: Reference exemplar for all future club journeys.
// Module: "Build out our Rugby Journey" - collapsed, collective language, stewarded.
export const villagersClub: Club = {
  id: 'villagers-rfc',
  name: 'Villagers Rugby Club',
  location: 'Cape Town',
  country: 'South Africa',
  founded: 1876,
  members: 950,
  image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716855567_f23cba98.png',
  summary: 'One of the oldest rugby clubs in South Africa, Villagers has been a cornerstone of Cape Town rugby for nearly 150 years. Our journey is one of continuity, community, and the countless individuals who have worn the jersey.',
  journeyType: 'collective',
  acknowledgements: [
    'The founding members who established the club in 1876',
    'Generations of players, coaches, and volunteers',
    'The families who have supported the club across decades',
    'The Cape Town rugby community',
    'Western Province Rugby Football Union',
  ],
  affiliations: ['Western Province Rugby', 'South African Rugby Union'],
  isFoundational: true,
  hasDetailPage: true,
  // Phase 3 activation
  hasPhase3: true,
  phase3Note: 'Phase 3 activated as reference exemplar for collective journeys. Module uses "our" language, includes stewardship note, four options for collective memory building.',
};

export const clubs: Club[] = [

  // Villagers - First Position (Foundational Collective Journey)
  villagersClub,
  {
    id: 'club-1',
    name: 'Richmond RFC',
    location: 'London',
    country: 'England',
    founded: 1861,
    members: 1200,
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716843365_18094df4.jpg',
    summary: 'One of the oldest clubs in the world, preserving rugby\'s founding traditions.',
    journeyType: 'collective',
    acknowledgements: ['Founding members', 'Generations of volunteers', 'Local community'],
    affiliations: ['RFU', 'London & South East Division'],
  },
  {
    id: 'club-2',
    name: 'Stade Bordelais',
    location: 'Bordeaux',
    country: 'France',
    founded: 1889,
    members: 850,
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716852404_9836500f.png',
    summary: 'A cornerstone of French rugby heritage in the southwest.',
    journeyType: 'collective',
    acknowledgements: ['Bordeaux community', 'French Federation', 'Youth academies'],
    affiliations: ['FFR', 'Nouvelle-Aquitaine'],
  },
  {
    id: 'club-3',
    name: 'Pontypool RFC',
    location: 'Pontypool',
    country: 'Wales',
    founded: 1868,
    members: 650,
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716854701_14023eed.png',
    summary: 'The heart of Welsh valleys rugby, famous for its legendary front row.',
    journeyType: 'collective',
    acknowledgements: ['Mining communities', 'The Vickery family', 'Welsh rugby traditions'],
    affiliations: ['WRU', 'Gwent Rugby'],
  },
  {
    id: 'club-4',
    name: 'Old Belvedere',
    location: 'Dublin',
    country: 'Ireland',
    founded: 1930,
    members: 920,
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716857163_20ac8754.png',
    summary: 'A Dublin institution nurturing talent for nearly a century.',
    journeyType: 'collective',
    acknowledgements: ['Belvedere College', 'Dublin rugby community', 'Volunteer coaches'],
    affiliations: ['IRFU', 'Leinster Branch'],
  },
  {
    id: 'club-5',
    name: 'Stellenbosch RFC',
    location: 'Stellenbosch',
    country: 'South Africa',
    founded: 1880,
    members: 1100,
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716855567_f23cba98.png',
    summary: 'A breeding ground for Springbok legends in the Cape.',
    journeyType: 'collective',
    acknowledgements: ['Stellenbosch University', 'Western Province', 'Local schools'],
    affiliations: ['SARU', 'Western Province Rugby'],
  },
  {
    id: 'club-6',
    name: 'Petone RFC',
    location: 'Wellington',
    country: 'New Zealand',
    founded: 1885,
    members: 780,
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716848102_d077b7c6.jpg',
    summary: 'Where All Black dreams begin in the Wellington region.',
    journeyType: 'collective',
    acknowledgements: ['Wellington Rugby', 'Local families', 'Youth programmes'],
    affiliations: ['NZR', 'Wellington Rugby Football Union'],
  },
];


// Moments & History (The Journey of...)
export interface Moment {
  id: string;
  title: string;
  year: number;
  era: string;
  country: string;
  image: string;
  description: string;
  theme: string;
  journeyType: 'event';
  acknowledgements?: string[];
}

export const moments: Moment[] = [
  {
    id: 'moment-1',
    title: 'The First International',
    year: 1871,
    era: '1870s',
    country: 'Scotland',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716871793_cd3b772f.jpg',
    description: 'Scotland and England meet in the world\'s first international rugby match at Raeburn Place.',
    theme: 'Origins',
    journeyType: 'event',
    acknowledgements: ['The players of both nations', 'Raeburn Place', 'The founding clubs'],
  },
  {
    id: 'moment-2',
    title: 'The Birth of the Lions',
    year: 1888,
    era: '1880s',
    country: 'British Isles',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716872633_4973d4a1.jpg',
    description: 'The first British Isles touring team sets sail for Australia and New Zealand.',
    theme: 'Tours',
    journeyType: 'event',
    acknowledgements: ['The touring party', 'Host nations', 'The unions who made it possible'],
  },
  {
    id: 'moment-3',
    title: 'The Invincibles',
    year: 1924,
    era: '1920s',
    country: 'New Zealand',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716882991_d1fc15dc.png',
    description: 'New Zealand\'s All Blacks complete a tour of Britain undefeated, earning legendary status.',
    theme: 'Tours',
    journeyType: 'event',
    acknowledgements: ['The 1924 All Blacks squad', 'New Zealand Rugby', 'Host nations'],
  },
  {
    id: 'moment-4',
    title: 'Mandela\'s Rainbow Nation',
    year: 1995,
    era: '1990s',
    country: 'South Africa',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716876345_3b166ca4.jpg',
    description: 'South Africa hosts and wins the Rugby World Cup, uniting a nation through sport.',
    theme: 'World Cup',
    journeyType: 'event',
    acknowledgements: ['Nelson Mandela', 'The Springboks', 'The people of South Africa'],
  },
  {
    id: 'moment-5',
    title: 'Women\'s Rugby Takes Centre Stage',
    year: 1991,
    era: '1990s',
    country: 'Wales',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716885438_9294254f.png',
    description: 'The first Women\'s Rugby World Cup is held in Wales, marking a new era for the game.',
    theme: 'Women\'s Rugby',
    journeyType: 'event',
    acknowledgements: ['The pioneering women players', 'WRU', 'Women\'s rugby administrators'],
  },
];

// People of the Game (Memory Keepers, Stewards, Contributors)
export interface Person {
  id: string;
  name: string;
  roles: string[];
  club: string;
  country: string;
  years: string;
  image: string;
  contribution: string;
  journeyType: 'individual';
  acknowledgements?: string[];
}

export const people: Person[] = [
  {
    id: 'person-1',
    name: 'Margaret Chen',
    roles: ['Club Secretary', 'Administrator', 'Memory Keeper'],
    club: 'Richmond RFC',
    country: 'England',
    years: '1985-present',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716940591_5c5950fe.jpg',
    contribution: 'Four decades of tireless administration keeping the club running.',
    journeyType: 'individual',
    acknowledgements: ['Richmond RFC committee', 'Volunteer network', 'Family'],
  },
  {
    id: 'person-2',
    name: 'Patrick Murphy',
    roles: ['Youth Coach', 'Mentor', 'Community Builder'],
    club: 'Old Belvedere',
    country: 'Ireland',
    years: '1998-present',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716947971_b000fdda.png',
    contribution: 'Mentored over 500 young players, many reaching provincial level.',
    journeyType: 'individual',
    acknowledgements: ['Old Belvedere youth section', 'Parents and families', 'IRFU coaching programmes'],
  },
  {
    id: 'person-3',
    name: 'Jean-Pierre Moreau',
    roles: ['Groundskeeper', 'Steward', 'Club Historian'],
    club: 'Stade Bordelais',
    country: 'France',
    years: '1972-2020',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716958231_b0eafab0.png',
    contribution: 'Maintained the sacred turf through 48 seasons of rugby.',
    journeyType: 'individual',
    acknowledgements: ['Stade Bordelais committee', 'Generations of players', 'Family'],
  },
  {
    id: 'person-4',
    name: 'Helen Davies',
    roles: ['Team Doctor', 'Welfare Pioneer', 'Advocate'],
    club: 'Pontypool RFC',
    country: 'Wales',
    years: '1990-2018',
    image: 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1769716943938_7cd2542d.jpg',
    contribution: 'Pioneered player welfare protocols that became national standards.',
    journeyType: 'individual',
    acknowledgements: ['Pontypool RFC', 'WRU medical team', 'Player welfare community'],
  },
];

// Join Paths (updated terminology)
export const joinPaths = [
  {
    id: 'your-journey',
    title: 'Your Rugby Journey',
    description: 'Share your story and preserve your journey for future generations.',
    icon: 'user',
  },
  {
    id: 'our-journey',
    title: 'Our Rugby Journey',
    description: 'Connect your club\'s history and community to the global rugby family.',
    icon: 'building',
  },
  {
    id: 'young-players',
    title: 'Young Players',
    description: 'Begin your journey and connect with the traditions of the game.',
    icon: 'users',
  },
  {
    id: 'memory-keepers',
    title: 'Memory Keepers',
    description: 'Preserve and share the stories that matter to rugby\'s future.',
    icon: 'archive',
  },
  {
    id: 'media',
    title: 'Media & Storytellers',
    description: 'Access authentic stories and connect with the rugby community.',
    icon: 'camera',
  },
  {
    id: 'partners',
    title: 'Partners & Supporters',
    description: 'Align your organisation with rugby\'s values and global community.',
    icon: 'handshake',
  },
];

// How It Works Steps
export const howItWorksSteps = [
  {
    step: 1,
    title: 'Preserve',
    subtitle: 'Rugby Journeys',
    description: 'We capture and protect the journeys, records, and memories of rugby\'s people and places.',
  },
  {
    step: 2,
    title: 'Connect',
    subtitle: 'Relationships',
    description: 'We link individuals to clubs, clubs to communities, and generations to each other.',
  },
  {
    step: 3,
    title: 'Acknowledge',
    subtitle: 'Contributions',
    description: 'Every journey acknowledges the people, clubs and organisations that enabled it.',
  },
  {
    step: 4,
    title: 'Activate',
    subtitle: 'For-Good Spine',
    description: 'We channel resources and support to grassroots clubs where impact matters most.',
  },
  {
    step: 5,
    title: 'Sustain',
    subtitle: 'Continuity',
    description: 'We ensure journeys can be enriched over time, including posthumously with consent.',
  },
];

// Beyond Rugby Domains
export const beyondRugbyDomains = [
  {
    id: 'sports',
    title: 'Other Sports',
    description: 'Journeys that extend across multiple sporting disciplines.',
    icon: 'trophy',
  },
  {
    id: 'arts',
    title: 'Arts & Culture',
    description: 'Creative contributions that enrich communities.',
    icon: 'palette',
  },
  {
    id: 'education',
    title: 'Education & Academia',
    description: 'Knowledge sharing and learning journeys.',
    icon: 'book',
  },
  {
    id: 'giving',
    title: 'Giving & Philanthropy',
    description: 'Charitable work and community support.',
    icon: 'heart',
  },
  {
    id: 'wildlife',
    title: 'Wildlife & Preservation',
    description: 'Environmental stewardship and conservation.',
    icon: 'leaf',
  },
  {
    id: 'faith',
    title: 'Faith & Spiritual Life',
    description: 'Spiritual journeys and faith communities.',
    icon: 'sun',
  },
];

// Governance Principles
export const governancePrinciples = [
  'Pre-existing legacy profiles are wrapped, not re-ingested.',
  'All journeys may include multiple concurrent roles.',
  'Journeys are never framed as solo achievements.',
  'Acknowledgement of others is mandatory.',
  'Provinces, states, counties, regions may function as unions.',
  'Governance is documented as it existed at the time.',
  'Relationships and affiliations are described, not standardised.',
  'Posthumous journeys are supported with consent and care.',
  'Living legacy enrichment by others is permitted over time.',
];

// Permanence Test
export const permanenceTest = 'Would this still feel fair, accurate and respectful in 10–20 years?';
