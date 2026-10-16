import React from 'react';
import { Wifi, QrCode, Heart, Eye, Smartphone, Monitor, Sun, Moon, Key, LogOut, Lock } from 'lucide-react';

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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand & Connection Status */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 text-lg">
                🏡
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Ambaldhage Family Hub
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      isConnected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}
                    title={isConnected ? 'Connected to local Wi-Fi sync' : 'Connecting to Wi-Fi...'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    Wi-Fi
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Private Family Dashboard • {currentUser ? `Signed in as ${currentUser.name.split(' ')[0]}` : 'Protected'}
                </p>
              </div>
            </div>

            {/* Mobile quick actions */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                onClick={onToggleDarkMode}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <button
                onClick={onOpenChangePassword}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Change Password"
              >
                <Key className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                title="Lock / Sign Out"
              >
                <LogOut className="w-5 h-5 text-slate-500 hover:text-rose-500" />
              </button>
              <button
                onClick={onOpenQrModal}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Connect another phone"
              >
                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                onClick={onOpenKudosModal}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                title="Send Kudos"
              >
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </button>
            </div>
          </div>

          {/* Profile Switcher Pills */}
          <div className="flex items-center flex-wrap justify-center gap-1.5 w-full sm:w-auto bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 transition-colors">
            {profiles.map((p) => {
              const isActive = activeProfileId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProfile(p.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-600 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-base leading-none">{p.avatar}</span>
                  <span>{p.name.split(' ')[0]}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                </button>
              );
            })}

            {/* Wall / Fridge Overview button */}
            <button
              onClick={() => onSelectProfile('wall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                activeProfileId === 'wall'
                  ? 'bg-blue-600 text-white shadow-sm scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
              title="Overview wall mode for tablet or TV"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Fridge Wall</span>
            </button>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-2">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-2xs"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Change Password */}
            <button
              onClick={onOpenChangePassword}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 transition shadow-2xs"
              title="Change Password / Passcode"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Senior View Toggle */}
            <button
              onClick={onToggleSeniorMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                seniorMode
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Toggle Large Font & High Contrast for Mom"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{seniorMode ? 'Large Text On' : 'Senior View'}</span>
            </button>

            {/* Kudos Button */}
            <button
              onClick={onOpenKudosModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shadow-2xs"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Send Kudos</span>
            </button>

            {/* QR Code Button */}
            <button
              onClick={onOpenQrModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 border dark:border-slate-700 transition shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-300" />
              <span>QR Code</span>
            </button>

            {/* Lock / Sign Out */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shadow-2xs"
              title="Lock dashboard & sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
