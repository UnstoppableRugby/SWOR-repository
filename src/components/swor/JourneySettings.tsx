import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Users, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Save,
  Loader2,
  AlertCircle,
  Check,
  RotateCcw,
  Eye,
  Edit3,
  FileText,
  Wrench
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface Steward {
  email: string;
  name: string;
  permission: 'view' | 'suggest' | 'edit';
  isPrimary: boolean;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  field: string;
  previousValue?: string;
  newValue?: string;
  by: string;
}

interface JourneySettingsProps {
  journeyId: string;
  journeyType: 'individual' | 'club';
  isOwner: boolean;
}

const JourneySettings: React.FC<JourneySettingsProps> = ({
  journeyId,
  journeyType,
  isOwner
}) => {
  const { checkJourneyOwnership, isGlobalSteward, globalStewardInfo } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'stewards' | 'legacy' | 'audit'>('stewards');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Check if user has access (owner or global steward)
  const ownership = checkJourneyOwnership(journeyId);
  const hasAccess = isOwner || ownership.isGlobalSteward;

  // Steward states
  const [primaryStewardEmail, setPrimaryStewardEmail] = useState('');
  const [primaryStewardName, setPrimaryStewardName] = useState('');
  const [secondaryStewardEmail, setSecondaryStewardEmail] = useState('');
  const [secondaryStewardName, setSecondaryStewardName] = useState('');
  const [stewardPermission, setStewardPermission] = useState<'view' | 'suggest' | 'edit'>('suggest');

  // Legacy Mode states
  const [legacyModeEnabled, setLegacyModeEnabled] = useState(false);
  const [legacyModeConfirmed, setLegacyModeConfirmed] = useState(false);

  // Mock audit log
  const [auditLog] = useState<AuditEntry[]>([
    {
      id: '1',
      timestamp: '2026-01-30T14:23:00Z',
      action: 'Updated',
      field: 'Narrative',
      previousValue: 'Original text...',
      newValue: 'Updated text...',
      by: 'You'
    },
    {
      id: '2',
      timestamp: '2026-01-28T09:15:00Z',
      action: 'Added',
      field: 'Moment',
      newValue: 'First match at Newlands',
      by: 'You'
    },
    {
      id: '3',
      timestamp: '2026-01-25T16:45:00Z',
      action: 'Changed visibility',
      field: 'Photo gallery',
      previousValue: 'Private Draft',
      newValue: 'Public',
      by: 'You'
    }
  ]);

  const handleSaveStewards = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSuccess('Steward settings saved.');
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveLegacyMode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (legacyModeEnabled && !legacyModeConfirmed) {
      setError('Please confirm you understand Legacy Mode before enabling.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSuccess('Legacy Mode settings saved.');
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRollback = (entryId: string) => {
    // In production, this would revert the change
    alert('This would revert to the previous version.');
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

  // Only show if user is owner or global steward
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="border border-[#1A2332]/10 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-[#1A2332]/60" />
          <div className="text-left">
            <h3 className="text-sm font-medium text-[#1A2332]">Journey Settings</h3>
            <p className="text-xs text-[#1A2332]/50">Stewards, continuity & history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Global Steward Indicator */}
          {ownership.isGlobalSteward && (
            <span className="flex items-center text-xs text-[#B8826D] bg-[#B8826D]/10 px-2 py-1 rounded">
              <Wrench className="w-3 h-3 mr-1" />
              Builder
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#1A2332]/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#1A2332]/40" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="bg-white">
          {/* Global Steward Notice */}
          {ownership.isGlobalSteward && !isOwner && (
            <div className="bg-[#1A2332] px-4 py-2 flex items-center">
              <Wrench className="w-4 h-4 text-[#B8826D] mr-2" />
              <span className="text-xs text-[#F5F1E8]">
                Viewing as Global Steward ({globalStewardInfo?.name || 'Builder'})
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-[#1A2332]/10">
            <button
              onClick={() => setActiveTab('stewards')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'stewards'
                  ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                  : 'text-[#1A2332]/60 hover:text-[#1A2332]'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Stewards
            </button>
            <button
              onClick={() => setActiveTab('legacy')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'legacy'
                  ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                  : 'text-[#1A2332]/60 hover:text-[#1A2332]'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Legacy
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'text-[#B8826D] border-b-2 border-[#B8826D]'
                  : 'text-[#1A2332]/60 hover:text-[#1A2332]'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              History
            </button>
          </div>

          <div className="p-4">
            {success && (
              <div className="mb-4 flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                <Check className="w-4 h-4" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Stewards Tab */}
            {activeTab === 'stewards' && (
              <div className="space-y-4">
                <div className="bg-[#1A2332]/5 rounded-lg p-3">
                  <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                    Nominate trusted people who can care for this journey if something happens to you.
                  </p>
                </div>

                <form onSubmit={handleSaveStewards} className="space-y-4">
                  {/* Primary Steward */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#1A2332]">Primary Steward</label>
                    <input
                      type="text"
                      value={primaryStewardName}
                      onChange={(e) => setPrimaryStewardName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                      placeholder="Name"
                    />
                    <input
                      type="email"
                      value={primaryStewardEmail}
                      onChange={(e) => setPrimaryStewardEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                      placeholder="Email"
                    />
                  </div>

                  {/* Secondary Steward */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#1A2332]">Secondary Steward (optional)</label>
                    <input
                      type="text"
                      value={secondaryStewardName}
                      onChange={(e) => setSecondaryStewardName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                      placeholder="Name"
                    />
                    <input
                      type="email"
                      value={secondaryStewardEmail}
                      onChange={(e) => setSecondaryStewardEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                      placeholder="Email"
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A2332] mb-2">Steward Permissions</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 p-3 border border-[#1A2332]/10 rounded-lg cursor-pointer hover:border-[#1A2332]/20">
                        <input
                          type="radio"
                          name="permission"
                          value="view"
                          checked={stewardPermission === 'view'}
                          onChange={() => setStewardPermission('view')}
                          className="text-[#B8826D] focus:ring-[#B8826D]"
                        />
                        <div>
                          <span className="flex items-center space-x-2 text-sm font-medium text-[#1A2332]">
                            <Eye className="w-4 h-4" />
                            <span>View only</span>
                          </span>
                          <p className="text-xs text-[#1A2332]/50 mt-0.5">Can see the journey but cannot make changes</p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-[#1A2332]/10 rounded-lg cursor-pointer hover:border-[#1A2332]/20">
                        <input
                          type="radio"
                          name="permission"
                          value="suggest"
                          checked={stewardPermission === 'suggest'}
                          onChange={() => setStewardPermission('suggest')}
                          className="text-[#B8826D] focus:ring-[#B8826D]"
                        />
                        <div>
                          <span className="flex items-center space-x-2 text-sm font-medium text-[#1A2332]">
                            <FileText className="w-4 h-4" />
                            <span>Suggest edits</span>
                          </span>
                          <p className="text-xs text-[#1A2332]/50 mt-0.5">Can suggest changes for your approval (recommended)</p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-[#1A2332]/10 rounded-lg cursor-pointer hover:border-[#1A2332]/20">
                        <input
                          type="radio"
                          name="permission"
                          value="edit"
                          checked={stewardPermission === 'edit'}
                          onChange={() => setStewardPermission('edit')}
                          className="text-[#B8826D] focus:ring-[#B8826D]"
                        />
                        <div>
                          <span className="flex items-center space-x-2 text-sm font-medium text-[#1A2332]">
                            <Edit3 className="w-4 h-4" />
                            <span>Edit & publish</span>
                          </span>
                          <p className="text-xs text-[#1A2332]/50 mt-0.5">Can make and publish changes (Legacy Mode only)</p>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-[#1A2332]/50 mt-2">
                      Stewards can help organise and add context. Publishing changes requires Legacy Mode.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#8B9D83] text-white font-medium rounded-lg hover:bg-[#8B9D83]/90 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Steward Settings'}
                  </button>
                </form>
              </div>
            )}

            {/* Legacy Mode Tab */}
            {activeTab === 'legacy' && (
              <div className="space-y-4">
                <div className="bg-[#1A2332]/5 rounded-lg p-3">
                  <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                    Legacy Mode ensures continuity if you're unable to manage this journey in future.
                  </p>
                </div>

                <form onSubmit={handleSaveLegacyMode} className="space-y-4">
                  <label className="flex items-start space-x-3 p-4 border border-[#1A2332]/10 rounded-lg cursor-pointer hover:border-[#1A2332]/20">
                    <input
                      type="checkbox"
                      checked={legacyModeEnabled}
                      onChange={(e) => setLegacyModeEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-[#1A2332]/30 text-[#B8826D] focus:ring-[#B8826D]"
                    />
                    <div>
                      <span className="block text-sm font-medium text-[#1A2332]">Enable Legacy Mode</span>
                      <p className="text-xs text-[#1A2332]/50 mt-1">
                        If I'm no longer able to manage this, allow my Primary Steward to take over.
                      </p>
                    </div>
                  </label>

                  {legacyModeEnabled && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-amber-800 font-medium">How Legacy Mode works:</p>
                      <ul className="text-xs text-amber-700 space-y-1.5 ml-4 list-disc">
                        <li>Your steward can request Legacy Mode activation</li>
                        <li>You will be notified by email</li>
                        <li>A 14-day cool-down period applies</li>
                        <li>If you respond, activation is cancelled</li>
                        <li>If no response, steward access escalates</li>
                      </ul>
                      <label className="flex items-start space-x-3 pt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={legacyModeConfirmed}
                          onChange={(e) => setLegacyModeConfirmed(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-amber-800">
                          I understand how Legacy Mode works
                        </span>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (legacyModeEnabled && !legacyModeConfirmed)}
                    className="w-full py-2.5 bg-[#8B9D83] text-white font-medium rounded-lg hover:bg-[#8B9D83]/90 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Legacy Mode Settings'}
                  </button>

                  <p className="text-xs text-[#1A2332]/50 text-center">
                    You can change this setting at any time.
                  </p>
                </form>
              </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="bg-[#1A2332]/5 rounded-lg p-3">
                  <p className="text-sm text-[#1A2332]/70 leading-relaxed">
                    All changes are recorded. You can undo edits if needed.
                  </p>
                </div>

                {auditLog.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-3" />
                    <p className="text-sm text-[#1A2332]/60">No changes recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="border border-[#1A2332]/10 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-[#B8826D]">{entry.action}</span>
                              <span className="text-xs text-[#1A2332]/60">{entry.field}</span>
                            </div>
                            {entry.newValue && (
                              <p className="text-sm text-[#1A2332] line-clamp-2">{entry.newValue}</p>
                            )}
                            <p className="text-xs text-[#1A2332]/40 mt-1">
                              {formatDate(entry.timestamp)} by {entry.by}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRollback(entry.id)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-[#1A2332]/60 hover:text-[#B8826D] transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Undo</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneySettings;
