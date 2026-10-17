import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CheckSquare, Plus, Sparkles, Check, ShoppingCart, Calendar, Clock, RefreshCw } from 'lucide-react';
import { playPop, playChime } from '../utils/sound';
import { fireCelebration } from '../utils/confetti';

const QUICK_PROMPTS = [
  { label: "🛒 Mom's Grocery Checklist (Checkboxes)", prompt: "Give me Mom's essential grocery items checklist with checkboxes" },
  { label: "🥦 Fresh Vegetables & Greens", prompt: "Give me a checklist of fresh vegetables and greens for this week" },
  { label: "🥛 Dairy & Breakfast Items", prompt: "Give me a checklist of morning milk, breakfast, and dairy essentials" },
  { label: "🧂 Dals & Pantry Spices", prompt: "Give me a checklist for refilling dals, pulses, and kitchen spices" },
  { label: "📅 Today's Schedule & Chores", prompt: "What are the pending chores and schedule for the family today?" },
  { label: "💊 Health & Medicine Reminders", prompt: "Show medicine and health routine reminders for Mom and Dad" }
];

export default function FamilyAssistantView({
  activeProfileId,
  profiles,
  authFetch,
  onGroceriesAdded,
  seniorMode
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Namaste! I am your Ambaldhage Family Assistant. I can generate grocery checklists with checkboxes (specially tailored for Mom), organize chores, and sync with your Google Calendar. What would you like to do?",
      type: 'suggestions',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addingStatus, setAddingStatus] = useState({});
  const messagesEndRef = useRef(null);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const currentAuthorId = activeProfileId !== 'wall' ? activeProfileId : 'mom';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await authFetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          profileId: currentAuthorId
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: data.reply,
          type: data.type,
          title: data.title,
          items: data.items ? data.items.map((it, idx) => ({ ...it, id: `item-${Date.now()}-${idx}` })) : null,
          chores: data.chores,
          events: data.events,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
        playPop();
      } else {
        throw new Error('Failed to get response');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I couldn't reach the assistant server. Please check your connection and try again.",
          type: 'text',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle checkbox state inside bot checklist message
  const handleToggleChecklistItem = (msgId, itemId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.items) return msg;
        return {
          ...msg,
          items: msg.items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it))
        };
      })
    );
  };

  // Add all checked items directly to the database & Fridge Board
  const handleAddCheckedItemsToGroceries = async (msgId, items) => {
    const checkedItems = (items || []).filter((it) => it.checked);
    if (checkedItems.length === 0) return;

    setAddingStatus((prev) => ({ ...prev, [msgId]: 'loading' }));

    try {
      const payload = {
        items: checkedItems.map((it) => ({
          item: it.item,
          quantity: it.quantity || '',
          category: it.category || 'Other'
        })),
        addedById: currentAuthorId
      };

      const res = await authFetch('/api/groceries/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAddingStatus((prev) => ({ ...prev, [msgId]: 'done' }));
        playChime();
        fireCelebration();
        if (onGroceriesAdded) onGroceriesAdded();
      } else {
        setAddingStatus((prev) => ({ ...prev, [msgId]: 'error' }));
      }
    } catch (e) {
      console.error(e);
      setAddingStatus((prev) => ({ ...prev, [msgId]: 'error' }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm">
              <Bot className="w-4 h-4" />
            </div>
            <h2 className={`font-bold tracking-tight text-neutral-900 dark:text-white ${seniorMode ? 'text-2xl' : 'text-xl'}`}>
              Family Assistant
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Ask for grocery checklists with checkboxes (specially tailored for Mom), household tasks, or calendar routines.
          </p>
        </div>

        {/* Quick Clear / Reset Conversation */}
        <button
          onClick={() =>
            setMessages([
              {
                id: Date.now(),
                sender: 'bot',
                text: "Chat cleared! How can I help Mom, Dad, or Mohit right now?",
                type: 'suggestions',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ])
          }
          className="text-xs text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1.5 self-start sm:self-auto py-1 px-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.prompt)}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 min-h-[380px] max-h-[520px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[88%] sm:max-w-[80%] rounded-xl p-3.5 sm:p-4 text-sm ${
                isUser
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
              }`}>
                
                {/* Main Message Text */}
                <p className="whitespace-pre-line leading-relaxed font-medium">
                  {msg.text}
                </p>

                {/* Interactive Grocery Checklist with Checkboxes */}
                {msg.type === 'grocery_checklist' && msg.items && (
                  <div className="mt-3.5 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      <span>{msg.title || "Checklist"}</span>
                      <span>{msg.items.filter((i) => i.checked).length} of {msg.items.length} selected</span>
                    </div>

                    <div className="space-y-1.5 bg-white dark:bg-neutral-900/90 rounded-lg p-2.5 border border-neutral-200 dark:border-neutral-700">
                      {msg.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition select-none"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleChecklistItem(msg.id, item.id)}
                            className="w-4 h-4 rounded border-neutral-400 text-black dark:text-white accent-black dark:accent-white focus:ring-0 cursor-pointer"
                          />
                          <div className="flex-1 flex items-baseline justify-between gap-2">
                            <span className={`font-semibold ${item.checked ? 'text-neutral-900 dark:text-white' : 'line-through text-neutral-400 dark:text-neutral-500'}`}>
                              {item.item}
                            </span>
                            {item.quantity && (
                              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Button to add checked items directly to groceries */}
                    <div className="pt-1">
                      {addingStatus[msg.id] === 'done' ? (
                        <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-bold">
                          <Check className="w-4 h-4" />
                          <span>Added to Grocery List! Check the Grocery tab.</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddCheckedItemsToGroceries(msg.id, msg.items)}
                          disabled={addingStatus[msg.id] === 'loading'}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold transition shadow-sm"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>
                            {addingStatus[msg.id] === 'loading'
                              ? 'Adding to Grocery List...'
                              : `Add Selected (${msg.items.filter((i) => i.checked).length}) to Grocery List`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Chores Summary rendering */}
                {msg.type === 'chores_summary' && msg.chores && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    {msg.chores.map((chore) => (
                      <div
                        key={chore.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-neutral-400" />
                          <span className="font-semibold text-neutral-900 dark:text-white">{chore.title}</span>
                        </div>
                        {chore.dueDate && (
                          <span className="font-mono text-neutral-500 dark:text-neutral-400">{chore.dueDate}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Calendar Summary rendering */}
                {msg.type === 'calendar_summary' && msg.events && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    {msg.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="font-semibold text-neutral-900 dark:text-white">{ev.title}</span>
                        </div>
                        <span className="font-mono text-neutral-500 dark:text-neutral-400">{ev.eventDate}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-[10px] mt-1.5 ${isUser ? 'text-neutral-300 dark:text-neutral-600 text-right' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                  {activeProfile ? activeProfile.avatar : <User className="w-4 h-4" />}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-center text-xs text-neutral-500 dark:text-neutral-400">
            <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2.5 border border-neutral-200 dark:border-neutral-700">
              Thinking & preparing checklist...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask for Mom's grocery checklist, add chores, or check schedule..."
          className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed p-3 rounded-xl transition flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
