import React from 'react';
import { MapPin, Calendar, Building2, Users, Award, ArrowLeft, Flag, Star } from 'lucide-react';

interface JourneyIdentityHeaderProps {
  type: 'person' | 'club' | 'moment' | 'organisation';
  name: string;
  country: string;
  countryCode?: string;
  era?: string;
  subtitle?: string;
  roles?: string[];
  heroImage?: string;
  featuredImage?: string;
  logo?: string;
  onBack: () => void;
  backLabel?: string;
  children?: React.ReactNode;
}

// Country code to flag emoji mapping (subset)
const countryFlags: Record<string, string> = {
  'South Africa': 'ZA',
  'New Zealand': 'NZ',
  'Australia': 'AU',
  'England': 'GB-ENG',
  'Wales': 'GB-WLS',
  'Scotland': 'GB-SCT',
  'Ireland': 'IE',
  'France': 'FR',
  'Argentina': 'AR',
  'Japan': 'JP',
  'Fiji': 'FJ',
  'Samoa': 'WS',
  'Tonga': 'TO',
  'Italy': 'IT',
  'USA': 'US',
  'Canada': 'CA',
  'Georgia': 'GE',
  'Romania': 'RO',
  'Uruguay': 'UY',
  'Namibia': 'NA',
  'Kenya': 'KE',
  'Zimbabwe': 'ZW',
  'Hong Kong': 'HK',
  'Singapore': 'SG',
  'Spain': 'ES',
  'Portugal': 'PT',
  'Germany': 'DE',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Russia': 'RU',
  'Chile': 'CL',
  'Brazil': 'BR',
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'person': return 'Your Rugby Journey';
    case 'club': return 'Our Rugby Journey';
    case 'moment': return 'The Journey of...';
    case 'organisation': return 'Organisation';
    default: return 'Rugby Journey';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'person': return <Users className="w-4 h-4" />;
    case 'club': return <Building2 className="w-4 h-4" />;
    case 'moment': return <Calendar className="w-4 h-4" />;
    case 'organisation': return <Building2 className="w-4 h-4" />;
    default: return <Users className="w-4 h-4" />;
  }
};

const JourneyIdentityHeader: React.FC<JourneyIdentityHeaderProps> = ({
  type,
  name,
  country,
  countryCode,
  era,
  subtitle,
  roles,
  heroImage,
  featuredImage,
  logo,
  onBack,
  backLabel = 'Back',
  children,
}) => {
  const flagCode = countryCode || countryFlags[country];
  
  // Use featured image if available, otherwise fall back to hero image
  const displayImage = featuredImage || heroImage;

  return (
    <div className="relative">
      {/* Hero Image or Placeholder */}
      {displayImage ? (
        <div className="relative h-48 sm:h-64 md:h-80">
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover"
          />
          {/* Soft overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A2332]/80 via-[#1A2332]/40 to-transparent" />
          
          {/* Featured image indicator */}
          {featuredImage && (
            <div className="absolute top-4 right-4 flex items-center px-2.5 py-1.5 bg-[#B8826D]/90 text-white text-xs font-medium rounded-lg backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 mr-1.5 fill-current" aria-hidden="true" />
              Featured Image
            </div>
          )}
          
          {/* Logo badge (if provided) */}
          {logo && (
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-xl shadow-lg p-2 flex items-center justify-center">
                <img
                  src={logo}
                  alt={`${name} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 sm:h-40 bg-gradient-to-br from-[#1A2332] to-[#2a3342]">
          {/* Logo centered if no hero image */}
          {logo && (
            <div className="h-full flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl shadow-lg p-3 flex items-center justify-center">
                <img
                  src={logo}
                  alt={`${name} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className={`bg-gradient-to-b from-[#F5F1E8] to-white ${displayImage ? 'pt-6' : 'pt-8'} pb-8 border-b border-[#1A2332]/10`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] mb-4 sm:mb-6 min-h-[44px] -ml-1 px-1 focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 rounded"
          >
            <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
            <span className="text-sm">{backLabel}</span>
          </button>

          {/* Type Label */}
          <div className="flex items-center mb-3">
            <span className="text-[#B8826D] text-xs sm:text-sm font-medium tracking-widest uppercase flex items-center">
              {getTypeIcon(type)}
              <span className="ml-2">{getTypeLabel(type)}</span>
            </span>
          </div>

          {/* Name */}
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1A2332] mb-4 leading-tight">
            {name}
          </h1>

          {/* Subtitle if provided */}
          {subtitle && (
            <p className="text-[#1A2332]/70 text-base sm:text-lg mb-4 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            {/* Country with flag */}
            <span className="inline-flex items-center px-3 sm:px-4 py-2 bg-[#8B9D83]/10 text-[#8B9D83] text-sm font-medium rounded-lg">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
              {flagCode && (
                <img
                  src={`https://flagcdn.com/24x18/${flagCode.toLowerCase()}.png`}
                  alt={country}
                  className="w-5 h-auto mr-2 rounded-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              {country}
            </span>

            {/* Era/Year */}
            {era && (
              <span className="inline-flex items-center px-3 sm:px-4 py-2 bg-[#B8826D]/10 text-[#B8826D] text-sm font-medium rounded-lg">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                {era}
              </span>
            )}
          </div>

          {/* Roles */}
          {roles && roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {roles.map((role, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-[#1A2332]/10 text-[#1A2332]/70 text-sm rounded-lg"
                >
                  <Award className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" aria-hidden="true" />
                  {role}
                </span>
              ))}
            </div>
          )}

          {/* Additional children (e.g., steward buttons) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default JourneyIdentityHeader;
