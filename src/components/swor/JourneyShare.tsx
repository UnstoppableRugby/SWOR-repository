import React, { useState } from 'react';
import { Link2, Mail, Share2, Check, X, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JourneyShareProps {
  journeyTitle: string;
  journeyUrl?: string;
  journeyDescription?: string;
  variant?: 'inline' | 'footer' | 'section';
}

const JourneyShare: React.FC<JourneyShareProps> = ({ 
  journeyTitle, 
  journeyUrl = window.location.href,
  journeyDescription,
  variant = 'inline'
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [customMessage, setCustomMessage] = useState(
    journeyDescription || `This is a Rugby Journey shared on Small World of Rugby, a space for preserving how the game has shaped lives and communities.`
  );

  // Check if native share is available (primarily mobile)
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(journeyUrl);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Could not copy",
        description: "Please copy the URL from your browser's address bar.",
        variant: "destructive"
      });
    }
  };

  const handleNativeShare = async () => {
    if (!hasNativeShare) return;
    
    try {
      await navigator.share({
        title: `${journeyTitle} — Rugby Journey (SWOR)`,
        text: customMessage,
        url: journeyUrl
      });
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Rugby Journey: ${journeyTitle}`);
    const body = encodeURIComponent(`${customMessage}\n\n${journeyUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${customMessage}\n\n${journeyUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(journeyUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(journeyUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${journeyTitle} — A Rugby Journey on Small World of Rugby`);
    const url = encodeURIComponent(journeyUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  // WhatsApp icon SVG
  const WhatsAppIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  // LinkedIn icon SVG
  const LinkedInIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );

  // Facebook icon SVG
  const FacebookIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  // X/Twitter icon SVG
  const TwitterIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  // New "section" variant for dedicated share sections on detail pages
  if (variant === 'section') {
    return (
      <div className="bg-white rounded-xl border border-[#1A2332]/10 p-5 sm:p-6">
        <h3 className="font-serif text-lg text-[#1A2332] mb-2">Share this Journey</h3>
        <p className="text-sm text-[#1A2332]/60 mb-4 leading-relaxed">
          Share this profile with someone who would value it.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Copy Link - Always Primary */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A2332] text-white rounded-lg font-medium hover:bg-[#1A2332]/90 transition-colors min-h-[44px]"
          >
            {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          {/* Native Share - Mobile Primary */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B8826D] text-white rounded-lg font-medium hover:bg-[#B8826D]/90 transition-colors min-h-[44px]"
            >
              <Smartphone className="w-4 h-4" />
              Share
            </button>
          )}
        </div>

        {/* Secondary Platform Icons */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#1A2332]/10">
          <span className="text-xs text-[#1A2332]/50 mr-2">Or share via:</span>
          
          <button
            onClick={handleWhatsAppShare}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1A2332]/10 text-[#1A2332]/60 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 transition-colors"
            title="WhatsApp"
          >
            <WhatsAppIcon />
          </button>
          
          <button
            onClick={handleLinkedInShare}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1A2332]/10 text-[#1A2332]/60 hover:bg-[#0077B5]/10 hover:text-[#0077B5] hover:border-[#0077B5]/30 transition-colors"
            title="LinkedIn"
          >
            <LinkedInIcon />
          </button>
          
          <button
            onClick={handleFacebookShare}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1A2332]/10 text-[#1A2332]/60 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30 transition-colors"
            title="Facebook"
          >
            <FacebookIcon />
          </button>
          
          <button
            onClick={handleTwitterShare}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1A2332]/10 text-[#1A2332]/60 hover:bg-black/10 hover:text-black hover:border-black/30 transition-colors"
            title="X (Twitter)"
          >
            <TwitterIcon />
          </button>
          
          <button
            onClick={handleEmailShare}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1A2332]/10 text-[#1A2332]/60 hover:bg-[#B8826D]/10 hover:text-[#B8826D] hover:border-[#B8826D]/30 transition-colors"
            title="Email"
          >
            <Mail className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Reassurance */}
        <p className="text-xs text-[#1A2332]/40 mt-4 leading-relaxed">
          Only public information is shown when shared. There are no share counts or metrics.
        </p>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className="border-t border-[#1A2332]/10 pt-8 mt-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-[#1A2332] mb-1">Share this Rugby Journey</h3>
            <p className="text-sm text-[#1A2332]/60">
              Share this profile with someone who would value it.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="swor-share-button"
              title="Copy link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
            </button>
            
            {/* Native Share (Mobile) */}
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className="swor-share-button bg-[#B8826D] text-white hover:bg-[#B8826D]/90"
                title="Share"
              >
                <Smartphone className="w-5 h-5" />
              </button>
            )}
            
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="swor-share-button"
              title="Share via WhatsApp"
            >
              <WhatsAppIcon />
            </button>
            
            {/* More options */}
            <button
              onClick={() => setShowModal(true)}
              className="swor-share-button"
              title="More sharing options"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Privacy notice */}
        <p className="text-xs text-[#1A2332]/40 mt-4">
          Only public information is shown when shared. There are no share counts or metrics.
        </p>

        {/* Share Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl text-[#1A2332]">Share this Journey</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#1A2332]/40 hover:text-[#1A2332] min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-sm text-[#1A2332]/60 mb-4">
                You can also send it by WhatsApp or email.
              </p>

              <div className="mb-6">
                <label className="swor-label-text">Share message (editable)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="swor-textarea"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#1A2332]/20 hover:bg-[#F5F1E8] transition-colors min-h-[48px]"
                >
                  {copied ? <Check className="w-5 h-5 text-[#8B9D83]" /> : <Link2 className="w-5 h-5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                
                <button
                  onClick={handleEmailShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#1A2332]/20 hover:bg-[#F5F1E8] transition-colors min-h-[48px]"
                >
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </button>
                
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#1A2332]/20 hover:bg-[#25D366]/10 transition-colors min-h-[48px]"
                >
                  <WhatsAppIcon />
                  <span>WhatsApp</span>
                </button>
                
                <button
                  onClick={handleLinkedInShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#1A2332]/20 hover:bg-[#0077B5]/10 transition-colors min-h-[48px]"
                >
                  <LinkedInIcon />
                  <span>LinkedIn</span>
                </button>
                
                <button
                  onClick={handleFacebookShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#1A2332]/20 hover:bg-[#1877F2]/10 transition-colors min-h-[48px]"
                >
                  <FacebookIcon />
                  <span>Facebook</span>
                </button>
                
                <button
                  onClick={handleTwitterShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#1A2332]/20 hover:bg-black/5 transition-colors min-h-[48px]"
                >
                  <TwitterIcon />
                  <span>X</span>
                </button>
              </div>

              {/* Privacy Reassurance */}
              <p className="text-xs text-[#1A2332]/40 mt-4 text-center">
                Only public information is shown when shared.
              </p>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-6 swor-btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#1A2332]/60 mr-2">Share:</span>
      
      <button
        onClick={handleCopyLink}
        className="swor-share-button w-10 h-10"
        title="Copy link"
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
      
      {hasNativeShare && (
        <button
          onClick={handleNativeShare}
          className="swor-share-button w-10 h-10"
          title="Share"
        >
          <Smartphone className="w-4 h-4" />
        </button>
      )}
      
      <button
        onClick={handleEmailShare}
        className="swor-share-button w-10 h-10"
        title="Share via email"
      >
        <Mail className="w-4 h-4" />
      </button>
      
      <button
        onClick={handleWhatsAppShare}
        className="swor-share-button w-10 h-10"
        title="Share via WhatsApp"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>
    </div>
  );
};

export default JourneyShare;
