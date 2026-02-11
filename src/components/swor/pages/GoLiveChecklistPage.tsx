import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Shield, CheckSquare, Square, Loader2, RefreshCw,
  Globe, Lock, Users, FileText, MessageSquare, Bell, AlertCircle,
  ChevronRight, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

interface GoLiveChecklistPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

interface CheckItem {
  id: string;
  label: string;
}

interface CheckSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: CheckItem[];
}

interface HealthStatus {
  loading: boolean;
  error: string | null;
  env: {
    supabaseUrlConfigured: boolean;
    supabaseAnonKeyConfigured: boolean;
    supabaseServiceRoleConfigured: boolean;
    resendConfigured: boolean;
    gatewayConfigured: boolean;
  } | null;
  connectivity: {
    restApi: boolean;
    storageApi: boolean;
  } | null;
  time: string | null;
  version: string | null;
}

const STORAGE_KEY = 'swor_go_live_checklist_v1';

const sections: CheckSection[] = [
  {
    id: 'domain',
    title: 'Domain and SSL',
    icon: <Globe className="w-5 h-5 text-[#8B9D83]" />,
    items: [
      { id: 'domain-resolves', label: 'Custom domain resolves' },
      { id: 'https-active', label: 'HTTPS active' },
      { id: 'www-redirect', label: 'www redirect configured (if used)' },
    ],
  },
  {
    id: 'core',
    title: 'Core Flows',
    icon: <Users className="w-5 h-5 text-[#B8826D]" />,
    items: [
      { id: 'sign-in-magic', label: 'Sign in (magic link) works' },
      { id: 'create-edit-draft', label: 'Create and edit profile draft works' },
      { id: 'submit-review', label: 'Submit for review works' },
      { id: 'steward-approve', label: 'Steward approve and needs changes works' },
      { id: 'approved-public', label: 'Approved profile appears on public page' },
    ],
  },
  {
    id: 'archive',
    title: 'Archive Flows',
    icon: <FileText className="w-5 h-5 text-[#1A2332]/60" />,
    items: [
      { id: 'upload-image-pdf', label: 'Upload image, PDF and link' },
      { id: 'pending-queue', label: 'Items show in pending queue' },
      { id: 'approve-renders', label: 'Approve renders on profile page' },
      { id: 'visibility-works', label: 'Visibility works (public vs connections vs family)' },
    ],
  },
  {
    id: 'commendations',
    title: 'Commendations',
    icon: <MessageSquare className="w-5 h-5 text-amber-600" />,
    items: [
      { id: 'submit-commendation', label: 'Submit commendation' },
      { id: 'steward-moderation', label: 'Steward moderation queue works' },
      { id: 'approved-displays', label: 'Approved commendation displays' },
      { id: 'owner-response', label: 'Owner response works (if enabled)' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <Bell className="w-5 h-5 text-blue-500" />,
    items: [
      { id: 'contact-email', label: 'Contact form sends steward email' },
      { id: 'approval-email', label: 'Approval and needs changes sends user email' },
      { id: 'commendation-emails', label: 'Commendation workflow emails (opt-in)' },
    ],
  },
];

const GoLiveChecklistPage: React.FC<GoLiveChecklistPageProps> = ({ onBack, onNavigate }) => {
  const { user, isGlobalSteward } = useAppContext();
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [health, setHealth] = useState<HealthStatus>({
    loading: false,
    error: null,
    env: null,
    connectivity: null,
    time: null,
    version: null,
  });

  const [showResetModal, setShowResetModal] = useState(false);

  // Persist checked state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggleCheck = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReset = () => {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
    setShowResetModal(false);
  };

  const fetchHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.functions.invoke('swor-health-check', {
        body: { action: 'go_live' },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error('Health check returned unsuccessful');

      setHealth({
        loading: false,
        error: null,
        env: data.env,
        connectivity: data.connectivity,
        time: data.time,
        version: data.version,
      });
    } catch (err: any) {
      setHealth(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to reach health check',
      }));
    }
  }, []);

  useEffect(() => {
    if (user && isGlobalSteward) {
      fetchHealth();
    }
  }, [user, isGlobalSteward, fetchHealth]);

  // Calculate progress
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const checkedCount = sections.reduce(
    (sum, s) => sum + s.items.filter(item => checked[item.id]).length,
    0
  );
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

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
            This page is only available to authenticated stewards. Please sign in to continue.
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
            This checklist is restricted to SWOR stewards. If you believe you should have access, please contact the team.
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

  const StatusIndicator = ({ configured, label }: { configured: boolean | null | undefined; label: string }) => (
    <div className="flex items-center justify-between py-2.5 px-4 bg-white rounded-lg border border-[#1A2332]/10">
      <span className="text-sm text-[#1A2332]/80">{label}</span>
      {configured === null || configured === undefined ? (
        <span className="text-xs text-[#1A2332]/40 italic">Unknown</span>
      ) : configured ? (
        <span className="inline-flex items-center text-xs font-medium text-[#8B9D83] bg-[#8B9D83]/10 px-2.5 py-1 rounded-full">
          Present
        </span>
      ) : (
        <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
          Missing
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 md:pt-24">
      {/* Page Header */}
      <div className="bg-white border-b border-[#1A2332]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] transition-colors mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back</span>
          </button>

          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#8B9D83]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-[#8B9D83]" />
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl text-[#1A2332]">SWOR Go-Live Checklist</h1>
                <p className="text-[#1A2332]/60 mt-1 text-sm sm:text-base leading-relaxed">
                  A short internal checklist to confirm the system is ready to share publicly.
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm text-[#1A2332]/60 mb-1">
                {checkedCount} of {totalItems} checked
              </p>
              <div className="w-40 h-2 bg-[#1A2332]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8B9D83] rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {sections.map(section => {
          const sectionChecked = section.items.filter(item => checked[item.id]).length;
          const sectionComplete = sectionChecked === section.items.length;

          return (
            <div key={section.id} className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
              <div className={`px-5 sm:px-6 py-4 border-b border-[#1A2332]/10 flex items-center justify-between ${sectionComplete ? 'bg-[#8B9D83]/5' : 'bg-white'}`}>
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <h2 className="font-serif text-lg text-[#1A2332]">{section.title}</h2>
                </div>
                <span className="text-xs text-[#1A2332]/50">
                  {sectionChecked}/{section.items.length}
                </span>
              </div>
              <div className="divide-y divide-[#1A2332]/5">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className="w-full flex items-center px-5 sm:px-6 py-3.5 text-left hover:bg-[#F5F1E8]/50 transition-colors min-h-[44px] group"
                    aria-pressed={!!checked[item.id]}
                  >
                    {checked[item.id] ? (
                      <CheckSquare className="w-5 h-5 text-[#8B9D83] mr-3 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-[#1A2332]/30 mr-3 flex-shrink-0 group-hover:text-[#1A2332]/50" />
                    )}
                    <span className={`text-sm leading-relaxed ${checked[item.id] ? 'text-[#1A2332]/60 line-through' : 'text-[#1A2332]'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Safety Checks Section */}
        <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#1A2332]/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-[#1A2332]/60" />
              <h2 className="font-serif text-lg text-[#1A2332]">Safety Checks (Presence Only)</h2>
            </div>
            <button
              onClick={fetchHealth}
              disabled={health.loading}
              className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[44px] px-2"
              aria-label="Refresh health check"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${health.loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-3">
            {health.loading && !health.env && (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 text-[#B8826D] mx-auto animate-spin" />
                <p className="text-sm text-[#1A2332]/50 mt-3">Checking...</p>
              </div>
            )}

            {health.error && !health.loading && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">Health check could not be completed</p>
                    <p className="text-xs text-red-600 mt-1">{health.error}</p>
                    <button
                      onClick={fetchHealth}
                      className="mt-3 text-xs text-red-700 underline hover:no-underline min-h-[44px] inline-flex items-center"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {health.env && (
              <>
                <p className="text-xs text-[#1A2332]/50 mb-3">
                  No values are displayed. Only presence or absence is shown.
                </p>
                <div className="space-y-2">
                  <StatusIndicator
                    configured={health.env.supabaseUrlConfigured}
                    label="VITE_SUPABASE_URL"
                  />
                  <StatusIndicator
                    configured={health.env.supabaseAnonKeyConfigured}
                    label="VITE_SUPABASE_ANON_KEY"
                  />
                  <StatusIndicator
                    configured={health.env.resendConfigured}
                    label="RESEND_API_KEY (server-side)"
                  />
                  <StatusIndicator
                    configured={health.env.gatewayConfigured}
                    label="GATEWAY_API_KEY (server-side)"
                  />
                </div>

                {/* Connectivity */}
                {health.connectivity && (
                  <div className="mt-4 pt-4 border-t border-[#1A2332]/10 space-y-2">
                    <p className="text-xs font-medium text-[#1A2332]/60 mb-2">Connectivity</p>
                    <StatusIndicator
                      configured={health.connectivity.restApi}
                      label="REST API reachable"
                    />
                    <StatusIndicator
                      configured={health.connectivity.storageApi}
                      label="Storage API reachable"
                    />
                  </div>
                )}

                {health.time && (
                  <p className="text-xs text-[#1A2332]/40 mt-3">
                    Last checked: {new Date(health.time).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                    {health.version && ` (v${health.version})`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#1A2332]/10">
            <h2 className="font-serif text-lg text-[#1A2332]">Quick Navigation</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-[#1A2332]/5">
            {[
              { label: 'Open Steward Ops Hub', page: 'steward', icon: <Shield className="w-5 h-5 text-[#8B9D83]" /> },
              { label: 'Open Contact Inbox', page: 'steward', icon: <Bell className="w-5 h-5 text-blue-500" /> },
              { label: 'Open Profiles Queue', page: 'steward', icon: <Users className="w-5 h-5 text-purple-500" /> },
              { label: 'Open Commendations Queue', page: 'steward', icon: <MessageSquare className="w-5 h-5 text-amber-500" /> },
              { label: 'Email Status', page: 'email-status', icon: <Globe className="w-5 h-5 text-teal-500" /> },
            ].map((link, i) => (
              <button
                key={i}
                onClick={() => onNavigate(link.page)}
                className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white hover:bg-[#F5F1E8]/50 transition-colors min-h-[56px] text-left"
              >
                <div className="flex items-center space-x-3">
                  {link.icon}
                  <span className="text-sm font-medium text-[#1A2332]">{link.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#1A2332]/30" />
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <div className="text-center pb-8">
          <button
            onClick={() => setShowResetModal(true)}
            className="text-sm text-[#1A2332]/40 hover:text-[#1A2332]/60 transition-colors min-h-[44px]"
          >
            Reset checklist
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-[#1A2332]">Reset Checklist</h3>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[#1A2332]/70 text-sm leading-relaxed mb-6">
                This will clear all checked items from the checklist. You will need to re-check each item manually. This cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 px-4 py-3 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#F5F1E8] transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px]"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoLiveChecklistPage;
