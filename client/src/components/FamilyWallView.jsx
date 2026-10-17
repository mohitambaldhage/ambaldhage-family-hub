import React from 'react';
import { Check, ShoppingCart, StickyNote } from 'lucide-react';
import { playChime } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';

export default function FamilyWallView({
  profiles,
  habits,
  chores,
  groceries,
  notes,
  selectedDate,
  onToggleHabit,
  onOpenKudosModal,
  seniorMode
}) {
  const pendingGroceries = groceries.filter((g) => !g.isBought);

  const handleToggle = async (habit) => {
    if (!habit.isCompleted) {
      playChime();
      fireCelebration();
    }
    await onToggleHabit(habit.id, selectedDate);
  };

  return (
    <div className="space-y-4">
      
      {/* Wall Header */}
      <div className="bg-black text-white dark:bg-neutral-900 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg tracking-tight uppercase">
              Shared Household Wall Display
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              Overview Mode
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time household overview for all family members at a glance.
          </p>
        </div>
      </div>

      {/* 3 Family Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const memberHabits = habits.filter((h) => h.profileId === profile.id);
          const memberChores = chores.filter((c) => c.assigneeId === profile.id && !c.isCompleted);
          const completedCount = memberHabits.filter((h) => h.isCompleted).length;
          const percentage = memberHabits.length > 0 ? Math.round((completedCount / memberHabits.length) * 100) : 100;

          return (
            <div
              key={profile.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col justify-between shadow-xs transition"
            >
              <div>
                {/* Member Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{profile.avatar}</span>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                        {profile.name}
                      </h4>
                      <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                        {completedCount}/{memberHabits.length} habits done
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                    {percentage}%
                  </span>
                </div>

                {/* Habits Checklist */}
                <div className="mt-3 space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                    Daily Habits
                  </span>

                  {memberHabits.map((habit) => {
                    const isChecked = habit.isCompleted;
                    return (
                      <div
                        key={habit.id}
                        onClick={() => handleToggle(habit)}
                        className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                              isChecked
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'border border-neutral-300 dark:border-neutral-600'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs font-medium truncate ${isChecked ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                            {habit.icon} {habit.title}
                          </span>
                        </div>

                        {habit.streak > 0 && (
                          <span className="text-[10px] font-mono font-bold text-neutral-500 shrink-0">
                            {habit.streak}d
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Assigned Chores */}
                {memberChores.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                      Action Items ({memberChores.length})
                    </span>
                    {memberChores.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium flex items-center justify-between"
                      >
                        <span className="truncate">{c.title}</span>
                        {c.dueDate && <span className="text-[10px] font-mono text-neutral-500 shrink-0">{c.dueDate}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Quick Grocery Summary */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <span>Pending Grocery Run ({pendingGroceries.length})</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pendingGroceries.slice(0, 8).map((g) => (
              <span key={g.id} className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium border border-neutral-200 dark:border-neutral-700">
                {g.item} {g.quantity ? `(${g.quantity})` : ''}
              </span>
            ))}
            {pendingGroceries.length === 0 && (
              <span className="text-xs text-neutral-400 italic">No groceries needed today.</span>
            )}
          </div>
        </div>

        {/* Pinned Note Preview */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <span>Fridge Sticky Note</span>
            </span>
          </div>
          <p className="text-xs text-neutral-800 dark:text-neutral-200 font-medium leading-relaxed">
            {notes.length > 0 ? notes[0].content : 'No active notes on the fridge board.'}
          </p>
        </div>

      </div>

    </div>
  );
}
