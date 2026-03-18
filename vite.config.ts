import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

/**
 * SPA Fallback Plugin
 * 
 * After Vite builds the app, this plugin copies the built `dist/index.html`
 * to key SPA route directories (e.g. `dist/auth/callback/index.html`).
 * 
 * WHY: Static file servers (Famous.ai, GitHub Pages, basic S3, etc.) don't
 * have rewrite rules. When a user navigates to `/auth/callback?code=xxx`,
 * the server looks for a physical file at that path. Without this plugin,
 * it returns 404 because no file exists there.
 * 
 * With this plugin, `dist/auth/callback/index.html` exists and contains
 * the full React app (with correct hashed asset references). The browser
 * loads it, React Router sees the URL is `/auth/callback`, and renders
 * the AuthCallback component.
 * 
 * This works on EVERY hosting platform — Vercel, Netlify, Cloudflare Pages,
 * GitHub Pages, Surge, S3, Famous.ai, or any basic static file server.
 */
function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback-routes',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.join(distDir, 'index.html');

      // Only run if dist/index.html exists (i.e., after a successful build)
      if (!fs.existsSync(indexPath)) {
        console.warn('[spa-fallback] dist/index.html not found, skipping SPA fallback generation');
        return;
      }

      const indexHtml = fs.readFileSync(indexPath, 'utf-8');

      // All SPA routes that need physical index.html files
      // Add any route here that users might navigate to directly (bookmarks, email links, etc.)
      const spaRoutes = [
        'auth/callback',
        'auth',
        // Add other deep-link routes as needed:
        // 'how-it-works',
        // 'join',
        // 'contact',
        // 'help',
        // 'legends',
        // 'moments',
        // 'clubs',
        // 'people',
        // 'settings',
        // 'search',
      ];

      let created = 0;
      for (const route of spaRoutes) {
        const routeDir = path.join(distDir, route);
        const routeIndex = path.join(routeDir, 'index.html');

        try {
          fs.mkdirSync(routeDir, { recursive: true });
          fs.writeFileSync(routeIndex, indexHtml);
          created++;
          console.log(`[spa-fallback] Created ${route}/index.html`);
        } catch (err) {
          console.error(`[spa-fallback] Failed to create ${route}/index.html:`, err);
        }
      }

      // Also create 200.html (used by Surge and some other platforms as SPA fallback)
      try {
        fs.writeFileSync(path.join(distDir, '200.html'), indexHtml);
        console.log('[spa-fallback] Created 200.html');
      } catch (err) {
        console.error('[spa-fallback] Failed to create 200.html:', err);
      }

      console.log(`[spa-fallback] Done — created ${created} route fallbacks + 200.html`);
    }
  };
}

// https://vitejs.dev/config/

// Build timestamp generated at build time — changes on every build,
// guaranteeing new Vite chunk hashes and busting all caches.
const BUILD_TIMESTAMP = new Date().toISOString();
const BUILD_DATE = BUILD_TIMESTAMP.slice(0, 10).replace(/-/g, '');
const BUILD_TIME = BUILD_TIMESTAMP.slice(11, 16).replace(':', '');
const BUILD_VERSION_FULL = `v2.7-${BUILD_DATE}-${BUILD_TIME}`;

export default defineConfig(({ mode }) => ({
  // Inject build timestamp into code — forces new JS hashes on every build
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(BUILD_TIMESTAMP),
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION_FULL),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    spaFallbackPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
