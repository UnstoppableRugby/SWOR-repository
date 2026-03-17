import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, invokeEdgeFunction } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import {
  isGlobalSteward as checkIsGlobalSteward,
  getGlobalSteward,
  hasGlobalStewardPermission,
  GlobalSteward,
} from '@/data/sworData';
import {
  type Visibility,
  type Status,
  type SiteRole,
  type StewardPermission,
} from '@/config/governance';

console.log('[SWOR] === APP LOADED v3.0 ===', new Date().toISOString());

export type { Visibility, Status, SiteRole, StewardPermission };
export type VisibilityLevel = Visibility;

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
  site_role?: SiteRole;
}

interface JourneyOwnership {
  journeyId: string;
  ownerId: string;
  isOwner: boolean;
  isSteward: boolean;
  isGlobalSteward: boolean;
  stewardPermission?: StewardPermission;
  legacyModeActive?: boolean;
  canAccessPhase3Builder?: boolean;
  canEditJourneys?: boolean;
  canReviewDrafts?: boolean;
  canReviewSuggestions?: boolean;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: any | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGlobalSteward: boolean;
  globalStewardInfo: GlobalSteward | undefined;
  checkJourneyOwnership: (journeyId: string) => JourneyOwnership;
  canView: (visibility: VisibilityLevel, viewerId?: string) => boolean;
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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootingRef = useRef(false);
  // FIX 1: Prevents two concurrent calls to ensureProfile from racing each other
  const ensuringProfileRef = useRef(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const userEmail = user?.email;
  const isGlobalSteward = checkIsGlobalSteward(userEmail);
  const globalStewardInfo = getGlobalSteward(userEmail);

  const cleanAuthUrl = useCallback(() => {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }, []);

  const waitForConfirmedUser = useCallback(async (fallbackUser?: any | null) => {
    if (fallbackUser?.id) return fallbackUser;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return session.user;
      }
      await wait(250 * (attempt + 1));
    }

    return fallbackUser ?? null;
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[SWOR] Error fetching profile:', error);
        return null;
      }

      return (data as UserProfile | null) ?? null;
    } catch (err) {
      console.error('[SWOR] Error fetching profile:', err);
      return null;
    }
  }, []);

  // FIX 1: ensureProfile is now guarded against concurrent duplicate calls
  const ensureProfile = useCallback(async () => {
    if (ensuringProfileRef.current) {
      console.log('[SWOR] ensureprofile already in flight — skipping duplicate call');
      return true;
    }

    ensuringProfileRef.current = true;

    try {
      const { error } = await invokeEdgeFunction(
        'swor-auth',
        { action: 'ensureprofile' },
        10000
      );

      if (error) {
        console.warn('[SWOR] ensureprofile warning:', error.message || error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[SWOR] ensureprofile request failed:', err);
      return false;
    } finally {
      ensuringProfileRef.current = false;
    }
  }, []);

  const loadAuthedUser = useCallback(async (incomingUser?: any | null) => {
    const confirmedUser = await waitForConfirmedUser(incomingUser);

    if (!confirmedUser) {
      setUser(null);
      setProfile(null);
      return null;
    }

    localStorage.removeItem('swor_demo_user');
    setUser(confirmedUser);

    await ensureProfile();

    const profileData = await fetchProfile(confirmedUser.id);
    if (profileData) {
      setProfile(profileData);
    } else {
      setProfile(null);
    }

    return confirmedUser;
  }, [ensureProfile, fetchProfile, waitForConfirmedUser]);

  const refreshProfile = useCallback(async () => {
    const activeUser = await waitForConfirmedUser(user);
    if (activeUser?.id && !activeUser?.isDemo) {
      await ensureProfile();
      const profileData = await fetchProfile(activeUser.id);
      setProfile(profileData);
    }
  }, [ensureProfile, fetchProfile, user, waitForConfirmedUser]);

  const setDemoUser = useCallback((demoUser: any) => {
    if (demoUser) {
      console.log('[SWOR] Setting demo user in AppContext:', demoUser.email);
      localStorage.setItem('swor_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setProfile({
        id: demoUser.id,
        email: demoUser.email,
        full_name: demoUser.user_metadata?.full_name || '',
        user_type: 'global_steward',
      });
    } else {
      console.log('[SWOR] Clearing demo user from AppContext');
      localStorage.removeItem('swor_demo_user');
      setUser(null);
      setProfile(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    const sessionToken = localStorage.getItem('swor_session_token');
    const email = user?.email || null;

    localStorage.removeItem('swor_demo_user');
    localStorage.removeItem('swor_session_token');
    localStorage.removeItem('swor_auth_user');

    setUser(null);
    setProfile(null);

    try {
      await supabase.functions.invoke('swor-auth', {
        body: { action: 'sign_out', session_token: sessionToken, email },
      });
    } catch (_) {
      // Non-blocking
    }

    await supabase.auth.signOut();
  }, [user?.email]);

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

    if (!user) return ownership;

    const userIsGlobalSteward = checkIsGlobalSteward(user.email);

    if (userIsGlobalSteward) {
      ownership.isGlobalSteward = true;
      ownership.isSteward = true;
      ownership.canAccessPhase3Builder = hasGlobalStewardPermission(user.email, 'phase3Builder');
      ownership.canEditJourneys = hasGlobalStewardPermission(user.email, 'editJourneys');
      ownership.canReviewDrafts = hasGlobalStewardPermission(user.email, 'reviewDrafts');
      ownership.canReviewSuggestions = hasGlobalStewardPermission(user.email, 'reviewSuggestions');

      if (ownership.canEditJourneys) {
        ownership.stewardPermission = 'edit';
      } else if (ownership.canReviewDrafts || ownership.canReviewSuggestions) {
        ownership.stewardPermission = 'suggest';
      } else {
        ownership.stewardPermission = 'view';
      }
    }

    return ownership;
  }, [user]);

  const canView = useCallback((visibility: VisibilityLevel, viewerId?: string): boolean => {
    if (isGlobalSteward) return true;

    switch (visibility) {
      case 'public':
        return true;
      case 'connections':
        return !!user;
      case 'family':
        return !!user && viewerId === user.id;
      case 'private_draft':
      case 'draft':
        return !!user && viewerId === user.id;
      default:
        return true;
    }
  }, [user, isGlobalSteward]);

  const checkDemoUser = useCallback(() => {
    const demoUserStr = localStorage.getItem('swor_demo_user');

    if (!demoUserStr) return false;

    try {
      const demoUser = JSON.parse(demoUserStr);
      console.log('[SWOR] Found demo user in localStorage:', demoUser.email);
      setUser(demoUser);
      setProfile({
        id: demoUser.id,
        email: demoUser.email,
        full_name: demoUser.user_metadata?.full_name || '',
        user_type: 'global_steward',
      });
      return true;
    } catch (err) {
      console.error('[SWOR] Error parsing demo user:', err);
      localStorage.removeItem('swor_demo_user');
      return false;
    }
  }, []);

  const restoreCustomSession = useCallback(async () => {
    const sessionToken = localStorage.getItem('swor_session_token');
    const storedUser = localStorage.getItem('swor_auth_user');

    if (!sessionToken || !storedUser) return false;

    try {
      const { data, error } = await invokeEdgeFunction(
        'swor-auth',
        {
          action: 'validate_session',
          session_token: sessionToken,
        },
        10000
      );

      if (error || !data?.success || !data?.user) {
        const reason = data?.error || error?.message || 'unknown';
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

        return false;
      }

      const validatedUser = data.user;
      const authUser = {
        id: validatedUser.id,
        email: validatedUser.email,
        user_metadata: { full_name: validatedUser.full_name },
      };

      setUser(authUser);

      await ensureProfile();

      const profileData = await fetchProfile(authUser.id);
      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({
          id: validatedUser.id,
          email: validatedUser.email,
          full_name: validatedUser.full_name || '',
          user_type: validatedUser.user_type || 'fan',
          country: validatedUser.country,
          club_affiliation: validatedUser.club_affiliation,
          bio: validatedUser.bio,
        });
      }

      return true;
    } catch (err) {
      console.error('[SWOR] Session validation request failed:', err);
      localStorage.removeItem('swor_session_token');
      localStorage.removeItem('swor_auth_user');
      return false;
    }
  }, [ensureProfile, fetchProfile]);

  // FIX 2: Skip URL param processing when AuthCallback.tsx is already handling it
  const consumeAuthParams = useCallback(async () => {
    if (window.location.pathname === '/auth/callback') return false;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    const authToken = params.get('auth_token');
    const hasAccessTokenInHash = window.location.hash.includes('access_token');

    if (!code && !tokenHash && !authToken && !hasAccessTokenInHash) {
      return false;
    }

    localStorage.removeItem('swor_demo_user');

    try {
      if (code) {
        console.log('[SWOR] Exchanging code for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('[SWOR] exchangeCodeForSession FAILED:', error);
        } else {
          await loadAuthedUser(null);
        }

        cleanAuthUrl();
        return true;
      }

      if (tokenHash) {
        console.log('[SWOR] Verifying token_hash...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type as any) || 'magiclink',
        });

        if (error) {
          console.error('[SWOR] verifyOtp FAILED:', error);
        } else {
          await loadAuthedUser(data?.session?.user || data?.user || null);
        }

        cleanAuthUrl();
        return true;
      }

      if (authToken) {
        console.log('[SWOR] Verifying legacy auth_token...');
        const { data, error } = await invokeEdgeFunction(
          'swor-auth',
          {
            action: 'verify_token',
            token: authToken,
          },
          15000
        );

        if (!error && data?.success && data.user) {
          localStorage.setItem('swor_session_token', data.session_token);
          localStorage.setItem('swor_auth_user', JSON.stringify(data.user));

          const authUser = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: { full_name: data.user.full_name },
          };

          setUser(authUser);

          await ensureProfile();

          const profileData = await fetchProfile(authUser.id);
          if (profileData) {
            setProfile(profileData);
          } else {
            setProfile({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.full_name || '',
              user_type: data.user.user_type || 'fan',
              country: data.user.country,
              club_affiliation: data.user.club_affiliation,
              bio: data.user.bio,
            });
          }
        } else {
          console.error('[SWOR] Custom token verification failed:', error?.message || data?.error);
        }

        cleanAuthUrl();
        return true;
      }

      if (hasAccessTokenInHash) {
        console.log('[SWOR] Waiting for hash session to settle...');
        await wait(750);
        const confirmedUser = await waitForConfirmedUser(null);
        if (confirmedUser) {
          await loadAuthedUser(confirmedUser);
        }
        cleanAuthUrl();
        return true;
      }
    } catch (err) {
      console.error('[SWOR] consumeAuthParams failed:', err);
      cleanAuthUrl();
      return true;
    }

    return false;
  }, [cleanAuthUrl, ensureProfile, fetchProfile, loadAuthedUser, waitForConfirmedUser]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (bootingRef.current) return;

      bootingRef.current = true;
      setIsLoading(true);

      try {
        const handledUrlAuth = await consumeAuthParams();
        if (!mounted) return;

        if (handledUrlAuth) {
          setIsLoading(false);
          return;
        }

        const restoredCustom = await restoreCustomSession();
        if (!mounted) return;

        if (restoredCustom) {
          setIsLoading(false);
          return;
        }

        const hasDemoUser = checkDemoUser();
        if (!mounted) return;

        if (hasDemoUser) {
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          await loadAuthedUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[SWOR] initAuth failed:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
        bootingRef.current = false;
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[SWOR] onAuthStateChange:', event, session?.user?.email || 'no user');

      if (!mounted) return;

      if (localStorage.getItem('swor_demo_user')) {
        console.log('[SWOR] onAuthStateChange skipped — demo user active.');
        return;
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('swor_session_token');
        localStorage.removeItem('swor_auth_user');
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setIsLoading(true);

        try {
          const confirmedUser = await waitForConfirmedUser(session.user);
          if (!confirmedUser) return;

          await loadAuthedUser(confirmedUser);

          if (event === 'SIGNED_IN') {
            localStorage.removeItem('swor_session_token');
            localStorage.removeItem('swor_auth_user');
          }
        } catch (err) {
          console.error('[SWOR] onAuthStateChange bootstrap failed:', err);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== 'swor_demo_user') return;

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
          console.error('[SWOR] Error parsing demo user from storage event:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkDemoUser, consumeAuthParams, loadAuthedUser, restoreCustomSession, waitForConfirmedUser]);

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
