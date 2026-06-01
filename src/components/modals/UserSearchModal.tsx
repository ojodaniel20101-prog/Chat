import { useState, useEffect } from 'react';
import { X, Search, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { getAvatarColor, getInitials } from '../../lib/utils';

interface UserSearchModalProps {
  onClose: () => void;
  onStartChat: (userId: number) => void;
}

interface SearchUser {
  id: number;
  displayName: string;
  email: string;
  avatar: string | null;
  status: string;
}

export default function UserSearchModal({ onClose, onStartChat }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/auth/users/search?q=${encodeURIComponent(searchQuery)}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'online': return 'var(--success)';
      case 'away': return 'var(--warning)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--modal-backdrop)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative max-h-[70vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-modal)',
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          New Chat
        </h2>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-4 rounded-full mb-4"
          style={{
            height: '44px',
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery.length < 2 ? (
                <>
                  <MessageCircle size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Search for users to start a chat
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No users found
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onStartChat(user.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-[var(--bg-hover)] text-left"
                >
                  <div className="relative">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        backgroundColor: user.avatar ? 'transparent' : getAvatarColor(user.displayName),
                        color: 'white',
                      }}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        getInitials(user.displayName)
                      )}
                    </div>
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                      style={{
                        backgroundColor: statusColor(user.status),
                        borderColor: 'var(--bg-card)',
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {user.displayName}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {user.email}
                    </p>
                  </div>
                  <MessageCircle size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
