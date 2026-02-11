import React, { useState, useEffect, useCallback } from 'react';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Image, 
  FileText, 
  Users, 
  Clock, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  Send,
  Trash2
} from 'lucide-react';
import VisibilitySelector, { VisibilityLevel } from './VisibilitySelector';
import { useJourneyContributions, JourneyContribution, ContributionAuditEntry } from '@/hooks/useJourneyContributions';
import { useAppContext } from '@/contexts/AppContext';

interface EditableItem {
  id: string;
  type: 'text' | 'moment' | 'person' | 'organisation' | 'image' | 'document';
  content: string;
  visibility: VisibilityLevel;
  lastModified?: string;
  modifiedBy?: string;
  // Track if this is a new item (not yet saved) or existing
  isNew?: boolean;
  dbId?: string; // The real database ID once saved
}

interface JourneyEditModeProps {
  isOwner: boolean;
  journeyId: string;
  journeyType: 'individual' | 'club' | 'moment';
  onSave?: (items: EditableItem[]) => void;
  onCancel?: () => void;
}

const JourneyEditMode: React.FC<JourneyEditModeProps> = ({
  isOwner,
  journeyId,
  journeyType,
  onSave,
  onCancel
}) => {
  const { user, profile, globalStewardInfo } = useAppContext();
  const {
    contributions,
    auditLog,
    loading,
    saving,
    error,
    fetchContributions,
    createContribution,
    updateContribution,
    deleteContribution,
    submitForReview,
    batchSave,
    fetchAuditLog,
    clearError
  } = useJourneyContributions();

  const [isEditing, setIsEditing] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Get user info for attribution
  const userId = user?.id || globalStewardInfo?.email || '';
  const userName = profile?.full_name || globalStewardInfo?.name || user?.user_metadata?.full_name || 'Unknown';

  // Load existing contributions when component mounts or journeyId changes
  useEffect(() => {
    if (journeyId && !initialLoaded) {
      fetchContributions(journeyId).then(() => setInitialLoaded(true));
      fetchAuditLog(journeyId);
    }
  }, [journeyId, fetchContributions, fetchAuditLog, initialLoaded]);

  // Convert DB contributions to EditableItems when entering edit mode
  const loadItemsFromContributions = useCallback(() => {
    const draftItems = contributions.filter(c => c.status === 'draft');
    const editableItems: EditableItem[] = draftItems.map(c => ({
      id: c.id,
      dbId: c.id,
      type: c.type as EditableItem['type'],
      content: c.content?.body || c.content?.title || c.content?.name || '',
      visibility: (c.visibility === 'private_draft' ? 'draft' : c.visibility) as VisibilityLevel,
      lastModified: c.updated_at,
      modifiedBy: c.contributor_name || 'You',
      isNew: false
    }));
    setItems(editableItems);
  }, [contributions]);

  const handleStartEditing = () => {
    loadItemsFromContributions();
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    clearError();
    
    // Build items for batch save
    const batchItems = items.map(item => ({
      id: item.dbId || `temp_${item.id}`,
      type: item.type,
      content: {
        body: item.type === 'text' ? item.content : undefined,
        title: item.type === 'moment' ? item.content : undefined,
        name: item.type === 'person' ? item.content : undefined,
        description: ['organisation', 'image', 'document'].includes(item.type) ? item.content : undefined,
      },
      visibility: item.visibility === 'draft' ? 'private_draft' : item.visibility,
      status: 'draft'
    }));

    const result = await batchSave(journeyId, batchItems, userId, userName);
    
    if (result.errors.length === 0) {
      setSaveSuccess(true);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      // Refresh data
      await fetchContributions(journeyId);
      await fetchAuditLog(journeyId);
      
      // Call the parent onSave if provided
      if (onSave) {
        onSave(items);
      }

      // Clear success after 3s
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSubmitForReview = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item?.dbId) {
      // Need to save first
      const created = await createContribution({
        journey_id: journeyId,
        type: item?.type || 'text',
        content: {
          body: item?.type === 'text' ? item?.content : undefined,
          title: item?.type === 'moment' ? item?.content : undefined,
          name: item?.type === 'person' ? item?.content : undefined,
        },
        visibility: (item?.visibility === 'draft' ? 'private_draft' : item?.visibility) as any,
        contributor_id: userId || undefined,
        contributor_name: userName,
        status: 'draft' as any
      });
      
      if (created) {
        await submitForReview(created.id, userId, userName);
        await fetchContributions(journeyId);
        await fetchAuditLog(journeyId);
        // Remove from local items
        setItems(prev => prev.filter(i => i.id !== itemId));
      }
    } else {
      await submitForReview(item.dbId, userId, userName);
      await fetchContributions(journeyId);
      await fetchAuditLog(journeyId);
      // Remove from local items
      setItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setItems([]);
    if (onCancel) {
      onCancel();
    }
  };

  const handleAddItem = (type: EditableItem['type']) => {
    const newItem: EditableItem = {
      id: `new_${Date.now()}`,
      type,
      content: '',
      visibility: 'draft',
      lastModified: new Date().toISOString(),
      modifiedBy: userName,
      isNew: true
    };
    setItems([...items, newItem]);
    setHasUnsavedChanges(true);
  };

  const handleUpdateItemVisibility = (itemId: string, visibility: VisibilityLevel) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, visibility } : item
    ));
    setHasUnsavedChanges(true);
  };

  const handleRemoveItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    
    // If it has a DB id, delete from database too
    if (item?.dbId) {
      await deleteContribution(item.dbId, userId, userName);
      await fetchAuditLog(journeyId);
    }
    
    setItems(items.filter(item => item.id !== itemId));
    setHasUnsavedChanges(true);
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

  if (!isOwner) {
    return null;
  }

  // Count contributions by status
  const draftCount = contributions.filter(c => c.status === 'draft').length;
  const submittedCount = contributions.filter(c => c.status === 'submitted_for_review').length;
  const approvedCount = contributions.filter(c => c.status === 'approved').length;

  return (
    <div className="space-y-4">
      {/* Success Banner */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mr-3" />
          <p className="text-sm text-green-800 font-medium">Changes saved successfully to database.</p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Mode Banner */}
      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">Edit Mode</p>
              <p className="text-xs text-amber-700 mt-1">
                New additions start as Private Draft. You decide what becomes public. Changes are saved to the database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Summary (when not editing) */}
      {!isEditing && initialLoaded && (draftCount > 0 || submittedCount > 0 || approvedCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {draftCount > 0 && (
            <span className="text-xs px-2.5 py-1 bg-[#1A2332]/5 text-[#1A2332]/60 rounded-full">
              {draftCount} draft{draftCount !== 1 ? 's' : ''}
            </span>
          )}
          {submittedCount > 0 && (
            <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
              {submittedCount} pending review
            </span>
          )}
          {approvedCount > 0 && (
            <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full">
              {approvedCount} approved
            </span>
          )}
        </div>
      )}

      {/* Edit Controls */}
      <div className="flex items-center justify-between">
        {!isEditing ? (
          <button
            onClick={handleStartEditing}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1A2332]/5 text-[#1A2332] rounded-lg hover:bg-[#1A2332]/10 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Edit / Update</span>
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#1A2332]/5 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Cancel</span>
            </button>
          </div>
        )}

        {/* Audit Log Toggle */}
        <button
          onClick={() => {
            setShowAuditLog(!showAuditLog);
            if (!showAuditLog) {
              fetchAuditLog(journeyId);
            }
          }}
          className="flex items-center space-x-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] transition-colors"
        >
          <Clock className="w-4 h-4" />
          <span>History</span>
          {showAuditLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Add New Items (when editing) */}
      {isEditing && (
        <div className="bg-[#F5F1E8] rounded-lg p-4 border border-[#1A2332]/10">
          <p className="text-sm font-medium text-[#1A2332] mb-3">Add new content</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAddItem('text')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332] hover:border-[#B8826D] transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Text / Reflection</span>
            </button>
            <button
              onClick={() => handleAddItem('moment')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332] hover:border-[#B8826D] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Moment</span>
            </button>
            <button
              onClick={() => handleAddItem('person')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332] hover:border-[#B8826D] transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Person</span>
            </button>
            <button
              onClick={() => handleAddItem('image')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332] hover:border-[#B8826D] transition-colors"
            >
              <Image className="w-4 h-4" />
              <span>Image</span>
            </button>
            <button
              onClick={() => handleAddItem('document')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-[#1A2332]/10 rounded-lg text-sm text-[#1A2332] hover:border-[#B8826D] transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Document</span>
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {isEditing && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-4 border border-[#1A2332]/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-[#B8826D] uppercase">
                    {item.isNew ? 'New' : 'Draft'} {item.type}
                  </span>
                  {item.dbId && (
                    <span className="text-[10px] text-[#1A2332]/30 font-mono">
                      {item.dbId.substring(0, 8)}...
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <VisibilitySelector
                    value={item.visibility}
                    onChange={(v) => handleUpdateItemVisibility(item.id, v)}
                    compact
                  />
                  {/* Submit for Review button */}
                  {item.content.trim() && (
                    <button
                      onClick={() => handleSubmitForReview(item.id)}
                      disabled={saving}
                      className="p-1.5 text-[#8B9D83] hover:bg-[#8B9D83]/10 rounded transition-colors disabled:opacity-50"
                      title="Submit for review"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={saving}
                    className="p-1 text-[#1A2332]/40 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {item.type === 'text' && (
                <textarea
                  placeholder="Write your reflection or text here..."
                  value={item.content}
                  className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-sm resize-none focus:outline-none focus:border-[#B8826D]"
                  rows={3}
                  onChange={(e) => {
                    setItems(items.map(i => 
                      i.id === item.id ? { ...i, content: e.target.value } : i
                    ));
                    setHasUnsavedChanges(true);
                  }}
                />
              )}
              {item.type === 'moment' && (
                <input
                  type="text"
                  placeholder="Describe the moment..."
                  value={item.content}
                  className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                  onChange={(e) => {
                    setItems(items.map(i => 
                      i.id === item.id ? { ...i, content: e.target.value } : i
                    ));
                    setHasUnsavedChanges(true);
                  }}
                />
              )}
              {item.type === 'person' && (
                <input
                  type="text"
                  placeholder="Person's name..."
                  value={item.content}
                  className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                  onChange={(e) => {
                    setItems(items.map(i => 
                      i.id === item.id ? { ...i, content: e.target.value } : i
                    ));
                    setHasUnsavedChanges(true);
                  }}
                />
              )}
              {(item.type === 'image' || item.type === 'document') && (
                <div>
                  <input
                    type="text"
                    placeholder={item.type === 'image' ? 'Image description...' : 'Document description...'}
                    value={item.content}
                    className="w-full px-3 py-2 border border-[#1A2332]/10 rounded-lg text-sm focus:outline-none focus:border-[#B8826D] mb-2"
                    onChange={(e) => {
                      setItems(items.map(i => 
                        i.id === item.id ? { ...i, content: e.target.value } : i
                      ));
                      setHasUnsavedChanges(true);
                    }}
                  />
                  <div className="border-2 border-dashed border-[#1A2332]/20 rounded-lg p-4 text-center">
                    <p className="text-xs text-[#1A2332]/50">
                      File uploads are handled via the Steward Dashboard. Describe the content here.
                    </p>
                  </div>
                </div>
              )}
              {/* Last modified info */}
              {item.lastModified && (
                <p className="text-[10px] text-[#1A2332]/30 mt-2">
                  Last modified: {formatDate(item.lastModified)} by {item.modifiedBy}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {loading && !isEditing && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin mr-2" />
          <span className="text-sm text-[#1A2332]/50">Loading contributions...</span>
        </div>
      )}

      {/* Audit Log */}
      {showAuditLog && (
        <div className="bg-[#1A2332]/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-[#1A2332]">Change History</h4>
            <button
              onClick={() => fetchAuditLog(journeyId)}
              className="text-xs text-[#1A2332]/50 hover:text-[#1A2332] flex items-center"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Refresh
            </button>
          </div>
          {auditLog.length === 0 ? (
            <p className="text-sm text-[#1A2332]/60 text-center py-4">No changes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between bg-white rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-[#B8826D]">
                        {entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {entry.after_snapshot?.type && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#F5F1E8] rounded text-[#1A2332]/50">
                          {entry.after_snapshot.type}
                        </span>
                      )}
                    </div>
                    {entry.after_snapshot?.content_preview && (
                      <p className="text-xs text-[#1A2332]/50 mt-1 line-clamp-1">
                        {entry.after_snapshot.content_preview.substring(0, 80)}
                      </p>
                    )}
                    <p className="text-xs text-[#1A2332]/40 mt-1">
                      {formatDate(entry.created_at)} by {entry.actor_name || entry.actor_id?.substring(0, 8) || 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JourneyEditMode;
