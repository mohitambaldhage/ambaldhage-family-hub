import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, Wifi } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-sm leading-tight uppercase">
                Connect Family Phones
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Scan QR Code on Home Wi-Fi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-center space-y-4">
          
          {/* QR Code Container */}
          <div className="inline-block p-3 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Wi-Fi QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-xl"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-xs">
                Generating QR code...
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
              Scan with camera on Mom's or Dad's phone to open the dashboard instantly:
            </p>
            
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-sm mx-auto">
              <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate flex-1 text-left px-1">
                {url}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-bold transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            Ensure devices are connected to the same home Wi-Fi network.
          </div>

        </div>
      </div>
    </div>
  );
}
