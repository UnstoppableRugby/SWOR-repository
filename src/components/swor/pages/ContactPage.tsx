import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, Loader2, MessageSquare, HelpCircle, WifiOff, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOffline } from '@/hooks/useOffline';
import { QueuedSubmission } from '@/lib/offlineQueue';

interface ContactPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'queued'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Offline support
  const { isOnline, queueFormSubmission, queuedSubmissions, retrySubmission, removeQueuedItem } = useOffline();
  const contactQueuedSubmissions = queuedSubmissions.filter(s => s.type === 'contact');

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Please enter your name.';
        return '';
      case 'email':
        if (!value.trim()) return 'Please enter your email address.';
        if (!validateEmail(value)) return 'Please enter a valid email address.';
        return '';
      case 'subject':
        if (!value.trim()) return 'Please enter a subject.';
        return '';
      case 'message':
        if (!value.trim()) return 'Please enter your message.';
        return '';
      default:
        return '';
    }
  };


  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    ['name', 'email', 'subject', 'message'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });
    
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
    } else if (validationErrors.subject && subjectInputRef.current) {
      subjectInputRef.current.focus();
    } else if (validationErrors.message && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ name: true, email: true, subject: true, message: true });
    
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      focusFirstInvalidField(validationErrors);
      announce('There was a problem. Please review the highlighted fields.', true);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    announce('Submitting…');

    // If offline, queue the submission
    if (!isOnline) {
      try {
        await queueFormSubmission('contact', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          source_page: '/contact'
        });
        
        setIsSubmitting(false);
        setSubmitStatus('queued');
        announce('Saved. We\'ll send this when you\'re back online.');
      } catch (error) {
        setIsSubmitting(false);
        setSubmitStatus('error');
        setErrorMessage('Could not save your message. Please try again.');
        announce('There was a problem. Please try again.', true);
      }
      return;
    }

    // Online submission
    try {
      const { data, error } = await supabase.functions.invoke('swor-contact', {
        body: {
          action: 'submit_message',
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          source_page: '/contact'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send message');
      }

      if (!data?.success) {
        throw new Error(data?.detail || data?.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTouched({});
      setErrors({});
      announce('Sent. Your message has been received.');
    } catch (err: any) {
      console.error('Contact form error:', err);
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      announce('There was a problem. Please try again.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const allTouched = touched.name && touched.email && touched.subject && touched.message;

  // Handle Escape key to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && submitStatus !== 'success' && submitStatus !== 'queued') {
        onBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, submitStatus]);

  // Queued submission confirmation screen
  if (submitStatus === 'queued') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] overflow-x-hidden">
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
            Your message has been saved and will be sent automatically when your connection returns.
          </p>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', subject: '', message: '' });
              setErrors({});
              setTouched({});
              setSubmitStatus('idle');
              onBack();
            }}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 active:bg-[#B8826D]/80 transition-colors text-sm sm:text-base min-h-[48px] sm:min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F5F1E8] overflow-x-hidden">
      {/* Screen reader announcements */}
      <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      
      {/* Header */}
      <div className="bg-white border-b border-[#1A2332]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] active:text-[#1A2332] transition-colors mb-3 sm:mb-4 min-h-[44px] -ml-1 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-white rounded-lg px-2"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base">Back</span>
          </button>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#B8826D]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#B8826D]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332]">Contact Us</h1>
              <p className="text-[#1A2332]/60 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">We are here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 pb-8 sm:pb-12">
        {/* Single column on mobile, sidebar on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {submitStatus === 'success' ? (
              <div className="bg-white rounded-xl p-5 sm:p-6 md:p-8 border border-[#8B9D83]/30 text-center" role="status" aria-live="polite">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#8B9D83]/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#8B9D83]" aria-hidden="true" />
                </div>
                <h2 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-2">Thank you</h2>
                <p className="text-[#1A2332]/70 mb-5 sm:mb-6 text-sm sm:text-base leading-relaxed">
                  Your message has been received. We read every message and will reply as soon as we can.
                </p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#1A2332] text-white rounded-lg hover:bg-[#1A2332]/90 active:bg-[#1A2332]/80 transition-colors min-h-[48px] text-base focus:outline-none focus:ring-2 focus:ring-[#1A2332] focus:ring-offset-2 focus:ring-offset-white"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 border border-[#1A2332]/10">
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <p className="text-[#1A2332]/70 leading-relaxed text-sm sm:text-base">
                    If you need help, steward assistance, or have a question, you can send us a note here.
                  </p>
                </div>

                {/* Error Summary */}
                {hasErrors && allTouched && (
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

                {submitStatus === 'error' && (
                  <div 
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
                  >
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-red-700 font-medium text-sm sm:text-base">Unable to send message</p>
                      <p className="text-red-600 text-xs sm:text-sm mt-0.5 sm:mt-1 break-words">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs sm:text-sm font-medium text-[#1A2332] mb-1.5 sm:mb-2">
                      Name <span className="text-[#B8826D]" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      id="contact-name"
                      name="name"
                      required
                      aria-required="true"
                      aria-invalid={errors.name ? 'true' : 'false'}
                      aria-describedby={errors.name && touched.name ? 'contact-name-error' : 'contact-name-hint'}
                      autoComplete="name"
                      inputMode="text"
                      enterKeyHint="next"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleInputFocus}
                      className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-[#F5F1E8] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 text-[#1A2332] min-h-[48px] text-base box-border ${
                        errors.name && touched.name ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                      }`}
                      placeholder="Your name"
                      disabled={isSubmitting}
                    />
                    <span id="contact-name-hint" className="sr-only">Enter your full name</span>
                    {errors.name && touched.name && (
                      <p id="contact-name-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>


                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs sm:text-sm font-medium text-[#1A2332] mb-1.5 sm:mb-2">
                      Email <span className="text-[#B8826D]" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      ref={emailInputRef}
                      type="email"
                      id="contact-email"
                      name="email"
                      required
                      aria-required="true"
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email && touched.email ? 'contact-email-error' : 'contact-email-hint'}
                      autoComplete="email"
                      inputMode="email"
                      enterKeyHint="next"

                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleInputFocus}
                      className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-[#F5F1E8] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 text-[#1A2332] min-h-[48px] text-base box-border ${
                        errors.email && touched.email ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                      }`}
                      placeholder="your.email@example.com"
                      disabled={isSubmitting}
                    />
                    <span id="contact-email-hint" className="sr-only">Enter your email address so we can reply</span>
                    {errors.email && touched.email && (
                      <p id="contact-email-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs sm:text-sm font-medium text-[#1A2332] mb-1.5 sm:mb-2">
                      Subject <span className="text-[#B8826D]" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      ref={subjectInputRef}
                      type="text"
                      id="contact-subject"
                      name="subject"
                      aria-required="true"
                      aria-invalid={errors.subject ? 'true' : 'false'}
                      aria-describedby={errors.subject && touched.subject ? 'contact-subject-error' : 'contact-subject-hint'}
                      inputMode="text"
                      enterKeyHint="next"
                      value={formData.subject}

                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleInputFocus}
                      className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-[#F5F1E8] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 text-[#1A2332] min-h-[48px] text-base box-border ${
                        errors.subject && touched.subject ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                      }`}
                      placeholder="What is this about?"
                      disabled={isSubmitting}
                    />
                    <span id="contact-subject-hint" className="sr-only">Enter a brief subject for your message</span>
                    {errors.subject && touched.subject && (
                      <p id="contact-subject-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-xs sm:text-sm font-medium text-[#1A2332] mb-1.5 sm:mb-2">
                      Message <span className="text-[#B8826D]" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <textarea
                      ref={messageInputRef}
                      id="contact-message"
                      name="message"
                      required
                      aria-required="true"
                      aria-invalid={errors.message ? 'true' : 'false'}
                      aria-describedby={errors.message && touched.message ? 'contact-message-error' : 'contact-message-hint'}
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleInputFocus}
                      rows={5}
                      className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-[#F5F1E8] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 text-[#1A2332] resize-none min-h-[120px] sm:min-h-[140px] text-base box-border ${
                        errors.message && touched.message ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                      }`}
                      placeholder="How can we help?"
                      disabled={isSubmitting}
                    />
                    <span id="contact-message-hint" className="sr-only">Enter your message or question</span>
                    {errors.message && touched.message && (
                      <p id="contact-message-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit - in flow, not pinned */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-describedby="contact-submit-hint"
                      className="w-full py-3.5 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 active:bg-[#B8826D]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[52px] text-base focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin flex-shrink-0" aria-hidden="true" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2 flex-shrink-0" aria-hidden="true" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                    <p id="contact-submit-hint" className="sr-only">Send your message to the SWOR team</p>
                  </div>
                </form>

                <p className="mt-4 text-xs sm:text-sm text-[#1A2332]/50 text-center leading-relaxed">
                  We read every message. Response times may vary, but we will reply as soon as we can.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - shows first on mobile */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Quick Links */}
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-[#1A2332]/10">
              <h3 className="font-medium text-[#1A2332] mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#B8826D] flex-shrink-0" aria-hidden="true" />
                Quick Links
              </h3>
              <nav aria-label="Quick links" className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => onNavigate('help')}
                  className="w-full text-left px-3 sm:px-4 py-3 rounded-lg bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 active:bg-[#F5F1E8]/70 transition-colors min-h-[56px] sm:min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
                >
                  <p className="font-medium text-[#1A2332] text-sm">Help Guides</p>
                  <p className="text-xs text-[#1A2332]/60 mt-0.5">Find answers to common questions</p>
                </button>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="w-full text-left px-3 sm:px-4 py-3 rounded-lg bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 active:bg-[#F5F1E8]/70 transition-colors min-h-[56px] sm:min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
                >
                  <p className="font-medium text-[#1A2332] text-sm">How It Works</p>
                  <p className="text-xs text-[#1A2332]/60 mt-0.5">Learn about Rugby Journeys</p>
                </button>
                <button
                  onClick={() => onNavigate('contribute')}
                  className="w-full text-left px-3 sm:px-4 py-3 rounded-lg bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 active:bg-[#F5F1E8]/70 transition-colors min-h-[56px] sm:min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
                >
                  <p className="font-medium text-[#1A2332] text-sm">Contribute</p>
                  <p className="text-xs text-[#1A2332]/60 mt-0.5">Start or add to a journey</p>
                </button>
              </nav>
            </div>

            {/* Response Time */}
            <div className="bg-[#8B9D83]/10 rounded-xl p-4 sm:p-5 md:p-6 border border-[#8B9D83]/20">
              <div className="flex items-center mb-2 sm:mb-3">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 flex-shrink-0" aria-hidden="true" />
                <h3 className="font-medium text-[#1A2332] text-sm sm:text-base">Response Times</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                We aim to respond to all messages within 2 to 3 working days. For urgent matters, 
                please mention this in your subject line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
