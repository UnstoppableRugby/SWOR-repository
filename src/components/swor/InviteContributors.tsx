import React, { useState } from 'react';
import { 
  UserPlus, 
  Send, 
  X, 
  Check, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  name: string;
  relationship: string;
  type: 'context' | 'journey';
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
}

interface Contribution {
  id: string;
  from: string;
  relationship: string;
  content: string;
  type: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'declined';
}

interface InviteContributorsProps {
  journeyId: string;
  journeyType: 'individual' | 'club';
  ownerName: string;
}

const InviteContributors: React.FC<InviteContributorsProps> = ({
  journeyId,
  journeyType,
  ownerName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteType, setInviteType] = useState<'context' | 'journey'>('context');
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Mock data
  const [invitations, setInvitations] = useState<Invitation[]>([
    {
      id: '1',
      email: 'john@example.com',
      name: 'John Smith',
      relationship: 'Former teammate',
      type: 'context',
      status: 'pending',
      sentAt: '2026-01-28T10:00:00Z'
    }
  ]);

  const [contributions, setContributions] = useState<Contribution[]>([
    {
      id: '1',
      from: 'Mary Johnson',
      relationship: 'Club historian',
      content: 'I have photos from the 1985 tour that might be relevant.',
      type: 'suggestion',
      submittedAt: '2026-01-29T14:30:00Z',
      status: 'pending'
    }
  ]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteName.trim()) {
      setError('Please provide the person\'s name.');
      return;
    }
    if (!inviteRelationship.trim()) {
      setError('Please describe your relationship or their role.');
      return;
    }
    
    setSending(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newInvitation: Invitation = {
      id: Date.now().toString(),
      email: inviteEmail,
      name: inviteName,
      relationship: inviteRelationship,
      type: inviteType,
      status: 'pending',
      sentAt: new Date().toISOString()
    };

    setInvitations([...invitations, newInvitation]);
    setSuccess('Invitation sent successfully.');
    setInviteEmail('');
    setInviteName('');
    setInviteRelationship('');
    setInviteMessage('');
    setShowInviteForm(false);
    setSending(false);
    
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleApproveContribution = (id: string) => {
    setContributions(contributions.map(c => 
      c.id === id ? { ...c, status: 'approved' } : c
    ));
  };

  const handleDeclineContribution = (id: string) => {
    setContributions(contributions.map(c => 
      c.id === id ? { ...c, status: 'declined' } : c
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const pendingContributions = contributions.filter(c => c.status === 'pending');

  return (
    <div className="border border-[#1A2332]/10 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-[#F5F1E8] hover:bg-[#F5F1E8]/80 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <UserPlus className="w-5 h-5 text-[#1A2332]/60" />
          <div className="text-left">
            <h3 className="text-sm font-medium text-[#1A2332]">Invites & Contributions</h3>
            {pendingContributions.length > 0 && (
              <p className="text-xs text-[#B8826D]">
                {pendingContributions.length} pending review
              </p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#1A2332]/40" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#1A2332]/40" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-6 bg-white">
          {/* Info Banner */}
          <div className="bg-[#1A2332]/5 rounded-lg p-3">
            <p className="text-xs text-[#1A2332]/70 leading-relaxed">
              Contributions are suggestions until you approve them.
            </p>
          </div>

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <Check className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Invite Buttons */}
          {!showInviteForm && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setInviteType('context');
                  setShowInviteForm(true);
                }}
                className="p-4 border border-[#1A2332]/10 rounded-lg text-left hover:border-[#B8826D] transition-colors group"
              >
                <h4 className="text-sm font-medium text-[#1A2332] group-hover:text-[#B8826D]">
                  Invite someone to add context
                </h4>
                <p className="text-xs text-[#1A2332]/50 mt-1">
                  {journeyType === 'club' 
                    ? 'Trusted club members, historians or families'
                    : 'Teammates, colleagues or community members'}
                </p>
              </button>
              <button
                onClick={() => {
                  setInviteType('journey');
                  setShowInviteForm(true);
                }}
                className="p-4 border border-[#1A2332]/10 rounded-lg text-left hover:border-[#B8826D] transition-colors group"
              >
                <h4 className="text-sm font-medium text-[#1A2332] group-hover:text-[#B8826D]">
                  Invite someone to begin their own journey
                </h4>
                <p className="text-xs text-[#1A2332]/50 mt-1">
                  Pass it on and invite others to share their journeys.
                </p>
              </button>
            </div>
          )}

          {/* Invite Form */}
          {showInviteForm && (
            <form onSubmit={handleSendInvite} className="space-y-4 border border-[#1A2332]/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#1A2332]">
                  {inviteType === 'context' 
                    ? 'Invite someone to add context'
                    : 'Invite someone to begin their journey'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="text-[#1A2332]/40 hover:text-[#1A2332]"
                >
                  <X className="w-4 h-4" />
                </button>
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
                  className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
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
                  className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
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
                  className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm focus:outline-none focus:border-[#B8826D]"
                  placeholder="e.g., Former teammate, Club historian, Family member"
                />
                <p className="text-xs text-[#1A2332]/40 mt-1">
                  This helps us understand how they're connected.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1A2332]/70 mb-1">
                  Personal message (optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#1A2332]/20 rounded-lg text-sm resize-none focus:outline-none focus:border-[#B8826D]"
                  placeholder="Add a personal note to your invitation..."
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#B8826D] text-white rounded-lg hover:bg-[#B8826D]/90 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Pending Contributions */}
          {pendingContributions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#1A2332]">Pending Review</h4>
              {pendingContributions.map((contribution) => (
                <div key={contribution.id} className="border border-[#1A2332]/10 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{contribution.from}</p>
                      <p className="text-xs text-[#1A2332]/50">{contribution.relationship}</p>
                    </div>
                    <span className="text-xs text-[#1A2332]/40">
                      {formatDate(contribution.submittedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#1A2332]/70 mb-3">{contribution.content}</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveContribution(contribution.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[#8B9D83] text-white text-xs rounded-lg hover:bg-[#8B9D83]/90 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleDeclineContribution(contribution.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 border border-[#1A2332]/20 text-[#1A2332] text-xs rounded-lg hover:bg-[#1A2332]/5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sent Invitations */}
          {invitations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#1A2332]">Sent Invitations</h4>
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-[#F5F1E8] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1A2332]">{invitation.name}</p>
                    <p className="text-xs text-[#1A2332]/50">{invitation.relationship}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {invitation.status === 'pending' && (
                      <span className="flex items-center space-x-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                    {invitation.status === 'accepted' && (
                      <span className="flex items-center space-x-1 text-xs text-green-600">
                        <Check className="w-3 h-3" />
                        <span>Accepted</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InviteContributors;
