import React from 'react';
import { usePhotoStore } from '../../store/usePhotoStore';

export const BorderPanel: React.FC = () => {
  const { border, setBorder } = usePhotoStore();

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
          Enable Photo Border
        </span>
        <input
          type="checkbox"
          checked={border.enabled}
          onChange={(e) => setBorder({ enabled: e.target.checked })}
          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
        />
      </div>

      {border.enabled && (
        <div className="space-y-3.5 pt-2 border-t border-gray-200 dark:border-zinc-800">
          {/* Border Color */}
          <div>
            <span className="block text-gray-700 dark:text-zinc-300 font-medium mb-1">Border Color</span>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={border.color}
                onChange={(e) => setBorder({ color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={border.color}
                onChange={(e) => setBorder({ color: e.target.value })}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md font-mono"
              />
            </div>
          </div>

          {/* Border Width */}
          <div>
            <div className="flex justify-between font-medium text-gray-700 dark:text-zinc-300 mb-1">
              <span>Border Width</span>
              <span className="font-mono">{border.widthMm} mm</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={5}
              step={0.1}
              value={border.widthMm}
              onChange={(e) => setBorder({ widthMm: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>

          {/* Border Style */}
          <div>
            <span className="block text-gray-700 dark:text-zinc-300 font-medium mb-1">Stroke Style</span>
            <div className="grid grid-cols-3 gap-2">
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setBorder({ style })}
                  className={`py-1.5 capitalize rounded-md border text-center font-medium ${
                    border.style === style
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                      : 'border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Radius */}
          <div>
            <div className="flex justify-between font-medium text-gray-700 dark:text-zinc-300 mb-1">
              <span>Corner Rounding</span>
              <span className="font-mono">{border.radiusMm} mm</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={border.radiusMm}
              onChange={(e) => setBorder({ radiusMm: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>

          {/* Inner Padding */}
          <div>
            <div className="flex justify-between font-medium text-gray-700 dark:text-zinc-300 mb-1">
              <span>Inner Photo Padding</span>
              <span className="font-mono">{border.paddingMm} mm</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={border.paddingMm}
              onChange={(e) => setBorder({ paddingMm: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};