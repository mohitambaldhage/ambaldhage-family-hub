import React, { useState } from 'react';
import { ShoppingCart, StickyNote, Plus, Check, Trash2, Pin, PinOff, Tag, Clock } from 'lucide-react';
import { playPop, playChime } from '../utils/sound';

const GROCERY_CATEGORIES = [
  { label: 'Vegetables & Fruits', icon: '🍎' },
  { label: 'Dairy & Milk', icon: '🥛' },
  { label: 'Pantry & Spices', icon: '🧂' },
  { label: 'Household & Chemist', icon: '🧼' },
  { label: 'Snacks & Bakery', icon: '🍞' },
  { label: 'Other', icon: '📦' }
];

const NOTE_COLORS = [
  { key: 'yellow', bg: 'bg-amber-100 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100 shadow-amber-200/50' },
  { key: 'pink', bg: 'bg-rose-100 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700/80 text-rose-950 dark:text-rose-100 shadow-rose-200/50' },
  { key: 'blue', bg: 'bg-sky-100 dark:bg-sky-950/90 border-sky-300 dark:border-sky-700/80 text-sky-950 dark:text-sky-100 shadow-sky-200/50' },
  { key: 'green', bg: 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 shadow-emerald-200/50' },
  { key: 'orange', bg: 'bg-orange-100 dark:bg-orange-950/90 border-orange-300 dark:border-orange-700/80 text-orange-950 dark:text-orange-100 shadow-orange-200/50' }
];

export default function FridgeBoardView({
  groceries,
  notes,
  profiles,
  activeProfileId,
  onToggleGrocery,
  onAddGrocery,
  onDeleteGrocery,
  onClearBoughtGroceries,
  onAddNote,
  onTogglePinNote,
  onDeleteNote,
  seniorMode
}) {
  const [activeTab, setActiveTab] = useState('groceries'); // 'groceries' | 'notes'

  // Grocery State
  const [groceryItem, setGroceryItem] = useState('');
  const [groceryQuantity, setGroceryQuantity] = useState('');
  const [groceryCategory, setGroceryCategory] = useState('Vegetables & Fruits');

  // Sticky Note State
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [noteIsPinned, setNoteIsPinned] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const currentAuthorId = activeProfileId !== 'wall' ? activeProfileId : 'mom';

  const pendingGroceries = groceries.filter((g) => !g.isBought);
  const boughtGroceries = groceries.filter((g) => g.isBought);

  const handleToggleGroceryItem = async (g) => {
    playPop();
    if (navigator.vibrate) navigator.vibrate(25);
    await onToggleGrocery(g.id, currentAuthorId);
  };

  const handleCreateGrocery = async (e) => {
    e.preventDefault();
    if (!groceryItem.trim()) return;

    await onAddGrocery({
      item: groceryItem.trim(),
      quantity: groceryQuantity.trim(),
      category: groceryCategory,
      addedById: currentAuthorId
    });

    setGroceryItem('');
    setGroceryQuantity('');
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    playChime();
    await onAddNote({
      content: noteContent.trim(),
      authorId: currentAuthorId,
      color: noteColor,
      isPinned: noteIsPinned
    });

    setNoteContent('');
    setNoteIsPinned(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧊</span>
            <h3 className={`font-black text-slate-900 dark:text-white tracking-tight ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
              The Fridge Board
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Shared household hub • Live grocery errands & digital sticky notes
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('groceries')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'groceries'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Groceries ({pendingGroceries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'notes'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Sticky Notes ({notes.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GROCERIES */}
      {activeTab === 'groceries' && (
        <div className="space-y-5">
          
          {/* Quick Add Bar */}
          <form
            onSubmit={handleCreateGrocery}
            className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                required
                placeholder="Add item (e.g. Milk, Onions, Brown Bread, Toothpaste)..."
                value={groceryItem}
                onChange={(e) => setGroceryItem(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />

              <input
                type="text"
                placeholder="Qty (e.g. 1kg, 2L)"
                value={groceryQuantity}
                onChange={(e) => setGroceryQuantity(e.target.value)}
                className="w-full sm:w-28 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">Category:</span>
              {GROCERY_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setGroceryCategory(cat.label)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1 ${
                    groceryCategory === cat.label
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </form>

          {/* Pending Grocery Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
              <span>TO BUY ({pendingGroceries.length})</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">Real-time sync at market</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pendingGroceries.map((g) => {
                const addedBy = profiles.find((p) => p.id === g.addedById);
                return (
                  <div
                    key={g.id}
                    onClick={() => handleToggleGroceryItem(g)}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs cursor-pointer transition select-none ${
                      seniorMode ? 'p-4' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 flex items-center justify-center shrink-0">
                        {/* Empty box */}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-semibold text-slate-900 dark:text-white truncate ${seniorMode ? 'text-base' : 'text-sm'}`}>
                            {g.item}
                          </span>
                          {g.quantity && (
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 rounded-md">
                              {g.quantity}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>{g.category}</span>
                          {addedBy && <span>• Added by {addedBy.name.split(' ')[0]} {addedBy.avatar}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGrocery(g.id);
                      }}
                      className="p-1 text-slate-300 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-md transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {pendingGroceries.length === 0 && (
                <div className="col-span-full text-center py-8 bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                  <span className="text-3xl">🛒</span>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Grocery list is empty!</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Add household items needed for this week.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bought Items (Collapsible / Clearable) */}
          {boughtGroceries.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>RECENTLY BOUGHT ({boughtGroceries.length})</span>
                <button
                  onClick={onClearBoughtGroceries}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 font-semibold"
                >
                  Clear Bought
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-70">
                {boughtGroceries.map((g) => {
                  const boughtBy = profiles.find((p) => p.id === g.boughtById);
                  return (
                    <div
                      key={g.id}
                      onClick={() => handleToggleGroceryItem(g)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-through truncate">
                          {g.item} {g.quantity ? `(${g.quantity})` : ''}
                        </span>
                      </div>

                      {boughtBy && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                          Picked by {boughtBy.name.split(' ')[0]} {boughtBy.avatar}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: STICKY NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-5">
          
          {/* Quick Note Composer */}
          <form
            onSubmit={handleCreateNote}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>📌</span>
                <span>Pin a Note on the Fridge</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Posting as {activeProfile ? activeProfile.name.split(' ')[0] : 'Family'}
              </span>
            </div>

            <textarea
              required
              rows={2}
              placeholder='e.g. "Dinner is ready on the dining table! 🍲", "Going for market run, back by 6 PM"'
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm font-medium resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {/* Color choices */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Color:</span>
                <div className="flex items-center gap-1.5">
                  {NOTE_COLORS.map((nc) => (
                    <button
                      key={nc.key}
                      type="button"
                      onClick={() => setNoteColor(nc.key)}
                      className={`w-6 h-6 rounded-full border-2 transition ${nc.bg} ${
                        noteColor === nc.key ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Pin toggle & Submit */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNoteIsPinned(!noteIsPinned)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    noteIsPinned
                      ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{noteIsPinned ? 'Pinned' : 'Pin to Top'}</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Note</span>
                </button>
              </div>
            </div>
          </form>

          {/* Sticky Notes Corkboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {notes.map((note) => {
              const author = profiles.find((p) => p.id === note.authorId);
              const colorConfig = NOTE_COLORS.find((c) => c.key === note.color) || NOTE_COLORS[0];

              return (
                <div
                  key={note.id}
                  className={`relative p-4 rounded-2xl border shadow-sm transition-all hover:scale-[1.01] ${colorConfig.bg} ${
                    seniorMode ? 'p-5' : ''
                  }`}
                >
                  {/* Pin badge */}
                  <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-xs font-bold opacity-80">
                      <span>{author ? author.avatar : '👤'}</span>
                      <span>{author ? author.name.split(' ')[0] : 'Family'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {note.isPinned ? (
                        <button
                          onClick={() => onTogglePinNote(note.id, false)}
                          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition"
                          title="Unpin note"
                        >
                          <Pin className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onTogglePinNote(note.id, true)}
                          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition opacity-40 hover:opacity-100"
                          title="Pin note"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (window.confirm('Delete this note?')) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition opacity-40 hover:opacity-100 hover:text-red-700 dark:hover:text-red-400"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Content */}
                  <p className={`pt-2.5 font-medium whitespace-pre-wrap leading-relaxed ${seniorMode ? 'text-base' : 'text-sm'}`}>
                    {note.content}
                  </p>
                </div>
              );
            })}

            {notes.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
                <span className="text-4xl">📝</span>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2">No sticky notes yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Leave a kind message or house reminder for Mom, Dad, or Mohit!</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
