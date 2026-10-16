import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Flame, CheckCircle2 } from 'lucide-react';

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

  let celebrationText = '🌅 Starting the day fresh together!';
  let cheerBadge = 'Keep Going';
  if (percentage === 100 && total > 0) {
    celebrationText = '🏆 Perfect 100%! All household habits conquered today!';
    cheerBadge = 'All Done! 🎉';
  } else if (percentage >= 80) {
    celebrationText = '🔥 Fantastic teamwork! The family is almost done!';
    cheerBadge = 'Super Day 🔥';
  } else if (percentage >= 50) {
    celebrationText = '✨ Solid progress! Halfway through our daily routines!';
    cheerBadge = 'Good Pace ⭐';
  }

  return (
    <div className="bg-gradient-to-br from-white dark:from-slate-900 via-blue-50/40 dark:via-slate-800/40 to-indigo-50/30 dark:to-slate-800/20 rounded-2xl border border-blue-100/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm shadow-blue-500/5 mb-6 transition-colors duration-200">
      
      {/* Top Header: Score & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100/60 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-orange-500/20">
            {percentage >= 80 ? '🔥' : '⭐'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                Daily House Score
              </span>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                {cheerBadge}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 mt-0.5">
              <span>{percentage}% Complete</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ({completed} of {total} habits)
              </span>
            </h2>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-white/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSetToday}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              isToday
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isToday ? 'Today' : formatDateDisplay(selectedDate)}</span>
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5">
        <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${Math.max(percentage, 5)}%` }}
          />
        </div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 flex items-center gap-1.5">
          <span>{celebrationText}</span>
        </p>
      </div>

      {/* Individual Family Member Contribution Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {memberStats.map((member) => {
          const isSelected = activeProfileId === member.profileId;
          return (
            <div
              key={member.profileId}
              className={`rounded-xl p-2.5 sm:p-3 border transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-500 shadow-xs ring-1 ring-blue-400/30'
                  : 'bg-white/60 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg">{member.avatar}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {member.name.split(' ')[0]}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400">
                  {member.percentage}%
                </span>
              </div>

              {/* Member progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${member.percentage}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                <span>{member.completedHabits} of {member.totalHabits} done</span>
                {member.percentage === 100 && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
