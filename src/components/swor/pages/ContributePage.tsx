import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Check, Upload, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface ContributePageProps {
  onNavigate: (page: string) => void;
}

// Role options for multi-select
const roleOptions = [
  { id: 'player', label: 'Player', description: 'Played at any level' },
  { id: 'coach', label: 'Coach', description: 'Coached or mentored players' },
  { id: 'referee', label: 'Referee or Official', description: 'Match official at any level' },
  { id: 'administrator', label: 'Administrator', description: 'Club or union administration' },
  { id: 'volunteer', label: 'Volunteer', description: 'Supported the game in any capacity' },
  { id: 'supporter', label: 'Supporter', description: 'Fan, family member, community supporter' },
  { id: 'medical', label: 'Medical or Welfare', description: 'Physio, doctor, welfare officer' },
  { id: 'media', label: 'Media or Storyteller', description: 'Journalist, photographer, broadcaster' },
  { id: 'groundskeeper', label: 'Groundskeeper', description: 'Maintained pitches and facilities' },
  { id: 'sponsor', label: 'Sponsor or Supporter', description: 'Business or individual supporter' },
  { id: 'other', label: 'Other', description: 'Another role in rugby' },
];

const ContributePage: React.FC<ContributePageProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<'type' | 'form' | 'review' | 'complete'>('type');
  const [journeyType, setJourneyType] = useState<'individual' | 'collective' | 'event' | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['identity']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Identity & Context
    name: '',
    country: '',
    era: '',
    
    // Roles (multi-select)
    roles: [] as string[],
    otherRole: '',
    
    // Your Words
    shortStory: '',
    whatRugbyMeans: '',
    
    // Links & Sources
    links: [''],
    
    // Image
    hasImage: false,
    imageRights: false,
    
    // Acknowledgements
    acknowledgements: '',
    
    // Visibility & Permissions
    visibility: 'public' as 'public' | 'private' | 'family',
    aiAssistance: true,
  });

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  
  // Screen reader announcement ref
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce to screen readers
  const announce = useCallback((message: string, assertive: boolean = false) => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
      announcementRef.current.textContent = '';
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

  // Validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Please enter a name for this journey.';
        if (value.trim().length < 2) return 'Name should be at least 2 characters.';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;
    return newErrors;
  };

  // Handle field blur
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  const updateLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link)
    }));
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ name: true });
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      announce('There was a problem. Please review the highlighted fields.', true);
      return;
    }
    
    setIsSubmitting(true);
    announce('Submitting…');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    setCurrentStep('review');
    announce('Review your journey before publishing.');
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    announce('Publishing…');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    setCurrentStep('complete');
    announce('Your journey is now live.');
  };

  const hasErrors = Object.keys(errors).length > 0;

  // Journey Type Selection
  if (currentStep === 'type') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
        {/* Screen reader announcements */}
        <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
            Stage 1: Core Journey
          </p>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1A2332] mb-2 sm:mb-3 md:mb-4">
            Begin Your Rugby Journey
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
            Choose the type of journey you would like to document. You can always add more detail later.
          </p>

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 md:mb-12" role="list" aria-label="Journey types">
            {/* Individual Journey - Links to Profile Builder */}
            <button
              onClick={() => onNavigate('profile-builder')}
              className="w-full bg-white hover:bg-[#1A2332] active:bg-[#1A2332] rounded-xl p-4 sm:p-5 md:p-6 text-left transition-all duration-300 group border-2 border-transparent hover:border-[#B8826D] min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
              role="listitem"
              aria-label="Your Rugby Journey: For individuals. Recommended option."
            >
              <div className="flex flex-col">
                <span className="text-xs text-[#8B9D83] bg-[#8B9D83]/10 px-2 py-1 rounded self-start mb-2 sm:mb-3 group-hover:bg-[#F5F1E8]/20 group-hover:text-[#F5F1E8]">
                  Recommended
                </span>
                <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332] group-hover:text-[#F5F1E8] mb-1.5 sm:mb-2">
                  Your Rugby Journey
                </h3>
                <p className="text-[#1A2332]/60 group-hover:text-[#F5F1E8]/70 text-xs sm:text-sm md:text-base leading-relaxed">
                  For individuals. Players, coaches, referees, volunteers, supporters, and anyone whose life has been shaped by rugby.
                </p>
              </div>
            </button>


            <button
              onClick={() => {
                setJourneyType('collective');
                setCurrentStep('form');
              }}
              className="w-full bg-white hover:bg-[#1A2332] rounded-xl p-4 sm:p-5 md:p-6 text-left transition-all duration-300 group opacity-60 cursor-not-allowed min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
              disabled
              role="listitem"
              aria-label="Our Rugby Journey: For organisations. Coming soon."
              aria-disabled="true"
            >
              <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332] group-hover:text-[#F5F1E8] mb-1.5 sm:mb-2">
                Our Rugby Journey
              </h3>
              <p className="text-[#1A2332]/60 group-hover:text-[#F5F1E8]/70 text-xs sm:text-sm md:text-base leading-relaxed">
                For clubs, schools, charities, organisations, media, and archives.
              </p>
              <p className="text-xs text-[#B8826D] mt-1.5 sm:mt-2">Coming in a future update</p>
            </button>

            <button
              onClick={() => {
                setJourneyType('event');
                setCurrentStep('form');
              }}
              className="w-full bg-white hover:bg-[#1A2332] rounded-xl p-4 sm:p-5 md:p-6 text-left transition-all duration-300 group opacity-60 cursor-not-allowed min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
              disabled
              role="listitem"
              aria-label="The Journey of: For events. Coming soon."
              aria-disabled="true"
            >
              <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332] group-hover:text-[#F5F1E8] mb-1.5 sm:mb-2">
                The Journey of...
              </h3>
              <p className="text-[#1A2332]/60 group-hover:text-[#F5F1E8]/70 text-xs sm:text-sm md:text-base leading-relaxed">
                For events, tournaments, initiatives, and significant moments.
              </p>
              <p className="text-xs text-[#B8826D] mt-1.5 sm:mt-2">Coming in a future update</p>
            </button>
          </div>

          {/* Read the full explainer */}
          <div className="text-center">
            <button
              onClick={() => onNavigate('how-it-works')}
              className="swor-link inline-flex items-center text-xs sm:text-sm md:text-base min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              Read the full explainer
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Review Step
  if (currentStep === 'review') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
        {/* Screen reader announcements */}
        <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 pb-8 sm:pb-12">
          <button
            onClick={() => setCurrentStep('form')}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] active:text-[#1A2332] mb-5 sm:mb-6 md:mb-8 transition-colors min-h-[44px] -ml-1 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] rounded-lg px-2"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base">Back to edit</span>
          </button>

          <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
            Review Your Journey
          </p>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-2 sm:mb-3 md:mb-4">
            Check everything looks right
          </h1>
          <p className="text-[#1A2332]/70 mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base leading-relaxed">
            Nothing will be published until you approve it.
          </p>

          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 mb-5 sm:mb-6 md:mb-8" role="region" aria-label="Journey preview">
            <h2 className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A2332] mb-4 sm:mb-5 md:mb-6 break-words">{formData.name}</h2>
            
            <dl className="space-y-4 sm:space-y-5 md:space-y-6">
              <div>
                <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-1">Country / Region</dt>
                <dd className="text-[#1A2332] text-sm sm:text-base break-words">{formData.country || 'Not specified'}</dd>
              </div>
              
              <div>
                <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-1">Era</dt>
                <dd className="text-[#1A2332] text-sm sm:text-base break-words">{formData.era || 'Not specified'}</dd>
              </div>
              
              <div>
                <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-2">Roles in Rugby</dt>
                <dd className="flex flex-wrap gap-1.5 sm:gap-2">
                  {formData.roles.length > 0 ? formData.roles.map(roleId => {
                    const role = roleOptions.find(r => r.id === roleId);
                    return (
                      <span key={roleId} className="px-2 sm:px-2.5 md:px-3 py-1 bg-[#8B9D83]/20 text-[#1A2332] rounded-full text-xs sm:text-sm">
                        {role?.label || roleId}
                      </span>
                    );
                  }) : <span className="text-[#1A2332]/60 text-sm">Not specified</span>}
                </dd>
              </div>
              
              {formData.shortStory && (
                <div>
                  <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-1">Your Story</dt>
                  <dd className="text-[#1A2332] whitespace-pre-wrap text-xs sm:text-sm md:text-base leading-relaxed break-words">{formData.shortStory}</dd>
                </div>
              )}
              
              {formData.whatRugbyMeans && (
                <div>
                  <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-1">What Rugby Means to You</dt>
                  <dd className="text-[#1A2332] whitespace-pre-wrap text-xs sm:text-sm md:text-base leading-relaxed break-words">{formData.whatRugbyMeans}</dd>
                </div>
              )}
              
              {formData.acknowledgements && (
                <div>
                  <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-1">Acknowledgements</dt>
                  <dd className="text-[#1A2332] whitespace-pre-wrap text-xs sm:text-sm md:text-base leading-relaxed break-words">{formData.acknowledgements}</dd>
                </div>
              )}
              
              {formData.links.filter(l => l).length > 0 && (
                <div>
                  <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-2">Links & References</dt>
                  <dd>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {formData.links.filter(l => l).map((link, i) => (
                        <li key={i} className="overflow-hidden">
                          <a href={link} target="_blank" rel="noopener noreferrer" className="swor-link text-xs sm:text-sm break-all">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              
              <div>
                <dt className="text-xs sm:text-sm text-[#1A2332]/60 mb-1">Visibility</dt>
                <dd className="text-[#1A2332] capitalize text-sm sm:text-base">{formData.visibility}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={() => setCurrentStep('form')}
              disabled={isSubmitting}
              className="swor-btn-outline flex-1 text-sm sm:text-base min-h-[48px] sm:min-h-[52px] order-2 sm:order-1 focus:outline-none focus:ring-2 focus:ring-[#1A2332] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="swor-btn-primary flex-1 text-sm sm:text-base min-h-[48px] sm:min-h-[52px] order-1 sm:order-2 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publishing…
                </>
              ) : (
                'Approve and Publish'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete Step
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
        {/* Screen reader announcements */}
        <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-[#8B9D83] flex items-center justify-center mx-auto mb-5 sm:mb-6 md:mb-8" role="status" aria-label="Success">
            <Check className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#F5F1E8]" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#1A2332] mb-2 sm:mb-3 md:mb-4">
            Your Journey is Live
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#1A2332]/70 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
            Thank you for contributing to SWOR. Your rugby journey is now part of the archive.
          </p>
          
          <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 mb-5 sm:mb-6 md:mb-8 text-left">
            <h3 className="font-serif text-base sm:text-lg text-[#1A2332] mb-3 sm:mb-4">What happens next?</h3>
            <ul className="space-y-2.5 sm:space-y-3 text-[#1A2332]/70" role="list">
              <li className="flex items-start" role="listitem">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 sm:mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-sm md:text-base">Share your journey with family and friends</span>
              </li>
              <li className="flex items-start" role="listitem">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 sm:mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-sm md:text-base">Invite others to add context to your story</span>
              </li>
              <li className="flex items-start" role="listitem">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 sm:mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-sm md:text-base">Return anytime to add more detail (Stage 3)</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
            <button
              onClick={() => onNavigate('journeys')}
              className="swor-btn-primary text-sm sm:text-base min-h-[48px] sm:min-h-[52px] w-full sm:w-auto px-5 sm:px-6 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
            >
              Explore Rugby Journeys
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="swor-btn-outline text-sm sm:text-base min-h-[48px] sm:min-h-[52px] w-full sm:w-auto px-5 sm:px-6 focus:outline-none focus:ring-2 focus:ring-[#1A2332] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
            >
              Return Home
            </button>
          </div>
          
          {/* Read the full explainer */}
          <div className="mt-6 sm:mt-8 md:mt-12">
            <button
              onClick={() => onNavigate('how-it-works')}
              className="swor-link inline-flex items-center text-xs sm:text-sm min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              Read the full explainer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form Step
  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-24 overflow-x-hidden">
      {/* Screen reader announcements */}
      <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 pb-8 sm:pb-12">
        <button
          onClick={() => setCurrentStep('type')}
          className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] active:text-[#1A2332] mb-5 sm:mb-6 md:mb-8 transition-colors min-h-[44px] -ml-1 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] rounded-lg px-2"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm sm:text-base">Back to journey type</span>
        </button>

        <p className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
          Stage 1: Core Journey
        </p>
        <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A2332] mb-2 sm:mb-3 md:mb-4">
          {journeyType === 'individual' && 'Your Rugby Journey'}
          {journeyType === 'collective' && 'Our Rugby Journey'}
          {journeyType === 'event' && 'The Journey of...'}
        </h1>
        <p className="text-[#1A2332]/70 mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base leading-relaxed">
          Complete what you can. Everything can be edited later.
        </p>

        {/* Error Summary */}
        {hasErrors && touched.name && (
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

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6" noValidate>
          {/* Identity & Context */}
          <div className="bg-white rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('identity')}
              aria-expanded={expandedSections.includes('identity')}
              aria-controls="identity-section"
              className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left min-h-[56px] sm:min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
            >
              <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332]">Identity and Context</h2>
              {expandedSections.includes('identity') ? (
                <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              )}
            </button>
            
            {expandedSections.includes('identity') && (
              <div id="identity-section" className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 space-y-4">
                <div>
                  <label htmlFor="contribute-name" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                    {journeyType === 'individual' ? 'Your Name' : journeyType === 'collective' ? 'Organisation Name' : 'Event or Moment Name'}
                    {' '}<span className="text-[#B8826D]" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    id="contribute-name"
                    name="name"
                    required
                    aria-required="true"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name && touched.name ? 'contribute-name-error' : 'contribute-name-hint'}
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (touched.name) {
                        const error = validateField('name', e.target.value);
                        setErrors(prev => {
                          if (error) return { ...prev, name: error };
                          const newErrors = { ...prev };
                          delete newErrors.name;
                          return newErrors;
                        });
                      }
                    }}
                    onBlur={handleBlur}
                    onFocus={handleInputFocus}
                    className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border ${
                      errors.name && touched.name ? 'border-[#B8826D]' : 'border-[#1A2332]/20'
                    }`}
                    placeholder={journeyType === 'individual' ? 'Full name as you would like it to appear' : 'Name of the organisation or event'}
                    disabled={isSubmitting}
                  />
                  <span id="contribute-name-hint" className="sr-only">Enter the name as you would like it to appear on your journey</span>
                  {errors.name && touched.name && (
                    <p id="contribute-name-error" className="mt-1.5 text-xs sm:text-sm text-[#B8826D] break-words" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>
                
                {/* Single column on mobile */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                  <div>
                    <label htmlFor="contribute-country" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                      Country or Region <span className="text-[#1A2332]/40">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="contribute-country"
                      name="country"
                      aria-describedby="contribute-country-hint"
                      autoComplete="country-name"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      onFocus={handleInputFocus}
                      className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border"
                      placeholder="e.g., England, New South Wales"
                      disabled={isSubmitting}
                    />
                    <span id="contribute-country-hint" className="sr-only">Optionally enter your country or region</span>
                  </div>
                  <div>
                    <label htmlFor="contribute-era" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                      Era or Time Period <span className="text-[#1A2332]/40">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="contribute-era"
                      name="era"
                      aria-describedby="contribute-era-hint"
                      value={formData.era}
                      onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                      onFocus={handleInputFocus}
                      className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border"
                      placeholder="e.g., 1980s, 2010-present"
                      disabled={isSubmitting}
                    />
                    <span id="contribute-era-hint" className="sr-only">Optionally enter the era or time period of your journey</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Roles in Rugby */}
          {journeyType === 'individual' && (
            <div className="bg-white rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('roles')}
                aria-expanded={expandedSections.includes('roles')}
                aria-controls="roles-section"
                className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left min-h-[56px] sm:min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332]">Roles in Rugby</h2>
                  <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-0.5 sm:mt-1">Select all that apply. Multiple roles are welcome.</p>
                </div>
                {expandedSections.includes('roles') ? (
                  <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" aria-hidden="true" />
                )}
              </button>
              
              {expandedSections.includes('roles') && (
                <div id="roles-section" className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                  <fieldset>
                    <legend className="sr-only">Select your roles in rugby</legend>
                    {/* Single column on mobile, 2 columns on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3" role="group" aria-label="Rugby roles">
                      {roleOptions.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          aria-pressed={formData.roles.includes(role.id)}
                          className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-all min-h-[60px] sm:min-h-[68px] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 ${
                            formData.roles.includes(role.id)
                              ? 'border-[#B8826D] bg-[#B8826D]/5'
                              : 'border-[#1A2332]/10 hover:border-[#1A2332]/20'
                          }`}
                          disabled={isSubmitting}
                        >
                          <span className="block font-medium text-[#1A2332] text-sm sm:text-base">{role.label}</span>
                          <span className="block text-xs sm:text-sm text-[#1A2332]/60 mt-0.5">{role.description}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  
                  {formData.roles.includes('other') && (
                    <div className="mt-4">
                      <label htmlFor="contribute-other-role" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                        Please describe your role
                      </label>
                      <input
                        type="text"
                        id="contribute-other-role"
                        name="otherRole"
                        aria-describedby="contribute-other-role-hint"
                        value={formData.otherRole}
                        onChange={(e) => setFormData({ ...formData, otherRole: e.target.value })}
                        onFocus={handleInputFocus}
                        className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border"
                        placeholder="Describe your role in rugby"
                        disabled={isSubmitting}
                      />
                      <span id="contribute-other-role-hint" className="sr-only">Describe your other role in rugby</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Your Words */}
          <div className="bg-white rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('words')}
              aria-expanded={expandedSections.includes('words')}
              aria-controls="words-section"
              className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left min-h-[56px] sm:min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
            >
              <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332]">Your Words</h2>
              {expandedSections.includes('words') ? (
                <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              )}
            </button>
            
            {expandedSections.includes('words') && (
              <div id="words-section" className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 space-y-4">
                <div>
                  <label htmlFor="contribute-story" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                    {journeyType === 'individual' ? 'Your Rugby Story' : journeyType === 'collective' ? 'The Story of This Organisation' : 'The Story of This Event'}
                    {' '}<span className="text-[#1A2332]/40">(optional)</span>
                  </label>
                  <textarea
                    id="contribute-story"
                    name="shortStory"
                    rows={5}
                    aria-describedby="contribute-story-hint"
                    value={formData.shortStory}
                    onChange={(e) => setFormData({ ...formData, shortStory: e.target.value })}
                    onFocus={handleInputFocus}
                    className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] resize-none text-base min-h-[120px] sm:min-h-[140px] box-border"
                    placeholder="Share as much or as little as you like. There is no wrong answer."
                    disabled={isSubmitting}
                  />
                  <span id="contribute-story-hint" className="sr-only">Share your rugby story in your own words</span>
                </div>
                
                <div>
                  <label htmlFor="contribute-meaning" className="block text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-1.5 sm:mb-2">
                    What does rugby mean to you? <span className="text-[#1A2332]/40">(optional)</span>
                  </label>
                  <textarea
                    id="contribute-meaning"
                    name="whatRugbyMeans"
                    rows={3}
                    aria-describedby="contribute-meaning-hint"
                    value={formData.whatRugbyMeans}
                    onChange={(e) => setFormData({ ...formData, whatRugbyMeans: e.target.value })}
                    onFocus={handleInputFocus}
                    className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] resize-none text-base min-h-[80px] sm:min-h-[100px] box-border"
                    placeholder="A sentence or two is fine."
                    disabled={isSubmitting}
                  />
                  <span id="contribute-meaning-hint" className="sr-only">Share what rugby means to you</span>
                </div>
              </div>
            )}
          </div>

          {/* Acknowledgements */}
          <div className="bg-white rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('acknowledgements')}
              aria-expanded={expandedSections.includes('acknowledgements')}
              aria-controls="acknowledgements-section"
              className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left min-h-[56px] sm:min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
            >
              <div className="min-w-0 flex-1 mr-3">
                <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332]">Acknowledgements</h2>
                <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-0.5 sm:mt-1">Who helped you along the way?</p>
              </div>
              {expandedSections.includes('acknowledgements') ? (
                <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" aria-hidden="true" />
              )}
            </button>
            
            {expandedSections.includes('acknowledgements') && (
              <div id="acknowledgements-section" className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                <label htmlFor="contribute-acknowledgements" className="sr-only">Acknowledgements</label>
                <textarea
                  id="contribute-acknowledgements"
                  name="acknowledgements"
                  rows={4}
                  aria-describedby="contribute-acknowledgements-hint"
                  value={formData.acknowledgements}
                  onChange={(e) => setFormData({ ...formData, acknowledgements: e.target.value })}
                  onFocus={handleInputFocus}
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] resize-none text-base min-h-[100px] sm:min-h-[120px] box-border"
                  placeholder="Clubs, coaches, teammates, family, communities, organisations that supported your journey..."
                  disabled={isSubmitting}
                />
                <p id="contribute-acknowledgements-hint" className="text-xs sm:text-sm text-[#1A2332]/60 mt-2 leading-relaxed">
                  Acknowledgement does not imply endorsement. It simply recognises contribution.
                </p>
              </div>
            )}
          </div>

          {/* Links & Sources */}
          <div className="bg-white rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('links')}
              aria-expanded={expandedSections.includes('links')}
              aria-controls="links-section"
              className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left min-h-[56px] sm:min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
            >
              <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332]">Links and Sources</h2>
              {expandedSections.includes('links') ? (
                <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              )}
            </button>
            
            {expandedSections.includes('links') && (
              <div id="links-section" className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 space-y-4">
                {formData.links.map((link, index) => (
                  <div key={index} className="space-y-2 sm:space-y-0 sm:flex sm:gap-2">
                    <label htmlFor={`contribute-link-${index}`} className="sr-only">Link {index + 1}</label>
                    <input
                      type="url"
                      id={`contribute-link-${index}`}
                      inputMode="url"
                      aria-describedby="contribute-links-hint"
                      value={link}
                      onChange={(e) => updateLink(index, e.target.value)}
                      onFocus={handleInputFocus}
                      className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-[#1A2332] placeholder-[#1A2332]/40 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-base min-h-[48px] box-border flex-1"
                      placeholder="https://..."
                      disabled={isSubmitting}
                    />
                    {formData.links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="w-full sm:w-auto px-4 py-2.5 text-[#1A2332]/60 hover:text-[#1A2332] hover:bg-[#F5F1E8] active:bg-[#F5F1E8] rounded-lg transition-colors text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#B8826D]"
                        disabled={isSubmitting}
                        aria-label={`Remove link ${index + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addLink}
                  className="text-[#B8826D] text-sm font-medium hover:text-[#B8826D]/80 active:text-[#B8826D]/70 min-h-[44px] px-1 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 rounded-lg"
                  disabled={isSubmitting}
                >
                  + Add another link
                </button>
                
                {/* Contributor reassurance microcopy */}
                <div id="contribute-links-hint" className="bg-[#8B9D83]/10 rounded-lg p-3 sm:p-4 flex items-start">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#8B9D83] mr-2 sm:mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                    Links you share are remembered to help later. Nothing is added or published without your approval.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Primary Image */}
          <div className="bg-white rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('image')}
              aria-expanded={expandedSections.includes('image')}
              aria-controls="image-section"
              className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left min-h-[56px] sm:min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
            >
              <div className="min-w-0 flex-1 mr-3">
                <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332]">Primary Image</h2>
                <p className="text-xs sm:text-sm text-[#1A2332]/60 mt-0.5 sm:mt-1">Optional</p>
              </div>
              {expandedSections.includes('image') ? (
                <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0" aria-hidden="true" />
              )}
            </button>
            
            {expandedSections.includes('image') && (
              <div id="image-section" className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                <div 
                  className="border-2 border-dashed border-[#1A2332]/20 rounded-lg p-5 sm:p-6 md:p-8 text-center cursor-pointer hover:border-[#B8826D]/50 transition-colors focus-within:ring-2 focus-within:ring-[#B8826D]"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload an image"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // Trigger file input
                    }
                  }}
                >
                  <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-[#1A2332]/30 mx-auto mb-3 sm:mb-4" aria-hidden="true" />
                  <p className="text-[#1A2332]/60 mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">Drag and drop an image, or click to browse</p>
                  <p className="text-xs sm:text-sm text-[#1A2332]/40">JPG, PNG, or WebP. Max 5MB.</p>
                </div>
                
                {/* Larger clickable area for checkbox */}
                <label className="flex items-start mt-4 cursor-pointer p-3 -mx-3 rounded-lg hover:bg-[#F5F1E8] active:bg-[#F5F1E8] transition-colors min-h-[52px] focus-within:ring-2 focus-within:ring-[#B8826D]">
                  <input
                    type="checkbox"
                    id="contribute-image-rights"
                    checked={formData.imageRights}
                    onChange={(e) => setFormData({ ...formData, imageRights: e.target.checked })}
                    className="mt-0.5 mr-3 w-5 h-5 flex-shrink-0 accent-[#B8826D] focus:ring-2 focus:ring-[#B8826D]"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs sm:text-sm text-[#1A2332]/70 leading-relaxed">
                    I confirm I have the right to share this image and grant SWOR permission to display it.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Visibility & Permissions */}
          <div className="bg-white rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('visibility')}
              aria-expanded={expandedSections.includes('visibility')}
              aria-controls="visibility-section"
              className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left min-h-[56px] sm:min-h-[64px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-inset"
            >
              <h2 className="font-serif text-base sm:text-lg md:text-xl text-[#1A2332]">Visibility and Permissions</h2>
              {expandedSections.includes('visibility') ? (
                <ChevronUp className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#1A2332]/40 flex-shrink-0 ml-2" aria-hidden="true" />
              )}
            </button>
            
            {expandedSections.includes('visibility') && (
              <div id="visibility-section" className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 space-y-4">
                <fieldset>
                  <legend className="text-xs sm:text-sm font-medium text-[#1A2332]/80 mb-2">Who can see this journey?</legend>
                  <div className="space-y-2" role="radiogroup">
                    {[
                      { value: 'public', label: 'Public', description: 'Anyone can view' },
                      { value: 'private', label: 'Private', description: 'Only you can view' },
                      { value: 'family', label: 'Family and Friends', description: 'Only people you invite' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-start cursor-pointer p-3 rounded-lg hover:bg-[#F5F1E8] active:bg-[#F5F1E8] transition-colors min-h-[56px] focus-within:ring-2 focus-within:ring-[#B8826D]">
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={formData.visibility === option.value}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                          className="mt-0.5 mr-3 w-5 h-5 flex-shrink-0 accent-[#B8826D] focus:ring-2 focus:ring-[#B8826D]"
                          disabled={isSubmitting}
                        />
                        <div className="min-w-0">
                          <span className="block font-medium text-[#1A2332] text-sm sm:text-base">{option.label}</span>
                          <span className="block text-xs sm:text-sm text-[#1A2332]/60">{option.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>
                
                <label className="flex items-start cursor-pointer p-3 rounded-lg hover:bg-[#F5F1E8] active:bg-[#F5F1E8] transition-colors min-h-[64px] focus-within:ring-2 focus-within:ring-[#B8826D]">
                  <input
                    type="checkbox"
                    id="contribute-ai-assistance"
                    checked={formData.aiAssistance}
                    onChange={(e) => setFormData({ ...formData, aiAssistance: e.target.checked })}
                    className="mt-0.5 mr-3 w-5 h-5 flex-shrink-0 accent-[#B8826D] focus:ring-2 focus:ring-[#B8826D]"
                    disabled={isSubmitting}
                  />
                  <div className="min-w-0">
                    <span className="block font-medium text-[#1A2332] text-sm sm:text-base">AI Assistance</span>
                    <span className="block text-xs sm:text-sm text-[#1A2332]/60 leading-relaxed">
                      Allow AI to help organise and suggest improvements to your journey. 
                      You always approve changes before they are published.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Submit - in flow, not pinned */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              aria-describedby="contribute-submit-hint"
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-[#B8826D] text-[#F5F1E8] font-medium rounded-lg hover:bg-[#B8826D]/90 active:bg-[#B8826D]/80 transition-colors text-base min-h-[52px] sm:min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting…
                </>
              ) : (
                'Review Your Journey'
              )}
            </button>
            <p id="contribute-submit-hint" className="sr-only">Review your journey before publishing</p>
            
            <p className="text-center text-xs sm:text-sm text-[#1A2332]/60 mt-3 sm:mt-4 leading-relaxed">
              You will be able to review and edit before publishing.
            </p>
            
            {/* Read the full explainer */}
            <div className="text-center mt-4 sm:mt-5 md:mt-6">
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="swor-link inline-flex items-center text-xs sm:text-sm min-h-[44px] px-2 focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2 focus:ring-offset-[#F5F1E8] rounded-lg"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                Read the full explainer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContributePage;
