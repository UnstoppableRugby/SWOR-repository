import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
        .eq('id', userId)
        .single();
      
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

  // Initialize auth state
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Check for magic link auth_token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const authToken = urlParams.get('auth_token');
      
      if (authToken) {
        // Clean URL immediately
        window.history.replaceState({}, '', window.location.pathname);
        
        try {
          const { data, error: fnError } = await supabase.functions.invoke('swor-auth', {
            body: { action: 'verify_token', token: authToken }
          });
          
          if (!fnError && data?.success && data.user) {
            // Store session
            localStorage.setItem('swor_session_token', data.session_token);
            localStorage.setItem('swor_auth_user', JSON.stringify(data.user));
            // Remove any demo user
            localStorage.removeItem('swor_demo_user');
            
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
            setIsLoading(false);
            return;
          } else {
            // Verification returned but failed — token may be expired, already used, or invalid
            const reason = data?.error || fnError?.message || 'unknown';
            console.error('[SWOR] Magic link verification failed:', reason);
            
            if (reason.toLowerCase().includes('expired')) {
              toast({
                title: 'Link expired',
                description: 'This link has expired. Please request a new one.',
                variant: 'destructive',
              });
            } else if (reason.toLowerCase().includes('already') || reason.toLowerCase().includes('used')) {
              toast({
                title: 'Link already used',
                description: 'This link has already been used. Please request a new one if you need to sign in again.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Sign-in link invalid',
                description: 'This sign-in link is no longer valid. Please request a new one.',
                variant: 'destructive',
              });
            }
          }
        } catch (err) {
          console.error('[SWOR] Magic link verification failed:', err);
          toast({
            title: 'Verification failed',
            description: 'We couldn\u2019t verify your sign-in link. Please check your connection and request a new one.',
            variant: 'destructive',
          });
        }

      }
      
      // Check for existing session token — validate server-side before trusting
      const sessionToken = localStorage.getItem('swor_session_token');
      const storedUser = localStorage.getItem('swor_auth_user');
      if (sessionToken && storedUser) {
        try {
          // Validate the session token against the server
          const { data: sessionData, error: sessionError } = await supabase.functions.invoke('swor-auth', {
            body: { action: 'validate_session', session_token: sessionToken }
          });

          if (!sessionError && sessionData?.success && sessionData.user) {
            // Session is still valid — use fresh profile data from server
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
            // Session validation failed — token expired, revoked, or invalid
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
            // For other failures (invalid_session, profile_not_found, etc.)
            // we silently clear and fall through — no toast needed since the
            // user didn't actively trigger this; they'll just see the signed-out state.
          }
        } catch (err) {
          // Network error or edge function unreachable — clear stored session
          // to avoid trusting an unverifiable token
          console.error('[SWOR] Session validation request failed:', err);
          localStorage.removeItem('swor_session_token');
          localStorage.removeItem('swor_auth_user');
        }
      }

      
      // Check for demo user in localStorage
      const hasDemoUser = checkDemoUser();
      
      if (!hasDemoUser) {
        // Get current Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
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



    // Listen for auth changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Don't override demo user with Supabase auth events
        const demoUserStr = localStorage.getItem('swor_demo_user');
        if (demoUserStr) {
          return; // Demo user takes precedence
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile(profileData);
          }
          
          // Log if user is a global steward
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
          // Demo user was removed
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
