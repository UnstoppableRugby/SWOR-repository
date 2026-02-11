import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, Loader2, Check, Settings, Shield, Eye, BookOpen, Heart, MessageSquare } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import StewardContact from '../StewardContact';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

interface NotificationPreferences {
  email_on_approval: boolean;
  email_on_rejection: boolean;
  email_digest_weekly: boolean;
  email_commendation_submitted: boolean;
  email_commendation_approved: boolean;
  email_commendation_rejected: boolean;
  email_profile_submitted: boolean;
  email_profile_approved: boolean;
  email_profile_needs_changes: boolean;
  email_contact_message: boolean;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user } = useAppContext();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_on_approval: true,
    email_on_rejection: true,
    email_digest_weekly: false,
    email_commendation_submitted: true,
    email_commendation_approved: true,
    email_commendation_rejected: true,
    email_profile_submitted: true,
    email_profile_approved: true,
    email_profile_needs_changes: true,
    email_contact_message: true,
  });


  // Fetch current preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('swor-notifications', {
          body: {
            action: 'get_preferences',
            payload: { user_id: user.id }
          }
        });

        if (error) {
          console.error('Error fetching preferences:', error);
          return;
        }

        if (data?.success && data?.preferences) {
          setPreferences({
            email_on_approval: data.preferences.email_on_approval ?? true,
            email_on_rejection: data.preferences.email_on_rejection ?? true,
            email_digest_weekly: data.preferences.email_digest_weekly ?? false,
            email_commendation_submitted: data.preferences.email_commendation_submitted ?? true,
            email_commendation_approved: data.preferences.email_commendation_approved ?? true,
            email_commendation_rejected: data.preferences.email_commendation_rejected ?? true,
            email_profile_submitted: data.preferences.email_profile_submitted ?? true,
            email_profile_approved: data.preferences.email_profile_approved ?? true,
            email_profile_needs_changes: data.preferences.email_profile_needs_changes ?? true,
            email_contact_message: data.preferences.email_contact_message ?? true,
          });
        }

      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke('swor-notifications', {
        body: {
          action: 'update_preferences',
          payload: {
            user_id: user.id,
            ...preferences
          }
        }
      });

      if (error) {
        toast({
          title: 'Error saving preferences',
          description: 'Please try again later.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        setSaved(true);
        toast({
          title: 'Preferences saved',
          description: 'Your notification settings have been updated.',
        });
        
        // Clear the saved indicator after 3 seconds
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast({
          title: 'Error saving preferences',
          description: data?.error || 'Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast({
        title: 'Error saving preferences',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <Settings className="w-10 h-10 sm:w-12 sm:h-12 text-[#1A2332]/30 mx-auto mb-4 sm:mb-6" />
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-3 sm:mb-4">Account Settings</h1>
          <p className="text-sm sm:text-base text-[#1A2332]/70 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
            Please sign in to manage your notification preferences.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="swor-btn-primary min-h-[44px] sm:min-h-[48px] px-6 sm:px-8"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 sm:pt-24 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-white py-6 sm:py-8 md:py-10 border-b border-[#1A2332]/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] mb-4 sm:mb-6 transition-colors min-h-[44px] active:text-[#1A2332]"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">Back</span>
          </button>
          
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-2">Account Settings</h1>
          <p className="text-sm sm:text-base text-[#1A2332]/70 leading-relaxed">
            Manage your notification preferences and account settings.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#B8826D] animate-spin" />
            <span className="ml-3 text-sm sm:text-base text-[#1A2332]/60">Loading preferences...</span>
          </div>
        ) : (
          <>
            {/* Notification Preferences Section */}
            <section className="bg-white rounded-xl p-4 sm:p-6 md:p-8 shadow-sm border border-[#1A2332]/10">
              <div className="flex items-center mb-4 sm:mb-6">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#B8826D] mr-2 sm:mr-3" />
                <h2 className="font-serif text-lg sm:text-xl text-[#1A2332]">Notification Preferences</h2>
              </div>

              {/* Helper text - calm, plain English */}
              <div className="bg-[#8B9D83]/5 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8 border border-[#8B9D83]/10">
                <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                  Notifications are optional. You can change these anytime. We will never share your 
                  email address or send you marketing messages.
                </p>
              </div>

              {/* Contribution Notifications */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-medium text-[#1A2332]/60 uppercase tracking-wide mb-3 sm:mb-4">
                  Contributions
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {/* Email on approval */}
                  <div className="flex items-start justify-between p-3 sm:p-4 rounded-lg hover:bg-[#F5F1E8]/50 transition-colors">
                    <div className="flex-1 pr-3 sm:pr-4 min-w-0">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-[#8B9D83] mr-2 flex-shrink-0" />
                        <label className="font-medium text-[#1A2332] text-sm sm:text-base">
                          Submission approved
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1 ml-6 leading-relaxed">
                        Email me when my submission is approved and published
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('email_on_approval')}
                      className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors flex-shrink-0 min-h-[44px] flex items-center ${
                        preferences.email_on_approval ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/20'
                      }`}
                      aria-label="Toggle email on approval"
                    >
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white shadow transition-transform ${
                          preferences.email_on_approval ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email on rejection */}
                  <div className="flex items-start justify-between p-3 sm:p-4 rounded-lg hover:bg-[#F5F1E8]/50 transition-colors">
                    <div className="flex-1 pr-3 sm:pr-4 min-w-0">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-[#B8826D] mr-2 flex-shrink-0" />
                        <label className="font-medium text-[#1A2332] text-sm sm:text-base">
                          Submission not approved
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1 ml-6 leading-relaxed">
                        Email me when my submission needs revision or is not approved
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('email_on_rejection')}
                      className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors flex-shrink-0 min-h-[44px] flex items-center ${
                        preferences.email_on_rejection ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/20'
                      }`}
                      aria-label="Toggle email on rejection"
                    >
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white shadow transition-transform ${
                          preferences.email_on_rejection ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Commendation Notifications */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-medium text-[#1A2332]/60 uppercase tracking-wide mb-3 sm:mb-4 flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-[#B8826D]" />
                  Commendations
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {/* Commendation approved (for recipient) */}
                  <div className="flex items-start justify-between p-3 sm:p-4 rounded-lg hover:bg-[#F5F1E8]/50 transition-colors">
                    <div className="flex-1 pr-3 sm:pr-4 min-w-0">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 text-[#8B9D83] mr-2 flex-shrink-0" />
                        <label className="font-medium text-[#1A2332] text-sm sm:text-base">
                          New commendation for me
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1 ml-6 leading-relaxed">
                        Email me when someone writes a commendation for my profile
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('email_commendation_approved')}
                      className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors flex-shrink-0 min-h-[44px] flex items-center ${
                        preferences.email_commendation_approved ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/20'
                      }`}
                      aria-label="Toggle commendation approved email"
                    >
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white shadow transition-transform ${
                          preferences.email_commendation_approved ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Commendation rejected (for commender) */}
                  <div className="flex items-start justify-between p-3 sm:p-4 rounded-lg hover:bg-[#F5F1E8]/50 transition-colors">
                    <div className="flex-1 pr-3 sm:pr-4 min-w-0">
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 text-[#B8826D] mr-2 flex-shrink-0" />
                        <label className="font-medium text-[#1A2332] text-sm sm:text-base">
                          My commendation not approved
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1 ml-6 leading-relaxed">
                        Email me when a commendation I wrote needs revision
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('email_commendation_rejected')}
                      className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors flex-shrink-0 min-h-[44px] flex items-center ${
                        preferences.email_commendation_rejected ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/20'
                      }`}
                      aria-label="Toggle commendation rejected email"
                    >
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white shadow transition-transform ${
                          preferences.email_commendation_rejected ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Steward Notifications */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-medium text-[#1A2332]/60 uppercase tracking-wide mb-3 sm:mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-[#8B9D83]" />
                  Steward Notifications
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {/* Commendation submitted (for stewards) */}
                  <div className="flex items-start justify-between p-3 sm:p-4 rounded-lg hover:bg-[#F5F1E8]/50 transition-colors">
                    <div className="flex-1 pr-3 sm:pr-4 min-w-0">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-[#8B9D83] mr-2 flex-shrink-0" />
                        <label className="font-medium text-[#1A2332] text-sm sm:text-base">
                          Commendation awaiting review
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1 ml-6 leading-relaxed">
                        Email me when a new commendation needs my review (stewards only)
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('email_commendation_submitted')}
                      className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors flex-shrink-0 min-h-[44px] flex items-center ${
                        preferences.email_commendation_submitted ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/20'
                      }`}
                      aria-label="Toggle commendation submitted email"
                    >
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white shadow transition-transform ${
                          preferences.email_commendation_submitted ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Weekly digest */}
                  <div className="flex items-start justify-between p-3 sm:p-4 rounded-lg hover:bg-[#F5F1E8]/50 transition-colors">
                    <div className="flex-1 pr-3 sm:pr-4 min-w-0">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-[#1A2332]/50 mr-2 flex-shrink-0" />
                        <label className="font-medium text-[#1A2332] text-sm sm:text-base">
                          Weekly digest
                        </label>
                      </div>
                      <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-1 ml-6 leading-relaxed">
                        Weekly summary of pending items I can review (stewards only)
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('email_digest_weekly')}
                      className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors flex-shrink-0 min-h-[44px] flex items-center ${
                        preferences.email_digest_weekly ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/20'
                      }`}
                      aria-label="Toggle weekly digest"
                    >
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-white shadow transition-transform ${
                          preferences.email_digest_weekly ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#1A2332]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center order-2 sm:order-1">
                  {saved && (
                    <span className="flex items-center text-xs sm:text-sm text-[#8B9D83]">
                      <Check className="w-4 h-4 mr-1" />
                      Saved
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="swor-btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[48px] w-full sm:w-auto order-1 sm:order-2 px-6 sm:px-8"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </button>
              </div>
            </section>

            {/* Privacy & Visibility Explanation */}
            <section className="mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-6 md:p-8 shadow-sm border border-[#1A2332]/10">
              <div className="flex items-center mb-3 sm:mb-4">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 sm:mr-3" />
                <h2 className="font-serif text-lg sm:text-xl text-[#1A2332]">Privacy & Visibility</h2>
              </div>
              
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-[#1A2332]/70">
                <p className="leading-relaxed">
                  Your privacy is important to us. Here is how visibility works on SWOR:
                </p>
                
                <div className="grid gap-2 sm:gap-3">
                  <div className="flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-[#F5F1E8]/50 rounded-lg">
                    <Shield className="w-4 h-4 text-[#1A2332]/40 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A2332] text-sm">Draft</p>
                      <p className="text-xs text-[#1A2332]/60">Only you and stewards can see this</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-[#F5F1E8]/50 rounded-lg">
                    <Shield className="w-4 h-4 text-[#B8826D]/60 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A2332] text-sm">Family / Trusted Circle</p>
                      <p className="text-xs text-[#1A2332]/60">Only people you have marked as trusted</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-[#F5F1E8]/50 rounded-lg">
                    <Shield className="w-4 h-4 text-[#8B9D83]/60 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A2332] text-sm">Connections</p>
                      <p className="text-xs text-[#1A2332]/60">People you have connected with on SWOR</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-[#F5F1E8]/50 rounded-lg">
                    <Shield className="w-4 h-4 text-green-500/60 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A2332] text-sm">Public</p>
                      <p className="text-xs text-[#1A2332]/60">Anyone visiting SWOR can see this</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-[#1A2332]/50 italic pt-2">
                  You can change visibility settings on any content you create at any time.
                </p>
              </div>
            </section>

            {/* Account info */}
            <section className="mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-6 md:p-8 shadow-sm border border-[#1A2332]/10">
              <h2 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-3 sm:mb-4">Account</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-xs sm:text-sm text-[#1A2332]/50">Email</span>
                  <p className="text-sm sm:text-base text-[#1A2332] break-all">{user.email || 'Not available'}</p>
                </div>
                {user.isDemo && (
                  <div className="mt-4 p-3 bg-[#B8826D]/10 rounded-lg">
                    <p className="text-xs sm:text-sm text-[#B8826D]">
                      You are using a demo account. Some features may be limited.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Steward Contact */}
            <section className="mt-6 sm:mt-8">
              <StewardContact
                variant="card"
                showFallback={true}
              />
            </section>

            {/* Quick Links */}
            <section className="mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-6 md:p-8 shadow-sm border border-[#1A2332]/10">
              <h2 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-3 sm:mb-4">Quick Links</h2>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="flex items-center text-[#B8826D] hover:text-[#B8826D]/80 transition-colors text-sm min-h-[44px] w-full text-left active:text-[#B8826D]/60"
                >
                  <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>How Rugby Journeys Work</span>
                </button>
                <button
                  onClick={() => onNavigate('profile-builder')}
                  className="flex items-center text-[#B8826D] hover:text-[#B8826D]/80 transition-colors text-sm min-h-[44px] w-full text-left active:text-[#B8826D]/60"
                >
                  <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Build Your Profile</span>
                </button>
              </div>
            </section>

            {/* Footer link */}
            <div className="mt-8 sm:mt-10 text-center pb-4">
              <p className="text-xs sm:text-sm text-[#1A2332]/50 leading-relaxed">
                Need help? Contact us at{' '}
                <a href="mailto:support@swor.rugby" className="text-[#B8826D] hover:underline break-all">
                  support@swor.rugby
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
