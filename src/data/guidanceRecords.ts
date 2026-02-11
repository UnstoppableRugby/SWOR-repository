/**
 * SWOR Guidance Records — Patch 6B
 * Structured, versioned guidance attached to profile sections.
 * Visible ONLY to profile owners and stewards.
 * 
 * Tone rules:
 * - Calm and documentary
 * - Never use urgency language
 * - Never imply completeness or obligation
 * - Non-judgmental, non-comparative
 */

export const GUIDANCE_VERSION = 'v1.0';
export const GUIDANCE_LAST_UPDATED = 'February 2026';

export interface GuidanceRecord {
  id: string;
  section: string;
  title: string;
  body: string;
  version: string;
  tone: 'calm' | 'informational' | 'reassuring';
}

export interface ChecklistItem {
  id: string;
  label: string;
  qualifier: 'commonly_added' | 'often_added_later' | 'optional_reflections';
  section: string;
}

// ─────────────────────────────────────────────
// SECTION GUIDANCE RECORDS
// ─────────────────────────────────────────────

export const guidanceRecords: GuidanceRecord[] = [
  // Basic Information
  {
    id: 'guidance-basic-info',
    section: 'basic_info',
    title: 'About this section',
    body: 'Start with whatever you know. A name and a short introduction are helpful, but everything else can be added later — or not at all. There is no obligation to share anything you are not comfortable with.',
    version: GUIDANCE_VERSION,
    tone: 'calm'
  },
  // Core Journey
  {
    id: 'guidance-core-journey',
    section: 'core_journey',
    title: 'About your rugby story',
    body: 'This is the heart of your profile — your rugby journey in your own words. You might describe how you came to the game, the clubs or teams you were part of, or the roles you played. There is no right way to tell your story.',
    version: GUIDANCE_VERSION,
    tone: 'calm'
  },
  // Milestones
  {
    id: 'guidance-milestones',
    section: 'milestones',
    title: 'About milestones',
    body: 'Milestones mark moments that mattered to you. They do not need to be achievements — a first training session, a conversation, or a quiet turning point can be just as meaningful. Add as many or as few as you like.',
    version: GUIDANCE_VERSION,
    tone: 'reassuring'
  },
  // Reflections & Influences
  {
    id: 'guidance-reflections',
    section: 'reflections',
    title: 'About reflections',
    body: 'Reflections are personal. They might be about what rugby taught you, how it shaped your life, or who influenced your path. There is no expectation to be profound — simple, honest thoughts are valued.',
    version: GUIDANCE_VERSION,
    tone: 'calm'
  },
  // Family & Foundations
  {
    id: 'guidance-family',
    section: 'family',
    title: 'About family & foundations',
    body: 'This can include rugby family, personal family, or both. There is no obligation to include anyone. Some people share stories of parents who drove them to training; others mention teammates who became like brothers. Whatever feels right.',
    version: GUIDANCE_VERSION,
    tone: 'reassuring'
  },
  // Archive & Media
  {
    id: 'guidance-archive',
    section: 'archive',
    title: 'About your archive',
    body: "You don't need to upload everything. Choose what best represents this moment or chapter of your journey. A single photo can say more than a hundred. Old programmes, team photos, newspaper clippings — anything that matters to you.",
    version: GUIDANCE_VERSION,
    tone: 'calm'
  },
  // Connections & Acknowledgements
  {
    id: 'guidance-connections',
    section: 'connections',
    title: 'About acknowledgements',
    body: 'Acknowledging someone does not require their approval. Commendations do. You can mention anyone who played a part in your journey — teammates, coaches, volunteers, family. They do not need to be on SWOR.',
    version: GUIDANCE_VERSION,
    tone: 'informational'
  },
  // Optional Additions
  {
    id: 'guidance-optional',
    section: 'optional',
    title: 'About optional additions',
    body: 'This section exists for anything that does not fit elsewhere. There is no expectation to use it. Some people add favourite rugby quotes, links to articles, or personal anecdotes. It is entirely your choice.',
    version: GUIDANCE_VERSION,
    tone: 'calm'
  },
  // Photo
  {
    id: 'guidance-photo',
    section: 'photo',
    title: 'About your photo',
    body: 'A photo helps others recognise you, but it is not required. You can add one now or later. All photos start as drafts and are not visible to others until approved. You can crop and adjust before uploading.',
    version: GUIDANCE_VERSION,
    tone: 'reassuring'
  }
];

// ─────────────────────────────────────────────
// SECTION CHECKLISTS (Orientation Only)
// ─────────────────────────────────────────────

export const sectionChecklists: Record<string, ChecklistItem[]> = {
  basic_info: [
    { id: 'cl-name', label: 'A name or title for your journey', qualifier: 'commonly_added', section: 'basic_info' },
    { id: 'cl-intro', label: 'A brief introduction', qualifier: 'commonly_added', section: 'basic_info' },
    { id: 'cl-country', label: 'Country or region', qualifier: 'often_added_later', section: 'basic_info' },
    { id: 'cl-era', label: 'Era or period of involvement', qualifier: 'often_added_later', section: 'basic_info' },
  ],
  core_journey: [
    { id: 'cl-how-started', label: 'How you came to rugby', qualifier: 'commonly_added', section: 'core_journey' },
    { id: 'cl-clubs', label: 'Clubs, schools, or organisations', qualifier: 'commonly_added', section: 'core_journey' },
    { id: 'cl-roles', label: 'Roles played (player, coach, volunteer)', qualifier: 'often_added_later', section: 'core_journey' },
    { id: 'cl-turning-points', label: 'Memorable moments or turning points', qualifier: 'optional_reflections', section: 'core_journey' },
  ],
  archive: [
    { id: 'cl-early-photo', label: 'One early rugby photo', qualifier: 'often_added_later', section: 'archive' },
    { id: 'cl-team-photo', label: 'One team photo', qualifier: 'commonly_added', section: 'archive' },
    { id: 'cl-document', label: 'One meaningful document (programme, article, letter)', qualifier: 'optional_reflections', section: 'archive' },
  ],
  reflections: [
    { id: 'cl-what-meant', label: 'What rugby meant or means to you', qualifier: 'commonly_added', section: 'reflections' },
    { id: 'cl-influences', label: 'People who influenced your journey', qualifier: 'often_added_later', section: 'reflections' },
    { id: 'cl-lessons', label: 'Lessons learned or values shaped', qualifier: 'optional_reflections', section: 'reflections' },
  ],
  connections: [
    { id: 'cl-teammates', label: 'Teammates or coaches', qualifier: 'commonly_added', section: 'connections' },
    { id: 'cl-mentors', label: 'Mentors or supporters', qualifier: 'often_added_later', section: 'connections' },
    { id: 'cl-communities', label: 'Communities or clubs', qualifier: 'often_added_later', section: 'connections' },
  ],
};

// ─────────────────────────────────────────────
// QUALIFIER LABELS (non-evaluative)
// ─────────────────────────────────────────────

export const qualifierLabels: Record<string, string> = {
  commonly_added: 'Commonly added',
  often_added_later: 'Often added later',
  optional_reflections: 'Optional reflections',
};

// ─────────────────────────────────────────────
// REASSURANCE MICROCOPY
// ─────────────────────────────────────────────

export const reassuranceCopy = {
  save: {
    saving: 'Saving...',
    saved: 'Saved automatically. You can return at any time.',
    savedShort: 'Saved',
    unsaved: 'Unsaved changes',
    error: 'Save did not complete. Your changes are preserved locally.',
    autosaveNote: 'Your work is saved automatically every 30 seconds.',
  },
  submit: {
    prompt: 'Send to a steward when you feel ready.',
    confirmation: 'Your profile will be sent to your steward for a calm, supportive review.',
    afterSubmit: 'Submitted. Your steward will review this in their own time.',
    nothingPublic: 'Nothing becomes public without your approval.',
    noDeadline: 'Take your time. There is no deadline.',
    withdraw: 'You can withdraw your submission at any time and continue editing.',
  },
  visibility: {
    reassurance: 'Your privacy is always respected. You choose who sees what.',
    draftNote: 'Everything starts as a private draft. Only you and stewards can see it.',
    changeAnytime: 'You can change visibility settings at any time.',
  },
  stewardFeedback: {
    banner: 'Your steward has shared some thoughts. There is no urgency — review when you are ready.',
    encouragement: 'Feedback is part of the process, not a judgement. Take your time with any changes.',
  },
  general: {
    noObligation: 'There is no obligation to complete every section.',
    livingProfile: 'Profiles are living documents. You can always come back and add more.',
    elderFriendly: 'You can pause and return at any time without losing your work.',
  }
};

// ─────────────────────────────────────────────
// STEWARD QUICK GUIDE
// ─────────────────────────────────────────────

export const STEWARD_GUIDE_VERSION = 'v1.0';

export interface StewardGuideSection {
  id: string;
  title: string;
  content: string[];
}

export const stewardGuide: StewardGuideSection[] = [
  {
    id: 'sg-role',
    title: 'Your role as a steward',
    content: [
      'You are here to support, not to gatekeep.',
      'Your role is to help profile owners tell their story with confidence and accuracy.',
      'You are a trusted guide, not an editor or judge.',
      'Every person\'s journey is valid, regardless of how much they have to share.',
    ]
  },
  {
    id: 'sg-approve',
    title: 'When to approve',
    content: [
      'The profile tells a genuine story, however brief.',
      'The content is respectful and appropriate.',
      'Names, dates, and facts appear reasonable (not fabricated).',
      'The profile owner appears to have given consent.',
      'You do not need to verify every detail — trust the process.',
    ]
  },
  {
    id: 'sg-request-changes',
    title: 'When to request changes',
    content: [
      'The content appears inaccurate or misleading.',
      'The tone is inappropriate or disrespectful.',
      'There are obvious errors that the owner may want to correct.',
      'The profile may benefit from a small addition (suggest gently, never require).',
      'Always explain why, and offer to help.',
    ]
  },
  {
    id: 'sg-language',
    title: 'Suggested feedback language',
    content: [
      '"You might consider adding..." rather than "You need to add..."',
      '"This reads well — one small thought..." rather than "This is incomplete."',
      '"Take your time with this." rather than "Please update soon."',
      '"Your story is valued." rather than "Good effort."',
      '"Would you like help with this section?" rather than "This section needs work."',
    ]
  },
  {
    id: 'sg-reminder',
    title: 'Important reminders',
    content: [
      'Profiles are living, not final. They can always be updated.',
      'Not every section needs to be filled. Sparse profiles are valid.',
      'Elders may need more time. Never rush the process.',
      'If in doubt, approve and offer gentle suggestions for future updates.',
      'Your calm tone sets the standard for the entire platform.',
    ]
  },
];
