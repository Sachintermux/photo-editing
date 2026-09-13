import React from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { removeBackgroundAI } from '../../utils/backgroundRemoval';

export const BackgroundPanel: React.FC = () => {
  const {
    imageSrc,
    originalImage,
    setImage,
    backgroundColor,
    setBackgroundColor,
    isAiRemovingBg,
    setIsAiRemovingBg
  } = usePhotoStore();

  const colorPresets = [
    { name: 'Transparent', value: 'transparent' },
    { name: 'Pure White (Passport Standard)', value: '#FFFFFF' },
    { name: 'Light Blue (Visa Standard)', value: '#cce5ff' },
    { name: 'Off-White / Light Gray', value: '#f0f0f0' },
    { name: 'Royal Blue', value: '#1e3a8a' },
    { name: 'Red (Official/Job Standard)', value: '#dc2626' }
  ];

  const handleAiRemove = async () => {
    if (!originalImage || !imageSrc) return;

    try {
      setIsAiRemovingBg(true, 'Initializing AI engine...', 5);

      const transparentBlob = await removeBackgroundAI(imageSrc, (p) => {
        setIsAiRemovingBg(true, p.status, p.progress);
      });

      const url = URL.createObjectURL(transparentBlob);
      const newImg = new Image();
      newImg.onload = () => {
        setImage(newImg, url);
        setIsAiRemovingBg(false);
      };
      newImg.src = url;
    } catch (err) {
      console.error(err);
      alert(
        'AI background removal was interrupted or took too long. Check your internet connection for the initial download, or choose a solid background color from the presets below.'
      );
      setIsAiRemovingBg(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
          AI Background Isolation
        </label>
        <button
          type="button"
          onClick={handleAiRemove}
          disabled={isAiRemovingBg}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
        >
          {isAiRemovingBg ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Remove Background with AI</span>
            </>
          )}
        </button>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
          Background Color Replacement
        </label>
        <div className="grid grid-cols-2 gap-2">
          {colorPresets.map((c) => {
            const isSelected = backgroundColor.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                onClick={() => setBackgroundColor(c.value)}
                className={`flex items-center space-x-2 p-2 rounded-lg border text-left text-xs transition ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-medium'
                    : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                <span
                  style={{
                    backgroundColor: c.value === 'transparent' ? '#ffffff' : c.value,
                    backgroundImage:
                      c.value === 'transparent'
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : 'none',
                    backgroundSize: '8px 8px'
                  }}
                  className="w-5 h-5 rounded-full border border-gray-300 shadow-sm flex-shrink-0"
                />
                <span className="truncate flex-1">{c.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center space-x-2">
          <input
            type="color"
            value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={backgroundColor}
            placeholder="#FFFFFF or transparent"
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md font-mono text-gray-800 dark:text-zinc-200"
          />
        </div>
      </div>
    </div>
  );
};