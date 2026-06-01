import { Search, MessageSquare, Plus, Users, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Conversation } from '../../pages/ChatApp';
import { getAvatarColor, getInitials, formatTime } from '../../lib/utils';

interface SidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onShowProfile: () => void;
  onShowNewGroup: () => void;
  onShowUserSearch: () => void;
  onLogout: () => void;
  user: { id: number; displayName: string; email: string; avatar: string | null; status: string };
}

export default function Sidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  onShowProfile,
  onShowNewGroup,
  onShowUserSearch,
  user,
}: SidebarProps) {
  const { logout } = useAuth();

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* App Branding */}
      <div
        className="flex items-center justify-between px-5 shrink-0"
        style={{ height: '64px', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
            Zentrix<span className="font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>Chat</span>
          </span>
        </div>
        <button
          onClick={onShowProfile}
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-transform hover:scale-105"
          style={{ backgroundColor: getAvatarColor(user.displayName), color: 'white' }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            getInitials(user.displayName)
          )}
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{
              backgroundColor: user.status === 'online' ? 'var(--success)' : user.status === 'away' ? 'var(--warning)' : 'var(--text-muted)',
              borderColor: 'var(--bg-surface)',
            }}
          />
        </button>
      </div>

      {/* Navigation */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="text-xs font-medium uppercase tracking-widest mb-3 px-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Navigation
        </div>
        <nav className="space-y-1">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--bg-active)',
              color: 'var(--text-primary)',
              borderLeft: '3px solid var(--accent-color)',
            }}
          >
            <MessageSquare size={18} style={{ color: 'var(--accent-color)' }} />
            <span>Chats</span>
          </button>
          <button
            onClick={onShowUserSearch}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Users size={18} />
            <span>New Chat</span>
          </button>
          <button
            onClick={onShowNewGroup}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Plus size={18} />
            <span>New Group</span>
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-2.5 px-4 rounded-full"
          style={{
            height: '40px',
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div
          className="text-xs font-medium uppercase tracking-widest mb-2 px-5 pt-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Conversations
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No conversations yet</p>
              <button
                onClick={onShowUserSearch}
                className="mt-3 text-sm hover:underline"
                style={{ color: 'var(--accent-color)' }}
              >
                Start a chat
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left"
                  style={{
                    backgroundColor: activeConversation?.id === conv.id ? 'var(--bg-hover)' : 'transparent',
                  }}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 self-start">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        backgroundColor: conv.avatar ? 'transparent' : getAvatarColor(conv.name || 'User'),
                        color: 'white',
                      }}
                    >
                      {conv.avatar ? (
                        <img src={conv.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : conv.type === 'group' ? (
                        <Users size={20} />
                      ) : (
                        getInitials(conv.name || 'User')
                      )}
                    </div>
                    {conv.type === 'direct' && conv.status && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor:
                            conv.status === 'online'
                              ? 'var(--success)'
                              : conv.status === 'away'
                              ? 'var(--warning)'
                              : 'var(--text-muted)',
                          borderColor: activeConversation?.id === conv.id ? 'var(--bg-hover)' : 'var(--bg-surface)',
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {conv.name || 'Unknown'}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {conv.lastMessage
                          ? conv.type === 'group'
                            ? `${conv.lastMessage.senderName}: ${conv.lastMessage.content}`
                            : conv.lastMessage.content
                          : 'No messages yet'}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span
                          className="ml-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{ backgroundColor: 'var(--accent-color)', color: 'white', padding: '0 5px' }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
