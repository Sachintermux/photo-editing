import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Clock, X } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';

const TIPS = [
  'Processing runs on a background thread — your browser stays completely smooth!',
  'First-time load downloads the AI model (~43MB) once. Future cutouts will be near-instant!',
  'Using BRIA RMBG-1.4 neural network for clean hair wisps and edge matting.',
  'WebGPU / WebAssembly hardware acceleration is active on your device.'
];

export const AiLoadingModal: React.FC = () => {
  const { isAiRemovingBg, bgRemovalProgress, bgRemovalStatus, bgRemovalEta, setIsAiRemovingBg } =
    usePhotoStore();
  const [tipIndex, setTipIndex] = useState(0);
  const [countdownEta, setCountdownEta] = useState<number | null>(null);

  // Synchronize countdown when worker sends a new ETA estimate
  useEffect(() => {
    if (bgRemovalEta !== null && bgRemovalEta !== undefined) {
      setCountdownEta(bgRemovalEta);
    }
  }, [bgRemovalEta]);

  // Smooth 1-second countdown decrement
  useEffect(() => {
    if (!isAiRemovingBg) {
      setCountdownEta(null);
      return;
    }

    const timer = setInterval(() => {
      setCountdownEta((prev) => (prev !== null && prev > 1 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [isAiRemovingBg]);

  // Rotate tips every 3.5 seconds
  useEffect(() => {
    if (!isAiRemovingBg) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAiRemovingBg]);

  if (!isAiRemovingBg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Cancel button */}
        <button
          type="button"
          onClick={() => setIsAiRemovingBg(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Central Animated Glowing Orb */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute w-20 h-20 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
          <div className="absolute w-24 h-24 border border-blue-500/30 dark:border-blue-400/30 rounded-full animate-pulse pointer-events-none" />

          <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 animate-spin flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          AI Background Isolation
        </h3>

        {/* Status Text */}
        <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 min-h-[20px]">
          {bgRemovalStatus || 'Processing on background thread...'}
        </p>

        {/* Progress Bar & Real-time ETA */}
        <div className="w-full mt-5 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-zinc-400 font-mono">
            <span>{Math.max(5, Math.min(100, bgRemovalProgress))}%</span>

            {/* Approximate Time Remaining */}
            <div className="flex items-center space-x-1 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/60">
              <Clock className="w-3 h-3 animate-spin" />
              <span>
                {countdownEta !== null && countdownEta > 0
                  ? `~${countdownEta}s remaining`
                  : 'Almost done...'}
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${Math.max(5, Math.min(100, bgRemovalProgress))}%` }}
            >
              <div className="absolute inset-0 bg-white/25 animate-pulse -skew-x-12" />
            </div>
          </div>
        </div>

        {/* Informational Tips Box */}
        <div className="mt-5 w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800/80 rounded-xl p-3 text-left flex items-start space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0 animate-ping" />
          <p className="text-[11px] text-gray-600 dark:text-zinc-300 leading-relaxed min-h-[32px] flex items-center transition-all duration-300">
            {TIPS[tipIndex]}
          </p>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 flex items-center space-x-1.5 text-[10px] text-gray-400 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Offline client-side processing • No photos sent to any server</span>
        </div>
      </div>
    </div>
  );
};