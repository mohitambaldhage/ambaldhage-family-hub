import React, { useState } from 'react';
import { Plus, Check, Calendar, AlertCircle, Clock, Trash2, X, Sparkles, User, Heart } from 'lucide-react';
import { playChime, playPop } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';

export default function ChoresView({
  chores,
  profiles,
  activeProfileId,
  onToggleChore,
  onAddChore,
  onDeleteChore,
  onOpenKudosModal,
  seniorMode
}) {
  const [filter, setFilter] = useState('all'); // 'all', 'mine', 'mom', 'dad', 'you', 'completed'
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(activeProfileId !== 'wall' ? activeProfileId : 'all');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState('medium');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filtering logic
  const filteredChores = chores.filter((chore) => {
    if (filter === 'completed') return chore.isCompleted;
    if (chore.isCompleted && filter !== 'all') return false;

    if (filter === 'mine') {
      if (activeProfileId === 'wall') return true;
      return chore.assigneeId === activeProfileId || chore.assigneeId === 'all';
    }
    if (filter === 'mom') return chore.assigneeId === 'mom' || chore.assigneeId === 'all';
    if (filter === 'dad') return chore.assigneeId === 'dad' || chore.assigneeId === 'all';
    if (filter === 'you') return chore.assigneeId === 'you' || chore.assigneeId === 'all';
    return true;
  });

  const handleToggle = async (chore) => {
    if (!chore.isCompleted) {
      playChime();
      fireCelebration();
    } else {
      playPop();
    }

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    await onToggleChore(chore.id, activeProfileId !== 'wall' ? activeProfileId : 'you');
  };

  const handleCreateChore = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddChore({
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      createdById: activeProfileId !== 'wall' ? activeProfileId : 'you',
      dueDate,
      priority
    });

    setTitle('');
    setDescription('');
    setShowAddModal(false);
  };

  const getDueBadge = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr < todayStr) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          Overdue
        </span>
      );
    }
    if (dateStr === todayStr) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Due Today
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
        <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
        {dateStr}
      </span>
    );
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'high':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">HIGH</span>;
      case 'low':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">LOW</span>;
      default:
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">MED</span>;
    }
  };

  const getAssigneeLabel = (id) => {
    if (id === 'all') return { label: 'Anyone / Family', avatar: '🤝', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    const p = profiles.find((prof) => prof.id === id);
    if (!p) return { label: id, avatar: '👤', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' };
    return { label: p.name.split(' ')[0], avatar: p.avatar, color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className={`font-black text-slate-900 dark:text-white tracking-tight ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
            Household Chores & Tasks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Actionable items with due dates, priority tags, and family assignments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition ${
            seniorMode ? 'min-h-[48px] text-sm' : ''
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Chore</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'mine', label: 'Assigned to Me' },
          { key: 'mom', label: 'Mom’s Chores 🌸' },
          { key: 'dad', label: 'Dad’s Chores ☕' },
          { key: 'you', label: 'Mohit’s Tasks ⚡' },
          { key: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filter === tab.key
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chore Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredChores.map((chore) => {
          const assignee = getAssigneeLabel(chore.assigneeId);
          const isDone = chore.isCompleted;

          return (
            <div
              key={chore.id}
              className={`p-4 rounded-2xl border transition-all ${
                isDone
                  ? 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
              } ${seniorMode ? 'p-5' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                
                {/* Left: Checkbox + Content */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggle(chore)}
                    className={`mt-0.5 rounded-xl flex items-center justify-center shrink-0 transition ${
                      seniorMode ? 'w-10 h-10' : 'w-7 h-7'
                    } ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    {isDone && <Check className={`stroke-[3.5] ${seniorMode ? 'w-6 h-6' : 'w-4 h-4'}`} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-semibold tracking-tight ${
                        seniorMode ? 'text-lg' : 'text-sm sm:text-base'
                      } ${isDone ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}
                    >
                      {chore.title}
                    </h4>

                    {chore.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {chore.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${assignee.color}`}
                      >
                        <span>{assignee.avatar}</span>
                        <span>{assignee.label}</span>
                      </span>

                      {getDueBadge(chore.dueDate)}
                      {getPriorityBadge(chore.priority)}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete chore "${chore.title}"?`)) {
                        onDeleteChore(chore.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Delete chore"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {isDone && (
                    <button
                      onClick={() => onOpenKudosModal(chore.assigneeId)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 transition"
                      title="Send thank you note"
                    >
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      <span>Say Thanks</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        {filteredChores.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
            <span className="text-4xl">🎉</span>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2">All tasks completed!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No pending chores in this view. Enjoy your free time!</p>
          </div>
        )}
      </div>

      {/* Add Chore Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span>
                <span>Add Household Chore</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChore} className="p-4 sm:p-5 space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chore Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pay Wi-Fi Bill, Refill Water Can, Service AC..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Due before 5 PM, use Google Pay UPI"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign To
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    ...profiles,
                    { id: 'all', name: 'Anyone 🤝', avatar: '🤝' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAssigneeId(p.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition ${
                        assigneeId === p.id
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-base">{p.avatar}</span>
                      <span className="truncate w-full text-center text-[11px]">{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
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
                  Add Chore
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
