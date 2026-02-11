import React, { useState, useEffect } from 'react';
import { Image, FileText, Type, Link2, User, Shield, ExternalLink, Calendar, Eye, Download, ChevronDown, ChevronUp, Loader2, Edit2, Trash2, Upload, X, Check, Tag, Lock, Globe, Heart, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Types for approved items
interface ContentJson {
  file_name?: string;
  source_notes?: string;
  uploader_name?: string;
  credit_line?: string;
  credit_preference?: 'name' | 'organisation' | 'anonymous' | 'none';
  rights_status?: string;
  rights_holder?: string;
  source_url?: string;
  url?: string; // Phase 4C: Link items store URL here
  allow_embedding?: boolean;
  title?: string;
  body?: string; // Phase 4A: text item body content
  description?: string;
  text_content?: string;
  submitter_name?: string;
  source_type?: string; // Phase 4C: youtube, vimeo, wiki, archive, news, etc.
}




interface ApprovedItem {
  id: string;
  journey_id: string;
  item_type: 'image' | 'document' | 'text' | 'link';
  status: string;
  visibility: 'public' | 'connections' | 'family' | 'private_draft';
  content_json: ContentJson;
  storage_path?: string;
  thumb_path?: string;
  mime?: string;
  size?: number;
  source_notes?: string;
  created_at: string;
  created_by?: string;
  reviewed_at?: string;
  signed_url?: string;
}

interface ApprovedItemsSectionProps {
  journeyId: string;
  journeyTitle?: string;
  viewerUserId?: string | null;
  viewerRelationship?: 'public' | 'connection' | 'family' | null;
  isSteward?: boolean;
  isOwner?: boolean;
  onNavigate?: (page: string) => void;
}

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

const RIGHTS_STATUS_DISPLAY: Record<string, string> = {
  family_collection: 'Family collection',
  public_domain: 'Public domain',
  used_with_permission: 'Used with permission',
  copyright_holder: 'Copyright holder',
  creative_commons: 'Creative Commons',
  fair_use: 'Fair use / educational',
  club_archive: 'Club archive',
  press_media: 'Press / media',
  unknown: 'Unknown / to be confirmed',
};

// Attribution display component
const AttributionBadge: React.FC<{ item: ApprovedItem }> = ({ item }) => {
  const content = item.content_json || {};
  const creditLine = content.credit_line || content.uploader_name || 'Anonymous contributor';
  const rightsRaw = content.rights_status || '';
  const rightsStatus = RIGHTS_STATUS_DISPLAY[rightsRaw] || rightsRaw || 'Rights status pending';
  
  return (
    <div className="mt-3 pt-3 border-t border-[#1A2332]/10">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#1A2332]/60">
        <div className="flex items-center">
          <User className="w-3 h-3 mr-1" />
          <span>{creditLine}</span>
        </div>
        <span className="text-[#1A2332]/30">|</span>
        <div className="flex items-center">
          <Shield className="w-3 h-3 mr-1" />
          <span>{rightsStatus}</span>
        </div>
      </div>
      {content.source_url && content.allow_embedding !== false && (
        <a 
          href={content.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-xs text-[#B8826D] hover:text-[#B8826D]/80 mt-2"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View original source
        </a>
      )}
    </div>
  );
};

// Steward action buttons overlay for items
const StewardActions: React.FC<{
  item: ApprovedItem;
  onEdit: (item: ApprovedItem) => void;
  onDelete: (item: ApprovedItem) => void;
}> = ({ item, onEdit, onDelete }) => {
  return (
    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
        className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-[#1A2332]/70 hover:text-[#B8826D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
        aria-label={`Edit ${item.content_json?.title || 'item'}`}
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
        className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-[#1A2332]/70 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
        aria-label={`Delete ${item.content_json?.title || 'item'}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// Image item renderer
const ImageItem: React.FC<{ item: ApprovedItem; canEdit?: boolean; onEdit?: (item: ApprovedItem) => void; onDelete?: (item: ApprovedItem) => void }> = ({ item, canEdit, onEdit, onDelete }) => {
  const content = item.content_json || {};
  const fileName = content.file_name || 'Image';
  const title = content.title || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#1A2332]/10 group relative">
      {canEdit && onEdit && onDelete && (
        <StewardActions item={item} onEdit={onEdit} onDelete={onDelete} />
      )}
      {item.signed_url ? (
        <div className="aspect-[4/3] overflow-hidden bg-[#F5F1E8]">
          <img
            src={item.signed_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-[#F5F1E8] flex items-center justify-center">
          <Image className="w-12 h-12 text-[#1A2332]/20" />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-medium text-[#1A2332] text-sm line-clamp-2">{title}</h4>
        {content.description && (
          <p className="text-xs text-[#1A2332]/60 mt-1 line-clamp-2">{content.description}</p>
        )}
        <AttributionBadge item={item} />
      </div>
    </div>
  );
};

// Document item renderer
const DocumentItem: React.FC<{ item: ApprovedItem; canEdit?: boolean; onEdit?: (item: ApprovedItem) => void; onDelete?: (item: ApprovedItem) => void }> = ({ item, canEdit, onEdit, onDelete }) => {
  const content = item.content_json || {};
  const fileName = content.file_name || 'Document';
  const title = content.title || fileName;
  const fileSize = item.size ? `${(item.size / 1024).toFixed(1)} KB` : '';
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors group relative">
      {canEdit && onEdit && onDelete && (
        <StewardActions item={item} onEdit={onEdit} onDelete={onDelete} />
      )}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#B8826D]/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-[#B8826D]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#1A2332] text-sm truncate">{title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#1A2332]/50">
            {item.mime && <span>{item.mime.split('/')[1]?.toUpperCase() || 'FILE'}</span>}
            {fileSize && (
              <>
                <span className="text-[#1A2332]/30">•</span>
                <span>{fileSize}</span>
              </>
            )}
          </div>
          {content.description && (
            <p className="text-xs text-[#1A2332]/60 mt-2 line-clamp-2">{content.description}</p>
          )}
          {item.signed_url && (
            <a
              href={item.signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-[#B8826D] hover:text-[#B8826D]/80 mt-3"
            >
              <Download className="w-3 h-3 mr-1" />
              Download document
            </a>
          )}
          <AttributionBadge item={item} />
        </div>
      </div>
    </div>
  );
};

// Text item renderer - Phase 4A: Support text items with body content
const TextItem: React.FC<{ item: ApprovedItem; canEdit?: boolean; onEdit?: (item: ApprovedItem) => void; onDelete?: (item: ApprovedItem) => void }> = ({ item, canEdit, onEdit, onDelete }) => {
  const content = item.content_json || {};
  const title = content.title || 'Narrative';
  // Phase 4A: Prioritize body field for text items, fall back to other fields
  const textContent = content.body || content.text_content || content.description || item.source_notes || '';
  
  // Determine credit display based on credit_preference
  const getCreditDisplay = () => {
    const pref = content.credit_preference;
    if (pref === 'anonymous') return 'Anonymous contributor';
    if (pref === 'none') return null;
    return content.credit_line || content.uploader_name || content.submitter_name || null;
  };
  
  const creditDisplay = getCreditDisplay();
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#1A2332]/10 group relative">
      {canEdit && onEdit && onDelete && (
        <StewardActions item={item} onEdit={onEdit} onDelete={onDelete} />
      )}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Type className="w-4 h-4 text-purple-600" />
        </div>
        <h4 className="font-serif text-lg text-[#1A2332] pt-1">{title}</h4>
      </div>
      <div className="prose prose-sm max-w-none text-[#1A2332]/80 leading-relaxed">
        <div className="whitespace-pre-wrap">{textContent}</div>
      </div>
      {/* Custom attribution for text items */}
      <div className="mt-4 pt-4 border-t border-[#1A2332]/10">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#1A2332]/60">
          {creditDisplay && (
            <>
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span>{creditDisplay}</span>
              </div>
              {content.rights_status && <span className="text-[#1A2332]/30">|</span>}
            </>
          )}
          {content.rights_status && (
            <div className="flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              <span>{RIGHTS_STATUS_DISPLAY[content.rights_status] || content.rights_status}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Link item renderer - Phase 4C: Support link items with url, title, description, embedding
const LinkItem: React.FC<{ item: ApprovedItem; canEdit?: boolean; onEdit?: (item: ApprovedItem) => void; onDelete?: (item: ApprovedItem) => void }> = ({ item, canEdit, onEdit, onDelete }) => {
  const content = item.content_json || {};
  // Phase 4C: URL is stored as 'url' in content_json
  const sourceUrl = content.url || content.source_url || '';
  const title = content.title || 'External Source';
  const description = content.description || '';
  const allowEmbedding = content.allow_embedding === true;
  const sourceType = (content as any).source_type || null;
  
  // Determine credit display
  const getCreditDisplay = () => {
    const pref = content.credit_preference;
    if (pref === 'anonymous') return 'Anonymous contributor';
    if (pref === 'none') return null;
    return content.credit_line || null;
  };
  const creditDisplay = getCreditDisplay();
  
  // Check if URL is embeddable (YouTube/Vimeo)
  const isEmbeddable = allowEmbedding && (sourceType === 'youtube' || sourceType === 'vimeo');
  
  // Extract YouTube video ID for embedding
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };
  
  // Extract Vimeo video ID for embedding
  const getVimeoEmbedUrl = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  };
  
  const embedUrl = sourceType === 'youtube' ? getYouTubeEmbedUrl(sourceUrl) : 
                   sourceType === 'vimeo' ? getVimeoEmbedUrl(sourceUrl) : null;
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#1A2332]/10 hover:border-[#1A2332]/20 transition-colors group relative">
      {canEdit && onEdit && onDelete && (
        <StewardActions item={item} onEdit={onEdit} onDelete={onDelete} />
      )}
      {/* Embed if allowed and supported */}
      {isEmbeddable && embedUrl && (
        <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-[#1A2332]/5">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#1A2332]/5 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-5 h-5 text-[#1A2332]/60" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#1A2332] text-sm">{title}</h4>
          {description && (
            <p className="text-xs text-[#1A2332]/60 mt-1 line-clamp-2">{description}</p>
          )}
          {sourceType && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-[#1A2332]/5 text-[#1A2332]/60 rounded capitalize">
              {sourceType}
            </span>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-[#B8826D] hover:text-[#B8826D]/80 mt-3"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              {(() => {
                try {
                  return new URL(sourceUrl).hostname;
                } catch {
                  return 'View source';
                }
              })()}
            </a>
          )}
          {/* Attribution */}
          {creditDisplay && (
            <div className="mt-3 pt-3 border-t border-[#1A2332]/10">
              <div className="flex items-center text-xs text-[#1A2332]/60">
                <User className="w-3 h-3 mr-1" />
                <span>{creditDisplay}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



// Section wrapper component
const ItemSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: ApprovedItem[];
  renderItem: (item: ApprovedItem) => React.ReactNode;
  gridCols?: string;
  defaultExpanded?: boolean;
}> = ({ title, icon, items, renderItem, gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  if (items.length === 0) return null;
  
  return (
    <div className="mb-10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <div className="flex items-center">
          {icon}
          <h3 className="font-serif text-xl text-[#1A2332] ml-3">{title}</h3>
          <span className="ml-2 text-sm text-[#1A2332]/40">({items.length})</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-[#1A2332]/40 group-hover:text-[#1A2332]/60" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#1A2332]/40 group-hover:text-[#1A2332]/60" />
        )}
      </button>
      
      {expanded && (
        <div className={`grid ${gridCols} gap-4`}>
          {items.map(item => (
            <div key={item.id}>{renderItem(item)}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// Edit Item Modal for stewards
const EditItemModal: React.FC<{
  item: ApprovedItem;
  onClose: () => void;
  onSave: (item: ApprovedItem, updates: Record<string, any>) => Promise<void>;
}> = ({ item, onClose, onSave }) => {
  const content = item.content_json || {};
  const [formTitle, setFormTitle] = useState(content.title || content.file_name || '');
  const [formDescription, setFormDescription] = useState(content.description || '');
  const [formCreditLine, setFormCreditLine] = useState(content.credit_line || content.uploader_name || '');
  const [formRightsStatus, setFormRightsStatus] = useState(content.rights_status || '');
  const [formSourceUrl, setFormSourceUrl] = useState(content.source_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await onSave(item, {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        credit_line: formCreditLine.trim() || null,
        rights_status: formRightsStatus || null,
        source_url: formSourceUrl.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-approved-item-title"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 id="edit-approved-item-title" className="font-serif text-lg text-[#1A2332]">Edit Item</h3>
            <button
              onClick={onClose}
              className="text-[#1A2332]/40 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Item type badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-[#1A2332]/5 text-[#1A2332]/60 text-xs rounded capitalize">
              {item.item_type}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${
              item.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {item.status}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-ai-title" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-ai-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
              />
            </div>

            <div>
              <label htmlFor="edit-ai-description" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                Description
              </label>
              <textarea
                id="edit-ai-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm resize-none"
              />
            </div>

            <div>
              <label htmlFor="edit-ai-credit" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                <User className="w-4 h-4 inline mr-1.5 -mt-0.5 text-[#1A2332]/50" aria-hidden="true" />
                Credit / Attribution
              </label>
              <input
                id="edit-ai-credit"
                type="text"
                value={formCreditLine}
                onChange={(e) => setFormCreditLine(e.target.value)}
                placeholder="e.g., Family collection, John Smith"
                className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
              />
            </div>

            <div>
              <label htmlFor="edit-ai-rights-status" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5 text-[#1A2332]/50" aria-hidden="true" />
                Rights Status
              </label>
              <div className="relative">
                <select
                  id="edit-ai-rights-status"
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

            {(item.item_type === 'link') && (
              <div>
                <label htmlFor="edit-ai-source-url" className="block text-sm font-medium text-[#1A2332]/80 mb-1.5">
                  <ExternalLink className="w-4 h-4 inline mr-1.5 -mt-0.5 text-[#1A2332]/50" aria-hidden="true" />
                  Source URL
                </label>
                <input
                  id="edit-ai-source-url"
                  type="url"
                  value={formSourceUrl}
                  onChange={(e) => setFormSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/20 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 focus:border-[#B8826D] text-sm"
                />
              </div>
            )}

            {/* Error display */}
            {saveError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm" role="alert">
                {saveError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[#1A2332]/60 hover:text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !formTitle.trim()}
                className="flex items-center px-4 py-2 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
              >
                {isSaving ? (
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
  );
};

// Main component
const ApprovedItemsSection: React.FC<ApprovedItemsSectionProps> = ({
  journeyId,
  journeyTitle = 'this journey',
  viewerUserId = null,
  viewerRelationship = null,
  isSteward = false,
  isOwner = false,
  onNavigate
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<{
    images: ApprovedItem[];
    documents: ApprovedItem[];
    texts: ApprovedItem[];
    links: ApprovedItem[];
  }>({
    images: [],
    documents: [],
    texts: [],
    links: []
  });
  const [totalCount, setTotalCount] = useState(0);
  const [editingItem, setEditingItem] = useState<ApprovedItem | null>(null);

  const canEdit = isSteward || isOwner;

  useEffect(() => {
    const fetchApprovedItems = async () => {
      if (!journeyId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('swor-file-upload', {
          body: {
            action: 'get_approved_items',
            payload: {
              journey_id: journeyId,
              viewer_user_id: viewerUserId,
              viewer_relationship: viewerRelationship,
              include_signed_urls: true
            }
          }
        });
        
        if (fnError) {
          console.error('Error fetching approved items:', fnError);
          setError('Failed to load content');
          return;
        }
        
        if (data?.success) {
          setItems(data.items_by_type || {
            images: [],
            documents: [],
            texts: [],
            links: []
          });
          setTotalCount(data.total_count || 0);
        } else {
          // No error, just no items - this is fine
          setItems({ images: [], documents: [], texts: [], links: [] });
          setTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching approved items:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApprovedItems();
  }, [journeyId, viewerUserId, viewerRelationship]);

  // Handle edit save
  const handleSaveItem = async (item: ApprovedItem, updates: Record<string, any>) => {
    const { data, error: fnError } = await supabase.functions.invoke('swor-file-upload', {
      body: {
        action: 'update_item_metadata',
        payload: {
          item_id: item.id,
          journey_id: item.journey_id,
          user_id: viewerUserId,
          is_steward: isSteward,
          updates
        }
      }
    });
    
    if (fnError) throw new Error(fnError.message);
    if (!data?.success) throw new Error(data?.detail || 'Update failed');
    
    // Update local state
    const updateItemInList = (list: ApprovedItem[]) =>
      list.map(i => i.id === item.id ? {
        ...i,
        content_json: { ...i.content_json, ...updates }
      } : i);
    
    setItems(prev => ({
      images: updateItemInList(prev.images),
      documents: updateItemInList(prev.documents),
      texts: updateItemInList(prev.texts),
      links: updateItemInList(prev.links),
    }));
  };

  // Handle delete
  const handleDeleteItem = async (item: ApprovedItem) => {
    if (!confirm(`Are you sure you want to delete "${item.content_json?.title || 'this item'}"? This cannot be undone.`)) return;
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('swor-file-upload', {
        body: {
          action: 'delete_item',
          payload: {
            item_id: item.id,
            journey_id: item.journey_id,
            user_id: viewerUserId,
            is_steward: isSteward
          }
        }
      });
      
      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.detail || 'Delete failed');
      
      // Remove from local state
      const removeFromList = (list: ApprovedItem[]) => list.filter(i => i.id !== item.id);
      
      setItems(prev => ({
        images: removeFromList(prev.images),
        documents: removeFromList(prev.documents),
        texts: removeFromList(prev.texts),
        links: removeFromList(prev.links),
      }));
      setTotalCount(prev => prev - 1);
      
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete item');
    }
  };

  // Don't render anything if no approved items and not a steward/owner
  if (!loading && totalCount === 0 && !canEdit) {
    return null;
  }

  if (loading) {
    return (
      <section className="swor-section">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#B8826D] animate-spin" />
          <span className="ml-3 text-[#1A2332]/60">Loading content...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="swor-section">
        <div className="bg-red-50 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Steward/Owner Toolbar */}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-[#8B9D83]/10 rounded-xl border border-[#8B9D83]/20">
          <div className="flex items-center text-sm text-[#1A2332]/70 mr-auto">
            <Shield className="w-4 h-4 mr-2 text-[#8B9D83]" />
            <span className="font-medium">
              {isSteward ? 'Steward' : 'Owner'} view
            </span>
            <span className="text-[#1A2332]/40 mx-2">|</span>
            <span className="text-[#1A2332]/50">{totalCount} item{totalCount !== 1 ? 's' : ''}</span>
          </div>
          
          {onNavigate && (
            <button
              onClick={() => onNavigate('build-profile')}
              className="inline-flex items-center px-4 py-2 bg-[#8B9D83] text-white rounded-lg text-sm font-medium hover:bg-[#8B9D83]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50 min-h-[40px]"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload & Manage Archive
            </button>
          )}
          
          <p className="w-full text-xs text-[#1A2332]/40 mt-1">
            Hover over any item below to see edit and delete controls. For bulk uploads and reordering, use the full archive manager.
          </p>
        </div>
      )}

      {/* Empty state for stewards/owners */}
      {canEdit && totalCount === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#1A2332]/10">
          <Image className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-3" />
          <p className="text-[#1A2332]/60 text-sm mb-2">No archive items yet</p>
          <p className="text-[#1A2332]/40 text-xs mb-4">
            Upload photos, documents, or other materials that tell this story.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate('build-profile')}
              className="inline-flex items-center px-4 py-2 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </button>
          )}
        </div>
      )}

      {/* Visual Archive / Moments - Images */}
      <ItemSection
        title="Visual Archive"
        icon={<Image className="w-5 h-5 text-[#B8826D]" />}
        items={items.images}
        renderItem={(item) => (
          <ImageItem 
            item={item} 
            canEdit={canEdit} 
            onEdit={setEditingItem} 
            onDelete={handleDeleteItem} 
          />
        )}
        gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      />
      
      {/* Documents & Records */}
      <ItemSection
        title="Documents & Records"
        icon={<FileText className="w-5 h-5 text-[#8B9D83]" />}
        items={items.documents}
        renderItem={(item) => (
          <DocumentItem 
            item={item} 
            canEdit={canEdit} 
            onEdit={setEditingItem} 
            onDelete={handleDeleteItem} 
          />
        )}
        gridCols="grid-cols-1 md:grid-cols-2"
      />
      
      {/* Narrative / Context - Text */}
      <ItemSection
        title="Narrative & Context"
        icon={<Type className="w-5 h-5 text-[#1A2332]/70" />}
        items={items.texts}
        renderItem={(item) => (
          <TextItem 
            item={item} 
            canEdit={canEdit} 
            onEdit={setEditingItem} 
            onDelete={handleDeleteItem} 
          />
        )}
        gridCols="grid-cols-1"
      />
      
      {/* Sources & References - Links */}
      <ItemSection
        title="Sources & References"
        icon={<Link2 className="w-5 h-5 text-[#1A2332]/50" />}
        items={items.links}
        renderItem={(item) => (
          <LinkItem 
            item={item} 
            canEdit={canEdit} 
            onEdit={setEditingItem} 
            onDelete={handleDeleteItem} 
          />
        )}
        gridCols="grid-cols-1 md:grid-cols-2"
      />
      
      {/* Attribution footer */}
      {totalCount > 0 && (
        <div className="pt-6 border-t border-[#1A2332]/10">
          <p className="text-xs text-[#1A2332]/40 text-center">
            All content displayed with attribution. Rights and permissions verified before publication.
            <br />
            No drafts, rejected items, or internal notes are visible to the public.
          </p>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
};

export default ApprovedItemsSection;

