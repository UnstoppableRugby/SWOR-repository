import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  Upload, Image as ImageIcon, FileText, X, Loader2, AlertCircle, Check, 
  GripVertical, Eye, Trash2, Edit2, Calendar, Globe, Lock, Users, Heart, 
  LayoutGrid, Search, Filter, ChevronDown, ChevronUp, Copy, RefreshCw,
  CheckCircle2, XCircle, Download, Archive, ExternalLink, Mail, Send,
  List, Star, Tag, Plus, Shield
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import ArchiveLightbox from './ArchiveLightbox';

interface ArchiveItem {
  id: string;
  item_type: 'image' | 'document';
  title: string;
  description?: string;
  caption?: string;
  date_approximate?: string;
  visibility: string;
  source_attribution?: string;
  rights_status?: string;
  storage_path?: string;
  mime_type?: string;
  file_size?: number;
  status: string;
  display_order: number;
  signed_url?: string;
  thumb_signed_url?: string;
  created_at?: string;
  tags?: string[];
  is_featured?: boolean;
}


interface UploadQueueItem {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'succeeded' | 'failed';
  progress: number;
  error?: string;
  resultItem?: ArchiveItem;
}

interface BatchMetadataItem {
  id: string;
  title: string;
  description: string;
  caption: string;
  date_approximate: string;
  visibility: string;
  source_attribution: string;
  rights_status: string;
  tags: string;
  item?: ArchiveItem;
}


interface ExportResult {
  export_id: string;
  status: string;
  item_count: number;
  files_included: number;
  files_missing: number;
  missing_files: Array<{ item_id: string; title: string; error: string }>;
  zip_size_bytes: number;
  download_url: string;
  download_expires_at: string;
  profile_name?: string;
  owner_email?: string;
}

interface ArchiveUploadSectionProps {
  profileId: string;
  userId?: string;
  items: ArchiveItem[];
  onItemsChange: (items: ArchiveItem[]) => void;
  isReadOnly?: boolean;
  canReorder?: boolean;
  isSteward?: boolean;
  ownerEmail?: string;
  featuredImageId?: string | null;
  onFeaturedImageChange?: (imageId: string | null) => void;
}

type DisplayMode = 'list' | 'gallery';
type ViewMode = 'curated' | 'by_date';
type ItemTypeFilter = 'all' | 'image' | 'document';
type StatusFilter = 'all' | 'draft' | 'approved' | 'submitted';

const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_BULK_FILES = 10;
const CONCURRENT_UPLOADS = 2;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

const RIGHTS_STATUS_OPTIONS = [
  { value: '', label: 'Select rights status...' },
  { value: 'family_collection', label: 'Family collection' },
  { value: 'public_domain', label: 'Public domain' },
  { value: 'used_with_permission', label: 'Used with permission' },
  { value: 'copyright_holder', label: 'Copyright holder' },
  { value: 'creative_commons', label: 'Creative Commons' },
  { value: 'fair_use', label: 'Fair use / educational' },
  { value: 'club_archive', label: 'Club archive' },
  { value: 'press_media', label: 'Press / media' },
  { value: 'unknown', label: 'Unknown / to be confirmed' },
];


const ArchiveUploadSection: React.FC<ArchiveUploadSectionProps> = ({
  profileId,
  userId,
  items,
  onItemsChange,
  isReadOnly = false,
  canReorder = true,
  isSteward = false,
  ownerEmail,
  featuredImageId,
  onFeaturedImageChange
}) => {
  // Upload states
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Display mode (list vs gallery)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  
  // Batch metadata editor
  const [showBatchEditor, setShowBatchEditor] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchMetadataItem[]>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  
  // Single item edit
  const [editingItem, setEditingItem] = useState<ArchiveItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form state for single edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formVisibility, setFormVisibility] = useState('draft');
  const [formSource, setFormSource] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formRightsStatus, setFormRightsStatus] = useState('');

  
  // View mode toggle (view-only, no persistence)
  const [viewMode, setViewMode] = useState<ViewMode>('curated');
  
  // Search & Filter (session-only)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Collapsible controls
  const [controlsVisible, setControlsVisible] = useState(true);
  
  // Drag reorder state
  const [draggedItem, setDraggedItem] = useState<ArchiveItem | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  
  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Email link state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [sendToOwner, setSendToOwner] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Featured image state
  const [isSettingFeatured, setIsSettingFeatured] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadQueueRef = useRef<UploadQueueItem[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize email field when export result changes
  useEffect(() => {
    if (exportResult?.owner_email) {
      setEmailTo(exportResult.owner_email);
    } else if (ownerEmail) {
      setEmailTo(ownerEmail);
    }
  }, [exportResult, ownerEmail]);

  // Check if any filters are active
  const hasActiveFilters = debouncedSearch || typeFilter !== 'all' || statusFilter !== 'all';

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];
    
    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query)) ||
        (item.caption?.toLowerCase().includes(query)) ||
        (item.date_approximate?.toLowerCase().includes(query)) ||
        (item.tags?.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(item => item.item_type === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Apply sorting
    if (viewMode === 'by_date') {
      result.sort((a, b) => {
        const getDateValue = (item: ArchiveItem): number => {
          if (item.date_approximate) {
            const yearMatch = item.date_approximate.match(/\d{4}/);
            if (yearMatch) return parseInt(yearMatch[0]);
          }
          if (item.created_at) return new Date(item.created_at).getTime();
          return 0;
        };
        return getDateValue(a) - getDateValue(b);
      });
    } else {
      result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    
    return result;
  }, [items, debouncedSearch, typeFilter, statusFilter, viewMode]);

  const imageItems = filteredAndSortedItems.filter(i => i.item_type === 'image');
  const documentItems = filteredAndSortedItems.filter(i => i.item_type === 'document');

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  // Build filter summary
  const getFilterSummary = () => {
    const parts: string[] = [];
    if (typeFilter === 'image') parts.push('Images');
    if (typeFilter === 'document') parts.push('Documents');
    if (statusFilter !== 'all') parts.push(statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1));
    if (debouncedSearch) parts.push(`"${debouncedSearch}"`);
    return parts.join(' · ');
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Parse tags from string
  const parseTags = (tagString: string): string[] => {
    return tagString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  };

  // Set featured image
  const handleSetFeatured = async (itemId: string) => {
    if (!onFeaturedImageChange) return;
    
    setIsSettingFeatured(true);
    
    try {
      // If clicking on already featured, remove it
      const newFeaturedId = featuredImageId === itemId ? null : itemId;
      
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'set_featured_image',
          payload: {
            profile_id: profileId,
            user_id: userId,
            image_id: newFeaturedId,
            is_steward: isSteward
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to update featured image');
      
      onFeaturedImageChange(newFeaturedId);
      
    } catch (err: any) {
      console.error('Set featured error:', err);
      setUploadError(err.message || 'Failed to set featured image');
    } finally {
      setIsSettingFeatured(false);
    }
  };

  // Open lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Export Archive function
  const handleExportArchive = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportResult(null);
    setShowEmailForm(false);
    setEmailSent(false);
    setEmailError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-archive-export', {
        body: {
          action: 'start_export',
          payload: {
            profile_id: profileId,
            user_id: userId,
            is_steward: isSteward
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Export failed');
      
      setExportResult({
        export_id: data.export_id,
        status: data.status,
        item_count: data.item_count,
        files_included: data.files_included,
        files_missing: data.files_missing,
        missing_files: data.missing_files || [],
        zip_size_bytes: data.zip_size_bytes,
        download_url: data.download_url,
        download_expires_at: data.download_expires_at,
        profile_name: data.profile_name,
        owner_email: data.owner_email
      });
      
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err.message || 'Failed to export archive');
    } finally {
      setIsExporting(false);
    }
  };

  // Email export link function
  const handleSendEmailLink = async () => {
    if (!exportResult || !emailTo.trim()) return;
    
    setIsSendingEmail(true);
    setEmailError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-archive-export', {
        body: {
          action: 'email_export_link',
          payload: {
            export_id: exportResult.export_id,
            profile_id: profileId,
            user_id: userId,
            is_steward: isSteward,
            to_email: emailTo.trim()
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to send email');
      
      setEmailSent(true);
      setShowEmailForm(false);
      
    } catch (err: any) {
      console.error('Email error:', err);
      setEmailError(err.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportResult(null);
    setExportError(null);
    setShowEmailForm(false);
    setEmailSent(false);
    setEmailError(null);
    setEmailTo('');
  };


  // Drag and drop for file upload
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
      handleFilesSelect(Array.from(e.dataTransfer.files));
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return `Invalid file type. Allowed: JPG, PNG, WebP, PDF`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large (${formatFileSize(file.size)}). Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFilesSelect = async (files: File[]) => {
    setUploadError(null);
    
    // Limit to MAX_BULK_FILES
    const filesToProcess = files.slice(0, MAX_BULK_FILES);
    
    if (files.length > MAX_BULK_FILES) {
      setUploadError(`Only the first ${MAX_BULK_FILES} files will be uploaded.`);
    }
    
    // Validate and create queue items
    const queueItems: UploadQueueItem[] = [];
    const errors: string[] = [];
    
    for (const file of filesToProcess) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }
      
      const queueItem: UploadQueueItem = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'pending',
        progress: 0
      };
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        try {
          queueItem.preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        } catch {}
      }
      
      queueItems.push(queueItem);
    }
    
    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    }
    
    if (queueItems.length > 0) {
      setUploadQueue(queueItems);
      uploadQueueRef.current = queueItems;
      processUploadQueue(queueItems);
    }
  };

  const processUploadQueue = async (queue: UploadQueueItem[]) => {
    setIsProcessingQueue(true);
    
    const pendingItems = queue.filter(item => item.status === 'pending');
    let activeUploads = 0;
    let currentIndex = 0;
    
    const uploadNext = async () => {
      while (currentIndex < pendingItems.length && activeUploads < CONCURRENT_UPLOADS) {
        const item = pendingItems[currentIndex];
        currentIndex++;
        activeUploads++;
        
        await uploadSingleFile(item);
        activeUploads--;
      }
    };
    
    // Start initial concurrent uploads
    const promises: Promise<void>[] = [];
    for (let i = 0; i < Math.min(CONCURRENT_UPLOADS, pendingItems.length); i++) {
      promises.push(uploadNext());
    }
    
    await Promise.all(promises);
    
    // Check results and open batch editor
    const updatedQueue = uploadQueueRef.current;
    const succeededItems = updatedQueue.filter(item => item.status === 'succeeded' && item.resultItem);
    
    setIsProcessingQueue(false);
    
    if (succeededItems.length > 0) {
      // Prepare batch metadata items
      const batchMetadata: BatchMetadataItem[] = succeededItems.map(item => ({
        id: item.resultItem!.id,
        title: item.resultItem!.title,
        description: '',
        caption: '',
        date_approximate: '',
        visibility: 'draft',
        source_attribution: '',
        rights_status: '',
        tags: '',
        item: item.resultItem
      }));
      
      setBatchItems(batchMetadata);
      setShowBatchEditor(true);
    }
  };


  const uploadSingleFile = async (queueItem: UploadQueueItem) => {
    // Update status to uploading
    updateQueueItem(queueItem.id, { status: 'uploading', progress: 10 });
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(queueItem.file);
      });
      
      updateQueueItem(queueItem.id, { progress: 40 });
      
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'upload_archive_item',
          payload: {
            profile_id: profileId,
            user_id: userId,
            file_name: queueItem.file.name,
            file_type: queueItem.file.type,
            file_size: queueItem.file.size,
            file_data: base64,
            title: queueItem.file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            description: null,
            caption: null,
            date_approximate: null,
            visibility: 'draft',
            source_attribution: null,
            tags: null
          }
        }
      });
      
      updateQueueItem(queueItem.id, { progress: 90 });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Upload failed');
      
      // Success
      const newItem = data.item;
      updateQueueItem(queueItem.id, { 
        status: 'succeeded', 
        progress: 100, 
        resultItem: newItem 
      });
      
      // Add to items list
      onItemsChange([...items, newItem]);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      updateQueueItem(queueItem.id, { 
        status: 'failed', 
        progress: 0, 
        error: err.message || 'Upload failed' 
      });
    }
  };

  const updateQueueItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setUploadQueue(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      uploadQueueRef.current = updated;
      return updated;
    });
  };

  const retryFailedUpload = async (queueItem: UploadQueueItem) => {
    updateQueueItem(queueItem.id, { status: 'pending', progress: 0, error: undefined });
    await uploadSingleFile(queueItem);
  };

  const retryAllFailed = async () => {
    const failedItems = uploadQueue.filter(item => item.status === 'failed');
    for (const item of failedItems) {
      updateQueueItem(item.id, { status: 'pending', progress: 0, error: undefined });
    }
    processUploadQueue(uploadQueue);
  };

  const clearUploadQueue = () => {
    setUploadQueue([]);
    uploadQueueRef.current = [];
  };

  // Batch metadata functions
  const updateBatchItem = (id: string, field: keyof BatchMetadataItem, value: string) => {
    setBatchItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const copyToAll = (field: keyof BatchMetadataItem, value: string) => {
    setBatchItems(prev => prev.map(item => ({ ...item, [field]: value })));
  };

  const saveBatchMetadata = async () => {
    setIsSavingBatch(true);
    
    try {
      // Update each item
      for (const batchItem of batchItems) {
        const { data, error } = await supabase.functions.invoke('swor-profile', {
          body: {
            action: 'update_archive_item',
            payload: {
              item_id: batchItem.id,
              user_id: userId,
              title: batchItem.title.trim() || batchItem.item?.title || 'Untitled',
              description: batchItem.description.trim() || null,
              caption: batchItem.caption.trim() || null,
              date_approximate: batchItem.date_approximate.trim() || null,
              visibility: batchItem.visibility,
              source_attribution: batchItem.source_attribution.trim() || null,
              rights_status: batchItem.rights_status.trim() || null,
              tags: parseTags(batchItem.tags)
            }
          }
        });
        
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.detail || 'Update failed');
        
        // Update item in list
        onItemsChange(items.map(item => 
          item.id === batchItem.id 
            ? { 
                ...item, 
                title: batchItem.title.trim() || item.title, 
                description: batchItem.description.trim() || undefined, 
                caption: batchItem.caption.trim() || undefined,
                date_approximate: batchItem.date_approximate.trim() || undefined, 
                visibility: batchItem.visibility, 
                source_attribution: batchItem.source_attribution.trim() || undefined,
                rights_status: batchItem.rights_status.trim() || undefined,
                tags: parseTags(batchItem.tags)
              }
            : item
        ));
      }
      
      // Close batch editor and clear queue
      setShowBatchEditor(false);
      setBatchItems([]);
      clearUploadQueue();
      
    } catch (err: any) {
      console.error('Batch save error:', err);
      setUploadError(err.message || 'Failed to save metadata');
    } finally {
      setIsSavingBatch(false);
    }
  };


  // Single item update
  const handleUpdateItem = async () => {
    if (!editingItem || !formTitle.trim()) return;
    
    setIsUpdating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'update_archive_item',
          payload: {
            item_id: editingItem.id,
            user_id: userId,
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            caption: formCaption.trim() || null,
            date_approximate: formDate.trim() || null,
            visibility: formVisibility,
            source_attribution: formSource.trim() || null,
            rights_status: formRightsStatus || null,
            tags: parseTags(formTags)
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Update failed');
      
      onItemsChange(items.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              title: formTitle.trim(), 
              description: formDescription.trim() || undefined, 
              caption: formCaption.trim() || undefined,
              date_approximate: formDate.trim() || undefined, 
              visibility: formVisibility, 
              source_attribution: formSource.trim() || undefined,
              rights_status: formRightsStatus || undefined,
              tags: parseTags(formTags)
            }
          : item
      ));
      
      setEditingItem(null);
      
    } catch (err: any) {
      console.error('Update error:', err);
      setUploadError(err.message || 'Failed to update item');
    } finally {
      setIsUpdating(false);
    }
  };


  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'delete_archive_item',
          payload: {
            item_id: itemId,
            user_id: userId
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Delete failed');
      
      onItemsChange(items.filter(item => item.id !== itemId));
      
      // If deleted item was featured, clear featured
      if (featuredImageId === itemId && onFeaturedImageChange) {
        onFeaturedImageChange(null);
      }
      
    } catch (err: any) {
      console.error('Delete error:', err);
      setUploadError(err.message || 'Failed to delete item');
    }
  };

  // Drag reorder handlers
  const handleDragStart = (e: React.DragEvent, item: ArchiveItem) => {
    if (isReadOnly || !canReorder || viewMode !== 'curated') return;
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent, item: ArchiveItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === item.id) return;
    setDragOverId(item.id);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverId(null);
  };

  const handleDropReorder = async (e: React.DragEvent, targetItem: ArchiveItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id || isReadOnly || !canReorder) return;
    
    const itemType = draggedItem.item_type;
    const sameTypeItems = items.filter(i => i.item_type === itemType);
    
    const draggedIndex = sameTypeItems.findIndex(i => i.id === draggedItem.id);
    const targetIndex = sameTypeItems.findIndex(i => i.id === targetItem.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newSameTypeItems = [...sameTypeItems];
    newSameTypeItems.splice(draggedIndex, 1);
    newSameTypeItems.splice(targetIndex, 0, draggedItem);
    
    const otherTypeItems = items.filter(i => i.item_type !== itemType);
    const allItems = [...newSameTypeItems, ...otherTypeItems];
    
    const orderedItemIds = allItems.map(i => i.id);
    
    const updatedItems = allItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    onItemsChange(updatedItems);
    
    setDraggedItem(null);
    setDragOverId(null);
    setIsReordering(true);
    setReorderError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'reorder_archive_items',
          payload: {
            profile_id: profileId,
            ordered_item_ids: orderedItemIds,
            user_id: userId,
            is_steward: isSteward
          }
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Reorder failed');
      
    } catch (err: any) {
      console.error('Reorder error:', err);
      setReorderError('Failed to save new order. Reverting...');
      onItemsChange(items);
      setTimeout(() => setReorderError(null), 3000);
    } finally {
      setIsReordering(false);
    }
  };

  const openEditModal = (item: ArchiveItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCaption(item.caption || '');
    setFormDate(item.date_approximate || '');
    setFormVisibility(item.visibility);
    setFormSource(item.source_attribution || '');
    setFormTags(item.tags?.join(', ') || '');
    setFormRightsStatus(item.rights_status || '');
  };


  const visibilityOptions = [
    { value: 'draft', label: 'Draft', icon: Lock, description: 'Only you and stewards' },
    { value: 'family', label: 'Family', icon: Heart, description: 'Family members' },
    { value: 'connections', label: 'Connections', icon: Users, description: 'Your connections' },
    { value: 'public', label: 'Public', icon: Globe, description: 'Everyone (after approval)' }
  ];

  const canDragReorder = !isReadOnly && canReorder && viewMode === 'curated' && !hasActiveFilters;
  const hasFailedUploads = uploadQueue.some(item => item.status === 'failed');
  const hasSucceededUploads = uploadQueue.some(item => item.status === 'succeeded');
  const isUploading = uploadQueue.some(item => item.status === 'uploading' || item.status === 'pending');
  
  // Export is allowed for owner/steward even when profile is read-only
  const canExport = (canReorder || isSteward) && items.length > 0;
  
  // Can set featured if owner/steward
  const canSetFeaturedImage = !isReadOnly && (canReorder || isSteward);

  return (
    <div className="space-y-4">
      {/* Header with Export Button */}
      {canExport && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-[#1A2332]/70 hover:text-[#1A2332] border border-[#1A2332]/20 hover:border-[#1A2332]/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export Archive</span>
          </button>
        </div>
      )}

      {/* Collapsible Controls Toggle */}
      {!isReadOnly && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setControlsVisible(!controlsVisible)}
            className="flex items-center space-x-1.5 text-xs text-[#1A2332]/50 hover:text-[#1A2332]/70 transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
            aria-expanded={controlsVisible}
          >
            {controlsVisible ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hide controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Show controls</span>
              </>
            )}
          </button>
          
          {/* Item count - always visible */}
          <span className="text-xs text-[#1A2332]/50">
            {hasActiveFilters 
              ? `Showing ${filteredAndSortedItems.length} of ${items.length} items`
              : `${items.length} item${items.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>
      )}

      {/* Controls Section (collapsible) */}
      {controlsVisible && (
        <div className="space-y-4">
          {/* Display Mode Toggle (List/Gallery) */}
          {imageItems.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#1A2332]/50">Display:</span>
                <div className="flex bg-[#1A2332]/5 rounded-lg p-0.5" role="radiogroup" aria-label="Display mode">
                  <button
                    onClick={() => setDisplayMode('list')}
                    role="radio"
                    aria-checked={displayMode === 'list'}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                      displayMode === 'list'
                        ? 'bg-white text-[#1A2332] shadow-sm'
                        : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setDisplayMode('gallery')}
                    role="radio"
                    aria-checked={displayMode === 'gallery'}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                      displayMode === 'gallery'
                        ? 'bg-white text-[#1A2332] shadow-sm'
                        : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Gallery</span>
                  </button>
                </div>
              </div>
              <span className="text-xs text-[#1A2332]/40">
                {displayMode === 'list' ? 'Elder-friendly view' : 'Visual grid'}
              </span>
            </div>
          )}

          {/* View Toggle - Only show for owner/steward */}
          {(canReorder || isSteward) && items.length > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#1A2332]/50">Sort:</span>
                <div className="flex bg-[#1A2332]/5 rounded-lg p-0.5" role="radiogroup" aria-label="Sort mode">
                  <button
                    onClick={() => setViewMode('curated')}
                    role="radio"
                    aria-checked={viewMode === 'curated'}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                      viewMode === 'curated'
                        ? 'bg-white text-[#1A2332] shadow-sm'
                        : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Curated</span>
                  </button>
                  <button
                    onClick={() => setViewMode('by_date')}
                    role="radio"
                    aria-checked={viewMode === 'by_date'}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                      viewMode === 'by_date'
                        ? 'bg-white text-[#1A2332] shadow-sm'
                        : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>By Date</span>
                  </button>
                </div>
              </div>
              {viewMode === 'by_date' && (
                <span className="text-xs text-[#1A2332]/40 italic">View only - order not saved</span>
              )}
            </div>
          )}

          {/* Search & Filter */}
          {items.length > 0 && (
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, description, date, or tags..."
                  aria-label="Search archive items"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#1A2332]/15 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A2332]/40 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#1A2332]/40" aria-hidden="true" />
                
                {/* Type Filter */}
                <div className="flex bg-[#1A2332]/5 rounded-lg p-0.5" role="radiogroup" aria-label="Filter by type">
                  {(['all', 'image', 'document'] as ItemTypeFilter[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      role="radio"
                      aria-checked={typeFilter === type}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                        typeFilter === type
                          ? 'bg-white text-[#1A2332] shadow-sm'
                          : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                      }`}
                    >
                      {type === 'all' ? 'All' : type === 'image' ? 'Images' : 'Documents'}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex bg-[#1A2332]/5 rounded-lg p-0.5" role="radiogroup" aria-label="Filter by status">
                  {(['all', 'draft', 'approved'] as StatusFilter[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      role="radio"
                      aria-checked={statusFilter === status}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                        statusFilter === status
                          ? 'bg-white text-[#1A2332] shadow-sm'
                          : 'text-[#1A2332]/60 hover:text-[#1A2332]'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs text-[#B8826D] hover:text-[#B8826D]/80 font-medium focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>

              {/* Filter Summary */}
              {hasActiveFilters && (
                <div className="text-xs text-[#1A2332]/50" role="status" aria-live="polite">
                  Filtered by: {getFilterSummary()}
                </div>
              )}
            </div>
          )}

          {/* Upload Area */}
          {!isReadOnly && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragActive
                  ? 'border-[#B8826D] bg-[#B8826D]/5'
                  : 'border-[#1A2332]/20 hover:border-[#1A2332]/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                multiple
                onChange={(e) => e.target.files && handleFilesSelect(Array.from(e.target.files))}
                className="hidden"
                aria-label="Upload files"
              />
              
              <Upload className="w-8 h-8 text-[#1A2332]/30 mx-auto mb-3" aria-hidden="true" />
              <p className="text-[#1A2332]/70 text-sm mb-2">
                Drag and drop files here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#B8826D] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-[#1A2332]/50">
                Images (JPG, PNG, WebP) and PDFs • Max {MAX_FILE_SIZE_MB}MB per file • Up to {MAX_BULK_FILES} files at once
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="bg-[#F5F1E8] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[#1A2332]">
              Upload Progress
            </h4>
            {!isUploading && (
              <button
                onClick={clearUploadQueue}
                className="text-xs text-[#1A2332]/50 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadQueue.map(item => (
              <div 
                key={item.id}
                className="flex items-center space-x-3 bg-white rounded-lg p-2"
              >
                {/* Preview/Icon */}
                <div className="w-10 h-10 rounded bg-[#1A2332]/5 flex-shrink-0 overflow-hidden">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#1A2332]/30" aria-hidden="true" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A2332] truncate">{item.file.name}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[#1A2332]/50">{formatFileSize(item.file.size)}</span>
                    {item.status === 'uploading' && (
                      <div className="flex-1 h-1.5 bg-[#1A2332]/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
                        <div 
                          className="h-full bg-[#B8826D] transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === 'failed' && item.error && (
                      <span className="text-xs text-red-500 truncate">{item.error}</span>
                    )}
                  </div>
                </div>
                
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {item.status === 'pending' && (
                    <div className="w-6 h-6 rounded-full bg-[#1A2332]/10 flex items-center justify-center">
                      <span className="text-xs text-[#1A2332]/50">...</span>
                    </div>
                  )}
                  {item.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" aria-label="Uploading" />
                  )}
                  {item.status === 'succeeded' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" aria-label="Upload complete" />
                  )}
                  {item.status === 'failed' && (
                    <button
                      onClick={() => retryFailedUpload(item)}
                      className="flex items-center space-x-1 text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded"
                      aria-label="Retry upload"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Retry All Failed */}
          {hasFailedUploads && !isUploading && (
            <button
              onClick={retryAllFailed}
              className="flex items-center space-x-1.5 text-sm text-[#B8826D] hover:text-[#B8826D]/80 font-medium focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Retry failed uploads</span>
            </button>
          )}
          
          {/* Open Batch Editor */}
          {hasSucceededUploads && !isUploading && !showBatchEditor && (
            <button
              onClick={() => {
                const succeededItems = uploadQueue.filter(item => item.status === 'succeeded' && item.resultItem);
                const batchMetadata: BatchMetadataItem[] = succeededItems.map(item => ({
                  id: item.resultItem!.id,
                  title: item.resultItem!.title,
                  description: '',
                  caption: '',
                  date_approximate: '',
                  visibility: 'draft',
                  source_attribution: '',
                  tags: '',
                  item: item.resultItem
                }));
                setBatchItems(batchMetadata);
                setShowBatchEditor(true);
              }}
              className="flex items-center space-x-1.5 text-sm text-[#B8826D] hover:text-[#B8826D]/80 font-medium focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
            >
              <Edit2 className="w-4 h-4" aria-hidden="true" />
              <span>Edit metadata for uploaded files</span>
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {uploadError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start" role="alert">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span className="whitespace-pre-line">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded" aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reorder indicator */}
      {isReordering && (
        <div className="flex items-center space-x-2 text-[#B8826D] text-sm" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Saving new order...</span>
        </div>
      )}

      {/* Reorder error */}
      {reorderError && (
        <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-center" role="alert">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
          <span>{reorderError}</span>
        </div>
      )}

      {/* Drag reorder hint */}
      {canDragReorder && items.length > 1 && displayMode === 'list' && (
        <div className="flex items-center space-x-2 text-xs text-[#1A2332]/50">
          <GripVertical className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Drag items to reorder your curated collection</span>
        </div>
      )}

      {/* Images - Gallery Mode */}
      {displayMode === 'gallery' && imageItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#1A2332]/70 mb-3 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            Images ({imageItems.length})
          </h4>
          {/* Responsive masonry grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {imageItems.map((item, index) => {
              const isFeatured = featuredImageId === item.id;
              return (
                <div
                  key={item.id}
                  className={`group relative aspect-square bg-[#1A2332]/5 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    isFeatured ? 'ring-2 ring-[#B8826D] border-[#B8826D]' : 'border-[#1A2332]/10 hover:border-[#1A2332]/30'
                  }`}
                  onClick={() => openLightbox(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openLightbox(index);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${item.title}${isFeatured ? ' (Featured image)' : ''}`}
                >
                  {/* Thumbnail */}
                  {(item.thumb_signed_url || item.signed_url) ? (
                    <img
                      src={item.thumb_signed_url || item.signed_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-[#1A2332]/20" aria-hidden="true" />
                    </div>
                  )}
                  
                  {/* Featured badge */}
                  {isFeatured && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-[#B8826D] text-white text-[10px] font-medium rounded flex items-center">
                      <Star className="w-3 h-3 mr-1 fill-current" aria-hidden="true" />
                      Featured
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {item.status === 'draft' && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-500/90 text-white text-[10px] rounded">
                      Draft
                    </div>
                  )}
                  
                  {/* Hover overlay with info */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end opacity-0 group-hover:opacity-100 group-focus:opacity-100">
                    <div className="w-full p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-xs font-medium truncate">{item.title}</p>
                      {item.date_approximate && (
                        <p className="text-white/70 text-[10px]">{item.date_approximate}</p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-1 py-0.5 bg-white/20 text-white text-[9px] rounded">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="text-white/60 text-[9px]">+{item.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions (show on hover) */}
                  {!isReadOnly && (
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      {canSetFeaturedImage && item.status === 'approved' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSetFeatured(item.id); }}
                          disabled={isSettingFeatured}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ${
                            isFeatured ? 'bg-[#B8826D] text-white' : 'bg-white text-[#1A2332]/70 hover:text-[#B8826D]'
                          }`}
                          aria-label={isFeatured ? 'Remove as featured image' : 'Set as featured image'}
                          aria-pressed={isFeatured}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-current' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                        className="w-6 h-6 bg-white rounded flex items-center justify-center text-[#1A2332]/70 hover:text-[#B8826D] focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="w-6 h-6 bg-white rounded flex items-center justify-center text-[#1A2332]/70 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Images - List Mode */}
      {displayMode === 'list' && imageItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#1A2332]/70 mb-3 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            Images ({imageItems.length})
          </h4>
          <div className="space-y-2">
            {imageItems.map((item, index) => {
              const isFeatured = featuredImageId === item.id;
              return (
                <div
                  key={item.id}
                  draggable={canDragReorder}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDropReorder(e, item)}
                  className={`flex items-center justify-between p-3 bg-white rounded-lg border transition-all ${
                    draggedItem?.id === item.id
                      ? 'opacity-50 border-[#B8826D]'
                      : dragOverId === item.id
                      ? 'border-[#B8826D] border-2'
                      : isFeatured
                      ? 'border-[#B8826D] ring-1 ring-[#B8826D]/30'
                      : 'border-[#1A2332]/10'
                  } ${canDragReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {canDragReorder && (
                      <GripVertical className="w-4 h-4 text-[#1A2332]/30 flex-shrink-0" aria-hidden="true" />
                    )}
                    {/* Thumbnail */}
                    <button
                      onClick={() => openLightbox(index)}
                      className="w-14 h-14 bg-[#1A2332]/5 rounded-lg flex-shrink-0 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
                      aria-label={`View ${item.title}`}
                    >
                      {(item.thumb_signed_url || item.signed_url) ? (
                        <img
                          src={item.thumb_signed_url || item.signed_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-[#1A2332]/20" aria-hidden="true" />
                        </div>
                      )}
                    </button>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1A2332] truncate">{item.title}</p>
                        {isFeatured && (
                          <span className="flex items-center px-1.5 py-0.5 bg-[#B8826D]/10 text-[#B8826D] text-[10px] font-medium rounded">
                            <Star className="w-3 h-3 mr-0.5 fill-current" aria-hidden="true" />
                            Featured
                          </span>
                        )}
                      </div>
                      {(item.caption || item.description) && (
                        <p className="text-xs text-[#1A2332]/60 truncate mt-0.5">
                          {item.caption || item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.date_approximate && (
                          <span className="text-xs text-[#1A2332]/50 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                            {item.date_approximate}
                          </span>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-[#1A2332]/40" aria-hidden="true" />
                            {item.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-[#1A2332]/5 text-[#1A2332]/60 text-[10px] rounded">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="text-[10px] text-[#1A2332]/40">+{item.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    {item.status === 'draft' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Draft</span>
                    )}
                    {canSetFeaturedImage && item.status === 'approved' && (
                      <button
                        onClick={() => handleSetFeatured(item.id)}
                        disabled={isSettingFeatured}
                        className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                          isFeatured 
                            ? 'text-[#B8826D] bg-[#B8826D]/10' 
                            : 'text-[#1A2332]/50 hover:text-[#B8826D]'
                        }`}
                        aria-label={isFeatured ? 'Remove as featured' : 'Set as featured'}
                        aria-pressed={isFeatured}
                      >
                        <Star className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
                      </button>
                    )}
                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-[#1A2332]/50 hover:text-[#B8826D] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                          aria-label={`Edit ${item.title}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-[#1A2332]/50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents List */}
      {documentItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#1A2332]/70 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
            Documents ({documentItems.length})
          </h4>
          <div className="space-y-2">
            {documentItems.map((item) => (
              <div
                key={item.id}
                draggable={canDragReorder}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDropReorder(e, item)}
                className={`flex items-center justify-between p-3 bg-[#F5F1E8] rounded-lg border transition-all ${
                  draggedItem?.id === item.id
                    ? 'opacity-50 border-[#B8826D]'
                    : dragOverId === item.id
                    ? 'border-[#B8826D] border-2'
                    : 'border-[#1A2332]/10'
                } ${canDragReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  {canDragReorder && (
                    <GripVertical className="w-4 h-4 text-[#1A2332]/30" aria-hidden="true" />
                  )}
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">{item.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#1A2332]/50">
                        {formatFileSize(item.file_size)}
                        {item.date_approximate && ` • ${item.date_approximate}`}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {item.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-[#1A2332]/5 text-[#1A2332]/60 text-[10px] rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.status === 'draft' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Draft</span>
                  )}
                  {item.signed_url && (
                    <a
                      href={item.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[#1A2332]/50 hover:text-[#B8826D] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`View ${item.title}`}
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                        className="p-1.5 text-[#1A2332]/50 hover:text-[#B8826D] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="p-1.5 text-[#1A2332]/50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedItems.length === 0 && (
        <div className="text-center py-8">
          {hasActiveFilters ? (
            <>
              <Search className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-3" aria-hidden="true" />
              <p className="text-[#1A2332]/50 text-sm">No items match your filters</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-[#B8826D] text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-3" aria-hidden="true" />
              <p className="text-[#1A2332]/50 text-sm">No archive items yet</p>
              <p className="text-[#1A2332]/40 text-xs mt-1">
                Upload photos, documents, or other materials that tell your story
              </p>
            </>
          )}
        </div>
      )}

      {/* Lightbox */}
      <ArchiveLightbox
        isOpen={lightboxOpen}
        items={imageItems}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
        onSetFeatured={canSetFeaturedImage ? handleSetFeatured : undefined}
        canSetFeatured={canSetFeaturedImage}
        featuredImageId={featuredImageId}
      />

      {/* Export Archive Modal */}
      {showExportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
        >
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#8B9D83]/10 rounded-lg flex items-center justify-center">
                    <Archive className="w-5 h-5 text-[#8B9D83]" aria-hidden="true" />
                  </div>
                  <h3 id="export-modal-title" className="font-serif text-lg text-[#1A2332]">Export Archive</h3>
                </div>
                <button
                  onClick={closeExportModal}
                  className="text-[#1A2332]/40 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Initial State - Confirmation */}
              {!isExporting && !exportResult && !exportError && (
                <div className="space-y-4">
                  <div className="bg-[#F5F1E8] rounded-lg p-4 space-y-2">
                    <p className="text-sm text-[#1A2332]">
                      This downloads a ZIP file containing:
                    </p>
                    <ul className="text-sm text-[#1A2332]/70 space-y-1 ml-4">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#8B9D83] rounded-full mt-1.5 mr-2 flex-shrink-0" aria-hidden="true" />
                        <span>Your archive files (images and documents)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-[#8B9D83] rounded-full mt-1.5 mr-2 flex-shrink-0" aria-hidden="true" />
                        <span>A manifest.json with all metadata</span>
                      </li>
                    </ul>
                  </div>
                  
                  <p className="text-xs text-[#1A2332]/50">
                    Nothing about the platform itself is exported. This may take a moment for large archives.
                  </p>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={closeExportModal}
                      className="px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExportArchive}
                      className="flex items-center px-4 py-2 bg-[#8B9D83] text-white rounded-lg font-medium hover:bg-[#8B9D83]/90 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50"
                    >
                      <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                      Export {items.length} item{items.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}

              {/* Exporting State */}
              {isExporting && (
                <div className="py-8 text-center">
                  <Loader2 className="w-10 h-10 text-[#8B9D83] animate-spin mx-auto mb-4" aria-hidden="true" />
                  <p className="text-[#1A2332] font-medium">Preparing your archive...</p>
                  <p className="text-sm text-[#1A2332]/50 mt-1">
                    Collecting files and generating ZIP
                  </p>
                </div>
              )}

              {/* Error State */}
              {exportError && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg" role="alert">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Export failed</p>
                        <p className="text-sm text-red-600 mt-1">{exportError}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={closeExportModal}
                      className="px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleExportArchive}
                      className="flex items-center px-4 py-2 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Success State */}
              {exportResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg" role="status">
                    <div className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-green-700">Export ready!</p>
                        <p className="text-sm text-green-600 mt-1">
                          {exportResult.files_included} of {exportResult.item_count} files included ({formatFileSize(exportResult.zip_size_bytes)})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Missing files warning */}
                  {exportResult.files_missing > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg" role="alert">
                      <div className="flex items-start">
                        <AlertCircle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-medium text-amber-700">
                            {exportResult.files_missing} file{exportResult.files_missing !== 1 ? 's' : ''} could not be included
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Details are noted in the manifest.json
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email sent confirmation */}
                  {emailSent && (
                    <div className="p-3 bg-blue-50 rounded-lg" role="status">
                      <div className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" aria-hidden="true" />
                        <p className="text-xs text-blue-700">
                          Download link sent to {emailTo}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email form */}
                  {showEmailForm && (
                    <div className="p-4 bg-[#F5F1E8] rounded-lg space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-[#1A2332]/60" aria-hidden="true" />
                        <span className="text-sm font-medium text-[#1A2332]">Email download link</span>
                      </div>
                      
                      <div>
                        <label htmlFor="email-to" className="block text-xs text-[#1A2332]/60 mb-1">Send to</label>
                        <input
                          id="email-to"
                          type="email"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                        />
                      </div>

                      {(exportResult.owner_email || ownerEmail) && (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendToOwner}
                            onChange={(e) => {
                              setSendToOwner(e.target.checked);
                              if (e.target.checked) {
                                setEmailTo(exportResult.owner_email || ownerEmail || '');
                              }
                            }}
                            className="w-4 h-4 rounded border-[#1A2332]/20 text-[#B8826D] focus:ring-[#B8826D]"
                          />
                          <span className="text-xs text-[#1A2332]/70">Send to profile owner</span>
                        </label>
                      )}

                      <p className="text-xs text-[#1A2332]/50">
                        The link expires in 1 hour. You can generate a new export anytime.
                      </p>

                      {emailError && (
                        <div className="p-2 bg-red-50 rounded text-xs text-red-600" role="alert">
                          {emailError}
                        </div>
                      )}

                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          onClick={() => {
                            setShowEmailForm(false);
                            setEmailError(null);
                          }}
                          className="px-3 py-1.5 text-xs text-[#1A2332]/60 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSendEmailLink}
                          disabled={isSendingEmail || !emailTo.trim()}
                          className="flex items-center px-3 py-1.5 bg-[#B8826D] text-white text-xs rounded-lg font-medium hover:bg-[#B8826D]/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
                        >
                          {isSendingEmail ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                              Send
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-[#1A2332]/50">
                        Link expires in 1 hour
                      </p>
                      {!showEmailForm && !emailSent && (
                        <button
                          onClick={() => setShowEmailForm(true)}
                          className="flex items-center text-xs text-[#B8826D] hover:text-[#B8826D]/80 font-medium focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                          Email link
                        </button>
                      )}
                    </div>
                    <a
                      href={exportResult.download_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-[#8B9D83] text-white rounded-lg font-medium hover:bg-[#8B9D83]/90 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50"
                    >
                      <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                      Download ZIP
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Batch Metadata Editor Modal */}
      {showBatchEditor && batchItems.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-editor-title"
        >
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#1A2332]/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="batch-editor-title" className="font-serif text-lg text-[#1A2332]">Edit Uploaded Items</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">
                    Add details to your {batchItems.length} uploaded file{batchItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBatchEditor(false);
                    setBatchItems([]);
                  }}
                  className="text-[#1A2332]/40 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Copy to All Section */}
              <div className="bg-[#8B9D83]/10 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Copy className="w-4 h-4 text-[#8B9D83]" aria-hidden="true" />
                  <span className="text-sm font-medium text-[#1A2332]">Copy to all items</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="batch-date" className="block text-xs text-[#1A2332]/60 mb-1">Date</label>
                    <div className="flex">
                      <input
                        id="batch-date"
                        type="text"
                        placeholder="e.g., 1985"
                        className="flex-1 px-2 py-1.5 text-sm rounded-l-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('batch-date') as HTMLInputElement;
                          if (input.value) copyToAll('date_approximate', input.value);
                        }}
                        className="px-2 py-1.5 bg-[#8B9D83] text-white text-xs rounded-r-lg hover:bg-[#8B9D83]/90 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="batch-source" className="block text-xs text-[#1A2332]/60 mb-1">Source</label>
                    <div className="flex">
                      <input
                        id="batch-source"
                        type="text"
                        placeholder="e.g., Family collection"
                        className="flex-1 px-2 py-1.5 text-sm rounded-l-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('batch-source') as HTMLInputElement;
                          if (input.value) copyToAll('source_attribution', input.value);
                        }}
                        className="px-2 py-1.5 bg-[#8B9D83] text-white text-xs rounded-r-lg hover:bg-[#8B9D83]/90 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="batch-visibility" className="block text-xs text-[#1A2332]/60 mb-1">Visibility</label>
                    <div className="flex">
                      <select
                        id="batch-visibility"
                        className="flex-1 px-2 py-1.5 text-sm rounded-l-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                        defaultValue="draft"
                      >
                        {visibilityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById('batch-visibility') as HTMLSelectElement;
                          copyToAll('visibility', select.value);
                        }}
                        className="px-2 py-1.5 bg-[#8B9D83] text-white text-xs rounded-r-lg hover:bg-[#8B9D83]/90 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Items */}
              {batchItems.map((batchItem, index) => (
                <div key={batchItem.id} className="border border-[#1A2332]/10 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* Preview */}
                    <div className="w-16 h-16 bg-[#1A2332]/5 rounded-lg flex-shrink-0 overflow-hidden">
                      {batchItem.item?.signed_url ? (
                        <img 
                          src={batchItem.item.signed_url} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-[#1A2332]/30" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    
                    {/* Fields */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-[#1A2332]/40">#{index + 1}</span>
                        <input
                          type="text"
                          value={batchItem.title}
                          onChange={(e) => updateBatchItem(batchItem.id, 'title', e.target.value)}
                          placeholder="Title"
                          aria-label={`Title for item ${index + 1}`}
                          className="flex-1 px-2 py-1.5 text-sm font-medium rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                        />
                      </div>
                      
                      <input
                        type="text"
                        value={batchItem.caption}
                        onChange={(e) => updateBatchItem(batchItem.id, 'caption', e.target.value)}
                        placeholder="Caption (short)"
                        aria-label={`Caption for item ${index + 1}`}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                      />
                      
                      <textarea
                        value={batchItem.description}
                        onChange={(e) => updateBatchItem(batchItem.id, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        aria-label={`Description for item ${index + 1}`}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] resize-none"
                      />
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={batchItem.date_approximate}
                          onChange={(e) => updateBatchItem(batchItem.id, 'date_approximate', e.target.value)}
                          placeholder="Date/year"
                          aria-label={`Date for item ${index + 1}`}
                          className="px-2 py-1.5 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                        />
                        <input
                          type="text"
                          value={batchItem.source_attribution}
                          onChange={(e) => updateBatchItem(batchItem.id, 'source_attribution', e.target.value)}
                          placeholder="Source"
                          aria-label={`Source for item ${index + 1}`}
                          className="px-2 py-1.5 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                        />
                        <input
                          type="text"
                          value={batchItem.tags}
                          onChange={(e) => updateBatchItem(batchItem.id, 'tags', e.target.value)}
                          placeholder="Tags (comma-separated)"
                          aria-label={`Tags for item ${index + 1}`}
                          className="px-2 py-1.5 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                        />
                        <select
                          value={batchItem.visibility}
                          onChange={(e) => updateBatchItem(batchItem.id, 'visibility', e.target.value)}
                          aria-label={`Visibility for item ${index + 1}`}
                          className="px-2 py-1.5 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D]"
                        >
                          {visibilityOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <select
                          value={batchItem.rights_status}
                          onChange={(e) => updateBatchItem(batchItem.id, 'rights_status', e.target.value)}
                          aria-label={`Rights status for item ${index + 1}`}
                          className="px-2 py-1.5 text-sm rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] col-span-2 sm:col-span-1"
                        >
                          {RIGHTS_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8]/50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#1A2332]/50">
                  <Lock className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                  All items remain drafts until approved by a steward
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowBatchEditor(false);
                      setBatchItems([]);
                    }}
                    className="px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={saveBatchMetadata}
                    disabled={isSavingBatch}
                    className="flex items-center px-4 py-2 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
                  >
                    {isSavingBatch ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                        Save All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Item Modal */}
      {editingItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-item-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingItem(null);
          }}
        >
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 id="edit-item-title" className="font-serif text-lg text-[#1A2332]">Edit Item</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-[#1A2332]/40 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateItem(); }} className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="edit-caption" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Caption (short)
                  </label>
                  <input
                    id="edit-caption"
                    type="text"
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    placeholder="Brief caption for the image"
                    className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    id="edit-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Date or approximate year (optional)
                  </label>
                  <input
                    id="edit-date"
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g., 1985 or March 1985"
                    className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="edit-source" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Source / Attribution (optional)
                  </label>
                  <input
                    id="edit-source"
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="e.g., Family collection, John Smith"
                    className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="edit-rights-status" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5 text-[#1A2332]/50" aria-hidden="true" />
                    Rights Status
                  </label>
                  <div className="relative">
                    <select
                      id="edit-rights-status"
                      value={formRightsStatus}
                      onChange={(e) => setFormRightsStatus(e.target.value)}
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm bg-white"
                    >
                      {RIGHTS_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40 pointer-events-none" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-[#1A2332]/40 mt-1">
                    Clarifies the copyright or permission status of this content
                  </p>
                </div>



                <div>
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" aria-hidden="true" />
                    <input
                      id="edit-tags"
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="e.g., match day, team photo, 1980s"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                    />
                  </div>
                  {formTags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {parseTags(formTags).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#1A2332]/5 text-[#1A2332]/70 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2332]/80 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Visibility options">
                    {visibilityOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormVisibility(option.value)}
                        role="radio"
                        aria-checked={formVisibility === option.value}
                        className={`p-2 rounded-lg border text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 ${
                          formVisibility === option.value
                            ? 'border-[#B8826D] bg-[#B8826D]/5'
                            : 'border-[#1A2332]/10 hover:border-[#1A2332]/20'
                        }`}
                      >
                        <div className="flex items-center">
                          <option.icon className={`w-3.5 h-3.5 mr-1.5 ${
                            formVisibility === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]/40'
                          }`} aria-hidden="true" />
                          <span className={`text-xs font-medium ${
                            formVisibility === option.value ? 'text-[#B8826D]' : 'text-[#1A2332]'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !formTitle.trim()}
                    className="flex items-center px-4 py-2 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveUploadSection;
