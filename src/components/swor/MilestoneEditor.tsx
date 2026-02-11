import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar, Plus, GripVertical, Pencil, Trash2, X, Check, Loader2, 
  Image as ImageIcon, MapPin, AlertCircle, ChevronDown, ChevronUp,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LinkedEntity {
  type: 'club' | 'org';
  id: string;
  name: string;
  is_suggestion?: boolean;
}

interface ArchiveImage {
  id: string;
  title: string;
  signed_url?: string;
  thumb_signed_url?: string;
}

interface Milestone {
  id: string;
  title: string;
  approx_date?: string;
  description?: string;
  optional_photo_archive_item_id?: string;
  optional_linked_entity_ids?: LinkedEntity[];
  display_order: number;
  photo_url?: string;
}

interface MilestoneEditorProps {
  profileId: string;
  userId?: string;
  archiveImages?: ArchiveImage[];
  isReadOnly?: boolean;
  onMilestonesChange?: (milestones: Milestone[]) => void;
}

const MilestoneEditor: React.FC<MilestoneEditorProps> = ({
  profileId,
  userId,
  archiveImages = [],
  isReadOnly = false,
  onMilestonesChange
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Milestone>>({});
  
  // Add new milestone state
  const [isAdding, setIsAdding] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '',
    approx_date: '',
    description: '',
    optional_photo_archive_item_id: undefined,
    optional_linked_entity_ids: []
  });
  
  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  // Entity search
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const [entitySearchResults, setEntitySearchResults] = useState<LinkedEntity[]>([]);
  const [isSearchingEntities, setIsSearchingEntities] = useState(false);
  
  // Photo picker
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<'new' | 'edit'>('new');

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMilestones();
  }, [profileId]);

  const loadMilestones = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'get_milestones',
          payload: {
            profile_id: profileId,
            user_id: userId,
            include_drafts: true
          }
        }
      });

      if (error) throw error;
      
      if (data?.success && data.milestones) {
        setMilestones(data.milestones);
        onMilestonesChange?.(data.milestones);
      }
    } catch (err) {
      console.error('Failed to load milestones:', err);
      setError('Unable to load milestones');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMilestone = async (milestone: Partial<Milestone>, isNew: boolean = false) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: isNew ? 'create_milestone' : 'update_milestone',
          payload: {
            profile_id: profileId,
            user_id: userId,
            milestone_id: milestone.id,
            title: milestone.title,
            approx_date: milestone.approx_date || null,
            description: milestone.description || null,
            optional_photo_archive_item_id: milestone.optional_photo_archive_item_id || null,
            optional_linked_entity_ids: milestone.optional_linked_entity_ids || []
          }
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        await loadMilestones();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save milestone:', err);
      setError('Failed to save milestone');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'delete_milestone',
          payload: {
            profile_id: profileId,
            user_id: userId,
            milestone_id: milestoneId
          }
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        await loadMilestones();
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete milestone:', err);
      setError('Failed to delete milestone');
    } finally {
      setIsSaving(false);
    }
  };

  const reorderMilestones = async (orderedIds: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'reorder_milestones',
          payload: {
            profile_id: profileId,
            user_id: userId,
            ordered_milestone_ids: orderedIds
          }
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        // Update local state immediately for responsiveness
        const reordered = orderedIds.map((id, index) => {
          const milestone = milestones.find(m => m.id === id);
          return milestone ? { ...milestone, display_order: index + 1 } : null;
        }).filter(Boolean) as Milestone[];
        
        setMilestones(reordered);
        onMilestonesChange?.(reordered);
      }
    } catch (err) {
      console.error('Failed to reorder milestones:', err);
      // Reload to get correct order
      await loadMilestones();
    }
  };

  // Handle add new milestone
  const handleAddMilestone = async () => {
    if (!newMilestone.title?.trim()) {
      setError('Please add a title for this milestone');
      return;
    }
    
    const success = await saveMilestone({
      ...newMilestone,
      display_order: milestones.length + 1
    }, true);
    
    if (success) {
      setIsAdding(false);
      setNewMilestone({
        title: '',
        approx_date: '',
        description: '',
        optional_photo_archive_item_id: undefined,
        optional_linked_entity_ids: []
      });
    }
  };

  // Handle edit milestone
  const handleStartEdit = (milestone: Milestone) => {
    setEditingId(milestone.id);
    setEditForm({ ...milestone });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title?.trim()) {
      setError('Please add a title for this milestone');
      return;
    }
    
    const success = await saveMilestone(editForm);
    
    if (success) {
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, milestoneId: string) => {
    setDraggedId(milestoneId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, milestoneId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== milestoneId) {
      setDragOverId(milestoneId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    
    const currentOrder = milestones.map(m => m.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    
    // Remove dragged item and insert at new position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedId);
    
    setDraggedId(null);
    setDragOverId(null);
    
    await reorderMilestones(currentOrder);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Photo picker handlers
  const handleOpenPhotoPicker = (target: 'new' | 'edit') => {
    setPhotoPickerTarget(target);
    setShowPhotoPicker(true);
  };

  const handleSelectPhoto = (photoId: string | undefined) => {
    if (photoPickerTarget === 'new') {
      setNewMilestone(prev => ({ ...prev, optional_photo_archive_item_id: photoId }));
    } else {
      setEditForm(prev => ({ ...prev, optional_photo_archive_item_id: photoId }));
    }
    setShowPhotoPicker(false);
  };

  // Entity linking (simplified - creates suggestions)
  const handleAddEntityLink = (target: 'new' | 'edit', entityName: string) => {
    if (!entityName.trim()) return;
    
    const newEntity: LinkedEntity = {
      type: 'club',
      id: `suggestion-${Date.now()}`,
      name: entityName.trim(),
      is_suggestion: true
    };
    
    if (target === 'new') {
      setNewMilestone(prev => ({
        ...prev,
        optional_linked_entity_ids: [...(prev.optional_linked_entity_ids || []), newEntity]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        optional_linked_entity_ids: [...(prev.optional_linked_entity_ids || []), newEntity]
      }));
    }
    setEntitySearchQuery('');
  };

  const handleRemoveEntityLink = (target: 'new' | 'edit', entityId: string) => {
    if (target === 'new') {
      setNewMilestone(prev => ({
        ...prev,
        optional_linked_entity_ids: (prev.optional_linked_entity_ids || []).filter(e => e.id !== entityId)
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        optional_linked_entity_ids: (prev.optional_linked_entity_ids || []).filter(e => e.id !== entityId)
      }));
    }
  };

  // Get photo URL for display
  const getPhotoUrl = (photoId?: string): string | undefined => {
    if (!photoId) return undefined;
    const photo = archiveImages.find(img => img.id === photoId);
    return photo?.thumb_signed_url || photo?.signed_url;
  };

  // Render milestone form (shared between add and edit)
  const renderMilestoneForm = (
    formData: Partial<Milestone>,
    setFormData: (data: Partial<Milestone>) => void,
    target: 'new' | 'edit'
  ) => (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
          Title <span className="text-[#B8826D]">*</span>
        </label>
        <input
          ref={target === 'new' ? titleInputRef : undefined}
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Joined Western Province RFC"
          className="w-full px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base"
          disabled={isReadOnly}
        />
      </div>

      {/* Approximate Date */}
      <div>
        <label className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
          Approximate Date
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={formData.approx_date || ''}
            onChange={(e) => setFormData({ ...formData, approx_date: e.target.value })}
            placeholder="e.g., 1975 or 1975-06"
            className="flex-1 px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base"
            disabled={isReadOnly}
          />
        </div>
        <p className="text-xs text-[#1A2332]/50 mt-1.5 flex items-center">
          <HelpCircle className="w-3 h-3 mr-1" />
          Year only (1975) or month/year (1975-06) are fine
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="A brief description of this milestone..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-base resize-none"
          disabled={isReadOnly}
        />
      </div>

      {/* Attach Photo */}
      <div>
        <label className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
          Attach Photo
        </label>
        {formData.optional_photo_archive_item_id ? (
          <div className="flex items-center space-x-3">
            <img
              src={getPhotoUrl(formData.optional_photo_archive_item_id)}
              alt="Selected photo"
              className="w-16 h-16 object-cover rounded-lg border border-[#1A2332]/10"
            />
            <button
              onClick={() => setFormData({ ...formData, optional_photo_archive_item_id: undefined })}
              className="text-sm text-red-600 hover:text-red-700"
              disabled={isReadOnly}
            >
              Remove
            </button>
          </div>
        ) : archiveImages.length > 0 ? (
          <button
            onClick={() => handleOpenPhotoPicker(target)}
            className="flex items-center space-x-2 px-3 py-2 bg-[#1A2332]/5 rounded-lg text-sm text-[#1A2332]/70 hover:bg-[#1A2332]/10 transition-colors"
            disabled={isReadOnly}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Select from archive</span>
          </button>
        ) : (
          <p className="text-sm text-[#1A2332]/50">
            Upload images to your archive first to attach them here.
          </p>
        )}
      </div>

      {/* Link Club/Organisation */}
      <div>
        <label className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
          Link Club or Organisation
        </label>
        
        {/* Linked entities */}
        {(formData.optional_linked_entity_ids || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {(formData.optional_linked_entity_ids || []).map((entity) => (
              <span
                key={entity.id}
                className="inline-flex items-center px-2.5 py-1 bg-[#8B9D83]/10 rounded-full text-sm text-[#8B9D83]"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {entity.name}
                {entity.is_suggestion && (
                  <span className="text-xs ml-1 text-[#1A2332]/40">(suggestion)</span>
                )}
                {!isReadOnly && (
                  <button
                    onClick={() => handleRemoveEntityLink(target, entity.id)}
                    className="ml-1.5 hover:text-red-600"
                    aria-label={`Remove ${entity.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        
        {/* Add entity input */}
        {!isReadOnly && (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={entitySearchQuery}
              onChange={(e) => setEntitySearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEntityLink(target, entitySearchQuery);
                }
              }}
              placeholder="Type club/org name and press Enter"
              className="flex-1 px-3 py-2 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:border-[#B8826D] text-sm"
            />
            <button
              onClick={() => handleAddEntityLink(target, entitySearchQuery)}
              disabled={!entitySearchQuery.trim()}
              className="px-3 py-2 bg-[#1A2332]/5 rounded-lg text-sm text-[#1A2332]/70 hover:bg-[#1A2332]/10 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
        )}
        <p className="text-xs text-[#1A2332]/50 mt-1.5">
          Links create suggestions only - they don't automatically appear on other journeys.
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#B8826D]" />
        <span className="ml-2 text-sm text-[#1A2332]/60">Loading milestones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-left"
          aria-expanded={isExpanded}
        >
          <Calendar className="w-5 h-5 text-[#8B9D83]" />
          <span className="font-medium text-[#1A2332]">Milestone Timeline</span>
          <span className="text-sm text-[#1A2332]/40">
            ({milestones.length})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#1A2332]/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-sm text-[#1A2332]/60 leading-relaxed">
        Add key moments from your rugby journey. Approximate dates are fine — it's better to take your time.
      </p>

      {isExpanded && (
        <>
          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Existing Milestones */}
          {milestones.length > 0 && (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  draggable={!isReadOnly && !editingId}
                  onDragStart={(e) => handleDragStart(e, milestone.id)}
                  onDragOver={(e) => handleDragOver(e, milestone.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, milestone.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-[#F5F1E8]/50 rounded-lg border transition-all ${
                    dragOverId === milestone.id
                      ? 'border-[#B8826D] border-dashed'
                      : 'border-transparent'
                  } ${draggedId === milestone.id ? 'opacity-50' : ''}`}
                >
                  {editingId === milestone.id ? (
                    /* Edit Mode */
                    <div className="p-4">
                      {renderMilestoneForm(editForm, setEditForm, 'edit')}
                      
                      <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-[#1A2332]/10">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] transition-colors"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSaving || !editForm.title?.trim()}
                          className="flex items-center space-x-2 px-4 py-2 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 disabled:opacity-50 transition-colors"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : deleteConfirmId === milestone.id ? (
                    /* Delete Confirmation */
                    <div className="p-4">
                      <p className="text-sm text-[#1A2332]/70 mb-4">
                        Are you sure you want to delete "{milestone.title}"?
                      </p>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] transition-colors"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteMilestone(milestone.id)}
                          disabled={isSaving}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="p-4 flex items-start space-x-3">
                      {/* Drag Handle */}
                      {!isReadOnly && (
                        <div 
                          className="cursor-grab active:cursor-grabbing text-[#1A2332]/30 hover:text-[#1A2332]/50 mt-1"
                          aria-label="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {milestone.approx_date && (
                              <span className="text-xs font-medium text-[#B8826D] block mb-0.5">
                                {milestone.approx_date}
                              </span>
                            )}
                            <h4 className="font-medium text-[#1A2332] text-sm truncate">
                              {milestone.title}
                            </h4>
                          </div>
                          
                          {/* Actions */}
                          {!isReadOnly && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={() => handleStartEdit(milestone)}
                                className="p-1.5 text-[#1A2332]/40 hover:text-[#B8826D] transition-colors"
                                aria-label="Edit milestone"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(milestone.id)}
                                className="p-1.5 text-[#1A2332]/40 hover:text-red-600 transition-colors"
                                aria-label="Delete milestone"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {milestone.description && (
                          <p className="text-xs text-[#1A2332]/60 mt-1 line-clamp-2">
                            {milestone.description}
                          </p>
                        )}
                        
                        {/* Photo thumbnail */}
                        {milestone.photo_url && (
                          <img
                            src={milestone.photo_url}
                            alt=""
                            className="w-12 h-12 object-cover rounded mt-2"
                          />
                        )}
                        
                        {/* Linked entities */}
                        {milestone.optional_linked_entity_ids && milestone.optional_linked_entity_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {milestone.optional_linked_entity_ids.map((entity, idx) => (
                              <span
                                key={`${entity.id}-${idx}`}
                                className="inline-flex items-center px-2 py-0.5 bg-white rounded text-xs text-[#1A2332]/60"
                              >
                                <MapPin className="w-2.5 h-2.5 mr-1" />
                                {entity.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Milestone */}
          {!isReadOnly && (
            <>
              {isAdding ? (
                <div className="bg-white rounded-lg border border-[#B8826D]/30 p-4">
                  <h4 className="font-medium text-[#1A2332] mb-4">Add Milestone</h4>
                  
                  {renderMilestoneForm(newMilestone, setNewMilestone, 'new')}
                  
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-[#1A2332]/10">
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewMilestone({
                          title: '',
                          approx_date: '',
                          description: '',
                          optional_photo_archive_item_id: undefined,
                          optional_linked_entity_ids: []
                        });
                      }}
                      className="px-3 py-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] transition-colors"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMilestone}
                      disabled={isSaving || !newMilestone.title?.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>Add Milestone</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setTimeout(() => titleInputRef.current?.focus(), 100);
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-[#1A2332]/20 rounded-lg text-[#1A2332]/60 hover:border-[#B8826D] hover:text-[#B8826D] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add milestone</span>
                </button>
              )}
            </>
          )}

          {/* Empty State */}
          {milestones.length === 0 && !isAdding && (
            <div className="text-center py-6 text-[#1A2332]/50 text-sm">
              No milestones added yet. Add your first milestone to start building your timeline.
            </div>
          )}
        </>
      )}

      {/* Photo Picker Modal */}
      {showPhotoPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPhotoPicker(false)} />
          <div className="relative bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-[#1A2332]/10 flex items-center justify-between">
              <h3 className="font-medium text-[#1A2332]">Select Photo</h3>
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="p-1 text-[#1A2332]/40 hover:text-[#1A2332]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {archiveImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {archiveImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleSelectPhoto(image.id)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#B8826D] transition-colors"
                    >
                      <img
                        src={image.thumb_signed_url || image.signed_url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#1A2332]/50 py-8">
                  No images in your archive yet.
                </p>
              )}
            </div>
            <div className="p-4 border-t border-[#1A2332]/10">
              <button
                onClick={() => handleSelectPhoto(undefined)}
                className="w-full py-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332]"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneEditor;
