import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';

export default function HouseScoreBanner({
  stats,
  selectedDate,
  onChangeDate,
  profiles,
  activeProfileId
}) {
  const percentage = stats?.overallPercentage || 0;
  const total = stats?.totalHabits || 0;
  const completed = stats?.totalHabitsCompleted || 0;
  const memberStats = stats?.memberStats || [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === todayStr;

  const formatDateDisplay = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    onChangeDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onChangeDate(d.toISOString().slice(0, 10));
  };

  const handleSetToday = () => {
    onChangeDate(todayStr);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 mb-5 transition-colors">
      
      {/* Top Row: Date Selector & Overall Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        
        {/* Date Navigator */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleSetToday}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition ${
              isToday
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isToday ? 'Today' : formatDateDisplay(selectedDate)}</span>
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleSetToday}
              className="text-xs text-neutral-500 hover:text-black dark:hover:text-white underline ml-1"
            >
              Back to Today
            </button>
          )}
        </div>

        {/* Daily Completion Score */}
        <div className="flex items-baseline gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Daily Household Completion:
          </span>
          <span className="text-lg font-black text-neutral-900 dark:text-white font-mono">
            {percentage}%
          </span>
          <span className="text-xs text-neutral-400 font-mono">
            ({completed}/{total} habits)
          </span>
        </div>
      </div>

      {/* Clean Minimalist Progress Bar */}
      <div className="mt-3">
        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <div
            className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Member Summary Stats (Clean Monochrome Pills) */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        {memberStats.map((ms) => {
          const isCurrentActive = activeProfileId === ms.profileId;
          return (
            <div
              key={ms.profileId}
              className={`p-2 rounded-lg border text-center transition ${
                isCurrentActive
                  ? 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-400 dark:border-neutral-600'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-neutral-900 dark:text-white">
                <span>{ms.avatar}</span>
                <span>{ms.name.split(' ')[0]}</span>
              </div>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                {ms.completedHabits}/{ms.totalHabits} done ({ms.percentage}%)
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
