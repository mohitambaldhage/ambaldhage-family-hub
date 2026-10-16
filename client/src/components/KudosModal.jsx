import React, { useState } from 'react';
import { Heart, X, Send, Sparkles } from 'lucide-react';
import { playKudosSound } from '../utils/sound';
import { fireKudosHeart } from '../utils/confetti';

const QUICK_KUDOS_OPTIONS = [
  { emoji: '❤️', label: 'Thank you so much!' },
  { emoji: '🌟', label: 'Super proud of you!' },
  { emoji: '👏', label: 'Great work on the chores!' },
  { emoji: '💐', label: 'Best Mom / Dad!' },
  { emoji: '☕', label: 'Take a break & have tea!' },
  { emoji: '🏆', label: 'Household Champion!' }
];

export default function KudosModal({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  targetProfileId,
  kudosList,
  onSendKudos
}) {
  const [recipientId, setRecipientId] = useState(
    targetProfileId || (activeProfileId === 'mom' ? 'dad' : 'mom')
  );
  const [selectedEmoji, setSelectedEmoji] = useState('❤️');
  const [customMessage, setCustomMessage] = useState('Thank you so much! ❤️');

  if (!isOpen) return null;

  const currentSenderId = activeProfileId !== 'wall' ? activeProfileId : 'you';

  const handleSelectQuick = (option) => {
    setSelectedEmoji(option.emoji);
    setCustomMessage(option.label);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientId) return;

    playKudosSound();
    fireKudosHeart();

    await onSendKudos({
      fromId: currentSenderId,
      toId: recipientId,
      emoji: selectedEmoji,
      message: customMessage
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-rose-100 dark:border-rose-950/60 bg-gradient-to-r from-rose-50 dark:from-rose-950/60 to-pink-50 dark:to-pink-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                Send 1-Tap Family Kudos
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">Show appreciation to Mom, Dad, or Mohit</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          <form onSubmit={handleSend} className="space-y-4">
            
            {/* Recipient Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Send Kudos To
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {profiles.map((p) => {
                  const isSelected = recipientId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRecipientId(p.id)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400/30 font-bold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg">{p.avatar}</span>
                      <span>{p.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick 1-Tap Compliments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick 1-Tap Appreciation
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_KUDOS_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelectQuick(opt)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs text-left border transition ${
                      customMessage === opt.label
                        ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 font-bold text-rose-950 dark:text-rose-100'
                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-lg leading-none">{opt.emoji}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Custom Message (Optional)
              </label>
              <input
                type="text"
                placeholder="Write your personal kind message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Appreciation with Love ❤️</span>
            </button>

          </form>

          {/* Recent Kudos Feed */}
          {kudosList.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                RECENT FAMILY KUDOS
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {kudosList.slice(0, 5).map((k) => {
                  const from = profiles.find((p) => p.id === k.fromId);
                  const to = profiles.find((p) => p.id === k.toId);
                  return (
                    <div
                      key={k.id}
                      className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base">{k.emoji}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {from ? from.name.split(' ')[0] : 'Someone'} → {to ? to.name.split(' ')[0] : 'Someone'}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 truncate">{k.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
