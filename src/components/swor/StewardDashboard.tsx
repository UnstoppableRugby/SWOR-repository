import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Clock, FileText, Image, File, CheckCircle, XCircle, AlertCircle, Loader2, Shield, Eye, EyeOff, Users, Lock, RefreshCw, Sparkles, Search, MessageSquare, Type, PenLine, User, Building2, UserX, Ban, UserPlus, Trash2, Crown, ShieldCheck, Link2, ExternalLink, Globe, Minimize2, Video, Play, Film, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  type Visibility, 
  type Status,
  getDefaultVisibility,
} from '@/config/governance';
import FilePreviewModal from './FilePreviewModal';
import VideoPreviewModal from './VideoPreviewModal';
import ErrorDisplay, { parseError, type EdgeFunctionError } from './ErrorDisplay';


// Upload size limits
const MAX_IMAGE_DOC_MB = 8;
const MAX_VIDEO_MB = 50;
const MAX_IMAGE_DOC_BYTES = MAX_IMAGE_DOC_MB * 1024 * 1024;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

// Allowed video types
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

interface StewardDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  journeyId: string;
  journeyTitle: string;
  userEmail: string;
  userName: string;
  userId?: string;
}

type TabType = 'upload' | 'pending' | 'audit' | 'stewards';
type UploadMode = 'file' | 'text' | 'link' | 'video';
type CreditPreference = 'name' | 'organisation' | 'anonymous' | 'none';

interface DraftItem {
  id: string;
  journey_id: string;
  item_type: 'image' | 'document' | 'link' | 'text' | 'video';
  status: Status;
  visibility: Visibility;
  content_json: {
    file_name?: string;
    source_notes?: string;
    uploader_name?: string;
    rejection_note?: string;
    title?: string;
    body?: string;
    credit_preference?: CreditPreference;
    credit_line?: string;
    rights_status?: string;
    submitter_name?: string;
    // Link-specific fields
    url?: string;
    description?: string;
    allow_embedding?: boolean;
    source_type?: string;
    // Video-specific fields
    duration?: number;
    thumb_path?: string;
    compression_applied?: boolean;
  };
  storage_path: string | null;
  thumb_path: string | null;
  mime: string | null;
  size: number | null;
  source_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_note?: string | null;
  // For signed URLs
  signed_url?: string;
  thumb_signed_url?: string;
}




interface AuditEntry {
  id: string;
  journey_id: string;
  actor_user_id: string | null;
  action: string;
  target_table: string;
  target_id: string;
  before_snapshot: any;
  after_snapshot: any;
  created_at: string;
}

interface ActionFeedback {
  type: 'success' | 'error';
  message: string;
  itemId?: string;
}

interface PreviewState {
  isOpen: boolean;
  fileName: string;
  storagePath: string;
  mime: string | null;
  fileSize: number | null;
}

interface RejectionModalState {
  isOpen: boolean;
  itemId: string;
  fileName: string;
}

interface TextPreviewModalState {
  isOpen: boolean;
  title: string;
  body: string;
  creditLine: string | null;
  rightsStatus: string | null;
}

interface VideoPreviewModalState {
  isOpen: boolean;
  fileName: string;
  storagePath: string;
  thumbPath: string | null;
  mime: string | null;
  fileSize: number | null;
  duration: number | null;
  title: string | null;
  description: string | null;
  creditPreference: string | null;
  creditLine: string | null;
  rightsStatus: string | null;
  sourceNotes: string | null;
  visibility: string | null;
  uploaderName: string | null;
  createdAt: string | null;
}


interface ResetModalState {
  isOpen: boolean;
  itemId: string;
  fileName: string;
  currentStatus: string;
}

interface Steward {
  id: string;
  user_id: string;
  role: 'global_steward' | 'journey_steward';
  scope_type: string;
  scope_id: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

// Helper function to format duration
const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const StewardDashboard: React.FC<StewardDashboardProps> = ({
  isOpen,
  onClose,
  journeyId,
  journeyTitle,
  userEmail,
  userName,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<Visibility>(getDefaultVisibility());
  const [sourceNotes, setSourceNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Text item form state
  const [textTitle, setTextTitle] = useState('');
  const [textBody, setTextBody] = useState('');
  const [creditPreference, setCreditPreference] = useState<CreditPreference>('none');
  const [creditLine, setCreditLine] = useState('');
  const [rightsStatus, setRightsStatus] = useState('');
  const [submittingText, setSubmittingText] = useState(false);

  // Phase 4C: Link item form state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [allowEmbedding, setAllowEmbedding] = useState(false);
  const [submittingLink, setSubmittingLink] = useState(false);

  // Image compression state
  const [autoCompress, setAutoCompress] = useState(true);
  const [compressingFile, setCompressingFile] = useState<string | null>(null);

  // Video upload state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoCompressEnabled, setVideoCompressEnabled] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoThumbnailPreview, setVideoThumbnailPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // Video preview modal state
  const [videoPreviewState, setVideoPreviewState] = useState<VideoPreviewModalState>({
    isOpen: false,
    fileName: '',
    storagePath: '',
    thumbPath: null,
    mime: null,
    fileSize: null,
    duration: null,
    title: null,
    description: null,
    creditPreference: null,
    creditLine: null,
    rightsStatus: null,
    sourceNotes: null,
    visibility: null,
    uploaderName: null,
    createdAt: null
  });



  // Database-backed state
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [auditError, setAuditError] = useState('');

  // Action states for individual items
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [recentlyApproved, setRecentlyApproved] = useState<Set<string>>(new Set());
  const [recentlyRejected, setRecentlyRejected] = useState<Set<string>>(new Set());
  const [recentlyReset, setRecentlyReset] = useState<Set<string>>(new Set());

  // File preview state
  const [previewState, setPreviewState] = useState<PreviewState>({
    isOpen: false,
    fileName: '',
    storagePath: '',
    mime: null,
    fileSize: null
  });

  // Text preview state
  const [textPreviewState, setTextPreviewState] = useState<TextPreviewModalState>({
    isOpen: false,
    title: '',
    body: '',
    creditLine: null,
    rightsStatus: null
  });

  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState<RejectionModalState>({
    isOpen: false,
    itemId: '',
    fileName: ''
  });
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Reset to pending modal state
  const [resetModal, setResetModal] = useState<ResetModalState>({
    isOpen: false,
    itemId: '',
    fileName: '',
    currentStatus: ''
  });
  const [resetNote, setResetNote] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Phase 4B: Steward management state
  const [isGlobalSteward, setIsGlobalSteward] = useState(false);
  const [checkingGlobalSteward, setCheckingGlobalSteward] = useState(true);
  const [globalStewards, setGlobalStewards] = useState<Steward[]>([]);
  const [journeyStewards, setJourneyStewards] = useState<Steward[]>([]);
  const [loadingStewards, setLoadingStewards] = useState(false);
  const [stewardsError, setStewardsError] = useState('');
  const [newStewardEmail, setNewStewardEmail] = useState('');
  const [addingSteward, setAddingSteward] = useState(false);
  const [removingStewardId, setRemovingStewardId] = useState<string | null>(null);




  const visibilityOptions = [
    { value: 'private_draft' as Visibility, label: 'Private Draft', icon: Lock, description: 'Only you can see this' },
    { value: 'family' as Visibility, label: 'Family / Trusted Circle', icon: Users, description: 'Family members and trusted contacts' },
    { value: 'connections' as Visibility, label: 'Connections Only', icon: Eye, description: 'Your connections can view' },
    { value: 'public' as Visibility, label: 'Public', icon: EyeOff, description: 'Visible to everyone (after approval)' },
  ];

  const creditPreferenceOptions = [
    { value: 'name' as CreditPreference, label: 'My Name', icon: User, description: 'Credit me by name' },
    { value: 'organisation' as CreditPreference, label: 'Organisation', icon: Building2, description: 'Credit my organisation' },
    { value: 'anonymous' as CreditPreference, label: 'Anonymous', icon: UserX, description: 'Contribute anonymously' },
    { value: 'none' as CreditPreference, label: 'No Credit', icon: Ban, description: 'No attribution needed' },
  ];


  // Clear feedback after 4 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  // Clear recently approved/rejected highlights after 3 seconds
  useEffect(() => {
    if (recentlyApproved.size > 0) {
      const timer = setTimeout(() => {
        setRecentlyApproved(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recentlyApproved]);

  useEffect(() => {
    if (recentlyRejected.size > 0) {
      const timer = setTimeout(() => {
        setRecentlyRejected(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recentlyRejected]);

  // Clear recently reset highlights after 3 seconds
  useEffect(() => {
    if (recentlyReset.size > 0) {
      const timer = setTimeout(() => {
        setRecentlyReset(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recentlyReset]);



  // Phase 4B: Check if user is a global steward
  const checkGlobalStewardStatus = useCallback(async () => {
    if (!userId) {
      setIsGlobalSteward(false);
      setCheckingGlobalSteward(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'check_global_steward',
          payload: { user_id: userId }
        }
      });

      if (error) {
        console.error('[GlobalSteward Check] Error:', error);
        setIsGlobalSteward(false);
      } else if (data?.success) {
        setIsGlobalSteward(data.is_global_steward === true);
      } else {
        setIsGlobalSteward(false);
      }
    } catch (err) {
      console.error('[GlobalSteward Check] Exception:', err);
      setIsGlobalSteward(false);
    } finally {
      setCheckingGlobalSteward(false);
    }
  }, [userId]);

  // Phase 4B: Fetch stewards for this journey
  const fetchStewards = useCallback(async () => {
    if (!userId) return;

    setLoadingStewards(true);
    setStewardsError('');

    try {
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'get_stewards',
          payload: {
            journey_id: journeyId,
            requester_id: userId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        setGlobalStewards(data.global_stewards || []);
        setJourneyStewards(data.journey_stewards || []);
      } else {
        throw new Error(data?.error || 'Failed to fetch stewards');
      }
    } catch (err: any) {
      console.error('[Fetch Stewards] Error:', err);
      setStewardsError(err.message || 'Failed to load stewards');
    } finally {
      setLoadingStewards(false);
    }
  }, [journeyId, userId]);

  // Phase 4B: Add a journey steward
  const handleAddSteward = async () => {
    if (!newStewardEmail.trim() || !userId) return;

    setAddingSteward(true);
    setActionFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'add_journey_steward',
          payload: {
            journey_id: journeyId,
            target_email: newStewardEmail.trim().toLowerCase(),
            actor_id: userId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        const errorDetail = data?.detail || data?.error || 'Failed to add steward';
        throw new Error(errorDetail);
      }

      // Success
      setActionFeedback({
        type: 'success',
        message: `Steward added: ${newStewardEmail}${data.user_created ? ' (new user created)' : ''}`
      });
      setNewStewardEmail('');

      // Refresh stewards list
      await fetchStewards();
      // Refresh audit log
      await fetchAuditLog();

    } catch (err: any) {
      console.error('[Add Steward] Error:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to add steward'
      });
    } finally {
      setAddingSteward(false);
    }
  };

  // Phase 4B: Remove a journey steward
  const handleRemoveSteward = async (steward: Steward) => {
    if (!userId) return;

    // Prevent removing global stewards via this UI
    if (steward.role === 'global_steward') {
      setActionFeedback({
        type: 'error',
        message: 'Global stewards cannot be removed via this interface.'
      });
      return;
    }

    setRemovingStewardId(steward.user_id);
    setActionFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'remove_journey_steward',
          payload: {
            journey_id: journeyId,
            target_user_id: steward.user_id,
            actor_id: userId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        const errorDetail = data?.detail || data?.error || 'Failed to remove steward';
        throw new Error(errorDetail);
      }

      // Success
      setActionFeedback({
        type: 'success',
        message: `Steward removed: ${steward.user_email || steward.user_id.substring(0, 8) + '...'}`
      });

      // Refresh stewards list
      await fetchStewards();
      // Refresh audit log
      await fetchAuditLog();

    } catch (err: any) {
      console.error('[Remove Steward] Error:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to remove steward'
      });
    } finally {
      setRemovingStewardId(null);
    }
  };

  // Fetch draft items from database - use get_journey_items for journey-specific filtering
  const fetchDraftItems = useCallback(async () => {
    setLoadingItems(true);
    setItemsError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'get_journey_items',
          payload: { journey_id: journeyId }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setDraftItems(data.items || []);
      } else {
        throw new Error(data.error || 'Failed to fetch items');
      }
    } catch (err: any) {
      console.error('Error fetching draft items:', err);
      setItemsError(err.message || 'Failed to load pending items');
    } finally {
      setLoadingItems(false);
    }
  }, [journeyId]);


  // Fetch audit log from database
  const fetchAuditLog = useCallback(async () => {
    setLoadingAudit(true);
    setAuditError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'get_audit_log',
          payload: { journey_id: journeyId }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setAuditLog(data.entries || []);
      } else {
        throw new Error(data.error || 'Failed to fetch audit log');
      }
    } catch (err: any) {
      console.error('Error fetching audit log:', err);
      setAuditError(err.message || 'Failed to load audit trail');
    } finally {
      setLoadingAudit(false);
    }
  }, [journeyId]);

  // Check global steward status on mount
  useEffect(() => {
    if (isOpen && userId) {
      checkGlobalStewardStatus();
    }
  }, [isOpen, userId, checkGlobalStewardStatus]);

  // Load data when dashboard opens or tab changes
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'pending') {
        fetchDraftItems();
      } else if (activeTab === 'audit') {
        fetchAuditLog();
      } else if (activeTab === 'stewards' && isGlobalSteward) {
        fetchStewards();
      }
    }
  }, [isOpen, activeTab, fetchDraftItems, fetchAuditLog, fetchStewards, isGlobalSteward]);

  // Initial load when dashboard opens
  useEffect(() => {
    if (isOpen) {
      fetchDraftItems();
      fetchAuditLog();
    }
  }, [isOpen, fetchDraftItems, fetchAuditLog]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:mime;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };


  // Compress image using canvas
  const compressImage = async (file: File, maxWidth: number = 2000, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create new file with compressed data
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      
      // Create object URL for the image
      img.src = URL.createObjectURL(file);
    });
  };

  // Check if file is a compressible image
  const isCompressibleImage = (file: File): boolean => {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase());
  };

  const handleFiles = async (files: File[]) => {
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);
    setUploadProgress(0);

    const successfulUploads: string[] = [];
    const failedUploads: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        setUploadProgress(Math.round(((i + 0.1) / files.length) * 100));

        try {
          // PREFLIGHT CHECK: File size validation
          if (file.size > MAX_IMAGE_DOC_BYTES) {
            // If it's a compressible image and auto-compress is enabled, try compression
            if (autoCompress && isCompressibleImage(file)) {
              console.log(`[Upload] File ${file.name} is ${formatFileSize(file.size)}, attempting compression...`);
              setCompressingFile(file.name);
              
              try {
                const compressedFile = await compressImage(file);
                console.log(`[Upload] Compressed ${file.name}: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`);
                
                // Check if compression brought it under the limit
                if (compressedFile.size > MAX_IMAGE_DOC_BYTES) {
                  throw new Error(`File still too large after compression (${formatFileSize(compressedFile.size)}). Please resize manually.`);
                }
                
                file = compressedFile;
              } catch (compressErr: any) {
                setCompressingFile(null);
                throw new Error(`File too large (${formatFileSize(file.size)}). ${compressErr.message || 'Compression failed.'}`);
              } finally {
                setCompressingFile(null);
              }
            } else {
              // File is too large and can't be compressed
              throw new Error(`File too large (${formatFileSize(file.size)}). Maximum size is ${MAX_IMAGE_DOC_MB}MB. Please resize or upload a smaller version.`);
            }
          }

          setUploadProgress(Math.round(((i + 0.3) / files.length) * 100));



          // Convert file to base64
          const fileData = await fileToBase64(file);
          setUploadProgress(Math.round(((i + 0.6) / files.length) * 100));

          console.log(`[Upload] Starting upload for: ${file.name} (${file.type}, ${file.size} bytes)`);

          // Use direct fetch to avoid Supabase client "Response could not be cloned" issue
          const functionUrl = 'https://lbweciluypxgmqcckfhu.databasepad.com/functions/v1/swor-file-upload';
          
          const uploadResponse = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5MjlmZGIzLTg5YmYtNDFlNS1iNGIxLWIwMmMwYmZkZDc3NiJ9.eyJwcm9qZWN0SWQiOiJsYndlY2lsdXlweGdtcWNja2ZodSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NzE2NjkzLCJleHAiOjIwODUwNzY2OTMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Hz8CWkSEVa0jkT7AhydWBvt04ZUdGBgEBrA7niFaqp4`
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fileData: fileData,
              journeyId: journeyId,
              visibility: selectedVisibility,
              sourceNotes: sourceNotes,
              uploadedBy: userId || userEmail,
              uploaderName: userName
            })
          });

          const responseData = await uploadResponse.json();
          
          // Log response for debugging
          console.log(`[Upload] Response for ${file.name}:`, responseData);

          // Check if response indicates failure
          if (!uploadResponse.ok || !responseData?.success) {
            const errorDetail = responseData?.error || responseData?.detail || `HTTP ${uploadResponse.status}`;
            console.error(`[Upload] Failed for ${file.name}:`, responseData);
            throw new Error(`${errorDetail}${responseData?.version ? ` (v${responseData.version})` : ''}`);
          }

          console.log(`[Upload] Success for ${file.name}:`, responseData);
          successfulUploads.push(file.name);
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        } catch (fileErr: any) {
          console.error(`[Upload] Exception for ${file.name}:`, fileErr);
          failedUploads.push(`${file.name}: ${fileErr.message}`);
        }
      }

      // Show results
      if (successfulUploads.length > 0) {
        setUploadSuccess(
          `${successfulUploads.length} file(s) uploaded successfully. They will appear in the Pending tab for review.`
        );
        setSourceNotes('');
        
        // Refresh the items list
        await fetchDraftItems();
        await fetchAuditLog();
        
        // Switch to pending tab after successful upload
        setTimeout(() => {
          setActiveTab('pending');
        }, 1500);
      }

      if (failedUploads.length > 0) {
        const errorDetails = failedUploads.join('\n\n');
        console.error('[Upload] Failed uploads:', errorDetails);
        setUploadError(`Failed to upload:\n${errorDetails}`);
      }

    } catch (err: any) {
      console.error('[Upload] Global error:', err);
      setUploadError(err.message || 'Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCompressingFile(null);
    }
  };



  // Submit text item
  const handleSubmitText = async () => {
    // Validate required fields
    if (!textTitle.trim()) {
      setUploadError('Title is required');
      return;
    }
    if (!textBody.trim()) {
      setUploadError('Body text is required');
      return;
    }

    setUploadError('');
    setUploadSuccess('');
    setSubmittingText(true);

    try {
      console.log('[Text Submit] Starting submission...');
      
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'submit_text_item',
          payload: {
            journey_id: journeyId,
            title: textTitle.trim(),
            body: textBody.trim(),
            visibility: selectedVisibility,
            source_notes: sourceNotes.trim(),
            credit_preference: creditPreference,
            credit_line: creditLine.trim(),
            rights_status: rightsStatus.trim(),
            submitted_by: userId || null,
            submitter_name: userName
          }
        }
      });

      console.log('[Text Submit] Response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Edge function error');
      }

      if (!data?.success) {
        throw new Error(data?.detail || data?.error || 'Failed to submit text');
      }

      // Success
      setUploadSuccess(`Text "${textTitle}" submitted for review successfully.`);
      
      // Clear form
      setTextTitle('');
      setTextBody('');
      setCreditPreference('none');
      setCreditLine('');
      setRightsStatus('');
      setSourceNotes('');
      
      // Refresh the items list
      await fetchDraftItems();
      await fetchAuditLog();
      
      // Switch to pending tab after successful submission
      setTimeout(() => {
        setActiveTab('pending');
      }, 1500);
    } catch (err: any) {
      console.error('[Text Submit] Error:', err);
      setUploadError(err.message || 'Failed to submit text. Please try again.');
    } finally {
      setSubmittingText(false);
    }
  };

  // Phase 4C: Submit link item
  const handleSubmitLink = async () => {
    // Validate required fields
    if (!linkUrl.trim()) {
      setUploadError('URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(linkUrl.trim());
    } catch {
      setUploadError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setUploadError('');
    setUploadSuccess('');
    setSubmittingLink(true);

    try {
      console.log('[Link Submit] Starting submission...');
      
      const { data, error } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'submit_link_item',
          payload: {
            journey_id: journeyId,
            url: linkUrl.trim(),
            title: linkTitle.trim() || null,
            description: linkDescription.trim() || null,
            allow_embedding: allowEmbedding,
            visibility: selectedVisibility,
            source_notes: sourceNotes.trim(),
            credit_preference: creditPreference,
            credit_line: creditLine.trim(),
            rights_status: rightsStatus.trim(),
            submitted_by: userId || null,
            submitter_name: userName
          }
        }
      });

      console.log('[Link Submit] Response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Edge function error');
      }

      if (!data?.success) {
        throw new Error(data?.detail || data?.error || 'Failed to submit link');
      }

      // Success
      const displayTitle = linkTitle.trim() || linkUrl.trim().substring(0, 30) + '...';
      setUploadSuccess(`Link "${displayTitle}" submitted for review successfully.`);
      
      // Clear form
      setLinkUrl('');
      setLinkTitle('');
      setLinkDescription('');
      setAllowEmbedding(false);
      setCreditPreference('none');
      setCreditLine('');
      setRightsStatus('');
      setSourceNotes('');
      
      // Refresh the items list
      await fetchDraftItems();
      await fetchAuditLog();
      
      // Switch to pending tab after successful submission
      setTimeout(() => {
        setActiveTab('pending');
      }, 1500);

    } catch (err: any) {
      console.error('[Link Submit] Error:', err);
      setUploadError(err.message || 'Failed to submit link. Please try again.');
    } finally {
      setSubmittingLink(false);
    }
  };



  const getFileIcon = (itemType: string, mime?: string | null) => {
    if (itemType === 'text') {
      return <Type className="w-5 h-5" />;
    }
    if (itemType === 'link') {
      return <Link2 className="w-5 h-5" />;
    }
    if (itemType === 'image' || (mime && mime.startsWith('image/'))) {
      return <Image className="w-5 h-5" />;
    }
    if (itemType === 'document' || (mime && (mime.includes('pdf') || mime.includes('word')))) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };



  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileName = (item: DraftItem): string => {
    if (item.item_type === 'text') {
      return item.content_json?.title || 'Untitled Text';
    }
    if (item.item_type === 'link') {
      return item.content_json?.title || item.content_json?.url || 'Untitled Link';
    }
    return item.content_json?.file_name || 'Unknown file';
  };



  const getUploaderName = (item: DraftItem): string => {
    return item.content_json?.uploader_name || item.content_json?.submitter_name || 'Unknown';
  };

  const getRejectionNote = (item: DraftItem): string | null => {
    return item.rejection_note || item.content_json?.rejection_note || null;
  };

  const getItemSizeDisplay = (item: DraftItem): string => {
    if (item.item_type === 'text') {
      const bodyLength = item.content_json?.body?.length || item.size || 0;
      return `${bodyLength} characters`;
    }
    if (item.item_type === 'link') {
      return 'External link';
    }
    return formatFileSize(item.size);
  };




  // PHASE 3.1: Approve action with server-side role enforcement + detailed error display
  // AUTH FIX v9.6: Support both auth token AND demo user authentication

  const handleApprove = async (itemId: string, fileName: string) => {
    // Add to processing set
    setProcessingItems(prev => new Set(prev).add(itemId));
    setActionFeedback(null);
    setItemsError('');

    try {
      console.log(`[Approve] Starting approval for item: ${itemId}`);
      
      // Check if this is a demo user (Builder Access)
      const demoUserStr = localStorage.getItem('swor_demo_user');
      const isDemoUser = !!demoUserStr;
      let demoUserEmail: string | null = null;
      
      if (isDemoUser) {
        try {
          const demoUser = JSON.parse(demoUserStr);
          demoUserEmail = demoUser.email;
          console.log(`[Approve] Demo user detected: ${demoUserEmail}`);
        } catch (e) {
          console.error('[Approve] Failed to parse demo user:', e);
        }
      }
      
      // Get the current session's access token (for non-demo users)
      let accessToken: string | null = null;
      if (!isDemoUser) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error('Authentication required. Please sign in to approve items.');
        }
        
        accessToken = sessionData.session.access_token;
        console.log(`[Approve] Using auth token from session`);
      }
      
      // Use direct fetch with Authorization header
      const functionUrl = 'https://lbweciluypxgmqcckfhu.databasepad.com/functions/v1/swor-file-upload';
      
      // Build request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // For demo users, use anon key; for real users, use access token
      if (isDemoUser) {
        headers['Authorization'] = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5MjlmZGIzLTg5YmYtNDFlNS1iNGIxLWIwMmMwYmZkZDc3NiJ9.eyJwcm9qZWN0SWQiOiJsYndlY2lsdXlweGdtcWNja2ZodSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NzE2NjkzLCJleHAiOjIwODUwNzY2OTMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Hz8CWkSEVa0jkT7AhydWBvt04ZUdGBgEBrA7niFaqp4`;
      } else {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Build payload
      const payload: Record<string, any> = {
        item_id: itemId
      };
      
      // For demo users, include the demo_user_email for server-side validation
      if (isDemoUser && demoUserEmail) {
        payload.demo_user_email = demoUserEmail;
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'approve_item',
          payload
        })
      });

      const statusCode = response.status;
      let data: any;
      let rawText = '';
      
      try {
        rawText = await response.text();
        data = JSON.parse(rawText);
      } catch (parseErr) {
        // If JSON parsing fails, use raw text
        data = { success: false, error: 'parse_error', detail: rawText || 'Empty response' };
      }

      console.log(`[Approve] Response (${statusCode}):`, data);

      // Handle non-2xx responses with detailed error display
      if (!response.ok || !data?.success) {
        const errorCode = data?.error || 'unknown_error';
        const errorDetail = data?.detail || 'Unknown error occurred';
        
        // Build detailed error message for display
        let displayMessage = `Approve failed (${statusCode}): `;
        
        if (statusCode === 401) {
          displayMessage += `Authentication required - ${errorDetail}`;
        } else if (statusCode === 403) {
          displayMessage += `Permission denied - ${errorDetail}`;
        } else if (statusCode === 404) {
          displayMessage += `Item not found - ${errorDetail}`;
        } else if (statusCode === 409) {
          displayMessage += `Conflict - ${errorDetail}`;
        } else if (statusCode === 422) {
          displayMessage += `Validation error - ${errorDetail}`;
        } else {
          displayMessage += `${errorCode}: ${errorDetail}`;
        }
        
        throw new Error(displayMessage);
      }

      // Show success feedback
      setActionFeedback({
        type: 'success',
        message: `"${fileName}" has been approved and is now published.`,
        itemId
      });

      // Mark as recently approved for highlight animation
      setRecentlyApproved(prev => new Set(prev).add(itemId));

      // Immediately remove from pending list (optimistic update)
      setDraftItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'approved' as Status, reviewed_by: data.reviewed_by || null, reviewed_at: new Date().toISOString() }
          : item
      ));

      // Refresh the audit log to show the new entry
      await fetchAuditLog();

    } catch (err: any) {
      console.error('[Approve] Error:', err);
      
      setActionFeedback({
        type: 'error',
        message: err.message || 'Unknown error occurred',
        itemId
      });
      
      // Refresh items to restore correct state
      await fetchDraftItems();
    } finally {
      // Remove from processing set
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };







  // PHASE 3: Open rejection modal
  const openRejectionModal = (itemId: string, fileName: string) => {
    setRejectionModal({
      isOpen: true,
      itemId,
      fileName
    });
    setRejectionNote('');
  };

  // PHASE 3: Close rejection modal
  const closeRejectionModal = () => {
    setRejectionModal({
      isOpen: false,
      itemId: '',
      fileName: ''
    });
    setRejectionNote('');
    setIsRejecting(false);
  };

  // PHASE 3.1: Reject action with server-side role enforcement
  // AUTH FIX v9.6: Support both auth token AND demo user authentication
  const handleReject = async () => {
    const { itemId, fileName } = rejectionModal;
    
    if (!itemId) return;

    setIsRejecting(true);
    setProcessingItems(prev => new Set(prev).add(itemId));
    setActionFeedback(null);
    setItemsError('');

    try {
      console.log(`[Reject] Starting rejection for item: ${itemId}`);
      
      // Check if this is a demo user (Builder Access)
      const demoUserStr = localStorage.getItem('swor_demo_user');
      const isDemoUser = !!demoUserStr;
      let demoUserEmail: string | null = null;
      
      if (isDemoUser) {
        try {
          const demoUser = JSON.parse(demoUserStr);
          demoUserEmail = demoUser.email;
          console.log(`[Reject] Demo user detected: ${demoUserEmail}`);
        } catch (e) {
          console.error('[Reject] Failed to parse demo user:', e);
        }
      }
      
      // Get the current session's access token (for non-demo users)
      let accessToken: string | null = null;
      if (!isDemoUser) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error('Authentication required. Please sign in to reject items.');
        }
        
        accessToken = sessionData.session.access_token;
        console.log(`[Reject] Using auth token from session`);
      }
      
      console.log(`[Reject] Rejection note: ${rejectionNote || '(none)'}`);
      
      // Use direct fetch with Authorization header
      const functionUrl = 'https://lbweciluypxgmqcckfhu.databasepad.com/functions/v1/swor-file-upload';
      
      // Build request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // For demo users, use anon key; for real users, use access token
      if (isDemoUser) {
        headers['Authorization'] = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5MjlmZGIzLTg5YmYtNDFlNS1iNGIxLWIwMmMwYmZkZDc3NiJ9.eyJwcm9qZWN0SWQiOiJsYndlY2lsdXlweGdtcWNja2ZodSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NzE2NjkzLCJleHAiOjIwODUwNzY2OTMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Hz8CWkSEVa0jkT7AhydWBvt04ZUdGBgEBrA7niFaqp4`;
      } else {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Build payload
      const payload: Record<string, any> = {
        item_id: itemId,
        rejection_note: rejectionNote.trim() || null
      };
      
      // For demo users, include the demo_user_email for server-side validation
      if (isDemoUser && demoUserEmail) {
        payload.demo_user_email = demoUserEmail;
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'reject_item',
          payload
        })
      });

      const statusCode = response.status;
      let data: any;
      let rawText = '';
      
      try {
        rawText = await response.text();
        data = JSON.parse(rawText);
      } catch (parseErr) {
        // If JSON parsing fails, use raw text
        data = { success: false, error: 'parse_error', detail: rawText || 'Empty response' };
      }

      console.log(`[Reject] Response (${statusCode}):`, data);

      // Handle non-2xx responses with detailed error display
      if (!response.ok || !data?.success) {
        const errorCode = data?.error || 'unknown_error';
        const errorDetail = data?.detail || 'Unknown error occurred';
        
        // Build detailed error message for display
        let displayMessage = `Reject failed (${statusCode}): `;
        
        if (statusCode === 401) {
          displayMessage += `Authentication required - ${errorDetail}`;
        } else if (statusCode === 403) {
          displayMessage += `Permission denied - ${errorDetail}`;
        } else if (statusCode === 422) {
          displayMessage += `Validation error - ${errorDetail}`;
        } else if (statusCode === 404) {
          displayMessage += `Item not found - ${errorDetail}`;
        } else if (statusCode === 409) {
          displayMessage += `Conflict - ${errorDetail}`;
        } else {
          displayMessage += `${errorCode}: ${errorDetail}`;
        }
        
        throw new Error(displayMessage);
      }

      // Close the modal
      closeRejectionModal();

      // Show success feedback
      setActionFeedback({
        type: 'success',
        message: `"${fileName}" has been rejected.${rejectionNote ? ' Note recorded.' : ''}`,
        itemId
      });

      // Mark as recently rejected for highlight animation
      setRecentlyRejected(prev => new Set(prev).add(itemId));

      // Immediately update in pending list (optimistic update)
      setDraftItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: 'rejected' as Status, 
              reviewed_by: data.reviewed_by || null, 
              reviewed_at: new Date().toISOString(),
              rejection_note: rejectionNote.trim() || null
            }
          : item
      ));

      // Refresh the audit log to show the new entry
      await fetchAuditLog();

    } catch (err: any) {
      console.error('[Reject] Error:', err);
      
      setActionFeedback({
        type: 'error',
        message: err.message || 'Unknown error occurred',
        itemId
      });
      
      // Refresh items to restore correct state
      await fetchDraftItems();
    } finally {
      setIsRejecting(false);
      // Remove from processing set
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };


  // Open reset to pending modal
  const openResetModal = (itemId: string, fileName: string, currentStatus: string) => {
    setResetModal({
      isOpen: true,
      itemId,
      fileName,
      currentStatus
    });
    setResetNote('');
  };

  // Close reset to pending modal
  const closeResetModal = () => {
    setResetModal({
      isOpen: false,
      itemId: '',
      fileName: '',
      currentStatus: ''
    });
    setResetNote('');
    setIsResetting(false);
  };

  // Handle reset to pending action
  const handleReset = async () => {
    const { itemId, fileName } = resetModal;
    
    if (!itemId) return;

    setIsResetting(true);
    setProcessingItems(prev => new Set(prev).add(itemId));
    setActionFeedback(null);
    setItemsError('');

    try {
      console.log(`[Reset] Starting reset to pending for item: ${itemId}`);
      
      // Check if this is a demo user (Builder Access)
      const demoUserStr = localStorage.getItem('swor_demo_user');
      const isDemoUser = !!demoUserStr;
      let demoUserEmail: string | null = null;
      
      if (isDemoUser) {
        try {
          const demoUser = JSON.parse(demoUserStr);
          demoUserEmail = demoUser.email;
          console.log(`[Reset] Demo user detected: ${demoUserEmail}`);
        } catch (e) {
          console.error('[Reset] Failed to parse demo user:', e);
        }
      }
      
      // Get the current session's access token (for non-demo users)
      let accessToken: string | null = null;
      if (!isDemoUser) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error('Authentication required. Please sign in to reset items.');
        }
        
        accessToken = sessionData.session.access_token;
        console.log(`[Reset] Using auth token from session`);
      }
      
      console.log(`[Reset] Reset note: ${resetNote || '(none)'}`);
      
      // Use direct fetch with Authorization header
      const functionUrl = 'https://lbweciluypxgmqcckfhu.databasepad.com/functions/v1/swor-file-upload';
      
      // Build request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // For demo users, use anon key; for real users, use access token
      if (isDemoUser) {
        headers['Authorization'] = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5MjlmZGIzLTg5YmYtNDFlNS1iNGIxLWIwMmMwYmZkZDc3NiJ9.eyJwcm9qZWN0SWQiOiJsYndlY2lsdXlweGdtcWNja2ZodSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NzE2NjkzLCJleHAiOjIwODUwNzY2OTMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Hz8CWkSEVa0jkT7AhydWBvt04ZUdGBgEBrA7niFaqp4`;
      } else {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Build payload
      const payload: Record<string, any> = {
        item_id: itemId,
        reset_note: resetNote.trim() || null
      };
      
      // For demo users, include the demo_user_email for server-side validation
      if (isDemoUser && demoUserEmail) {
        payload.demo_user_email = demoUserEmail;
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'reset_to_pending',
          payload
        })
      });

      const statusCode = response.status;
      let data: any;
      let rawText = '';
      
      try {
        rawText = await response.text();
        data = JSON.parse(rawText);
      } catch (parseErr) {
        // If JSON parsing fails, use raw text
        data = { success: false, error: 'parse_error', detail: rawText || 'Empty response' };
      }

      console.log(`[Reset] Response (${statusCode}):`, data);

      // Handle non-2xx responses with detailed error display
      if (!response.ok || !data?.success) {
        const errorCode = data?.error || 'unknown_error';
        const errorDetail = data?.detail || 'Unknown error occurred';
        
        // Build detailed error message for display
        let displayMessage = `Reset failed (${statusCode}): `;
        
        if (statusCode === 401) {
          displayMessage += `Authentication required - ${errorDetail}`;
        } else if (statusCode === 403) {
          displayMessage += `Permission denied - ${errorDetail}`;
        } else if (statusCode === 422) {
          displayMessage += `Validation error - ${errorDetail}`;
        } else if (statusCode === 404) {
          displayMessage += `Item not found - ${errorDetail}`;
        } else if (statusCode === 409) {
          displayMessage += `Conflict - ${errorDetail}`;
        } else {
          displayMessage += `${errorCode}: ${errorDetail}`;
        }
        
        throw new Error(displayMessage);
      }

      // Close the modal
      closeResetModal();

      // Show success feedback
      setActionFeedback({
        type: 'success',
        message: `"${fileName}" has been sent back for review.${resetNote ? ' Note recorded.' : ''}`,
        itemId
      });

      // Mark as recently reset for highlight animation
      setRecentlyReset(prev => new Set(prev).add(itemId));

      // Immediately update in items list (optimistic update)
      setDraftItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: 'submitted_for_review' as Status, 
              reviewed_by: null, 
              reviewed_at: null
            }
          : item
      ));

      // Refresh the audit log to show the new entry
      await fetchAuditLog();

    } catch (err: any) {
      console.error('[Reset] Error:', err);
      
      setActionFeedback({
        type: 'error',
        message: err.message || 'Unknown error occurred',
        itemId
      });
      
      // Refresh items to restore correct state
      await fetchDraftItems();
    } finally {
      setIsResetting(false);
      // Remove from processing set
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };


  // Open file preview modal

  // Open file preview modal - handles text, video, and file items
  const handlePreview = (item: DraftItem) => {
    // For text items, show text preview modal
    if (item.item_type === 'text') {
      setTextPreviewState({
        isOpen: true,
        title: item.content_json?.title || 'Untitled',
        body: item.content_json?.body || '',
        creditLine: item.content_json?.credit_line || null,
        rightsStatus: item.content_json?.rights_status || null
      });
      return;
    }

    // For video items, show video preview modal
    if (item.item_type === 'video') {
      if (!item.storage_path) {
        setActionFeedback({
          type: 'error',
          message: 'Cannot preview this video - no storage path available',
        });
        return;
      }
      
      setVideoPreviewState({
        isOpen: true,
        fileName: item.content_json?.file_name || 'Video',
        storagePath: item.storage_path,
        thumbPath: item.thumb_path || item.content_json?.thumb_path || null,
        mime: item.mime,
        fileSize: item.size,
        duration: item.content_json?.duration || null,
        title: item.content_json?.title || null,
        description: item.content_json?.description || null,
        creditPreference: item.content_json?.credit_preference || null,
        creditLine: item.content_json?.credit_line || null,
        rightsStatus: item.content_json?.rights_status || null,
        sourceNotes: item.source_notes || item.content_json?.source_notes || null,
        visibility: item.visibility,
        uploaderName: item.content_json?.uploader_name || item.content_json?.submitter_name || null,
        createdAt: item.created_at
      });
      return;
    }

    // For file items (image/document), show file preview modal
    if (!item.storage_path) {
      setActionFeedback({
        type: 'error',
        message: 'Cannot preview this file - no storage path available',
      });
      return;
    }
    
    setPreviewState({
      isOpen: true,
      fileName: getFileName(item),
      storagePath: item.storage_path,
      mime: item.mime,
      fileSize: item.size
    });
  };

  // Close video preview modal
  const closeVideoPreview = () => {
    setVideoPreviewState({
      isOpen: false,
      fileName: '',
      storagePath: '',
      thumbPath: null,
      mime: null,
      fileSize: null,
      duration: null,
      title: null,
      description: null,
      creditPreference: null,
      creditLine: null,
      rightsStatus: null,
      sourceNotes: null,
      visibility: null,
      uploaderName: null,
      createdAt: null
    });
  };


  // Close file preview modal
  const closePreview = () => {
    setPreviewState({
      isOpen: false,
      fileName: '',
      storagePath: '',
      mime: null,
      fileSize: null
    });
  };

  // Close text preview modal
  const closeTextPreview = () => {
    setTextPreviewState({
      isOpen: false,
      title: '',
      body: '',
      creditLine: null,
      rightsStatus: null
    });
  };

  // Filter items by status - only 'submitted_for_review' appears in pending queue
  const pendingItems = draftItems.filter(item => 
    item.status === 'submitted_for_review' || item.status === 'pending_review'
  );
  const approvedItems = draftItems.filter(item => item.status === 'approved');
  const rejectedItems = draftItems.filter(item => item.status === 'rejected');

  // Get action label for audit entries
  const getActionLabel = (action: string): { label: string; color: string; icon: React.ReactNode } => {
    switch (action) {
      case 'upload_created':
        return { label: 'Upload Created', color: 'text-blue-600 bg-blue-50', icon: <Upload className="w-3.5 h-3.5" /> };
      case 'text_submitted':
        return { label: 'Text Submitted', color: 'text-purple-600 bg-purple-50', icon: <Type className="w-3.5 h-3.5" /> };
      case 'link_submitted':
        return { label: 'Link Submitted', color: 'text-indigo-600 bg-indigo-50', icon: <Link2 className="w-3.5 h-3.5" /> };
      case 'video_submitted':
        return { label: 'Video Submitted', color: 'text-cyan-600 bg-cyan-50', icon: <Video className="w-3.5 h-3.5" /> };
      case 'item_approved':
        return { label: 'Item Approved', color: 'text-green-600 bg-green-50', icon: <CheckCircle className="w-3.5 h-3.5" /> };
      case 'item_rejected':
        return { label: 'Item Rejected', color: 'text-red-600 bg-red-50', icon: <XCircle className="w-3.5 h-3.5" /> };
      case 'item_reset_to_pending':
        return { label: 'Sent Back for Review', color: 'text-amber-600 bg-amber-50', icon: <RotateCcw className="w-3.5 h-3.5" /> };
      case 'steward_added':
        return { label: 'Steward Added', color: 'text-indigo-600 bg-indigo-50', icon: <UserPlus className="w-3.5 h-3.5" /> };
      case 'steward_removed':
        return { label: 'Steward Removed', color: 'text-orange-600 bg-orange-50', icon: <Trash2 className="w-3.5 h-3.5" /> };
      default:
        return { label: action.replace(/_/g, ' '), color: 'text-gray-600 bg-gray-50', icon: <FileText className="w-3.5 h-3.5" /> };
    }
  };


  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#F5F1E8] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1A2332]/10">
          <div>
            <h2 className="font-serif text-xl text-[#1A2332]">Steward Dashboard</h2>
            <p className="text-sm text-[#1A2332]/60 mt-1">{journeyTitle}</p>
          </div>
          <button onClick={onClose} className="text-[#1A2332]/60 hover:text-[#1A2332]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Notice - Draft First Principle */}
        <div className="px-6 py-3 bg-[#8B9D83]/10 border-b border-[#1A2332]/10">
          <div className="flex items-center">
            <Shield className="w-4 h-4 text-[#8B9D83] mr-2 flex-shrink-0" />
            <p className="text-sm text-[#1A2332]/70">
              <span className="font-medium">Nothing is public until approved.</span> All uploads default to Private Draft.
            </p>
          </div>
        </div>

        {/* Action Feedback Toast */}
        {actionFeedback && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm border flex items-start animate-in fade-in slide-in-from-top-2 duration-300 ${
            actionFeedback.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {actionFeedback.type === 'success' ? (
              <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#1A2332]/10">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-[#B8826D] border-b-2 border-[#B8826D] bg-white/50'
                : 'text-[#1A2332]/60 hover:text-[#1A2332]'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Contribute
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-[#B8826D] border-b-2 border-[#B8826D] bg-white/50'
                : 'text-[#1A2332]/60 hover:text-[#1A2332]'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Review
            {pendingItems.length > 0 && (
              <span className="absolute top-2 right-4 w-5 h-5 bg-[#B8826D] text-white text-xs rounded-full flex items-center justify-center">
                {pendingItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'audit'
                ? 'text-[#B8826D] border-b-2 border-[#B8826D] bg-white/50'
                : 'text-[#1A2332]/60 hover:text-[#1A2332]'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Audit Trail
          </button>
          {/* Phase 4B: Stewards tab - only visible to global stewards */}
          {!checkingGlobalSteward && isGlobalSteward && (
            <button
              onClick={() => setActiveTab('stewards')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'stewards'
                  ? 'text-[#B8826D] border-b-2 border-[#B8826D] bg-white/50'
                  : 'text-[#1A2332]/60 hover:text-[#1A2332]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 inline mr-2" />
              Stewards
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Error/Success Messages */}
              {uploadError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Error</p>
                      <pre className="mt-1 text-xs whitespace-pre-wrap break-words font-mono bg-red-100/50 p-2 rounded max-h-40 overflow-auto">
                        {uploadError}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {uploadSuccess}
                </div>
              )}

              {/* Upload Mode Toggle */}
              <div className="flex rounded-lg bg-[#1A2332]/5 p-1">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-white text-[#B8826D] shadow-sm'
                      : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  File
                </button>
                <button
                  onClick={() => setUploadMode('text')}
                  className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'text'
                      ? 'bg-white text-[#B8826D] shadow-sm'
                      : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                  }`}
                >
                  <PenLine className="w-4 h-4 mr-1" />
                  Text
                </button>
                <button
                  onClick={() => setUploadMode('link')}
                  className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'link'
                      ? 'bg-white text-[#B8826D] shadow-sm'
                      : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                  }`}
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Link
                </button>
                <button
                  onClick={() => setUploadMode('video')}
                  className={`flex-1 flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMode === 'video'
                      ? 'bg-white text-[#B8826D] shadow-sm'
                      : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                  }`}
                >
                  <Video className="w-4 h-4 mr-1" />
                  Video
                </button>
              </div>





              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <>
                  {/* Visibility Selector */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Visibility (who can see this after approval)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {visibilityOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedVisibility(option.value)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedVisibility === option.value
                              ? 'border-[#B8826D] bg-[#B8826D]/5'
                              : 'border-[#1A2332]/10 hover:border-[#1A2332]/20'
                          }`}
                        >
                          <div className="flex items-center">
                            <option.icon className={`w-4 h-4 mr-2 ${
                              selectedVisibility === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]/40'
                            }`} />
                            <span className={`text-sm font-medium ${
                              selectedVisibility === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]'
                            }`}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#1A2332]/50 mt-1 ml-6">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Source Notes - Attribution Principle */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Source Notes (optional)
                    </label>
                    <textarea
                      value={sourceNotes}
                      onChange={(e) => setSourceNotes(e.target.value)}
                      placeholder="Where did this come from? Who provided it? Any context that helps..."
                      className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] resize-none text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-[#B8826D] bg-[#B8826D]/5'
                        : 'border-[#1A2332]/20 hover:border-[#1A2332]/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {uploading ? (
                      <div className="space-y-4">
                        <Loader2 className="w-10 h-10 text-[#B8826D] mx-auto animate-spin" />
                        <p className="text-[#1A2332]/70">
                          {compressingFile 
                            ? `Compressing ${compressingFile}...` 
                            : `Uploading... ${uploadProgress}%`
                          }
                        </p>
                        <div className="w-full bg-[#1A2332]/10 rounded-full h-2 max-w-xs mx-auto">
                          <div
                            className="bg-[#B8826D] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-[#1A2332]/30 mx-auto mb-4" />
                        <p className="text-[#1A2332]/70 mb-2">
                          Drag and drop files here, or{' '}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[#B8826D] font-medium hover:underline"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-[#1A2332]/50">
                          Supports: Word, PDF, Images (JPG, PNG, GIF, WebP)
                        </p>
                        {/* File size limit notice - always visible */}
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          Images and documents: max {MAX_IMAGE_DOC_MB}MB per file. Video: max {MAX_VIDEO_MB}MB per file.
                        </p>
                        <p className="text-xs text-[#1A2332]/40 mt-1 italic">
                          If we can read it, we can organise it.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Auto-compress toggle for images */}
                  <div className="flex items-center justify-between p-3 bg-[#8B9D83]/5 rounded-lg border border-[#8B9D83]/20">
                    <div className="flex items-center">
                      <Minimize2 className="w-4 h-4 text-[#8B9D83] mr-2" />
                      <div>
                        <p className="text-sm text-[#1A2332] font-medium">Auto-compress large images</p>
                        <p className="text-xs text-[#1A2332]/50">Automatically resize images over {MAX_IMAGE_DOC_MB}MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoCompress(!autoCompress)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoCompress ? 'bg-[#8B9D83]' : 'bg-[#1A2332]/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoCompress ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Accepted File Types */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="inline-flex items-center px-3 py-1.5 bg-white rounded text-xs text-[#1A2332]/60 border border-[#1A2332]/10">
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Word (.doc, .docx)
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 bg-white rounded text-xs text-[#1A2332]/60 border border-[#1A2332]/10">
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      PDF
                    </span>
                    <span className="inline-flex items-center px-3 py-1.5 bg-white rounded text-xs text-[#1A2332]/60 border border-[#1A2332]/10">
                      <Image className="w-3.5 h-3.5 mr-1.5" />
                      Images / Scans
                    </span>
                  </div>

                </>
              )}





              {uploadMode === 'text' && (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder="Enter a title for this narrative or context..."
                      className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-sm"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Body <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      placeholder="Write your narrative, context, or story here..."
                      className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] resize-none text-sm"
                      rows={6}
                    />
                    <p className="text-xs text-[#1A2332]/40 mt-1 text-right">
                      {textBody.length} characters
                    </p>
                  </div>

                  {/* Visibility Selector */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Visibility (who can see this after approval)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {visibilityOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedVisibility(option.value)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedVisibility === option.value
                              ? 'border-[#B8826D] bg-[#B8826D]/5'
                              : 'border-[#1A2332]/10 hover:border-[#1A2332]/20'
                          }`}
                        >
                          <div className="flex items-center">
                            <option.icon className={`w-4 h-4 mr-2 ${
                              selectedVisibility === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]/40'
                            }`} />
                            <span className={`text-sm font-medium ${
                              selectedVisibility === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]'
                            }`}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#1A2332]/50 mt-1 ml-6">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credit Preference */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Credit Preference
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {creditPreferenceOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setCreditPreference(option.value)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            creditPreference === option.value
                              ? 'border-[#8B9D83] bg-[#8B9D83]/5'
                              : 'border-[#1A2332]/10 hover:border-[#1A2332]/20'
                          }`}
                        >
                          <div className="flex items-center">
                            <option.icon className={`w-4 h-4 mr-2 ${
                              creditPreference === option.value ? 'text-[#8B9D83]' : 'text-[#1A2332]/40'
                            }`} />
                            <span className={`text-sm font-medium ${
                              creditPreference === option.value ? 'text-[#8B9D83]' : 'text-[#1A2332]'
                            }`}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#1A2332]/50 mt-1 ml-6">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Credit Line (shown when name or organisation selected) */}
                  {(creditPreference === 'name' || creditPreference === 'organisation') && (
                    <div>
                      <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                        Credit Line (optional)
                      </label>
                      <input
                        type="text"
                        value={creditLine}
                        onChange={(e) => setCreditLine(e.target.value)}
                        placeholder={creditPreference === 'name' ? 'e.g., John Smith, Family Historian' : 'e.g., The Smith Family Archive'}
                        className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-sm"
                      />
                    </div>
                  )}

                  {/* Source Notes */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Source Notes (optional, internal)
                    </label>
                    <textarea
                      value={sourceNotes}
                      onChange={(e) => setSourceNotes(e.target.value)}
                      placeholder="Any context about where this information came from..."
                      className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] resize-none text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Rights Status */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                      Rights Status (optional)
                    </label>
                    <input
                      type="text"
                      value={rightsStatus}
                      onChange={(e) => setRightsStatus(e.target.value)}
                      placeholder="e.g., Original work, Public domain, Used with permission..."
                      className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitText}
                    disabled={submittingText || !textTitle.trim() || !textBody.trim()}
                    className="w-full py-3 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submittingText ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <PenLine className="w-4 h-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Phase 4C: Link Mode Form */}
              {uploadMode === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">URL *</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">Title (optional)</label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Article or resource title"
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">Description (optional)</label>
                    <textarea
                      value={linkDescription}
                      onChange={(e) => setLinkDescription(e.target.value)}
                      placeholder="Brief description of the linked content"
                      rows={2}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm resize-none"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowEmbedding"
                      checked={allowEmbedding}
                      onChange={(e) => setAllowEmbedding(e.target.checked)}
                      className="w-4 h-4 text-[#B8826D] border-[#1A2332]/20 rounded focus:ring-[#B8826D]"
                    />
                    <label htmlFor="allowEmbedding" className="ml-2 text-sm text-[#1A2332]">
                      Allow embedding (for YouTube/Vimeo videos)
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">Source Notes</label>
                    <textarea
                      value={sourceNotes}
                      onChange={(e) => setSourceNotes(e.target.value)}
                      placeholder="Context about this link"
                      rows={2}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSubmitLink}
                    disabled={submittingLink || !linkUrl.trim()}
                    className="w-full py-2.5 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
                  >
                    {submittingLink ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Submit Link for Review
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Phase 4D: Video Upload Mode */}
              {uploadMode === 'video' && (
                <div className="space-y-4">
                  {/* Size limit notice */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start">
                      <Video className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Video Upload Guidelines</p>
                        <p className="text-xs mt-1">Maximum file size: {MAX_VIDEO_MB}MB. Supported formats: MP4, MOV, WebM.</p>
                      </div>
                    </div>
                  </div>

                  {/* Video file selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">Select Video File *</label>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate file type
                        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
                          setUploadError(`Invalid video format. Allowed: MP4, MOV, WebM`);
                          return;
                        }
                        
                        // Validate file size
                        if (file.size > MAX_VIDEO_BYTES) {
                          setUploadError(`Video too large (${formatFileSize(file.size)}). Maximum size is ${MAX_VIDEO_MB}MB.`);
                          return;
                        }
                        
                        setUploadError('');
                        setSelectedVideoFile(file);
                        setVideoThumbnailPreview(null);
                        setVideoDuration(null);
                        
                        // Generate thumbnail
                        setGeneratingThumbnail(true);
                        try {
                          const video = document.createElement('video');
                          video.preload = 'metadata';
                          video.muted = true;
                          
                          const objectUrl = URL.createObjectURL(file);
                          video.src = objectUrl;
                          
                          await new Promise<void>((resolve, reject) => {
                            video.onloadedmetadata = () => {
                              setVideoDuration(video.duration);
                              video.currentTime = Math.min(2, video.duration / 4);
                            };
                            video.onseeked = () => {
                              const canvas = document.createElement('canvas');
                              canvas.width = video.videoWidth;
                              canvas.height = video.videoHeight;
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                setVideoThumbnailPreview(thumbnailDataUrl);
                              }
                              URL.revokeObjectURL(objectUrl);
                              resolve();
                            };
                            video.onerror = () => {
                              URL.revokeObjectURL(objectUrl);
                              reject(new Error('Failed to load video'));
                            };
                          });
                        } catch (err) {
                          console.error('Thumbnail generation failed:', err);
                        } finally {
                          setGeneratingThumbnail(false);
                        }
                      }}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#B8826D]/10 file:text-[#B8826D] hover:file:bg-[#B8826D]/20"
                    />
                  </div>

                  {/* Selected video info */}
                  {selectedVideoFile && (
                    <div className="bg-[#F5F1E8] rounded-lg p-4 border border-[#1A2332]/10">
                      <div className="flex items-start space-x-4">
                        {/* Thumbnail preview */}
                        <div className="w-24 h-16 bg-[#1A2332]/10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {generatingThumbnail ? (
                            <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" />
                          ) : videoThumbnailPreview ? (
                            <img src={videoThumbnailPreview} alt="Video thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-6 h-6 text-[#1A2332]/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1A2332] text-sm truncate">{selectedVideoFile.name}</p>
                          <p className="text-xs text-[#1A2332]/50 mt-0.5">
                            {formatFileSize(selectedVideoFile.size)}
                            {videoDuration && ` • ${formatDuration(videoDuration)}`}
                          </p>
                          <p className="text-xs text-[#1A2332]/40 mt-0.5">{selectedVideoFile.type}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedVideoFile(null);
                            setVideoThumbnailPreview(null);
                            setVideoDuration(null);
                            if (videoInputRef.current) videoInputRef.current.value = '';
                          }}
                          className="text-[#1A2332]/40 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Title (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">Title (optional)</label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Video title or description"
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                    />
                  </div>

                  {/* Description (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">Description (optional)</label>
                    <textarea
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      placeholder="Brief description of the video content"
                      rows={2}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm resize-none"
                    />
                  </div>

                  {/* Compression toggle with guidance */}
                  <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <div className="flex items-center">
                      <Minimize2 className="w-4 h-4 text-amber-600 mr-2" />
                      <div>
                        <p className="text-sm text-[#1A2332] font-medium">Compress video (recommended)</p>
                        <p className="text-xs text-[#1A2332]/50">Note: Browser compression may not be available on all devices</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setVideoCompressEnabled(!videoCompressEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        videoCompressEnabled ? 'bg-amber-500' : 'bg-[#1A2332]/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          videoCompressEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {videoCompressEnabled && (
                    <p className="text-xs text-amber-600 -mt-2 ml-1">
                      If compression isn't available on this device, please upload a smaller or pre-compressed version.
                    </p>
                  )}

                  {/* Source Notes */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-1.5">Source Notes (optional)</label>
                    <textarea
                      value={sourceNotes}
                      onChange={(e) => setSourceNotes(e.target.value)}
                      placeholder="Context about this video"
                      rows={2}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm resize-none"
                    />
                  </div>

                  {/* Upload progress */}
                  {uploadingVideo && (
                    <div className="bg-[#B8826D]/5 rounded-lg p-4 border border-[#B8826D]/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#1A2332] font-medium">Uploading video...</span>
                        <span className="text-sm text-[#B8826D]">{videoUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#1A2332]/10 rounded-full h-2">
                        <div
                          className="bg-[#B8826D] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={async () => {
                      if (!selectedVideoFile) {
                        setUploadError('Please select a video file');
                        return;
                      }

                      setUploadError('');
                      setUploadSuccess('');
                      setUploadingVideo(true);
                      setVideoUploadProgress(0);

                      try {
                        // Step 1: Get signed upload URL
                        console.log('[Video Upload] Step 1: Getting signed upload URL...');
                        setVideoUploadProgress(5);
                        
                        const { data: urlData, error: urlError } = await supabase.functions.invoke('swor-file-upload', {
                          body: {
                            action: 'get_video_upload_url',
                            payload: {
                              journey_id: journeyId,
                              file_name: selectedVideoFile.name,
                              file_type: selectedVideoFile.type,
                              file_size: selectedVideoFile.size
                            }
                          }
                        });

                        if (urlError || !urlData?.success) {
                          throw new Error(urlData?.detail || urlData?.error || 'Failed to get upload URL');
                        }

                        console.log('[Video Upload] Got upload URL:', urlData);
                        setVideoUploadProgress(15);

                        // Step 2: Upload video directly to storage
                        console.log('[Video Upload] Step 2: Uploading to storage...');
                        
                        const uploadUrl = urlData.upload_url;
                        const storagePath = urlData.storage_path;
                        const thumbPath = urlData.thumb_path;

                        // Upload video file
                        const videoUploadResponse = await fetch(uploadUrl, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': selectedVideoFile.type
                          },
                          body: selectedVideoFile
                        });

                        if (!videoUploadResponse.ok) {
                          throw new Error(`Video upload failed: ${videoUploadResponse.status}`);
                        }

                        console.log('[Video Upload] Video uploaded successfully');
                        setVideoUploadProgress(70);

                        // Step 3: Upload thumbnail if available
                        let finalThumbPath = null;
                        if (videoThumbnailPreview && urlData.thumb_upload_url) {
                          console.log('[Video Upload] Step 3: Uploading thumbnail...');
                          try {
                            // Convert data URL to blob
                            const thumbResponse = await fetch(videoThumbnailPreview);
                            const thumbBlob = await thumbResponse.blob();
                            
                            const thumbUploadResponse = await fetch(urlData.thumb_upload_url, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'image/jpeg'
                              },
                              body: thumbBlob
                            });

                            if (thumbUploadResponse.ok) {
                              finalThumbPath = thumbPath;
                              console.log('[Video Upload] Thumbnail uploaded successfully');
                            }
                          } catch (thumbErr) {
                            console.warn('[Video Upload] Thumbnail upload failed:', thumbErr);
                          }
                        }
                        setVideoUploadProgress(85);

                        // Step 4: Register the video upload
                        console.log('[Video Upload] Step 4: Registering upload...');
                        
                        const { data: registerData, error: registerError } = await supabase.functions.invoke('swor-file-upload', {
                          body: {
                            action: 'register_video_upload',
                            payload: {
                              journey_id: journeyId,
                              storage_path: storagePath,
                              thumb_path: finalThumbPath,
                              file_name: selectedVideoFile.name,
                              file_type: selectedVideoFile.type,
                              file_size: selectedVideoFile.size,
                              duration: videoDuration,
                              title: videoTitle.trim() || null,
                              description: videoDescription.trim() || null,
                              visibility: selectedVisibility,
                              source_notes: sourceNotes.trim() || null,
                              credit_preference: creditPreference,
                              credit_line: creditLine.trim() || null,
                              rights_status: rightsStatus.trim() || null,
                              compression_applied: videoCompressEnabled,
                              submitted_by: userId || null,
                              submitter_name: userName
                            }
                          }
                        });

                        if (registerError || !registerData?.success) {
                          throw new Error(registerData?.detail || registerData?.error || 'Failed to register video');
                        }

                        console.log('[Video Upload] Registration complete:', registerData);
                        setVideoUploadProgress(100);

                        // Success
                        setUploadSuccess(`Video "${videoTitle || selectedVideoFile.name}" uploaded successfully and submitted for review.`);
                        
                        // Clear form
                        setSelectedVideoFile(null);
                        setVideoThumbnailPreview(null);
                        setVideoDuration(null);
                        setVideoTitle('');
                        setVideoDescription('');
                        setSourceNotes('');
                        if (videoInputRef.current) videoInputRef.current.value = '';

                        // Refresh items and switch to pending tab
                        await fetchDraftItems();
                        await fetchAuditLog();
                        
                        setTimeout(() => {
                          setActiveTab('pending');
                        }, 1500);

                      } catch (err: any) {
                        console.error('[Video Upload] Error:', err);
                        setUploadError(err.message || 'Failed to upload video. Please try again.');
                      } finally {
                        setUploadingVideo(false);
                        setVideoUploadProgress(0);
                      }
                    }}
                    disabled={uploadingVideo || !selectedVideoFile}
                    className="w-full py-2.5 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
                  >
                    {uploadingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading Video...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Upload Video for Review
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending Tab */}

          {activeTab === 'pending' && (
            <div className="space-y-6">
              {/* Refresh button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchDraftItems}
                  disabled={loadingItems}
                  className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingItems ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Error message */}
              {itemsError && (
                <ErrorDisplay
                  error={itemsError}
                  variant="inline"
                  onDismiss={() => setItemsError('')}
                />
              )}

              {loadingItems ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                  <p className="text-[#1A2332]/60 mt-4">Loading items...</p>
                </div>
              ) : draftItems.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                  <p className="text-[#1A2332]/60">No items yet</p>
                  <p className="text-sm text-[#1A2332]/40 mt-2">
                    Uploaded files and text will appear here for review.
                  </p>
                </div>
              ) : (
                <>

                  {/* Pending Review */}
                  {pendingItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#1A2332]/70 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-500" />
                        Pending Review ({pendingItems.length})
                      </h3>
                      
                      {/* Video Thumbnail Grid - for video items */}
                      {pendingItems.filter(item => item.item_type === 'video').length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-medium text-[#1A2332]/50 mb-2 flex items-center">
                            <Video className="w-3.5 h-3.5 mr-1.5" />
                            Videos ({pendingItems.filter(item => item.item_type === 'video').length})
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {pendingItems
                              .filter(item => item.item_type === 'video')
                              .map(item => {
                                const isProcessing = processingItems.has(item.id);
                                const fileName = getFileName(item);
                                const duration = item.content_json?.duration;
                                const thumbUrl = item.thumb_signed_url || null;
                                
                                return (
                                  <div
                                    key={item.id}
                                    className={`group relative bg-[#1A2332]/5 rounded-lg overflow-hidden border border-[#1A2332]/10 hover:border-[#B8826D]/50 transition-all cursor-pointer ${
                                      isProcessing ? 'opacity-60' : ''
                                    }`}
                                    onClick={() => !isProcessing && handlePreview(item)}
                                  >
                                    {/* Thumbnail */}
                                    <div className="aspect-video relative bg-[#1A2332]/10">
                                      {thumbUrl ? (
                                        <img
                                          src={thumbUrl}
                                          alt={fileName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Film className="w-8 h-8 text-[#1A2332]/20" />
                                        </div>
                                      )}
                                      
                                      {/* Play Icon Overlay */}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                          <Play className="w-5 h-5 text-[#B8826D] ml-0.5" />
                                        </div>
                                      </div>
                                      
                                      {/* Duration Badge */}
                                      {duration && (
                                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium">
                                          {formatDuration(duration)}
                                        </div>
                                      )}
                                      
                                      {/* Processing Indicator */}
                                      {isProcessing && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                                          <Loader2 className="w-6 h-6 text-[#B8826D] animate-spin" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Filename */}
                                    <div className="p-2">
                                      <p className="text-xs text-[#1A2332] font-medium truncate" title={fileName}>
                                        {fileName}
                                      </p>
                                      <p className="text-[10px] text-[#1A2332]/50 truncate">
                                        {formatFileSize(item.size)}
                                      </p>
                                    </div>
                                    
                                    {/* Quick Action Buttons */}
                                    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApprove(item.id, fileName);
                                        }}
                                        disabled={isProcessing}
                                        className="w-6 h-6 rounded bg-[#8B9D83] text-white flex items-center justify-center hover:bg-[#8B9D83]/90 transition-colors disabled:opacity-50"
                                        title="Approve"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openRejectionModal(item.id, fileName);
                                        }}
                                        disabled={isProcessing}
                                        className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                                        title="Reject"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                      
                      {/* List View - for non-video items */}
                      {pendingItems.filter(item => item.item_type !== 'video').length > 0 && (
                        <div className="space-y-3">
                          {pendingItems.filter(item => item.item_type !== 'video').length > 0 && 
                           pendingItems.filter(item => item.item_type === 'video').length > 0 && (
                            <h4 className="text-xs font-medium text-[#1A2332]/50 mb-2 flex items-center">
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              Other Items ({pendingItems.filter(item => item.item_type !== 'video').length})
                            </h4>
                          )}
                          {pendingItems.filter(item => item.item_type !== 'video').map(item => {
                            const isProcessing = processingItems.has(item.id);
                            const fileName = getFileName(item);
                            const isTextItem = item.item_type === 'text';
                            
                            return (
                              <div
                                key={item.id}
                                className={`bg-white rounded-lg p-4 border border-[#1A2332]/10 transition-all duration-300 ${
                                  isProcessing ? 'opacity-60' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                      isTextItem ? 'bg-purple-50 text-purple-500' : 'bg-[#F5F1E8] text-[#1A2332]/40'
                                    }`}>
                                      {getFileIcon(item.item_type, item.mime)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-[#1A2332] text-sm">{fileName}</p>
                                      <p className="text-xs text-[#1A2332]/50 mt-0.5">
                                        {getItemSizeDisplay(item)} - {isTextItem ? 'Submitted' : 'Uploaded'} by {getUploaderName(item)}
                                      </p>
                                      <p className="text-xs text-[#1A2332]/40 mt-0.5">
                                        {formatDate(item.created_at)}
                                      </p>
                                      {item.source_notes && (
                                        <p className="text-xs text-[#8B9D83] mt-1 italic">
                                          "{item.source_notes}"
                                        </p>
                                      )}
                                      {/* Show text preview for text items */}
                                      {isTextItem && item.content_json?.body && (
                                        <p className="text-xs text-[#1A2332]/60 mt-2 line-clamp-2 bg-[#F5F1E8] p-2 rounded">
                                          {item.content_json.body.substring(0, 150)}
                                          {item.content_json.body.length > 150 ? '...' : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      isTextItem ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {isTextItem ? 'Text' : 'File'} - Pending
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1A2332]/5">
                                  <div className="flex items-center text-xs text-[#1A2332]/50">
                                    <Lock className="w-3.5 h-3.5 mr-1" />
                                    {visibilityOptions.find(v => v.value === item.visibility)?.label || item.visibility}
                                  </div>
                                  <div className="flex space-x-2">
                                    {/* Preview Button */}
                                    <button
                                      onClick={() => handlePreview(item)}
                                      disabled={isProcessing || (!item.storage_path && !isTextItem)}
                                      className="px-3 py-1.5 text-xs text-[#B8826D] hover:bg-[#B8826D]/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center border border-[#B8826D]/30"
                                    >
                                      <Eye className="w-3.5 h-3.5 mr-1" />
                                      Preview
                                    </button>
                                    <button
                                      onClick={() => openRejectionModal(item.id, fileName)}
                                      disabled={isProcessing}
                                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5 mr-1" />
                                      )}
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleApprove(item.id, fileName)}
                                      disabled={isProcessing}
                                      className="px-3 py-1.5 text-xs text-white bg-[#8B9D83] hover:bg-[#8B9D83]/90 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                      )}
                                      Approve
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}


                  {/* No pending items message */}
                  {pendingItems.length === 0 && (approvedItems.length > 0 || rejectedItems.length > 0) && (
                    <div className="text-center py-8 bg-green-50/50 rounded-lg border border-green-100">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                      <p className="text-green-700 font-medium">All caught up!</p>
                      <p className="text-sm text-green-600/70 mt-1">No items pending review.</p>
                    </div>
                  )}

                  {/* Approved / Published Items */}
                  {approvedItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#8B9D83] mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Published ({approvedItems.length})
                      </h3>
                      <div className="space-y-2">
                        {approvedItems.map(item => {
                          const isRecentlyApproved = recentlyApproved.has(item.id);
                          const isRecentlyResetItem = recentlyReset.has(item.id);
                          const isProcessing = processingItems.has(item.id);
                          const isTextItem = item.item_type === 'text';
                          const fileName = getFileName(item);
                          
                          return (
                            <div
                              key={item.id}
                              className={`bg-[#8B9D83]/5 rounded-lg p-4 border transition-all duration-500 ${
                                isRecentlyApproved 
                                  ? 'border-[#8B9D83] ring-2 ring-[#8B9D83]/20 animate-pulse' 
                                  : isRecentlyResetItem
                                    ? 'border-amber-400 ring-2 ring-amber-200'
                                    : 'border-[#8B9D83]/20'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isTextItem ? 'bg-purple-100' : 'bg-[#8B9D83]/20'
                                  }`}>
                                    {isTextItem ? (
                                      <Type className="w-4 h-4 text-purple-600" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 text-[#8B9D83]" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-[#1A2332] text-sm">{fileName}</p>
                                    <p className="text-xs text-[#1A2332]/50">
                                      {getItemSizeDisplay(item)} - Approved {item.reviewed_at ? formatDate(item.reviewed_at) : ''}
                                    </p>
                                    {item.reviewed_by && (
                                      <p className="text-xs text-[#8B9D83] mt-0.5">
                                        Reviewed by: {item.reviewed_by.substring(0, 8)}...
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handlePreview(item)}
                                    className="px-2 py-1 text-xs text-[#8B9D83] hover:bg-[#8B9D83]/10 rounded transition-colors flex items-center"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => openResetModal(item.id, fileName, 'approved')}
                                    disabled={isProcessing}
                                    className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition-colors flex items-center disabled:opacity-50"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Re-review
                                  </button>
                                  {isRecentlyApproved && (
                                    <span className="text-xs px-2 py-1 bg-[#8B9D83] text-white rounded animate-bounce">
                                      Just Published!
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rejected */}
                  {rejectedItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejected ({rejectedItems.length})
                      </h3>
                      <div className="space-y-2">
                        {rejectedItems.map(item => {
                          const isRecentlyRejected = recentlyRejected.has(item.id);
                          const isRecentlyResetItem = recentlyReset.has(item.id);
                          const isProcessing = processingItems.has(item.id);
                          const rejectionNoteText = getRejectionNote(item);
                          const isTextItem = item.item_type === 'text';
                          const fileName = getFileName(item);
                          
                          return (
                            <div
                              key={item.id}
                              className={`bg-red-50/50 rounded-lg p-4 border transition-all duration-500 ${
                                isRecentlyRejected 
                                  ? 'border-red-400 ring-2 ring-red-200' 
                                  : isRecentlyResetItem
                                    ? 'border-amber-400 ring-2 ring-amber-200'
                                    : 'border-red-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isTextItem ? 'bg-purple-100' : 'bg-red-100'
                                  }`}>
                                    {isTextItem ? (
                                      <Type className="w-4 h-4 text-purple-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-[#1A2332] text-sm">{fileName}</p>
                                    <p className="text-xs text-[#1A2332]/50">
                                      {getItemSizeDisplay(item)} - Rejected {item.reviewed_at ? formatDate(item.reviewed_at) : ''}
                                    </p>
                                    {item.reviewed_by && (
                                      <p className="text-xs text-red-500/70 mt-0.5">
                                        Reviewed by: {item.reviewed_by.substring(0, 8)}...
                                      </p>
                                    )}
                                    {rejectionNoteText && (
                                      <div className="mt-2 p-2 bg-red-100/50 rounded text-xs text-red-700 flex items-start">
                                        <MessageSquare className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                                        <span className="italic">"{rejectionNoteText}"</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handlePreview(item)}
                                    className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors flex items-center"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => openResetModal(item.id, fileName, 'rejected')}
                                    disabled={isProcessing}
                                    className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition-colors flex items-center disabled:opacity-50"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Re-review
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


          {/* Audit Trail Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Refresh button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchAuditLog}
                  disabled={loadingAudit}
                  className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingAudit ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Error message */}
              {auditError && (
                <ErrorDisplay
                  error={auditError}
                  variant="inline"
                  onDismiss={() => setAuditError('')}
                />
              )}


              {loadingAudit ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                  <p className="text-[#1A2332]/60 mt-4">Loading audit trail...</p>
                </div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                  <p className="text-[#1A2332]/60">No audit entries yet</p>
                  <p className="text-sm text-[#1A2332]/40 mt-2">
                    All actions will be recorded here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLog.map(entry => {
                    const actionInfo = getActionLabel(entry.action);
                    const beforeStatus = entry.before_snapshot?.status;
                    const afterStatus = entry.after_snapshot?.status;
                    const rejectionNote = entry.after_snapshot?.rejection_note;
                    const itemType = entry.after_snapshot?.item_type;
                    
                    return (
                      <div
                        key={entry.id}
                        className="bg-white rounded-lg p-4 border border-[#1A2332]/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${actionInfo.color}`}>
                              {actionInfo.icon}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A2332] text-sm">
                                {actionInfo.label}
                                {itemType && (
                                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                    itemType === 'text' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {itemType}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-[#1A2332]/50 mt-0.5">
                                {entry.target_table} - {entry.target_id?.substring(0, 8)}...
                              </p>
                              {entry.after_snapshot?.file_name && (
                                <p className="text-xs text-[#1A2332]/40 mt-1">
                                  File: {entry.after_snapshot.file_name}
                                </p>
                              )}
                              {entry.after_snapshot?.title && (
                                <p className="text-xs text-[#1A2332]/40 mt-1">
                                  Title: {entry.after_snapshot.title}
                                </p>
                              )}
                              {entry.after_snapshot?.user_email && (
                                <p className="text-xs text-[#1A2332]/40 mt-1">
                                  User: {entry.after_snapshot.user_email}
                                </p>
                              )}
                              {/* Show status change */}
                              {beforeStatus && afterStatus && beforeStatus !== afterStatus && (
                                <p className="text-xs text-[#1A2332]/60 mt-1">
                                  Status: <span className="text-amber-600">{beforeStatus}</span> → <span className={afterStatus === 'approved' ? 'text-green-600' : 'text-red-600'}>{afterStatus}</span>
                                </p>
                              )}
                              {/* Show rejection note if present */}
                              {rejectionNote && (
                                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 flex items-start">
                                  <MessageSquare className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                                  <span className="italic">"{rejectionNote}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#1A2332]/50">
                              {entry.actor_user_id ? `${entry.actor_user_id.substring(0, 8)}...` : 'System'}
                            </p>
                            <p className="text-xs text-[#1A2332]/40">{formatDate(entry.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Phase 4B: Stewards Tab (Global Stewards Only) */}
          {activeTab === 'stewards' && isGlobalSteward && (
            <div className="space-y-6">
              {/* Header with refresh */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Crown className="w-5 h-5 text-amber-500 mr-2" />
                  <h3 className="font-medium text-[#1A2332]">Steward Management</h3>
                </div>
                <button
                  onClick={fetchStewards}
                  disabled={loadingStewards}
                  className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingStewards ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Error message */}
              {stewardsError && (
                <ErrorDisplay
                  error={stewardsError}
                  variant="inline"
                  onDismiss={() => setStewardsError('')}
                />
              )}


              {/* Add Steward Form */}
              <div className="bg-white rounded-lg p-4 border border-[#1A2332]/10">
                <h4 className="text-sm font-medium text-[#1A2332] mb-3 flex items-center">
                  <UserPlus className="w-4 h-4 mr-2 text-[#8B9D83]" />
                  Add Journey Steward
                </h4>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newStewardEmail}
                    onChange={(e) => setNewStewardEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="flex-1 px-4 py-2 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-[#B8826D] text-sm"
                    disabled={addingSteward}
                  />
                  <button
                    onClick={handleAddSteward}
                    disabled={addingSteward || !newStewardEmail.trim()}
                    className="px-4 py-2 bg-[#8B9D83] text-white rounded-lg text-sm font-medium hover:bg-[#8B9D83]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {addingSteward ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#1A2332]/50 mt-2">
                  If the user doesn't exist, a placeholder account will be created.
                </p>
              </div>

              {loadingStewards ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                  <p className="text-[#1A2332]/60 mt-4">Loading stewards...</p>
                </div>
              ) : (
                <>
                  {/* Global Stewards */}
                  <div>
                    <h4 className="text-sm font-medium text-[#1A2332]/70 mb-3 flex items-center">
                      <Crown className="w-4 h-4 mr-2 text-amber-500" />
                      Global Stewards ({globalStewards.length})
                    </h4>
                    {globalStewards.length === 0 ? (
                      <p className="text-sm text-[#1A2332]/50 italic">No global stewards found.</p>
                    ) : (
                      <div className="space-y-2">
                        {globalStewards.map(steward => (
                          <div
                            key={steward.id}
                            className="bg-amber-50/50 rounded-lg p-3 border border-amber-200/50 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <Crown className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1A2332]">
                                  {steward.user_name || steward.user_email || steward.user_id.substring(0, 8) + '...'}
                                </p>
                                {steward.user_email && steward.user_name && (
                                  <p className="text-xs text-[#1A2332]/50">{steward.user_email}</p>
                                )}
                                <p className="text-xs text-amber-600">Site-wide access</p>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                              Global
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Journey Stewards */}
                  <div>
                    <h4 className="text-sm font-medium text-[#1A2332]/70 mb-3 flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-[#8B9D83]" />
                      Journey Stewards ({journeyStewards.length})
                    </h4>
                    {journeyStewards.length === 0 ? (
                      <p className="text-sm text-[#1A2332]/50 italic">No journey stewards assigned yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {journeyStewards.map(steward => {
                          const isRemoving = removingStewardId === steward.user_id;
                          
                          return (
                            <div
                              key={steward.id}
                              className={`bg-[#8B9D83]/5 rounded-lg p-3 border border-[#8B9D83]/20 flex items-center justify-between transition-opacity ${
                                isRemoving ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-[#8B9D83]/20 flex items-center justify-center">
                                  <ShieldCheck className="w-4 h-4 text-[#8B9D83]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#1A2332]">
                                    {steward.user_name || steward.user_email || steward.user_id.substring(0, 8) + '...'}
                                  </p>
                                  {steward.user_email && steward.user_name && (
                                    <p className="text-xs text-[#1A2332]/50">{steward.user_email}</p>
                                  )}
                                  <p className="text-xs text-[#1A2332]/40">
                                    Added {formatDate(steward.created_at)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveSteward(steward)}
                                disabled={isRemoving}
                                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {isRemoving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    Remove
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Info note */}
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 text-xs text-blue-700">
                <p className="font-medium mb-1">About Steward Roles:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                  <li><strong>Global Stewards</strong> can manage all journeys site-wide</li>
                  <li><strong>Journey Stewards</strong> can only approve/reject content for this specific journey</li>
                  <li>Global steward roles cannot be removed via this interface</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset to Pending Modal */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1A2332]">Send Back for Review</h3>
                  <p className="text-sm text-[#1A2332]/60">This item will return to the pending queue</p>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Item:</span> {resetModal.fileName}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Current status: <span className="capitalize">{resetModal.currentStatus}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#1A2332] mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={resetNote}
                  onChange={(e) => setResetNote(e.target.value)}
                  placeholder="Why is this item being sent back for review?"
                  className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm"
                  rows={3}
                />
                <p className="text-xs text-[#1A2332]/50 mt-1">
                  This note will be recorded in the audit log.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeResetModal}
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Send Back for Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}

      {rejectionModal.isOpen && (

        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-[#1A2332]">Reject Item</h3>
                  <p className="text-sm text-[#1A2332]/60 truncate max-w-[280px]">
                    {rejectionModal.fileName}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                  Rejection Note (optional, internal only)
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Reason for rejection... (not visible to the uploader)"
                  className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-[#F5F1E8] focus:outline-none focus:border-red-400 resize-none text-sm"
                  rows={3}
                  disabled={isRejecting}
                />
                <p className="text-xs text-[#1A2332]/40 mt-1">
                  This note is for internal record-keeping and will appear in the audit trail.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeRejectionModal}
                  disabled={isRejecting}
                  className="flex-1 px-4 py-2.5 text-sm text-[#1A2332] bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Preview Modal */}
      {textPreviewState.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#1A2332]/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Type className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-[#1A2332]">{textPreviewState.title}</h3>
                  <p className="text-xs text-[#1A2332]/50">Text Item Preview</p>
                </div>
              </div>
              <button
                onClick={closeTextPreview}
                className="text-[#1A2332]/60 hover:text-[#1A2332]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-[#1A2332]/80 leading-relaxed">
                  {textPreviewState.body}
                </div>
              </div>
              {(textPreviewState.creditLine || textPreviewState.rightsStatus) && (
                <div className="mt-6 pt-4 border-t border-[#1A2332]/10">
                  {textPreviewState.creditLine && (
                    <p className="text-xs text-[#1A2332]/60">
                      <span className="font-medium">Credit:</span> {textPreviewState.creditLine}
                    </p>
                  )}
                  {textPreviewState.rightsStatus && (
                    <p className="text-xs text-[#1A2332]/60 mt-1">
                      <span className="font-medium">Rights:</span> {textPreviewState.rightsStatus}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#1A2332]/10 bg-[#F5F1E8]">
              <button
                onClick={closeTextPreview}
                className="w-full py-2 bg-[#1A2332] text-white rounded-lg text-sm font-medium hover:bg-[#1A2332]/90 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewState.isOpen}
        onClose={closePreview}
        fileName={previewState.fileName}
        storagePath={previewState.storagePath}
        mime={previewState.mime}
        fileSize={previewState.fileSize}
      />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={videoPreviewState.isOpen}
        onClose={closeVideoPreview}
        fileName={videoPreviewState.fileName}
        storagePath={videoPreviewState.storagePath}
        thumbPath={videoPreviewState.thumbPath}
        mime={videoPreviewState.mime}
        fileSize={videoPreviewState.fileSize}
        duration={videoPreviewState.duration}
        title={videoPreviewState.title}
        description={videoPreviewState.description}
        creditPreference={videoPreviewState.creditPreference}
        creditLine={videoPreviewState.creditLine}
        rightsStatus={videoPreviewState.rightsStatus}
        sourceNotes={videoPreviewState.sourceNotes}
        visibility={videoPreviewState.visibility}
        uploaderName={videoPreviewState.uploaderName}
        createdAt={videoPreviewState.createdAt}
      />
    </div>
  );
};

export default StewardDashboard;

