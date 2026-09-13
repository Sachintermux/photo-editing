import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Zap, X } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';

const TIPS = [
  'First-time load downloads the AI model (~43MB) once. Future cutouts will be near-instant!',
  'All background removal runs 100% locally on your device for complete privacy.',
  'Using BRIA RMBG-1.4 neural network for clean hair wisps and edge matting.',
  'WebGPU / WebAssembly hardware acceleration is active on your device.'
];

export const AiLoadingModal: React.FC = () => {
  const { isAiRemovingBg, bgRemovalProgress, bgRemovalStatus, setIsAiRemovingBg } =
    usePhotoStore();
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate helpful tips every 3.5 seconds so the user sees continuous progress
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

        {/* Dismiss / Cancel button */}
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
          {/* Pulsing outer rings */}
          <div className="absolute w-20 h-20 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
          <div className="absolute w-24 h-24 border border-blue-500/30 dark:border-blue-400/30 rounded-full animate-pulse pointer-events-none" />

          {/* Rotating Spinner Ring */}
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 animate-spin flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          AI Background Isolation
        </h3>

        {/* Live Stage Status / Megabyte Counter */}
        <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 min-h-[20px]">
          {bgRemovalStatus || 'Initializing neural network...'}
        </p>

        {/* Progress Bar with Percentage */}
        <div className="w-full mt-5 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400 font-mono">
            <span>Progress</span>
            <span>{Math.max(5, Math.min(100, bgRemovalProgress))}%</span>
          </div>

          <div className="w-full h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${Math.max(5, Math.min(100, bgRemovalProgress))}%` }}
            >
              {/* Shimmer animation */}
              <div className="absolute inset-0 bg-white/25 animate-pulse -skew-x-12" />
            </div>
          </div>
        </div>

        {/* Rotating informational tips */}
        <div className="mt-5 w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800/80 rounded-xl p-3 text-left flex items-start space-x-2.5">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 animate-bounce" />
          <p className="text-[11px] text-gray-600 dark:text-zinc-300 leading-relaxed min-h-[32px] flex items-center transition-all duration-300">
            {TIPS[tipIndex]}
          </p>
        </div>

        {/* Privacy badge */}
        <div className="mt-4 flex items-center space-x-1.5 text-[10px] text-gray-400 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Offline client-side processing • No photos sent to any server</span>
        </div>
      </div>
    </div>
  );
};