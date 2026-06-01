import { useState, useEffect } from 'react';
import { X, Search, Check, Users } from 'lucide-react';
import axios from 'axios';
import type { Conversation } from '../../pages/ChatApp';
import { getAvatarColor, getInitials } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface NewGroupModalProps {
  onClose: () => void;
  onGroupCreated: (conv: Conversation) => void;
}

interface SearchUser {
  id: number;
  displayName: string;
  email: string;
  avatar: string | null;
  status: string;
}

export default function NewGroupModal({ onClose, onGroupCreated }: NewGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/auth/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('Select at least one member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/conversations/group', {
        name: groupName,
        memberIds: selectedMembers,
      });

      const conv: Conversation = {
        id: res.data.id,
        type: 'group',
        name: res.data.name,
        avatar: res.data.avatar,
        status: null,
        lastSeen: null,
        participants: res.data.participants.map((p: any) => ({
          id: p.user?.id,
          displayName: p.user?.displayName,
          avatar: p.user?.avatar,
          status: p.user?.status,
          role: p.role,
        })),
        lastMessage: null,
        unreadCount: 0,
      };

      onGroupCreated(conv);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--modal-backdrop)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative max-h-[80vh] flex flex-col"
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
          New Group
        </h2>

        {/* Group Name */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="w-full h-10 px-4 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Search Members */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Add Members
          </label>
          <div
            className="flex items-center gap-2 px-3 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="flex-1 h-9 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Selected count */}
        {selectedMembers.length > 0 && (
          <div className="mb-2 text-xs" style={{ color: 'var(--accent-color)' }}>
            {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
          {searchResults.length === 0 && searchQuery.length >= 2 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No users found
            </p>
          ) : searchQuery.length < 2 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Type to search users
            </p>
          ) : (
            <div className="space-y-1">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleMember(u.id)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{
                      backgroundColor: u.avatar ? 'transparent' : getAvatarColor(u.displayName),
                      color: 'white',
                    }}
                  >
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      getInitials(u.displayName)
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {u.displayName}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {u.email}
                    </p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors"
                    style={{
                      borderColor: selectedMembers.includes(u.id) ? 'var(--accent-color)' : 'var(--border-subtle)',
                      backgroundColor: selectedMembers.includes(u.id) ? 'var(--accent-color)' : 'transparent',
                    }}
                  >
                    {selectedMembers.includes(u.id) && <Check size={12} style={{ color: 'white' }} />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full h-10 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  );
}
