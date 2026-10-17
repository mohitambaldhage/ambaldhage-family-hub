import React, { useState } from 'react';
import { Calendar, Plus, ExternalLink, Copy, Check, Mail, Clock, MapPin, Trash2, Edit3, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { playPop, playChime } from '../utils/sound';

export default function GoogleCalendarView({
  profiles,
  activeProfileId,
  authFetch,
  calendarEvents = [],
  chores = [],
  onEventsUpdated,
  onProfileUpdated,
  networkInfo,
  seniorMode
}) {
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [copiedFeedProfileId, setCopiedFeedProfileId] = useState(null);

  // New Event Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newIsAllDay, setNewIsAllDay] = useState(false);
  const [newProfileId, setNewProfileId] = useState(activeProfileId !== 'wall' ? activeProfileId : 'all');
  const [newLocation, setNewLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const targetMember = activeProfileId !== 'wall' ? activeProfile : profiles[0];

  // Base URL for ICS subscription
  const baseUrl = networkInfo?.url || window.location.origin;

  // Open Google Calendar event creation intent
  const handleAddToGoogleCalendar = (ev, memberEmail) => {
    try {
      const cleanDate = (ev.eventDate || ev.dueDate || '').replace(/-/g, '');
      let datesParam = `${cleanDate}/${cleanDate}`;

      if (!ev.isAllDay && ev.startTime) {
        const startClean = (ev.startTime || '09:00').replace(/:/g, '') + '00';
        const endClean = (ev.endTime || '10:00').replace(/:/g, '') + '00';
        datesParam = `${cleanDate}T${startClean}/${cleanDate}T${endClean}`;
      }

      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: ev.title || 'Family Task',
        details: ev.description || 'Ambaldhage Family Hub reminder',
        dates: datesParam
      });

      if (ev.location) params.append('location', ev.location);
      if (memberEmail) params.append('add', memberEmail);

      const gcalUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
      window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error(e);
    }
  };

  // Copy personal ICS feed URL
  const handleCopyFeedUrl = (profileId) => {
    const feedUrl = `${baseUrl}/api/calendar/ics/${profileId}`;
    navigator.clipboard.writeText(feedUrl);
    setCopiedFeedProfileId(profileId);
    playPop();
    setTimeout(() => setCopiedFeedProfileId(null), 3000);
  };

  // Open Google Calendar "Add from URL" page
  const handleOpenGoogleCalendarSubscribe = () => {
    window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank', 'noopener,noreferrer');
  };

  // Save updated email for a profile
  const handleSaveEmail = async (profId) => {
    if (!editEmail.trim()) return;
    try {
      const res = await authFetch(`/api/profiles/${profId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editEmail.trim() })
      });
      if (res.ok) {
        setEditingProfileId(null);
        if (onProfileUpdated) onProfileUpdated();
        playChime();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create new event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newEventDate) return;
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          profileId: newProfileId,
          eventDate: newEventDate,
          startTime: newIsAllDay ? null : newStartTime,
          endTime: newIsAllDay ? null : newEndTime,
          isAllDay: newIsAllDay,
          location: newLocation.trim()
        })
      });

      if (res.ok) {
        playChime();
        setNewTitle('');
        setNewDescription('');
        setNewLocation('');
        setShowAddModal(false);
        if (onEventsUpdated) onEventsUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const res = await authFetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      if (res.ok && onEventsUpdated) onEventsUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className={`font-bold tracking-tight text-neutral-900 dark:text-white ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
              Google Calendar Sync & Accounts
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Link every family member's personal Gmail account so chores, routines, and events sync directly to their phones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Google Calendar</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Family Personal Gmail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((prof) => {
          const isMe = activeProfileId === prof.id;
          const isEditing = editingProfileId === prof.id;
          const isCopied = copiedFeedProfileId === prof.id;

          return (
            <div
              key={prof.id}
              className={`p-4 rounded-xl border bg-white dark:bg-neutral-900 transition ${
                isMe
                  ? 'border-black dark:border-white ring-1 ring-black dark:ring-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{prof.avatar}</span>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <span>{prof.name}</span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                          Active
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{prof.role}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isEditing) {
                      setEditingProfileId(null);
                    } else {
                      setEditEmail(prof.email || '');
                      setEditingProfileId(prof.id);
                    }
                  }}
                  className="text-neutral-400 hover:text-black dark:hover:text-white p-1 rounded transition"
                  title="Edit Gmail Address"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Personal Gmail Address Display or Edit */}
              <div className="mb-4">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Personal Gmail Account
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEmail(prof.id)}
                      className="text-xs px-2.5 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-800 dark:text-neutral-200 font-mono bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-md border border-neutral-200 dark:border-neutral-800 truncate">
                    <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{prof.email || 'No Gmail linked yet'}</span>
                  </div>
                )}
              </div>

              {/* Sync Actions */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => handleCopyFeedUrl(prof.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                      <span>Copied iCal Feed Link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Google Calendar Feed Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenGoogleCalendarSubscribe}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Subscribe in Google Calendar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Instructions Guide (Clean & Minimalist) */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-xs space-y-2">
        <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
          <span>💡 How to sync with your phone's Google Calendar:</span>
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
          <li>Click <strong>"Copy Google Calendar Feed Link"</strong> for Mom, Dad, or Yourself above.</li>
          <li>Tap <strong>"Subscribe in Google Calendar"</strong> (or open Google Calendar on phone/desktop &gt; Other calendars &gt; From URL).</li>
          <li>Paste the link and tap <strong>Add calendar</strong>. Your chores and routines will now appear automatically in your personal Google Calendar!</li>
        </ol>
      </div>

      {/* Family Calendar Events & Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
            Upcoming Family Events & Chores
          </h3>
          <span className="text-xs font-mono text-neutral-500">
            {calendarEvents.length} events
          </span>
        </div>

        {calendarEvents.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-500">No events scheduled yet. Tap "Add Event" to plan a family routine or appointment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {calendarEvents.map((ev) => {
              const assignedProf = profiles.find((p) => p.id === ev.profileId);
              const targetEmail = assignedProf ? assignedProf.email : targetMember?.email;

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                        {ev.title}
                      </h4>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                        {assignedProf ? assignedProf.name.split(' ')[0] : 'All'}
                      </span>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                        {ev.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {ev.eventDate}
                      </span>
                      {ev.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {ev.startTime} {ev.endTime ? ` - ${ev.endTime}` : ''}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => handleAddToGoogleCalendar(ev, targetEmail)}
                      className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Add to My Google Calendar</span>
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-neutral-400 hover:text-black dark:hover:text-white p-1 rounded"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                New Calendar Event
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mom's Health Checkup / Car Service"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Assign To
                </label>
                <select
                  value={newProfileId}
                  onChange={(e) => setNewProfileId(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                >
                  <option value="all">Entire Family (All)</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    disabled={newIsAllDay}
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Clinic, Service Center, Home"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows="2"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Additional details..."
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
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
