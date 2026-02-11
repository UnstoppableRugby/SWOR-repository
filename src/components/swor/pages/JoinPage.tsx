import React, { useState, useRef, useCallback, useEffect } from 'react';
import { joinPaths } from '@/data/sworData';
import { Trophy, Building, Users, Heart, Camera, Handshake, ArrowLeft, Check, WifiOff, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOffline } from '@/hooks/useOffline';
import { QueuedSubmission } from '@/lib/offlineQueue';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  trophy: Trophy,
  building: Building,
  users: Users,
  heart: Heart,
  camera: Camera,
  handshake: Handshake,
};

const JoinPage: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    club: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'queued'>('idle');
  
  // Offline support
  const { isOnline, queueFormSubmission, queuedSubmissions, retrySubmission, removeQueuedItem } = useOffline();
  const joinQueuedSubmissions = queuedSubmissions.filter(s => s.type === 'join');
  
  // Refs for focus management
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  
  // Screen reader announcement ref
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce to screen readers
  const announce = useCallback((message: string, assertive: boolean = false) => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
      announcementRef.current.textContent = '';
      // Small delay to ensure the change is picked up
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 50);
    }
  }, []);

  // Scroll input into view on focus (mobile keyboard handling)
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Please enter your name.';
        if (value.trim().length < 2) return 'Name should be at least 2 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Please enter your email address.';
        if (!validateEmail(value)) return 'Please enter a valid email address.';
        return '';
      case 'country':
        if (!value.trim()) return 'Please enter your country.';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;
    
    const countryError = validateField('country', formData.country);
    if (countryError) newErrors.country = countryError;
    
    return newErrors;
  };

  // Handle field blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => {
      if (error) {
        return { ...prev, [name]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
    });
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing (if field was touched)
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => {
        if (error) {
          return { ...prev, [name]: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        }
      });
    }
  };

  // Focus first invalid field
  const focusFirstInvalidField = (validationErrors: Record<string, string>) => {
    if (validationErrors.name && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (validationErrors.email && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (validationErrors.country && countryInputRef.current) {
      countryInputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all required fields as touched
    setTouched({ name: true, email: true, country: true });
    
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      // Focus first invalid field
      focusFirstInvalidField(validationErrors);
      announce('There was a problem. Please review the highlighted fields.', true);
      return;
    }
    
    setIsSubmitting(true);
    announce('Submitting…');
    
    // If offline, queue the submission
    if (!isOnline) {
      try {
        await queueFormSubmission('join', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          country: formData.country.trim(),
          club: formData.club.trim(),
          message: formData.message.trim(),
          path: selectedPath,
          source_page: '/join'
        });
        
        setIsSubmitting(false);
        setSubmitStatus('queued');
        announce('Saved. We\'ll send this when you\'re back online.');
      } catch (error) {
        setIsSubmitting(false);
        setSubmitStatus('error');
        announce('There was a problem. Please try again.', true);
      }
      return;
    }
    
    // Online submission
    try {
      const { data, error } = await supabase.functions.invoke('swor-contact', {
        body: {
          action: 'submit_join_request',
          name: formData.name.trim(),
          email: formData.email.trim(),
          country: formData.country.trim(),
          club: formData.club.trim(),
          message: formData.message.trim(),
          path: selectedPath,
          source_page: '/join'
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Submission failed');

      setIsSubmitting(false);
      setSubmitStatus('success');
      setSubmitted(true);
      announce('Sent. Welcome to SWOR.');
    } catch (error) {
      setIsSubmitting(false);
      setSubmitStatus('error');
      announce('There was a problem. Please try again.', true);
    }
  };

  // Retry a queued submission
  const handleRetry = async (submission: QueuedSubmission) => {
    const success = await retrySubmission(submission);
    if (success) {
      announce('Your request has been sent.');
    }
  };

  const selectedPathData = joinPaths.find((p) => p.id === selectedPath);
  const hasErrors = Object.keys(errors).length > 0;

  // Queued submission confirmation screen
  if (submitStatus === 'queued') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
        <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-[#B8826D] flex items-center justify-center mx-auto mb-5 sm:mb-6 md:mb-8">
            <WifiOff className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#F5F1E8]" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1A2332] mb-3 sm:mb-4">
            Saved for Later
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
            We'll send this when you're back online.
          </p>
          <p className="text-xs sm:text-sm text-[#1A2332]/60 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
            Your request has been saved and will be submitted automatically when your connection returns.
          </p>
          <button
            onClick={() => {
              setSelectedPath(null);
              setFormData({ name: '', email: '', country: '', club: '', message: '' });
              setErrors({});
              setTouched({});
              setSubmitStatus('idle');
            }}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 active:bg-[#B8826D]/80 transition-colors text-sm sm:text-base min-h-[48px] sm:min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
        {/* Screen reader announcements */}
        <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />

        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-[#8B9D83] flex items-center justify-center mx-auto mb-5 sm:mb-6 md:mb-8">
            <Check className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#F5F1E8]" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1A2332] mb-3 sm:mb-4">
            Welcome to SWOR
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
            Thank you for joining the journey. We'll be in touch soon with next steps 
            tailored to your path.
          </p>
          <p className="text-xs sm:text-sm text-[#1A2332]/60 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
            In the meantime, explore the world of rugby – discover legends, clubs, 
            and moments that make this game special.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setSelectedPath(null);
              setFormData({ name: '', email: '', country: '', club: '', message: '' });
              setErrors({});
              setTouched({});
              setSubmitStatus('idle');
            }}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 active:bg-[#B8826D]/80 transition-colors text-sm sm:text-base min-h-[48px] sm:min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
          >
            Explore SWOR
          </button>
        </div>
      </div>
    );
  }

  if (selectedPath && selectedPathData) {
    const IconComponent = iconMap[selectedPathData.icon];

    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
        {/* Screen reader announcements */}
        <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 pb-8 sm:pb-12">
          <button
            onClick={() => setSelectedPath(null)}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] mb-5 sm:mb-6 md:mb-8 transition-colors min-h-[44px] -ml-1 active:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] rounded-lg px-2"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base">Back to paths</span>
          </button>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#B8826D]/10 flex items-center justify-center flex-shrink-0">
                {IconComponent && <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#B8826D]" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A2332]">Join as {selectedPathData.title}</h1>
                <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-0.5 sm:mt-1 line-clamp-2">{selectedPathData.description}</p>
              </div>
            </div>

            {/* Error Summary */}
            {hasErrors && touched.name && touched.email && touched.country && (
              <div 
                ref={errorSummaryRef}
                role="alert"
                aria-live="assertive"
                className="mb-4 sm:mb-5 p-3 sm:p-4 bg-[#B8826D]/10 border border-[#B8826D]/30 rounded-lg"
              >
                <p className="text-[#1A2332] text-sm sm:text-base font-medium">
                  Please review the highlighted fields.
                </p>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
              {/* Single column on mobile, 2 columns on sm+ */}
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-5 md:gap-6">
                <div>
                  <label htmlFor="join-name" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                    Full Name <span className="text-[#B8826D]" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    id="join-name"
                    name="name"
                    required
                    aria-required="true"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'join-name-error' : 'join-name-hint'}
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleInputFocus}
                    className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border ${
                      errors.name && touched.name ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                    }`}
                    placeholder="Your name"
                    disabled={isSubmitting}
                  />
                  <span id="join-name-hint" className="sr-only">Enter your full name as you would like it to appear</span>
                  {errors.name && touched.name && (
                    <p id="join-name-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="join-email" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                    Email Address <span className="text-[#B8826D]" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    id="join-email"
                    name="email"
                    required
                    aria-required="true"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'join-email-error' : 'join-email-hint'}
                    autoComplete="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleInputFocus}
                    className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border ${
                      errors.email && touched.email ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                    }`}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                  />
                  <span id="join-email-hint" className="sr-only">Enter your email address so we can contact you</span>
                  {errors.email && touched.email && (
                    <p id="join-email-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-5 md:gap-6">
                <div>
                  <label htmlFor="join-country" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                    Country <span className="text-[#B8826D]" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    ref={countryInputRef}
                    type="text"
                    id="join-country"
                    name="country"
                    required
                    aria-required="true"
                    aria-invalid={errors.country ? 'true' : 'false'}
                    aria-describedby={errors.country ? 'join-country-error' : 'join-country-hint'}
                    autoComplete="country-name"
                    value={formData.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleInputFocus}
                    className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border ${
                      errors.country && touched.country ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                    }`}
                    placeholder="Your country"
                    disabled={isSubmitting}
                  />
                  <span id="join-country-hint" className="sr-only">Enter your country of residence</span>
                  {errors.country && touched.country && (
                    <p id="join-country-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                      {errors.country}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="join-club" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                    Club <span className="text-[#1A2332]/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="join-club"
                    name="club"
                    aria-describedby="join-club-hint"
                    autoComplete="organization"
                    value={formData.club}
                    onChange={handleChange}
                    onFocus={handleInputFocus}
                    className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border"
                    placeholder="Your rugby club"
                    disabled={isSubmitting}
                  />
                  <span id="join-club-hint" className="sr-only">Optionally enter your rugby club if applicable</span>
                </div>
              </div>

              <div>
                <label htmlFor="join-message" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                  Tell us about yourself <span className="text-[#1A2332]/40">(optional)</span>
                </label>
                <textarea
                  id="join-message"
                  name="message"
                  rows={4}
                  aria-describedby="join-message-hint"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] resize-none text-base min-h-[120px] sm:min-h-[140px] box-border"
                  placeholder="Share a bit about your rugby journey and what brings you to SWOR..."
                  disabled={isSubmitting}
                />
                <span id="join-message-hint" className="sr-only">Optionally share a bit about your rugby journey</span>
              </div>

              {/* Submit button - in flow, not pinned */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-describedby="submit-hint"
                  className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 active:bg-[#B8826D]/80 transition-colors text-base min-h-[52px] sm:min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-white flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-[#F5F1E8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting…</span>
                    </>
                  ) : (
                    'Get Your Seat at the Table'
                  )}
                </button>
                <p id="submit-hint" className="sr-only">Submit your application to join SWOR</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
      {/* Screen reader announcements */}
      <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      
      {/* Hero */}
      <div className="bg-[#1A2332] py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
            Join SWOR
          </p>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-[#F5F1E8] leading-tight mb-3 sm:mb-4">
            Find your place in rugby's story
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#F5F1E8]/70 max-w-2xl mx-auto leading-relaxed">
            Whether you're a legend, a club volunteer, a young player, or a passionate fan – 
            there's a seat at the table for you.
          </p>
        </div>
      </div>

      {/* Paths */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" role="list" aria-label="Ways to join SWOR">
          {joinPaths.map((path) => {
            const IconComponent = iconMap[path.icon];
            return (
              <button
                key={path.id}
                onClick={() => setSelectedPath(path.id)}
                className="group bg-white hover:bg-[#1A2332] active:bg-[#1A2332] rounded-xl p-4 sm:p-5 md:p-6 lg:p-8 text-left transition-all duration-300 shadow-sm hover:shadow-lg min-h-[160px] sm:min-h-[180px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
                role="listitem"
                aria-label={`Join as ${path.title}: ${path.description}`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#B8826D]/10 group-hover:bg-[#B8826D]/20 flex items-center justify-center mb-3 sm:mb-4 md:mb-6 transition-colors flex-shrink-0">
                  {IconComponent && <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#B8826D]" aria-hidden="true" />}
                </div>
                <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332] group-hover:text-[#F5F1E8] mb-1.5 sm:mb-2 md:mb-3 transition-colors">
                  {path.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#1A2332]/60 group-hover:text-[#F5F1E8]/70 leading-relaxed mb-2 sm:mb-3 md:mb-4 transition-colors line-clamp-2 sm:line-clamp-3">
                  {path.description}
                </p>
                <span className="text-xs sm:text-sm font-medium text-[#B8826D] flex items-center">
                  Get started
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>

        {/* Not Sure */}
        <div className="mt-6 sm:mt-8 md:mt-12 text-center">
          <p className="text-[#1A2332]/60 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">Not sure which path is right for you?</p>
          <button
            onClick={() => setSelectedPath('fans')}
            className="text-[#B8826D] font-medium hover:text-[#B8826D]/80 active:text-[#B8826D]/70 transition-colors text-xs sm:text-sm md:text-base min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] rounded-lg"
          >
            Start as a fan and explore from there →
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
