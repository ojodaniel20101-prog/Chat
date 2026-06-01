import { LogOut, Shield } from 'lucide-react';
import type { Conversation } from '../../pages/ChatApp';
import { getAvatarColor, getInitials, formatTime } from '../../lib/utils';
import axios from 'axios';

interface RightPanelProps {
  conversation: Conversation;
  currentUserId: number;
}

export default function RightPanel({ conversation, currentUserId }: RightPanelProps) {
  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await axios.post(`/api/conversations/${conversation.id}/leave`);
      window.location.reload();
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'online': return 'var(--success)';
      case 'away': return 'var(--warning)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="h-full flex flex-col py-4">
      {/* Group Info */}
      <div className="flex flex-col items-center px-4 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-semibold mb-3"
          style={{
            backgroundColor: conversation.avatar ? 'transparent' : getAvatarColor(conversation.name || 'Group'),
            color: 'white',
          }}
        >
          {conversation.avatar ? (
            <img src={conversation.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            getInitials(conversation.name || 'G')
          )}
        </div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {conversation.name || 'Group'}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {conversation.participants?.length || 0} members
        </p>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          className="text-xs font-medium uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Members
        </div>
        <div className="space-y-1">
          {conversation.participants?.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 px-2 py-2 rounded-lg"
            >
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: participant.avatar ? 'transparent' : getAvatarColor(participant.displayName),
                    color: 'white',
                  }}
                >
                  {participant.avatar ? (
                    <img src={participant.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    getInitials(participant.displayName)
                  )}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    backgroundColor: statusColor(participant.status),
                    borderColor: 'var(--bg-surface)',
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {participant.displayName}
                    {participant.id === currentUserId && (
                      <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>(You)</span>
                    )}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {participant.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>

              {participant.role === 'admin' && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    color: 'var(--warning)',
                  }}
                >
                  <Shield size={10} />
                  Admin
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Group */}
      <div className="px-4 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={handleLeaveGroup}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            color: 'var(--danger)',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={16} />
          Leave Group
        </button>
      </div>
    </div>
  );
}
