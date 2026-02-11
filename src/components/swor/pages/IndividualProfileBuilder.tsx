import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, User, Save, Eye, BookOpen, Shield, HelpCircle, Upload, PenLine, Settings, Camera, X, Check, Loader2, Image as ImageIcon, AlertCircle, Globe, Users, Heart, Lock, EyeOff, Send, MessageSquare, FileText, Clock, Undo2, CheckCircle, Calendar } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import ProfileGuidance from '../ProfileGuidance';
import OnboardingReassurance from '../OnboardingReassurance';
import ProfileSections from '../ProfileSections';
import StewardContact from '../StewardContact';
import VisibilitySelector, { VisibilityLevel } from '../VisibilitySelector';
import ContentStateIndicator, { ContentState } from '../ContentStateIndicator';
import StewardProfilePanel from '../StewardProfilePanel';
import CommendationsList from '../CommendationsList';
import ArchiveUploadSection from '../ArchiveUploadSection';
import PhotoCropModal from '../PhotoCropModal';
import MilestoneEditor from '../MilestoneEditor';
import SectionGuidance from '../SectionGuidance';
import { reassuranceCopy } from '@/data/guidanceRecords';



interface IndividualProfileBuilderProps {
  journeyId?: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

interface ArchiveItem {
  id: string;
  item_type: 'image' | 'document';
  title: string;
  description?: string;
  date_approximate?: string;
  visibility: string;
  source_attribution?: string;
  storage_path?: string;
  mime_type?: string;
  file_size?: number;
  status: string;
  display_order: number;
  signed_url?: string;
  thumb_signed_url?: string;
}

interface ProfileData {
  id?: string;
  full_name: string;
  known_as: string;
  title: string;
  introduction: string;
  summary: string;
  country: string;
  region: string;
  era: string;
  birth_year: string;
  roles: string[];
  visibility_default: VisibilityLevel;
  status: string;
  photo_url?: string;
  photo_alt_text?: string;
  photo_status?: string;
  core_journey: Record<string, any>;
  reflections_influences: Record<string, any>;
  archive_media: Record<string, any>;
  connections_acknowledgements: Record<string, any>;
  optional_additions: Record<string, any>;
  // PATCH B+ fields
  submitted_at?: string;
  steward_note?: string;
  steward_note_by?: string;
  steward_note_at?: string;
}

const defaultProfileData: ProfileData = {
  full_name: '',
  known_as: '',
  title: '',
  introduction: '',
  summary: '',
  country: '',
  region: '',
  era: '',
  birth_year: '',
  roles: [],
  visibility_default: 'draft',
  status: 'draft',
  core_journey: {},
  reflections_influences: {},
  archive_media: {},
  connections_acknowledgements: {},
  optional_additions: {}
};

type PreviewMode = 'none' | 'public' | 'connection' | 'family' | 'steward';

// PATCH E.3: Validation rules
const VALIDATION_RULES = {
  name: { required: true, minLength: 2 },
  introduction: { required: true, minLength: 50, maxLength: 1200 }
};

// PATCH E.3: Validation state interface
interface ValidationState {
  name: { valid: boolean; message: string | null; touched: boolean };
  introduction: { valid: boolean; message: string | null; touched: boolean };
}

const IndividualProfileBuilder: React.FC<IndividualProfileBuilderProps> = ({
  journeyId,
  onBack,
  onNavigate
}) => {
  const { user, isGlobalSteward } = useAppContext();
  const [showGuidance, setShowGuidance] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
  
  // Archive items state (PATCH B+)
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  
  // Submission workflow state (PATCH B+)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null);
  const [photoAltText, setPhotoAltText] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // PATCH E.3: Photo crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  
  // Preview mode
  const [previewMode, setPreviewMode] = useState<PreviewMode>('none');
  
  // PATCH E.3: Validation state
  const [validation, setValidation] = useState<ValidationState>({
    name: { valid: false, message: null, touched: false },
    introduction: { valid: false, message: null, touched: false }
  });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const validationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // PATCH F.2: Refs for focus management and screen reader announcements
  const titleInputRef = useRef<HTMLInputElement>(null);
  const introInputRef = useRef<HTMLTextAreaElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  
  // Steward assignments
  const [stewardAssignments, setStewardAssignments] = useState<Array<{ steward_name: string; steward_email?: string }>>([]);

  // PATCH F.2: Announce to screen readers
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


  const validateName = useCallback((value: string): { valid: boolean; message: string | null } => {
    const name = value.trim();
    if (!name) {
      return { valid: false, message: 'Please add a name or title for your journey.' };
    }
    if (name.length < VALIDATION_RULES.name.minLength) {
      return { valid: false, message: `Name should be at least ${VALIDATION_RULES.name.minLength} characters.` };
    }
    return { valid: true, message: null };
  }, []);

  // PATCH E.3: Validate introduction field
  const validateIntroduction = useCallback((value: string): { valid: boolean; message: string | null } => {
    const intro = value.trim();
    if (!intro) {
      return { valid: false, message: 'Please add a short introduction (at least 50 characters).' };
    }
    if (intro.length < VALIDATION_RULES.introduction.minLength) {
      return { valid: false, message: `Please add a bit more to your introduction (${intro.length}/${VALIDATION_RULES.introduction.minLength} characters).` };
    }
    return { valid: true, message: null };
  }, []);

  // PATCH E.3: Run validation with debounce
  const runValidation = useCallback(() => {
    const nameValue = profileData.title?.trim() || profileData.full_name?.trim() || '';
    const introValue = profileData.introduction?.trim() || '';
    
    const nameResult = validateName(nameValue);
    const introResult = validateIntroduction(introValue);
    
    setValidation(prev => ({
      name: { ...nameResult, touched: prev.name.touched },
      introduction: { ...introResult, touched: prev.introduction.touched }
    }));
  }, [profileData.title, profileData.full_name, profileData.introduction, validateName, validateIntroduction]);

  // PATCH E.3: Debounced validation on typing
  useEffect(() => {
    if (validationDebounceRef.current) {
      clearTimeout(validationDebounceRef.current);
    }
    validationDebounceRef.current = setTimeout(() => {
      runValidation();
    }, 300);
    
    return () => {
      if (validationDebounceRef.current) {
        clearTimeout(validationDebounceRef.current);
      }
    };
  }, [runValidation]);

  // PATCH E.3: Check if form is valid for submission
  const isFormValidForSubmission = useMemo(() => {
    const nameValue = profileData.title?.trim() || profileData.full_name?.trim() || '';
    const introValue = profileData.introduction?.trim() || '';
    
    const nameValid = nameValue.length >= VALIDATION_RULES.name.minLength;
    const introValid = introValue.length >= VALIDATION_RULES.introduction.minLength;
    
    return nameValid && introValid;
  }, [profileData.title, profileData.full_name, profileData.introduction]);

  // PATCH E.3: Readiness checklist items
  const readinessChecklist = useMemo(() => {
    const nameValue = profileData.title?.trim() || profileData.full_name?.trim() || '';
    const introValue = profileData.introduction?.trim() || '';
    
    return {
      name: nameValue.length >= VALIDATION_RULES.name.minLength,
      introduction: introValue.length >= VALIDATION_RULES.introduction.minLength,
      photo: !!(photoSignedUrl || photoPreview)
    };
  }, [profileData.title, profileData.full_name, profileData.introduction, photoSignedUrl, photoPreview]);

  // PATCH E.3: Character count helpers
  const introductionCharCount = profileData.introduction?.length || 0;
  const isNearIntroLimit = introductionCharCount > VALIDATION_RULES.introduction.maxLength * 0.9;

  // Check if profile is in a read-only state (PATCH B+)
  const isReadOnly = profileData.status === 'submitted_for_review';
  const needsChanges = profileData.status === 'needs_changes';

  // Check if first visit
  useEffect(() => {
    const visitKey = `swor_profile_builder_visited_${user?.id || 'guest'}`;
    const visited = localStorage.getItem(visitKey);
    if (visited === 'true') {
      setIsFirstVisit(false);
    }
  }, [user?.id]);


  // Load existing profile and archive items
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('swor-profile', {
          body: {
            action: 'get_profile',
            payload: { user_id: user.id }
          }
        });
        
        if (error) {
          console.error('Failed to load profile:', error);
          setIsLoading(false);
          return;
        }
        
        if (data?.success && data.profiles && data.profiles.length > 0) {
          const profile = data.profiles[0];
          setProfileData({
            id: profile.id,
            full_name: profile.full_name || '',
            known_as: profile.known_as || '',
            title: profile.title || '',
            introduction: profile.introduction || '',
            summary: profile.summary || '',
            country: profile.country || '',
            region: profile.region || '',
            era: profile.era || '',
            birth_year: profile.birth_year?.toString() || '',
            roles: profile.roles || [],
            visibility_default: profile.visibility_default || 'draft',
            status: profile.status || 'draft',
            photo_url: profile.photo_url || undefined,
            photo_alt_text: profile.photo_alt_text || undefined,
            photo_status: profile.photo_status || undefined,
            core_journey: profile.core_journey || {},
            reflections_influences: profile.reflections_influences || {},
            archive_media: profile.archive_media || {},
            connections_acknowledgements: profile.connections_acknowledgements || {},
            optional_additions: profile.optional_additions || {},
            // PATCH B+ fields
            submitted_at: profile.submitted_at || undefined,
            steward_note: profile.steward_note || undefined,
            steward_note_by: profile.steward_note_by || undefined,
            steward_note_at: profile.steward_note_at || undefined
          });
          
          if (profile.photo_signed_url) {
            setPhotoSignedUrl(profile.photo_signed_url);
          }
          if (profile.photo_alt_text) {
            setPhotoAltText(profile.photo_alt_text);
          }
          
          // Load archive items if profile exists
          if (profile.id) {
            loadArchiveItems(profile.id);
          }
          
          lastSavedDataRef.current = JSON.stringify(profile);
          setLastSaved(new Date(profile.updated_at));
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user?.id]);

  // Load archive items for the profile
  const loadArchiveItems = async (profileId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'get_archive_items',
          payload: { profile_id: profileId }
        }
      });
      
      if (error) {
        console.error('Failed to load archive items:', error);
        return;
      }
      
      if (data?.success && data.items) {
        setArchiveItems(data.items);
        // If there are items, mark archive as having content
        if (data.items.length > 0) {
          setProfileData(prev => ({
            ...prev,
            archive_media: { has_items: true }
          }));
        }
      }
    } catch (err) {
      console.error('Error loading archive items:', err);
    }
  };

  // Autosave setup
  useEffect(() => {
    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearInterval(autosaveTimerRef.current);
    }
    
    // Set up autosave every 30 seconds
    autosaveTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges && user?.id && !isReadOnly) {
        handleAutosave();
      }
    }, 30000);
    
    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, user?.id, isReadOnly]);

  const handleDismissOnboarding = () => {
    const visitKey = `swor_profile_builder_visited_${user?.id || 'guest'}`;
    localStorage.setItem(visitKey, 'true');
    setIsFirstVisit(false);
  };

  const updateProfileField = useCallback((field: keyof ProfileData, value: any) => {
    if (isReadOnly) return; // Block updates when read-only
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setSaveError(null);
  }, [isReadOnly]);

  // PATCH E.3: Handle field blur with validation
  const handleFieldBlur = useCallback((field?: 'name' | 'introduction') => {
    // Mark field as touched for validation display
    if (field) {
      setValidation(prev => ({
        ...prev,
        [field]: { ...prev[field], touched: true }
      }));
    }
    
    if (hasUnsavedChanges && user?.id && !isReadOnly) {
      handleAutosave();
    }
  }, [hasUnsavedChanges, user?.id, isReadOnly]);

  const handleAutosave = async () => {
    if (!user?.id || isSaving || isReadOnly) return;
    
    const currentData = JSON.stringify(profileData);
    if (currentData === lastSavedDataRef.current) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'save_profile',
          payload: {
            profile_id: profileData.id,
            user_id: user.id,
            ...profileData,
            birth_year: profileData.birth_year ? parseInt(profileData.birth_year) : null,
            is_autosave: true
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        if (data.profile_id && !profileData.id) {
          setProfileData(prev => ({ ...prev, id: data.profile_id }));
        }
        lastSavedDataRef.current = currentData;
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Autosave failed:', err);
      setSaveError('Autosave failed. Your changes are preserved locally.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || isReadOnly) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'save_profile',
          payload: {
            profile_id: profileData.id,
            user_id: user.id,
            ...profileData,
            birth_year: profileData.birth_year ? parseInt(profileData.birth_year) : null,
            is_autosave: false
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        if (data.profile_id && !profileData.id) {
          setProfileData(prev => ({ ...prev, id: data.profile_id }));
        }
        lastSavedDataRef.current = JSON.stringify(profileData);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // PATCH B+: Submit profile for review
  const handleSubmitForReview = async () => {
    if (!profileData.id || !user?.id) return;
    
    setIsSubmitting(true);
    setSaveError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'submit_profile_for_review',
          payload: {
            profile_id: profileData.id,
            user_id: user.id
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to submit profile');
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        status: 'submitted_for_review',
        submitted_at: data.submitted_at
      }));
      
      // Notify stewards
      try {
        if (data.stewards_to_notify && data.stewards_to_notify.length > 0) {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'profile_submitted',
              payload: {
                profile_id: profileData.id,
                profile_name: data.profile_name || profileData.full_name || profileData.title,
                country: profileData.country,
                stewards_to_notify: data.stewards_to_notify
              }
            }
          });
        }
      } catch (notifErr) {
        console.warn('Steward notification failed:', notifErr);
      }
      
      setShowSubmitModal(false);
      
    } catch (err: any) {
      console.error('Submit for review failed:', err);
      setSaveError(err.message || 'Failed to submit profile for review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PATCH B+: Withdraw submission
  const handleWithdrawSubmission = async () => {
    if (!profileData.id || !user?.id) return;
    
    setIsWithdrawing(true);
    setSaveError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'withdraw_submission',
          payload: {
            profile_id: profileData.id,
            user_id: user.id
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to withdraw submission');
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        status: 'draft',
        submitted_at: undefined
      }));
      
      setShowWithdrawModal(false);
      
    } catch (err: any) {
      console.error('Withdraw submission failed:', err);
      setSaveError(err.message || 'Failed to withdraw submission');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle archive items change
  const handleArchiveItemsChange = (items: ArchiveItem[]) => {
    setArchiveItems(items);
    // Update archive_media to reflect that we have items
    if (items.length > 0) {
      setProfileData(prev => ({
        ...prev,
        archive_media: { has_items: true }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        archive_media: {}
      }));
    }
  };

  // PATCH E.3: Handle photo selection - opens crop modal
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Please select a JPG, PNG, or WebP image');
      return;
    }
    
    // Validate file size (10MB max for cropping, will be compressed)
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Image must be smaller than 10MB');
      return;
    }
    
    setPhotoError(null);
    
    // Create preview and open crop modal
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setPendingPhotoFile(file);
      setPendingPhotoPreview(preview);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // PATCH E.3: Handle cropped photo upload
  const handleCroppedPhotoUpload = async (croppedBase64: string, altText: string) => {
    if (!user?.id || isReadOnly) return;
    
    setIsUploadingPhoto(true);
    setPhotoError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'upload_photo',
          payload: {
            profile_id: profileData.id,
            user_id: user.id,
            file_name: pendingPhotoFile?.name || 'profile-photo.jpg',
            file_type: 'image/jpeg',
            file_size: Math.round(croppedBase64.length * 0.75), // Approximate size
            file_data: croppedBase64,
            alt_text: altText
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        // Use the cropped preview
        const croppedPreview = `data:image/jpeg;base64,${croppedBase64}`;
        setPhotoPreview(croppedPreview);
        setPhotoSignedUrl(data.signed_url);
        setPhotoAltText(altText);
        setProfileData(prev => ({
          ...prev,
          photo_url: data.storage_path,
          photo_alt_text: altText,
          photo_status: 'draft'
        }));
        setShowCropModal(false);
        setPendingPhotoFile(null);
        setPendingPhotoPreview(null);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      setPhotoError('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (isReadOnly) return;
    setPhotoPreview(null);
    setPhotoSignedUrl(null);
    setProfileData(prev => ({
      ...prev,
      photo_url: undefined,
      photo_alt_text: undefined,
      photo_status: undefined
    }));
    setHasUnsavedChanges(true);
  };

  // Preview mode helpers
  const getPreviewModeLabel = (mode: PreviewMode) => {
    switch (mode) {
      case 'public': return 'Public Viewer';
      case 'connection': return 'Connection';
      case 'family': return 'Family Member';
      case 'steward': return 'Steward';
      default: return 'Edit Mode';
    }
  };

  const getPreviewModeIcon = (mode: PreviewMode) => {
    switch (mode) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'connection': return <Users className="w-4 h-4" />;
      case 'family': return <Heart className="w-4 h-4" />;
      case 'steward': return <Shield className="w-4 h-4" />;
      default: return <PenLine className="w-4 h-4" />;
    }
  };

  const isFieldVisibleInPreview = (fieldVisibility: VisibilityLevel): boolean => {
    if (previewMode === 'none') return true;
    if (previewMode === 'steward') return true;
    
    const visibilityHierarchy: VisibilityLevel[] = ['draft', 'family', 'connections', 'public'];
    const fieldLevel = visibilityHierarchy.indexOf(fieldVisibility);
    
    switch (previewMode) {
      case 'public':
        return fieldVisibility === 'public';
      case 'connection':
        return fieldVisibility === 'public' || fieldVisibility === 'connections';
      case 'family':
        return fieldVisibility === 'public' || fieldVisibility === 'connections' || fieldVisibility === 'family';
      default:
        return true;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-20 md:pt-24 flex items-center justify-center">
        <div className="text-center px-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#B8826D] mx-auto mb-4" />
          <p className="text-[#1A2332]/60 text-base">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Preview Mode View
  if (previewMode !== 'none') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-20 md:pt-24">
        {/* Preview Banner - Fixed below header */}
        <div className="bg-[#1A2332] text-white sticky top-16 md:top-20 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-[#B8826D] flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Preview Mode</span>
                <span className="text-white/60 hidden sm:inline">-</span>
                <span className="flex items-center space-x-2 text-sm">
                  {getPreviewModeIcon(previewMode)}
                  <span>Viewing as: {getPreviewModeLabel(previewMode)}</span>
                </span>
              </div>
              <button
                onClick={() => setPreviewMode('none')}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors min-h-[44px] text-sm"
              >
                <X className="w-4 h-4" />
                <span>Exit Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Preview Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Preview Only</p>
                <p className="text-sm text-amber-700 mt-1">
                  This shows how your profile appears to a {getPreviewModeLabel(previewMode).toLowerCase()}.
                  {previewMode !== 'steward' && ' Content marked with higher privacy levels is hidden.'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Preview Card */}
          <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
            {/* Header with photo - 4:5 aspect ratio */}
            <div className="bg-gradient-to-r from-[#1A2332] to-[#2D3748] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                {(photoSignedUrl || photoPreview) && isFieldVisibleInPreview(profileData.visibility_default) ? (
                  <div className="w-24 sm:w-28 flex-shrink-0" style={{ aspectRatio: '4/5' }}>
                    <img
                      src={photoSignedUrl || photoPreview || ''}
                      alt={profileData.photo_alt_text || 'Profile photo'}
                      className="w-full h-full rounded-lg object-cover border-4 border-white/20"
                    />
                  </div>
                ) : (
                  <div className="w-24 sm:w-28 flex-shrink-0 bg-white/10 flex items-center justify-center rounded-lg" style={{ aspectRatio: '4/5' }}>
                    <User className="w-12 h-12 text-white/40" />
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-serif text-white">
                    {profileData.title || profileData.full_name || 'Rugby Journey'}
                  </h1>
                  {profileData.known_as && (
                    <p className="text-white/70 mt-1 text-sm sm:text-base">Known as: {profileData.known_as}</p>
                  )}
                  {(profileData.country || profileData.region) && (
                    <p className="text-white/50 text-sm mt-2">
                      {[profileData.region, profileData.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {isFieldVisibleInPreview(profileData.visibility_default) && profileData.introduction && (
                <div className="mb-6">
                  <h2 className="font-serif text-lg text-[#1A2332] mb-2">Introduction</h2>
                  <p className="text-[#1A2332]/70 leading-relaxed text-base">{profileData.introduction}</p>
                </div>
              )}

              {isFieldVisibleInPreview(profileData.visibility_default) && profileData.era && (
                <div className="mb-6">
                  <h2 className="font-serif text-lg text-[#1A2332] mb-2">Era</h2>
                  <p className="text-[#1A2332]/70 text-base">{profileData.era}</p>
                </div>
              )}

              {isFieldVisibleInPreview(profileData.visibility_default) && profileData.roles.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-serif text-lg text-[#1A2332] mb-2">Roles</h2>
                  <div className="flex flex-wrap gap-2">
                    {profileData.roles.map((role, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-[#8B9D83]/10 text-[#8B9D83] rounded-full text-sm">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft notice for steward view */}
              {previewMode === 'steward' && profileData.status === 'draft' && (
                <div className="mt-6 p-4 bg-[#1A2332]/5 rounded-lg">
                  <p className="text-sm text-[#1A2332]/60">
                    <span className="font-medium">Status:</span> Draft - awaiting submission for review
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Mode Selector */}
          <div className="mt-6 bg-white rounded-lg border border-[#1A2332]/10 p-4 sm:p-6">
            <p className="text-sm font-medium text-[#1A2332] mb-3">Switch Preview Perspective</p>
            <div className="flex flex-wrap gap-2">
              {(['public', 'connection', 'family', 'steward'] as PreviewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
                    previewMode === mode
                      ? 'bg-[#B8826D] text-white'
                      : 'bg-[#1A2332]/5 text-[#1A2332]/70 hover:bg-[#1A2332]/10'
                  }`}
                >
                  {getPreviewModeIcon(mode)}
                  <span>{getPreviewModeLabel(mode)}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#1A2332]/50 mt-3">
              Preview how your profile appears to different viewers based on your visibility settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-20">
      {/* PATCH F.2: Screen reader announcements */}
      <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      
      {/* Onboarding Reassurance - Only for first-time visitors */}
      {isFirstVisit && (
        <OnboardingReassurance
          userId={user?.id}
          onDismiss={handleDismissOnboarding}
          variant="banner"
        />
      )}

      {/* Header Bar - Sticky below main header */}
      <div className="bg-white border-b border-[#1A2332]/10 sticky top-16 md:top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="flex items-center justify-center text-[#1A2332]/60 hover:text-[#1A2332] transition-colors min-h-[44px] min-w-[44px] flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#B8826D] rounded-lg"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="hidden sm:block h-6 w-px bg-[#1A2332]/10" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-base sm:text-lg text-[#1A2332] truncate">
                  {profileData.title || 'Your Rugby Journey'}
                </h1>
                <div className="flex items-center space-x-2 text-xs" aria-live="polite">
                  {isSaving ? (
                    <span className="flex items-center text-[#B8826D]">
                      <Loader2 className="w-3 h-3 animate-spin mr-1" aria-hidden="true" />
                      <span className="hidden xs:inline">Saving...</span>
                    </span>
                  ) : lastSaved ? (
                    <span className="flex items-center text-[#8B9D83]">
                      <Check className="w-3 h-3 mr-1" aria-hidden="true" />
                      <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>
                      <span className="sm:hidden">Saved</span>
                    </span>
                  ) : (
                    <span className="text-[#1A2332]/50">Draft</span>
                  )}
                  {hasUnsavedChanges && !isSaving && (
                    <span className="text-amber-600 hidden sm:inline">- Unsaved</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right side: Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Help Guides Link */}
              <button
                onClick={() => onNavigate('help')}
                className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-3 sm:py-2 rounded-lg text-[#1A2332]/60 hover:bg-[#1A2332]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]"
                title="Help Guides"
                aria-label="Help Guides"
              >
                <HelpCircle className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline ml-2 text-sm">Help</span>
              </button>

              {/* Preview Button */}
              <button
                onClick={() => setPreviewMode('public')}
                className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-3 sm:py-2 rounded-lg text-[#1A2332]/60 hover:bg-[#1A2332]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]"
                title="Preview"
                aria-label="Preview profile"
              >
                <Eye className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline ml-2 text-sm">Preview</span>
              </button>

              {/* Guidance Toggle - Hidden on mobile */}
              <button
                onClick={() => setShowGuidance(!showGuidance)}
                aria-pressed={showGuidance}
                className={`hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D] ${
                  showGuidance 
                    ? 'bg-[#8B9D83]/10 text-[#8B9D83]' 
                    : 'text-[#1A2332]/60 hover:bg-[#1A2332]/5'
                }`}
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Guidance</span>
              </button>

              {/* Save Button - Hidden when read-only */}
              {!isReadOnly && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  aria-describedby="save-status"
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#B8826D] focus:ring-offset-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </button>
              )}
              <span id="save-status" className="sr-only">
                {isSaving ? 'Saving your changes' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Not yet saved'}
              </span>
            </div>
          </div>
        </div>
      </div>





      {/* PATCH B+.1: Status Banners */}
      {/* Submitted for Review Banner */}
      {isReadOnly && profileData.status === 'submitted_for_review' && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Submitted — awaiting steward review</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your profile is being reviewed. You'll be notified when it's approved.
                    {profileData.submitted_at && (
                      <span className="text-blue-600 ml-1">
                        Submitted {new Date(profileData.submitted_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium min-h-[44px]"
              >
                <Undo2 className="w-4 h-4" />
                <span>Withdraw submission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Needs Changes Banner — PATCH 6B: Reassurance language */}
      {needsChanges && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Your steward has shared some thoughts</p>
                {profileData.steward_note ? (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-sm text-[#1A2332]/80 whitespace-pre-wrap">{profileData.steward_note}</p>
                    {profileData.steward_note_at && (
                      <p className="text-xs text-amber-600 mt-2">
                        {new Date(profileData.steward_note_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 mt-1">
                    {reassuranceCopy.stewardFeedback.banner}
                  </p>
                )}
                <p className="text-sm text-amber-700/80 mt-2">
                  {reassuranceCopy.stewardFeedback.encouragement}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Save Error Banner */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{saveError}</p>
              <button
                onClick={() => setSaveError(null)}
                className="text-red-600 hover:text-red-800 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile-first spacing */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <div className={`grid gap-6 sm:gap-8 ${showGuidance ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          
          {/* Main Builder Area */}
          <div className={`${showGuidance ? 'lg:col-span-2' : ''} min-w-0`}>
            {/* Draft Status Banner */}
            {!isReadOnly && !needsChanges && (
              <div className="bg-[#1A2332]/5 rounded-lg p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <Shield className="w-5 h-5 text-[#8B9D83] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A2332]">Draft Mode</p>
                    <p className="text-xs text-[#1A2332]/60">
                      Only you and stewards can see this. Nothing is public until approved.
                    </p>
                  </div>
                </div>
                <VisibilitySelector
                  value={profileData.visibility_default}
                  onChange={(v) => updateProfileField('visibility_default', v)}
                  compact
                  disabled={isReadOnly}
                />
              </div>
            )}


            {/* Read-Only Notice */}
            {isReadOnly && (
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-6 flex items-center space-x-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-800">Profile is read-only</p>
                  <p className="text-xs text-blue-700">
                    Your profile is under review. Withdraw your submission to make changes.
                  </p>
                </div>
              </div>
            )}

            {/* Profile Photo Section - PATCH E.3: 4:5 aspect ratio */}
            <div className="bg-white rounded-xl border border-[#1A2332]/10 p-4 sm:p-6 mb-6 overflow-hidden">
              {/* Section Header */}
              <div className="flex items-start gap-2 mb-2">
                <Camera className="w-5 h-5 text-[#8B9D83] flex-shrink-0 mt-0.5" />
                <h2 className="font-serif text-lg sm:text-xl text-[#1A2332]">
                  Profile Photo
                </h2>
              </div>
              <p className="text-sm text-[#1A2332]/60 mb-6 leading-relaxed">
                Add a photo to help others recognise you. You can add this later.
              </p>

              {/* Content Container - Stacked vertical layout, centered */}
              <div className="flex flex-col items-center w-full">
                {/* Photo Preview Area - 4:5 aspect ratio */}
                <div className="mb-4">
                  {(photoSignedUrl || photoPreview) ? (
                    <div className="relative inline-block">
                      <div className="w-28 sm:w-32 rounded-xl overflow-hidden border border-[#1A2332]/10" style={{ aspectRatio: '4/5' }}>
                        <img
                          src={photoSignedUrl || photoPreview || ''}
                          alt={profileData.photo_alt_text || 'Profile photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!isReadOnly && (
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md min-h-[32px] min-w-[32px]"
                          aria-label="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {profileData.photo_status === 'draft' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-xs py-1 text-center rounded-b-xl">
                          Draft - Not public
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => !isReadOnly && fileInputRef.current?.click()}
                      className={`w-28 sm:w-32 rounded-xl border-2 border-dashed border-[#1A2332]/20 flex flex-col items-center justify-center ${
                        isReadOnly 
                          ? 'cursor-not-allowed opacity-50' 
                          : 'cursor-pointer hover:border-[#B8826D] hover:bg-[#B8826D]/5 active:bg-[#B8826D]/10'
                      } transition-colors`}
                      style={{ aspectRatio: '4/5' }}
                    >
                      <ImageIcon className="w-8 h-8 text-[#1A2332]/30 mb-2" />
                      <span className="text-xs text-[#1A2332]/50 text-center px-2">
                        {isReadOnly ? 'Read-only' : '4:5 Portrait'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Button and Instructions - Centered below photo */}
                <div className="flex flex-col items-center text-center w-full max-w-xs">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={isReadOnly}
                  />
                  
                  {!(photoSignedUrl || photoPreview) && !isReadOnly && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A2332]/5 text-[#1A2332]/70 rounded-lg hover:bg-[#1A2332]/10 active:bg-[#1A2332]/15 transition-colors mb-4 min-h-[44px] text-sm"
                    >
                      <Upload className="w-4 h-4 flex-shrink-0" />
                      <span>Choose Photo</span>
                    </button>
                  )}

                  <div className="text-xs text-[#1A2332]/50 space-y-1 mb-3">
                    <p>Accepted formats: JPG, PNG, WebP</p>
                    <p>You'll be able to crop and adjust</p>
                  </div>

                  {photoError && (
                    <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{photoError}</span>
                    </div>
                  )}

                  <p className="text-xs text-[#8B9D83] flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 flex-shrink-0" />
                    <span>Photos start as drafts and are not public until approved</span>
                  </p>
                </div>
              </div>
            </div>




            {/* Basic Info Section - PATCH E.3: With validation */}
            <div className="bg-white rounded-xl border border-[#1A2332]/10 p-4 sm:p-6 mb-6 overflow-hidden">
              <h2 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-[#8B9D83] flex-shrink-0" />
                <span>Basic Information</span>
              </h2>
              <p className="text-sm text-[#1A2332]/60 mb-6">
                Start with whatever you know. You can add more later.
              </p>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => updateProfileField('full_name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    placeholder="e.g., John Smith"
                    disabled={isReadOnly}
                    className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed box-border"
                  />
                </div>

                {/* Known As */}
                <div>
                  <label htmlFor="known-as" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Known As <span className="text-[#1A2332]/40 font-normal">(optional)</span>
                  </label>
                  <input
                    id="known-as"
                    type="text"
                    value={profileData.known_as}
                    onChange={(e) => updateProfileField('known_as', e.target.value)}
                    onBlur={() => handleFieldBlur()}
                    placeholder="Nickname or preferred name"
                    disabled={isReadOnly}
                    className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed box-border"
                  />
                </div>

                {/* Title / Name - PATCH E.3: With validation */}
                <div>
                  <label htmlFor="journey-title" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Journey Title
                    {!readinessChecklist.name && <span className="text-[#B8826D] ml-1">*</span>}
                  </label>
                  <input
                    id="journey-title"
                    type="text"
                    value={profileData.title}
                    onChange={(e) => updateProfileField('title', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    placeholder="e.g., My Rugby Journey, or your name"
                    disabled={isReadOnly}
                    aria-describedby={validation.name.touched && !validation.name.valid ? 'title-error' : undefined}
                    className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-white focus:outline-none text-base disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed box-border ${
                      validation.name.touched && !validation.name.valid
                        ? 'border-[#B8826D]/50 focus:border-[#B8826D]'
                        : 'border-[#1A2332]/20 focus:border-[#B8826D]'
                    }`}
                  />
                  {validation.name.touched && !validation.name.valid && validation.name.message && (
                    <p id="title-error" className="text-sm text-[#B8826D] mt-1.5" role="alert">
                      {validation.name.message}
                    </p>
                  )}
                  <p className="text-xs text-[#1A2332]/40 mt-1">
                    This is how your journey will be titled. You can change it anytime.
                  </p>
                </div>

                {/* Introduction - PATCH E.3: With validation and character count */}
                <div>
                  <label htmlFor="introduction" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Brief Introduction
                    {!readinessChecklist.introduction && <span className="text-[#B8826D] ml-1">*</span>}
                  </label>
                  <textarea
                    id="introduction"
                    value={profileData.introduction}
                    onChange={(e) => updateProfileField('introduction', e.target.value)}
                    onBlur={() => handleFieldBlur('introduction')}
                    placeholder="A sentence or two about your rugby journey..."
                    rows={4}
                    disabled={isReadOnly}
                    aria-describedby={`intro-count ${validation.introduction.touched && !validation.introduction.valid ? 'intro-error' : ''}`}
                    className={`w-full px-3 sm:px-4 py-3 rounded-lg border bg-white focus:outline-none text-base resize-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed box-border ${
                      validation.introduction.touched && !validation.introduction.valid
                        ? 'border-[#B8826D]/50 focus:border-[#B8826D]'
                        : 'border-[#1A2332]/20 focus:border-[#B8826D]'
                    }`}
                  />
                  {/* Character count */}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex-1">
                      {validation.introduction.touched && !validation.introduction.valid && validation.introduction.message && (
                        <p id="intro-error" className="text-sm text-[#B8826D]" role="alert">
                          {validation.introduction.message}
                        </p>
                      )}
                      {isNearIntroLimit && validation.introduction.valid && (
                        <p className="text-sm text-amber-600">
                          You're close to the recommended limit.
                        </p>
                      )}
                    </div>
                    <p id="intro-count" className={`text-xs ${
                      introductionCharCount < VALIDATION_RULES.introduction.minLength
                        ? 'text-[#B8826D]'
                        : isNearIntroLimit
                          ? 'text-amber-600'
                          : 'text-[#1A2332]/40'
                    }`}>
                      {introductionCharCount} / {VALIDATION_RULES.introduction.maxLength}
                    </p>
                  </div>
                </div>

                {/* Country & Region - Stack on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                      Country <span className="text-[#1A2332]/40 font-normal">(recommended)</span>
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={profileData.country}
                      onChange={(e) => updateProfileField('country', e.target.value)}
                      onBlur={() => handleFieldBlur()}
                      placeholder="e.g., South Africa"
                      disabled={isReadOnly}
                      className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed box-border"
                    />
                  </div>
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                      Region <span className="text-[#1A2332]/40 font-normal">(optional)</span>
                    </label>
                    <input
                      id="region"
                      type="text"
                      value={profileData.region}
                      onChange={(e) => updateProfileField('region', e.target.value)}
                      onBlur={() => handleFieldBlur()}
                      placeholder="e.g., Western Cape"
                      disabled={isReadOnly}
                      className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed box-border"
                    />
                  </div>
                </div>

                {/* Era */}
                <div>
                  <label htmlFor="era" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Era <span className="text-[#1A2332]/40 font-normal">(recommended)</span>
                  </label>
                  <input
                    id="era"
                    type="text"
                    value={profileData.era}
                    onChange={(e) => updateProfileField('era', e.target.value)}
                    onBlur={() => handleFieldBlur()}
                    placeholder="e.g., 1960s-1980s, or Amateur Era"
                    disabled={isReadOnly}
                    className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed box-border"
                  />
                </div>
              </div>
            </div>


            {/* Profile Sections - Progressive Disclosure */}
            <ProfileSections
              hasCoreJourney={Object.keys(profileData.core_journey).length > 0}
              hasMilestones={false} // Will be updated when milestones are loaded
              hasReflections={Object.keys(profileData.reflections_influences).length > 0}
              hasArchive={archiveItems.length > 0 || archiveExpanded}
              hasConnections={Object.keys(profileData.connections_acknowledgements).length > 0}
              sectionVisibility={{
                coreJourney: profileData.visibility_default,
                milestones: profileData.visibility_default,
                reflections: profileData.visibility_default,
                archive: profileData.visibility_default,
                connections: profileData.visibility_default
              }}
              coreJourneyContent={
                <div className="space-y-4">
                  <p className="text-sm text-[#1A2332]/60">
                    Share your rugby story here. How did you come to the game? What clubs, teams, or roles shaped your path?
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={() => updateProfileField('core_journey', { started: true })}
                      className="flex items-center space-x-2 text-[#B8826D] text-sm font-medium hover:text-[#B8826D]/80 min-h-[44px]"
                    >
                      <PenLine className="w-4 h-4" />
                      <span>Add narrative</span>
                    </button>
                  )}
                </div>
              }
              milestoneContent={
                profileData.id ? (
                  <MilestoneEditor
                    profileId={profileData.id}
                    userId={user?.id}
                    archiveImages={archiveItems
                      .filter(item => item.item_type === 'image')
                      .map(item => ({
                        id: item.id,
                        title: item.title,
                        signed_url: item.signed_url,
                        thumb_signed_url: item.thumb_signed_url
                      }))
                    }
                    isReadOnly={isReadOnly}
                  />
                ) : (
                  <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-700">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Save your profile first to add milestones.
                  </div>
                )
              }
              archiveContent={
                <div className="space-y-4">
                  {!archiveExpanded && archiveItems.length === 0 ? (
                    <>
                      <p className="text-sm text-[#1A2332]/60">
                        Upload photos, documents, or other materials that tell your story.
                      </p>
                      {!isReadOnly && (
                        <button
                          onClick={() => setArchiveExpanded(true)}
                          className="flex items-center space-x-2 text-[#B8826D] text-sm font-medium hover:text-[#B8826D]/80 min-h-[44px]"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload files</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {profileData.id ? (
                        <ArchiveUploadSection
                          profileId={profileData.id}
                          userId={user?.id}
                          items={archiveItems}
                          onItemsChange={handleArchiveItemsChange}
                          isReadOnly={isReadOnly}
                          canReorder={!isReadOnly}
                          isSteward={isGlobalSteward}
                        />
                      ) : (
                        <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-700">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          Save your profile first to upload archive items.
                        </div>
                      )}
                    </>
                  )}
                </div>
              }
            />




            {/* Content State Indicator */}
            {profileData.id && (
              <div className="mt-6">
                <ContentStateIndicator
                  state={profileData.status as ContentState}
                  showVisibilityHint
                  variant="detailed"
                />
              </div>
            )}

            {/* Steward Profile Panel */}
            {profileData.id && (
              <div className="mt-6">
                <StewardProfilePanel
                  profileId={profileData.id}
                  profileName={profileData.full_name || profileData.title}
                  isOwner={true}
                  isSteward={isGlobalSteward}
                  currentUserId={user?.id}
                />
              </div>
            )}

            {/* Commendations I've Written (Bi-directional) */}

            {profileData.id && (
              <div className="bg-white rounded-xl border border-[#1A2332]/10 p-4 sm:p-6 mt-6">
                <h2 className="font-serif text-lg sm:text-xl text-[#1A2332] mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-[#B8826D]" />
                  Commendations I've Written
                </h2>
                <p className="text-sm text-[#1A2332]/60 mb-4">
                  Commendations you've written for others appear here and on their profiles.
                </p>
                <CommendationsList
                  profileId={profileData.id}
                  profileName={profileData.full_name || profileData.title || 'You'}
                  onNavigateToProfile={(id) => onNavigate(`person-${id}`)}
                  variant="commender"
                  maxInitialDisplay={3}
                />
              </div>
            )}

            {/* Legacy Steward Contact (fallback when no profile ID) */}
            {!profileData.id && (
              <div className="mt-6">
                <StewardContact
                  journeyTitle={profileData.title || 'Your Rugby Journey'}
                  variant="card"
                  showFallback={true}
                />
              </div>
            )}


            {/* PATCH E.3: Readiness Checklist */}
            {!isReadOnly && (
              <div className="bg-[#F5F1E8] rounded-xl border border-[#1A2332]/10 p-4 sm:p-6 mt-6">
                <h3 className="text-sm font-medium text-[#1A2332]/70 mb-3">Readiness for Review</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      readinessChecklist.name ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/10'
                    }`}>
                      {readinessChecklist.name ? (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#1A2332]/30" />
                      )}
                    </div>
                    <span className={`text-sm ${readinessChecklist.name ? 'text-[#1A2332]' : 'text-[#1A2332]/50'}`}>
                      Name or title
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      readinessChecklist.introduction ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/10'
                    }`}>
                      {readinessChecklist.introduction ? (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#1A2332]/30" />
                      )}
                    </div>
                    <span className={`text-sm ${readinessChecklist.introduction ? 'text-[#1A2332]' : 'text-[#1A2332]/50'}`}>
                      Introduction (50+ characters)
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      readinessChecklist.photo ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/10'
                    }`}>
                      {readinessChecklist.photo ? (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#1A2332]/30" />
                      )}
                    </div>
                    <span className={`text-sm ${readinessChecklist.photo ? 'text-[#1A2332]' : 'text-[#1A2332]/50'}`}>
                      Photo <span className="text-[#1A2332]/40">(optional)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}


            {/* Bottom Actions - PATCH E.3: With validation gating */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#1A2332]/10">
              <p className="text-sm text-[#1A2332]/50 text-center sm:text-left">
                Take your time. There is no deadline.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate('settings')}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] transition-colors min-h-[44px] w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                
                {/* Save Button - Only when not read-only */}
                {!isReadOnly && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#1A2332]/10 text-[#1A2332] rounded-lg font-medium hover:bg-[#1A2332]/20 transition-colors disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                )}
                
                {/* Submit for Review Button - PATCH E.3: Disabled until valid */}
                {!isReadOnly && profileData.id && (
                  <div className="w-full sm:w-auto">
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      disabled={!isFormValidForSubmission}
                      className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit for Review</span>
                    </button>
                    {!isFormValidForSubmission && (
                      <p className="text-xs text-[#1A2332]/50 mt-2 text-center sm:text-left">
                        Add a name and a short introduction to submit for steward review.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guidance Panel - Collapsible on desktop */}
          {showGuidance && (
            <div className="lg:col-span-1">
              <div className="sticky top-36">
                <ProfileGuidance variant="panel" showVersion={true} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PATCH E.3: Photo Crop Modal */}
      {showCropModal && pendingPhotoFile && pendingPhotoPreview && (
        <PhotoCropModal
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setPendingPhotoFile(null);
            setPendingPhotoPreview(null);
          }}
          imageFile={pendingPhotoFile}
          imagePreview={pendingPhotoPreview}
          profileName={profileData.full_name || profileData.title || ''}
          onCropComplete={handleCroppedPhotoUpload}
          isUploading={isUploadingPhoto}
        />
      )}

      {/* PATCH B+.1: Submit for Review Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-[#1A2332]/40 hover:text-[#1A2332] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1 -mt-1"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#B8826D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-[#B8826D]" />
              </div>
              <h3 className="font-serif text-xl text-[#1A2332]">Submit for Review</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3 p-3 bg-[#F5F1E8] rounded-lg">
                <Shield className="w-5 h-5 text-[#8B9D83] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1A2332]/70">
                  Your profile will be sent to your steward for review.
                </p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-[#F5F1E8] rounded-lg">
                <Lock className="w-5 h-5 text-[#8B9D83] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1A2332]/70">
                  Nothing becomes public until approved.
                </p>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-[#F5F1E8] rounded-lg">
                <Clock className="w-5 h-5 text-[#8B9D83] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1A2332]/70">
                  You can take your time. There is no deadline.
                </p>
              </div>
            </div>

            <p className="text-sm text-[#1A2332]/60 text-center mb-6">
              After submission, your profile will be read-only until reviewed. You can withdraw your submission at any time.
            </p>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit for Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PATCH B+.1: Withdraw Submission Confirmation Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 text-[#1A2332]/40 hover:text-[#1A2332] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1 -mt-1"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Undo2 className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-serif text-xl text-[#1A2332]">Withdraw Submission</h3>
            </div>

            <p className="text-sm text-[#1A2332]/70 text-center mb-6">
              This will return your profile to draft status. You can continue editing and submit again when ready.
            </p>

            <div className="p-4 bg-[#F5F1E8] rounded-lg mb-6">
              <p className="text-sm text-[#1A2332]/70">
                <Check className="w-4 h-4 inline mr-2 text-[#8B9D83]" />
                Your content will be preserved. Nothing will be lost.
              </p>
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawSubmission}
                disabled={isWithdrawing}
                className="flex items-center space-x-2 px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <>
                    <Undo2 className="w-4 h-4" />
                    <span>Withdraw Submission</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualProfileBuilder;
