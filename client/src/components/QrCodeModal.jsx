import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, Wifi, Share2 } from 'lucide-react';

export default function QrCodeModal({ isOpen, onClose, networkInfo }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const url = networkInfo?.url || `http://${window.location.hostname}:3000`;
  const qrDataUrl = networkInfo?.qrCodeDataUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                Connect Family Phones
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan QR Code on Home Wi-Fi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-center space-y-4">
          
          {/* QR Code Container - Stays white background for camera scanning fidelity */}
          <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Wi-Fi QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-xl"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Generating QR code...
              </div>
            )}
          </div>

          {/* URL & Copy button */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400 block">
                Wi-Fi Address
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-100 truncate block">
                {url}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Setup tips */}
          <div className="text-left bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>How to connect in 30 seconds:</span>
            </div>
            <p>1. Make sure the phone is connected to the same home Wi-Fi network.</p>
            <p>2. Open Camera on Mom's or Dad's phone & point it at this QR Code.</p>
            <p>3. Tap <strong>"Add to Home Screen"</strong> in Safari/Chrome so it acts like an installed app without any passwords!</p>
          </div>

        </div>

      </div>
    </div>
  );
}
