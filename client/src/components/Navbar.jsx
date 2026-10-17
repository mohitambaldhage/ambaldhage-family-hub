import React from 'react';
import { Wifi, QrCode, Heart, Sun, Moon, Key, LogOut, Calendar, Bot } from 'lucide-react';

export default function Navbar({
  profiles,
  activeProfileId,
  onSelectProfile,
  onOpenQrModal,
  onOpenKudosModal,
  seniorMode,
  onToggleSeniorMode,
  darkMode,
  onToggleDarkMode,
  isConnected,
  currentUser,
  onLogout,
  onOpenChangePassword
}) {
  return (
    <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30 transition-colors duration-150">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          
          {/* Brand & Connection Status */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-sm">
                AH
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
                    Ambaldhage Hub
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isConnected
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-black dark:bg-white animate-pulse' : 'bg-neutral-400'}`} />
                    Sync
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {currentUser ? `User: ${currentUser.name.split(' ')[0]}` : 'Family Dashboard'}
                </p>
              </div>
            </div>

            {/* Mobile quick action buttons */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                onClick={onToggleDarkMode}
                className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-md"
                title="Toggle Dark/Light"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggleSeniorMode}
                className={`text-[10px] font-bold px-2 py-1 rounded border ${seniorMode ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
                title="Large Font Mode"
              >
                A+
              </button>
              <button
                onClick={onOpenQrModal}
                className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-md"
                title="Connect Phone"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white rounded-md"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Switcher Pills (Simple Black & White) */}
          <div className="flex items-center flex-wrap justify-center gap-1 w-full sm:w-auto bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
            {profiles.map((p) => {
              const isActive = activeProfileId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProfile(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span className="text-sm leading-none">{p.avatar}</span>
                  <span>{p.name.split(' ')[0]}</span>
                </button>
              );
            })}

            <button
              onClick={() => onSelectProfile('wall')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeProfileId === 'wall'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
              title="Overview Wall Mode"
            >
              <span>📺</span>
              <span>All</span>
            </button>
          </div>

          {/* Desktop Right Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onToggleSeniorMode}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition ${
                seniorMode
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="Large text mode for easier reading"
            >
              {seniorMode ? 'Large Text: ON' : 'Large Text'}
            </button>

            <button
              onClick={onToggleDarkMode}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenQrModal}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title="Phone Wi-Fi QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenChangePassword}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title="Change Password"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
