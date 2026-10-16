import React, { useState } from 'react';
import { Plus, Check, Flame, Clock, Trash2, Edit3, X, Sparkles } from 'lucide-react';
import { playChime, playFanfare } from '../utils/sound';
import { fireCelebration, fireMajorCelebration } from '../utils/confetti';

const TIME_OF_DAY_ORDER = [
  { key: 'morning', label: 'Morning Routine', icon: '🌅', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { key: 'evening', label: 'Evening Routine', icon: '🌙', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { key: 'anytime', label: 'Anytime Habits', icon: '⏱️', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
];

const QUICK_ICONS = ['🌅', '💊', '🌿', '🪔', '📰', '🚶', '🏋️', '💻', '💧', '📚', '🩺', '☕', '🧘', '🧹', '🥗', '🍎'];

export default function HabitsView({
  habits,
  profiles,
  activeProfileId,
  selectedDate,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  seniorMode
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('✨');
  const [newTimeOfDay, setNewTimeOfDay] = useState('morning');
  const [newProfileId, setNewProfileId] = useState(activeProfileId !== 'wall' ? activeProfileId : 'mom');

  // Filter habits for current active profile, or show all if in wall mode
  const displayedHabits = activeProfileId === 'wall'
    ? habits
    : habits.filter((h) => h.profileId === activeProfileId);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isMom = activeProfileId === 'mom';

  const handleToggle = async (habit) => {
    // Optimistic sound & confetti
    if (!habit.isCompleted) {
      playChime();
      fireCelebration();

      // If this completes all habits for this profile, trigger fanfare!
      const remaining = displayedHabits.filter(h => h.id !== habit.id && !h.isCompleted);
      if (remaining.length === 0) {
        setTimeout(() => {
          playFanfare();
          fireMajorCelebration();
        }, 300);
      }
    }

    if (navigator.vibrate) {
      navigator.vibrate(40);
    }

    await onToggleHabit(habit.id, selectedDate);
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await onAddHabit({
      profileId: newProfileId,
      title: newTitle.trim(),
      icon: newIcon,
      timeOfDay: newTimeOfDay,
      targetDays: 'daily'
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  const completedCount = displayedHabits.filter((h) => h.isCompleted).length;
  const totalCount = displayedHabits.length;

  return (
    <div className="space-y-6">
      
      {/* Header bar with member context and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-black text-slate-900 dark:text-white tracking-tight ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
              Daily Habits Checklist
            </h3>
            {activeProfile && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {activeProfile.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auto-resets daily at midnight • {completedCount} of {totalCount} completed
          </p>
        </div>

        <button
          onClick={() => {
            setNewProfileId(activeProfileId !== 'wall' ? activeProfileId : 'mom');
            setShowAddModal(true);
          }}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition ${
            seniorMode ? 'min-h-[48px] text-sm' : ''
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Habit</span>
        </button>
      </div>

      {/* Habit Sections by Time of Day */}
      <div className="space-y-5">
        {TIME_OF_DAY_ORDER.map((timeSection) => {
          const sectionHabits = displayedHabits.filter((h) => h.timeOfDay === timeSection.key);
          if (sectionHabits.length === 0) return null;

          return (
            <div key={timeSection.key} className="space-y-2.5">
              
              {/* Section Header */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-base">{timeSection.icon}</span>
                <span className="uppercase tracking-wider">{timeSection.label}</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">({sectionHabits.length})</span>
              </div>

              {/* Habit Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectionHabits.map((habit) => {
                  const profile = profiles.find((p) => p.id === habit.profileId);
                  const isChecked = habit.isCompleted;

                  return (
                    <div
                      key={habit.id}
                      onClick={() => handleToggle(habit)}
                      className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs'
                          : isMom
                            ? 'bg-white dark:bg-slate-800/90 border-rose-200 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md'
                            : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                      } ${seniorMode ? 'p-4 sm:p-5' : ''}`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        {/* Checkbox Button */}
                        <div
                          className={`flex items-center justify-center rounded-xl transition-all ${
                            seniorMode ? 'w-10 h-10' : 'w-8 h-8'
                          } ${
                            isChecked
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                              : isMom
                                ? 'border-2 border-rose-400 dark:border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 group-hover:border-rose-600'
                                : 'border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 group-hover:border-blue-500'
                          }`}
                        >
                          {isChecked && (
                            <Check className={`stroke-[3.5] ${seniorMode ? 'w-6 h-6' : 'w-5 h-5'}`} />
                          )}
                        </div>

                        {/* Title and Icon */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xl sm:text-2xl leading-none">{habit.icon}</span>
                            <span
                              className={`font-semibold tracking-tight truncate ${
                                seniorMode ? 'text-lg' : 'text-sm sm:text-base'
                              } ${
                                isChecked
                                  ? 'text-slate-500 dark:text-slate-400 line-through'
                                  : isMom
                                    ? 'text-slate-900 dark:text-white font-bold'
                                    : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {habit.title}
                            </span>
                          </div>

                          {/* Profile tag if viewing Wall mode */}
                          {activeProfileId === 'wall' && profile && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                              <span>{profile.avatar}</span>
                              <span>{profile.name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Streak & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {habit.streak > 0 && (
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                              habit.streak >= 3
                                ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                            title={`${habit.streak} days consecutive streak!`}
                          >
                            <Flame className={`w-3.5 h-3.5 ${habit.streak >= 3 ? 'text-orange-500 fill-orange-500' : 'text-slate-500'}`} />
                            <span>{habit.streak}d</span>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Remove habit "${habit.title}"?`)) {
                              onDeleteHabit(habit.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title="Delete habit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}

        {displayedHabits.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
            <span className="text-4xl">🌱</span>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2">No habits tracked yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add your daily morning, walk, or medicine routine!</p>
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>✨</span>
                <span>Add Daily Habit</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="p-4 sm:p-5 space-y-4">
              
              {/* Whose habit is this? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Family Member
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewProfileId(p.id)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition ${
                        newProfileId === p.id
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Walk, BP Tablets, 3L Water..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              {/* Emoji Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Choose Icon
                </label>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  {QUICK_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewIcon(icon)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition ${
                        newIcon === icon
                          ? 'bg-white dark:bg-slate-700 shadow-sm ring-2 ring-blue-500 scale-110'
                          : 'hover:bg-white/80 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Time of Day
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OF_DAY_ORDER.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setNewTimeOfDay(t.key)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition ${
                        newTimeOfDay === t.key
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  Save Habit
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
