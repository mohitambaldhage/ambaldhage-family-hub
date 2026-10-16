import React from 'react';
import { Heart, Bell, Check, ShoppingCart, X } from 'lucide-react';

export default function NotificationToast({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-base">
              {n.icon || '🔔'}
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-slate-100 truncate">{n.title}</h5>
              <p className="text-[11px] text-slate-400 truncate">{n.message}</p>
            </div>
          </div>

          <button
            onClick={() => onDismiss(n.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
