import React from 'react';
import { ExternalLink, Bell, BookOpen, HelpCircle, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const footerSections = [
    {
      title: 'Rugby Journeys',
      links: [
        { label: 'Your Rugby Journey', page: 'journeys' },
        { label: 'Our Rugby Journey', page: 'clubs' },
        { label: 'The Journey of...', page: 'moments' },
        { label: 'People of the Game', page: 'people' },
        { label: 'Search All', page: 'search' },
      ],
    },
    {
      title: 'Explore',
      links: [
        { label: 'Moments & History', page: 'moments' },
        { label: 'Clubs & Communities', page: 'clubs' },
        { label: 'Organisations', page: 'organisations' },
        { label: 'Beyond Rugby', page: 'beyond-rugby' },
      ],
    },
    {
      title: 'About SWOR',
      links: [
        { label: 'How Rugby Journeys Work', page: 'how-it-works' },
        { label: 'The Redwoods Project', page: 'redwoods' },
        { label: 'Unstoppable Rugby', page: 'unstoppable' },
        { label: 'Partners', page: 'partners' },
      ],
    },
    {
      title: 'Get Involved',
      links: [
        { label: 'Contribute Your Journey', page: 'contribute' },
        { label: 'Build Your Profile', page: 'profile-builder', icon: 'book' },
        { label: 'Help Guides', page: 'help', icon: 'help' },
        { label: 'Contact Us', page: 'contact', icon: 'mail' },
        { label: 'Settings', page: 'settings', icon: 'bell' },
      ],
    },
    {
      title: 'Legal & Governance',
      links: [
        { label: 'Privacy Policy', page: 'privacy' },
        { label: 'Terms of Use', page: 'terms' },
        { label: 'Code of Conduct', page: 'conduct' },
        { label: 'Contact', page: 'contact' },
      ],
    },
  ];

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'bell': return <Bell className="w-3 h-3 mr-1.5 flex-shrink-0" />;
      case 'book': return <BookOpen className="w-3 h-3 mr-1.5 flex-shrink-0" />;
      case 'help': return <HelpCircle className="w-3 h-3 mr-1.5 flex-shrink-0" />;
      case 'mail': return <Mail className="w-3 h-3 mr-1.5 flex-shrink-0" />;
      default: return null;
    }
  };

  return (
    <footer className="bg-[#1A2332] text-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Read the Full Explainer - Prominent Link */}
        <div className="mb-10 sm:mb-12 pb-6 sm:pb-8 border-b border-[#F5F1E8]/10">
          <button
            onClick={() => onNavigate('how-it-works')}
            className="flex items-center text-[#B8826D] hover:text-[#B8826D]/80 transition-colors group min-h-[44px]"
          >
            <ExternalLink className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-base sm:text-lg font-medium">How Rugby Journeys Work on SWOR</span>
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Main Footer Content — PATCH v6B.3: Consistent column alignment */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-8 gap-x-6 lg:gap-x-6">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <button
              onClick={() => onNavigate('home')}
              className="mb-4 sm:mb-6 min-h-[44px] flex items-center"
            >
              <img 
                src="https://d64gsuwffb70l.cloudfront.net/69315c4fbe1af1b811cab03b_1769760056703_cbf8ced1.png" 
                alt="Small World of Rugby" 
                className="h-10 sm:h-12 w-auto"
              />
            </button>

            <p className="text-[#F5F1E8]/60 text-sm leading-relaxed mb-4 sm:mb-6 max-w-xs">
              A for-good digital spine designed to hold journeys, preserve context and honour contribution across generations.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <a
                href="#"
                className="text-[#F5F1E8]/40 hover:text-[#F5F1E8]/80 transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-[#F5F1E8]/40 hover:text-[#F5F1E8]/80 transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-[#F5F1E8]/40 hover:text-[#F5F1E8]/80 transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-[#F5F1E8]/40 hover:text-[#F5F1E8]/80 transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Columns — PATCH v6B.3: min-h-[44px] tap targets on mobile */}
          {footerSections.map((section) => (
            <div key={section.title} className="text-left">
              <h4 className="font-medium text-sm text-[#F5F1E8] mb-3 sm:mb-4 text-left">{section.title}</h4>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.page + link.label} className="text-left">
                    <button
                      onClick={() => onNavigate(link.page)}
                      className="text-sm text-[#F5F1E8]/60 hover:text-[#F5F1E8] transition-colors flex items-center min-h-[44px] sm:min-h-[36px] text-left py-1"
                    >
                      {getIcon((link as any).icon)}
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* For-Good Digital Spine Statement */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-[#F5F1E8]/10">
          <div className="bg-[#F5F1E8]/5 rounded-xl p-4 sm:p-6 text-center">
            <p className="text-[#F5F1E8]/70 text-sm leading-relaxed max-w-3xl mx-auto">
              SWOR is not a platform for attention. It is a <span className="text-[#B8826D] font-medium">for-good digital spine</span> designed 
              to hold journeys, preserve context and honour contribution, collectively and across generations.
            </p>
          </div>
        </div>

        {/* Governance Principle */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-[#F5F1E8]/40 text-xs italic leading-relaxed">
            SWOR Rugby Journeys are the sole canonical public versions. All enrichment occurs on SWOR.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#F5F1E8]/10">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <p className="text-sm text-[#F5F1E8]/40 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Small World of Rugby. All rights reserved.
            </p>
            <p className="text-sm text-[#F5F1E8]/40 italic font-serif text-center sm:text-right">
              "This has always existed. We just finally built it properly."
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

