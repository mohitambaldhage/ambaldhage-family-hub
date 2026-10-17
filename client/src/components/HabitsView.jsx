import React, { useState } from 'react';
import { Plus, Check, Clock, Trash2, X, Sparkles } from 'lucide-react';
import { playChime, playFanfare } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';

const TIME_OF_DAY_ORDER = [
  { key: 'morning', label: 'Morning Routine' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening Routine' },
  { key: 'anytime', label: 'Anytime Habits' }
];

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

  const displayedHabits = activeProfileId === 'wall'
    ? habits
    : habits.filter((h) => h.profileId === activeProfileId);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const handleToggle = async (habit) => {
    if (!habit.isCompleted) {
      playChime();
      fireCelebration();
    }
    if (navigator.vibrate) navigator.vibrate(30);
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
    <div className="space-y-4">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`font-bold tracking-tight text-neutral-900 dark:text-white ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
              Daily Habits Checklist
            </h2>
            {activeProfile && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                {activeProfile.name}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Auto-resets daily at midnight • {completedCount} of {totalCount} completed
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold transition self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Routine Sections */}
      {displayedHabits.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
          <p className="text-xs text-neutral-500">No habits found for this member. Tap "Add Habit" to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {TIME_OF_DAY_ORDER.map((tod) => {
            const timeHabits = displayedHabits.filter((h) => (h.timeOfDay || 'morning') === tod.key);
            if (timeHabits.length === 0) return null;

            return (
              <div key={tod.key} className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {tod.label} ({timeHabits.filter((h) => h.isCompleted).length}/{timeHabits.length})
                </h3>

                <div className="space-y-1.5">
                  {timeHabits.map((habit) => {
                    const isChecked = habit.isCompleted;
                    return (
                      <div
                        key={habit.id}
                        onClick={() => handleToggle(habit)}
                        className={`group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Minimalist B&W Checkbox */}
                          <div
                            className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition ${
                              isChecked
                                ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                                : 'border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                            }`}
                          >
                            {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-base leading-none">{habit.icon}</span>
                            <span
                              className={`text-sm font-semibold ${
                                isChecked
                                  ? 'line-through text-neutral-400 dark:text-neutral-500'
                                  : 'text-neutral-900 dark:text-white'
                              }`}
                            >
                              {habit.title}
                            </span>
                          </div>
                        </div>

                        {/* Right side: Streak and Delete */}
                        <div className="flex items-center gap-2">
                          {habit.streak > 0 && (
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                              🔥 {habit.streak}d
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteHabit(habit.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-black dark:hover:text-white transition"
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
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Create Daily Habit
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Habit Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Morning Walk, Tablets, Deep Reading"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Family Member
                  </label>
                  <select
                    value={newProfileId}
                    onChange={(e) => setNewProfileId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Time of Day
                  </label>
                  <select
                    value={newTimeOfDay}
                    onChange={(e) => setNewTimeOfDay(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="morning">Morning Routine</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening Routine</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Emoji Icon
                </label>
                <input
                  type="text"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-20 text-center text-lg px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold"
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
