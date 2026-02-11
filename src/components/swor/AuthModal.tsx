import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, User, Heart, LogOut, Settings, Mail, Loader2, Fingerprint, Link2, Shield, ChevronRight, Wrench, AlertTriangle, Globe, ExternalLink, RefreshCw, Info } from 'lucide-react';

import { isGlobalSteward, getGlobalSteward } from '@/data/sworData';

// Resend account owner email - can receive test-mode emails even without domain verification
const RESEND_ACCOUNT_OWNER_EMAIL = 'alun@unstoppablerugby.com';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange: (user: any) => void;
  initialView?: 'signin' | 'profile' | 'settings' | 'stewards';
  onNavigate?: (page: string) => void;
}

type AuthView = 'signin' | 'magic-link-sent' | 'profile' | 'favorites' | 'settings' | 'stewards' | 'legacy' | 'domain-setup';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthChange, initialView = 'signin', onNavigate }) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('fan');
  const [country, setCountry] = useState('');
  const [clubAffiliation, setClubAffiliation] = useState('');
  const [bio, setBio] = useState('');

  // Steward states
  const [primarySteward, setPrimarySteward] = useState('');
  const [secondarySteward, setSecondarySteward] = useState('');
  const [stewardPermission, setStewardPermission] = useState('suggest');
  const [legacyModeEnabled, setLegacyModeEnabled] = useState(false);
  const [legacyModeConfirmed, setLegacyModeConfirmed] = useState(false);

  // Domain setup issue state
  const [domainSetupErrorCode, setDomainSetupErrorCode] = useState<string>('');
  const [accountOwnerRetrying, setAccountOwnerRetrying] = useState(false);

  // Check if entered email is a global steward
  const enteredEmailIsGlobalSteward = isGlobalSteward(email);
  const globalStewardInfo = getGlobalSteward(email);

  // Check if entered email is the Resend account owner
  const isAccountOwnerEmail = email.trim().toLowerCase() === RESEND_ACCOUNT_OWNER_EMAIL.toLowerCase();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't override demo user with Supabase auth events
      const demoUserStr = localStorage.getItem('swor_demo_user');
      if (demoUserStr) {
        // Demo user takes precedence - don't process Supabase auth events
        return;
      }
      
      const currentUser = session?.user || null;
      setUser(currentUser);
      onAuthChange(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
        fetchFavorites(currentUser.id);
        setView('profile');
      } else {
        setView('signin');
        setProfile(null);
        setFavorites([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);


  // Set profile data for demo users (no database query)
  const setDemoUserProfile = (demoUser: any) => {
    setProfile({
      id: demoUser.id,
      full_name: demoUser.user_metadata?.full_name || '',
      user_type: 'global_steward',
      isDemo: true
    });
    setFullName(demoUser.user_metadata?.full_name || '');
    setUserType('global_steward');
    // Demo users don't have favorites in the database
    setFavorites([]);
  };

  const checkUser = async () => {
    // First check for demo user
    const demoUser = localStorage.getItem('swor_demo_user');
    if (demoUser) {
      const parsedUser = JSON.parse(demoUser);
      setUser(parsedUser);
      onAuthChange(parsedUser);
      // Set profile from demo user metadata (don't query database)
      setDemoUserProfile(parsedUser);
      setView('profile');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    onAuthChange(user);
    if (user) {
      fetchProfile(user.id);
      fetchFavorites(user.id);
      setView('profile');
    }
  };


  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setUserType(data.user_type || 'fan');
      setCountry(data.country || '');
      setClubAffiliation(data.club_affiliation || '');
      setBio(data.bio || '');
      setPrimarySteward(data.primary_steward || '');
      setSecondarySteward(data.secondary_steward || '');
      setStewardPermission(data.steward_permission || 'suggest');
      setLegacyModeEnabled(data.legacy_mode_enabled || false);
    }
  };

  const fetchFavorites = async (userId: string) => {
    const { data } = await supabase.from('favorites').select('*').eq('user_id', userId);
    setFavorites(data || []);
  };

  // Developer/Demo sign-in for global stewards (bypasses Supabase auth)
  const handleDemoSignIn = () => {
    if (!enteredEmailIsGlobalSteward || !globalStewardInfo) return;
    
    const demoUser = {
      id: `demo-${globalStewardInfo.email}`,
      email: globalStewardInfo.email,
      user_metadata: {
        full_name: globalStewardInfo.name,
      },
      isDemo: true,
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('swor_demo_user', JSON.stringify(demoUser));
    
    // Set local state
    setUser(demoUser);
    setDemoUserProfile(demoUser);
    
    // Notify parent component (Header) which will update AppContext
    onAuthChange(demoUser);
    
    setView('profile');
    setSuccess(`Signed in as ${globalStewardInfo.name} (Builder Access)`);
    
    // Close the modal after a brief delay so user sees the success message
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1500);
  };


  // Supabase built-in OTP fallback — uses Supabase's own email infrastructure
  const trySupabaseOtpFallback = async (targetEmail: string): Promise<boolean> => {
    try {
      console.log('[AuthModal] Trying Supabase built-in OTP fallback for:', targetEmail);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (otpError) {
        console.error('[AuthModal] Supabase OTP fallback failed:', otpError.message);
        return false;
      }
      console.log('[AuthModal] Supabase OTP fallback succeeded');
      return true;
    } catch (err) {
      console.error('[AuthModal] Supabase OTP fallback exception:', err);
      return false;
    }
  };

  // Auto-retry for account owner via Supabase OTP (their email works with Supabase's own sender)
  const handleAccountOwnerRetry = async () => {
    setAccountOwnerRetrying(true);
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('[AuthModal] Account owner auto-retry via Supabase OTP for:', normalizedEmail);
    const fallbackOk = await trySupabaseOtpFallback(normalizedEmail);
    
    if (fallbackOk) {
      setView('magic-link-sent');
      setDomainSetupErrorCode('');
    } else {
      setError('The retry did not succeed. Please use Builder Access below, or try again shortly.');
    }
    setAccountOwnerRetrying(false);
  };

  // Handle domain setup issue - show the domain-setup view
  const showDomainSetupIssue = (errorCode: string) => {
    setDomainSetupErrorCode(errorCode);
    setError(''); // Clear generic error
    setView('domain-setup');
  };

  // Navigate to StewardOpsHub Auth Events tab for domain verification
  const handleNavigateToVerifyDomain = () => {
    if (onNavigate) {
      onClose();
      onNavigate('stewards');
    }
  };

  // Switch to Builder Access flow from domain-setup view
  const handleSwitchToBuilderAccess = () => {
    setDomainSetupErrorCode('');
    setView('signin');
    // If the current email is a steward, they can use Builder Access directly
    // If not, show guidance about entering a steward email
    if (!enteredEmailIsGlobalSteward) {
      setError('');
      setSuccess('Enter a recognised steward email address above, then use the Builder Access button to sign in immediately.');
    }
  };

  // Passwordless sign-in with magic link (via custom edge function, with OTP fallback)
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDomainSetupErrorCode('');

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error: fnError } = await supabase.functions.invoke('swor-auth', {
        body: {
          action: 'send_magic_link',
          email: normalizedEmail,
          redirect_url: window.location.origin
        }
      });

      // Edge function v1.9+ always returns 200, so data should be populated
      // fnError only occurs on true network/invocation failures
      if (fnError) {
        console.error('[AuthModal] Edge function invocation error:', fnError);
        // Network error — try Supabase OTP fallback directly
        const fallbackOk = await trySupabaseOtpFallback(normalizedEmail);
        if (fallbackOk) {
          setView('magic-link-sent');
        } else {
          setError('Unable to reach the sign-in service. Please check your connection and try again.');
        }
      } else if (data && data.success) {
        // Custom magic link sent successfully
        setView('magic-link-sent');
      } else if (data && !data.success) {
        // Application-level error from edge function
        const errorCode = data.error || '';
        const detail = data.detail || '';

        if (errorCode === 'rate_limited') {
          setError('Too many sign-in requests. Please wait a few minutes and try again.');
        } else if (
          errorCode === 'domain_not_verified' ||
          errorCode === 'test_mode_restricted'
        ) {
          // Domain verification issue — specific handling
          console.log('[AuthModal] Domain issue (' + errorCode + '), checking account owner...');
          
          if (normalizedEmail === RESEND_ACCOUNT_OWNER_EMAIL.toLowerCase()) {
            // Account owner: auto-retry via Supabase OTP (their email should work)
            console.log('[AuthModal] Account owner detected, auto-retrying via Supabase OTP...');
            const fallbackOk = await trySupabaseOtpFallback(normalizedEmail);
            if (fallbackOk) {
              setView('magic-link-sent');
            } else {
              // Even OTP failed for account owner — show domain setup with retry option
              showDomainSetupIssue(errorCode);
            }
          } else {
            // Not account owner — try Supabase OTP first
            console.log('[AuthModal] Non-account-owner, trying Supabase OTP fallback...');
            const fallbackOk = await trySupabaseOtpFallback(normalizedEmail);
            if (fallbackOk) {
              setView('magic-link-sent');
            } else {
              // Both methods failed — show domain setup guidance
              showDomainSetupIssue(errorCode);
            }
          }
        } else if (
          errorCode === 'email_failed' ||
          errorCode === 'send_failed' ||
          errorCode === 'no_api_key'
        ) {
          // Other email delivery failures — try Supabase OTP then show domain setup
          console.log('[AuthModal] Email delivery failed (' + errorCode + '), trying Supabase OTP fallback...');
          const fallbackOk = await trySupabaseOtpFallback(normalizedEmail);
          if (fallbackOk) {
            setView('magic-link-sent');
          } else {
            showDomainSetupIssue(errorCode);
          }
        } else if (errorCode === 'validation_error') {
          setError(detail || 'Please check your email address and try again.');
        } else {
          setError(detail || 'Something went wrong. Please try again.');
        }
      } else {
        // Unexpected response shape — try fallback
        console.warn('[AuthModal] Unexpected response shape:', data);
        const fallbackOk = await trySupabaseOtpFallback(normalizedEmail);
        if (fallbackOk) {
          setView('magic-link-sent');
        } else {
          setError('Something unexpected happened. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('[AuthModal] Exception:', err);
      // Last resort — try Supabase OTP
      const fallbackOk = await trySupabaseOtpFallback(normalizedEmail);
      if (fallbackOk) {
        setView('magic-link-sent');
      } else {
        setError('Unable to send sign-in link. Please check your connection and try again.');
      }
    }

    setLoading(false);
  };





  // Passkey authentication (WebAuthn)
  const handlePasskeySignIn = async () => {
    setLoading(true);
    setError('');
    
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      setError('Passkeys are not supported on this device. Please use the secure link option.');
      setLoading(false);
      return;
    }

    try {
      // For now, show a message about passkey setup
      // In production, this would integrate with Supabase's WebAuthn support
      setSuccess('Passkey authentication will be available once you have signed in and set up a passkey in your settings.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Passkey authentication failed');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo users can't update profile in database
    if (user?.isDemo) {
      setSuccess('Profile preview updated (demo mode - changes not saved to database).');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }
    
    setLoading(true);
    setError('');

    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      user_type: userType,
      country,
      club_affiliation: clubAffiliation,
      bio,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(false);
  };

  const handleUpdateStewards = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo users can't update steward settings in database
    if (user?.isDemo) {
      setSuccess('Steward settings preview (demo mode - changes not saved to database).');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }
    
    setLoading(true);
    setError('');

    const { error } = await supabase.from('profiles').update({
      primary_steward: primarySteward,
      secondary_steward: secondarySteward,
      steward_permission: stewardPermission,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Steward settings saved.');
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(false);
  };

  const handleUpdateLegacyMode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legacyModeConfirmed && legacyModeEnabled) {
      setError('Please confirm you understand Legacy Mode before enabling.');
      return;
    }
    
    // Demo users can't update legacy mode in database
    if (user?.isDemo) {
      setSuccess('Legacy Mode settings preview (demo mode - changes not saved to database).');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }
    
    setLoading(true);
    setError('');

    const { error } = await supabase.from('profiles').update({
      legacy_mode_enabled: legacyModeEnabled,
      legacy_mode_updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Legacy Mode settings saved.');
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(false);
  };


  const handleLogout = async () => {
    // Clear demo user from localStorage
    localStorage.removeItem('swor_demo_user');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setView('signin');
    // Notify parent to clear AppContext user state
    onAuthChange(null);
    onClose();
  };



  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    setFavorites(favorites.filter(f => f.id !== favoriteId));
  };

  if (!isOpen) return null;

  const getViewTitle = () => {
    switch (view) {
      case 'signin': return 'Sign In';
      case 'magic-link-sent': return 'Check Your Email';
      case 'profile': return 'Your Profile';
      case 'favorites': return 'Your Collection';
      case 'settings': return 'Settings';
      case 'stewards': return 'Stewards & Continuity';
      case 'legacy': return 'Legacy Mode';
      case 'domain-setup': return 'Email Domain Setup';
      default: return 'Account';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#F5F1E8] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A2332]/10">
          <div className="flex items-center space-x-3">
            {(view === 'stewards' || view === 'legacy' || view === 'settings') && (
              <button 
                onClick={() => setView('profile')}
                className="text-[#1A2332]/60 hover:text-[#1A2332]"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            {view === 'domain-setup' && (
              <button 
                onClick={() => {
                  setView('signin');
                  setDomainSetupErrorCode('');
                }}
                className="text-[#1A2332]/60 hover:text-[#1A2332]"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <h2 className="font-serif text-xl text-[#1A2332]">{getViewTitle()}</h2>
          </div>
          <button onClick={onClose} className="text-[#1A2332]/60 hover:text-[#1A2332]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">{success}</div>
          )}

          {/* Sign In View - Passwordless */}
          {view === 'signin' && (
            <div className="space-y-6">
              {/* Calm explanation */}
              <div className="bg-[#1A2332]/5 rounded-lg p-4">
                <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                  No passwords. We send a secure one-time link to sign in. You can also use a passkey if you prefer.
                </p>
              </div>

              <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A2332]/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                {/* Builder Access Button - Only shows for global steward emails */}
                {enteredEmailIsGlobalSteward && globalStewardInfo && (
                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    className="w-full py-3 bg-[#1A2332] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#1A2332]/90 flex items-center justify-center space-x-2"
                  >
                    <Wrench className="w-5 h-5" />
                    <span>Builder Access ({globalStewardInfo.name})</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Link2 className="w-5 h-5" />
                      <span>Send Secure Link</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1A2332]/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-[#F5F1E8] text-[#1A2332]/50">or</span>
                </div>
              </div>

              <button
                onClick={handlePasskeySignIn}
                disabled={loading}
                className="w-full py-3 border border-[#1A2332]/20 text-[#1A2332] font-medium rounded-lg hover:bg-[#1A2332]/5 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Fingerprint className="w-5 h-5" />
                <span>Use Passkey</span>
              </button>

              <p className="text-xs text-[#1A2332]/50 text-center leading-relaxed">
                Passkeys use your device's security (FaceID, fingerprint, or PIN) instead of passwords.
              </p>
            </div>
          )}


          {/* Domain Setup Issue View */}
          {view === 'domain-setup' && (
            <div className="space-y-5">
              {/* Step-by-step explanation */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Globe className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-amber-900">
                      The swor.rugby email domain is being set up
                    </h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Sign-in emails from <strong>swor.rugby</strong> require DNS records to be configured with the domain registrar. This is a one-time setup.
                    </p>
                  </div>
                </div>
              </div>

              {/* What's happening - step by step */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[#1A2332]/80">What's happening</h4>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-[#8B9D83]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#8B9D83]">1</span>
                    </div>
                    <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                      The swor.rugby domain has been registered with our email service (Resend).
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-600">2</span>
                    </div>
                    <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                      <strong>DNS records</strong> (SPF, DKIM, DMARC) need to be added to the swor.rugby domain to verify ownership and enable email delivery.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-[#1A2332]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#1A2332]/50">3</span>
                    </div>
                    <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                      Once verified, sign-in links will be delivered to all email addresses.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account owner auto-retry section */}
              {isAccountOwnerEmail && (
                <div className="bg-[#8B9D83]/10 border border-[#8B9D83]/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-[#8B9D83] mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#1A2332]">
                        Resend account owner detected
                      </h4>
                      <p className="text-sm text-[#1A2332]/70 mt-1 leading-relaxed">
                        As the Resend account owner, we can try sending your sign-in link via an alternative route.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAccountOwnerRetry}
                    disabled={accountOwnerRetrying}
                    className="w-full py-2.5 bg-[#8B9D83] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#8B9D83]/90 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                  >
                    {accountOwnerRetrying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry Sign-in Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Prominent Builder Access button */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1A2332]/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-[#F5F1E8] text-[#1A2332]/50">meanwhile</span>
                  </div>
                </div>

                {enteredEmailIsGlobalSteward && globalStewardInfo ? (
                  /* Steward email entered - direct Builder Access */
                  <button
                    onClick={handleDemoSignIn}
                    className="w-full py-3 bg-[#1A2332] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#1A2332]/90 flex items-center justify-center space-x-2"
                  >
                    <Wrench className="w-5 h-5" />
                    <span>Use Builder Access ({globalStewardInfo.name})</span>
                  </button>
                ) : (
                  /* Non-steward email - offer to switch to Builder Access flow */
                  <button
                    onClick={handleSwitchToBuilderAccess}
                    className="w-full py-3 bg-[#1A2332] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#1A2332]/90 flex items-center justify-center space-x-2"
                  >
                    <Wrench className="w-5 h-5" />
                    <span>Use Builder Access</span>
                  </button>
                )}

                <p className="text-xs text-[#1A2332]/50 text-center leading-relaxed">
                  Builder Access lets recognised stewards sign in immediately while email delivery is being configured.
                </p>
              </div>

              {/* Steward? Verify domain link */}
              {onNavigate && (
                <div className="pt-2 border-t border-[#1A2332]/10">
                  <button
                    onClick={handleNavigateToVerifyDomain}
                    className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-[#B8826D] hover:text-[#B8826D]/80 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Steward? Verify domain in Ops Hub</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-[#1A2332]/40 text-center mt-1">
                    Opens the Steward Operations Hub where you can check DNS records and trigger domain verification.
                  </p>
                </div>
              )}

              {/* Back to sign in */}
              <button
                onClick={() => {
                  setView('signin');
                  setDomainSetupErrorCode('');
                }}
                className="w-full text-sm text-[#1A2332]/60 hover:text-[#1A2332] font-medium py-2"
              >
                Back to sign in
              </button>
            </div>
          )}


          {/* Magic Link Sent View */}
          {view === 'magic-link-sent' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-[#8B9D83]/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-[#8B9D83]" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg text-[#1A2332]">Check your email</h3>
                <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                  We've sent a secure sign-in link to <strong>{email}</strong>
                </p>
              </div>
              <div className="bg-[#1A2332]/5 rounded-lg p-4">
                <p className="text-sm text-[#1A2332]/60 leading-relaxed">
                  The link expires shortly for your security. Click it to sign in - no password needed.

                </p>
              </div>
              <button
                onClick={() => setView('signin')}
                className="text-sm text-[#B8826D] font-medium hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}

          {/* Profile View */}
          {view === 'profile' && user && (
            <div className="space-y-6">
              {/* Profile Tabs */}
              <div className="flex space-x-2 border-b border-[#1A2332]/10 pb-4">
                <button
                  onClick={() => setView('profile')}
                  className="px-4 py-2 bg-[#B8826D] text-[#F5F1E8] rounded-lg text-sm font-medium"
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setView('favorites')}
                  className="px-4 py-2 bg-[#1A2332]/10 text-[#1A2332] rounded-lg text-sm font-medium hover:bg-[#1A2332]/20"
                >
                  <Heart className="w-4 h-4 inline mr-2" />
                  Favorites
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Account Type</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                  >
                    <option value="fan">Fan</option>
                    <option value="legend">Legend</option>
                    <option value="club">Club Representative</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="media">Media</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Club Affiliation</label>
                  <input
                    type="text"
                    value={clubAffiliation}
                    onChange={(e) => setClubAffiliation(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                    placeholder="Your rugby club"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] resize-none"
                    placeholder="Tell us about your rugby journey..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#8B9D83] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#8B9D83]/90 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </button>
              </form>

              {/* Settings Links */}
              <div className="border-t border-[#1A2332]/10 pt-4 space-y-2">
                <button
                  onClick={() => setView('stewards')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#1A2332]/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-[#1A2332]/60" />
                    <span className="text-sm font-medium text-[#1A2332]">Stewards & Continuity</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1A2332]/40" />
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3 border border-[#1A2332]/20 text-[#1A2332] font-medium rounded-lg hover:bg-[#1A2332]/5 flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}

          {/* Favorites View */}
          {view === 'favorites' && user && (
            <div className="space-y-6">
              {/* Profile Tabs */}
              <div className="flex space-x-2 border-b border-[#1A2332]/10 pb-4">
                <button
                  onClick={() => setView('profile')}
                  className="px-4 py-2 bg-[#1A2332]/10 text-[#1A2332] rounded-lg text-sm font-medium hover:bg-[#1A2332]/20"
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setView('favorites')}
                  className="px-4 py-2 bg-[#B8826D] text-[#F5F1E8] rounded-lg text-sm font-medium"
                >
                  <Heart className="w-4 h-4 inline mr-2" />
                  Favorites
                </button>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                  <p className="text-[#1A2332]/60">No favorites yet</p>
                  <p className="text-sm text-[#1A2332]/40 mt-2">
                    Save legends and clubs to your collection by clicking the heart icon.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg"
                    >
                      <div>
                        <span className="text-xs text-[#B8826D] uppercase font-medium">{fav.item_type}</span>
                        <p className="text-[#1A2332] font-medium">{fav.item_id}</p>
                      </div>
                      <button
                        onClick={() => removeFavorite(fav.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-3 border border-[#1A2332]/20 text-[#1A2332] font-medium rounded-lg hover:bg-[#1A2332]/5 flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}

          {/* Stewards & Continuity View */}
          {view === 'stewards' && user && (
            <div className="space-y-6">
              {/* Explanation */}
              <div className="bg-[#1A2332]/5 rounded-lg p-4">
                <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                  Nominate trusted people who can care for this journey if something happens to you.
                </p>
              </div>

              <form onSubmit={handleUpdateStewards} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Primary Steward</label>
                  <input
                    type="email"
                    value={primarySteward}
                    onChange={(e) => setPrimarySteward(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                    placeholder="Email of your primary steward"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Secondary Steward (optional)</label>
                  <input
                    type="email"
                    value={secondarySteward}
                    onChange={(e) => setSecondarySteward(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                    placeholder="Email of your secondary steward"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">Steward Permissions</label>
                  <select
                    value={stewardPermission}
                    onChange={(e) => setStewardPermission(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D]"
                  >
                    <option value="view">View only</option>
                    <option value="suggest">Suggest edits (recommended)</option>
                    <option value="edit">Edit & publish (Legacy Mode only)</option>
                  </select>
                  <p className="text-xs text-[#1A2332]/50 mt-2">
                    Stewards can help organise and add context. Publishing changes requires Legacy Mode.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#8B9D83] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#8B9D83]/90 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Steward Settings'}
                </button>
              </form>

              {/* Legacy Mode Link */}
              <div className="border-t border-[#1A2332]/10 pt-4">
                <button
                  onClick={() => setView('legacy')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#1A2332]/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-[#1A2332]/60" />
                    <span className="text-sm font-medium text-[#1A2332]">Legacy Mode Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1A2332]/40" />
                </button>
              </div>
            </div>
          )}

          {/* Legacy Mode View */}
          {view === 'legacy' && user && (
            <div className="space-y-6">
              {/* Calm explanation */}
              <div className="bg-[#1A2332]/5 rounded-lg p-4">
                <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                  Legacy Mode ensures continuity if you're unable to manage this journey in future.
                </p>
              </div>

              <form onSubmit={handleUpdateLegacyMode} className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={legacyModeEnabled}
                      onChange={(e) => setLegacyModeEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-[#1A2332]/30 text-[#B8826D] focus:ring-[#B8826D]"
                    />
                    <div>
                      <span className="text-sm font-medium text-[#1A2332]">Enable Legacy Mode</span>
                      <p className="text-xs text-[#1A2332]/50 mt-1">
                        If I'm no longer able to manage this, allow my Primary Steward to take over.
                      </p>
                    </div>
                  </label>
                </div>

                {legacyModeEnabled && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-amber-800">
                      When Legacy Mode is activated by your steward:
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
                      <li>You will be notified by email</li>
                      <li>A 14-day cool-down period applies</li>
                      <li>If you respond, activation is cancelled</li>
                      <li>If no response, steward access escalates</li>
                    </ul>
                    <label className="flex items-start space-x-3 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={legacyModeConfirmed}
                        onChange={(e) => setLegacyModeConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs text-amber-800">
                        I understand how Legacy Mode works
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (legacyModeEnabled && !legacyModeConfirmed)}
                  className="w-full py-3 bg-[#8B9D83] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#8B9D83]/90 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Legacy Mode Settings'}
                </button>
              </form>

              <p className="text-xs text-[#1A2332]/50 text-center">
                You can change this setting at any time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
