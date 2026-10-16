import React from 'react';
import { Flame, Check, CheckCircle2, ShoppingCart, StickyNote, Heart } from 'lucide-react';
import { playChime, playFanfare } from '../utils/sound';
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
  const pendingGroceries = groceries.filter(g => !g.isBought);

  const handleToggle = async (habit) => {
    if (!habit.isCompleted) {
      playChime();
      fireCelebration();
    }
    await onToggleHabit(habit.id, selectedDate);
  };

  return (
    <div className="space-y-6">
      
      {/* Wall Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🖥️</span>
            <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
              Shared Household Wall Display
            </h3>
            <span className="text-[11px] font-bold bg-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              Living Room / Tablet Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time household overview for all 3 family members at a glance
          </p>
        </div>

        <button
          onClick={() => onOpenKudosModal()}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-500/30 hover:opacity-90 transition"
        >
          <Heart className="w-4 h-4 fill-white text-white" />
          <span>Send Family Kudos</span>
        </button>
      </div>

      {/* 3 Family Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const memberHabits = habits.filter(h => h.profileId === profile.id);
          const memberChores = chores.filter(c => c.assigneeId === profile.id && !c.isCompleted);
          const completedCount = memberHabits.filter(h => h.isCompleted).length;
          const percentage = memberHabits.length > 0 ? Math.round((completedCount / memberHabits.length) * 100) : 100;

          const isMom = profile.id === 'mom';

          return (
            <div
              key={profile.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs transition ${
                isMom ? 'border-rose-200 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Member Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{profile.avatar}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                        {profile.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {completedCount} of {memberHabits.length} habits done
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900">
                    {percentage}%
                  </span>
                </div>

                {/* Habits Checklist */}
                <div className="mt-3.5 space-y-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    Daily Habits
                  </span>

                  {memberHabits.map((habit) => {
                    const isChecked = habit.isCompleted;
                    return (
                      <div
                        key={habit.id}
                        onClick={() => handleToggle(habit)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-slate-400 dark:text-slate-500'
                            : 'bg-slate-50/70 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-xs font-semibold truncate ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {habit.icon} {habit.title}
                          </span>
                        </div>

                        {habit.streak > 0 && (
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-0.5 shrink-0">
                            <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                            {habit.streak}d
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Assigned Chores */}
                {memberChores.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      Action Items ({memberChores.length})
                    </span>
                    {memberChores.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-medium flex items-center justify-between"
                      >
                        <span className="truncate">{c.title}</span>
                        {c.dueDate && <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold shrink-0">{c.dueDate}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Kudos button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => onOpenKudosModal(profile.id)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>Kudos to {profile.name.split(' ')[0]}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom Summary Bar for Fridge / Errands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Quick Grocery Summary */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Pending Grocery Run ({pendingGroceries.length})</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pendingGroceries.slice(0, 8).map((g) => (
              <span key={g.id} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-transparent dark:border-slate-700">
                {g.item} {g.quantity ? `(${g.quantity})` : ''}
              </span>
            ))}
            {pendingGroceries.length === 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">No groceries needed today.</span>
            )}
          </div>
        </div>

        {/* Pinned Note Preview */}
        <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Fridge Sticky Notes</span>
            </span>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
            {notes.length > 0 ? notes[0].content : 'No active notes on the fridge board.'}
          </p>
        </div>

      </div>

    </div>
  );
}
