import { useEffect } from 'react';

// Default SWOR share image
const DEFAULT_SHARE_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/697bbbb902db916cb6f0972b_1770303901255_8d992d28.jpg';

interface ShareMetaProps {
  type: 'person' | 'moment' | 'club' | 'organisation';
  title: string;
  description?: string;
  imageUrl?: string;
  canonicalUrl?: string;
}

/**
 * ShareMeta Component
 * 
 * Manages Open Graph and Twitter meta tags for rich social media previews.
 * Updates document head dynamically when the component mounts.
 * 
 * Note: For full crawler support, these tags should ideally be server-rendered.
 * This client-side implementation works for direct shares but may not be picked
 * up by all social media crawlers.
 */
const ShareMeta: React.FC<ShareMetaProps> = ({
  type,
  title,
  description,
  imageUrl,
  canonicalUrl
}) => {
  useEffect(() => {
    // Format title based on type
    const formattedTitle = type === 'person' 
      ? `${title} — Rugby Journey (SWOR)`
      : type === 'moment'
      ? `${title} — Moments (SWOR)`
      : type === 'club'
      ? `${title} — Club (SWOR)`
      : `${title} — Organisation (SWOR)`;

    // Safe fallback description
    const safeDescription = description && description.length > 10
      ? description.slice(0, 160) + (description.length > 160 ? '...' : '')
      : 'A rugby journey preserved on Small World of Rugby — the living digital foundation connecting people, stories, and history of the game.';

    // Use provided image or default
    const shareImage = imageUrl || DEFAULT_SHARE_IMAGE;

    // Get canonical URL
    const url = canonicalUrl || window.location.href;

    // OG type based on content type
    const ogType = type === 'person' ? 'profile' : 'article';

    // Helper to update or create meta tag
    const setMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update document title
    const originalTitle = document.title;
    document.title = formattedTitle;

    // Set Open Graph tags
    setMetaTag('og:title', formattedTitle);
    setMetaTag('og:description', safeDescription);
    setMetaTag('og:url', url);
    setMetaTag('og:type', ogType);
    setMetaTag('og:image', shareImage);
    setMetaTag('og:site_name', 'Small World of Rugby');

    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image', true);
    setMetaTag('twitter:title', formattedTitle, true);
    setMetaTag('twitter:description', safeDescription, true);
    setMetaTag('twitter:image', shareImage, true);

    // Cleanup on unmount - restore original values
    return () => {
      document.title = originalTitle;
      // Reset to default meta tags
      setMetaTag('og:title', 'SWOR - Small World of Rugby');
      setMetaTag('og:description', 'The living digital foundation of world rugby – preserving people, stories and history, and connecting them responsibly for the future of the game.');
      setMetaTag('og:type', 'website');
      setMetaTag('og:image', DEFAULT_SHARE_IMAGE);
    };
  }, [type, title, description, imageUrl, canonicalUrl]);

  // This component doesn't render anything
  return null;
};

export default ShareMeta;
export { DEFAULT_SHARE_IMAGE };
