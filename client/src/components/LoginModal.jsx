import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Heart, Sparkles, UserCheck } from 'lucide-react';

export default function LoginModal({ onLoginSuccess }) {
  const [members, setMembers] = useState([
    { id: 'you', name: 'You (Mohit)', avatar: '⚡', color: 'blue' },
    { id: 'mom', name: 'Mom', avatar: '🌸', color: 'rose' },
    { id: 'dad', name: 'Dad', avatar: '☕', color: 'amber' }
  ]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('family_profile') || 'you');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch updated members list if available
  useEffect(() => {
    fetch('/api/auth/members')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (data && data.length > 0) {
          setMembers(data);
          if (!selectedId) setSelectedId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password or 4-digit PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Incorrect password.');
      }

      if (rememberMe) {
        localStorage.setItem('family_auth_token', data.token);
        localStorage.setItem('family_profile', selectedId);
      } else {
        sessionStorage.setItem('family_auth_token', data.token);
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedId) || members[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Header Banner */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 pt-8 pb-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-2 right-3 opacity-15 pointer-events-none">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-3xl shadow-inner border border-white/20">
            🏡
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Ambaldhage Family Hub</h2>
          <p className="text-xs text-blue-100/90 mt-1 flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Private Family Portal • Sign in to continue
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Member Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Who is logging in?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {members.map((m) => {
                const isSelected = selectedId === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id);
                      setError('');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-sm scale-102 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-2xl mb-1">{m.avatar}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate w-full">
                      {m.name.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <span className="mt-1 flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        <UserCheck className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password or Passcode for {selectedMember?.name.split(' ')[0]}
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (default: 1234)"
                autoFocus
                className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 dark:border-slate-700 focus:ring-blue-500"
              />
              <span>Remember me on this phone/device</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Family Hub</span>
                <span>→</span>
              </>
            )}
          </button>

          {/* Helpful family hint */}
          <div className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            💡 Default passcode is <span className="font-mono font-bold text-slate-700 dark:text-slate-300">1234</span> or <span className="font-mono font-bold text-slate-700 dark:text-slate-300">ambaldhage</span>. You can change your password anytime inside the dashboard!
          </div>

        </form>

      </div>
    </div>
  );
}
