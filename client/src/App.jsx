import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HouseScoreBanner from './components/HouseScoreBanner';
import HabitsView from './components/HabitsView';
import ChoresView from './components/ChoresView';
import FridgeBoardView from './components/FridgeBoardView';
import FamilyWallView from './components/FamilyWallView';
import KudosModal from './components/KudosModal';
import QrCodeModal from './components/QrCodeModal';
import LoginModal from './components/LoginModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import NotificationToast from './components/NotificationToast';
import { Sparkles, CheckSquare, ShoppingCart, Monitor, Heart } from 'lucide-react';
import { playKudosSound, playChime } from './utils/sound';
import { fireKudosHeart } from './utils/confetti';

const API_BASE = ''; // proxied or relative

export default function App() {
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('family_auth_token') || sessionStorage.getItem('family_auth_token') || '';
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [profiles, setProfiles] = useState([
    { id: 'you', name: 'You (Mohit)', role: 'You', avatar: '⚡', color: 'blue', highContrast: 0, fontSize: 'normal' },
    { id: 'mom', name: 'Mom', role: 'Mom', avatar: '🌸', color: 'rose', highContrast: 1, fontSize: 'large' },
    { id: 'dad', name: 'Dad', role: 'Dad', avatar: '☕', color: 'amber', highContrast: 0, fontSize: 'normal' }
  ]);

  const [activeProfileId, setActiveProfileId] = useState(() => {
    return localStorage.getItem('family_profile') || 'you';
  });

  const [seniorMode, setSeniorMode] = useState(() => {
    return localStorage.getItem('senior_mode') === 'true';
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [activeTab, setActiveTab] = useState('habits'); // 'habits' | 'chores' | 'fridge'
  const [habits, setHabits] = useState([]);
  const [chores, setChores] = useState([]);
  const [groceries, setGroceries] = useState([]);
  const [notes, setNotes] = useState([]);
  const [kudosList, setKudosList] = useState([]);
  const [stats, setStats] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [kudosTargetId, setKudosTargetId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Authenticated Fetch Helper
  const authFetch = useCallback(
    async (endpoint, options = {}) => {
      const token = localStorage.getItem('family_auth_token') || sessionStorage.getItem('family_auth_token');
      const headers = {
        ...(options.headers || {}),
        ...(options.body && typeof options.body === 'string' && !options.headers?.['Content-Type']
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (res.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/me') {
        localStorage.removeItem('family_auth_token');
        sessionStorage.removeItem('family_auth_token');
        setAuthToken('');
        setCurrentUser(null);
      }

      return res;
    },
    []
  );

  // Sync dark mode with HTML root and document body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', String(darkMode));
  }, [darkMode]);

  // Check auth session on startup
  useEffect(() => {
    const token = localStorage.getItem('family_auth_token') || sessionStorage.getItem('family_auth_token');
    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
          setAuthToken(token);
          setActiveProfileId(data.user.id);
          if (data.user.highContrast) {
            setSeniorMode(true);
            localStorage.setItem('senior_mode', 'true');
          }
        } else {
          localStorage.removeItem('family_auth_token');
          sessionStorage.removeItem('family_auth_token');
          setAuthToken('');
          setCurrentUser(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  const handleLoginSuccess = (token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
    setActiveProfileId(user.id);
    if (user.highContrast) {
      setSeniorMode(true);
      localStorage.setItem('senior_mode', 'true');
    }
  };

  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('family_auth_token');
    sessionStorage.removeItem('family_auth_token');
    setAuthToken('');
    setCurrentUser(null);
  };

  const addNotification = useCallback((title, message, icon = '🔔') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, title, message, icon }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Fetch initial data
  const loadProfiles = useCallback(async () => {
    try {
      const res = await authFetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authFetch]);

  const loadHabits = useCallback(async (date) => {
    try {
      const res = await authFetch(`/api/habits?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setHabits(data.habits || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authFetch]);

  const loadChores = useCallback(async () => {
    try {
      const res = await authFetch('/api/chores');
      if (res.ok) {
        const data = await res.json();
        setChores(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authFetch]);

  const loadGroceries = useCallback(async () => {
    try {
      const res = await authFetch('/api/groceries');
      if (res.ok) {
        const data = await res.json();
        setGroceries(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authFetch]);

  const loadNotes = useCallback(async () => {
    try {
      const res = await authFetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authFetch]);

  const loadKudos = useCallback(async () => {
    try {
      const res = await authFetch('/api/kudos');
      if (res.ok) {
        const data = await res.json();
        setKudosList(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authFetch]);

  const loadStats = useCallback(async (date) => {
    try {
      const res = await authFetch(`/api/stats/today?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [authFetch]);

  const loadNetworkInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/network-info`);
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Refresh everything for selected date
  const refreshAll = useCallback(() => {
    loadHabits(selectedDate);
    loadChores();
    loadGroceries();
    loadNotes();
    loadKudos();
    loadStats(selectedDate);
  }, [loadHabits, loadChores, loadGroceries, loadNotes, loadKudos, loadStats, selectedDate]);

  useEffect(() => {
    if (authToken && currentUser) {
      loadProfiles();
      loadNetworkInfo();
      refreshAll();
    }
  }, [authToken, currentUser, loadProfiles, loadNetworkInfo, refreshAll]);

  // Server-Sent Events (SSE) for Real-Time Sync
  useEffect(() => {
    if (!authToken || !currentUser) {
      setIsConnected(false);
      return;
    }

    const sse = new EventSource(`${API_BASE}/api/events?token=${encodeURIComponent(authToken)}`);

    sse.onopen = () => {
      setIsConnected(true);
    };

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'CONNECTED') {
          setIsConnected(true);
        } else if (payload.type === 'HABIT_TOGGLED') {
          loadHabits(selectedDate);
          loadStats(selectedDate);
        } else if (payload.type === 'HABITS_UPDATED') {
          loadHabits(selectedDate);
          loadStats(selectedDate);
        } else if (payload.type === 'CHORE_TOGGLED' || payload.type === 'CHORES_UPDATED') {
          loadChores();
          loadStats(selectedDate);
        } else if (payload.type === 'GROCERY_UPDATED') {
          loadGroceries();
          loadStats(selectedDate);
        } else if (payload.type === 'NOTES_UPDATED') {
          loadNotes();
        } else if (payload.type === 'KUDOS_SENT') {
          loadKudos();
          const kudos = payload.data;
          const toMe = kudos.toId === activeProfileId;
          if (toMe) {
            playKudosSound();
            fireKudosHeart();
            addNotification(
              `${kudos.emoji} Kudos from ${kudos.fromId.toUpperCase()}`,
              kudos.message || 'Sent you appreciation!',
              kudos.emoji
            );
          }
        } else if (payload.type === 'PROFILES_UPDATED') {
          loadProfiles();
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    sse.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      sse.close();
    };
  }, [authToken, currentUser, selectedDate, activeProfileId, loadHabits, loadStats, loadChores, loadGroceries, loadNotes, loadKudos, loadProfiles, addNotification]);

  // Profile Selection & Device Memory
  const handleSelectProfile = (id) => {
    setActiveProfileId(id);
    if (id !== 'wall') {
      localStorage.setItem('family_profile', id);
      const targetProf = profiles.find((p) => p.id === id);
      if (targetProf && targetProf.highContrast) {
        setSeniorMode(true);
        localStorage.setItem('senior_mode', 'true');
      }
    }
  };

  const handleToggleSeniorMode = () => {
    setSeniorMode((prev) => {
      const next = !prev;
      localStorage.setItem('senior_mode', String(next));
      return next;
    });
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // API Actions
  const handleToggleHabit = async (id, date) => {
    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextCompleted = !h.isCompleted;
          return {
            ...h,
            isCompleted: nextCompleted,
            streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1)
          };
        }
        return h;
      })
    );

    try {
      await authFetch(`/api/habits/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });
      loadStats(date);
    } catch (e) {
      console.error(e);
      loadHabits(date);
    }
  };

  const handleAddHabit = async (data) => {
    try {
      await authFetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      loadHabits(selectedDate);
      loadStats(selectedDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHabit = async (id) => {
    try {
      await authFetch(`/api/habits/${id}`, { method: 'DELETE' });
      loadHabits(selectedDate);
      loadStats(selectedDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChore = async (id, completedById) => {
    try {
      await authFetch(`/api/chores/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedById })
      });
      loadChores();
      loadStats(selectedDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChore = async (data) => {
    try {
      await authFetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      loadChores();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChore = async (id) => {
    try {
      await authFetch(`/api/chores/${id}`, { method: 'DELETE' });
      loadChores();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGrocery = async (id, boughtById) => {
    try {
      await authFetch(`/api/groceries/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boughtById })
      });
      loadGroceries();
      loadStats(selectedDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGrocery = async (data) => {
    try {
      await authFetch('/api/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      loadGroceries();
      loadStats(selectedDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGrocery = async (id) => {
    try {
      await authFetch(`/api/groceries/${id}`, { method: 'DELETE' });
      loadGroceries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearBoughtGroceries = async () => {
    try {
      await authFetch('/api/groceries/clear-bought', { method: 'POST' });
      loadGroceries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (data) => {
    try {
      await authFetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePinNote = async (id, isPinned) => {
    try {
      await authFetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned })
      });
      loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await authFetch(`/api/notes/${id}`, { method: 'DELETE' });
      loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendKudos = async (data) => {
    try {
      await authFetch('/api/kudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      loadKudos();
    } catch (e) {
      console.error(e);
    }
  };

  // Loading Screen while verifying session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-3xl mb-4 animate-bounce">
          🏡
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Ambaldhage Family Hub</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying private family session...</span>
        </div>
      </div>
    );
  }

  // Not Logged In: Show Login Modal
  if (!authToken || !currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 sm:pb-12 transition-colors duration-200 ${seniorMode ? 'senior-mode' : ''}`}>
      
      {/* Top Navigation */}
      <Navbar
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        onOpenQrModal={() => setShowQrModal(true)}
        onOpenKudosModal={() => {
          setKudosTargetId(null);
          setShowKudosModal(true);
        }}
        seniorMode={seniorMode}
        onToggleSeniorMode={handleToggleSeniorMode}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        isConnected={isConnected}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        
        {/* Daily Team Score Banner */}
        <HouseScoreBanner
          stats={stats}
          selectedDate={selectedDate}
          onChangeDate={(date) => {
            setSelectedDate(date);
            loadHabits(date);
            loadStats(date);
          }}
          profiles={profiles}
          activeProfileId={activeProfileId}
        />

        {/* View Selection: If 'wall' is chosen, show Wall Display. Otherwise show Tabbed Views */}
        {activeProfileId === 'wall' ? (
          <FamilyWallView
            profiles={profiles}
            habits={habits}
            chores={chores}
            groceries={groceries}
            notes={notes}
            selectedDate={selectedDate}
            onToggleHabit={handleToggleHabit}
            onOpenKudosModal={(targetId) => {
              setKudosTargetId(targetId);
              setShowKudosModal(true);
            }}
            seniorMode={seniorMode}
          />
        ) : (
          <div>
            {/* Desktop Tabs */}
            <div className="hidden sm:flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('habits')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                  activeTab === 'habits'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Daily Habits</span>
              </button>

              <button
                onClick={() => setActiveTab('chores')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                  activeTab === 'chores'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Chores & Errands</span>
                {chores.filter(c => !c.isCompleted).length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center">
                    {chores.filter(c => !c.isCompleted).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('fridge')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                  activeTab === 'fridge'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>The Fridge Board</span>
                {groceries.filter(g => !g.isBought).length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold flex items-center justify-center">
                    {groceries.filter(g => !g.isBought).length}
                  </span>
                )}
              </button>
            </div>

            {/* Active Tab Content */}
            {activeTab === 'habits' && (
              <HabitsView
                habits={habits}
                profiles={profiles}
                activeProfileId={activeProfileId}
                selectedDate={selectedDate}
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
                seniorMode={seniorMode}
              />
            )}

            {activeTab === 'chores' && (
              <ChoresView
                chores={chores}
                profiles={profiles}
                activeProfileId={activeProfileId}
                onToggleChore={handleToggleChore}
                onAddChore={handleAddChore}
                onDeleteChore={handleDeleteChore}
                onOpenKudosModal={(targetId) => {
                  setKudosTargetId(targetId);
                  setShowKudosModal(true);
                }}
                seniorMode={seniorMode}
              />
            )}

            {activeTab === 'fridge' && (
              <FridgeBoardView
                groceries={groceries}
                notes={notes}
                profiles={profiles}
                activeProfileId={activeProfileId}
                onToggleGrocery={handleToggleGrocery}
                onAddGrocery={handleAddGrocery}
                onDeleteGrocery={handleDeleteGrocery}
                onClearBoughtGroceries={handleClearBoughtGroceries}
                onAddNote={handleAddNote}
                onTogglePinNote={handleTogglePinNote}
                onDeleteNote={handleDeleteNote}
                seniorMode={seniorMode}
              />
            )}
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (thumb ergonomics) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('habits');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeProfileId !== 'wall' && activeTab === 'habits'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">Habits</span>
        </button>

        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('chores');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeProfileId !== 'wall' && activeTab === 'chores'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px]">Chores</span>
        </button>

        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('fridge');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
            activeProfileId !== 'wall' && activeTab === 'fridge'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px]">Fridge</span>
          {groceries.filter(g => !g.isBought).length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => handleSelectProfile('wall')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeProfileId === 'wall'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Monitor className="w-5 h-5" />
          <span className="text-[10px]">Wall</span>
        </button>

        <button
          onClick={() => {
            setKudosTargetId(null);
            setShowKudosModal(true);
          }}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-rose-500"
        >
          <Heart className="w-5 h-5 fill-rose-500" />
          <span className="text-[10px] font-bold">Kudos</span>
        </button>
      </nav>

      {/* Modals & Notifications */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        authFetch={authFetch}
        currentUserName={currentUser?.name}
      />

      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        networkInfo={networkInfo}
      />

      <KudosModal
        isOpen={showKudosModal}
        onClose={() => setShowKudosModal(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        targetProfileId={kudosTargetId}
        kudosList={kudosList}
        onSendKudos={handleSendKudos}
      />

      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />

    </div>
  );
}
