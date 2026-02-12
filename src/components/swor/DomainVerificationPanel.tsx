import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, CheckCircle, XCircle, AlertTriangle, Clock, Copy, Check,
  RefreshCw, Loader2, Shield, ChevronDown, ChevronUp, ExternalLink,
  Plus, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DnsRecord {
  record?: string;
  name: string;
  type: string;
  ttl?: string;
  status: string;
  value: string;
  priority?: number;
  category: 'spf' | 'dkim' | 'dmarc' | 'other';
  is_verified: boolean;
}

interface DomainInfo {
  success: boolean;
  version?: string;
  configured_domain: string;
  from_address: string;
  domain_found: boolean;
  domain_id?: string;
  domain_status: string;
  domain_created_at?: string;
  domain_region?: string;
  records: DnsRecord[];
  is_verified?: boolean;
  is_pending?: boolean;
  is_failed?: boolean;
  guidance?: string;
  all_domains?: Array<{ id: string; name: string; status: string; created_at: string }>;
  error?: string;
  detail?: string;
}

const DomainVerificationPanel: React.FC = () => {
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showAllDomains, setShowAllDomains] = useState(false);

  const fetchDomainStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVerifyResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('swor-auth', {
        body: { action: 'check_domain_status' }
      });

      if (fnError) throw new Error(fnError.message || 'Failed to check domain status');
      if (!data?.success) throw new Error(data?.detail || data?.error || 'Failed to check domain status');

      setDomainInfo(data as DomainInfo);
    } catch (err: any) {
      setError(err.message || 'Failed to check domain status');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerifyDomain = async () => {
    setVerifying(true);
    setVerifyResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('swor-auth', {
        body: { action: 'verify_domain' }
      });

      if (fnError) throw new Error(fnError.message || 'Verification request failed');
      if (!data?.success) throw new Error(data?.detail || 'Verification request failed');

      setVerifyResult(data.message || 'Verification triggered successfully.');

      // Refresh status after a short delay to let Resend process
      setTimeout(() => fetchDomainStatus(), 2000);
    } catch (err: any) {
      setVerifyResult(`Error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSetupDomain = async () => {
    setSettingUp(true);
    setVerifyResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('swor-auth', {
        body: { action: 'setup_domain' }
      });

      if (fnError) throw new Error(fnError.message || 'Domain setup failed');
      if (!data?.success) throw new Error(data?.detail || 'Domain setup failed');

      setVerifyResult(data.message || 'Domain added successfully. Configure the DNS records below.');

      // Refresh to show the new records
      setTimeout(() => fetchDomainStatus(), 1500);
    } catch (err: any) {
      setVerifyResult(`Error: ${err.message}`);
    } finally {
      setSettingUp(false);
    }
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  useEffect(() => {
    fetchDomainStatus();
  }, [fetchDomainStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#8B9D83]/15 text-[#8B9D83] border border-[#8B9D83]/20">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Verified
          </span>
        );
      case 'pending':
      case 'not_started':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-4 h-4 mr-1.5" />
            Pending Verification
          </span>
        );
      case 'failed':
      case 'temporary_failure':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-4 h-4 mr-1.5" />
            Verification Failed
          </span>
        );
      case 'not_added':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#1A2332]/5 text-[#1A2332]/60 border border-[#1A2332]/10">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            Not Added
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#1A2332]/5 text-[#1A2332]/60 border border-[#1A2332]/10">
            <Info className="w-4 h-4 mr-1.5" />
            {status}
          </span>
        );
    }
  };

  const getRecordStatusIcon = (status: string) => {
    if (status === 'verified') return <CheckCircle className="w-4 h-4 text-[#8B9D83]" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'spf': return 'SPF (Sender Policy Framework)';
      case 'dkim': return 'DKIM (DomainKeys Identified Mail)';
      case 'dmarc': return 'DMARC (Domain-based Message Authentication)';
      default: return 'Other Records';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'spf': return 'Authorises Resend to send emails on behalf of your domain.';
      case 'dkim': return 'Cryptographically signs outgoing emails to prevent spoofing.';
      case 'dmarc': return 'Tells receiving servers how to handle unauthenticated emails.';
      default: return '';
    }
  };

  // Group records by category
  const groupedRecords: Record<string, DnsRecord[]> = {};
  if (domainInfo?.records) {
    for (const record of domainInfo.records) {
      const cat = record.category || 'other';
      if (!groupedRecords[cat]) groupedRecords[cat] = [];
      groupedRecords[cat].push(record);
    }
  }

  const categoryOrder = ['spf', 'dkim', 'dmarc', 'other'];
  const sortedCategories = categoryOrder.filter(c => groupedRecords[c]);

  const allRecordsVerified = domainInfo?.records?.every(r => r.is_verified) ?? false;
  const verifiedCount = domainInfo?.records?.filter(r => r.is_verified).length ?? 0;
  const totalRecords = domainInfo?.records?.length ?? 0;

  return (
    <div className="bg-white rounded-xl border border-[#1A2332]/10 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F5F1E8]/30 transition-colors min-h-[56px]"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            domainInfo?.is_verified
              ? 'bg-[#8B9D83]/10'
              : domainInfo?.is_failed
                ? 'bg-red-50'
                : 'bg-amber-50'
          }`}>
            <Globe className={`w-5 h-5 ${
              domainInfo?.is_verified
                ? 'text-[#8B9D83]'
                : domainInfo?.is_failed
                  ? 'text-red-500'
                  : 'text-amber-600'
            }`} />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-[#1A2332] text-sm">Email Domain Verification</h3>
            <p className="text-xs text-[#1A2332]/50 mt-0.5">
              {domainInfo?.configured_domain || 'smallworldofrugby.com'} &mdash; {domainInfo?.from_address || 'Loading...'}
            </p>

          </div>
        </div>
        <div className="flex items-center space-x-3">
          {domainInfo && !loading && getStatusBadge(domainInfo.domain_status)}
          {loading && <Loader2 className="w-5 h-5 text-[#B8826D] animate-spin" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#1A2332]/40" /> : <ChevronDown className="w-4 h-4 text-[#1A2332]/40" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#1A2332]/10">
          {/* Error state */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 text-sm font-medium">Failed to check domain status</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={fetchDomainStatus}
                  className="mt-2 text-sm text-red-700 underline hover:no-underline min-h-[36px]"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && !domainInfo && (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 text-[#B8826D] mx-auto animate-spin" />
              <p className="text-sm text-[#1A2332]/50 mt-3">Checking domain status with Resend...</p>
            </div>
          )}

          {/* Domain info loaded */}
          {domainInfo && !error && (
            <div className="mt-4 space-y-5">
              {/* Guidance banner */}
              {domainInfo.guidance && (
                <div className={`p-4 rounded-lg text-sm flex items-start ${
                  domainInfo.is_verified
                    ? 'bg-[#8B9D83]/5 border border-[#8B9D83]/20 text-[#1A2332]/80'
                    : domainInfo.is_failed
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}>
                  <Info className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                    domainInfo.is_verified ? 'text-[#8B9D83]' : domainInfo.is_failed ? 'text-red-500' : 'text-amber-600'
                  }`} />
                  <div>
                    <p>{domainInfo.guidance}</p>
                    {!domainInfo.is_verified && (
                      <p className="mt-2 text-xs opacity-75">
                        DNS changes can take up to 48 hours to propagate, though most complete within minutes.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#F5F1E8]/50 rounded-lg p-3">
                  <p className="text-xs text-[#1A2332]/50 mb-1">Domain</p>
                  <p className="text-sm font-medium text-[#1A2332]">{domainInfo.configured_domain}</p>
                </div>
                <div className="bg-[#F5F1E8]/50 rounded-lg p-3">
                  <p className="text-xs text-[#1A2332]/50 mb-1">Status</p>
                  <p className={`text-sm font-medium ${
                    domainInfo.is_verified ? 'text-[#8B9D83]' : domainInfo.is_failed ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {domainInfo.domain_status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                  </p>
                </div>
                <div className="bg-[#F5F1E8]/50 rounded-lg p-3">
                  <p className="text-xs text-[#1A2332]/50 mb-1">DNS Records</p>
                  <p className="text-sm font-medium text-[#1A2332]">
                    {verifiedCount}/{totalRecords} verified
                  </p>
                </div>
                <div className="bg-[#F5F1E8]/50 rounded-lg p-3">
                  <p className="text-xs text-[#1A2332]/50 mb-1">From Address</p>
                  <p className="text-sm font-medium text-[#1A2332] truncate">{domainInfo.from_address}</p>
                </div>
              </div>

              {/* Domain not added — show setup button */}
              {!domainInfo.domain_found && (
                <div className="bg-[#1A2332]/5 rounded-lg p-5 text-center">
                  <Globe className="w-10 h-10 text-[#1A2332]/30 mx-auto mb-3" />
                  <h4 className="font-medium text-[#1A2332] mb-2">Domain Not Registered</h4>
                  <p className="text-sm text-[#1A2332]/60 mb-4 max-w-md mx-auto">
                    The domain <strong>{domainInfo.configured_domain}</strong> needs to be added to Resend before it can be verified. 
                    This will generate the DNS records you need to configure.
                  </p>
                  <button
                    onClick={handleSetupDomain}
                    disabled={settingUp}
                    className="inline-flex items-center px-5 py-2.5 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    {settingUp ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Domain to Resend
                  </button>
                </div>
              )}

              {/* DNS Records */}
              {domainInfo.domain_found && sortedCategories.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[#1A2332] flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-[#1A2332]/40" />
                      Required DNS Records
                    </h4>
                    <span className="text-xs text-[#1A2332]/40">
                      Add these to your domain registrar's DNS settings
                    </span>
                  </div>

                  {sortedCategories.map(category => (
                    <div key={category} className="border border-[#1A2332]/10 rounded-lg overflow-hidden">
                      {/* Category header */}
                      <div className={`px-4 py-3 flex items-center justify-between ${
                        groupedRecords[category].every(r => r.is_verified)
                          ? 'bg-[#8B9D83]/5'
                          : 'bg-[#F5F1E8]/50'
                      }`}>
                        <div>
                          <h5 className="text-sm font-medium text-[#1A2332]">{getCategoryLabel(category)}</h5>
                          <p className="text-xs text-[#1A2332]/50 mt-0.5">{getCategoryDescription(category)}</p>
                        </div>
                        {groupedRecords[category].every(r => r.is_verified) ? (
                          <CheckCircle className="w-5 h-5 text-[#8B9D83] flex-shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Records in this category */}
                      <div className="divide-y divide-[#1A2332]/5">
                        {groupedRecords[category].map((record, idx) => {
                          const recordId = `${category}-${idx}`;
                          return (
                            <div key={recordId} className="px-4 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {getRecordStatusIcon(record.status)}
                                  <span className="text-xs font-mono px-2 py-0.5 bg-[#1A2332]/5 rounded text-[#1A2332]/70">
                                    {record.type}
                                  </span>
                                  {record.priority !== undefined && record.priority !== null && (
                                    <span className="text-xs text-[#1A2332]/40">
                                      Priority: {record.priority}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  record.is_verified
                                    ? 'bg-[#8B9D83]/10 text-[#8B9D83]'
                                    : record.status === 'failed'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {record.status === 'verified' ? 'Verified' : record.status === 'failed' ? 'Failed' : 'Pending'}
                                </span>
                              </div>

                              {/* Name field */}
                              <div className="mb-2">
                                <label className="block text-xs text-[#1A2332]/40 mb-1">Name / Host</label>
                                <div className="flex items-center">
                                  <code className="flex-1 text-xs bg-[#1A2332]/[0.03] border border-[#1A2332]/10 rounded-l-lg px-3 py-2.5 font-mono text-[#1A2332]/80 overflow-x-auto whitespace-nowrap min-h-[40px] flex items-center">
                                    {record.name}
                                  </code>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(record.name, `name-${recordId}`);
                                    }}
                                    className="px-3 py-2.5 bg-[#1A2332]/5 border border-l-0 border-[#1A2332]/10 rounded-r-lg hover:bg-[#1A2332]/10 transition-colors min-h-[40px] min-w-[44px] flex items-center justify-center"
                                    title="Copy to clipboard"
                                  >
                                    {copiedField === `name-${recordId}` ? (
                                      <Check className="w-4 h-4 text-[#8B9D83]" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-[#1A2332]/40" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Value field */}
                              <div>
                                <label className="block text-xs text-[#1A2332]/40 mb-1">Value / Content</label>
                                <div className="flex items-center">
                                  <code className="flex-1 text-xs bg-[#1A2332]/[0.03] border border-[#1A2332]/10 rounded-l-lg px-3 py-2.5 font-mono text-[#1A2332]/80 overflow-x-auto whitespace-nowrap min-h-[40px] flex items-center">
                                    {record.value}
                                  </code>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(record.value, `value-${recordId}`);
                                    }}
                                    className="px-3 py-2.5 bg-[#1A2332]/5 border border-l-0 border-[#1A2332]/10 rounded-r-lg hover:bg-[#1A2332]/10 transition-colors min-h-[40px] min-w-[44px] flex items-center justify-center"
                                    title="Copy to clipboard"
                                  >
                                    {copiedField === `value-${recordId}` ? (
                                      <Check className="w-4 h-4 text-[#8B9D83]" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-[#1A2332]/40" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* TTL */}
                              {record.ttl && (
                                <p className="text-xs text-[#1A2332]/40 mt-1.5">TTL: {record.ttl}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {domainInfo.domain_found && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!domainInfo.is_verified && (
                    <button
                      onClick={handleVerifyDomain}
                      disabled={verifying}
                      className="inline-flex items-center px-5 py-2.5 bg-[#B8826D] text-white rounded-lg text-sm font-medium hover:bg-[#B8826D]/90 transition-colors min-h-[44px] disabled:opacity-50"
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Verify Now
                    </button>
                  )}

                  <button
                    onClick={fetchDomainStatus}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2.5 border border-[#1A2332]/20 text-[#1A2332]/70 rounded-lg text-sm hover:bg-[#F5F1E8] transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </button>

                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2.5 border border-[#1A2332]/20 text-[#1A2332]/70 rounded-lg text-sm hover:bg-[#F5F1E8] transition-colors min-h-[44px]"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Resend Dashboard
                  </a>
                </div>
              )}

              {/* Verify result message */}
              {verifyResult && (
                <div className={`p-4 rounded-lg text-sm ${
                  verifyResult.startsWith('Error')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : verifyResult.includes('verified') || verifyResult.includes('already')
                      ? 'bg-[#8B9D83]/10 border border-[#8B9D83]/20 text-[#8B9D83]'
                      : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}>
                  {verifyResult}
                </div>
              )}

              {/* Other domains in Resend account */}
              {domainInfo.all_domains && domainInfo.all_domains.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowAllDomains(!showAllDomains)}
                    className="text-xs text-[#1A2332]/40 hover:text-[#1A2332]/60 transition-colors flex items-center min-h-[36px]"
                  >
                    {showAllDomains ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {domainInfo.all_domains.length} domain{domainInfo.all_domains.length !== 1 ? 's' : ''} in Resend account
                  </button>
                  {showAllDomains && (
                    <div className="mt-2 space-y-1">
                      {domainInfo.all_domains.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-xs px-3 py-2 bg-[#F5F1E8]/30 rounded-lg">
                          <span className="text-[#1A2332]/70 font-mono">{d.name}</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            d.status === 'verified'
                              ? 'bg-[#8B9D83]/10 text-[#8B9D83]'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Version footer */}
              {domainInfo.version && (
                <p className="text-xs text-[#1A2332]/30 pt-1">
                  swor-auth v{domainInfo.version}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DomainVerificationPanel;
