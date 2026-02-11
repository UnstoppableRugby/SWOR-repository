import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, Shield, Users, MessageSquare, FileText, Search, 
  Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw,
  Eye, ChevronRight, Home, BookOpen, Mail, Filter, User, MapPin,
  Calendar, Award, Quote, X, Activity, Globe, Download, UserPlus, Link2, CheckSquare, Square,
  ChevronDown, ChevronUp, History, BarChart3, Minus, RotateCcw
} from 'lucide-react';




import { supabase } from '@/lib/supabase';
import StewardQuickGuide from '../StewardQuickGuide';
import AuthEventsDashboard from '../AuthEventsDashboard';
import SafeResetPanel from '../SafeResetPanel';


// Canonical global steward emails (must match governance.ts + edge function)
const GLOBAL_STEWARD_EMAILS = [
  'alun@adesignbranding.co.za',
  'steward@swor.com',
  'admin@swor.com',
  'test@example.com'
];

interface StewardOpsHubProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'triaged' | 'closed';
  steward_note: string | null;
  assigned_to: string | null;
}

interface AuditEntry {
  id: string;
  created_at: string;
  action_type: string;
  actor_user_id: string | null;
  actor_email: string;
  scope_type: string;
  target_id: string | null;
  target_label: string | null;
  details_json: any;
}


interface PendingProfile {
  id: string;
  full_name: string | null;
  known_as: string | null;
  title: string | null;
  country: string | null;
  region: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  photo_signed_url: string | null;
  steward_note: string | null;
  steward_note_by: string | null;
}

interface PendingCommendation {
  id: string;
  profile_id: string;
  commender_name: string;
  commender_email: string | null;
  commender_profile_id: string | null;
  commender_profile_name?: string;
  relationship_context: string;
  when_context: string | null;
  why_it_mattered: string;
  commendation_text: string;
  status: string;
  created_at: string;
  recipient_name?: string;
  recipient_profile_id?: string;
  recipient_user_id?: string;
}

interface StewardAssignment {
  assignment_id: string;
  profile_id: string;
  profile_name: string;
  steward_email: string | null;
  steward_name: string | null;
  steward_user_id: string | null;
  steward_type: string;
  assigned_at: string;
  assigned_by: string | null;
  assigned_by_email: string | null;
  status: 'active' | 'inactive';
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_note: string | null;
}

interface WorkloadEntry {
  email: string;
  name: string;
  count: number;
}

type TabType = 'profiles' | 'commendations' | 'activity' | 'inbox' | 'actions' | 'auth_events' | 'steward_assignments' | 'safe_reset';



const StewardOpsHub: React.FC<StewardOpsHubProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSteward, setIsSteward] = useState(false);
  const [isGlobalSteward, setIsGlobalSteward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Steward');

  // Contact inbox state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'triaged' | 'closed'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [stewardNote, setStewardNote] = useState('');
  const [updatingMessage, setUpdatingMessage] = useState(false);

  // Profiles state
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState('');
  const [profileStatusFilter, setProfileStatusFilter] = useState<'submitted_for_review' | 'needs_changes' | 'all'>('submitted_for_review');
  const [profileCountryFilter, setProfileCountryFilter] = useState<string>('all');
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null);
  const [profileStewardNote, setProfileStewardNote] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileCounts, setProfileCounts] = useState({ pending: 0, approved: 0, needs_changes: 0 });

  // v6B.11: Bulk actions state
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBulkRequestChangesModal, setShowBulkRequestChangesModal] = useState(false);
  const [bulkRequestChangesNote, setBulkRequestChangesNote] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, completed: 0, failed: 0 });
  const [bulkResultSummary, setBulkResultSummary] = useState<{ show: boolean; decision: string; succeeded: number; failed: number; failedNames: string[] }>({ show: false, decision: '', succeeded: 0, failed: 0, failedNames: [] });


  // Commendations state
  const [commendations, setCommendations] = useState<PendingCommendation[]>([]);
  const [loadingCommendations, setLoadingCommendations] = useState(false);
  const [commendationsError, setCommendationsError] = useState('');
  const [commendationStatusFilter, setCommendationStatusFilter] = useState<'submitted_for_review' | 'approved' | 'rejected' | 'all'>('submitted_for_review');
  const [selectedCommendation, setSelectedCommendation] = useState<PendingCommendation | null>(null);
  const [commendationRejectionReason, setCommendationRejectionReason] = useState('');
  const [updatingCommendation, setUpdatingCommendation] = useState(false);
  const [commendationCounts, setCommendationCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Activity log state
  const [activityLog, setActivityLog] = useState<AuditEntry[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [activityScopeFilter, setActivityScopeFilter] = useState<string>('all');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityDateFrom, setActivityDateFrom] = useState('');
  const [activityDateTo, setActivityDateTo] = useState('');
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 50;


  // CSV export state (v6B.10: large export confirm + improved filename)
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [showExportConfirmModal, setShowExportConfirmModal] = useState(false);
  const [pendingExportTotal, setPendingExportTotal] = useState(0);

  // Steward Assignments state (v6B.9)
  const [assignments, setAssignments] = useState<StewardAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [workload, setWorkload] = useState<WorkloadEntry[]>([]);
  const [assignmentTotals, setAssignmentTotals] = useState({ total: 0, active: 0 });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProfileId, setAssignProfileId] = useState('');
  const [assignStewardEmail, setAssignStewardEmail] = useState('');
  const [assignStewardName, setAssignStewardName] = useState('');
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<StewardAssignment | null>(null);
  const [deactivateNote, setDeactivateNote] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateFeedback, setDeactivateFeedback] = useState('');

  // v6B.12: Review History state
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [loadingReviewHistory, setLoadingReviewHistory] = useState(false);
  const [showReviewHistory, setShowReviewHistory] = useState(false);

  // v6B.12: Profile Search Picker state (for assign modal)
  const [profileSearchInput, setProfileSearchInput] = useState('');
  const [profileSearchResults, setProfileSearchResults] = useState<any[]>([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [selectedAssignProfile, setSelectedAssignProfile] = useState<any>(null);
  const profileSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // v6B.12: Bulk Deactivate state
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<Set<string>>(new Set());
  const [showBulkDeactivateModal, setShowBulkDeactivateModal] = useState(false);
  const [bulkDeactivating, setBulkDeactivating] = useState(false);
  const [bulkDeactivateProgress, setBulkDeactivateProgress] = useState({ total: 0, completed: 0, failed: 0 });
  const [bulkDeactivateNote, setBulkDeactivateNote] = useState('');

  // v6B.12: Steward Activity Summary state
  const [activitySummary, setActivitySummary] = useState<any[]>([]);
  const [loadingActivitySummary, setLoadingActivitySummary] = useState(false);
  const [expandedStewardEmail, setExpandedStewardEmail] = useState<string | null>(null);


  // Check authentication and steward status
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const demoUserStr = localStorage.getItem('swor_demo_user');
        if (demoUserStr) {
          try {
            const demoUser = JSON.parse(demoUserStr);
            const stewardEmails = ['steward@swor.com', 'admin@swor.com', 'test@example.com'];
            const email = demoUser.email?.toLowerCase() || '';
            setIsAuthenticated(true);
            setIsSteward(stewardEmails.includes(email));
            setIsGlobalSteward(GLOBAL_STEWARD_EMAILS.includes(email));
            setUserId(demoUser.id || 'demo-user');
            setUserEmail(email);
            setUserName(demoUser.name || demoUser.email || 'Steward');
          } catch (e) { console.error('Failed to parse demo user:', e); }
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          const email = session.user.email?.toLowerCase() || '';
          setUserEmail(email);
          const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('user_id', session.user.id).single();
          const roleIsSteward = profile?.role === 'steward' || profile?.role === 'admin';
          setIsSteward(roleIsSteward);
          setIsGlobalSteward(roleIsSteward || GLOBAL_STEWARD_EMAILS.includes(email));
          setUserName(profile?.full_name || session.user.email || 'Steward');
        }
      } catch (err) { console.error('Auth check error:', err); }
      finally { setIsLoading(false); }
    };
    checkAuth();
  }, []);

  // Fetch contact messages
  const fetchMessages = useCallback(async () => {
    if (!isSteward) return;
    setLoadingMessages(true); setMessagesError('');
    try {
      const { data, error } = await supabase.functions.invoke('swor-contact', { body: { action: 'list_messages', status_filter: statusFilter, limit: 50, offset: 0 } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to load messages');
      setMessages(data.messages || []);
    } catch (err: any) { setMessagesError(err.message || 'Failed to load messages'); }
    finally { setLoadingMessages(false); }
  }, [isSteward, statusFilter]);

  // Fetch pending profiles
  const fetchProfiles = useCallback(async () => {
    if (!isSteward) return;
    setLoadingProfiles(true); setProfilesError('');
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', { body: { action: 'get_submitted_profiles', payload: { status_filter: profileStatusFilter, steward_user_id: userId } } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to load profiles');
      let filteredProfiles = data.profiles || [];
      if (profileCountryFilter !== 'all') filteredProfiles = filteredProfiles.filter((p: PendingProfile) => p.country?.toLowerCase() === profileCountryFilter.toLowerCase());
      if (profileSearchQuery.trim()) { const query = profileSearchQuery.toLowerCase(); filteredProfiles = filteredProfiles.filter((p: PendingProfile) => p.full_name?.toLowerCase().includes(query) || p.known_as?.toLowerCase().includes(query) || p.title?.toLowerCase().includes(query)); }
      setProfiles(filteredProfiles);
      setProfileCounts(data.counts || { pending: 0, approved: 0, needs_changes: 0 });
    } catch (err: any) { setProfilesError(err.message || 'Failed to load profiles'); }
    finally { setLoadingProfiles(false); }
  }, [isSteward, profileStatusFilter, profileCountryFilter, profileSearchQuery, userId]);

  // Fetch pending commendations
  const fetchCommendations = useCallback(async () => {
    if (!isSteward) return;
    setLoadingCommendations(true); setCommendationsError('');
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', { body: { action: 'get_pending_commendations', payload: { status_filter: commendationStatusFilter, steward_user_id: userId } } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to load commendations');
      setCommendations(data.commendations || []);
      setCommendationCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (err: any) { setCommendationsError(err.message || 'Failed to load commendations'); }
    finally { setLoadingCommendations(false); }
  }, [isSteward, commendationStatusFilter, userId]);

  // Fetch activity log
  const fetchActivityLog = useCallback(async (page = activityPage) => {
    if (!isSteward) return;
    setLoadingActivity(true); setActivityError('');
    try {
      const payloadObj: any = { limit: ACTIVITY_PAGE_SIZE, offset: page * ACTIVITY_PAGE_SIZE, action_type_filter: activityTypeFilter, search_query: activitySearchQuery.trim() || undefined };
      if (activityScopeFilter !== 'all') payloadObj.scope_type_filter = activityScopeFilter;
      if (activityDateFrom) payloadObj.date_from = new Date(activityDateFrom).toISOString();
      if (activityDateTo) { const endDate = new Date(activityDateTo); endDate.setHours(23, 59, 59, 999); payloadObj.date_to = endDate.toISOString(); }
      const { data, error } = await supabase.functions.invoke('swor-notifications', { body: { action: 'get_steward_audit_log', payload: payloadObj } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to load activity');
      setActivityLog(data.entries || []); setActivityTotal(data.total || 0);
    } catch (err: any) { setActivityError(err.message || 'Failed to load activity'); }
    finally { setLoadingActivity(false); }
  }, [isSteward, activityTypeFilter, activityScopeFilter, activitySearchQuery, activityDateFrom, activityDateTo, activityPage, ACTIVITY_PAGE_SIZE]);

  // Fetch steward assignments (v6B.9)
  const fetchAssignments = useCallback(async () => {
    if (!isGlobalSteward) return;
    setLoadingAssignments(true); setAssignmentsError('');
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: { action: 'list_steward_assignments', payload: { user_id: userId, user_email: userEmail, search: assignmentSearch.trim() || undefined, limit: 200, page: 1 } }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to load assignments');
      setAssignments(data.assignments || []);
      setWorkload(data.workload || []);
      setAssignmentTotals({ total: data.total || 0, active: data.active_count || 0 });
    } catch (err: any) { setAssignmentsError(err.message || 'Failed to load assignments'); }
    finally { setLoadingAssignments(false); }
  }, [isGlobalSteward, userId, userEmail, assignmentSearch]);

  // Create steward assignment (v6B.9)
  const handleCreateAssignment = async () => {
    if (!assignProfileId.trim() || !assignStewardEmail.trim()) { setAssignFeedback('Profile ID and steward email are required.'); return; }
    setCreatingAssignment(true); setAssignFeedback('');
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: { action: 'create_steward_assignment', payload: { user_id: userId, user_email: userEmail, profile_id: assignProfileId.trim(), steward_email: assignStewardEmail.trim(), steward_name: assignStewardName.trim() || undefined } }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || data?.error || 'Failed to create assignment');
      setAssignFeedback(`Assigned ${data.steward_email} to "${data.profile_name}"${data.has_existing_account ? '' : ' (invite pending)'}`);
      setAssignProfileId(''); setAssignStewardEmail(''); setAssignStewardName('');
      fetchAssignments();
      setTimeout(() => { setShowAssignModal(false); setAssignFeedback(''); }, 2000);
    } catch (err: any) { setAssignFeedback(err.message || 'Failed to create assignment'); }
    finally { setCreatingAssignment(false); }
  };

  // Deactivate steward assignment (v6B.9)
  const handleDeactivateAssignment = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true); setDeactivateFeedback('');
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: { action: 'deactivate_steward_assignment', payload: { user_id: userId, user_email: userEmail, assignment_id: deactivateTarget.assignment_id, note: deactivateNote.trim() || undefined } }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to deactivate');
      setShowDeactivateModal(false); setDeactivateTarget(null); setDeactivateNote('');
      fetchAssignments();
    } catch (err: any) {
      console.error('Deactivate error:', err);
      setDeactivateFeedback(err.message || 'Failed to deactivate assignment');
    }
    finally { setDeactivating(false); }
  };

  // v6B.12: Fetch review history for a profile
  const fetchReviewHistory = async (profileId: string) => {
    setLoadingReviewHistory(true);
    setReviewHistory([]);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: { action: 'get_profile_review_history', payload: { profile_id: profileId, user_id: userId, user_email: userEmail } }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to load history');
      setReviewHistory(data.entries || []);
    } catch (err: any) {
      console.error('Failed to load review history:', err);
      setReviewHistory([]);
    } finally {
      setLoadingReviewHistory(false);
    }
  };

  // v6B.12: Debounced profile search for assignment picker
  const searchProfilesForAssignment = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setProfileSearchResults([]);
      setSearchingProfiles(false);
      return;
    }
    setSearchingProfiles(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: { action: 'search_profiles_for_assignment', payload: { query: query.trim(), limit: 20, user_id: userId, user_email: userEmail } }
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        setProfileSearchResults(data.profiles || []);
      }
    } catch (err: any) {
      console.error('Profile search failed:', err);
      setProfileSearchResults([]);
    } finally {
      setSearchingProfiles(false);
    }
  };

  const handleProfileSearchInputChange = (value: string) => {
    setProfileSearchInput(value);
    setSelectedAssignProfile(null);
    setAssignProfileId('');
    if (profileSearchTimerRef.current) clearTimeout(profileSearchTimerRef.current);
    if (value.trim().length >= 2) {
      profileSearchTimerRef.current = setTimeout(() => {
        searchProfilesForAssignment(value);
      }, 350);
    } else {
      setProfileSearchResults([]);
    }
  };

  const selectProfileForAssignment = (profile: any) => {
    setSelectedAssignProfile(profile);
    setAssignProfileId(profile.profile_id);
    setProfileSearchInput('');
    setProfileSearchResults([]);
  };

  // v6B.12: Bulk deactivate assignments
  const executeBulkDeactivateAssignments = async () => {
    const ids = Array.from(selectedAssignmentIds);
    const total = ids.length;
    if (total === 0) return;

    setBulkDeactivating(true);
    setBulkDeactivateProgress({ total, completed: 0, failed: 0 });
    setShowBulkDeactivateModal(false);

    let completed = 0;
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      const assignmentId = ids[i];
      try {
        const { data, error } = await supabase.functions.invoke('swor-profile', {
          body: { action: 'deactivate_steward_assignment', payload: { user_id: userId, user_email: userEmail, assignment_id: assignmentId, note: bulkDeactivateNote.trim() || undefined } }
        });
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.detail || 'Failed');
        completed++;
        setSelectedAssignmentIds(prev => { const next = new Set(prev); next.delete(assignmentId); return next; });
      } catch (err) {
        failed++;
        console.error(`Failed to deactivate ${assignmentId}:`, err);
      }
      setBulkDeactivateProgress({ total, completed: completed + failed, failed });
    }

    setBulkDeactivating(false);
    setBulkDeactivateNote('');
    fetchAssignments();
  };

  // v6B.12: Fetch steward activity summary
  const fetchActivitySummary = async () => {
    setLoadingActivitySummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-notifications', {
        body: { action: 'get_steward_activity_summary', payload: { window_days: 30 } }
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        setActivitySummary(data.summary || []);
      }
    } catch (err: any) {
      console.error('Failed to load activity summary:', err);
    } finally {
      setLoadingActivitySummary(false);
    }
  };

  // v6B.12: Assignment selection helpers
  const toggleAssignmentSelection = (id: string) => {
    setSelectedAssignmentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllAssignments = (filteredAssignments: StewardAssignment[]) => {
    const activeIds = filteredAssignments.filter(a => a.is_active).map(a => a.assignment_id);
    if (activeIds.every(id => selectedAssignmentIds.has(id))) {
      setSelectedAssignmentIds(new Set());
    } else {
      setSelectedAssignmentIds(new Set(activeIds));
    }
  };

  const clearAssignmentSelection = () => setSelectedAssignmentIds(new Set());


  // CSV helpers (v6B.10: improved filename + large export confirm)
  const escapeCsvValue = (value: any): string => { if (value === null || value === undefined) return ''; const str = String(value); if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) return '"' + str.replace(/"/g, '""') + '"'; return str; };

  // v6B.10: Build descriptive export filename
  const buildExportFilename = (): string => {
    const today = new Date().toISOString().split('T')[0];
    let filename = `SWOR_Steward_Audit_${today}`;
    // Append date range if filters active
    if (activityDateFrom || activityDateTo) {
      const from = activityDateFrom || 'start';
      const to = activityDateTo || 'now';
      filename += `_from-${from}_to-${to}`;
    }
    // Append action/scope summary
    const actionPart = activityTypeFilter !== 'all' ? activityTypeFilter.replace(/\./g, '-') : 'all';
    const scopePart = activityScopeFilter !== 'all' ? activityScopeFilter : 'all';
    if (actionPart !== 'all' || scopePart !== 'all') {
      filename += `_${actionPart}_${scopePart}`;
    } else {
      filename += '_all';
    }
    return filename + '.csv';
  };

  // v6B.10: Build filters summary for audit details
  const buildFiltersApplied = (): Record<string, string> => {
    const filters: Record<string, string> = {};
    if (activityTypeFilter !== 'all') filters.action_type = activityTypeFilter;
    if (activityScopeFilter !== 'all') filters.scope_type = activityScopeFilter;
    if (activityDateFrom) filters.date_from = activityDateFrom;
    if (activityDateTo) filters.date_to = activityDateTo;
    if (activitySearchQuery.trim()) filters.search = activitySearchQuery.trim();
    return filters;
  };

  // v6B.10: Execute the actual CSV export (called directly or after large-export confirmation)
  const executeExport = async () => {
    setIsExporting(true); setExportMessage(''); setShowExportConfirmModal(false);
    try {
      const exportPayload: any = { limit: 1000, offset: 0, action_type_filter: activityTypeFilter, search_query: activitySearchQuery.trim() || undefined };
      if (activityScopeFilter !== 'all') exportPayload.scope_type_filter = activityScopeFilter;
      if (activityDateFrom) exportPayload.date_from = new Date(activityDateFrom).toISOString();
      if (activityDateTo) { const endDate = new Date(activityDateTo); endDate.setHours(23, 59, 59, 999); exportPayload.date_to = endDate.toISOString(); }
      const { data, error } = await supabase.functions.invoke('swor-notifications', { body: { action: 'get_steward_audit_log', payload: exportPayload } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to fetch entries');
      const entries: AuditEntry[] = data.entries || [];
      if (entries.length === 0) { setExportMessage('No entries match the current filters.'); return; }
      if ((data.total || 0) > 1000) setExportMessage(`Export limited to first 1,000 of ${(data.total || 0).toLocaleString()} results.`);
      const headers = ['timestamp', 'action_type', 'scope_type', 'actor_email', 'target_label', 'details'];
      const csvRows: string[] = [headers.join(',')];
      for (const entry of entries) {
        const d = entry.details_json ? (typeof entry.details_json === 'string' ? entry.details_json : JSON.stringify(entry.details_json)) : '';
        csvRows.push([escapeCsvValue(entry.created_at), escapeCsvValue(entry.action_type), escapeCsvValue(entry.scope_type), escapeCsvValue(entry.actor_email), escapeCsvValue(entry.target_label), escapeCsvValue(d)].join(','));
      }
      const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const exportFilename = buildExportFilename();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // v6B.10: Write audit entry for the export event
      const exportedAt = new Date().toISOString();
      try {
        await supabase.functions.invoke('swor-notifications', {
          body: {
            action: 'write_audit_entry',
            payload: {
              action_type: 'audit.csv_exported',
              actor_user_id: userId,
              actor_email: userEmail || 'unknown@system',
              scope_type: 'system',
              target_label: 'steward_audit_log',
              details_json: {
                filtersApplied: buildFiltersApplied(),
                rowCount: entries.length,
                totalMatches: data.total || 0,
                exportedAt,
                filename: exportFilename
              }
            }
          }
        });
      } catch (_auditErr) {
        // Non-critical: export succeeded even if audit write fails
        console.warn('[CSV Export] Audit write failed (non-critical):', _auditErr);
      }
    } catch (err: any) { setExportMessage(`Export failed: ${err.message}`); }
    finally { setIsExporting(false); }
  };

  // v6B.10: CSV Export handler with large export confirmation
  const handleExportCSV = async () => {
    // Check if total matches > 500 and show confirmation
    if (activityTotal > 500) {
      setPendingExportTotal(activityTotal);
      setShowExportConfirmModal(true);
      return;
    }
    // Otherwise export directly
    await executeExport();
  };


  // Load data when tab changes
  useEffect(() => {
    if (isSteward) {
      if (activeTab === 'inbox') fetchMessages();
      else if (activeTab === 'profiles') fetchProfiles();
      else if (activeTab === 'commendations') fetchCommendations();
      else if (activeTab === 'activity') fetchActivityLog();
      else if (activeTab === 'steward_assignments' && isGlobalSteward) fetchAssignments();
    }
  }, [activeTab, isSteward, isGlobalSteward, fetchMessages, fetchProfiles, fetchCommendations, fetchActivityLog, fetchAssignments]);


  // Update message status
  const handleUpdateMessage = async (newStatus: 'new' | 'triaged' | 'closed') => {
    if (!selectedMessage) return;

    setUpdatingMessage(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-contact', {
        body: {
          action: 'update_message',
          message_id: selectedMessage.id,
          status: newStatus,
          steward_note: stewardNote.trim() || null
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to update message');

      setMessages(prev => prev.map(m => 
        m.id === selectedMessage.id 
          ? { ...m, status: newStatus, steward_note: stewardNote.trim() || null }
          : m
      ));
      setSelectedMessage(null);
      setStewardNote('');
    } catch (err: any) {
      console.error('Error updating message:', err);
    } finally {
      setUpdatingMessage(false);
    }
  };

  // Approve profile
  const handleApproveProfile = async () => {
    if (!selectedProfile) return;

    setUpdatingProfile(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'approve_profile',
          payload: {
            profile_id: selectedProfile.id,
            steward_id: userId,
            steward_name: userName
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to approve profile');

      // Send notification to profile owner
      if (data.notification_data) {
        try {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'profile_approved',
              payload: {
                profile_id: selectedProfile.id,
                profile_name: data.notification_data.profile_name,
                owner_user_id: data.notification_data.owner_user_id
              }
            }
          });
        } catch (notifErr) {
          console.log('Notification failed (non-critical):', notifErr);
        }
      }

      // Update local state
      setProfiles(prev => prev.filter(p => p.id !== selectedProfile.id));
      setSelectedProfile(null);
      setProfileStewardNote('');
      
      // Refresh counts
      fetchProfiles();
    } catch (err: any) {
      console.error('Error approving profile:', err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Request changes on profile
  const handleRequestChanges = async () => {
    if (!selectedProfile) return;
    if (!profileStewardNote.trim()) {
      alert('Please provide feedback for the profile owner.');
      return;
    }

    setUpdatingProfile(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'request_changes',
          payload: {
            profile_id: selectedProfile.id,
            steward_note: profileStewardNote.trim(),
            steward_id: userId,
            steward_name: userName
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to request changes');

      // Send notification to profile owner
      if (data.notification_data) {
        try {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'profile_needs_changes',
              payload: {
                profile_id: selectedProfile.id,
                profile_name: data.notification_data.profile_name,
                owner_user_id: data.notification_data.owner_user_id,
                steward_note: data.notification_data.steward_note
              }
            }
          });
        } catch (notifErr) {
          console.log('Notification failed (non-critical):', notifErr);
        }
      }

      // Update local state
      setProfiles(prev => prev.map(p => 
        p.id === selectedProfile.id 
          ? { ...p, status: 'needs_changes', steward_note: profileStewardNote.trim(), steward_note_by: userName }
          : p
      ));
      setSelectedProfile(null);
      setProfileStewardNote('');
      
      // Refresh counts
      fetchProfiles();
    } catch (err: any) {
      console.error('Error requesting changes:', err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // v6B.11: Bulk selection helpers
  const toggleProfileSelection = (id: string) => {
    setSelectedProfileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProfileIds.size === profiles.length) {
      setSelectedProfileIds(new Set());
    } else {
      setSelectedProfileIds(new Set(profiles.map(p => p.id)));
    }
  };

  const clearBulkSelection = () => setSelectedProfileIds(new Set());

  // v6B.11: Execute bulk action (approve or request_changes) in batches of 5
  const executeBulkAction = async (decision: 'approve' | 'request_changes', note?: string) => {
    const ids = Array.from(selectedProfileIds);
    const total = ids.length;
    if (total === 0) return;

    setBulkProcessing(true);
    setBulkProgress({ total, completed: 0, failed: 0 });
    setShowBulkApproveModal(false);
    setShowBulkRequestChangesModal(false);

    let succeeded = 0;
    let failed = 0;
    const failedNames: string[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (profileId) => {
          const profile = profiles.find(p => p.id === profileId);
          const profileName = profile ? getProfileDisplayName(profile) : profileId;

          if (decision === 'approve') {
            const { data, error } = await supabase.functions.invoke('swor-profile', {
              body: { action: 'approve_profile', payload: { profile_id: profileId, steward_id: userId, steward_name: userName } }
            });
            if (error) throw new Error(error.message);
            if (!data?.success) throw new Error(data?.detail || 'Failed');
            if (data.notification_data) {
              try {
                await supabase.functions.invoke('swor-notifications', {
                  body: { action: 'profile_approved', payload: { profile_id: profileId, profile_name: data.notification_data.profile_name, owner_user_id: data.notification_data.owner_user_id } }
                });
              } catch (_) { /* non-critical */ }
            }
          } else {
            const noteToSend = note?.trim() || '';
            const { data: rcData, error: rcError } = await supabase.functions.invoke('swor-profile', {
              body: { action: 'request_changes', payload: { profile_id: profileId, steward_note: noteToSend, steward_id: userId, steward_name: userName } }
            });
            if (rcError) throw new Error(rcError.message);
            if (!rcData?.success) throw new Error(rcData?.detail || 'Failed');
            if (rcData.notification_data) {
              try {
                await supabase.functions.invoke('swor-notifications', {
                  body: { action: 'profile_needs_changes', payload: { profile_id: profileId, profile_name: rcData.notification_data.profile_name, owner_user_id: rcData.notification_data.owner_user_id, steward_note: rcData.notification_data.steward_note } }
                });
              } catch (_) { /* non-critical */ }
            }
          }
          return { profileId, profileName };

          return { profileId, profileName };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          succeeded++;
          // Remove from selection
          setSelectedProfileIds(prev => { const next = new Set(prev); next.delete(result.value.profileId); return next; });
          // Remove from profiles list
          setProfiles(prev => prev.filter(p => p.id !== result.value.profileId));
        } else {
          failed++;
          const failedId = batch[results.indexOf(result)];
          const failedProfile = profiles.find(p => p.id === failedId);
          failedNames.push(failedProfile ? getProfileDisplayName(failedProfile) : failedId);
        }
        setBulkProgress({ total, completed: succeeded + failed, failed });
      }
    }

    // Write bulk audit event
    try {
      await supabase.functions.invoke('swor-notifications', {
        body: {
          action: 'write_audit_entry',
          payload: {
            action_type: 'profile.bulk_review_executed',
            actor_user_id: userId,
            actor_email: userEmail || 'unknown@system',
            scope_type: 'system',
            target_label: `${total} profiles`,
            details_json: { decision, count: total, succeededCount: succeeded, failedCount: failed, note: note?.trim() || null }
          }
        }
      });
    } catch (_) { console.warn('[BulkAction] Audit write failed (non-critical)'); }

    setBulkProcessing(false);
    setBulkResultSummary({ show: true, decision, succeeded, failed, failedNames });
    setBulkRequestChangesNote('');

    // Refresh profile list and counts
    fetchProfiles();
  };


  // Approve commendation
  const handleApproveCommendation = async () => {
    if (!selectedCommendation) return;

    setUpdatingCommendation(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'review_commendation',
          payload: {
            commendation_id: selectedCommendation.id,
            decision: 'approved',
            steward_id: userId,
            steward_name: userName
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to approve commendation');

      // Send notification to recipient
      if (data.notification_data) {
        try {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'commendation_approved',
              payload: {
                profile_id: data.notification_data.profile_id,
                recipient_user_id: data.notification_data.recipient_user_id,
                recipient_name: data.notification_data.recipient_name,
                commender_name: data.notification_data.commender_name,
                relationship_context: data.notification_data.relationship_context,
                commendation_id: selectedCommendation.id
              }
            }
          });
        } catch (notifErr) {
          console.log('Notification failed (non-critical):', notifErr);
        }
      }

      // Update local state
      setCommendations(prev => prev.filter(c => c.id !== selectedCommendation.id));
      setSelectedCommendation(null);
      setCommendationRejectionReason('');
      
      // Refresh counts
      fetchCommendations();
    } catch (err: any) {
      console.error('Error approving commendation:', err);
    } finally {
      setUpdatingCommendation(false);
    }
  };

  // Reject commendation
  const handleRejectCommendation = async () => {
    if (!selectedCommendation) return;

    setUpdatingCommendation(true);
    try {
      const { data, error } = await supabase.functions.invoke('swor-profile', {
        body: {
          action: 'review_commendation',
          payload: {
            commendation_id: selectedCommendation.id,
            decision: 'rejected',
            rejection_reason: commendationRejectionReason.trim() || null,
            steward_id: userId,
            steward_name: userName
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.detail || 'Failed to reject commendation');

      // Send notification to commender (only if they opted in)
      if (data.notification_data && data.notification_data.commender_email) {
        try {
          await supabase.functions.invoke('swor-notifications', {
            body: {
              action: 'commendation_rejected',
              payload: {
                commender_user_id: data.notification_data.commender_profile_id,
                commender_email: data.notification_data.commender_email,
                recipient_name: data.notification_data.recipient_name,
                rejection_reason: data.notification_data.rejection_reason,
                commendation_id: selectedCommendation.id
              }
            }
          });
        } catch (notifErr) {
          console.log('Notification failed (non-critical):', notifErr);
        }
      }

      // Update local state
      setCommendations(prev => prev.filter(c => c.id !== selectedCommendation.id));
      setSelectedCommendation(null);
      setCommendationRejectionReason('');
      
      // Refresh counts
      fetchCommendations();
    } catch (err: any) {
      console.error('Error rejecting commendation:', err);
    } finally {
      setUpdatingCommendation(false);
    }
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">New</span>;
      case 'triaged':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Triaged</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Closed</span>;
      case 'submitted_for_review':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Pending</span>;
      case 'needs_changes':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Needs Changes</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  const getProfileDisplayName = (profile: PendingProfile) => {
    return profile.known_as || profile.full_name || profile.title || 'Unnamed Profile';
  };

  // Get unique countries from profiles for filter
  const uniqueCountries = [...new Set(profiles.map(p => p.country).filter(Boolean))].sort();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center pt-20 md:pt-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
          <p className="text-[#1A2332]/60 mt-4">Checking access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4 pt-20 md:pt-24">
        <div className="max-w-md w-full bg-white rounded-xl p-8 text-center border border-[#1A2332]/10">
          <div className="w-16 h-16 bg-[#1A2332]/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#1A2332]/40" />
          </div>
          <h1 className="font-serif text-xl text-[#1A2332] mb-2">Sign In Required</h1>
          <p className="text-[#1A2332]/60 mb-6">
            Please sign in to access the Steward Dashboard.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-[#1A2332] text-white rounded-lg hover:bg-[#1A2332]/90 transition-colors min-h-[44px]"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Not a steward
  if (!isSteward) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center px-4 pt-20 md:pt-24">
        <div className="max-w-md w-full bg-white rounded-xl p-8 text-center border border-[#1A2332]/10">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-serif text-xl text-[#1A2332] mb-2">Access Restricted</h1>
          <p className="text-[#1A2332]/60 mb-6">
            This area is only accessible to SWOR stewards. If you believe you should have access, 
            please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-[#1A2332] text-white rounded-lg hover:bg-[#1A2332]/90 transition-colors min-h-[44px]"
            >
              Return Home
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-[#F5F1E8] transition-colors min-h-[44px]"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Steward Dashboard
  return (
    <div className="min-h-screen bg-[#F5F1E8] pt-20 md:pt-24">
      {/* Header */}
      <div className="bg-white border-b border-[#1A2332]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center text-[#1A2332]/60 hover:text-[#1A2332] transition-colors mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-[#8B9D83]/10 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-[#8B9D83]" />
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl text-[#1A2332]">Steward Dashboard</h1>
                <p className="text-[#1A2332]/60 mt-1">Operations hub for SWOR stewards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#1A2332]/10 sticky top-16 md:top-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto -mb-px">
            {[
              { id: 'inbox' as TabType, label: 'Contact Inbox', icon: Mail, count: messages.filter(m => m.status === 'new').length },
              { id: 'profiles' as TabType, label: 'Profiles', icon: Users, count: profileCounts.pending },
              { id: 'commendations' as TabType, label: 'Commendations', icon: MessageSquare, count: commendationCounts.pending },
              { id: 'activity' as TabType, label: 'Activity', icon: FileText },
              { id: 'actions' as TabType, label: 'Quick Actions', icon: ChevronRight },
              { id: 'auth_events' as TabType, label: 'Auth Events', icon: Activity },
              ...(isGlobalSteward ? [{ id: 'steward_assignments' as TabType, label: 'Steward Assignments', icon: UserPlus }] : []),
              ...(isGlobalSteward ? [{ id: 'safe_reset' as TabType, label: 'Safe Reset', icon: RotateCcw }] : []),
            ].map(tab => (

              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? 'border-[#B8826D] text-[#B8826D]'
                    : 'border-transparent text-[#1A2332]/60 hover:text-[#1A2332]'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {(tab as any).count !== undefined && (tab as any).count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#B8826D] text-white">
                    {(tab as any).count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#1A2332]/40" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
                >
                  <option value="all">All Messages</option>
                  <option value="new">New</option>
                  <option value="triaged">Triaged</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button
                onClick={fetchMessages}
                disabled={loadingMessages}
                className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[44px]"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingMessages ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {messagesError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-700">{messagesError}</p>
              </div>
            )}

            {loadingMessages ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                <p className="text-[#1A2332]/60 mt-4">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[#1A2332]/10">
                <Mail className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                <p className="text-[#1A2332]/60">No messages found</p>
                <p className="text-sm text-[#1A2332]/40 mt-1">
                  {statusFilter !== 'all' ? 'Try changing the filter' : 'Contact messages will appear here'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className="bg-white rounded-xl p-5 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedMessage(message);
                      setStewardNote(message.steward_note || '');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusChip(message.status)}
                          <span className="text-xs text-[#1A2332]/40">{formatDate(message.created_at)}</span>
                        </div>
                        <h3 className="font-medium text-[#1A2332] truncate">{message.subject}</h3>
                        <p className="text-sm text-[#1A2332]/60 mt-1">
                          From: {message.name} ({message.email})
                        </p>
                        <p className="text-sm text-[#1A2332]/50 mt-2 line-clamp-2">{message.message}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#1A2332]/30 flex-shrink-0 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message Detail Modal */}
            {selectedMessage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusChip(selectedMessage.status)}
                          <span className="text-xs text-[#1A2332]/40">{formatDate(selectedMessage.created_at)}</span>
                        </div>
                        <h2 className="font-serif text-xl text-[#1A2332]">{selectedMessage.subject}</h2>
                        <p className="text-sm text-[#1A2332]/60 mt-1">
                          From: {selectedMessage.name} ({selectedMessage.email})
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-[#F5F1E8] rounded-lg p-4 mb-6">
                      <p className="text-[#1A2332]/80 whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1A2332] mb-2">
                          Steward Note (internal)
                        </label>
                        <textarea
                          value={stewardNote}
                          onChange={(e) => setStewardNote(e.target.value)}
                          placeholder="Add notes about this message..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 resize-none"
                          disabled={updatingMessage}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8]">
                    <div className="flex flex-wrap gap-3">
                      {selectedMessage.status !== 'new' && (
                        <button
                          onClick={() => handleUpdateMessage('new')}
                          disabled={updatingMessage}
                          className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors min-h-[44px] disabled:opacity-50"
                        >
                          Mark as New
                        </button>
                      )}
                      {selectedMessage.status !== 'triaged' && (
                        <button
                          onClick={() => handleUpdateMessage('triaged')}
                          disabled={updatingMessage}
                          className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors min-h-[44px] disabled:opacity-50"
                        >
                          Mark as Triaged
                        </button>
                      )}
                      {selectedMessage.status !== 'closed' && (
                        <button
                          onClick={() => handleUpdateMessage('closed')}
                          disabled={updatingMessage}
                          className="px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors min-h-[44px] disabled:opacity-50"
                        >
                          {updatingMessage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Close Message'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profiles Tab (v6B.11: Bulk Actions) */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-[#1A2332]/40" />
                <select value={profileStatusFilter} onChange={(e) => { setProfileStatusFilter(e.target.value as any); clearBulkSelection(); }} className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]">
                  <option value="submitted_for_review">Pending Review ({profileCounts.pending})</option>
                  <option value="needs_changes">Needs Changes ({profileCounts.needs_changes})</option>
                  <option value="all">All</option>
                </select>
                {uniqueCountries.length > 0 && (
                  <select value={profileCountryFilter} onChange={(e) => setProfileCountryFilter(e.target.value)} className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]">
                    <option value="all">All Countries</option>
                    {uniqueCountries.map(country => (<option key={country} value={country}>{country}</option>))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
                  <input type="text" value={profileSearchQuery} onChange={(e) => setProfileSearchQuery(e.target.value)} placeholder="Search by name..." className="pl-10 pr-4 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px] w-full sm:w-48" />
                </div>
                <button onClick={fetchProfiles} disabled={loadingProfiles} className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[44px] px-3">
                  <RefreshCw className={`w-4 h-4 ${loadingProfiles ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* v6B.11: Select All header (only when profiles exist) */}
            {profiles.length > 0 && !loadingProfiles && (
              <div className="flex items-center gap-3 px-1">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[36px] transition-colors" disabled={bulkProcessing}>
                  {selectedProfileIds.size === profiles.length && profiles.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-[#B8826D]" />
                  ) : selectedProfileIds.size > 0 ? (
                    <div className="w-5 h-5 border-2 border-[#B8826D] rounded bg-[#B8826D]/20 flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-[#B8826D] rounded" />
                    </div>
                  ) : (
                    <Square className="w-5 h-5 text-[#1A2332]/30" />
                  )}
                  <span>{selectedProfileIds.size === profiles.length ? 'Deselect all' : 'Select all'}</span>
                </button>
                {selectedProfileIds.size > 0 && (
                  <span className="text-xs text-[#1A2332]/40">{selectedProfileIds.size} of {profiles.length} selected</span>
                )}
              </div>
            )}

            {profilesError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-700">{profilesError}</p>
              </div>
            )}

            {/* v6B.11: Bulk processing progress */}
            {bulkProcessing && (
              <div className="bg-white rounded-xl p-5 border border-[#B8826D]/30">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" />
                  <p className="text-sm font-medium text-[#1A2332]">Processing {bulkProgress.completed} of {bulkProgress.total} profiles...</p>
                </div>
                <div className="w-full bg-[#1A2332]/10 rounded-full h-2">
                  <div className="bg-[#B8826D] h-2 rounded-full transition-all duration-300" style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.completed / bulkProgress.total) * 100 : 0}%` }} />
                </div>
                {bulkProgress.failed > 0 && (
                  <p className="text-xs text-amber-600 mt-2">{bulkProgress.failed} failed so far</p>
                )}
              </div>
            )}

            {/* v6B.11: Bulk result summary */}
            {bulkResultSummary.show && !bulkProcessing && (
              <div className={`rounded-xl p-5 border ${bulkResultSummary.failed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">
                      Bulk {bulkResultSummary.decision === 'approve' ? 'approval' : 'request changes'} complete
                    </p>
                    <p className="text-sm text-[#1A2332]/60 mt-1">
                      {bulkResultSummary.succeeded} succeeded{bulkResultSummary.failed > 0 ? `, ${bulkResultSummary.failed} failed` : ''}
                    </p>
                    {bulkResultSummary.failedNames.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-amber-700">Some profiles could not be processed. You can retry the failed ones:</p>
                        <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                          {bulkResultSummary.failedNames.map((name, i) => <li key={i}>{name}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setBulkResultSummary(prev => ({ ...prev, show: false }))} className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {loadingProfiles ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                <p className="text-[#1A2332]/60 mt-4">Loading profiles...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[#1A2332]/10">
                <Users className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                <p className="text-[#1A2332]/60">No profiles found</p>
                <p className="text-sm text-[#1A2332]/40 mt-1">{profileStatusFilter !== 'all' ? 'Try changing the filter' : 'Profiles awaiting review will appear here'}</p>
              </div>
            ) : (
              <div className="grid gap-4 pb-20">
                {profiles.map(profile => {
                  const isSelected = selectedProfileIds.has(profile.id);
                  return (
                    <div key={profile.id} className={`bg-white rounded-xl p-5 border transition-colors cursor-pointer ${isSelected ? 'border-[#B8826D] ring-1 ring-[#B8826D]/30' : 'border-[#1A2332]/10 hover:border-[#B8826D]/30'}`}>
                      <div className="flex items-start gap-3">
                        {/* v6B.11: Selection checkbox */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleProfileSelection(profile.id); }}
                          className="mt-1 flex-shrink-0 min-h-[24px] min-w-[24px] flex items-center justify-center"
                          disabled={bulkProcessing}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#B8826D]" />
                          ) : (
                            <Square className="w-5 h-5 text-[#1A2332]/30 hover:text-[#1A2332]/50" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0" onClick={() => { setSelectedProfile(profile); setProfileStewardNote(profile.steward_note || ''); }}>
                          <div className="flex items-start space-x-4">
                            {profile.photo_signed_url ? (
                              <img src={profile.photo_signed_url} alt={getProfileDisplayName(profile)} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#1A2332]/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-[#1A2332]/40" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">{getStatusChip(profile.status)}</div>
                              <h3 className="font-medium text-[#1A2332]">{getProfileDisplayName(profile)}</h3>
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#1A2332]/60">
                                {profile.country && (<span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{profile.country}{profile.region ? `, ${profile.region}` : ''}</span>)}
                                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{formatDateShort(profile.submitted_at || profile.created_at)}</span>
                              </div>
                              {profile.steward_note && (<p className="text-sm text-amber-700 mt-2 italic">Note: {profile.steward_note}</p>)}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#1A2332]/30 flex-shrink-0 mt-1" onClick={() => { setSelectedProfile(profile); setProfileStewardNote(profile.steward_note || ''); }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* v6B.11: Floating Bulk Action Bar */}
            {selectedProfileIds.size > 0 && !bulkProcessing && (
              <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#1A2332]/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-[#B8826D]" />
                    <span className="text-sm font-medium text-[#1A2332]">Selected: {selectedProfileIds.size}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowBulkApproveModal(true)} className="px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors min-h-[40px] text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve selected
                    </button>
                    <button onClick={() => { setShowBulkRequestChangesModal(true); setBulkRequestChangesNote(''); }} className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors min-h-[40px] text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Request changes
                    </button>
                    <button onClick={clearBulkSelection} className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332]/60 rounded-lg hover:bg-[#F5F1E8] transition-colors min-h-[40px] text-sm">
                      Clear selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* v6B.11: Bulk Approve Confirmation Modal */}
            {showBulkApproveModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#8B9D83]/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-[#8B9D83]" />
                      </div>
                      <h2 className="font-serif text-lg text-[#1A2332]">Approve {selectedProfileIds.size} profile{selectedProfileIds.size !== 1 ? 's' : ''}</h2>
                    </div>
                    <p className="text-sm text-[#1A2332]/60 mt-2">
                      This will approve {selectedProfileIds.size} selected profile{selectedProfileIds.size !== 1 ? 's' : ''} and notify each profile owner individually.
                    </p>
                    <p className="text-xs text-[#1A2332]/40 mt-2">Each profile will be processed individually. You can review the results afterwards.</p>
                  </div>
                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8] flex justify-end gap-3">
                    <button onClick={() => setShowBulkApproveModal(false)} className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-white transition-colors min-h-[44px] text-sm">Cancel</button>
                    <button onClick={() => executeBulkAction('approve')} className="px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors min-h-[44px] text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve {selectedProfileIds.size}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* v6B.11: Bulk Request Changes Modal */}
            {showBulkRequestChangesModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <h2 className="font-serif text-lg text-[#1A2332]">Request changes for {selectedProfileIds.size} profile{selectedProfileIds.size !== 1 ? 's' : ''}</h2>
                    </div>
                    <p className="text-sm text-[#1A2332]/60 mt-2">
                      The same note will be sent to all {selectedProfileIds.size} selected profile owner{selectedProfileIds.size !== 1 ? 's' : ''}.
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1A2332] mb-2">Steward note (optional)</label>
                      <textarea
                        value={bulkRequestChangesNote}
                        onChange={(e) => setBulkRequestChangesNote(e.target.value)}
                        placeholder="Provide calm, constructive feedback..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 resize-none"
                      />
                      <p className="text-xs text-[#1A2332]/40 mt-1">Keep it calm and specific.</p>
                    </div>
                  </div>
                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8] flex justify-end gap-3">
                    <button onClick={() => setShowBulkRequestChangesModal(false)} className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-white transition-colors min-h-[44px] text-sm">Cancel</button>
                    <button onClick={() => executeBulkAction('request_changes', bulkRequestChangesNote)} disabled={!bulkRequestChangesNote.trim()} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors min-h-[44px] text-sm disabled:opacity-50 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Request changes ({selectedProfileIds.size})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Detail Modal (v6B.12: Review History) */}
            {selectedProfile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {selectedProfile.photo_signed_url ? (
                          <img src={selectedProfile.photo_signed_url} alt={getProfileDisplayName(selectedProfile)} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#1A2332]/10 flex items-center justify-center"><User className="w-8 h-8 text-[#1A2332]/40" /></div>
                        )}
                        <div>
                          <div className="flex items-center space-x-3 mb-1">{getStatusChip(selectedProfile.status)}</div>
                          <h2 className="font-serif text-xl text-[#1A2332]">{getProfileDisplayName(selectedProfile)}</h2>
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#1A2332]/60">
                            {selectedProfile.country && (<span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{selectedProfile.country}{selectedProfile.region ? `, ${selectedProfile.region}` : ''}</span>)}
                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />Submitted {formatDateShort(selectedProfile.submitted_at || selectedProfile.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedProfile(null); setShowReviewHistory(false); setReviewHistory([]); }} className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-6 h-6" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      <button onClick={() => onNavigate(`people/${selectedProfile.id}`)} className="w-full px-4 py-3 bg-[#F5F1E8] rounded-lg text-[#1A2332] hover:bg-[#F5F1E8]/80 transition-colors flex items-center justify-center min-h-[44px]">
                        <Eye className="w-4 h-4 mr-2" />Preview Full Profile
                      </button>
                      <div>
                        <label className="block text-sm font-medium text-[#1A2332] mb-2">Steward Feedback (required for requesting changes)</label>
                        <textarea value={profileStewardNote} onChange={(e) => setProfileStewardNote(e.target.value)} placeholder="Provide calm, constructive feedback for the profile owner..." rows={4} className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 resize-none" disabled={updatingProfile} />
                        <p className="text-xs text-[#1A2332]/50 mt-1">Keep feedback documentary and kind. No urgency language.</p>
                      </div>

                      {/* v6B.12: Review History expandable section */}
                      <div className="border border-[#1A2332]/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            if (!showReviewHistory) {
                              setShowReviewHistory(true);
                              fetchReviewHistory(selectedProfile.id);
                            } else {
                              setShowReviewHistory(false);
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F1E8]/50 hover:bg-[#F5F1E8] transition-colors min-h-[44px] text-left"
                        >
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-[#1A2332]/50" />
                            <span className="text-sm font-medium text-[#1A2332]">Review History</span>
                            {reviewHistory.length > 0 && showReviewHistory && (
                              <span className="text-xs text-[#1A2332]/40">({reviewHistory.length} entries)</span>
                            )}
                          </div>
                          {showReviewHistory ? <ChevronUp className="w-4 h-4 text-[#1A2332]/40" /> : <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />}
                        </button>

                        {showReviewHistory && (
                          <div className="px-4 py-3 border-t border-[#1A2332]/10 max-h-64 overflow-y-auto">
                            {loadingReviewHistory ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" />
                                <span className="text-sm text-[#1A2332]/50 ml-2">Loading history...</span>
                              </div>
                            ) : reviewHistory.length === 0 ? (
                              <p className="text-sm text-[#1A2332]/40 py-2 text-center">No review history found for this profile.</p>
                            ) : (
                              <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#1A2332]/10" />
                                <div className="space-y-4">
                                  {reviewHistory.map((entry, idx) => {
                                    const actionType = entry.action_type || '';
                                    let dotColor = 'bg-[#1A2332]/20';
                                    let label = actionType.replace(/[._]/g, ' ');
                                    if (actionType.includes('approved') || actionType === 'approve_profile') { dotColor = 'bg-[#8B9D83]'; label = 'Approved'; }
                                    else if (actionType.includes('needs_changes') || actionType === 'request_changes') { dotColor = 'bg-amber-500'; label = 'Returned for changes'; }
                                    else if (actionType.includes('submitted') || actionType === 'submit_for_review') { dotColor = 'bg-blue-500'; label = 'Submitted for review'; }
                                    else if (actionType.includes('withdrawn') || actionType === 'withdraw_submission') { dotColor = 'bg-gray-400'; label = 'Withdrawn'; }
                                    else if (actionType.includes('bulk_review')) { dotColor = 'bg-purple-500'; label = 'Bulk review action'; }
                                    else if (actionType.includes('create') || actionType.includes('save')) { dotColor = 'bg-teal-400'; label = 'Profile updated'; }

                                    const stewardEmail = entry.actor_email || 'Unknown';
                                    const note = entry.details_json?.steward_note || entry.details_json?.note || null;
                                    const statusChange = entry.details_json?.status_before && entry.details_json?.status_after
                                      ? `${entry.details_json.status_before} → ${entry.details_json.status_after}`
                                      : null;

                                    return (
                                      <div key={entry.id || idx} className="relative pl-7">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-[6px] top-1.5 w-3 h-3 rounded-full ${dotColor} ring-2 ring-white`} />
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-[#1A2332]">{label}</span>
                                            <span className="text-[10px] text-[#1A2332]/40">{formatDate(entry.created_at)}</span>
                                          </div>
                                          <p className="text-xs text-[#1A2332]/50 mt-0.5">By: {stewardEmail}</p>
                                          {statusChange && (
                                            <p className="text-xs text-[#1A2332]/40 mt-0.5">Status: {statusChange}</p>
                                          )}
                                          {note && (
                                            <div className="mt-1.5 px-3 py-2 bg-amber-50 border-l-2 border-amber-300 rounded-r-lg">
                                              <p className="text-xs text-amber-800 italic">"{note}"</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8]">
                    <div className="flex flex-wrap gap-3">
                      <button onClick={handleRequestChanges} disabled={updatingProfile || !profileStewardNote.trim()} className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors min-h-[44px] disabled:opacity-50">Request Changes</button>
                      <button onClick={handleApproveProfile} disabled={updatingProfile} className="px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors min-h-[44px] disabled:opacity-50 flex items-center">
                        {updatingProfile ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<><CheckCircle className="w-4 h-4 mr-2" />Approve Profile</>)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}


        {/* Commendations Tab */}
        {activeTab === 'commendations' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#1A2332]/40" />
                <select
                  value={commendationStatusFilter}
                  onChange={(e) => setCommendationStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
                >
                  <option value="submitted_for_review">Pending ({commendationCounts.pending})</option>
                  <option value="approved">Approved ({commendationCounts.approved})</option>
                  <option value="rejected">Rejected ({commendationCounts.rejected})</option>
                  <option value="all">All</option>
                </select>
              </div>
              <button
                onClick={fetchCommendations}
                disabled={loadingCommendations}
                className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[44px]"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingCommendations ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {commendationsError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-700">{commendationsError}</p>
              </div>
            )}

            {loadingCommendations ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                <p className="text-[#1A2332]/60 mt-4">Loading commendations...</p>
              </div>
            ) : commendations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[#1A2332]/10">
                <MessageSquare className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                <p className="text-[#1A2332]/60">No commendations found</p>
                <p className="text-sm text-[#1A2332]/40 mt-1">
                  {commendationStatusFilter !== 'all' ? 'Try changing the filter' : 'Commendations awaiting review will appear here'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {commendations.map(commendation => (
                  <div
                    key={commendation.id}
                    className="bg-white rounded-xl p-5 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedCommendation(commendation);
                      setCommendationRejectionReason('');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusChip(commendation.status)}
                          <span className="text-xs text-[#1A2332]/40">{formatDateShort(commendation.created_at)}</span>
                        </div>
                        <h3 className="font-medium text-[#1A2332]">
                          For: {commendation.recipient_name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-[#1A2332]/60 mt-1">
                          From: {commendation.commender_name}
                          {commendation.commender_profile_name && ` (${commendation.commender_profile_name})`}
                        </p>
                        <p className="text-sm text-[#1A2332]/50 mt-1">
                          Relationship: {commendation.relationship_context}
                        </p>
                        <p className="text-sm text-[#1A2332]/50 mt-2 line-clamp-2 italic">
                          "{commendation.commendation_text}"
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#1A2332]/30 flex-shrink-0 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Commendation Detail Modal */}
            {selectedCommendation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusChip(selectedCommendation.status)}
                          <span className="text-xs text-[#1A2332]/40">{formatDate(selectedCommendation.created_at)}</span>
                        </div>
                        <h2 className="font-serif text-xl text-[#1A2332]">
                          Commendation for {selectedCommendation.recipient_name || 'Unknown'}
                        </h2>
                        <p className="text-sm text-[#1A2332]/60 mt-1">
                          From: {selectedCommendation.commender_name}
                          {selectedCommendation.commender_email && ` (${selectedCommendation.commender_email})`}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedCommendation(null)}
                        className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                      <div className="bg-[#F5F1E8] rounded-lg p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <Award className="w-5 h-5 text-[#B8826D] mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#1A2332]">Relationship</p>
                            <p className="text-[#1A2332]/70">{selectedCommendation.relationship_context}</p>
                          </div>
                        </div>
                        {selectedCommendation.when_context && (
                          <div className="flex items-start space-x-3 mb-3">
                            <Clock className="w-5 h-5 text-[#B8826D] mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-[#1A2332]">When</p>
                              <p className="text-[#1A2332]/70">{selectedCommendation.when_context}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#1A2332] mb-2">Why it mattered</p>
                        <p className="text-[#1A2332]/70">{selectedCommendation.why_it_mattered}</p>
                      </div>

                      <div className="bg-white border border-[#1A2332]/10 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Quote className="w-5 h-5 text-[#B8826D] mt-0.5 flex-shrink-0" />
                          <p className="text-[#1A2332]/80 italic">{selectedCommendation.commendation_text}</p>
                        </div>
                      </div>

                      {selectedCommendation.status === 'submitted_for_review' && (
                        <div>
                          <label className="block text-sm font-medium text-[#1A2332] mb-2">
                            Rejection Reason (optional)
                          </label>
                          <textarea
                            value={commendationRejectionReason}
                            onChange={(e) => setCommendationRejectionReason(e.target.value)}
                            placeholder="If rejecting, provide a reason..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 resize-none"
                            disabled={updatingCommendation}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCommendation.status === 'submitted_for_review' && (
                    <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8]">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleRejectCommendation}
                          disabled={updatingCommendation}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors min-h-[44px] disabled:opacity-50 flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                        <button
                          onClick={handleApproveCommendation}
                          disabled={updatingCommendation}
                          className="px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors min-h-[44px] disabled:opacity-50 flex items-center"
                        >
                          {updatingCommendation ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab (Steward Audit Log) */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Filters Row 1: Action Type + Scope + Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-[#1A2332]/40" />
                <select
                  value={activityTypeFilter}
                  onChange={(e) => { setActivityTypeFilter(e.target.value); setActivityPage(0); }}
                  className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
                >
                  <option value="all">All Actions</option>
                  <optgroup label="Profile">
                    <option value="profile.approved">Profile Approved</option>
                    <option value="profile.needs_changes">Profile Needs Changes</option>
                    <option value="profile.withdrawn">Profile Withdrawn</option>
                    <option value="profile.bulk_review_executed">Bulk Review Executed</option>
                  </optgroup>

                  <optgroup label="Commendation">
                    <option value="commendation.approved">Commendation Approved</option>
                    <option value="commendation.rejected">Commendation Rejected</option>
                  </optgroup>
                  <optgroup label="Contact">
                    <option value="contact.triaged">Contact Triaged</option>
                    <option value="contact.closed">Contact Closed</option>
                    <option value="contact.reopened">Contact Reopened</option>
                  </optgroup>
                   <optgroup label="Notifications">
                    <option value="notify.profile_approved.sent">Notify: Profile Approved</option>
                    <option value="notify.profile_needs_changes.sent">Notify: Needs Changes</option>
                    <option value="notify.profile_submitted.sent">Notify: Profile Submitted</option>
                    <option value="notify.commendation_submitted.sent">Notify: Commendation Submitted</option>
                    <option value="notify.commendation_approved.sent">Notify: Commendation Approved</option>
                    <option value="notify.commendation_rejected.sent">Notify: Commendation Rejected</option>
                    <option value="notify.contact_message.sent">Notify: Contact Message</option>
                  </optgroup>
                  <optgroup label="System">
                    <option value="email.test_sent">Test Email Sent</option>
                    <option value="audit.csv_exported">Audit CSV Exported</option>
                    <option value="steward.assigned">Steward Assigned</option>
                    <option value="steward.deactivated">Steward Deactivated</option>
                  </optgroup>

                </select>
                <select
                  value={activityScopeFilter}
                  onChange={(e) => { setActivityScopeFilter(e.target.value); setActivityPage(0); }}
                  className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
                >
                  <option value="all">All Scopes</option>
                  <option value="profile">Profile</option>
                  <option value="commendation">Commendation</option>
                  <option value="contact">Contact</option>
                  <option value="system">System</option>
                </select>

              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
                  <input
                    type="text"
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    placeholder="Search email or label..."
                    className="pl-10 pr-4 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px] w-full sm:w-56"
                    onKeyDown={(e) => { if (e.key === 'Enter') { setActivityPage(0); fetchActivityLog(0); } }}
                  />
                </div>
                <button
                  onClick={() => { setActivityPage(0); fetchActivityLog(0); }}
                  disabled={loadingActivity}
                  className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[44px] px-3"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingActivity ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filters Row 2: Date Range */}
            <div className="flex flex-wrap items-center gap-3">
              <Calendar className="w-4 h-4 text-[#1A2332]/40" />
              <label className="text-xs text-[#1A2332]/50">From:</label>
              <input
                type="date"
                value={activityDateFrom}
                onChange={(e) => { setActivityDateFrom(e.target.value); setActivityPage(0); }}
                className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
              />
              <label className="text-xs text-[#1A2332]/50">To:</label>
              <input
                type="date"
                value={activityDateTo}
                onChange={(e) => { setActivityDateTo(e.target.value); setActivityPage(0); }}
                className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
              />
              {(activityDateFrom || activityDateTo) && (
                <button
                  onClick={() => { setActivityDateFrom(''); setActivityDateTo(''); setActivityPage(0); }}
                  className="text-xs text-[#B8826D] hover:underline min-h-[44px] flex items-center"
                >
                  Clear dates
                </button>
              )}
              {activityTotal > 0 && (
                <span className="text-xs text-[#1A2332]/50 ml-auto">
                  {activityTotal} entries found
                </span>
              )}
            </div>

            {activityError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-700">{activityError}</p>
              </div>
            )}

            {loadingActivity ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                <p className="text-[#1A2332]/60 mt-4">Loading activity...</p>
              </div>
            ) : activityLog.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-[#1A2332]/10 text-center">
                <FileText className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                <p className="text-[#1A2332]/60">No audit log entries found</p>
                <p className="text-sm text-[#1A2332]/40 mt-1">
                  Steward actions will be recorded here as they occur.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityLog.map(entry => {
                  const actionParts = entry.action_type.split('.');
                  const category = actionParts[0] || 'system';
                  let iconColor = 'text-[#1A2332]/40';
                  let bgColor = 'bg-[#1A2332]/5';
                  let IconComponent = Activity;
                  if (category === 'email') { iconColor = 'text-blue-500'; bgColor = 'bg-blue-50'; IconComponent = Mail; }
                  else if (category === 'profile') { iconColor = 'text-purple-500'; bgColor = 'bg-purple-50'; IconComponent = User; }
                  else if (category === 'commendation') { iconColor = 'text-amber-500'; bgColor = 'bg-amber-50'; IconComponent = Award; }
                  else if (category === 'contact') { iconColor = 'text-teal-500'; bgColor = 'bg-teal-50'; IconComponent = Mail; }
                  else if (category === 'notify') { iconColor = 'text-indigo-500'; bgColor = 'bg-indigo-50'; IconComponent = Mail; }
                  else if (category === 'audit') { iconColor = 'text-gray-500'; bgColor = 'bg-gray-50'; IconComponent = Download; }
                  else if (category === 'steward') { iconColor = 'text-[#8B9D83]'; bgColor = 'bg-[#8B9D83]/10'; IconComponent = UserPlus; }


                  // Human-readable action label
                  const actionLabels: Record<string, string> = {
                    'profile.approved': 'Profile approved',
                    'profile.needs_changes': 'Profile returned for changes',
                    'profile.withdrawn': 'Profile submission withdrawn',
                    'profile.bulk_review_executed': 'Bulk profile review executed',

                    'commendation.approved': 'Commendation approved',
                    'commendation.rejected': 'Commendation rejected',
                    'contact.triaged': 'Contact message triaged',
                    'contact.closed': 'Contact message closed',
                    'contact.reopened': 'Contact message reopened',
                    'contact.updated': 'Contact message updated',
                    'email.test_sent': 'Test email sent',
                    'email.test_sent.failed': 'Test email failed',
                    'notify.profile_approved.sent': 'Approval notification sent',
                    'notify.profile_approved.failed': 'Approval notification failed',
                    'notify.profile_needs_changes.sent': 'Changes-needed notification sent',
                    'notify.profile_needs_changes.failed': 'Changes-needed notification failed',
                    'notify.profile_submitted.sent': 'Submission notification sent',
                    'notify.profile_submitted.failed': 'Submission notification failed',
                    'notify.commendation_submitted.sent': 'Commendation submission notification sent',
                    'notify.commendation_submitted.failed': 'Commendation submission notification failed',
                    'notify.commendation_approved.sent': 'Commendation approval notification sent',
                    'notify.commendation_approved.failed': 'Commendation approval notification failed',
                    'notify.commendation_rejected.sent': 'Commendation rejection notification sent',
                    'notify.commendation_rejected.failed': 'Commendation rejection notification failed',
                    'notify.contact_message.sent': 'Contact message notification sent',
                    'notify.contact_message.failed': 'Contact message notification failed',
                    'audit.csv_exported': 'Audit log CSV exported',
                    'steward.assigned': 'Steward assigned to profile',
                    'steward.deactivated': 'Steward assignment deactivated',

                  };

                  const label = actionLabels[entry.action_type] || entry.action_type.replace(/\./g, ' ');

                  // Scope badge
                  const scopeColors: Record<string, string> = {
                    profile: 'bg-purple-100 text-purple-700',
                    commendation: 'bg-amber-100 text-amber-700',
                    contact: 'bg-teal-100 text-teal-700',
                    system: 'bg-gray-100 text-gray-600',
                  };
                  const scopeBadge = scopeColors[entry.scope_type] || 'bg-gray-100 text-gray-600';

                  return (
                    <div key={entry.id} className="bg-white rounded-lg p-4 border border-[#1A2332]/10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <IconComponent className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-[#1A2332] text-sm">{label}</p>
                              <span className={`px-2 py-0.5 text-[10px] rounded-full ${scopeBadge}`}>
                                {entry.scope_type}
                              </span>
                            </div>
                            <p className="text-xs text-[#1A2332]/60 mt-1">
                              By: {entry.actor_email}
                            </p>
                            {entry.target_label && (
                              <p className="text-xs text-[#1A2332]/50 mt-0.5">
                                Target: {entry.target_label}
                              </p>
                            )}
                            {entry.details_json && (
                              <details className="mt-2">
                                <summary className="text-[10px] text-[#1A2332]/40 cursor-pointer hover:text-[#1A2332]/60">
                                  Details
                                </summary>
                                <div className="mt-1 text-xs text-[#1A2332]/40 bg-[#F5F1E8] rounded px-2 py-1 font-mono overflow-x-auto max-h-24 overflow-y-auto">
                                  {typeof entry.details_json === 'string'
                                    ? entry.details_json
                                    : JSON.stringify(entry.details_json, null, 2)}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-[#1A2332]/40 whitespace-nowrap flex-shrink-0">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination + CSV Export */}
            <div className="flex flex-col gap-3 pt-2">
              {/* Export message */}
              {exportMessage && (
                <div className={`p-3 rounded-lg text-sm ${exportMessage.startsWith('Export failed') ? 'bg-red-50 text-red-700 border border-red-200' : exportMessage.startsWith('No entries') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>{exportMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                {/* Pagination controls */}
                <div className="flex items-center gap-3">
                  {activityTotal > ACTIVITY_PAGE_SIZE && (
                    <>
                      <button
                        onClick={() => { const p = Math.max(0, activityPage - 1); setActivityPage(p); fetchActivityLog(p); }}
                        disabled={activityPage === 0 || loadingActivity}
                        className="px-4 py-2 text-sm border border-[#1A2332]/20 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-[#1A2332]/60">
                        Page {activityPage + 1} of {Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE)}
                      </span>
                      <button
                        onClick={() => { const p = activityPage + 1; setActivityPage(p); fetchActivityLog(p); }}
                        disabled={(activityPage + 1) * ACTIVITY_PAGE_SIZE >= activityTotal || loadingActivity}
                        className="px-4 py-2 text-sm border border-[#1A2332]/20 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        Next
                      </button>
                    </>
                  )}
                </div>

                {/* Download CSV button */}
                <button
                  onClick={handleExportCSV}
                  disabled={isExporting || loadingActivity || activityLog.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#1A2332]/20 rounded-lg hover:bg-white hover:border-[#B8826D]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing…</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* v6B.10: Large Export Confirmation Modal */}
            {showExportConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Download className="w-5 h-5 text-amber-600" />
                      </div>
                      <h2 className="font-serif text-lg text-[#1A2332]">Large export</h2>
                    </div>
                    <p className="text-sm text-[#1A2332]/60 mt-2">
                      This export contains more than 500 rows ({pendingExportTotal.toLocaleString()} total matches). 
                      You can continue, or narrow your filters first.
                    </p>
                    {pendingExportTotal > 1000 && (
                      <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                        Note: Exports are limited to the first 1,000 rows. Consider narrowing your date range or filters to capture all data.
                      </p>
                    )}
                  </div>
                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8] flex justify-end gap-3">
                    <button
                      onClick={() => setShowExportConfirmModal(false)}
                      className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-white transition-colors min-h-[44px] text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeExport}
                      disabled={isExporting}
                      className="px-4 py-2 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 transition-colors min-h-[44px] text-sm disabled:opacity-50 flex items-center"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Quick Actions Tab */}

        {/* Quick Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-8">
            {/* Steward Quick Guide — Patch 6B */}
            <StewardQuickGuide />

            {/* Quick Action Cards */}
            <div>
              <h2 className="font-medium text-[#1A2332] mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => onNavigate('search')}
                  className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors text-left min-h-[120px]"
                >
                  <Search className="w-8 h-8 text-[#B8826D] mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Find a Profile</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">Search for any journey or person</p>
                </button>

                <button
                  onClick={() => onNavigate('help')}
                  className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors text-left min-h-[120px]"
                >
                  <BookOpen className="w-8 h-8 text-[#8B9D83] mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Help Guides</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">View steward documentation</p>
                </button>

                <button
                  onClick={() => setActiveTab('inbox')}
                  className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors text-left min-h-[120px]"
                >
                  <Mail className="w-8 h-8 text-blue-500 mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Contact Inbox</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">Review support messages</p>
                </button>

                <button
                  onClick={() => setActiveTab('profiles')}
                  className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors text-left min-h-[120px]"
                >
                  <Users className="w-8 h-8 text-purple-500 mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Review Profiles</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">Pending profile submissions</p>
                </button>

                <button
                  onClick={() => setActiveTab('commendations')}
                  className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors text-left min-h-[120px]"
                >
                  <MessageSquare className="w-8 h-8 text-amber-500 mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Review Commendations</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">Pending commendation submissions</p>
                </button>

                <button
                  onClick={() => setActiveTab('auth_events')}
                  className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors text-left min-h-[120px]"
                >
                  <Activity className="w-8 h-8 text-teal-500 mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Auth Events</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">Authentication activity and diagnostics</p>
                </button>

                <button
                  onClick={() => onNavigate('email-status')}
                  className="bg-white rounded-xl p-6 border border-amber-200 hover:border-amber-400 transition-colors text-left min-h-[120px]"
                >
                  <Globe className="w-8 h-8 text-amber-600 mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Email and Domain Status</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">Resend email config and domain verification</p>
                </button>



                <button
                  onClick={() => onNavigate('home')}
                  className="bg-white rounded-xl p-6 border border-[#1A2332]/10 hover:border-[#B8826D]/30 transition-colors text-left min-h-[120px]"
                >
                  <Home className="w-8 h-8 text-[#1A2332]/60 mb-3" />
                  <h3 className="font-medium text-[#1A2332]">Return Home</h3>
                  <p className="text-sm text-[#1A2332]/60 mt-1">Go back to the main site</p>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Steward Assignments Tab (v6B.9 - Global Stewards Only) */}
        {activeTab === 'steward_assignments' && isGlobalSteward && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
                <p className="text-2xl font-bold text-[#1A2332]">{assignmentTotals.total}</p>
                <p className="text-xs text-[#1A2332]/50 mt-1">Total Assignments</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
                <p className="text-2xl font-bold text-[#8B9D83]">{assignmentTotals.active}</p>
                <p className="text-xs text-[#1A2332]/50 mt-1">Active</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
                <p className="text-2xl font-bold text-[#1A2332]">{assignmentTotals.total - assignmentTotals.active}</p>
                <p className="text-xs text-[#1A2332]/50 mt-1">Inactive</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
                <p className="text-2xl font-bold text-[#B8826D]">{workload.length}</p>
                <p className="text-xs text-[#1A2332]/50 mt-1">Unique Stewards</p>
              </div>
            </div>

            {/* Workload Summary (v6B.12: Activity Summary) */}
            {workload.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-[#1A2332]/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[#1A2332] flex items-center"><Users className="w-4 h-4 mr-2 text-[#8B9D83]" />Steward Workload</h3>
                  <button onClick={fetchActivitySummary} disabled={loadingActivitySummary} className="flex items-center text-xs text-[#1A2332]/50 hover:text-[#1A2332] min-h-[32px] px-2 gap-1">
                    {loadingActivitySummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}
                    <span>{activitySummary.length > 0 ? 'Refresh' : 'Load'} activity</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {workload.map((w, i) => {
                    const summaryEntry = activitySummary.find(s => s.steward_email === (w.email || '').toLowerCase());
                    const isExpanded = expandedStewardEmail === (w.email || w.name);
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedStewardEmail(isExpanded ? null : (w.email || w.name))}
                          className="w-full flex items-center justify-between px-3 py-2 bg-[#F5F1E8] rounded-lg text-sm hover:bg-[#F5F1E8]/80 transition-colors"
                        >
                          <span className="text-[#1A2332] truncate mr-2">{w.name || w.email}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 bg-[#8B9D83]/20 text-[#8B9D83] rounded-full text-xs font-medium">{w.count}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-[#1A2332]/40" /> : <ChevronDown className="w-3 h-3 text-[#1A2332]/40" />}
                          </div>
                        </button>
                        {isExpanded && summaryEntry && (
                          <div className="ml-3 mt-1 mb-2 px-3 py-2 bg-white border border-[#1A2332]/5 rounded-lg">
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div><p className="text-[#1A2332]/40">Profiles reviewed</p><p className="font-medium text-[#1A2332]">{summaryEntry.profiles_reviewed}</p></div>
                              <div><p className="text-[#1A2332]/40">Commendations</p><p className="font-medium text-[#1A2332]">{summaryEntry.commendations_processed}</p></div>
                              <div><p className="text-[#1A2332]/40">Last active</p><p className="font-medium text-[#1A2332]">{summaryEntry.last_active ? formatDateShort(summaryEntry.last_active) : 'Never'}</p></div>
                            </div>
                            <p className="text-[10px] text-[#1A2332]/30 mt-1">Last 30 days</p>
                          </div>
                        )}
                        {isExpanded && !summaryEntry && activitySummary.length > 0 && (
                          <div className="ml-3 mt-1 mb-2 px-3 py-2 bg-white border border-[#1A2332]/5 rounded-lg">
                            <p className="text-xs text-[#1A2332]/40">No activity data found for this steward in the last 30 days.</p>
                          </div>
                        )}
                        {isExpanded && activitySummary.length === 0 && !loadingActivitySummary && (
                          <div className="ml-3 mt-1 mb-2 px-3 py-2 bg-white border border-[#1A2332]/5 rounded-lg">
                            <p className="text-xs text-[#1A2332]/40">Click "Load activity" above to see steward metrics.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search + Status Filter + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
                  <input type="text" value={assignmentSearch} onChange={(e) => setAssignmentSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') fetchAssignments(); }} placeholder="Search by profile or steward..." className="pl-10 pr-4 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px] w-full sm:w-64" />
                </div>
                <select value={assignmentStatusFilter} onChange={(e) => { setAssignmentStatusFilter(e.target.value as 'all' | 'active' | 'inactive'); clearAssignmentSelection(); }} className="px-3 py-2 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]">
                  <option value="all">All Status ({assignmentTotals.total})</option>
                  <option value="active">Active ({assignmentTotals.active})</option>
                  <option value="inactive">Inactive ({assignmentTotals.total - assignmentTotals.active})</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchAssignments} disabled={loadingAssignments} className="flex items-center text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[44px] px-3">
                  <RefreshCw className={`w-4 h-4 ${loadingAssignments ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => { setShowAssignModal(true); setAssignFeedback(''); setSelectedAssignProfile(null); setProfileSearchInput(''); setProfileSearchResults([]); }} className="flex items-center px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors min-h-[44px] text-sm">
                  <UserPlus className="w-4 h-4 mr-2" />Assign Steward
                </button>
              </div>
            </div>

            {assignmentsError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-700">{assignmentsError}</p>
              </div>
            )}

            {/* v6B.12: Bulk deactivate progress */}
            {bulkDeactivating && (
              <div className="bg-white rounded-xl p-5 border border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                  <p className="text-sm font-medium text-[#1A2332]">Deactivating {bulkDeactivateProgress.completed} of {bulkDeactivateProgress.total}...</p>
                </div>
                <div className="w-full bg-[#1A2332]/10 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${bulkDeactivateProgress.total > 0 ? (bulkDeactivateProgress.completed / bulkDeactivateProgress.total) * 100 : 0}%` }} />
                </div>
                {bulkDeactivateProgress.failed > 0 && <p className="text-xs text-amber-600 mt-2">{bulkDeactivateProgress.failed} failed so far</p>}
              </div>
            )}

            {(() => {
              const filteredAssignments = assignmentStatusFilter === 'all' ? assignments : assignments.filter(a => assignmentStatusFilter === 'active' ? a.is_active : !a.is_active);
              const activeFilteredIds = filteredAssignments.filter(a => a.is_active).map(a => a.assignment_id);
              const allActiveSelected = activeFilteredIds.length > 0 && activeFilteredIds.every(id => selectedAssignmentIds.has(id));
              const someSelected = selectedAssignmentIds.size > 0;

              return loadingAssignments ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
                <p className="text-[#1A2332]/60 mt-4">Loading assignments...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[#1A2332]/10">
                <UserPlus className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
                <p className="text-[#1A2332]/60">No steward assignments found</p>
                <p className="text-sm text-[#1A2332]/40 mt-1">{assignmentStatusFilter !== 'all' ? 'Try changing the status filter.' : 'Use the "Assign Steward" button to create one.'}</p>
              </div>
            ) : (
              <div className="space-y-3 pb-20">
                {/* v6B.12: Select All header for assignments */}
                {activeFilteredIds.length > 0 && (
                  <div className="flex items-center gap-3 px-1">
                    <button onClick={() => toggleSelectAllAssignments(filteredAssignments)} className="flex items-center gap-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] min-h-[36px] transition-colors" disabled={bulkDeactivating}>
                      {allActiveSelected ? <CheckSquare className="w-5 h-5 text-red-500" /> : someSelected ? (
                        <div className="w-5 h-5 border-2 border-red-400 rounded bg-red-100 flex items-center justify-center"><Minus className="w-2.5 h-2.5 text-red-500" /></div>
                      ) : <Square className="w-5 h-5 text-[#1A2332]/30" />}
                      <span>{allActiveSelected ? 'Deselect all' : 'Select all active'}</span>
                    </button>
                    {someSelected && <span className="text-xs text-[#1A2332]/40">{selectedAssignmentIds.size} selected</span>}
                  </div>
                )}

                {filteredAssignments.map(a => {
                  const isSelected = selectedAssignmentIds.has(a.assignment_id);
                  return (
                  <div key={a.assignment_id} className={`bg-white rounded-xl p-5 border transition-colors ${isSelected ? 'border-red-300 ring-1 ring-red-200' : a.is_active ? 'border-[#1A2332]/10 hover:border-[#B8826D]/30' : 'border-[#1A2332]/5 opacity-60'}`}>
                    <div className="flex items-start gap-3">
                      {/* v6B.12: Checkbox for active assignments */}
                      {a.is_active && (
                        <button onClick={() => toggleAssignmentSelection(a.assignment_id)} className="mt-1 flex-shrink-0 min-h-[24px] min-w-[24px] flex items-center justify-center" disabled={bulkDeactivating}>
                          {isSelected ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-[#1A2332]/30 hover:text-[#1A2332]/50" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {a.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-[#1A2332]/5 text-[#1A2332]/50">{a.steward_type}</span>
                        </div>
                        <h3 className="font-medium text-[#1A2332]">{a.profile_name}</h3>
                        <p className="text-sm text-[#1A2332]/60 mt-1">
                          <Link2 className="w-3 h-3 inline mr-1" />
                          Steward: {a.steward_name || a.steward_email || 'Unknown'}
                          {a.steward_email && a.steward_name && <span className="text-[#1A2332]/40 ml-1">({a.steward_email})</span>}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-[#1A2332]/40">
                          <span>Assigned: {formatDateShort(a.assigned_at)}</span>
                          {a.assigned_by_email && <span>By: {a.assigned_by_email}</span>}
                          {!a.steward_user_id && <span className="text-amber-600">Invite pending</span>}
                        </div>
                        {a.deactivation_note && <p className="text-xs text-red-600 mt-1 italic">Note: {a.deactivation_note}</p>}
                      </div>
                      {a.is_active && (
                        <button onClick={() => { setDeactivateTarget(a); setDeactivateNote(''); setDeactivateFeedback(''); setShowDeactivateModal(true); }} className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors min-h-[36px] flex-shrink-0">
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            );
            })()}

            {/* v6B.12: Floating Bulk Deactivate Bar */}
            {selectedAssignmentIds.size > 0 && !bulkDeactivating && (
              <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#1A2332]/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-[#1A2332]">Selected: {selectedAssignmentIds.size}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setShowBulkDeactivateModal(true); setBulkDeactivateNote(''); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[40px] text-sm flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />Deactivate selected
                    </button>
                    <button onClick={clearAssignmentSelection} className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332]/60 rounded-lg hover:bg-[#F5F1E8] transition-colors min-h-[40px] text-sm">Clear</button>
                  </div>
                </div>
              </div>
            )}

            {/* v6B.12: Bulk Deactivate Confirmation Modal */}
            {showBulkDeactivateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
                      <h2 className="font-serif text-lg text-[#1A2332]">Deactivate {selectedAssignmentIds.size} assignment{selectedAssignmentIds.size !== 1 ? 's' : ''}</h2>
                    </div>
                    <p className="text-sm text-[#1A2332]/60 mt-2">This will deactivate the selected steward assignments. Each steward will be notified individually.</p>
                    <div className="mt-3 max-h-32 overflow-y-auto">
                      {Array.from(selectedAssignmentIds).map(id => {
                        const a = assignments.find(x => x.assignment_id === id);
                        return a ? (
                          <div key={id} className="text-xs text-[#1A2332]/60 py-1 border-b border-[#1A2332]/5 last:border-b-0">
                            {a.profile_name} — {a.steward_name || a.steward_email}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#1A2332] mb-1">Note (optional)</label>
                      <textarea value={bulkDeactivateNote} onChange={(e) => setBulkDeactivateNote(e.target.value)} placeholder="Reason for deactivation..." rows={3} className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 resize-none" />
                    </div>
                  </div>
                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8] flex justify-end gap-3">
                    <button onClick={() => setShowBulkDeactivateModal(false)} className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-white transition-colors min-h-[44px] text-sm">Cancel</button>
                    <button onClick={executeBulkDeactivateAssignments} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] text-sm flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />Deactivate {selectedAssignmentIds.size}
                    </button>
                  </div>
                </div>
              </div>
            )}




            {/* Assign Steward Modal (v6B.12: Search Picker) */}
            {showAssignModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                  <div className="p-6 border-b border-[#1A2332]/10 flex items-center justify-between">
                    <h2 className="font-serif text-xl text-[#1A2332]">Assign Steward to Profile</h2>
                    <button onClick={() => { setShowAssignModal(false); setSelectedAssignProfile(null); setProfileSearchInput(''); setProfileSearchResults([]); }} className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-[#1A2332]/50 bg-[#F5F1E8] rounded-lg px-4 py-3">
                      Assign someone you trust. You can change this later.
                    </p>

                    {/* v6B.12: Profile Search Picker */}
                    <div>
                      <label className="block text-sm font-medium text-[#1A2332] mb-1">Search profile</label>
                      {selectedAssignProfile ? (
                        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-[#8B9D83]/40 bg-[#8B9D83]/5">
                          <div className="flex items-center gap-3 min-w-0">
                            <CheckCircle className="w-5 h-5 text-[#8B9D83] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1A2332] truncate">{selectedAssignProfile.profile_name}</p>
                              <div className="flex items-center gap-2 text-xs text-[#1A2332]/50">
                                {selectedAssignProfile.country && <span>{selectedAssignProfile.country}</span>}
                                {selectedAssignProfile.era && <span>{selectedAssignProfile.era}</span>}
                                {selectedAssignProfile.status && <span className="px-1.5 py-0.5 bg-[#1A2332]/5 rounded">{selectedAssignProfile.status}</span>}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => { setSelectedAssignProfile(null); setAssignProfileId(''); setProfileSearchInput(''); }} className="text-[#1A2332]/40 hover:text-[#1A2332] min-h-[36px] min-w-[36px] flex items-center justify-center">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/40" />
                          <input
                            type="text"
                            value={profileSearchInput}
                            onChange={(e) => handleProfileSearchInputChange(e.target.value)}
                            placeholder="Type a name to search..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50"
                          />
                          {searchingProfiles && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 text-[#B8826D] animate-spin" />
                            </div>
                          )}
                          {/* Search Results Dropdown */}
                          {profileSearchResults.length > 0 && (
                            <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-[#1A2332]/20 shadow-lg max-h-60 overflow-y-auto">
                              {profileSearchResults.map((p: any) => (
                                <button
                                  key={p.profile_id}
                                  onClick={() => selectProfileForAssignment(p)}
                                  className="w-full text-left px-4 py-3 hover:bg-[#F5F1E8] transition-colors border-b border-[#1A2332]/5 last:border-b-0"
                                >
                                  <p className="text-sm font-medium text-[#1A2332]">{p.profile_name}</p>
                                  <div className="flex items-center gap-2 text-xs text-[#1A2332]/50 mt-0.5">
                                    {p.country && <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{p.country}</span>}
                                    {p.era && <span>{p.era}</span>}
                                    {p.roles && Array.isArray(p.roles) && p.roles.length > 0 && <span>{p.roles.slice(0, 2).join(', ')}</span>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {profileSearchInput.trim().length >= 2 && !searchingProfiles && profileSearchResults.length === 0 && (
                            <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-[#1A2332]/20 shadow-lg px-4 py-3">
                              <p className="text-sm text-[#1A2332]/40">No profiles found matching "{profileSearchInput}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A2332] mb-1">Steward Email</label>
                      <input type="email" value={assignStewardEmail} onChange={(e) => setAssignStewardEmail(e.target.value)} placeholder="steward@example.com" className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A2332] mb-1">Steward Name (optional)</label>
                      <input type="text" value={assignStewardName} onChange={(e) => setAssignStewardName(e.target.value)} placeholder="Display name..." className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50" />
                    </div>
                    {assignFeedback && (
                      <div className={`p-3 rounded-lg text-sm ${assignFeedback.includes('Assigned') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {assignFeedback}
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8] flex justify-end gap-3">
                    <button onClick={() => { setShowAssignModal(false); setSelectedAssignProfile(null); setProfileSearchInput(''); setProfileSearchResults([]); }} className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-white transition-colors min-h-[44px] text-sm">Cancel</button>
                    <button onClick={handleCreateAssignment} disabled={creatingAssignment || !assignProfileId.trim() || !assignStewardEmail.trim()} className="px-4 py-2 bg-[#8B9D83] text-white rounded-lg hover:bg-[#8B9D83]/90 transition-colors min-h-[44px] text-sm disabled:opacity-50 flex items-center">
                      {creatingAssignment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Deactivate Confirmation Modal */}
            {showDeactivateModal && deactivateTarget && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-[#1A2332]/10">
                    <h2 className="font-serif text-lg text-[#1A2332]">Deactivate Assignment</h2>
                    <p className="text-sm text-[#1A2332]/60 mt-1">
                      Remove <strong>{deactivateTarget.steward_name || deactivateTarget.steward_email}</strong> from <strong>{deactivateTarget.profile_name}</strong>?
                    </p>
                  </div>
                  <div className="p-6">
                    <label className="block text-sm font-medium text-[#1A2332] mb-1">Reason (optional)</label>
                    <textarea value={deactivateNote} onChange={(e) => setDeactivateNote(e.target.value)} placeholder="Why is this assignment being deactivated?" rows={3} className="w-full px-4 py-3 rounded-lg border border-[#1A2332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#B8826D]/50 resize-none" />
                    {deactivateFeedback && (
                      <div className="mt-3 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                        {deactivateFeedback}
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-[#1A2332]/10 bg-[#F5F1E8] flex justify-end gap-3">
                    <button onClick={() => { setShowDeactivateModal(false); setDeactivateTarget(null); }} className="px-4 py-2 border border-[#1A2332]/20 text-[#1A2332] rounded-lg hover:bg-white transition-colors min-h-[44px] text-sm">Cancel</button>
                    <button onClick={handleDeactivateAssignment} disabled={deactivating} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] text-sm disabled:opacity-50 flex items-center">
                      {deactivating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auth Events Tab */}
        {activeTab === 'auth_events' && (
          <AuthEventsDashboard onBack={() => setActiveTab('actions')} />
        )}

        {/* Safe Reset Tab (v6B.12: Global Stewards Only) */}
        {activeTab === 'safe_reset' && isGlobalSteward && (
          <SafeResetPanel
            userId={userId}
            userEmail={userEmail}
            isGlobalSteward={isGlobalSteward}
          />
        )}


      </div>
    </div>
  );
};

export default StewardOpsHub;
