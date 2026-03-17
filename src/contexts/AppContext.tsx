import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

import { supabase, invokeEdgeFunction } from '@/lib/supabase';

import { toast } from '@/components/ui/use-toast';
import { 
  isGlobalSteward as checkIsGlobalSteward, 
  getGlobalSteward, 
  hasGlobalStewardPermission,
  GlobalSteward 
} from '@/data/sworData';
import {
  type Visibility,
  type Status,
  type SiteRole,
  type StewardPermission,
  GOVERNANCE_PRINCIPLES,
  getDefaultVisibility,
  getDefaultStatus,
  canRoleViewVisibility,
} from '@/config/governance';

// ═══════════════════════════════════════════════════════════════
// DEPLOYMENT MARKER v2.7 — 2026-03-08T19:09:00Z
// If this doesn't appear in the console, the build is stale.
// ═══════════════════════════════════════════════════════════════
console.log('[SWOR] === APP LOADED v2.7 === built 2026-03-08T19:09:00Z', new Date().toISOString());



// Re-export governance types for convenience
export type { Visibility, Status, SiteRole, StewardPermission };

// Legacy type alias for backwards compatibility
export type VisibilityLevel = Visibility;



// User profile with stewardship settings
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  user_type?: string;
  country?: string;
  club_affiliation?: string;
  bio?: string;
  primary_steward?: string;
  secondary_steward?: string;
  steward_permission?: StewardPermission;
  legacy_mode_enabled?: boolean;
  legacy_mode_updated_at?: string;
  // Site role for governance
  site_role?: SiteRole;
}

// Journey ownership
interface JourneyOwnership {
  journeyId: string;
  ownerId: string;
  isOwner: boolean;
  isSteward: boolean;
  isGlobalSteward: boolean;
  stewardPermission?: StewardPermission;
  legacyModeActive?: boolean;
  // Global steward specific permissions
  canAccessPhase3Builder?: boolean;
  canEditJourneys?: boolean;
  canReviewDrafts?: boolean;
  canReviewSuggestions?: boolean;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // User state
  user: any | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Global steward state
  isGlobalSteward: boolean;
  globalStewardInfo: GlobalSteward | undefined;
  
  // Journey ownership
  checkJourneyOwnership: (journeyId: string) => JourneyOwnership;
  
  // Visibility helpers
  canView: (visibility: VisibilityLevel, viewerId?: string) => boolean;
  
  // Auth actions
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDemoUser: (demoUser: any) => void;
}



const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isGlobalSteward: false,
  globalStewardInfo: undefined,
  checkJourneyOwnership: () => ({ 
    journeyId: '', 
    ownerId: '', 
    isOwner: false, 
    isSteward: false,
    isGlobalSteward: false,
  }),
  canView: () => true,
  signOut: async () => {},
  refreshProfile: async () => {},
  setDemoUser: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Flag: true while processAuthAtRoot is running — prevents onAuthStateChange from
  // racing against us and double-setting user state.
  const authProcessingRef = useRef(false);


  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Check if current user is a global steward
  const userEmail = user?.email;
  const isGlobalSteward = checkIsGlobalSteward(userEmail);
  const globalStewardInfo = getGlobalSteward(userEmail);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)

        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user?.id && !user?.isDemo) {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    }
  };

  // Set demo user (called from AuthModal via Header)
  const setDemoUser = useCallback((demoUser: any) => {
    if (demoUser) {
      console.log('[SWOR] Setting demo user in AppContext:', demoUser.email);
      setUser(demoUser);
      // Set a demo profile for the user
      setProfile({
        id: demoUser.id,
        email: demoUser.email,
        full_name: demoUser.user_metadata?.full_name || '',
        user_type: 'global_steward',
      });
    } else {
      console.log('[SWOR] Clearing demo user from AppContext');
      setUser(null);
      setProfile(null);
    }
  }, []);

  // Sign out — log event server-side (E1)
  const signOut = async () => {
    const sessionToken = localStorage.getItem('swor_session_token');
    const email = user?.email || null;

    // Clear all auth storage immediately
    localStorage.removeItem('swor_demo_user');
    localStorage.removeItem('swor_session_token');
    localStorage.removeItem('swor_auth_user');
    setUser(null);
    setProfile(null);

    // Fire-and-forget sign-out logging
    try {
      await supabase.functions.invoke('swor-auth', {
        body: { action: 'sign_out', session_token: sessionToken, email }
      });
    } catch (_) {
      // Non-critical — don't block sign-out
    }

    await supabase.auth.signOut();
  };



  // Check journey ownership - now includes global steward access
  const checkJourneyOwnership = useCallback((journeyId: string): JourneyOwnership => {
    const ownership: JourneyOwnership = {
      journeyId,
      ownerId: '',
      isOwner: false,
      isSteward: false,
      isGlobalSteward: false,
      canAccessPhase3Builder: false,
      canEditJourneys: false,
      canReviewDrafts: false,
      canReviewSuggestions: false,
    };

    if (!user) {
      return ownership;
    }

    // Check if user is a global steward
    const userIsGlobalSteward = checkIsGlobalSteward(user.email);
    
    if (userIsGlobalSteward) {
      // Global stewards have access to all journeys
      ownership.isGlobalSteward = true;
      ownership.isSteward = true; // Treat as steward for access purposes
      
      // Set specific permissions based on global steward config
      ownership.canAccessPhase3Builder = hasGlobalStewardPermission(user.email, 'phase3Builder');
      ownership.canEditJourneys = hasGlobalStewardPermission(user.email, 'editJourneys');
      ownership.canReviewDrafts = hasGlobalStewardPermission(user.email, 'reviewDrafts');
      ownership.canReviewSuggestions = hasGlobalStewardPermission(user.email, 'reviewSuggestions');
      
      // Global stewards with edit permission get 'edit' steward permission
      if (ownership.canEditJourneys) {
        ownership.stewardPermission = 'edit';
      } else if (ownership.canReviewDrafts || ownership.canReviewSuggestions) {
        ownership.stewardPermission = 'suggest';
      } else {
        ownership.stewardPermission = 'view';
      }
    }

    // Check if user is the owner or a journey-specific steward
    // This would be checked against a database in production
    // For demo purposes, we allow owners to be identified by email match
    
    return ownership;
  }, [user]);

  // Check if content can be viewed based on visibility
  // Updated to support new visibility enum (private_draft instead of draft)
  const canView = useCallback((visibility: VisibilityLevel, viewerId?: string): boolean => {
    // Global stewards can view all content including drafts
    if (isGlobalSteward) {
      return true;
    }
    
    switch (visibility) {
      case 'public':
        return true;
      case 'connections':
        // In production, check if viewer is in connections list
        return !!user;
      case 'family':
        // In production, check if viewer is in family/trusted circle
        return !!user && viewerId === user.id;
      case 'private_draft':
      case 'draft': // Legacy support
        // Only owner can see drafts (global stewards handled above)
        return !!user && viewerId === user.id;
      default:
        return true;
    }
  }, [user, isGlobalSteward]);



  // Check for demo user in localStorage
  const checkDemoUser = useCallback(() => {
    const demoUserStr = localStorage.getItem('swor_demo_user');
    if (demoUserStr) {
      try {
        const demoUser = JSON.parse(demoUserStr);
        console.log('[SWOR] Found demo user in localStorage:', demoUser.email);
        setUser(demoUser);
        // Set a demo profile
        setProfile({
          id: demoUser.id,
          email: demoUser.email,
          full_name: demoUser.user_metadata?.full_name || '',
          user_type: 'global_steward',
        });
        return true;
      } catch (err) {
        console.error('Error parsing demo user:', err);
        localStorage.removeItem('swor_demo_user');
      }
    }
    return false;
  }, []);

  // ─────────────────────────────────────────────────────────────
  // processAuthAtRoot()  — v2.5 rewrite
  // ─────────────────────────────────────────────────────────────
  // Reads auth parameters directly from window.location.search.
  // Called FIRST during init — before demo-user check, before
  // getSession(), before onAuthStateChange can interfere.
  // Returns true if auth params were found (regardless of success).
  //
  // ENTIRE body is wrapped in try/catch so a crash here can never
  // fail silently.
  // ─────────────────────────────────────────────────────────────
  async function processAuthAtRoot(): Promise<boolean> {
    try {
      console.log('[SWOR] processAuthAtRoot ENTERED');

      const params = new URLSearchParams(window.location.search);
      const token_hash = params.get('token_hash');
      const type = params.get('type');
      const code = params.get('code');
      const auth_token = params.get('auth_token');

      console.log('[SWOR] processAuthAtRoot — parsed params:', {
        code: code ? code.substring(0, 12) + '...' : null,
        token_hash: token_hash ? token_hash.substring(0, 12) + '...' : null,
        type,
        auth_token: auth_token ? auth_token.substring(0, 12) + '...' : null,
      });

      // Quick exit — no auth params in URL
      if (!code && !token_hash && !auth_token) {
        console.log('[SWOR] processAuthAtRoot — no auth params found, returning false');
        return false;
      }

      // Clear any stale demo user from localStorage so onAuthStateChange
      // won't short-circuit when it fires after verifyOtp succeeds.
      localStorage.removeItem('swor_demo_user');

      // ── PKCE code exchange ──
      if (code) {
        console.log('[SWOR] Found code param, exchanging for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[SWOR] exchangeCodeForSession FAILED:', error.message, error);
        } else {
          console.log('[SWOR] Code exchange success:', data.user?.email);
          if (data.session?.user) {
            setUser(data.session.user);
            const profileData = await fetchProfile(data.session.user.id);
            if (profileData) setProfile(profileData);
          }
        }
        window.history.replaceState({}, '', '/');
        return true;
      }

      // ── Token hash verification (magic link from email) ──
      if (token_hash && type) {
        console.log('[SWOR] Found token_hash, calling verifyOtp...');
        console.log('[SWOR] verifyOtp params:', { token_hash: token_hash.substring(0, 12) + '...', type });

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          console.error('[SWOR] verifyOtp FAILED:', error.message, error);
        } else {
          console.log('[SWOR] verifyOtp SUCCESS, user:', data.user?.email);
          const verifiedUser = data?.session?.user || data?.user;
          if (verifiedUser) {
            setUser(verifiedUser);
            const profileData = await fetchProfile(verifiedUser.id);
            if (profileData) setProfile(profileData);
            console.log('[SWOR] Auth complete — user set, URL cleaned, profile loaded.');
          }
        }
        window.history.replaceState({}, '', '/');
        return true;
      }

      // token_hash without type — try magiclink as default
      if (token_hash) {
        console.log('[SWOR] Found token_hash WITHOUT type param, defaulting to magiclink...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'magiclink',
        });
        if (error) {
          console.error('[SWOR] verifyOtp (default magiclink) FAILED:', error.message, error);
        } else {
          console.log('[SWOR] verifyOtp (default magiclink) SUCCESS, user:', data.user?.email);
          const verifiedUser = data?.session?.user || data?.user;
          if (verifiedUser) {
            setUser(verifiedUser);
            const profileData = await fetchProfile(verifiedUser.id);
            if (profileData) setProfile(profileData);
          }
        }
        window.history.replaceState({}, '', '/');
        return true;
      }

      // ── Custom auth_token (legacy swor-auth edge function) ──
      if (auth_token) {
        console.log('[SWOR] Found auth_token, verifying via edge function...');
        const { data, error: fnError } = await invokeEdgeFunction('swor-auth', {
          action: 'verify_token',
          token: auth_token,
        }, 15000);

        if (!fnError && data?.success && data.user) {
          console.log('[SWOR] Custom token verified for:', data.user.email);
          localStorage.setItem('swor_session_token', data.session_token);
          localStorage.setItem('swor_auth_user', JSON.stringify(data.user));
          const authUser = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: { full_name: data.user.full_name },
          };
          setUser(authUser);
          setProfile({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.full_name || '',
            user_type: data.user.user_type || 'fan',
            country: data.user.country,
            club_affiliation: data.user.club_affiliation,
            bio: data.user.bio,
          });
        } else {
          if (fnError?.message?.includes('timed out') || fnError?.message?.includes('Failed to invoke')) {
            console.warn('[SWOR] swor-auth unreachable, checking for existing Supabase session...');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('[SWOR] Found existing Supabase session for:', session.user.email);
              setUser(session.user);
              const profileData = await fetchProfile(session.user.id);
              if (profileData) setProfile(profileData);
            }
          } else {
            console.error('[SWOR] Custom token verification failed:', fnError?.message || data?.error);
          }
        }

        window.history.replaceState({}, '', '/');
        return true;
      }

      return false;
    } catch (e) {
      console.error('[SWOR] processAuthAtRoot CRASHED:', e);
      // Still try to clean the URL even on crash
      try { window.history.replaceState({}, '', '/'); } catch (_) {}
      return false;
    }
  }




  // ─────────────────────────────────────────────────────────────
  // Initialize auth state
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[SWOR] initAuth useEffect fired. URL:', window.location.href);

    const initAuth = async () => {
      setIsLoading(true);

      // ── Step 0: Log the full URL so we can debug in production ──
      console.log('[SWOR] initAuth starting. search:', window.location.search, 'hash:', window.location.hash);

      // ── Step 1: Process auth params FIRST ──
      // This MUST run before anything else — before demo user check,
      // before getSession(), before onAuthStateChange can interfere.
      authProcessingRef.current = true;
      console.log('[SWOR] initAuth calling processAuthAtRoot now...');
      try {
        const handledAuth = await processAuthAtRoot();
        console.log('[SWOR] processAuthAtRoot returned:', handledAuth);
        if (handledAuth) {
          console.log('[SWOR] processAuthAtRoot handled auth params. Done.');
          authProcessingRef.current = false;
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('[SWOR] processAuthAtRoot threw an unexpected error:', err);
      }
      authProcessingRef.current = false;


      // ── Step 2: PKCE / implicit flow cleanup (hash fragments) ──
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('[SWOR] Detected hash fragment, letting Supabase client process it...');
        await new Promise(resolve => setTimeout(resolve, 500));
        window.history.replaceState({}, '', window.location.pathname + window.location.search);
      }

      // ── Step 3: Check for existing custom session token ──
      const sessionToken = localStorage.getItem('swor_session_token');
      const storedUser = localStorage.getItem('swor_auth_user');
      if (sessionToken && storedUser) {
        try {
          const { data: sessionData, error: sessionError } = await invokeEdgeFunction('swor-auth', {
            action: 'validate_session', session_token: sessionToken
          }, 10000);

          if (!sessionError && sessionData?.success && sessionData.user) {
            const validatedUser = sessionData.user;
            const authUser = {
              id: validatedUser.id,
              email: validatedUser.email,
              user_metadata: { full_name: validatedUser.full_name },
            };
            setUser(authUser);
            setProfile({
              id: validatedUser.id,
              email: validatedUser.email,
              full_name: validatedUser.full_name || '',
              user_type: validatedUser.user_type || 'fan',
              country: validatedUser.country,
              club_affiliation: validatedUser.club_affiliation,
              bio: validatedUser.bio,
            });
            setIsLoading(false);
            return;
          } else {
            const reason = sessionData?.error || sessionError?.message || 'unknown';
            console.warn('[SWOR] Stored session invalid, clearing:', reason);
            localStorage.removeItem('swor_session_token');
            localStorage.removeItem('swor_auth_user');

            if (reason === 'session_expired') {
              toast({
                title: 'Session expired',
                description: 'Your session has expired. Please sign in again.',
                variant: 'destructive',
              });
            }
          }
        } catch (err) {
          console.error('[SWOR] Session validation request failed:', err);
          localStorage.removeItem('swor_session_token');
          localStorage.removeItem('swor_auth_user');
        }
      }

      // ── Step 4: Check for demo user in localStorage ──
      const hasDemoUser = checkDemoUser();

      if (!hasDemoUser) {
        // ── Step 5: Check for Supabase session (persisted from earlier login) ──
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('[SWOR] Found existing Supabase session for:', session.user.email);
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile(profileData);
          }

          if (checkIsGlobalSteward(session.user.email)) {
            console.log('[SWOR] Global steward signed in:', session.user.email);
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // ── Listen for auth changes from Supabase ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SWOR] onAuthStateChange:', event, session?.user?.email || 'no user');

        // If processAuthAtRoot is currently running, skip — it will set user itself.
        if (authProcessingRef.current) {
          console.log('[SWOR] onAuthStateChange skipped — processAuthAtRoot is running.');
          return;
        }

        // Don't override demo user with Supabase auth events
        const demoUserStr = localStorage.getItem('swor_demo_user');
        if (demoUserStr) {
          console.log('[SWOR] onAuthStateChange skipped — demo user active.');
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile(profileData);
          }

          if (event === 'SIGNED_IN') {
            localStorage.removeItem('swor_session_token');
            localStorage.removeItem('swor_auth_user');
          }

          if (checkIsGlobalSteward(session.user.email)) {
            console.log('[SWOR] Global steward signed in:', session.user.email);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    // Listen for storage events (for demo user changes across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'swor_demo_user') {
        if (e.newValue) {
          try {
            const demoUser = JSON.parse(e.newValue);
            setUser(demoUser);
            setProfile({
              id: demoUser.id,
              email: demoUser.email,
              full_name: demoUser.user_metadata?.full_name || '',
              user_type: 'global_steward',
            });
          } catch (err) {
            console.error('Error parsing demo user from storage event:', err);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkDemoUser]);



  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        isGlobalSteward,
        globalStewardInfo,
        checkJourneyOwnership,
        canView,
        signOut,
        refreshProfile,
        setDemoUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
