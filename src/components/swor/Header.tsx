import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, User, Wrench, Search, Settings, Bell, WifiOff, BookOpen } from 'lucide-react';

import { useAppContext } from '@/contexts/AppContext';
import AuthModal from './AuthModal';
import GlobalSearchModal from './GlobalSearchModal';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, setDemoUser, isGlobalSteward, globalStewardInfo } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [journeysOpen, setJourneysOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);



  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuOpen && !(e.target as HTMLElement).closest('.account-menu-container')) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [accountMenuOpen]);

  // Handle auth changes from AuthModal
  const handleAuthChange = (newUser: any) => {
    // If it's a demo user, update the AppContext
    if (newUser?.isDemo) {
      setDemoUser(newUser);
    } else if (newUser === null) {
      // User logged out - clear AppContext
      setDemoUser(null);
    }
    // For Supabase users, the AppContext will handle it automatically
  };

  // Handle navigation from search
  const handleSearchNavigate = (page: string) => {
    onNavigate(page);
    setSearchModalOpen(false);
  };


  // Rugby Journeys dropdown items
  const journeyItems = [
    { id: 'journeys', label: 'Your Rugby Journey', description: 'Individual journeys' },
    { id: 'clubs', label: 'Our Rugby Journey', description: 'Clubs & communities' },
    { id: 'moments', label: 'The Journey of...', description: 'Events & moments' },
    { id: 'people', label: 'People of the Game', description: 'Memory keepers & stewards' },
    { id: 'search', label: 'Search All', description: 'Find across all journeys' },
  ];

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'rugby-journeys', label: 'Rugby Journeys', hasDropdown: true },
    { id: 'moments', label: 'Moments & History' },
    { id: 'organisations', label: 'Organisations' },
    { id: 'how-it-works', label: 'How SWOR Works' },
    { id: 'beyond-rugby', label: 'Beyond Rugby' },
  ];

  return (
    <>

      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#1A2332] shadow-lg"
        style={{
          // Respect iOS safe area for notched devices
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="bg-[#B8826D] text-[#F5F1E8] text-xs sm:text-sm py-1.5 px-4 text-center flex items-center justify-center">
            <WifiOff className="w-3.5 h-3.5 mr-2 flex-shrink-0" aria-hidden="true" />
            <span>You're offline. Some features may be limited.</span>
          </div>
        )}
        
        {/* Header container with consistent height */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center group flex-shrink-0 min-h-[44px]"
              aria-label="Go to homepage"
            >
              <img 
                src="https://d64gsuwffb70l.cloudfront.net/69315c4fbe1af1b811cab03b_1769759763025_dd250cae.png" 
                alt="Small World of Rugby" 
                className="h-10 md:h-12 w-auto"
              />
            </button>


            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {navItems.map((item) => (
                <div key={item.id} className="relative">
                  {item.hasDropdown ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setJourneysOpen(true)}
                      onMouseLeave={() => setJourneysOpen(false)}
                    >
                      <button
                        className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                          ['journeys', 'clubs', 'people', 'moments'].includes(currentPage)
                            ? 'text-[#B8826D]'
                            : 'text-[#F5F1E8]/80 hover:text-[#F5F1E8]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {journeysOpen && (
                        <div className="absolute top-full left-0 pt-2">
                          <div className="bg-[#1A2332] rounded-lg shadow-xl border border-[#F5F1E8]/10 py-2 min-w-[260px]">
                            {journeyItems.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={() => {
                                  onNavigate(subItem.id);
                                  setJourneysOpen(false);
                                }}
                                className={`block w-full text-left px-4 py-3 transition-colors ${
                                  currentPage === subItem.id
                                    ? 'text-[#B8826D] bg-[#F5F1E8]/5'
                                    : 'text-[#F5F1E8]/80 hover:text-[#F5F1E8] hover:bg-[#F5F1E8]/5'
                                }`}
                              >
                                <span className="block text-sm font-medium">{subItem.label}</span>
                                <span className="block text-xs text-[#F5F1E8]/50 mt-0.5">{subItem.description}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`text-sm font-medium transition-colors ${
                        currentPage === item.id
                          ? 'text-[#B8826D]'
                          : 'text-[#F5F1E8]/80 hover:text-[#F5F1E8]'
                      }`}
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop Right-side Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Global Search Button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#F5F1E8]/10 hover:bg-[#F5F1E8]/20 transition-colors group"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-[#F5F1E8]/70 group-hover:text-[#F5F1E8]" />
                <span className="text-sm text-[#F5F1E8]/50 hidden xl:inline">Search</span>
                <kbd className="hidden xl:inline text-xs text-[#F5F1E8]/30 bg-[#F5F1E8]/10 px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Global Steward Indicator */}
              {isGlobalSteward && (
                <span className="flex items-center text-xs text-[#B8826D] bg-[#B8826D]/10 px-2 py-1 rounded">
                  <Wrench className="w-3 h-3 mr-1" />
                  Builder
                </span>
              )}
              
              {/* Account Menu (when logged in) or Sign In button */}
              {user ? (
                <div className="relative account-menu-container">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-[#F5F1E8] bg-[#F5F1E8]/10 hover:bg-[#F5F1E8]/20 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Account</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {accountMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 bg-[#1A2332] rounded-lg shadow-xl border border-[#F5F1E8]/10 py-2 min-w-[200px]">
                      <div className="px-4 py-2 border-b border-[#F5F1E8]/10">
                        <p className="text-xs text-[#F5F1E8]/50">Signed in as</p>
                        <p className="text-sm text-[#F5F1E8] truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('my-journeys');
                          setAccountMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${
                          currentPage === 'my-journeys'
                            ? 'text-[#B8826D] bg-[#F5F1E8]/5'
                            : 'text-[#F5F1E8]/80 hover:text-[#F5F1E8] hover:bg-[#F5F1E8]/5'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        My Journeys
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('settings');
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-[#F5F1E8]/80 hover:text-[#F5F1E8] hover:bg-[#F5F1E8]/5 transition-colors"
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Notification Settings
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('settings');
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-[#F5F1E8]/80 hover:text-[#F5F1E8] hover:bg-[#F5F1E8]/5 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </button>

                      <div className="border-t border-[#F5F1E8]/10 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setAuthModalOpen(true);
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-[#F5F1E8]/60 hover:text-[#F5F1E8] hover:bg-[#F5F1E8]/5 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-[#F5F1E8] bg-[#B8826D] hover:bg-[#B8826D]/90 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>


            {/* Mobile: Search + Menu Buttons */}
            <div className="flex lg:hidden items-center space-x-1">
              {/* Mobile Search Button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-3 text-[#F5F1E8] hover:bg-[#F5F1E8]/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 text-[#F5F1E8] hover:bg-[#F5F1E8]/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Full screen overlay for better UX */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden bg-[#1A2332] border-t border-[#F5F1E8]/10 overflow-y-auto"
            style={{
              maxHeight: 'calc(100vh - 4rem - env(safe-area-inset-top, 0px))',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <div key={item.id}>
                  {item.hasDropdown ? (
                    <div className="space-y-1">
                      <span className="block px-3 py-2 text-[#F5F1E8]/60 text-sm font-medium">
                        {item.label}
                      </span>
                      <div className="pl-3 space-y-1">
                        {journeyItems.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              onNavigate(subItem.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`block w-full text-left px-3 py-3 rounded-lg text-sm min-h-[48px] transition-colors ${
                              currentPage === subItem.id
                                ? 'bg-[#B8826D]/20 text-[#B8826D]'
                                : 'text-[#F5F1E8]/80 hover:bg-[#F5F1E8]/5 hover:text-[#F5F1E8]'
                            }`}
                          >
                            <span className="block font-medium">{subItem.label}</span>
                            <span className="block text-xs text-[#F5F1E8]/50 mt-0.5">{subItem.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-3 rounded-lg text-sm font-medium min-h-[48px] transition-colors ${
                        currentPage === item.id
                          ? 'bg-[#B8826D]/20 text-[#B8826D]'
                          : 'text-[#F5F1E8]/80 hover:bg-[#F5F1E8]/5 hover:text-[#F5F1E8]'
                      }`}
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
              
              {/* Divider */}
              <div className="pt-4 mt-2 border-t border-[#F5F1E8]/10 space-y-2">
                {/* Global Steward Indicator - Mobile */}
                {isGlobalSteward && (
                  <div className="px-3 py-2">
                    <span className="inline-flex items-center text-xs text-[#B8826D] bg-[#B8826D]/10 px-2 py-1 rounded">
                      <Wrench className="w-3 h-3 mr-1" />
                      Builder Access
                    </span>
                  </div>
                )}
                
                {/* Account options for mobile */}
                {user ? (
                  <>
                    <div className="px-3 py-2 text-xs text-[#F5F1E8]/50">
                      Signed in as {user.email}
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('my-journeys');
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium min-h-[48px] transition-colors ${
                        currentPage === 'my-journeys'
                          ? 'bg-[#B8826D]/20 text-[#B8826D]'
                          : 'text-[#F5F1E8]/80 hover:bg-[#F5F1E8]/5 hover:text-[#F5F1E8]'
                      }`}
                    >
                      <BookOpen className="w-5 h-5 mr-3" />
                      <span>My Journeys</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full px-3 py-3 rounded-lg text-[#F5F1E8]/80 hover:bg-[#F5F1E8]/5 hover:text-[#F5F1E8] text-sm font-medium min-h-[48px] transition-colors"
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full px-3 py-3 rounded-lg text-[#F5F1E8]/60 hover:bg-[#F5F1E8]/5 hover:text-[#F5F1E8] text-sm min-h-[48px] transition-colors"
                    >
                      <User className="w-5 h-5 mr-3" />
                      <span>Sign Out</span>
                    </button>
                  </>

                ) : (
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-3 rounded-lg text-[#F5F1E8]/80 hover:bg-[#F5F1E8]/5 hover:text-[#F5F1E8] text-sm font-medium min-h-[48px] transition-colors"
                  >
                    <User className="w-5 h-5 mr-3" />
                    <span>Sign In</span>
                  </button>
                )}
                
                {/* Primary CTA */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onNavigate('contribute');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-4 bg-[#B8826D] text-[#F5F1E8] text-sm font-medium rounded-lg text-center min-h-[52px] hover:bg-[#B8826D]/90 transition-colors"
                  >
                    Contribute Your Journey
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthChange={handleAuthChange}
        onNavigate={onNavigate}
      />


      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </>
  );
};

export default Header;
