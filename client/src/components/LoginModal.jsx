import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';

export default function LoginModal({ onLoginSuccess }) {
  const [members, setMembers] = useState([
    { id: 'you', name: 'You (Mohit)', avatar: '⚡' },
    { id: 'mom', name: 'Mom', avatar: '🌸' },
    { id: 'dad', name: 'Dad', avatar: '☕' }
  ]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('family_profile') || 'you');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        
        {/* Simple Monochrome Header */}
        <div className="bg-black text-white dark:bg-neutral-950 p-6 text-center border-b border-neutral-800">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white text-black font-black flex items-center justify-center text-lg">
            AH
          </div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Ambaldhage Family Hub</h2>
          <p className="text-xs text-neutral-400 mt-1 flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Sign in to your personal dashboard
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Member Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Select Family Member
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center ${
                      isSelected
                        ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 ring-2 ring-black dark:ring-white'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <span className="text-2xl mb-1">{m.avatar}</span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate w-full">
                      {m.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Passcode for {selectedMember?.name.split(' ')[0]}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (default: 1234)"
                autoFocus
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold">
              {error}
            </div>
          )}

          {/* Remember Me */}
          <div className="flex items-center text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-neutral-300 accent-black dark:accent-white"
              />
              <span>Remember me on this phone/device</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Default passcode hint */}
          <div className="text-center text-[11px] text-neutral-400 dark:text-neutral-500 pt-1">
            Default passcode is <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">1234</span> or <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">ambaldhage</span>
          </div>

        </form>

      </div>
    </div>
  );
}
