import { useState } from 'react';
import { X, Camera, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAvatarColor, getInitials } from '../../lib/utils';
import axios from 'axios';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateProfile, logout } = useAuth();
  const { socket } = useSocket();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [status, setStatus] = useState(user?.status || 'online');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateProfile({ avatar: res.data.fileUrl });
    } catch (err) {
      setError('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ displayName, status: status as 'online' | 'away' | 'offline' });
      socket?.emit('user:status', { status });
      onClose();
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--modal-backdrop)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-modal)',
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Profile
        </h2>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold"
              style={{
                backgroundColor: user.avatar ? 'transparent' : getAvatarColor(user.displayName),
                color: 'white',
              }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                getInitials(user.displayName)
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              <Camera size={14} style={{ color: 'white' }} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-10 px-4 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Email (read-only) */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full h-10 px-4 rounded-lg text-sm outline-none cursor-not-allowed"
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          />
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Status
          </label>
          <div className="flex gap-2">
            {(['online', 'away', 'offline'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className="flex-1 h-9 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  backgroundColor: status === s ? 'var(--bg-active)' : 'var(--bg-base)',
                  border: `1px solid ${status === s ? 'var(--accent-color)' : 'var(--border-subtle)'}`,
                  color: status === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{
                    backgroundColor:
                      s === 'online' ? 'var(--success)' : s === 'away' ? 'var(--warning)' : 'var(--text-muted)',
                  }}
                />
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleSave}
            className="w-full h-10 rounded-lg font-medium text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
          >
            Save Changes
          </button>

          <button
            onClick={handleLogout}
            className="w-full h-10 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            style={{ color: 'var(--danger)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
