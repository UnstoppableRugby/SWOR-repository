import React, { useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, User, Tag, Star } from 'lucide-react';

interface ArchiveItem {
  id: string;
  item_type: 'image' | 'document';
  title: string;
  description?: string;
  caption?: string;
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
  created_at?: string;
  tags?: string[];
  is_featured?: boolean;
}

interface ArchiveLightboxProps {
  isOpen: boolean;
  items: ArchiveItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onSetFeatured?: (itemId: string) => void;
  canSetFeatured?: boolean;
  featuredImageId?: string | null;
}

const ArchiveLightbox: React.FC<ArchiveLightboxProps> = ({
  isOpen,
  items,
  currentIndex,
  onClose,
  onNavigate,
  onSetFeatured,
  canSetFeatured = false,
  featuredImageId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const currentItem = items[currentIndex];
  const hasNext = currentIndex < items.length - 1;
  const hasPrev = currentIndex > 0;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (hasPrev) onNavigate(currentIndex - 1);
        break;
      case 'ArrowRight':
        if (hasNext) onNavigate(currentIndex + 1);
        break;
    }
  }, [onClose, onNavigate, currentIndex, hasNext, hasPrev]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when opening
    closeButtonRef.current?.focus();

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Focus trap within modal
  const handleTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    const focusableElements = containerRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen || !currentItem) return null;

  const isFeatured = featuredImageId === currentItem.id;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image lightbox: ${currentItem.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onKeyDown={handleTabKey}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close lightbox (Escape)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation - Previous */}
      {hasPrev && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Previous image (Left arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Navigation - Next */}
      {hasNext && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Next image (Right arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main content */}
      <div className="flex flex-col max-w-5xl max-h-[90vh] w-full mx-4">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <img
            src={currentItem.signed_url}
            alt={currentItem.title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        {/* Info panel */}
        <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h2 className="text-lg font-medium mb-1 truncate">{currentItem.title}</h2>
              
              {/* Caption/Description */}
              {(currentItem.caption || currentItem.description) && (
                <p className="text-white/80 text-sm mb-3 line-clamp-2">
                  {currentItem.caption || currentItem.description}
                </p>
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                {/* Date */}
                {currentItem.date_approximate && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    <span>{currentItem.date_approximate}</span>
                  </span>
                )}

                {/* Source/Attribution */}
                {currentItem.source_attribution && (
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    <span>{currentItem.source_attribution}</span>
                  </span>
                )}

                {/* Tags */}
                {currentItem.tags && currentItem.tags.length > 0 && (
                  <span className="flex items-center flex-wrap gap-1">
                    <Tag className="w-4 h-4 mr-1" aria-hidden="true" />
                    {currentItem.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/20 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </span>
                )}

                {/* Featured badge */}
                {isFeatured && (
                  <span className="flex items-center text-[#B8826D]">
                    <Star className="w-4 h-4 mr-1 fill-current" aria-hidden="true" />
                    <span>Featured Image</span>
                  </span>
                )}
              </div>
            </div>

            {/* Featured button */}
            {canSetFeatured && currentItem.status === 'approved' && (
              <button
                onClick={() => onSetFeatured?.(currentItem.id)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ${
                  isFeatured
                    ? 'bg-[#B8826D] text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                aria-pressed={isFeatured}
              >
                <Star className={`w-4 h-4 mr-1.5 ${isFeatured ? 'fill-current' : ''}`} />
                {isFeatured ? 'Featured' : 'Set as Featured'}
              </button>
            )}
          </div>

          {/* Counter */}
          <div className="mt-3 pt-3 border-t border-white/20 text-center text-sm text-white/60">
            {currentIndex + 1} of {items.length}
          </div>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        Viewing image {currentIndex + 1} of {items.length}: {currentItem.title}
      </div>
    </div>
  );
};

export default ArchiveLightbox;
