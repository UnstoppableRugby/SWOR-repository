import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit3,
  Eye,
  Settings,
  UserPlus,
  Clock,
  FileText,
  Users,
  Globe,
  Loader2,
  AlertCircle,
  ChevronDown,
  Trash2,
  MoreVertical,
  X,
  Check,
  MapPin,
  Calendar,
  Filter,
  LayoutGrid,
  List,
  Archive,
  RefreshCw,
  Inbox,
  Shield,
  User
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useMyJourneys, UserJourney } from '@/hooks/useMyJourneys';
import { rugbyJourneys, clubs } from '@/data/sworData';

interface MyJourneysPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const MyJourneysPage: React.FC<MyJourneysPageProps> = ({ onBack, onNavigate }) => {
  const { user, profile, isGlobalSteward } = useAppContext();
  const { journeys, loading, saving, error, fetchJourneys, createJourney, updateJourney, deleteJourney, clearError } = useMyJourneys();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'steward' | 'contributor'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);

  // Create journey form state
  const [newJourneyName, setNewJourneyName] = useState('');
  const [newJourneyType, setNewJourneyType] = useState<'individual' | 'collective' | 'event'>('individual');
  const [newJourneyDescription, setNewJourneyDescription] = useState('');
  const [newJourneyCountry, setNewJourneyCountry] = useState('');
  const [newJourneyEra, setNewJourneyEra] = useState('');

  // Invite form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Fetch journeys on mount
  useEffect(() => {
    if (user?.id) {
      fetchJourneys(user.id, user.email);
    }
  }, [user?.id, user?.email, fetchJourneys]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (activeMenu && !(e.target as HTMLElement).closest('.journey-menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeMenu]);

  // Combine DB journeys with exemplar journeys for global stewards
  const allJourneys = useMemo(() => {
    const dbJourneys = journeys || [];

    // For global stewards, also show exemplar journeys they steward
    if (isGlobalSteward) {
      const existingJourneyIds = new Set(dbJourneys.map(j => j.journey_id));
      const exemplarJourneys: UserJourney[] = [];

      // Add exemplar individual journeys
      for (const rj of rugbyJourneys.filter(j => j.isFoundational)) {
        if (!existingJourneyIds.has(rj.id)) {
          exemplarJourneys.push({
            id: `exemplar-${rj.id}`,
            user_id: user?.id || '',
            user_email: user?.email || '',
            user_name: profile?.full_name || null,
            journey_id: rj.id,
            journey_name: rj.name,
            journey_type: rj.journeyType as 'individual' | 'collective' | 'event',
            role: 'steward',
            status: 'published',
            cover_image: rj.image,
            description: rj.summary,
            country: rj.country,
            era: rj.era,
            last_edited_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stats: {
              pending_contributions: 0,
              total_contributions: 0,
              approved_contributions: 0,
              draft_contributions: 0
            }
          });
        }
      }

      // Add exemplar club journeys
      for (const club of clubs.filter(c => c.isFoundational)) {
        if (!existingJourneyIds.has(club.id)) {
          exemplarJourneys.push({
            id: `exemplar-${club.id}`,
            user_id: user?.id || '',
            user_email: user?.email || '',
            user_name: profile?.full_name || null,
            journey_id: club.id,
            journey_name: club.name,
            journey_type: 'collective',
            role: 'steward',
            status: 'published',
            cover_image: club.image,
            description: club.summary,
            country: club.country,
            era: `Est. ${club.founded}`,
            last_edited_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stats: {
              pending_contributions: 0,
              total_contributions: 0,
              approved_contributions: 0,
              draft_contributions: 0
            }
          });
        }
      }

      return [...dbJourneys, ...exemplarJourneys];
    }

    return dbJourneys;
  }, [journeys, isGlobalSteward, user, profile]);

  // Filtered journeys
  const filteredJourneys = useMemo(() => {
    let result = allJourneys;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.journey_name.toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q) ||
        (j.country || '').toLowerCase().includes(q)
      );
    }

    if (filterRole !== 'all') {
      result = result.filter(j => j.role === filterRole);
    }

    if (filterStatus !== 'all') {
      result = result.filter(j => j.status === filterStatus);
    }

    return result;
  }, [allJourneys, searchQuery, filterRole, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const owned = allJourneys.filter(j => j.role === 'owner').length;
    const stewarded = allJourneys.filter(j => j.role === 'steward').length;
    const drafts = allJourneys.filter(j => j.status === 'draft').length;
    const published = allJourneys.filter(j => j.status === 'published').length;
    const totalPending = allJourneys.reduce((sum, j) => sum + (j.stats?.pending_contributions || 0), 0);
    return { owned, stewarded, drafts, published, totalPending };
  }, [allJourneys]);

  // Handlers
  const handleCreateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newJourneyName.trim()) return;

    const journeyId = newJourneyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await createJourney({
      user_id: user.id,
      user_email: user.email || '',
      user_name: profile?.full_name || user.user_metadata?.full_name || '',
      journey_id: journeyId,
      journey_name: newJourneyName.trim(),
      journey_type: newJourneyType,
      role: 'owner',
      status: 'draft',
      description: newJourneyDescription.trim() || undefined,
      country: newJourneyCountry.trim() || undefined,
      era: newJourneyEra.trim() || undefined
    });

    if (result) {
      setShowCreateModal(false);
      setNewJourneyName('');
      setNewJourneyType('individual');
      setNewJourneyDescription('');
      setNewJourneyCountry('');
      setNewJourneyEra('');
    }
  };

  const handleDeleteJourney = async (id: string) => {
    const success = await deleteJourney(id);
    if (success) {
      setShowDeleteConfirm(null);
    }
  };

  const handlePublishToggle = async (journey: UserJourney) => {
    const newStatus = journey.status === 'published' ? 'draft' : 'published';
    await updateJourney(journey.id, { status: newStatus } as any);
    setActiveMenu(null);
  };

  const handleArchive = async (journey: UserJourney) => {
    await updateJourney(journey.id, { status: 'archived' } as any);
    setActiveMenu(null);
  };

  const handleViewJourney = (journey: UserJourney) => {
    onNavigate(`journey-${journey.journey_id}`);
  };

  const handleEditJourney = (journey: UserJourney) => {
    // Navigate to the journey page which has edit mode
    onNavigate(`journey-${journey.journey_id}`);
  };

  const handleSettingsJourney = (journey: UserJourney) => {
    // Navigate to the journey page which has settings
    onNavigate(`journey-${journey.journey_id}`);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteRelationship.trim()) return;

    setInviteSending(true);
    // Simulate sending invitation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setInviteSending(false);
    setInviteSuccess(`Invitation sent to ${inviteName}`);
    setInviteName('');
    setInviteEmail('');
    setInviteRelationship('');
    setTimeout(() => {
      setInviteSuccess('');
      setShowInviteModal(null);
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-[#8B9D83]/15 text-[#8B9D83] border-[#8B9D83]/30';
      case 'draft': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'archived': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <User className="w-3.5 h-3.5" />;
      case 'steward': return <Shield className="w-3.5 h-3.5" />;
      case 'contributor': return <UserPlus className="w-3.5 h-3.5" />;
      default: return <User className="w-3.5 h-3.5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-[#B8826D]';
      case 'steward': return 'text-[#1A2332]';
      case 'contributor': return 'text-[#8B9D83]';
      default: return 'text-[#1A2332]/60';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'individual': return 'Your Rugby Journey';
      case 'collective': return 'Our Rugby Journey';
      case 'event': return 'The Journey of...';
      default: return 'Journey';
    }
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] pt-20 md:pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1A2332]/10 flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-[#1A2332]/40" />
          </div>
          <h1 className="font-serif text-3xl text-[#1A2332] mb-4">Sign in to view your journeys</h1>
          <p className="text-[#1A2332]/60 mb-8 max-w-md mx-auto">
            Access your Rugby Journeys dashboard to manage, edit, and share your stories.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 transition-colors font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-16 md:pt-20">
      {/* Header Section */}
      <div className="bg-[#1A2332] text-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Breadcrumb */}
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-sm text-[#F5F1E8]/60 hover:text-[#F5F1E8] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-[#F5F1E8] mb-2">
                My Journeys
              </h1>
              <p className="text-[#F5F1E8]/60 text-sm md:text-base">
                Manage and build your Rugby Journeys from one place.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 transition-colors font-medium text-sm self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Journey</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
            <div className="bg-[#F5F1E8]/10 rounded-lg px-4 py-3">
              <p className="text-2xl font-semibold text-[#F5F1E8]">{allJourneys.length}</p>
              <p className="text-xs text-[#F5F1E8]/50">Total Journeys</p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-lg px-4 py-3">
              <p className="text-2xl font-semibold text-[#B8826D]">{stats.owned}</p>
              <p className="text-xs text-[#F5F1E8]/50">Owned</p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-lg px-4 py-3">
              <p className="text-2xl font-semibold text-[#F5F1E8]">{stats.stewarded}</p>
              <p className="text-xs text-[#F5F1E8]/50">Stewarding</p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-lg px-4 py-3">
              <p className="text-2xl font-semibold text-amber-400">{stats.drafts}</p>
              <p className="text-xs text-[#F5F1E8]/50">Drafts</p>
            </div>
            <div className="bg-[#F5F1E8]/10 rounded-lg px-4 py-3 col-span-2 sm:col-span-1">
              <p className="text-2xl font-semibold text-[#F5F1E8]">
                {stats.totalPending > 0 ? (
                  <span className="text-[#B8826D]">{stats.totalPending}</span>
                ) : (
                  '0'
                )}
              </p>
              <p className="text-xs text-[#F5F1E8]/50">Pending Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journeys..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#1A2332]/15 rounded-lg text-sm focus:outline-none focus:border-[#B8826D] focus:ring-1 focus:ring-[#B8826D]/20 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-[#1A2332]/40" />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 bg-white border border-[#1A2332]/15 rounded-lg text-sm focus:outline-none focus:border-[#B8826D] cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="steward">Steward</option>
              <option value="contributor">Contributor</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-white border border-[#1A2332]/15 rounded-lg text-sm focus:outline-none focus:border-[#B8826D] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-[#1A2332]/15 rounded-lg overflow-hidden ml-auto sm:ml-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#1A2332] text-white' : 'text-[#1A2332]/40 hover:text-[#1A2332]'}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#1A2332] text-white' : 'text-[#1A2332]/40 hover:text-[#1A2332]'}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => user?.id && fetchJourneys(user.id, user.email)}
              disabled={loading}
              className="p-2 text-[#1A2332]/40 hover:text-[#1A2332] transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={clearError} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && journeys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#B8826D] animate-spin mb-4" />
            <p className="text-sm text-[#1A2332]/60">Loading your journeys...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJourneys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#1A2332]/5 flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-[#1A2332]/20" />
            </div>
            {allJourneys.length === 0 ? (
              <>
                <h2 className="font-serif text-2xl text-[#1A2332] mb-3">Start your first journey</h2>
                <p className="text-[#1A2332]/60 mb-8 max-w-md">
                  Every rugby story deserves to be preserved. Create your first journey to begin documenting your connection to the game.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Journey</span>
                </button>
              </>
            ) : (
              <>
                <h2 className="font-serif text-2xl text-[#1A2332] mb-3">No matching journeys</h2>
                <p className="text-[#1A2332]/60 mb-6">
                  Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterRole('all'); setFilterStatus('all'); }}
                  className="text-sm text-[#B8826D] hover:text-[#B8826D]/80 font-medium"
                >
                  Clear all filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Journey Cards - Grid View */}
        {!loading && filteredJourneys.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredJourneys.map((journey) => (
              <div
                key={journey.id}
                className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden hover:shadow-lg hover:border-[#1A2332]/20 transition-all group"
              >
                {/* Cover Image */}
                <div className="relative h-36 bg-gradient-to-br from-[#1A2332] to-[#1A2332]/80 overflow-hidden">
                  {journey.cover_image ? (
                    <img
                      src={journey.cover_image}
                      alt={journey.journey_name}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Globe className="w-12 h-12 text-[#F5F1E8]/20" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(journey.status)}`}>
                      {journey.status === 'published' && <Globe className="w-3 h-3 mr-1" />}
                      {journey.status === 'draft' && <FileText className="w-3 h-3 mr-1" />}
                      {journey.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                      {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                    </span>
                  </div>

                  {/* Pending Badge */}
                  {(journey.stats?.pending_contributions || 0) > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#B8826D] text-white">
                        {journey.stats?.pending_contributions} pending
                      </span>
                    </div>
                  )}

                  {/* Role Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm ${getRoleColor(journey.role)}`}>
                      {getRoleIcon(journey.role)}
                      <span className="capitalize">{journey.role}</span>
                    </span>
                  </div>

                  {/* Menu Button */}
                  <div className="absolute bottom-3 right-3 journey-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === journey.id ? null : journey.id);
                      }}
                      className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[#1A2332]/60 hover:text-[#1A2332] transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenu === journey.id && (
                      <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-xl border border-[#1A2332]/10 py-1 min-w-[180px] z-10">
                        {journey.role === 'owner' && (
                          <>
                            <button
                              onClick={() => { handlePublishToggle(journey); }}
                              className="w-full flex items-center px-3 py-2 text-sm text-[#1A2332]/80 hover:bg-[#F5F1E8] transition-colors"
                            >
                              {journey.status === 'published' ? (
                                <><FileText className="w-4 h-4 mr-2" /> Unpublish</>
                              ) : (
                                <><Globe className="w-4 h-4 mr-2" /> Publish</>
                              )}
                            </button>
                            <button
                              onClick={() => { handleArchive(journey); setActiveMenu(null); }}
                              className="w-full flex items-center px-3 py-2 text-sm text-[#1A2332]/80 hover:bg-[#F5F1E8] transition-colors"
                            >
                              <Archive className="w-4 h-4 mr-2" /> Archive
                            </button>
                            <div className="border-t border-[#1A2332]/10 my-1" />
                            <button
                              onClick={() => { setShowDeleteConfirm(journey.id); setActiveMenu(null); }}
                              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </button>
                          </>
                        )}
                        {journey.role !== 'owner' && (
                          <button
                            onClick={() => setActiveMenu(null)}
                            className="w-full flex items-center px-3 py-2 text-sm text-[#1A2332]/60"
                          >
                            <Shield className="w-4 h-4 mr-2" /> {journey.role === 'steward' ? 'Stewarding' : 'Contributing'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <p className="text-xs text-[#1A2332]/40 mb-1">{getTypeLabel(journey.journey_type)}</p>
                  <h3 className="font-serif text-lg text-[#1A2332] mb-1 line-clamp-1">{journey.journey_name}</h3>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-[#1A2332]/50 mb-3">
                    {journey.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {journey.country}
                      </span>
                    )}
                    {journey.era && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {journey.era}
                      </span>
                    )}
                  </div>

                  {journey.description && (
                    <p className="text-sm text-[#1A2332]/60 line-clamp-2 mb-3">{journey.description}</p>
                  )}

                  {/* Contribution Stats */}
                  <div className="flex items-center gap-3 text-xs text-[#1A2332]/40 mb-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {journey.stats?.total_contributions || 0} contributions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(journey.last_edited_at)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleEditJourney(journey)}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[#1A2332]/60 hover:text-[#B8826D] hover:bg-[#B8826D]/5 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => handleViewJourney(journey)}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[#1A2332]/60 hover:text-[#8B9D83] hover:bg-[#8B9D83]/5 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-[10px] font-medium">View</span>
                    </button>
                    <button
                      onClick={() => handleSettingsJourney(journey)}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[#1A2332]/60 hover:text-[#1A2332] hover:bg-[#1A2332]/5 transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Settings</span>
                    </button>
                    <button
                      onClick={() => setShowInviteModal(journey.id)}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[#1A2332]/60 hover:text-[#B8826D] hover:bg-[#B8826D]/5 transition-colors relative"
                      title="Invite Contributors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Invite</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Journey Cards - List View */}
        {!loading && filteredJourneys.length > 0 && viewMode === 'list' && (
          <div className="space-y-3">
            {filteredJourneys.map((journey) => (
              <div
                key={journey.id}
                className="bg-white rounded-lg border border-[#1A2332]/10 hover:shadow-md hover:border-[#1A2332]/20 transition-all overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#1A2332] to-[#1A2332]/80 overflow-hidden flex-shrink-0">
                    {journey.cover_image ? (
                      <img src={journey.cover_image} alt="" className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Globe className="w-6 h-6 text-[#F5F1E8]/20" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-serif text-base text-[#1A2332] truncate">{journey.journey_name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(journey.status)}`}>
                        {journey.status}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${getRoleColor(journey.role)}`}>
                        {getRoleIcon(journey.role)}
                        <span className="capitalize">{journey.role}</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#1A2332]/40">
                      {getTypeLabel(journey.journey_type)}
                      {journey.country && ` · ${journey.country}`}
                      {journey.era && ` · ${journey.era}`}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#1A2332]/40">
                      <span>{journey.stats?.total_contributions || 0} contributions</span>
                      {(journey.stats?.pending_contributions || 0) > 0 && (
                        <span className="text-[#B8826D] font-medium">{journey.stats?.pending_contributions} pending</span>
                      )}
                      <span>Edited {formatDate(journey.last_edited_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditJourney(journey)}
                      className="p-2 rounded-lg text-[#1A2332]/40 hover:text-[#B8826D] hover:bg-[#B8826D]/5 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewJourney(journey)}
                      className="p-2 rounded-lg text-[#1A2332]/40 hover:text-[#8B9D83] hover:bg-[#8B9D83]/5 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSettingsJourney(journey)}
                      className="p-2 rounded-lg text-[#1A2332]/40 hover:text-[#1A2332] hover:bg-[#1A2332]/5 transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowInviteModal(journey.id)}
                      className="p-2 rounded-lg text-[#1A2332]/40 hover:text-[#B8826D] hover:bg-[#B8826D]/5 transition-colors"
                      title="Invite Contributors"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredJourneys.length > 0 && (
          <p className="text-xs text-[#1A2332]/40 mt-6 text-center">
            Showing {filteredJourneys.length} of {allJourneys.length} journeys
          </p>
        )}
      </div>

      {/* Create Journey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1A2332]/10">
              <h2 className="font-serif text-xl text-[#1A2332]">Create New Journey</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[#1A2332]/40 hover:text-[#1A2332] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJourney} className="p-5 space-y-5">
              {/* Journey Type */}
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-2">Journey Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'individual', label: 'Individual', desc: 'Your Rugby Journey', icon: User },
                    { value: 'collective', label: 'Collective', desc: 'Our Rugby Journey', icon: Users },
                    { value: 'event', label: 'Event', desc: 'The Journey of...', icon: Calendar },
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewJourneyType(value as any)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        newJourneyType === value
                          ? 'border-[#B8826D] bg-[#B8826D]/5'
                          : 'border-[#1A2332]/15 hover:border-[#1A2332]/30'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${newJourneyType === value ? 'text-[#B8826D]' : 'text-[#1A2332]/40'}`} />
                      <p className="text-sm font-medium text-[#1A2332]">{label}</p>
                      <p className="text-[10px] text-[#1A2332]/50">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Journey Name */}
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">
                  Journey Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newJourneyName}
                  onChange={(e) => setNewJourneyName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D] focus:ring-1 focus:ring-[#B8826D]/20"
                  placeholder={newJourneyType === 'individual' ? 'e.g., John Smith' : newJourneyType === 'collective' ? 'e.g., Richmond RFC' : 'e.g., The 1995 World Cup Final'}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#1A2332] mb-1">Description</label>
                <textarea
                  value={newJourneyDescription}
                  onChange={(e) => setNewJourneyDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg text-sm resize-none focus:outline-none focus:border-[#B8826D] focus:ring-1 focus:ring-[#B8826D]/20"
                  placeholder="A brief description of this journey..."
                />
              </div>

              {/* Country & Era */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A2332] mb-1">Country</label>
                  <input
                    type="text"
                    value={newJourneyCountry}
                    onChange={(e) => setNewJourneyCountry(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D] focus:ring-1 focus:ring-[#B8826D]/20"
                    placeholder="e.g., England"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2332] mb-1">Era / Period</label>
                  <input
                    type="text"
                    value={newJourneyEra}
                    onChange={(e) => setNewJourneyEra(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D] focus:ring-1 focus:ring-[#B8826D]/20"
                    placeholder="e.g., 1990-2010"
                  />
                </div>
              </div>

              {/* Governance Note */}
              <div className="bg-[#1A2332]/5 rounded-lg p-3">
                <p className="text-xs text-[#1A2332]/60 leading-relaxed">
                  Your journey will start as a private draft. You can add content, invite contributors, and publish when you're ready. All contributions are reviewed before inclusion.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#1A2332]/5 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newJourneyName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Create Journey</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-[#1A2332]">Delete Journey</h3>
                <p className="text-sm text-[#1A2332]/60">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-[#1A2332]/70 mb-6">
              Are you sure you want to delete this journey? All associated contributions and data will be permanently removed.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#1A2332]/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJourney(showDeleteConfirm)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Contributors Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#1A2332]/10">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-5 h-5 text-[#B8826D]" />
                <h2 className="font-serif text-lg text-[#1A2332]">Invite Contributors</h2>
              </div>
              <button
                onClick={() => { setShowInviteModal(null); setInviteSuccess(''); }}
                className="p-1 text-[#1A2332]/40 hover:text-[#1A2332] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#8B9D83]/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-[#8B9D83]" />
                </div>
                <p className="text-sm text-[#1A2332]/70">{inviteSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="p-5 space-y-4">
                <div className="bg-[#1A2332]/5 rounded-lg p-3">
                  <p className="text-xs text-[#1A2332]/60 leading-relaxed">
                    Invite someone to contribute to this journey. All contributions are reviewed before inclusion. No anonymous input is accepted.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1A2332]/70 mb-1">
                    Their name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1A2332]/70 mb-1">
                    Their email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1A2332]/70 mb-1">
                    Role or relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteRelationship}
                    onChange={(e) => setInviteRelationship(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                    placeholder="e.g., Former teammate, Club historian"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(null)}
                    className="flex-1 py-2.5 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#1A2332]/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSending || !inviteName.trim() || !inviteRelationship.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {inviteSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>Send Invite</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyJourneysPage;
