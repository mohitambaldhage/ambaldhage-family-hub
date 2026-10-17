import React, { useState } from 'react';
import { Plus, Check, Calendar, ExternalLink, Clock, Trash2, AlertCircle } from 'lucide-react';
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
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState('medium');

  const todayStr = new Date().toISOString().slice(0, 10);
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  // Filtering
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
    if (navigator.vibrate) navigator.vibrate(30);
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

  // Direct 1-click Google Calendar intent for chores
  const handleAddToGoogleCalendar = (chore) => {
    try {
      const cleanDate = (chore.dueDate || todayStr).replace(/-/g, '');
      const assignedProf = profiles.find((p) => p.id === chore.assigneeId);
      const email = assignedProf ? assignedProf.email : activeProfile?.email;

      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Chore: ${chore.title}`,
        details: `${chore.description || 'Household chore'}\nPriority: ${chore.priority}\nAssigned to: ${chore.assigneeId}`,
        dates: `${cleanDate}/${cleanDate}`
      });

      if (email) params.append('add', email);

      const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className={`font-bold tracking-tight text-neutral-900 dark:text-white ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
            Chores & Tasks
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Household responsibilities with due dates and 1-click Google Calendar sync.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold transition self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Chore</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'mine', label: 'Assigned to Me' },
          { key: 'mom', label: 'Mom' },
          { key: 'dad', label: 'Dad' },
          { key: 'you', label: 'Mohit' },
          { key: 'completed', label: 'Completed' }
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition shrink-0 ${
              filter === f.key
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chores Checklist */}
      {filteredChores.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
          <p className="text-xs text-neutral-500">No chores match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChores.map((chore) => {
            const isCompleted = chore.isCompleted;
            const assignedProf = profiles.find((p) => p.id === chore.assigneeId);
            const isOverdue = chore.dueDate && chore.dueDate < todayStr && !isCompleted;
            const isDueToday = chore.dueDate && chore.dueDate === todayStr && !isCompleted;

            return (
              <div
                key={chore.id}
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  isCompleted
                    ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  {/* Clean Monochrome Checkbox */}
                  <div
                    onClick={() => handleToggle(chore)}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition mt-0.5 ${
                      isCompleted
                        ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                        : 'border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold ${
                          isCompleted
                            ? 'line-through text-neutral-400 dark:text-neutral-500'
                            : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {chore.title}
                      </span>

                      {/* Assignee Badge */}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                        {assignedProf ? assignedProf.name.split(' ')[0] : 'Everyone'}
                      </span>

                      {/* Due Badge */}
                      {chore.dueDate && (
                        <span
                          className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                            isOverdue
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-bold'
                              : isDueToday
                              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {isOverdue ? 'Overdue: ' : isDueToday ? 'Today: ' : ''}{chore.dueDate}
                        </span>
                      )}
                    </div>

                    {chore.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {chore.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side Actions: Google Calendar & Delete */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleAddToGoogleCalendar(chore)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-700 dark:text-neutral-300 transition"
                    title="Add to Google Calendar"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Calendar</span>
                  </button>

                  <button
                    onClick={() => onDeleteChore(chore.id)}
                    className="p-1 text-neutral-400 hover:text-black dark:hover:text-white transition"
                    title="Delete chore"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Chore Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Create New Chore
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChore} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Chore Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water plants, Pay electricity bill, Service AC"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="all">Everyone (All)</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Description / Instructions (Optional)
                </label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, bill amount, or location..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
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
                  Save Chore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
