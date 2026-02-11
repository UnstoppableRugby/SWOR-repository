import React, { useState, useEffect } from 'react';
import Header from './swor/Header';
import Footer from './swor/Footer';
import HomePage from './swor/HomePage';
import RugbyJourneysPage from './swor/pages/RugbyJourneysPage';
import LegendsPage from './swor/pages/LegendsPage';
import LegendDetailPage from './swor/pages/LegendDetailPage';
import SueDorringtonPage from './swor/pages/SueDorringtonPage';
import HarryRobertsPage from './swor/pages/HarryRobertsPage';
import VillagersPage from './swor/pages/VillagersPage';
import ClubsPage from './swor/pages/ClubsPage';
import ClubDetailPage from './swor/pages/ClubDetailPage';
import MomentsPage from './swor/pages/MomentsPage';
import MomentDetailPage from './swor/pages/MomentDetailPage';
import PeoplePage from './swor/pages/PeoplePage';
import PersonDetailPage from './swor/pages/PersonDetailPage';
import RedwoodsPage from './swor/pages/RedwoodsPage';
import HowItWorksPage from './swor/pages/HowItWorksPage';
import PartnersPage from './swor/pages/PartnersPage';
import UnstoppablePage from './swor/pages/UnstoppablePage';
import ContributePage from './swor/pages/ContributePage';
import BeyondRugbyPage from './swor/pages/BeyondRugbyPage';
import OrganisationsPage from './swor/pages/OrganisationsPage';
import SearchPage from './swor/pages/SearchPage';
import SettingsPage from './swor/pages/SettingsPage';
import IndividualProfileBuilder from './swor/pages/IndividualProfileBuilder';
import HelpGuidesPage from './swor/pages/HelpGuidesPage';
import ContactPage from './swor/pages/ContactPage';
import StewardOpsHub from './swor/pages/StewardOpsHub';
import PrivacyPage from './swor/pages/PrivacyPage';
import TermsPage from './swor/pages/TermsPage';
import ConductPage from './swor/pages/ConductPage';
import MyJourneysPage from './swor/pages/MyJourneysPage';
import GoLiveChecklistPage from './swor/pages/GoLiveChecklistPage';
import EmailStatusPage from './swor/pages/EmailStatusPage';


const AppLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');

  // PATCH v6B.3: Scroll to top and focus invisible anchor on EVERY page change.
  // This prevents the hero headline (or any h1) from receiving focus and showing
  // a visible outline ("block around words" issue).
  useEffect(() => {
    // Instant scroll to top (not animated to avoid disorientation)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
    // Always focus the invisible page-start anchor for screen reader context.
    // Small delay to ensure DOM is updated after render.
    const focusTimer = setTimeout(() => {
      const anchor = document.getElementById('page-top-focus');
      if (anchor) {
        anchor.focus({ preventScroll: true });
      }
    }, 50);
    
    return () => clearTimeout(focusTimer);
  }, [currentPage]);




  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };


  const renderPage = () => {
    // Handle Sue Dorrington's special page (CANONICAL - SWOR is sole canonical public version)
    // Legacy page retained as private provenance artefact only - not linked, indexed, or surfaced
    if (currentPage === 'legend-detail-sue-dorrington' || currentPage === 'journey-sue-dorrington') {
      return (
        <SueDorringtonPage
          onBack={() => handleNavigate('journeys')}
          onNavigate={handleNavigate}
        />
      );
    }

    // Handle Harry Roberts' page (CREATED DIRECTLY ON SWOR - Phase 3 Activated)
    // Exemplar living connector journey - no migration required
    if (currentPage === 'legend-detail-harry-roberts' || currentPage === 'journey-harry-roberts') {
      return (
        <HarryRobertsPage
          onBack={() => handleNavigate('journeys')}
          onNavigate={handleNavigate}
        />
      );
    }

    // Handle Villagers Rugby Club page (Phase 1 Collective Journey - Phase 3 Activated)
    if (currentPage === 'club-villagers-rfc' || currentPage === 'journey-villagers-rfc' || currentPage === 'villagers') {
      return (
        <VillagersPage
          onBack={() => handleNavigate('clubs')}
          onNavigate={handleNavigate}
        />
      );
    }

    // Handle other legend/journey detail pages
    if (currentPage.startsWith('legend-detail-') || currentPage.startsWith('journey-')) {
      const legendId = currentPage.replace('legend-detail-', '').replace('journey-', '');
      return (
        <LegendDetailPage
          legendId={legendId}
          onBack={() => handleNavigate('journeys')}
          onNavigate={handleNavigate}
        />
      );
    }

    // Handle club detail pages - REAL DETAIL PAGES (NO COMING SOON)
    if (currentPage.startsWith('club-')) {
      const clubId = currentPage.replace('club-', '');
      // Check for special club pages first
      if (clubId === 'villagers-rfc') {
        return (
          <VillagersPage
            onBack={() => handleNavigate('clubs')}
            onNavigate={handleNavigate}
          />
        );
      }
      return (
        <ClubDetailPage
          clubId={currentPage}
          onBack={() => handleNavigate('clubs')}
          onNavigate={handleNavigate}
        />
      );
    }

    // Handle moment detail pages - REAL DETAIL PAGES (NO COMING SOON)
    if (currentPage.startsWith('moment-')) {
      return (
        <MomentDetailPage
          momentId={currentPage}
          onBack={() => handleNavigate('moments')}
          onNavigate={handleNavigate}
        />
      );
    }

    // Handle person detail pages - REAL DETAIL PAGES (NO COMING SOON)
    if (currentPage.startsWith('person-')) {
      return (
        <PersonDetailPage
          personId={currentPage}
          onBack={() => handleNavigate('people')}
          onNavigate={handleNavigate}
        />
      );
    }


    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      // Rugby Journeys (new primary navigation)
      case 'journeys':
        return (
          <RugbyJourneysPage 
            onSelectJourney={(id) => handleNavigate(`journey-${id}`)}
            onNavigate={handleNavigate}
          />
        );
      // Legacy route for backwards compatibility
      case 'legends':
        return <LegendsPage onSelectLegend={(id) => handleNavigate(`legend-detail-${id}`)} onNavigate={handleNavigate} />;
      case 'clubs':
        return <ClubsPage onSelectClub={(id) => handleNavigate(`club-${id}`)} onNavigate={handleNavigate} />;
      case 'moments':
        return <MomentsPage onSelectMoment={(id) => handleNavigate(`moment-${id}`)} onNavigate={handleNavigate} />;
      case 'people':
        return <PeoplePage onSelectPerson={(id) => handleNavigate(`person-${id}`)} onNavigate={handleNavigate} />;

      case 'organisations':
        return <OrganisationsPage onNavigate={handleNavigate} />;
      case 'redwoods':
        return <RedwoodsPage onJoin={() => handleNavigate('contribute')} onNavigate={handleNavigate} />;
      case 'how-it-works':
        return (
          <HowItWorksPage
            onExplore={() => handleNavigate('journeys')}
            onJoinUnstoppable={() => handleNavigate('unstoppable')}
            onNavigate={handleNavigate}
          />
        );
      case 'partners':
        return <PartnersPage onContact={() => handleNavigate('contact')} />;
      case 'unstoppable':
        return <UnstoppablePage onJoin={() => handleNavigate('contribute')} />;
      case 'join':
      case 'contribute':
        return <ContributePage onNavigate={handleNavigate} />;
      case 'beyond-rugby':
        return <BeyondRugbyPage onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage onNavigate={handleNavigate} />;
      // Account Settings page
      case 'settings':
      case 'account-settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      // Individual Profile Builder (Patch A)
      case 'profile-builder':
      case 'build-profile':
        return (
          <IndividualProfileBuilder
            onBack={() => handleNavigate('journeys')}
            onNavigate={handleNavigate}
          />
        );
      // Help Guides (Private - logged in users only)
      case 'help':
      case 'help-guides':
      case 'guides':
        return (
          <HelpGuidesPage
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        );
      // Contact Page (Public)
      case 'contact':
        return (
          <ContactPage
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        );
      // Steward Operations Hub (Role-gated)
      case 'steward':
      case 'steward-dashboard':
      case 'stewards':
        return (
          <StewardOpsHub
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        );
      // Legal & Governance Pages
      case 'privacy':
        return (
          <PrivacyPage
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        );
      case 'terms':
        return (
          <TermsPage
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        );
      case 'conduct':
        return (
          <ConductPage
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        );
      // My Journeys Dashboard (logged-in users)
      case 'my-journeys':
        return (
          <MyJourneysPage
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        );
      // Go-Live Checklist (Steward-only, Patch v6B.3)
      case 'go-live':
      case 'stewards-go-live':
        return (
          <GoLiveChecklistPage
            onBack={() => handleNavigate('steward')}
            onNavigate={handleNavigate}
          />
        );
      // Email Status Page (Steward-only, Patch v6B.4)
      case 'email-status':
      case 'stewards-email-status':
        return (
          <EmailStatusPage
            onBack={() => handleNavigate('steward')}
            onNavigate={handleNavigate}
          />
        );


      default:

        // Static pages placeholder
        return (
          <div className="min-h-screen bg-[#F5F1E8] pt-24">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 py-24 text-center">
              <h1 className="font-serif text-4xl text-[#1A2332] mb-4 capitalize">
                {currentPage.replace(/-/g, ' ')}
              </h1>
              <p className="text-[#1A2332]/70 mb-8">
                This page is being developed. Thank you for your patience.
              </p>
              <button
                onClick={() => handleNavigate('home')}
                className="swor-btn-primary"
              >
                Return Home
              </button>
            </div>
          </div>
        );
    }
  };



  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Custom Fonts & SWOR Brand Tokens */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap');
        
        /* Typography Tokens */
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }

        /* SWOR Brand Color Tokens */
        :root {
          --swor-navy: #1A2332;
          --swor-bone: #F5F1E8;
          --swor-terracotta: #B8826D;
          --swor-sage: #8B9D83;
          /* Safe area insets for mobile */
          --safe-area-top: env(safe-area-inset-top, 0px);
          --safe-area-bottom: env(safe-area-inset-bottom, 0px);
          --safe-area-left: env(safe-area-inset-left, 0px);
          --safe-area-right: env(safe-area-inset-right, 0px);
          /* Header height tokens for consistent spacing */
          --header-height-mobile: 4rem;
          --header-height-desktop: 5rem;
        }

        /* Animation */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        /* Mobile-first typography improvements */
        @media (max-width: 640px) {
          h1, h2, h3 {
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          
          /* Prevent awkward line breaks */
          .font-serif {
            line-height: 1.3;
          }
        }

        /* Ensure content doesn't sit under status bar on iOS */
        @supports (padding-top: env(safe-area-inset-top)) {
          .safe-area-top {
            padding-top: env(safe-area-inset-top);
          }
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }

        /* PATCH v6B.3: Prevent visible focus ring on page-top anchor and headings
           that receive programmatic focus after navigation */
        #page-top-focus:focus,
        h1[tabindex="-1"]:focus,
        h2[tabindex="-1"]:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
      `}</style>



      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main>
        {/* PATCH v6B.3: Invisible focus anchor — receives focus on every page change.
            Never shows a visible outline. Prevents hero h1 from getting focus ring. */}
        <div 
          id="page-top-focus" 
          tabIndex={-1} 
          aria-hidden="true"
          className="sr-only"
          style={{ 
            position: 'absolute', 
            width: '1px', 
            height: '1px', 
            padding: 0, 
            margin: '-1px', 
            overflow: 'hidden', 
            clip: 'rect(0, 0, 0, 0)', 
            whiteSpace: 'nowrap', 
            border: 0,
            outline: 'none',
          }}
        />
        {renderPage()}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default AppLayout;
