import { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: () => void;
}

export default function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!displayName.trim()) {
          setError('Display name is required');
          setLoading(false);
          return;
        }
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
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
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-modal)',
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Join Zentrix Chat'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Display Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-4 text-center">
          <button
            onClick={onSwitchMode}
            className="text-sm transition-colors hover:underline"
            style={{ color: 'var(--accent-color)' }}
          >
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
