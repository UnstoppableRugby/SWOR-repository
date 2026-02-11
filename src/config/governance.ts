// ============================================
// SWOR GOVERNANCE CONFIGURATION
// Central authority for all governance rules
// ============================================

// ============================================
// STANDARD ENUMS
// ============================================

/**
 * Visibility levels for content
 * Controls who can see content at each stage
 */
export type Visibility = 'private_draft' | 'family' | 'connections' | 'public';

export const VISIBILITY_LEVELS: Record<Visibility, {
  label: string;
  description: string;
  order: number;
}> = {
  private_draft: {
    label: 'Private Draft',
    description: 'Only you and your stewards can see this',
    order: 0,
  },
  family: {
    label: 'Family and Trusted Circle',
    description: 'Family members and trusted contacts can view',
    order: 1,
  },
  connections: {
    label: 'Connections',
    description: 'Your connections can view',
    order: 2,
  },
  public: {
    label: 'Public',
    description: 'Visible to everyone (after approval)',
    order: 3,
  },
};

/**
 * Content status for workflow
 * Controls the approval workflow for all content
 */
export type Status = 'draft' | 'pending_review' | 'approved' | 'rejected';

export const STATUS_LABELS: Record<Status, {
  label: string;
  description: string;
  color: string;
}> = {
  draft: {
    label: 'Draft',
    description: 'Work in progress, not submitted for review',
    color: 'gray',
  },
  pending_review: {
    label: 'Pending Review',
    description: 'Submitted and awaiting steward approval',
    color: 'amber',
  },
  approved: {
    label: 'Approved',
    description: 'Reviewed and approved for the selected visibility',
    color: 'green',
  },
  rejected: {
    label: 'Rejected',
    description: 'Reviewed and not approved, requires changes',
    color: 'red',
  },
};

// ============================================
// ROLE DEFINITIONS
// ============================================

/**
 * Site-wide role types
 */
export type SiteRole = 'visitor' | 'member' | 'steward' | 'global_steward';

export const SITE_ROLES: Record<SiteRole, {
  label: string;
  description: string;
  permissions: string[];
}> = {
  visitor: {
    label: 'Visitor',
    description: 'Anonymous visitor, can view public content only',
    permissions: ['view_public'],
  },
  member: {
    label: 'Member',
    description: 'Authenticated user, can create and manage their own journeys',
    permissions: ['view_public', 'view_connections', 'create_journey', 'edit_own'],
  },
  steward: {
    label: 'Steward',
    description: 'Trusted person who can help manage specific journeys',
    permissions: ['view_public', 'view_connections', 'view_family', 'suggest_edits', 'review_drafts'],
  },
  global_steward: {
    label: 'Global Steward',
    description: 'Site-wide builder access across all journeys',
    permissions: [
      'view_public',
      'view_connections',
      'view_family',
      'view_private_draft',
      'suggest_edits',
      'review_drafts',
      'review_suggestions',
      'edit_journeys',
      'phase3_builder',
      'access_all_journeys',
    ],
  },
};

/**
 * Steward permission levels for journey-specific access
 */
export type StewardPermission = 'view' | 'suggest' | 'edit';

export const STEWARD_PERMISSIONS: Record<StewardPermission, {
  label: string;
  description: string;
}> = {
  view: {
    label: 'View only',
    description: 'Can view all content including drafts',
  },
  suggest: {
    label: 'Suggest edits',
    description: 'Can suggest changes for review (recommended)',
  },
  edit: {
    label: 'Edit and publish',
    description: 'Can make changes directly (Legacy Mode only)',
  },
};

// ============================================
// CANONICAL STEWARD IDENTITY
// ============================================

/**
 * Global steward configuration
 * Site-wide builder access (invisible to public)
 */
export interface GlobalStewardIdentity {
  email: string;
  name: string;
  role: 'global_steward';
  permissions: {
    phase3Builder: boolean;
    editJourneys: boolean;
    reviewDrafts: boolean;
    reviewSuggestions: boolean;
    accessAllJourneys: boolean;
  };
  addedAt: string;
  addedBy: string;
  note?: string;
}

/**
 * Canonical global steward
 * This is the authoritative steward identity for the site
 */
export const CANONICAL_GLOBAL_STEWARD: GlobalStewardIdentity = {
  email: 'alun@adesignbranding.co.za',
  name: 'Alun',
  role: 'global_steward',
  permissions: {
    phase3Builder: true,
    editJourneys: true,
    reviewDrafts: true,
    reviewSuggestions: true,
    accessAllJourneys: true,
  },
  addedAt: '2026-02-01',
  addedBy: 'system',
  note: 'Canonical global steward with full builder access across all SWOR journeys',
};

/**
 * Check if an email matches the canonical global steward
 */
export const isCanonicalGlobalSteward = (email: string | undefined | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === CANONICAL_GLOBAL_STEWARD.email.toLowerCase();
};

// ============================================
// GOVERNANCE PRINCIPLES (NON-NEGOTIABLE)
// ============================================

export const GOVERNANCE_PRINCIPLES = {
  /**
   * Draft-first: nothing is public until explicitly approved
   */
  draftFirst: {
    id: 'draft-first',
    title: 'Draft First',
    description: 'Nothing is public until explicitly approved by a steward.',
    rule: 'All new content defaults to private_draft status.',
    enforcement: 'UI must never allow direct publishing without review.',
  },

  /**
   * Calm, plain English tone
   */
  calmTone: {
    id: 'calm-tone',
    title: 'Calm Tone',
    description: 'All copy uses calm, plain English.',
    rule: 'Avoid jargon, urgency language, or marketing speak.',
    enforcement: 'Review all microcopy for tone before deployment.',
  },

  /**
   * Elders-first usability
   */
  eldersFirst: {
    id: 'elders-first',
    title: 'Elders First Usability',
    description: 'Design for accessibility and readability.',
    rules: [
      'Light backgrounds for readability',
      'Adequate spacing between elements',
      'No long hyphens or em dashes',
      'Clear, readable typography',
      'High contrast text',
      'Large touch targets',
    ],
    enforcement: 'All UI components must pass accessibility review.',
  },

  /**
   * Attribution and provenance for every contribution
   */
  attribution: {
    id: 'attribution',
    title: 'Attribution and Provenance',
    description: 'Every contribution must be attributed.',
    rule: 'No anonymous input allowed. All contributions tracked.',
    enforcement: 'Contribution forms must capture contributor identity.',
  },

  /**
   * Suggestions only for cross-journey sharing
   */
  suggestionsOnly: {
    id: 'suggestions-only',
    title: 'Suggestions Only',
    description: 'Cross-journey sharing is by suggestion only.',
    rule: 'Content cannot be directly added to another journey.',
    enforcement: 'Cross-journey features must use suggestion workflow.',
  },

  /**
   * Visibility boundaries enforced at all times
   */
  visibilityBoundaries: {
    id: 'visibility-boundaries',
    title: 'Visibility Boundaries',
    description: 'Visibility settings are strictly enforced.',
    rule: 'Content is only shown to users who meet visibility criteria.',
    enforcement: 'All queries must filter by visibility level.',
  },
} as const;

// ============================================
// AUTHENTICATION RULES
// ============================================

export const AUTH_RULES = {
  /**
   * Magic links only, no passwords
   */
  magicLinksOnly: {
    id: 'magic-links-only',
    title: 'Magic Links Only',
    description: 'Authentication uses magic links, not passwords.',
    rule: 'No password fields in authentication UI.',
    enforcement: 'Auth forms must only offer magic link or passkey options.',
  },

  /**
   * Global steward access via magic link
   */
  globalStewardAuth: {
    id: 'global-steward-auth',
    title: 'Global Steward Authentication',
    description: 'Global stewards authenticate via magic link to their registered email.',
    rule: 'When authenticated, global_steward sees steward/builder controls across all journeys.',
    enforcement: 'Check email against canonical steward list on auth.',
  },
} as const;

// ============================================
// UI/UX GUIDELINES
// ============================================

export const UI_GUIDELINES = {
  /**
   * Typography rules for elders-first readability
   */
  typography: {
    noLongHyphens: 'Use regular hyphens (-) not em dashes or en dashes',
    minFontSize: '16px minimum for body text',
    lineHeight: '1.5 or greater for readability',
    fontWeight: 'Regular (400) or medium (500) for body, avoid light weights',
  },

  /**
   * Color rules for accessibility
   */
  colors: {
    background: 'Light backgrounds (#F5F1E8 or similar warm neutrals)',
    textContrast: 'Minimum 4.5:1 contrast ratio for body text',
    linkContrast: 'Links must be distinguishable from body text',
  },

  /**
   * Spacing rules for readability
   */
  spacing: {
    touchTargets: 'Minimum 44px touch targets for interactive elements',
    lineSpacing: 'Generous line spacing for readability',
    sectionSpacing: 'Clear visual separation between sections',
  },

  /**
   * Microcopy tone
   */
  microcopy: {
    tone: 'Calm, reassuring, plain English',
    avoid: ['urgency', 'marketing speak', 'jargon', 'exclamation marks'],
    examples: {
      good: 'Your changes have been saved.',
      bad: 'Success! Changes saved!',
    },
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a visibility level allows viewing by a given role
 */
export const canRoleViewVisibility = (
  role: SiteRole,
  visibility: Visibility
): boolean => {
  const permissions = SITE_ROLES[role].permissions;
  
  switch (visibility) {
    case 'public':
      return permissions.includes('view_public');
    case 'connections':
      return permissions.includes('view_connections');
    case 'family':
      return permissions.includes('view_family');
    case 'private_draft':
      return permissions.includes('view_private_draft');
    default:
      return false;
  }
};

/**
 * Get the default visibility for new content
 * Always returns private_draft per governance rules
 */
export const getDefaultVisibility = (): Visibility => {
  return 'private_draft';
};

/**
 * Get the default status for new content
 * Always returns draft per governance rules
 */
export const getDefaultStatus = (): Status => {
  return 'draft';
};

/**
 * Validate that content follows governance rules
 */
export const validateGovernance = (content: {
  visibility?: Visibility;
  status?: Status;
  contributorEmail?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check attribution rule
  if (!content.contributorEmail) {
    errors.push('Attribution required: contributor email must be provided.');
  }

  // Check draft-first rule
  if (content.visibility === 'public' && content.status !== 'approved') {
    errors.push('Draft-first rule: public content must be approved.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
