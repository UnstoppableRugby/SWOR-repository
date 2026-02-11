# SWOR Export & Deployment Guide

## IMPORTANT: Read This First

**Famous.ai is a code editor** — it can create, edit, and organise files, but it **cannot**:
- Generate ZIP downloads
- Push code to GitHub
- Deploy to Vercel/Netlify
- Execute shell commands

To get your code out, you must use the **Famous.ai platform's own export/download feature** (not the AI chat). Below are all known methods.

---

## Status: Code Complete, Deployment-Ready

| Item | Status |
|------|--------|
| All ~130 source files | Complete |
| Build config (`package.json`, `vite.config.ts`) | Complete |
| Deployment config (`vercel.json`, `netlify.toml`) | Complete |
| Environment template (`.env.example`) | Complete |
| Security headers, caching, SPA rewrites | Complete |
| SEO (`robots.txt`, `sitemap.xml`, OG tags) | Complete |
| Offline support (service worker) | Complete |

---

## How to Export the Code

### Option A: Famous.ai Platform Download (RECOMMENDED)

The Famous.ai **platform UI** (not the AI chat) should have an export feature. Look for:

1. **Top-right corner** of the editor — look for a download icon, "Export", or "Code" button
2. **Project menu** or **three-dot menu (⋯)** — look for "Download ZIP", "Export Project", or "Download Source"
3. **File explorer sidebar** — right-click the root folder or look for an export option
4. **Settings / Project Settings** — some platforms put export under project configuration
5. **Share button** — sometimes export is grouped with sharing features

> **If you cannot find an export button**, contact Famous.ai support directly and request:
> *"Please provide a downloadable ZIP export of my SWOR project workspace"*

### Option B: Famous.ai GitHub Integration

Some AI code editors can push directly to GitHub:

1. Look for a **"GitHub"**, **"Git"**, or **"Version Control"** option in the Famous.ai UI
2. Connect it to: `https://github.com/UnstoppableRugby/SWOR-repository`
3. Push all files to the `main` branch

### Option C: Terminal Access (If Available)

If Famous.ai provides terminal/console access:

```bash
# Option 1: Run the export script (included in the project)
chmod +x export.sh
./export.sh

# Option 2: Push directly to GitHub
git init
git remote add origin https://github.com/UnstoppableRugby/SWOR-repository.git
git add .
git commit -m "SWOR production release"
git branch -M main
git push -u origin main --force
```

### Option D: Manual File Copy (Last Resort)

If no automated export is available, you can manually reconstruct the project:

1. Create a new folder on your local machine called `swor`
2. Copy each file from the Famous.ai editor into the matching path
3. Start with the critical files listed in the **File Manifest** section below
4. Then push to GitHub

**Priority files to copy first:**
```
package.json          ← Dependencies (copy this FIRST)
vite.config.ts        ← Build config
vercel.json           ← Deployment config
tsconfig.json         ← TypeScript config
tsconfig.app.json     ← TypeScript app config
tailwind.config.ts    ← Tailwind config
postcss.config.js     ← PostCSS config
index.html            ← HTML entry point
.env.example          ← Environment template
.gitignore            ← Git ignore rules
src/main.tsx          ← React entry point
src/App.tsx           ← Router
src/App.css           ← Global styles
src/index.css         ← Tailwind + CSS variables
src/pages/Index.tsx   ← Main page wrapper
src/components/AppLayout.tsx  ← Main layout
```

Then copy all files under:
```
src/components/swor/          ← All SWOR components
src/components/swor/pages/    ← All SWOR pages
src/components/ui/            ← All shadcn/ui components
src/contexts/                 ← App context
src/config/                   ← Governance config
src/data/                     ← Data files
src/hooks/                    ← Custom hooks
src/lib/                      ← Utilities
public/                       ← Static assets
```

---

## After Export: Push to GitHub

Once you have the files locally (from any method above):

```bash
cd swor

# Initialise and push
git init
git remote add origin https://github.com/UnstoppableRugby/SWOR-repository.git
git add .
git commit -m "SWOR v6B.4 — Production release $(date +%Y-%m-%d)"
git branch -M main
git push -u origin main --force
```

---

## After GitHub: Deploy on Vercel

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub (Alun's account)
2. Click **"Add New..."** → **"Project"**
3. Select **UnstoppableRugby/SWOR-repository**
4. Verify auto-detected settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Root Directory** | `./` |

### Step 2: Set Environment Variables

Add these **before clicking Deploy**:

| Key | Value | Environments |
|-----|-------|-------------|
| `VITE_database_URL` | `https://lbweciluypxgmqcckfhu.supabase.co` | Production, Preview |
| `VITE_database_ANON_KEY` | *(your Supabase anon key — see below)* | Production, Preview |

**Finding your Supabase anon key:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your SWOR project
3. Go to **Settings** → **API**
4. Copy the **anon (public)** key

> The anon key is safe for client-side use — it only grants public access enforced by Row Level Security (RLS).

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for the build to complete
3. Verify the preview URL works (e.g., `swor-xxxxx.vercel.app`)

### Step 4: Add Custom Domains

1. Go to **Settings** → **Domains**
2. Add `swor.rugby` (primary)
3. Add `www.swor.rugby` (redirect to apex)
4. If also using: add `smallworldofrugby.com` and `www.smallworldofrugby.com`

### Step 5: Configure DNS

At your domain registrar, add these records:

**For swor.rugby:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 3600 |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |

**For smallworldofrugby.com (if applicable):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 3600 |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |

> Remove any existing A, AAAA, or CNAME records for `@` and `www` before adding these.

### Step 6: Verify

| URL | Expected |
|-----|----------|
| `https://swor.rugby` | Homepage loads with SSL |
| `https://www.swor.rugby` | Redirects to `https://swor.rugby` |
| `https://swor.rugby/legends` | Legends page loads (SPA routing) |
| Refresh any page | Loads correctly (not 404) |

---

## Complete File Manifest (~130 files)

### Root Configuration (14 files)
```
.env.example              Environment variable template
.gitignore                Git ignore rules
DEPLOYMENT.md             Detailed deployment guide
EXPORT_GUIDE.md           This file
README.md                 Project readme
components.json           shadcn/ui component config
eslint.config.js          ESLint config
export.sh                 Export helper script
index.html                HTML entry point (with OG meta tags)
netlify.toml              Netlify deployment config
package.json              Dependencies & npm scripts
postcss.config.js         PostCSS plugins
tailwind.config.ts        Tailwind CSS + SWOR theme
tsconfig.app.json         TypeScript app config
tsconfig.json             TypeScript base config
tsconfig.node.json        TypeScript node config
vercel.json               Vercel: build, rewrites, headers, caching
vite.config.ts            Vite bundler config
```

### Public Assets (7 files)
```
public/_headers           Netlify security headers
public/_redirects          Netlify SPA fallback
public/offline.html        Offline fallback page
public/placeholder.svg     Placeholder image
public/robots.txt          Search engine directives
public/sitemap.xml         XML sitemap for SEO
public/sw.js               Service worker
```

### Source Entry Points (6 files)
```
src/main.tsx              React entry + SW registration
src/App.tsx               Router + providers
src/App.css               Global CSS
src/index.css             Tailwind directives + CSS variables
src/pages/Index.tsx       Main page wrapper
src/pages/NotFound.tsx    404 page
```

### Core Application (5 files)
```
src/components/AppLayout.tsx       Main layout + page router
src/contexts/AppContext.tsx         Global state management
src/lib/supabase.ts                Supabase client
src/lib/utils.ts                   Utility functions
src/lib/offlineQueue.ts            Offline action queue
```

### Configuration & Data (3 files)
```
src/config/governance.ts           Governance rules
src/data/sworData.ts               Core data (legends, clubs, etc.)
src/data/guidanceRecords.ts        Guidance content
```

### Hooks (5 files)
```
src/hooks/use-mobile.tsx           Mobile detection
src/hooks/use-toast.ts             Toast notifications
src/hooks/useJourneyContributions.ts  Journey contributions
src/hooks/useMyJourneys.ts         User journeys
src/hooks/useOffline.ts            Offline status
```

### Theme (1 file)
```
src/components/theme-provider.tsx  Theme provider (light/dark)
```

### SWOR Components (39 files in src/components/swor/)
```
ApprovedContributions.tsx     Approved contributions display
ApprovedItemsSection.tsx      Approved items section
ArchiveLightbox.tsx           Archive photo lightbox
ArchiveUploadSection.tsx      Archive upload interface
AuthEventsDashboard.tsx       Auth events monitoring
AuthModal.tsx                 Sign in/up modal
ClubCard.tsx                  Club card component
ClubsSection.tsx              Clubs grid section
CommendationForm.tsx          Commendation submission form
CommendationReviewDashboard.tsx  Review commendations
CommendationsList.tsx         Commendations display
ContentStateIndicator.tsx     Content state badges
ContributionPrompt.tsx        Contribution CTA
DomainVerificationPanel.tsx   Domain verification
ErrorDisplay.tsx              Error display
ExploreNextSection.tsx        Explore navigation
FilePreviewModal.tsx          File preview modal
Footer.tsx                    Site footer
GlobalSearchModal.tsx         Site-wide search
Header.tsx                    Navigation header
HeroSection.tsx               Hero banner
HomePage.tsx                  Landing page
InviteContributors.tsx        Contributor invitations
JoinSection.tsx               CTA join section
JourneyBuilder.tsx            Journey builder
JourneyCompare.tsx            Journey comparison
JourneyEditMode.tsx           Journey editing
JourneyIdentityHeader.tsx     Journey identity header
JourneySettings.tsx           Journey settings
JourneyShare.tsx              Journey sharing
LegendCard.tsx                Legend card
LegendsSection.tsx            Legends grid
MilestoneEditor.tsx           Milestone editing
MilestoneTimeline.tsx         Milestone timeline
MomentCard.tsx                Moment card
MomentsSection.tsx            Moments grid
OnboardingReassurance.tsx     Onboarding help
PersonCard.tsx                Person card
Phase3Builder.tsx             Phase 3 builder
PhotoCropModal.tsx            Photo crop tool
ProfileGuidance.tsx           Profile guidance
ProfileReviewDashboard.tsx    Profile review
ProfileSections.tsx           Profile display
RedwoodsSection.tsx           Redwoods section
SafeResetPanel.tsx            Safe reset controls
SectionGuidance.tsx           Section guidance
ShareMeta.tsx                 Social sharing meta
StewardContact.tsx            Steward contact
StewardDashboard.tsx          Steward dashboard
StewardProfilePanel.tsx       Steward profile panel
StewardQuickGuide.tsx         Steward quick guide
StewardResetGuidance.tsx      Reset guidance
UnstoppableSection.tsx        Unstoppable section
VideoPreviewModal.tsx         Video preview
VisibilitySelector.tsx        Visibility controls
WhatIsSWOR.tsx                About section
WhyItMatters.tsx              Value proposition
```

### SWOR Pages (32 files in src/components/swor/pages/)
```
BeyondRugbyPage.tsx           Beyond Rugby
ClubDetailPage.tsx            Club detail view
ClubsPage.tsx                 Clubs listing
ConductPage.tsx               Code of conduct
ContactPage.tsx               Contact page
ContributePage.tsx             Contribute/Join
EmailStatusPage.tsx           Email status dashboard
GoLiveChecklistPage.tsx       Go-live checklist
HarryRobertsPage.tsx          Harry Roberts journey
HelpGuidesPage.tsx            Help guides
HowItWorksPage.tsx            How It Works
IndividualProfileBuilder.tsx  Profile builder
JoinPage.tsx                  Join page
LegendDetailPage.tsx          Legend detail view
LegendsPage.tsx               Legends listing
MomentDetailPage.tsx          Moment detail view
MomentsPage.tsx               Moments listing
MyJourneysPage.tsx            My Journeys dashboard
OrganisationsPage.tsx         Organisations
PartnersPage.tsx              Partners
PeoplePage.tsx                People listing
PersonDetailPage.tsx          Person detail view
PrivacyPage.tsx               Privacy policy
RedwoodsPage.tsx              Redwoods page
RugbyJourneysPage.tsx         Rugby Journeys
SearchPage.tsx                Search results
SettingsPage.tsx              Account settings
StewardOpsHub.tsx             Steward operations hub
SueDorringtonPage.tsx         Sue Dorrington journey
TermsPage.tsx                 Terms of service
UnstoppablePage.tsx           Unstoppable page
VillagersPage.tsx             Villagers RFC journey
```

### UI Components (49 files in src/components/ui/)
```
accordion.tsx      alert-dialog.tsx   alert.tsx          aspect-ratio.tsx
avatar.tsx         badge.tsx          breadcrumb.tsx     button.tsx
calendar.tsx       card.tsx           carousel.tsx       chart.tsx
checkbox.tsx       collapsible.tsx    command.tsx        context-menu.tsx
dialog.tsx         drawer.tsx         dropdown-menu.tsx  form.tsx
hover-card.tsx     input-otp.tsx      input.tsx          label.tsx
menubar.tsx        navigation-menu.tsx  pagination.tsx   popover.tsx
progress.tsx       radio-group.tsx    resizable.tsx      scroll-area.tsx
select.tsx         separator.tsx      sheet.tsx          sidebar.tsx
skeleton.tsx       slider.tsx         sonner.tsx         switch.tsx
table.tsx          tabs.tsx           textarea.tsx       toast.tsx
toaster.tsx        toggle-group.tsx   toggle.tsx         tooltip.tsx
use-toast.ts
```

---

## Production Environment Variables

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `VITE_database_URL` | `https://lbweciluypxgmqcckfhu.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_database_ANON_KEY` | *(your anon key)* | Supabase → Settings → API → anon public key |

> **Note:** A fallback anon key is embedded in `src/lib/supabase.ts` for development. For production, always set the environment variable in Vercel.

---

## Build Verification

After getting the code locally, verify the build works:

```bash
npm install
npm run build
```

Expected output:
```
dist/
  index.html
  assets/
    index-[hash].js
    index-[hash].css
```

If the build succeeds, the code is ready for Vercel deployment.

---

## Troubleshooting

### "I can't find the export button in Famous.ai"
→ Contact Famous.ai support directly. The AI chat assistant cannot create downloads — only the platform UI can.

### "The build fails on Vercel"
→ Check that environment variables are set. Run `npm install && npm run build` locally first to reproduce.

### "404 on page refresh"
→ The `vercel.json` includes SPA rewrites. Verify it's in the repo root and contains: `{ "source": "/(.*)", "destination": "/index.html" }`

### "Supabase connection fails"
→ Verify `VITE_database_URL` and `VITE_database_ANON_KEY` are set in Vercel. Redeploy after changing env vars (Vite embeds them at build time).

### "DNS not resolving"
→ Wait 5-30 minutes (up to 48 hours). Check at [dnschecker.org](https://dnschecker.org/#A/swor.rugby). Remove conflicting DNS records.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│  SWOR Deployment Quick Reference                    │
├─────────────────────────────────────────────────────┤
│  Framework:    Vite + React + TypeScript             │
│  Build:        npm run build                         │
│  Output:       dist/                                 │
│  Node:         18+ (LTS recommended)                 │
│                                                      │
│  Vercel Settings:                                    │
│    Framework:  Vite                                  │
│    Build Cmd:  npm run build                         │
│    Output Dir: dist                                  │
│                                                      │
│  DNS Records:                                        │
│    A     @    → 76.76.21.21                          │
│    CNAME www  → cname.vercel-dns.com                 │
│                                                      │
│  Env Vars:                                           │
│    VITE_database_URL=https://lbweci...supabase.co    │
│    VITE_database_ANON_KEY=<your-anon-key>            │
└─────────────────────────────────────────────────────┘
```

---

*Last updated: 11 February 2026*
