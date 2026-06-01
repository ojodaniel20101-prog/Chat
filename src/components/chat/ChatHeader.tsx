import { Search, Phone, Video, MoreVertical, Menu, WifiOff } from 'lucide-react';
import { useState } from 'react';
import type { Conversation } from '../../pages/ChatApp';
import { getAvatarColor, getInitials, formatTime } from '../../lib/utils';

interface ChatHeaderProps {
  conversation: Conversation;
  onToggleRightPanel: () => void;
  onBack: () => void;
  isMobile: boolean;
  connected: boolean;
}

export default function ChatHeader({
  conversation,
  onToggleRightPanel,
  onBack,
  connected,
}: ChatHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const otherParticipant = conversation.type === 'direct'
    ? conversation.participants?.find((p) => p.id !== undefined)
    : null;

  const statusColor =
    otherParticipant?.status === 'online'
      ? 'var(--success)'
      : otherParticipant?.status === 'away'
      ? 'var(--warning)'
      : 'var(--text-muted)';

  const statusText =
    otherParticipant?.status === 'online'
      ? 'Online'
      : 'Offline';

  return (
    <div
      className="shrink-0 flex items-center px-4"
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: Back + Avatar + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onBack}
          className="lg:hidden p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu size={20} />
        </button>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{
            backgroundColor: conversation.avatar ? 'transparent' : getAvatarColor(conversation.name || 'User'),
            color: 'white',
          }}
        >
          {conversation.avatar ? (
            <img src={conversation.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : conversation.type === 'group' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ) : (
            getInitials(conversation.name || 'User')
          )}
        </div>

        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {conversation.name || 'Unknown'}
          </h2>
          {conversation.type === 'direct' ? (
            <div className="flex items-center gap-1.5">
              {!connected && (
                <WifiOff size={10} style={{ color: 'var(--danger)' }} />
              )}
              <span className="text-xs" style={{ color: connected ? statusColor : 'var(--text-muted)' }}>
                {connected ? statusText : 'Connecting...'}
              </span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {conversation.participants?.length || 0} members
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search Toggle */}
        <div className={`flex items-center transition-all duration-200 ${showSearch ? 'w-48 mr-2' : 'w-0 overflow-hidden'}`}>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 px-3 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            autoFocus={showSearch}
          />
        </div>

        <button
          onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: showSearch ? 'var(--accent-color)' : 'var(--text-secondary)' }}
        >
          <Search size={18} />
        </button>

        <button
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] opacity-40 cursor-not-allowed"
          style={{ color: 'var(--text-secondary)' }}
          title="Coming soon"
        >
          <Phone size={18} />
        </button>

        <button
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] opacity-40 cursor-not-allowed"
          style={{ color: 'var(--text-secondary)' }}
          title="Coming soon"
        >
          <Video size={18} />
        </button>

        <button
          onClick={onToggleRightPanel}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}
