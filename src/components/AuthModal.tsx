import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: { id: string; email: string; name: string; role: 'user' | 'admin' }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { email, password, name, role };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const prefillDemo = (selectedRole: 'user' | 'admin') => {
    setIsLogin(true);
    if (selectedRole === 'admin') {
      setEmail('admin@aether.com');
      setPassword('admin123');
    } else {
      setEmail('user@aether.com');
      setPassword('user123');
    }
  };

  // Automated Quick Demo Register function
  const handleQuickRegister = async (selectedRole: 'user' | 'admin') => {
    setError('');
    setLoading(true);
    const demoEmail = `${selectedRole}_demo_${Math.floor(Math.random() * 10000)}@aether.com`;
    const demoPassword = 'password123';
    const demoName = selectedRole === 'admin' ? 'Demo Admin Staff' : 'Demo Customer';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword, name: demoName, role: selectedRole })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Quick registration failed');
      }

      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div 
        id="auth-modal-container"
        className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <button 
          id="auth-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="auth-modal-title" className="text-2xl font-serif tracking-tight text-neutral-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p id="auth-modal-desc" className="text-sm text-neutral-500 mt-1">
            {isLogin ? 'Welcome back! Sign in to access your dashboard and tracker.' : 'Join us today to book services and shop our collections.'}
          </p>
        </div>

        {error && (
          <div id="auth-modal-error" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 transition"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">Account Type</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  id="auth-role-user"
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-4 rounded-xl text-sm border font-medium transition ${role === 'user' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
                >
                  Customer User
                </button>
                <button
                  id="auth-role-admin"
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-4 rounded-xl text-sm border font-medium transition ${role === 'admin' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
                >
                  Store Admin
                </button>
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-xl text-sm transition mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            id="auth-toggle-mode"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-neutral-500 hover:text-neutral-900 transition font-medium underline underline-offset-4"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>

        {/* Quick Demo Credentials Panel */}
        <div id="demo-credentials-panel" className="mt-6 pt-5 border-t border-neutral-100">
          <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2 text-center">Demo Fast-Track Profiles</h4>
          <p className="text-[11px] text-neutral-500 text-center mb-3">Instantly register or sign in a demo user/admin account with a single click:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="demo-user-quick-btn"
              onClick={() => handleQuickRegister('user')}
              className="py-1.5 px-3 bg-neutral-50 hover:bg-neutral-100 text-xs font-medium text-neutral-700 border border-neutral-200 rounded-lg transition text-center"
            >
              🚀 Demo Customer
            </button>
            <button
              id="demo-admin-quick-btn"
              onClick={() => handleQuickRegister('admin')}
              className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-lg transition text-center"
            >
              👑 Demo Store Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
