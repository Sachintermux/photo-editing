import React from 'react';
import { Wand2, RotateCcw } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { calculateAutoEnhance } from '../../utils/imageFilters';
import { LightingAdjustments } from '../../types';

export const AdjustmentsPanel: React.FC = () => {
  const { adjustments, setAdjustment, setAllAdjustments, resetAdjustments, originalImage } =
    usePhotoStore();

  const sliders: { key: keyof LightingAdjustments; label: string; min: number; max: number }[] = [
    { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
    { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
    { key: 'temperature', label: 'Warmth / Temp', min: -100, max: 100 },
    { key: 'tint', label: 'Tint (Green/Pink)', min: -100, max: 100 },
    { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
    { key: 'shadows', label: 'Shadows Recovery', min: -100, max: 100 },
    { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
    { key: 'vignette', label: 'Vignette', min: 0, max: 100 }
  ];

  const handleAutoEnhance = () => {
    if (!originalImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(600, originalImage.naturalWidth);
    canvas.height = Math.min(600, originalImage.naturalHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    const autoVals = calculateAutoEnhance(ctx, canvas.width, canvas.height);
    setAllAdjustments({
      ...adjustments,
      ...autoVals
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={handleAutoEnhance}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-100 transition shadow-sm"
        >
          <Wand2 className="w-3.5 h-3.5 text-brand-500" />
          <span>Auto-Enhance Photo</span>
        </button>

        <button
          onClick={resetAdjustments}
          className="flex items-center space-x-1 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Sliders</span>
        </button>
      </div>

      <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
        {sliders.map((s) => (
          <div key={s.key}>
            <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
              <span>{s.label}</span>
              <span className="font-mono text-gray-500 dark:text-zinc-400">
                {adjustments[s.key] > 0 ? `+${adjustments[s.key]}` : adjustments[s.key]}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              value={adjustments[s.key]}
              onChange={(e) => setAdjustment(s.key, parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        ))}
      </div>
    </div>
  );
};