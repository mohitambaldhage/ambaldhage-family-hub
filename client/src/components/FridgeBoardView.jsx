import React, { useState } from 'react';
import { ShoppingCart, StickyNote, Plus, Check, Trash2, Pin, PinOff, Tag } from 'lucide-react';
import { playPop, playChime } from '../utils/sound';

const GROCERY_CATEGORIES = [
  'All Items',
  'Vegetables & Fruits',
  'Dairy & Milk',
  'Pantry & Spices',
  'Household & Chemist',
  'Snacks & Bakery',
  'Other'
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
  const [activeSubTab, setActiveSubTab] = useState('groceries'); // 'groceries' | 'notes'
  const [selectedCategory, setSelectedCategory] = useState('All Items');

  // Grocery State
  const [groceryItem, setGroceryItem] = useState('');
  const [groceryQuantity, setGroceryQuantity] = useState('');
  const [groceryCategory, setGroceryCategory] = useState('Vegetables & Fruits');

  // Sticky Note State
  const [noteContent, setNoteContent] = useState('');
  const [noteIsPinned, setNoteIsPinned] = useState(false);

  const currentAuthorId = activeProfileId !== 'wall' ? activeProfileId : 'mom';

  const pendingGroceries = groceries.filter((g) => !g.isBought);
  const boughtGroceries = groceries.filter((g) => g.isBought);

  const displayedPending = pendingGroceries.filter(
    (g) => selectedCategory === 'All Items' || g.category === selectedCategory
  );

  const displayedBought = boughtGroceries.filter(
    (g) => selectedCategory === 'All Items' || g.category === selectedCategory
  );

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
      color: 'white',
      isPinned: noteIsPinned
    });

    setNoteContent('');
    setNoteIsPinned(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Header bar & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className={`font-bold tracking-tight text-neutral-900 dark:text-white ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
            Grocery List & Fridge Board
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Clean checkbox grocery checklist for Mom and quick household fridge notes.
          </p>
        </div>

        {/* Tab switch between Groceries & Sticky Notes */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('groceries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'groceries'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Grocery List ({pendingGroceries.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'notes'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Fridge Notes ({notes.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'groceries' && (
        <div className="space-y-4">
          
          {/* Quick Add Grocery Form (Minimalist B&W) */}
          <form
            onSubmit={handleCreateGrocery}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 sm:p-4 shadow-xs space-y-2.5"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Quick Add Item for Mom
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={groceryItem}
                onChange={(e) => setGroceryItem(e.target.value)}
                placeholder="Item name (e.g., Tomatoes, Fresh Milk, Bread)"
                className="flex-2 text-sm px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black"
              />

              <input
                type="text"
                value={groceryQuantity}
                onChange={(e) => setGroceryQuantity(e.target.value)}
                placeholder="Qty (e.g., 1 kg, 2 packets)"
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
              />

              <select
                value={groceryCategory}
                onChange={(e) => setGroceryCategory(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
              >
                {GROCERY_CATEGORIES.filter((c) => c !== 'All Items').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </form>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {GROCERY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3 py-1 rounded-full border transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Pending Groceries List (Clean Checkbox Type for Mom) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
              <span>Items to Buy ({displayedPending.length})</span>
              <span className="text-[11px] font-normal lowercase">tap anywhere to check off</span>
            </div>

            {displayedPending.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500">
                  No pending grocery items! Everything is bought, or add new items above.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayedPending.map((g) => {
                  const addedByProf = profiles.find((p) => p.id === g.addedById);
                  return (
                    <div
                      key={g.id}
                      onClick={() => handleToggleGroceryItem(g)}
                      className="group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-black dark:hover:border-white cursor-pointer transition select-none shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        {/* Large, High-Contrast Checkbox */}
                        <div className="w-6 h-6 rounded-md border border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:border-black dark:group-hover:border-white transition">
                          {/* empty box ready to check */}
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {g.item}
                          </span>
                          {g.quantity && (
                            <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">
                              ({g.quantity})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {g.category}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteGrocery(g.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-black dark:hover:text-white transition"
                          title="Delete item"
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

          {/* Already Bought Section */}
          {displayedBought.length > 0 && (
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Bought Items ({displayedBought.length})
                </span>
                <button
                  onClick={onClearBoughtGroceries}
                  className="text-xs text-neutral-500 hover:text-black dark:hover:text-white underline font-medium"
                >
                  Clear All Bought
                </button>
              </div>

              <div className="space-y-1.5 opacity-60">
                {displayedBought.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleToggleGroceryItem(g)}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs font-medium line-through text-neutral-400 dark:text-neutral-500">
                        {g.item} {g.quantity ? `(${g.quantity})` : ''}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGrocery(g.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-black dark:hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Sticky Notes Subtab (Clean Minimalist Cards) */}
      {activeSubTab === 'notes' && (
        <div className="space-y-4">
          
          {/* Create Note Form */}
          <form
            onSubmit={handleCreateNote}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Leave a Fridge Note for the Family
            </div>

            <textarea
              rows="2"
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g. Dinner is warmed on the stove! 🍲 / Checked car air pressure"
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteIsPinned}
                  onChange={(e) => setNoteIsPinned(e.target.checked)}
                  className="rounded border-neutral-300 accent-black dark:accent-white"
                />
                <span>Pin to top of Fridge</span>
              </label>

              <button
                type="submit"
                className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Post Note</span>
              </button>
            </div>
          </form>

          {/* Notes Grid */}
          {notes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
              <p className="text-xs text-neutral-500">No fridge notes right now. Write a note above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {notes.map((note) => {
                const authorProf = profiles.find((p) => p.id === note.authorId);
                return (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                          <span>{authorProf ? authorProf.avatar : '📝'}</span>
                          <span>{authorProf ? authorProf.name : 'Family'}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onTogglePinNote(note.id, !note.isPinned)}
                            className="text-neutral-400 hover:text-black dark:hover:text-white p-1"
                            title={note.isPinned ? 'Unpin' : 'Pin'}
                          >
                            {note.isPinned ? <PinOff className="w-3.5 h-3.5 text-black dark:text-white" /> : <Pin className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="text-neutral-400 hover:text-black dark:hover:text-white p-1"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line font-medium">
                        {note.content}
                      </p>
                    </div>

                    <div className="text-[10px] text-neutral-400 font-mono pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
