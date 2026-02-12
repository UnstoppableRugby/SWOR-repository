import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Shield, Globe, Mail, Loader2, RefreshCw,
  AlertCircle, CheckCircle, XCircle, ExternalLink, Copy, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface EmailStatusPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

interface HealthData {
  loading: boolean;
  error: string | null;
  resendConfigured: boolean | null;
  time: string | null;
}

const EmailStatusPage: React.FC<EmailStatusPageProps> = ({ onBack, onNavigate }) => {
  const { user, isGlobalSteward } = useAppContext();
  const [health, setHealth] = useState<HealthData>({
    loading: false,
    error: null,
    resendConfigured: null,
    time: null,
  });

  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedDns, setCopiedDns] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.functions.invoke('swor-health-check', {
        body: { action: 'go_live' },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error('Health check unsuccessful');

      setHealth({
        loading: false,
        error: null,
        resendConfigured: data.env?.resendConfigured ?? null,
        time: data.time,
      });
    } catch (err: any) {
      setHealth(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to check email status',
      }));
    }
  }, []);

  useEffect(() => {
    if (user && isGlobalSteward) {
      fetchHealth();
    }
  }, [user, isGlobalSteward, fetchHealth]);

  const handleSendTest = async () => {
    if (!user?.email) return;
    setSendingTest(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('swor-notifications', {
        body: {
          action: 'send_test_email',
          payload: {
            to_email: user.email,
            actor_user_id: user.id || null,
            actor_email: user.email,
          },
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to send test email');

      setTestResult({
        success: true,
        message: 'Sent. Please check your inbox.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Could not send test email. Please check the Resend configuration.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleCopyDns = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDns(id);
      setTimeout(() => setCopiedDns(null), 2000);
    });
  };

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4 pt-20 md:pt-24">
        <div className="max-w-md w-full bg-white rounded-xl p-8 text-center border border-[#1A2332]/10">
          <div className="w-16 h-16 bg-[#1A2332]/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#1A2332]/40" />
          </div>
          <h1 className="font-serif text-xl text-[#1A2332] mb-2">Not Available</h1>
          <p className="text-[#1A2332]/60 mb-6 leading-relaxed">
            This page is only available to authenticated stewards.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-[#1A2332] text-white rounded-lg hover:bg-[#1A2332]/90 transition-colors min-h-[44px]"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isGlobalSteward) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4 pt-20 md:pt-24">
        <div className="max-w-md w-full bg-white rounded-xl p-8 text-center border border-[#1A2332]/10">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="font-serif text-xl text-[#1A2332] mb-2">Not Available</h1>
          <p className="text-[#1A2332]/60 mb-6 leading-relaxed">
            This page is restricted to SWOR stewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-[#1A2332] text-white rounded-lg hover:bg-[#1A2332]/90 transition-colors min-h-[44px]"
            >
              Return Home
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#F5F1E8] transition-colors min-h-[44px]"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 md:pt-24">
      {/* Header */}
      <div className="bg-white border-b border-[#1A2332]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] transition-colors mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#1A2332]">Email Status</h1>
              <p className="text-[#1A2332]/60 mt-1 text-sm sm:text-base leading-relaxed">
                Resend email configuration and domain verification status.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Section 1: Email System Status */}
        <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#1A2332]/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-teal-600" />
              <h2 className="font-serif text-lg text-[#1A2332]">Email System Status</h2>
            </div>
            <button
              onClick={fetchHealth}
              disabled={health.loading}
              className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[44px] px-2"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${health.loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {health.loading && health.resendConfigured === null && (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 text-teal-600 mx-auto animate-spin" />
                <p className="text-sm text-[#1A2332]/50 mt-3">Checking email configuration...</p>
              </div>
            )}

            {health.error && !health.loading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Could not check email status</p>
                  <p className="text-xs text-red-600 mt-1">{health.error}</p>
                </div>
              </div>
            )}

            {health.resendConfigured !== null && (
              <>
                <div className="flex items-center justify-between py-3 px-4 bg-[#F5F1E8] rounded-lg">
                  <span className="text-sm text-[#1A2332]">RESEND_API_KEY</span>
                  {health.resendConfigured ? (
                    <span className="inline-flex items-center text-xs font-medium text-[#8B9D83] bg-[#8B9D83]/10 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Missing
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-[#F5F1E8] rounded-lg">
                  <span className="text-sm text-[#1A2332]">Email mode</span>
                  <span className="text-xs text-[#1A2332]/60">
                    {health.resendConfigured
                      ? 'Configured (verify domain for production sending)'
                      : 'Not configured'}
                  </span>
                </div>

                {health.time && (
                  <p className="text-xs text-[#1A2332]/40">
                    Last checked: {new Date(health.time).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Section 2: Domain Verification Guidance */}
        <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#1A2332]/10">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-[#B8826D]" />
              <h2 className="font-serif text-lg text-[#1A2332]">Domain Verification Guide</h2>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm text-[#1A2332]/70 leading-relaxed mb-6">
              To send emails from your own domain (e.g. hello@smallworldofrugby.com), you need to verify the domain in Resend and add DNS records to your domain provider.

            </p>

            <ol className="space-y-6">
              <li className="flex items-start space-x-4">
                <span className="w-7 h-7 bg-[#B8826D]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#B8826D] flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium text-[#1A2332]">Log in to Resend</p>
                  <p className="text-sm text-[#1A2332]/60 mt-1 leading-relaxed">
                    Go to{' '}
                    <a
                      href="https://resend.com/domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B8826D] hover:underline inline-flex items-center"
                    >
                      resend.com/domains
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                    {' '}and sign in with the account that owns the RESEND_API_KEY.
                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-4">
                <span className="w-7 h-7 bg-[#B8826D]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#B8826D] flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-medium text-[#1A2332]">Add your domain</p>

                  <p className="text-sm text-[#1A2332]/60 mt-1 leading-relaxed">
                    Click "Add Domain" and enter your domain (e.g. smallworldofrugby.com). Resend will provide DNS records you need to add.

                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-4">
                <span className="w-7 h-7 bg-[#B8826D]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#B8826D] flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium text-[#1A2332]">Add DNS records</p>
                  <p className="text-sm text-[#1A2332]/60 mt-1 leading-relaxed">
                    In your domain registrar (e.g. Cloudflare, Namecheap, GoDaddy), add the DNS records provided by Resend. These typically include:
                  </p>
                  <div className="mt-3 space-y-2">
                    {[
                      { type: 'SPF', desc: 'TXT record for sender authentication', example: 'v=spf1 include:amazonses.com ~all' },
                      { type: 'DKIM', desc: 'CNAME records for email signing (usually 3 records)', example: 'resend._domainkey.smallworldofrugby.com' },
                      { type: 'DMARC', desc: 'TXT record for email policy (optional but recommended)', example: 'v=DMARC1; p=none;' },

                    ].map((record) => (
                      <div key={record.type} className="bg-[#F5F1E8] rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#1A2332]">{record.type}</span>
                          <button
                            onClick={() => handleCopyDns(record.example, record.type)}
                            className="text-xs text-[#1A2332]/40 hover:text-[#1A2332] flex items-center min-h-[32px]"
                          >
                            {copiedDns === record.type ? (
                              <><Check className="w-3 h-3 mr-1" />Copied</>
                            ) : (
                              <><Copy className="w-3 h-3 mr-1" />Copy example</>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-[#1A2332]/50 mt-1">{record.desc}</p>
                        <code className="text-xs text-[#B8826D] mt-1 block font-mono">{record.example}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </li>

              <li className="flex items-start space-x-4">
                <span className="w-7 h-7 bg-[#B8826D]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#B8826D] flex-shrink-0 mt-0.5">4</span>
                <div>
                  <p className="text-sm font-medium text-[#1A2332]">Wait for verification</p>
                  <p className="text-sm text-[#1A2332]/60 mt-1 leading-relaxed">
                    DNS propagation can take up to 48 hours, though it usually completes within a few minutes to a few hours. Resend will show a green "Verified" status once complete.
                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-4">
                <span className="w-7 h-7 bg-[#B8826D]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#B8826D] flex-shrink-0 mt-0.5">5</span>
                <div>
                  <p className="text-sm font-medium text-[#1A2332]">Set sender address</p>
                  <p className="text-sm text-[#1A2332]/60 mt-1 leading-relaxed">
                    Once verified, emails will be sent from the configured sender address (e.g. noreply@smallworldofrugby.com or hello@smallworldofrugby.com). The sender address is set in the edge function code.
                  </p>

                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Section 3: Send Test Email */}
        <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#1A2332]/10">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="font-serif text-lg text-[#1A2332]">Send Test Email</h2>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <p className="text-sm text-[#1A2332]/70 leading-relaxed">
              Send a test email to your address to confirm the email delivery system is working correctly.
            </p>

            <div className="bg-[#F5F1E8] rounded-lg p-4">
              <p className="text-sm text-[#1A2332]/60">
                <span className="font-medium text-[#1A2332]">Recipient:</span>{' '}
                {user?.email || 'Not available'}
              </p>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border flex items-start ${
                testResult.success
                  ? 'bg-[#8B9D83]/5 border-[#8B9D83]/20'
                  : 'bg-red-50 border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-[#8B9D83] mr-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${testResult.success ? 'text-[#8B9D83]' : 'text-red-700'}`}>
                  {testResult.message}
                </p>
              </div>
            )}

            <button
              onClick={handleSendTest}
              disabled={sendingTest || !user?.email}
              className="px-6 py-3 bg-[#1A2332] text-white rounded-lg hover:bg-[#1A2332]/90 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send me a test email
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-3 pb-8">
          <button
            onClick={() => onNavigate('go-live')}
            className="px-4 py-3 bg-white border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332] hover:bg-[#F5F1E8] transition-colors min-h-[44px]"
          >
            Go-Live Checklist
          </button>
          <button
            onClick={() => onNavigate('steward')}
            className="px-4 py-3 bg-white border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332] hover:bg-[#F5F1E8] transition-colors min-h-[44px]"
          >
            Steward Ops Hub
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailStatusPage;
