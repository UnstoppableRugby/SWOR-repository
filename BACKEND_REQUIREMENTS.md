# SWOR Backend Requirements — Complete Reference

> **Generated**: 2026-02-14  
> **Updated**: 2026-03-08 (v2.4 — Root-based auth callback)  
> **Frontend repo**: smallworldofrugby.com  
> **Supabase project**: `haqqahzxutnjgtmfizme` (fallback in `src/lib/supabase.ts`)

---

## 1. Supabase Edge Functions Required

The frontend calls **9 distinct Edge Functions** via `supabase.functions.invoke(name, { body })`.  
Every call sends `{ action: string, payload?: object }` (or top-level keys like `action`, `email`, etc.).

### 1.1 `swor-auth` — Authentication & Session Management (v2.4)

| Action | Called From | Purpose |
|--------|-----------|---------|
| `send_magic_link` | `AuthModal.tsx` | Send custom magic-link email (Resend). Body: `{ action, email, redirect_url, callback_path }` |
| `verify_token` | `AppContext.tsx` | Verify `?auth_token=` from magic-link callback. Body: `{ action, token }` |
| `validate_session` | `AppContext.tsx` | Re-validate stored `swor_session_token`. Body: `{ action, session_token }` |
| `sign_out` | `AppContext.tsx` | Log sign-out event. Body: `{ action, session_token, email }` |
| `get_auth_events` | `AuthEventsDashboard.tsx` | Steward: list auth events with filters |
| `auth_events_health` | `AuthEventsDashboard.tsx` | Steward: auth system health check |
| `cleanup_auth_events` | `AuthEventsDashboard.tsx` | Steward: purge old auth events |
| `check_domain_status` | `DomainVerificationPanel.tsx` | Check Resend domain verification status |
| `verify_domain` | `DomainVerificationPanel.tsx` | Trigger domain verification |
| `setup_domain` | `DomainVerificationPanel.tsx` | Register domain with Resend |


**Expected response shape** (all actions):
```json
{ "success": true, "user": {...}, "session_token": "...", ... }
// or
{ "success": false, "error": "error_code", "detail": "Human message" }
```

### 1.2 `swor-profile` — Profile CRUD, Steward Management, Commendations

| Action | Called From | Purpose |
|--------|-----------|---------|
| `get_profile` | `IndividualProfileBuilder.tsx` | Load user's profile. Payload: `{ user_id }` |
| `save_profile` | `IndividualProfileBuilder.tsx` | Create/update profile (autosave or manual). Payload: `{ profile_id?, user_id, ...fields, is_autosave }` |
| `submit_profile_for_review` | `IndividualProfileBuilder.tsx` | Submit profile for steward review. Payload: `{ profile_id, user_id }` |
| `withdraw_submission` | `IndividualProfileBuilder.tsx` | Withdraw from review back to draft. Payload: `{ profile_id, user_id }` |
| `upload_photo` | `IndividualProfileBuilder.tsx` | Upload profile photo (base64). Payload: `{ profile_id, user_id, file_name, file_type, file_size, file_data, alt_text }` |
| `get_archive_items` | `IndividualProfileBuilder.tsx` | Get archive items for a profile. Payload: `{ profile_id }` |
| `upload_archive_item` | `ArchiveUploadSection.tsx` | Upload archive file |
| `update_archive_item` | `ArchiveUploadSection.tsx` | Update archive item metadata |
| `delete_archive_item` | `ArchiveUploadSection.tsx` | Delete archive item |
| `reorder_archive_items` | `ArchiveUploadSection.tsx` | Reorder archive items |
| `set_featured_image` | `ArchiveUploadSection.tsx` | Set featured image for profile |
| `get_milestones` | `MilestoneEditor.tsx`, `MilestoneTimeline.tsx` | Get milestones for a profile |
| `create_milestone` | `MilestoneEditor.tsx` | Create new milestone |
| `update_milestone` | `MilestoneEditor.tsx` | Update existing milestone |
| `delete_milestone` | `MilestoneEditor.tsx` | Delete milestone |
| `reorder_milestones` | `MilestoneEditor.tsx` | Reorder milestones |
| `submit_commendation` | `CommendationForm.tsx` | Submit a commendation for someone |
| `get_pending_commendations` | `CommendationReviewDashboard.tsx`, `StewardOpsHub.tsx` | Steward: list pending commendations |
| `review_commendation` | `CommendationReviewDashboard.tsx`, `StewardOpsHub.tsx` | Steward: approve/reject commendation |
| `get_commendations_for_profile` | `CommendationsList.tsx` | Get approved commendations for a profile |
| `get_commendations_by_commender` | `CommendationsList.tsx` | Get commendations written by a user |
| `respond_to_commendation` | `CommendationsList.tsx` | Profile owner responds to commendation |
| `get_submitted_profiles` | `ProfileReviewDashboard.tsx`, `StewardOpsHub.tsx` | Steward: list profiles awaiting review |
| `approve_profile` | `ProfileReviewDashboard.tsx`, `StewardOpsHub.tsx` | Steward: approve a profile |
| `request_changes` | `ProfileReviewDashboard.tsx`, `StewardOpsHub.tsx` | Steward: request changes to a profile |
| `get_stewards` | `StewardProfilePanel.tsx` | Get steward assignments for a profile |
| `assign_steward` | `StewardProfilePanel.tsx` | Assign a steward to a profile |
| `remove_steward` | `StewardProfilePanel.tsx` | Remove a steward from a profile |
| `search_profiles_for_assignment` | `SafeResetPanel.tsx`, `StewardOpsHub.tsx` | Search profiles for steward assignment |
| `reset_profile` | `SafeResetPanel.tsx` | Reset a profile (steward action) |
| `get_profile_reset_history` | `SafeResetPanel.tsx` | Get reset history for a profile |
| `list_steward_assignments` | `StewardOpsHub.tsx` | List all steward assignments |
| `create_steward_assignment` | `StewardOpsHub.tsx` | Create new steward assignment |
| `deactivate_steward_assignment` | `StewardOpsHub.tsx` | Deactivate a steward assignment |
| `get_profile_review_history` | `StewardOpsHub.tsx` | Get review history for a profile |

### 1.3 `swor-contributions` — Journey & Contribution Management

| Action | Called From | Purpose |
|--------|-----------|---------|
| `get_user_journeys` | `useMyJourneys.ts` | Get all journeys for a user. Payload: `{ user_id, user_email? }` |
| `create_user_journey` | `useMyJourneys.ts` | Create a new journey |
| `update_user_journey` | `useMyJourneys.ts` | Update journey metadata |
| `delete_user_journey` | `useMyJourneys.ts` | Delete a journey |
| `get_contributions` | `useJourneyContributions.ts` | Get contributions for a journey |
| `create_contribution` | `useJourneyContributions.ts` | Create a new contribution |
| `update_contribution` | `useJourneyContributions.ts` | Update a contribution |
| `delete_contribution` | `useJourneyContributions.ts` | Delete a contribution |
| `submit_for_review` | `useJourneyContributions.ts` | Submit contribution for review |
| `approve_contribution` | `useJourneyContributions.ts` | Approve a contribution |
| `reject_contribution` | `useJourneyContributions.ts` | Reject a contribution |
| `batch_save` | `useJourneyContributions.ts` | Batch save multiple contributions |
| `get_contribution_audit` | `useJourneyContributions.ts` | Get audit log for contributions |
| `get_approved_contributions` | `ApprovedContributions.tsx` | Get approved contributions for display |

### 1.4 `swor-file-upload` — File Management & Steward Dashboard Items

| Action | Called From | Purpose |
|--------|-----------|---------|
| `get_approved_items` | `ApprovedItemsSection.tsx` | Get approved items for a journey |
| `update_item_metadata` | `ApprovedItemsSection.tsx` | Update item metadata |
| `delete_item` | `ApprovedItemsSection.tsx` | Delete an item |
| `get_file_data` | `FilePreviewModal.tsx`, `VideoPreviewModal.tsx` | Get file data for preview |
| `check_global_steward` | `StewardDashboard.tsx` | Check if user is global steward |
| `get_stewards` | `StewardDashboard.tsx` | Get stewards for a journey |
| `add_journey_steward` | `StewardDashboard.tsx` | Add steward to journey |
| `remove_journey_steward` | `StewardDashboard.tsx` | Remove steward from journey |
| `get_journey_items` | `StewardDashboard.tsx` | Get all items for a journey |
| `get_audit_log` | `StewardDashboard.tsx` | Get audit log for a journey |
| `submit_text_item` | `StewardDashboard.tsx` | Submit a text contribution |
| `submit_link_item` | `StewardDashboard.tsx` | Submit a link contribution |
| `get_video_upload_url` | `StewardDashboard.tsx` | Get presigned URL for video upload |
| `register_video_upload` | `StewardDashboard.tsx` | Register a completed video upload |

### 1.5 `swor-notifications` — Email Notifications & Audit

| Action | Called From | Purpose |
|--------|-----------|---------|
| `commendation_submitted` | `CommendationForm.tsx` | Notify stewards of new commendation |
| `commendation_approved` | `CommendationReviewDashboard.tsx`, `StewardOpsHub.tsx` | Notify commender of approval |
| `commendation_rejected` | `CommendationReviewDashboard.tsx`, `StewardOpsHub.tsx` | Notify commender of rejection |
| `profile_approved` | `ProfileReviewDashboard.tsx`, `StewardOpsHub.tsx` | Notify profile owner of approval |
| `profile_needs_changes` | `ProfileReviewDashboard.tsx`, `StewardOpsHub.tsx` | Notify profile owner of requested changes |
| `profile_submitted` | `IndividualProfileBuilder.tsx` | Notify stewards of profile submission |
| `get_preferences` | `SettingsPage.tsx` | Get user notification preferences |
| `update_preferences` | `SettingsPage.tsx` | Update user notification preferences |
| `send_test_email` | `EmailStatusPage.tsx` | Send a test email |
| `get_steward_audit_log` | `StewardOpsHub.tsx` | Get steward audit log |
| `get_steward_activity_summary` | `StewardOpsHub.tsx` | Get steward activity summary |
| `write_audit_entry` | `StewardOpsHub.tsx` | Write an audit log entry |

### 1.6 `swor-contact` — Contact Form & Join Requests

| Action | Called From | Purpose |
|--------|-----------|---------|
| `submit_message` | `ContactPage.tsx` | Submit a contact message |
| `submit_join_request` | `JoinPage.tsx` | Submit a join/contribute request |
| `list_messages` | `StewardOpsHub.tsx` | Steward: list contact messages |
| `update_message` | `StewardOpsHub.tsx` | Steward: update message status |

### 1.7 `swor-archive-export` — Archive Export

| Action | Called From | Purpose |
|--------|-----------|---------|
| `start_export` | `ArchiveUploadSection.tsx` | Start archive export |
| `email_export_link` | `ArchiveUploadSection.tsx` | Email export download link |

### 1.8 `swor-video-stream` — Video Streaming

| Action | Called From | Purpose |
|--------|-----------|---------|
| `get_stream_url` | `VideoPreviewModal.tsx` | Get streaming URL for a video |

### 1.9 `swor-health-check` — System Health

| Action | Called From | Purpose |
|--------|-----------|---------|
| `go_live` | `EmailStatusPage.tsx`, `GoLiveChecklistPage.tsx` | Run go-live health checks |

---

## 2. Database Tables Required

### 2.1 `profiles` — User Profiles (Direct DB access via RLS)

Used by: `AppContext.tsx`, `AuthModal.tsx`, `StewardOpsHub.tsx`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  known_as TEXT,
  title TEXT,
  introduction TEXT,
  summary TEXT,
  country TEXT,
  region TEXT,
  era TEXT,
  birth_year INTEGER,
  roles TEXT[] DEFAULT '{}',
  user_type TEXT DEFAULT 'fan',
  bio TEXT,
  club_affiliation TEXT,
  
  -- Photo
  photo_url TEXT,
  photo_alt_text TEXT,
  photo_status TEXT DEFAULT 'draft',
  
  -- Visibility & Status
  visibility_default TEXT DEFAULT 'draft',
  status TEXT DEFAULT 'draft',
  
  -- Stewardship
  primary_steward TEXT,
  secondary_steward TEXT,
  steward_permission TEXT DEFAULT 'suggest',
  
  -- Legacy Mode
  legacy_mode_enabled BOOLEAN DEFAULT FALSE,
  legacy_mode_updated_at TIMESTAMPTZ,
  
  -- Review workflow
  submitted_at TIMESTAMPTZ,
  steward_note TEXT,
  steward_note_by TEXT,
  steward_note_at TIMESTAMPTZ,
  
  -- Site role
  site_role TEXT DEFAULT 'member',
  role TEXT DEFAULT 'member',
  
  -- Section data (JSONB)
  core_journey JSONB DEFAULT '{}',
  reflections_influences JSONB DEFAULT '{}',
  archive_media JSONB DEFAULT '{}',
  connections_acknowledgements JSONB DEFAULT '{}',
  optional_additions JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public read for published profiles (optional)
CREATE POLICY "Public can read published profiles"
  ON profiles FOR SELECT
  USING (status = 'published' AND visibility_default = 'public');
```

### 2.2 `favorites` — User Favorites (Direct DB access via RLS)

Used by: `AuthModal.tsx`

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);
```

### 2.3 Tables Managed by Edge Functions

These tables are accessed ONLY through edge functions (not directly from the frontend).
The edge functions should create/manage them:

- `user_journeys` — Journey ownership/membership
- `journey_contributions` — Contributions to journeys
- `contribution_audit_log` — Audit trail for contributions
- `archive_items` — Uploaded archive files
- `milestones` — Timeline milestones
- `commendations` — Commendations between users
- `steward_assignments` — Steward-to-profile assignments
- `contact_messages` — Contact form submissions
- `auth_events` — Authentication event log
- `auth_sessions` — Custom session tokens (for magic link flow)
- `notification_preferences` — User notification settings
- `steward_audit_log` — Steward activity audit trail

---
## 3. Magic Link / Auth Callback Handling

### Current Flow (v2.4 — Root-based Auth Processing)

> **Why v2.4?** Famous.ai's hosting platform does not support SPA fallback routing.
> Requests to `/auth/callback` returned 404 before React Router could handle them.
> v2.4 eliminates the dependency on `/auth/callback` as a server route by processing
> all auth tokens at the root URL (`/`).

**All auth redirects now route through `/` (root URL).**  
`AppContext.tsx` runs `processAuthAtRoot()` on mount and handles three token formats
directly from the URL query string:

1. **Custom magic link** (`/?auth_token=TOKEN`):
   - `AuthModal.tsx` calls `swor-auth` with `action: 'send_magic_link'` and `callback_path: '/'`
   - Edge function (v2.4) reads `callback_path` and constructs the magic link URL as:
     `https://smallworldofrugby.com/?auth_token=<token>`
   - `AppContext.tsx` detects `?auth_token=` → calls `swor-auth` with `action: 'verify_token'` → stores session → cleans URL via `history.replaceState`

2. **Supabase PKCE flow** (`/?code=AUTH_CODE`):
   - `AuthModal.tsx` calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: origin + '/' } })`
   - Supabase emails a link that redirects to `/?code=<code>`
   - `AppContext.tsx` detects `?code=` → calls `supabase.auth.exchangeCodeForSession(code)` → session stored → URL cleaned

3. **Supabase token_hash flow** (`/?token_hash=HASH&type=magiclink`):
   - `AppContext.tsx` detects `?token_hash=` → calls `supabase.auth.verifyOtp({ token_hash, type })` → session stored → URL cleaned

**Backward compatibility**:
- The `/auth/callback` React route still exists in `App.tsx` and `AuthCallback.tsx` for any old magic links
- `public/auth/callback/index.html` redirects to `/?<original-params>` as a safety net
- Both old (`/auth/callback?auth_token=TOKEN`) and new (`/?auth_token=TOKEN`) formats work

### swor-auth Edge Function v2.4 Update Required

**What changed in the `send_magic_link` action:**

The frontend now sends a `callback_path` field in the request body:
```json
{
  "action": "send_magic_link",
  "email": "user@example.com",
  "redirect_url": "https://smallworldofrugby.com",
  "callback_path": "/"
}
```

**Edge function changes needed (v2.4):**

1. **Read `callback_path`** from the request body (default to `/auth/callback` for backward compatibility):
   ```typescript
   const callbackPath = body.callback_path || '/auth/callback';
   ```

2. **Construct magic link URL** using `callback_path`:
   ```typescript
   // OLD (v2.3):
   const magicLinkUrl = `${redirectUrl}/auth/callback?auth_token=${token}`;
   
   // NEW (v2.4):
   const magicLinkUrl = callbackPath === '/'
     ? `${redirectUrl}/?auth_token=${token}`
     : `${redirectUrl}${callbackPath}?auth_token=${token}`;
   ```

3. **Bump version** to v2.4 in the function's response headers or logs.

**No other actions in swor-auth need changes.** The `verify_token` and `validate_session` actions work identically regardless of which URL the user arrived from.

### What You Need in Supabase Dashboard

| Setting | Value |
|---------|-------|
| **Site URL** | `https://www.smallworldofrugby.com` |
| **Redirect URLs** | `https://www.smallworldofrugby.com/*`, `https://smallworldofrugby.com/*`, `https://www.smallworldofrugby.com/auth/callback` (legacy), `https://smallworldofrugby.com/auth/callback` (legacy) |

### Email Templates (Supabase Dashboard → Auth → Email Templates):

For the **Magic Link** template, update to root-based format:
```
{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=magiclink
```

> **Previously (v2.3):** `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink`  
> The old format still works via the `public/auth/callback/index.html` redirect safety net,
> but updating to the root format is recommended for reliability.

---

## 5. Environment Variables

### Frontend (Vercel/Netlify):

```env
VITE_database_URL=https://haqqahzxutnjgtmfizme.supabase.co
VITE_database_ANON_KEY=<your-anon-key>
```

**CRITICAL**: The URL must be the Supabase Project URL (`https://<ref>.supabase.co`), NOT a DatabasePad URL.

### Edge Functions (Supabase Secrets):

Each edge function may need:
```
SUPABASE_URL=https://haqqahzxutnjgtmfizme.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
RESEND_API_KEY=<resend-api-key>
SITE_URL=https://www.smallworldofrugby.com
```

---

## 6. Priority Order for Deployment

### Phase 1 — Core (Unblocks "Create Journey" + Profile Builder)

1. **`swor-auth`** — Needed for custom magic link flow + session validation
2. **`swor-profile`** — Needed for profile builder ("Loading your profile..." fix)
3. **`swor-contributions`** — Needed for "My Journeys" + "Create Journey"
4. **`profiles` table** — Needed for basic auth profile storage

### Phase 2 — Content Management

5. **`swor-file-upload`** — Needed for steward dashboard + file management
6. **`swor-notifications`** — Needed for email notifications

### Phase 3 — Operational

7. **`swor-contact`** — Contact form + join requests
8. **`swor-archive-export`** — Archive export functionality
9. **`swor-video-stream`** — Video streaming
10. **`swor-health-check`** — System health checks

---

## 7. Immediate Fix Applied (Frontend Resilience)

The frontend has been updated to be **resilient to missing edge functions**:

- **Timeout wrapper**: All `supabase.functions.invoke` calls in critical paths now have a 10-second timeout
- **Graceful fallback**: `IndividualProfileBuilder` falls back to direct `profiles` table query if `swor-profile` edge function is unavailable
- **AppContext resilience**: Session validation gracefully degrades if `swor-auth` is unavailable
- **Error display**: Users see helpful error messages instead of infinite loading spinners
