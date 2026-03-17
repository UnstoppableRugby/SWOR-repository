useEffect(() => {
  let mounted = true;
  let booting = false;

  const resetAuthState = () => {
    if (!mounted) return;
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  const loadSupabaseSession = async () => {
    if (booting || !mounted) return;
    booting = true;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[SWOR] getSession error:', error);
        resetAuthState();
        return;
      }

      if (!session?.access_token || !session?.user?.id) {
        if (mounted) setIsLoading(false);
        return;
      }

      if (!mounted) return;

      console.log('[SWOR] Found Supabase session for:', session.user.email);
      setUser(session.user);

      const profileData = await fetchProfile(session.user.id);
      if (mounted) {
        setProfile(profileData || null);
        setIsLoading(false);
      }

      if (checkIsGlobalSteward(session.user.email)) {
        console.log('[SWOR] Global steward signed in:', session.user.email);
      }
    } catch (err) {
      console.error('[SWOR] loadSupabaseSession failed:', err);
      resetAuthState();
    } finally {
      booting = false;
    }
  };

  const loadCustomSession = async () => {
    const sessionToken = localStorage.getItem('swor_session_token');
    const storedUser = localStorage.getItem('swor_auth_user');

    if (!sessionToken || !storedUser) return false;

    try {
      const { data: sessionData, error: sessionError } = await invokeEdgeFunction(
        'swor-auth',
        {
          action: 'validate_session',
          session_token: sessionToken,
        },
        10000
      );

      if (!sessionError && sessionData?.success && sessionData.user) {
        const validatedUser = sessionData.user;
        const authUser = {
          id: validatedUser.id,
          email: validatedUser.email,
          user_metadata: { full_name: validatedUser.full_name },
        };

        if (!mounted) return true;

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
        return true;
      }

      console.warn(
        '[SWOR] Stored custom session invalid, clearing:',
        sessionData?.error || sessionError?.message || 'unknown'
      );
      localStorage.removeItem('swor_session_token');
      localStorage.removeItem('swor_auth_user');
      return false;
    } catch (err) {
      console.error('[SWOR] Custom session validation failed:', err);
      localStorage.removeItem('swor_session_token');
      localStorage.removeItem('swor_auth_user');
      return false;
    }
  };

  const initAuth = async () => {
    if (mounted) setIsLoading(true);

    const hasDemoUser = checkDemoUser();
    if (hasDemoUser) {
      if (mounted) setIsLoading(false);
      return;
    }

    const loadedCustom = await loadCustomSession();
    if (loadedCustom) return;

    await loadSupabaseSession();
  };

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[SWOR] onAuthStateChange:', event, session?.user?.email || 'no user');

    const demoUserStr = localStorage.getItem('swor_demo_user');
    if (demoUserStr) {
      console.log('[SWOR] onAuthStateChange skipped — demo user active.');
      return;
    }

    if (booting) {
      console.log('[SWOR] onAuthStateChange skipped — bootstrap in progress.');
      return;
    }

    if (event === 'SIGNED_OUT') {
      resetAuthState();
      return;
    }

    if (
      (event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'INITIAL_SESSION' ||
        event === 'USER_UPDATED') &&
      session?.user
    ) {
      if (!mounted) return;

      setIsLoading(true);
      setUser(session.user);

      const profileData = await fetchProfile(session.user.id);
      if (mounted) {
        setProfile(profileData || null);
        setIsLoading(false);
      }

      if (event === 'SIGNED_IN') {
        localStorage.removeItem('swor_session_token');
        localStorage.removeItem('swor_auth_user');
      }

      if (checkIsGlobalSteward(session.user.email)) {
        console.log('[SWOR] Global steward signed in:', session.user.email);
      }
    }
  });

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'swor_demo_user') {
      if (e.newValue) {
        try {
          const demoUser = JSON.parse(e.newValue);
          if (!mounted) return;

          setUser(demoUser);
          setProfile({
            id: demoUser.id,
            email: demoUser.email,
            full_name: demoUser.user_metadata?.full_name || '',
            user_type: 'global_steward',
          });
          setIsLoading(false);
        } catch (err) {
          console.error('Error parsing demo user from storage event:', err);
        }
      } else {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  void initAuth();

  return () => {
    mounted = false;
    subscription.unsubscribe();
    window.removeEventListener('storage', handleStorageChange);
  };
}, [checkDemoUser]);
