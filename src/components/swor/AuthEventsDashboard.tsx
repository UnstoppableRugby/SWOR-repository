import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Search, Filter, RefreshCw, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, Trash2, ChevronDown, ChevronUp,
  Activity, Users, Mail, ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DomainVerificationPanel from './DomainVerificationPanel';

interface AuthEventsDashboardProps {
  onBack: () => void;
}

interface AuthEvent {
  id: string;
  event_type: string;
  email: string | null;
  success: boolean;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface SummaryStats {
  total_events: number;
  failure_count: number;
  failure_rate: number;
  most_active_emails: Array<{ email: string; count: number }>;
  newest_event_at: string | null;
  oldest_event_at: string | null;
  event_types: string[];
}

interface HealthInfo {
  total_rows: number;
  oldest_event_at: string | null;
  newest_event_at: string | null;
  version: string;
}

const AuthEventsDashboard: React.FC<AuthEventsDashboardProps> = ({ onBack }) => {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [emailSearch, setEmailSearch] = useState('');
  const [successFilter, setSuccessFilter] = useState<'all' | 'true' | 'false'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sort
  const [sortField, setSortField] = useState<'created_at' | 'event_type' | 'email'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Cleanup
  const [showCleanup, setShowCleanup] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Expanded row
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        action: 'get_auth_events',
        limit: 200,
        offset: 0,
      };

      if (eventTypeFilter !== 'all') payload.event_type_filter = eventTypeFilter;
      if (emailSearch.trim()) payload.email_search = emailSearch.trim();
      if (successFilter !== 'all') payload.success_filter = successFilter;
      if (dateFrom) payload.date_from = new Date(dateFrom).toISOString();
      if (dateTo) payload.date_to = new Date(dateTo + 'T23:59:59').toISOString();

      const { data, error: fnError } = await supabase.functions.invoke('swor-auth', { body: payload });

      if (fnError) throw new Error(fnError.message || 'Failed to fetch auth events');
      if (!data?.success) throw new Error(data?.detail || 'Failed to fetch auth events');

      setEvents(data.events || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load auth events');
    } finally {
      setLoading(false);
    }
  }, [eventTypeFilter, emailSearch, successFilter, dateFrom, dateTo]);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('swor-auth', {
        body: { action: 'auth_events_health' }
      });
      if (!fnError && data?.success) {
        setHealth(data);
      }
    } catch (_) {}
    setHealthLoading(false);
  }, []);

  const handleCleanup = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('swor-auth', {
        body: { action: 'cleanup_auth_events', retention_days: retentionDays }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.detail || 'Cleanup failed');

      setCleanupResult(
        `Removed ${data.deleted_count} events older than ${retentionDays} days. ${data.new_total_rows} events remain.`
      );

      // Refresh data
      fetchEvents();
      fetchHealth();
    } catch (err: any) {
      setCleanupResult(`Error: ${err.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchHealth();
  }, []);

  // Sort events locally
  const sortedEvents = [...events].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortField === 'event_type') {
      cmp = (a.event_type || '').localeCompare(b.event_type || '');
    } else if (sortField === 'email') {
      cmp = (a.email || '').localeCompare(b.email || '');
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-[#B8826D]" />
      : <ChevronUp className="w-3 h-3 text-[#B8826D]" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventTypeColor = (type: string) => {
    if (type.includes('success') || type === 'magic_link_sent' || type === 'session_validated') return 'text-[#8B9D83] bg-[#8B9D83]/10';
    if (type.includes('failed') || type.includes('error')) return 'text-red-600 bg-red-50';
    if (type === 'sign_out') return 'text-blue-600 bg-blue-50';
    if (type === 'auth_events_cleanup') return 'text-amber-600 bg-amber-50';
    return 'text-[#1A2332]/70 bg-[#1A2332]/5';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#B8826D]/10 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#B8826D]" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-[#1A2332]">Auth Events</h2>
            <p className="text-sm text-[#1A2332]/60">Authentication activity and diagnostics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchEvents(); fetchHealth(); }}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-[#1A2332]/60 hover:text-[#1A2332] hover:bg-[#1A2332]/5 rounded-lg transition-colors min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Domain Verification Panel */}
      <DomainVerificationPanel />


      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
            <p className="text-xs text-[#1A2332]/50 mb-1">Total Events</p>
            <p className="text-2xl font-semibold text-[#1A2332]">{summary.total_events}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
            <p className="text-xs text-[#1A2332]/50 mb-1">Failure Rate</p>
            <p className={`text-2xl font-semibold ${summary.failure_rate > 20 ? 'text-red-600' : summary.failure_rate > 5 ? 'text-amber-600' : 'text-[#8B9D83]'}`}>
              {summary.failure_rate}%
            </p>
            <p className="text-xs text-[#1A2332]/40 mt-0.5">{summary.failure_count} failures</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
            <p className="text-xs text-[#1A2332]/50 mb-1">Newest Event</p>
            <p className="text-sm font-medium text-[#1A2332]">
              {summary.newest_event_at ? formatDate(summary.newest_event_at) : 'None'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
            <p className="text-xs text-[#1A2332]/50 mb-1">Oldest Event</p>
            <p className="text-sm font-medium text-[#1A2332]">
              {summary.oldest_event_at ? formatDate(summary.oldest_event_at) : 'None'}
            </p>
          </div>
        </div>
      )}

      {/* Most Active Emails */}
      {summary && summary.most_active_emails.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
          <h3 className="text-sm font-medium text-[#1A2332] mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2 text-[#1A2332]/40" />
            Most Active Emails
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.most_active_emails.map(({ email, count }) => (
              <button
                key={email}
                onClick={() => { setEmailSearch(email); }}
                className="inline-flex items-center px-3 py-1.5 bg-[#F5F1E8] rounded-lg text-sm text-[#1A2332]/70 hover:bg-[#1A2332]/10 transition-colors min-h-[36px]"
              >
                <Mail className="w-3 h-3 mr-1.5 text-[#1A2332]/40" />
                <span className="truncate max-w-[180px]">{email}</span>
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-[#1A2332]/10 text-[#1A2332]/60">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table Health */}
      {health && (
        <div className="bg-[#8B9D83]/5 rounded-xl p-4 border border-[#8B9D83]/20 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center text-[#8B9D83]">
            <Shield className="w-4 h-4 mr-1.5" />
            Table Health
          </span>
          <span className="text-[#1A2332]/60">
            {health.total_rows} total rows
          </span>
          {health.oldest_event_at && (
            <span className="text-[#1A2332]/60">
              Oldest: {formatDate(health.oldest_event_at)}
            </span>
          )}
          <span className="text-[#1A2332]/40">v{health.version}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-[#1A2332]/10">
        <div className="flex items-center mb-3">
          <Filter className="w-4 h-4 text-[#1A2332]/40 mr-2" />
          <span className="text-sm font-medium text-[#1A2332]">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Event Type */}
          <div>
            <label className="block text-xs text-[#1A2332]/50 mb-1">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
            >
              <option value="all">All Types</option>
              {(summary?.event_types || []).map(type => (
                <option key={type} value={type}>{formatEventType(type)}</option>
              ))}
            </select>
          </div>

          {/* Email Search */}
          <div>
            <label className="block text-xs text-[#1A2332]/50 mb-1">Email Contains</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/30" />
              <input
                type="text"
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                placeholder="Search email..."
                inputMode="email"
                enterKeyHint="search"
                className="w-full pl-9 pr-3 py-2.5 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
              />
            </div>
          </div>

          {/* Success/Failure */}
          <div>
            <label className="block text-xs text-[#1A2332]/50 mb-1">Outcome</label>
            <select
              value={successFilter}
              onChange={(e) => setSuccessFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
            >
              <option value="all">All</option>
              <option value="true">Success</option>
              <option value="false">Failure</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs text-[#1A2332]/50 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs text-[#1A2332]/50 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1A2332]/10">
          <button
            onClick={() => {
              setEventTypeFilter('all');
              setEmailSearch('');
              setSuccessFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-sm text-[#1A2332]/50 hover:text-[#1A2332] transition-colors min-h-[44px] px-2"
          >
            Clear filters
          </button>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors min-h-[44px] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Search className="w-4 h-4 mr-1.5" />}
            Apply
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Events Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#B8826D] mx-auto animate-spin" />
          <p className="text-[#1A2332]/60 mt-4 text-sm">Loading auth events...</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#1A2332]/10">
          <Activity className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
          <p className="text-[#1A2332]/60">No auth events found</p>
          <p className="text-sm text-[#1A2332]/40 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F1E8]/50 border-b border-[#1A2332]/10">
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort('created_at')} className="flex items-center text-xs font-medium text-[#1A2332]/60 hover:text-[#1A2332] min-h-[36px]">
                      Time <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort('event_type')} className="flex items-center text-xs font-medium text-[#1A2332]/60 hover:text-[#1A2332] min-h-[36px]">
                      Event <SortIcon field="event_type" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort('email')} className="flex items-center text-xs font-medium text-[#1A2332]/60 hover:text-[#1A2332] min-h-[36px]">
                      Email <SortIcon field="email" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="text-xs font-medium text-[#1A2332]/60">Outcome</span>
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="text-xs font-medium text-[#1A2332]/60">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map(event => (
                  <React.Fragment key={event.id}>
                    <tr
                      className="border-b border-[#1A2332]/5 hover:bg-[#F5F1E8]/30 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)}
                    >
                      <td className="px-4 py-3 text-[#1A2332]/60 whitespace-nowrap">
                        {formatDate(event.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                          {formatEventType(event.event_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#1A2332]/70 max-w-[200px] truncate">
                        {event.email || <span className="text-[#1A2332]/30">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {event.success ? (
                          <span className="flex items-center text-[#8B9D83]">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-xs">OK</span>
                          </span>
                        ) : (
                          <span className="flex items-center text-red-500">
                            <XCircle className="w-4 h-4 mr-1" />
                            <span className="text-xs">Fail</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#1A2332]/50 text-xs max-w-[200px] truncate">
                        {event.error_message || '—'}
                      </td>
                    </tr>
                    {expandedRow === event.id && (
                      <tr className="bg-[#F5F1E8]/20">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[#1A2332]/40 block mb-1">IP Address</span>
                              <span className="text-[#1A2332]/70">{event.ip_address || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-[#1A2332]/40 block mb-1">User Agent</span>
                              <span className="text-[#1A2332]/70 break-all">{event.user_agent ? event.user_agent.substring(0, 120) : 'Unknown'}</span>
                            </div>
                            {event.error_message && (
                              <div className="col-span-2">
                                <span className="text-[#1A2332]/40 block mb-1">Error</span>
                                <span className="text-red-600 break-all">{event.error_message}</span>
                              </div>
                            )}
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="col-span-2">
                                <span className="text-[#1A2332]/40 block mb-1">Metadata</span>
                                <pre className="text-[#1A2332]/60 bg-white p-2 rounded border border-[#1A2332]/10 overflow-x-auto text-xs">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#1A2332]/5">
            {sortedEvents.map(event => (
              <div
                key={event.id}
                className="p-4 hover:bg-[#F5F1E8]/30 transition-colors"
                onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                    {formatEventType(event.event_type)}
                  </span>
                  {event.success ? (
                    <CheckCircle className="w-4 h-4 text-[#8B9D83] flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-[#1A2332]/70 truncate">{event.email || '—'}</p>
                <p className="text-xs text-[#1A2332]/40 mt-1">{formatDate(event.created_at)}</p>
                {event.error_message && (
                  <p className="text-xs text-red-500 mt-1 truncate">{event.error_message}</p>
                )}
                {expandedRow === event.id && (
                  <div className="mt-3 pt-3 border-t border-[#1A2332]/10 space-y-2 text-xs">
                    <div>
                      <span className="text-[#1A2332]/40">IP: </span>
                      <span className="text-[#1A2332]/70">{event.ip_address || 'Unknown'}</span>
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <pre className="text-[#1A2332]/60 bg-white p-2 rounded border border-[#1A2332]/10 overflow-x-auto text-xs">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-[#F5F1E8]/30 border-t border-[#1A2332]/10 flex items-center justify-between text-xs text-[#1A2332]/50">
            <span>Showing {sortedEvents.length} events</span>
          </div>
        </div>
      )}

      {/* Retention Cleanup */}
      <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
        <button
          onClick={() => setShowCleanup(!showCleanup)}
          className="w-full flex items-center justify-between px-4 py-4 text-sm font-medium text-[#1A2332]/70 hover:bg-[#F5F1E8]/30 transition-colors min-h-[52px]"
        >
          <span className="flex items-center">
            <Trash2 className="w-4 h-4 mr-2 text-[#1A2332]/40" />
            Retention Cleanup
          </span>
          {showCleanup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCleanup && (
          <div className="px-4 pb-4 space-y-4">
            <p className="text-sm text-[#1A2332]/60">
              Remove auth events older than the specified number of days. This is a permanent action.
            </p>

            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs text-[#1A2332]/50 mb-1">Retention Days</label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Math.max(1, parseInt(e.target.value) || 90))}
                  min={1}
                  max={365}
                  inputMode="numeric"
                  className="w-24 px-3 py-2.5 border border-[#1A2332]/20 rounded-lg bg-white text-sm min-h-[44px]"
                />
              </div>
              <button
                onClick={handleCleanup}
                disabled={cleanupLoading}
                className="flex items-center px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {cleanupLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1.5" />
                )}
                Run Cleanup
              </button>
            </div>

            {cleanupResult && (
              <div className={`p-3 rounded-lg text-sm ${cleanupResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-[#8B9D83]/10 text-[#8B9D83]'}`}>
                {cleanupResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthEventsDashboard;
