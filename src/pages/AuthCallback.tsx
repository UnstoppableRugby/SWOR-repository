import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, invokeEdgeFunction } from '@/lib/supabase';

type CallbackStatus = 'processing' | 'success' | 'error';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const tokenHash = url.searchParams.get('token_hash');
    const authToken = url.searchParams.get('auth_token');
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    window.history.replaceState({}, '', '/auth/callback');

    if (errorParam) {
      console.error('[AuthCallback] Supabase returned an error:', errorParam, errorDescription);
      setStatus('error');
      setErrorMessage(
        errorDescription || errorParam || 'Authentication failed. Please request a new sign-in link.'
      );
      return;
    }

    if (code) {
      console.log('[AuthCallback] PKCE code detected, exchanging for session...');
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('[AuthCallback] PKCE exchange failed:', error.message);
          setStatus('error');
          setErrorMessage(
            error.message.includes('expired')
              ? 'This sign-in link has expired. Please request a new one.'
              : error.message.includes('already')
              ? 'This sign-in link has already been used. Please request a new one.'
              : `Sign-in failed: ${error.message}`
          );
          return;
        }

        if (data?.session) {
          console.log('[AuthCallback] PKCE exchange successful, session established for:', data.session.user?.email);
          localStorage.removeItem('swor_demo_user');
          setStatus('success');
          setTimeout(() => navigate('/', { replace: true }), 300);
          return;
        }

        console.warn('[AuthCallback] PKCE exchange returned no session');
        setStatus('error');
        setErrorMessage('Sign-in completed but no session was created. Please try again.');
        return;
      } catch (err: any) {
        console.error('[AuthCallback] PKCE exchange exception:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during sign-in. Please try again.');
        return;
      }
    }

    if (tokenHash) {
      console.log('[AuthCallback] token_hash detected, verifying OTP...');
      const type = url.searchParams.get('type') as 'magiclink' | 'email' | undefined;
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type || 'magiclink',
        });

        if (error) {
          console.error('[AuthCallback] OTP verification failed:', error.message);
          setStatus('error');
          setErrorMessage(
            error.message.includes('expired')
              ? 'This sign-in link has expired. Please request a new one.'
              : `Sign-in failed: ${error.message}`
          );
          return;
        }

        if (data?.session) {
          console.log('[AuthCallback] OTP verification successful for:', data.session.user?.email);
          localStorage.removeItem('swor_demo_user');
          setStatus('success');
          setTimeout(() => navigate('/', { replace: true }), 300);
          return;
        }

        setStatus('error');
        setErrorMessage('Sign-in completed but no session was created. Please try again.');
        return;
      } catch (err: any) {
        console.error('[AuthCallback] OTP verification exception:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during sign-in. Please try again.');
        return;
      }
    }

    if (authToken) {
      console.log('[AuthCallback] Custom auth_token detected, verifying via edge function...');
      try {
        const { data, error: fnError } = await invokeEdgeFunction('swor-auth', {
          action: 'verify_token',
          token: authToken,
        }, 15000);

        if (fnError) {
          console.error('[AuthCallback] Edge function error:', fnError.message);

          if (fnError.message?.includes('timed out') || fnError.message?.includes('Failed to invoke')) {
            console.warn('[AuthCallback] swor-auth edge function unreachable, checking for existing Supabase session...');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('[AuthCallback] Found existing Supabase session for:', session.user.email);
              setStatus('success');
              setTimeout(() => navigate('/', { replace: true }), 300);
              return;
            }
          }

          setStatus('error');
          setErrorMessage('Unable to verify your sign-in link. The service may be temporarily unavailable. Please try again.');
          return;
        }

        if (data?.success && data.user) {
          console.log('[AuthCallback] Custom token verified for:', data.user.email);
          localStorage.setItem('swor_session_token', data.session_token);
          localStorage.setItem('swor_auth_user', JSON.stringify(data.user));
          localStorage.removeItem('swor_demo_user');
          setStatus('success');
          setTimeout(() => navigate('/', { replace: true }), 300);
          return;
        }

        const reason = data?.error || 'unknown';
        console.error('[AuthCallback] Token verification failed:', reason);
        setStatus('error');

        if (reason.includes('expired')) {
          setErrorMessage('This sign-in link has expired. Please request a new one.');
        } else if (reason.includes('used') || reason.includes('already')) {
          setErrorMessage('This sign-in link has already been used. Please request a new one if needed.');
        } else {
          setErrorMessage('This sign-in link is no longer valid. Please request a new one.');
        }
        return;
      } catch (err: any) {
        console.error('[AuthCallback] Custom token verification exception:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
        return;
      }
    }

    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log('[AuthCallback] Hash fragment detected (implicit flow), letting Supabase client handle it...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[AuthCallback] Implicit flow session established for:', session.user.email);
        localStorage.removeItem('swor_demo_user');
        window.location.hash = '';
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 300);
        return;
      }
    }

    console.warn('[AuthCallback] No auth parameters found in URL, redirecting to home');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log('[AuthCallback] Existing session found, redirecting to home');
      navigate('/', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center space-y-6 px-6 max-w-md">
          <div className="w-12 h-12 border-3 border-[#1A2332]/20 border-t-[#B8826D] rounded-full animate-spin mx-auto"
               style={{ borderWidth: '3px' }} />
          <div className="space-y-2">
            <h1 className="font-serif text-2xl text-[#1A2332]">Signing you in...</h1>
            <p className="text-sm text-[#1A2332]/60">
              Please wait while we complete your sign-in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center space-y-6 px-6 max-w-md">
          <div className="w-16 h-16 bg-[#8B9D83]/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[#8B9D83]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl text-[#1A2332]">Signed in successfully</h1>
            <p className="text-sm text-[#1A2332]/60">
              Redirecting you now...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
      <div className="text-center space-y-6 px-6 max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl text-[#1A2332]">Sign-in issue</h1>
          <p className="text-sm text-[#1A2332]/70 leading-relaxed">
            {errorMessage}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 transition-colors"
          >
            Go to Home Page
          </button>
          <p className="text-xs text-[#1A2332]/50">
            You can request a new sign-in link from the home page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
