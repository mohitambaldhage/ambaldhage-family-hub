import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HouseScoreBanner from './components/HouseScoreBanner';
import HabitsView from './components/HabitsView';
import ChoresView from './components/ChoresView';
import FridgeBoardView from './components/FridgeBoardView';
import FamilyAssistantView from './components/FamilyAssistantView';
import GoogleCalendarView from './components/GoogleCalendarView';
import FamilyWallView from './components/FamilyWallView';
import KudosModal from './components/KudosModal';
import QrCodeModal from './components/QrCodeModal';
import LoginModal from './components/LoginModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import NotificationToast from './components/NotificationToast';
import { Sparkles, CheckSquare, ShoppingCart, Bot, Calendar, Monitor, Heart } from 'lucide-react';
import { playKudosSound } from './utils/sound';
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
    { id: 'you', name: 'You (Mohit)', role: 'You', avatar: '⚡', color: 'blue', highContrast: 0, fontSize: 'normal', email: 'mohit.ambaldhage@gmail.com' },
    { id: 'mom', name: 'Mom', role: 'Mom', avatar: '🌸', color: 'rose', highContrast: 1, fontSize: 'large', email: 'mom.ambaldhage@gmail.com' },
    { id: 'dad', name: 'Dad', role: 'Dad', avatar: '☕', color: 'amber', highContrast: 0, fontSize: 'normal', email: 'dad.ambaldhage@gmail.com' }
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

  // Easy to understand primary sections: 'habits' | 'chores' | 'groceries' | 'assistant' | 'calendar'
  const [activeTab, setActiveTab] = useState('habits');
  const [habits, setHabits] = useState([]);
  const [chores, setChores] = useState([]);
  const [groceries, setGroceries] = useState([]);
  const [notes, setNotes] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
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

  // Fetch helpers
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

  const loadCalendarEvents = useCallback(async () => {
    try {
      const res = await authFetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data || []);
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

  // Refresh everything
  const refreshAll = useCallback(() => {
    loadHabits(selectedDate);
    loadChores();
    loadGroceries();
    loadNotes();
    loadCalendarEvents();
    loadKudos();
    loadStats(selectedDate);
  }, [loadHabits, loadChores, loadGroceries, loadNotes, loadCalendarEvents, loadKudos, loadStats, selectedDate]);

  useEffect(() => {
    if (authToken && currentUser) {
      loadProfiles();
      loadNetworkInfo();
      refreshAll();
    }
  }, [authToken, currentUser, loadProfiles, loadNetworkInfo, refreshAll]);

  // Server-Sent Events (SSE) Real-Time Sync
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
        } else if (payload.type === 'HABIT_TOGGLED' || payload.type === 'HABITS_UPDATED') {
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
        } else if (payload.type === 'CALENDAR_UPDATED') {
          loadCalendarEvents();
        } else if (payload.type === 'KUDOS_SENT') {
          loadKudos();
          const kudos = payload.data;
          if (kudos.toId === activeProfileId) {
            playKudosSound();
            fireKudosHeart();
            addNotification(
              `Kudos from ${kudos.fromId.toUpperCase()}`,
              kudos.message || 'Sent you appreciation!',
              kudos.emoji || '❤️'
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
  }, [authToken, currentUser, selectedDate, activeProfileId, loadHabits, loadStats, loadChores, loadGroceries, loadNotes, loadCalendarEvents, loadKudos, loadProfiles, addNotification]);

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

  // Habit Actions
  const handleToggleHabit = async (id, date) => {
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

  // Chore Actions
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

  // Grocery Actions
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

  // Sticky Note Actions
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

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-4 text-neutral-900 dark:text-white">
        <div className="w-12 h-12 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-lg font-black mb-3">
          AH
        </div>
        <h2 className="text-base font-bold tracking-tight uppercase">Ambaldhage Family Hub</h2>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2">
          <span>Verifying private family session...</span>
        </div>
      </div>
    );
  }

  // Not Logged In
  if (!authToken || !currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  const pendingChoresCount = chores.filter((c) => !c.isCompleted).length;
  const pendingGroceriesCount = groceries.filter((g) => !g.isBought).length;

  return (
    <div className={`min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20 sm:pb-12 transition-colors duration-150 ${seniorMode ? 'senior-mode' : ''}`}>
      
      {/* Top Minimalist Navigation */}
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
        
        {/* Daily Team Score Progress Banner */}
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
            {/* Desktop Clean Minimalist Section Tabs */}
            <div className="hidden sm:flex items-center gap-1.5 mb-5 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <button
                onClick={() => setActiveTab('habits')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'habits'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daily Habits</span>
              </button>

              <button
                onClick={() => setActiveTab('chores')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'chores'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Chores & Tasks</span>
                {pendingChoresCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-[10px] font-mono flex items-center justify-center">
                    {pendingChoresCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('groceries')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'groceries'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Grocery List (Mom)</span>
                {pendingGroceriesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-[10px] font-mono flex items-center justify-center">
                    {pendingGroceriesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('assistant')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'assistant'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Assistant (Checklists)</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'calendar'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Google Calendar Sync</span>
              </button>
            </div>

            {/* Active Section Content */}
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

            {activeTab === 'groceries' && (
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

            {activeTab === 'assistant' && (
              <FamilyAssistantView
                activeProfileId={activeProfileId}
                profiles={profiles}
                authFetch={authFetch}
                onGroceriesAdded={loadGroceries}
                seniorMode={seniorMode}
              />
            )}

            {activeTab === 'calendar' && (
              <GoogleCalendarView
                profiles={profiles}
                activeProfileId={activeProfileId}
                authFetch={authFetch}
                calendarEvents={calendarEvents}
                chores={chores}
                onEventsUpdated={loadCalendarEvents}
                onProfileUpdated={loadProfiles}
                networkInfo={networkInfo}
                seniorMode={seniorMode}
              />
            )}

          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (thumb ergonomics, Clean B&W) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('habits');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeProfileId !== 'wall' && activeTab === 'habits'
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Habits</span>
        </button>

        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('chores');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeProfileId !== 'wall' && activeTab === 'chores'
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-400'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-[10px]">Chores</span>
        </button>

        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('groceries');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition relative ${
            activeProfileId !== 'wall' && activeTab === 'groceries'
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-400'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[10px]">Grocery</span>
          {pendingGroceriesCount > 0 && (
            <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
          )}
        </button>

        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('assistant');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeProfileId !== 'wall' && activeTab === 'assistant'
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-400'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span className="text-[10px]">Assistant</span>
        </button>

        <button
          onClick={() => {
            if (activeProfileId === 'wall') handleSelectProfile('you');
            setActiveTab('calendar');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
            activeProfileId !== 'wall' && activeTab === 'calendar'
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Calendar</span>
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
