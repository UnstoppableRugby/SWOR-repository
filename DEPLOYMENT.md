# SWOR Deployment Guide

## Deploying swor.rugby to Production via Vercel

This is the step-by-step runbook for deploying the SWOR application to Vercel and connecting the `swor.rugby` custom domain with SSL.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Prerequisites](#prerequisites)
3. [Step 1: Connect GitHub Repository to Vercel](#step-1-connect-github-repository-to-vercel)
4. [Step 2: Set Environment Variables](#step-2-set-environment-variables)
5. [Step 3: Deploy the Production Build](#step-3-deploy-the-production-build)
6. [Step 4: Add swor.rugby as Custom Domain](#step-4-add-sworrugby-as-custom-domain)
7. [Step 5: Configure DNS Records](#step-5-configure-dns-records)
8. [Step 6: Verify SSL and Site](#step-6-verify-ssl-and-site)
9. [Post-Deployment Checklist](#post-deployment-checklist)
10. [Alternative Platforms](#alternative-platforms)
11. [Troubleshooting](#troubleshooting)
12. [Continuous Deployment](#continuous-deployment)

---

## Quick Reference

| Item                  | Value                                |
|-----------------------|--------------------------------------|
| **Production URL**    | `https://swor.rugby`                 |
| **Platform**          | Vercel                               |
| **Framework**         | Vite + React + TypeScript            |
| **Build Command**     | `npm run build`                      |
| **Output Directory**  | `dist`                               |
| **DNS A Record**      | `@` → `76.76.21.21`                 |
| **DNS CNAME (www)**   | `www` → `cname.vercel-dns.com`       |
| **SSL**               | Automatic (Let's Encrypt via Vercel) |

---

## Prerequisites

Before starting, ensure you have:

- [ ] The SWOR GitHub repository URL
- [ ] A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
- [ ] Access to the **swor.rugby** domain registrar (DNS management)
- [ ] The Supabase project URL and anon key

### Verify the Build Locally

```bash
# Clone and install
git clone <your-swor-repo-url>
cd swor
npm install

# Create local env file
cp .env.example .env
# Edit .env with your actual values

# Build and preview
npm run build
npm run preview
# Open http://localhost:4173 to verify
```

The build output will be in the `dist/` directory. If this succeeds, the app is ready for deployment.

---

## Step 1: Connect GitHub Repository to Vercel

### 1.1 Sign in to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** and authorise Vercel

### 1.2 Import the Repository

1. From the Vercel dashboard, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find the SWOR repository and click **"Import"**
4. If you don't see it, click **"Adjust GitHub App Permissions"** to grant Vercel access

### 1.3 Verify Build Settings

Vercel auto-detects Vite. Confirm these settings on the import screen:

| Setting              | Value           |
|----------------------|-----------------|
| **Framework Preset** | Vite            |
| **Root Directory**   | `./` (default)  |
| **Build Command**    | `npm run build` |
| **Output Directory** | `dist`          |
| **Install Command**  | `npm install`   |

> **Note:** The `vercel.json` in the repository will be automatically picked up and applied.

---

## Step 2: Set Environment Variables

**Before clicking Deploy**, add the environment variables:

### 2.1 On the Import Screen

1. Expand the **"Environment Variables"** section
2. Add each variable:

| Key                        | Value                                                  | Environments        |
|----------------------------|--------------------------------------------------------|---------------------|
| `VITE_database_URL`       | `https://lbweciluypxgmqcckfhu.databasepad.com`        | Production, Preview |
| `VITE_database_ANON_KEY`  | *(your actual anon key from Supabase dashboard)*       | Production, Preview |

3. For each variable, ensure **Production** and **Preview** are both checked

### 2.2 After Deployment (if you missed it)

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add the variables as above
4. Click **Save**
5. **Redeploy**: Go to **Deployments** → click the three dots on the latest deployment → **"Redeploy"**

> **Important:** Vite embeds `VITE_*` variables at build time, so you must redeploy after changing them.

### 2.3 Finding Your Anon Key

If you need to find the anon key:
1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **anon (public)** key

> The anon key is safe to include in client-side code — it only grants public-level access enforced by Row Level Security (RLS). Never expose the `service_role` key.

---

## Step 3: Deploy the Production Build

### 3.1 Initial Deployment

1. After setting environment variables, click **"Deploy"**
2. Watch the build log — it should take 1-2 minutes
3. Look for `Build Completed` in the log output

### 3.2 Verify the Preview URL

1. Vercel will assign a URL like `swor-xxxxx.vercel.app`
2. Click the URL to open the site
3. Verify:
   - [ ] Homepage loads with the hero section
   - [ ] Navigation works (click through Legends, Clubs, Moments, etc.)
   - [ ] Refresh any page — it should load correctly (not 404)
   - [ ] Open browser DevTools → Console — no critical errors
   - [ ] Authentication works (try the Sign In flow)

If the preview looks good, proceed to add the custom domain.

---

## Step 4: Add swor.rugby as Custom Domain

### 4.1 Add the Apex Domain

1. In your Vercel project, go to **Settings** → **Domains**
2. In the domain input field, type: `swor.rugby`
3. Click **"Add"**
4. Vercel will show a configuration screen — it may suggest adding a `www` redirect

### 4.2 Add the www Subdomain

1. Still on the Domains page, type: `www.swor.rugby`
2. Click **"Add"**
3. When prompted, choose **"Redirect to swor.rugby"** (301 redirect)

### 4.3 Expected Domain Configuration

After adding both, your Domains page should show:

| Domain           | Type     | Status    |
|------------------|----------|-----------|
| `swor.rugby`     | Primary  | Pending   |
| `www.swor.rugby` | Redirect | Pending   |

Both will show as "Pending" until DNS is configured. That's normal.

---

## Step 5: Configure DNS Records

Now add the DNS records at your **domain registrar** (the company where `swor.rugby` was purchased).

### 5.1 Required DNS Records

Add these two records:

| Type    | Name / Host | Value                  | TTL  |
|---------|-------------|------------------------|------|
| **A**   | `@`         | `76.76.21.21`          | 3600 |
| **CNAME** | `www`    | `cname.vercel-dns.com` | 3600 |

> **Note:** Some registrars use `@` for the apex domain, others leave the Name field blank. Check your registrar's documentation.

### 5.2 Remove Conflicting Records

Before adding the new records, **delete any existing** A, AAAA, or CNAME records for `@` and `www` that point elsewhere. Conflicting records will prevent the domain from resolving correctly.

### 5.3 Where to Add DNS Records (by Registrar)

**Namecheap:**
1. Log in → Dashboard → Domain List
2. Click **"Manage"** next to `swor.rugby`
3. Go to **"Advanced DNS"** tab
4. Click **"Add New Record"** for each record above

**GoDaddy:**
1. Log in → My Products → DNS
2. Click **"Manage Zones"** → search for `swor.rugby`
3. Click **"Add Record"** for each record above

**Cloudflare (as registrar/DNS only):**
1. Log in → select `swor.rugby` zone
2. Go to **DNS** → **Records**
3. Click **"Add record"** for each record above
4. Set proxy status to **DNS only** (grey cloud) for the A record

**Porkbun:**
1. Log in → Domain Management
2. Click the DNS icon next to `swor.rugby`
3. Add each record

**101domain / Other registrars:**
1. Find the DNS management section for `swor.rugby`
2. Add the A and CNAME records as specified above

### 5.4 Wait for DNS Propagation

- Changes typically take **5-30 minutes** to propagate
- Can take up to **48 hours** in rare cases
- Check propagation status at: [dnschecker.org/#A/swor.rugby](https://dnschecker.org/#A/swor.rugby)

### 5.5 Verify in Vercel

1. Go back to Vercel → **Settings** → **Domains**
2. Both domains should eventually show a green checkmark
3. If they show "Invalid Configuration", double-check the DNS records

---

## Step 6: Verify SSL and Site

### 6.1 SSL Certificate

Vercel automatically provisions a free SSL certificate via Let's Encrypt once DNS propagates. This usually takes a few minutes after DNS resolves.

1. Go to Vercel → **Settings** → **Domains**
2. Each domain should show **"Valid Configuration"** with a green checkmark
3. The SSL certificate status should show as active

### 6.2 Verify the Live Site

Open each URL and verify:

| URL                         | Expected Behaviour                        |
|-----------------------------|-------------------------------------------|
| `https://swor.rugby`        | Homepage loads with SSL (padlock icon)    |
| `https://www.swor.rugby`    | Redirects to `https://swor.rugby`         |
| `http://swor.rugby`         | Redirects to `https://swor.rugby`         |
| `http://www.swor.rugby`     | Redirects to `https://swor.rugby`         |
| `https://swor.rugby/legends`| Legends page loads (SPA routing works)    |
| Refresh any page            | Page loads correctly (not 404)            |

### 6.3 SSL Verification Commands

From a terminal, you can verify SSL:

```bash
# Check the SSL certificate
curl -vI https://swor.rugby 2>&1 | grep -E "SSL|subject|issuer|expire"

# Check redirect from www
curl -I https://www.swor.rugby 2>&1 | grep -i location

# Check redirect from HTTP
curl -I http://swor.rugby 2>&1 | grep -i location

# Check DNS resolution
dig swor.rugby A +short
# Expected: 76.76.21.21

dig www.swor.rugby CNAME +short
# Expected: cname.vercel-dns.com.
```

---

## Post-Deployment Checklist

Run through this checklist after deployment:

### Core Functionality
- [ ] Homepage loads at `https://swor.rugby`
- [ ] All navigation links work (Legends, Clubs, Moments, People, etc.)
- [ ] SPA routing works — refresh any page and it loads correctly
- [ ] Authentication flow works (Sign In via magic link)
- [ ] Supabase data loads (legends, clubs, moments populate)
- [ ] Search functionality works

### Security & Performance
- [ ] SSL certificate is active (padlock icon in browser)
- [ ] `www.swor.rugby` redirects to `swor.rugby`
- [ ] HTTP redirects to HTTPS
- [ ] Security headers are present (check at [securityheaders.com](https://securityheaders.com/?q=swor.rugby))
- [ ] Run Lighthouse audit — aim for 90+ scores
- [ ] Service worker registers (DevTools → Application → Service Workers)

### SEO & Social
- [ ] `https://swor.rugby/robots.txt` is accessible
- [ ] `https://swor.rugby/sitemap.xml` is accessible
- [ ] Open Graph tags work — test at [opengraph.xyz](https://www.opengraph.xyz/)
- [ ] Share a link on social media — preview card appears correctly

### Mobile & Accessibility
- [ ] Site is responsive on mobile devices
- [ ] No horizontal scroll on mobile
- [ ] All interactive elements are keyboard-accessible

---

## Alternative Platforms

### Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) → Sign up with GitHub
2. Click **"Add new site"** → **"Import an existing project"**
3. Select the SWOR repository
4. Build settings: `npm run build` / `dist`
5. Add environment variables in **Site settings** → **Environment variables**
6. Deploy, then add `swor.rugby` under **Domain management**
7. DNS records for Netlify:

| Type  | Name | Value                        | TTL  |
|-------|------|------------------------------|------|
| A     | @    | `75.2.60.5`                  | 3600 |
| CNAME | www  | `your-site-name.netlify.app` | 3600 |

### Deploy to Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → Connect to Git
2. Select the SWOR repository
3. Build settings: `npm run build` / `dist`
4. Add environment variables in **Settings** → **Environment variables**
5. Deploy, then add `swor.rugby` under **Custom domains**
6. DNS records for Cloudflare Pages:

| Type  | Name | Value                        | TTL  |
|-------|------|------------------------------|------|
| CNAME | @    | `your-project.pages.dev`     | 3600 |
| CNAME | www  | `your-project.pages.dev`     | 3600 |

---

## Troubleshooting

### Build Fails on Vercel

```bash
# Reproduce locally first
rm -rf node_modules
npm install
npm run build
```

Common causes:
- **TypeScript errors**: Fix locally, push, Vercel will auto-redeploy
- **Missing dependencies**: Ensure all deps are in `package.json` (not just devDependencies for build-time packages)
- **Environment variables**: Ensure `VITE_database_URL` and `VITE_database_ANON_KEY` are set

### 404 on Page Refresh

The `vercel.json` includes SPA rewrites that should handle this. If you still get 404s:
1. Check that `vercel.json` is in the repository root
2. Verify the rewrite rule: `{ "source": "/(.*)", "destination": "/index.html" }`
3. Redeploy after any config changes

### DNS Not Resolving

1. Verify DNS records are correct at your registrar:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`
2. Remove any conflicting A, AAAA, or CNAME records
3. Wait up to 48 hours (usually 5-30 minutes)
4. Check at [dnschecker.org/#A/swor.rugby](https://dnschecker.org/#A/swor.rugby)

### SSL Certificate Not Provisioning

1. Ensure DNS is fully propagated first (both A and CNAME)
2. In Vercel: **Settings** → **Domains** — check certificate status
3. If stuck, try removing and re-adding the domain in Vercel
4. Certificate provisioning can take up to 24 hours after DNS propagates

### Supabase Connection Fails in Production

1. Verify environment variables are set in Vercel (Settings → Environment Variables)
2. Ensure both `VITE_database_URL` and `VITE_database_ANON_KEY` are present
3. **Redeploy** after adding/changing env vars (Vite embeds them at build time)
4. Check browser DevTools → Network tab for failed Supabase requests
5. Verify the Supabase project URL is correct and the project is active

### Service Worker Serves Stale Content

After a new deployment, users may see cached content:
1. Open DevTools → Application → Service Workers
2. Click **"Unregister"**
3. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

---

## Continuous Deployment

Once connected, Vercel automatically deploys:

| Trigger                  | Result                                    |
|--------------------------|-------------------------------------------|
| Push to `main` branch    | Production deployment to `swor.rugby`     |
| Open a Pull Request      | Preview deployment with unique URL        |
| Merge PR to `main`       | Production deployment to `swor.rugby`     |

### Preview Deployments

Every pull request gets its own preview URL (e.g., `swor-git-feature-xxx.vercel.app`). This lets you test changes before merging to production.

### Rollback

If a deployment breaks the site:
1. Go to Vercel → **Deployments**
2. Find the last working deployment
3. Click the three dots → **"Promote to Production"**

---

## Email DNS Records

If you also need email to work on the `swor.rugby` domain (e.g., for authentication magic links from `noreply@swor.rugby`), add these records at your registrar. The exact values are available in the **StewardOpsHub → Auth Events → Domain Verification Panel**:

| Type  | Name                          | Value                                    |
|-------|-------------------------------|------------------------------------------|
| TXT   | `@`                           | `v=spf1 include:_spf.google.com ~all`   |
| CNAME | `em1234._domainkey`           | *(provided by your email service)*       |
| TXT   | `_dmarc`                      | `v=DMARC1; p=quarantine; rua=mailto:...` |

---

## Architecture Notes

| File              | Purpose                                           |
|-------------------|---------------------------------------------------|
| `vercel.json`     | Vercel config: SPA rewrites, headers, caching, www redirect |
| `netlify.toml`    | Netlify config: build settings, redirects, headers |
| `public/_redirects` | Netlify SPA fallback                             |
| `public/_headers` | Netlify security headers                          |
| `public/robots.txt` | Search engine crawl directives                  |
| `public/sitemap.xml` | XML sitemap for SEO                            |
| `.env.example`    | Template for environment variables                |
| `src/lib/supabase.ts` | Reads `VITE_*` env vars with fallbacks        |

---

*Last updated: 8 February 2026*
