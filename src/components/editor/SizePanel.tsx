import React, { useState } from 'react';
import { PHOTO_PRESETS } from '../../constants/presets';
import { usePhotoStore } from '../../store/usePhotoStore';
import { Unit } from '../../types';
import { fromMm } from '../../utils/unitConverter';
import { ResolutionAlert } from '../common/ResolutionAlert';

export const SizePanel: React.FC = () => {
  const { selectedPreset, setPreset, customWidth, customHeight, unit, setCustomSize, crop, dpi } =
    usePhotoStore();

  const [localW, setLocalW] = useState(fromMm(selectedPreset.widthMm, unit).toFixed(1));
  const [localH, setLocalH] = useState(fromMm(selectedPreset.heightMm, unit).toFixed(1));
  const [localUnit, setLocalUnit] = useState<Unit>(unit);

  const applyCustom = () => {
    const w = parseFloat(localW);
    const h = parseFloat(localH);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      setCustomSize(w, h, localUnit);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
          Official Photo Size Presets
        </label>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {PHOTO_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setPreset(preset);
                  setLocalW(fromMm(preset.widthMm, localUnit).toFixed(1));
                  setLocalH(fromMm(preset.heightMm, localUnit).toFixed(1));
                }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 shadow-sm'
                    : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between font-medium text-xs">
                  <span>{preset.name}</span>
                  <span className="font-mono text-[11px] text-gray-500 dark:text-zinc-400">
                    {preset.widthMm} x {preset.heightMm} mm
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom size form */}
      <div className="pt-3 border-t border-gray-200 dark:border-zinc-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
          Custom Dimensions
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">Width</span>
            <input
              type="number"
              step="0.1"
              value={localW}
              onChange={(e) => setLocalW(e.target.value)}
              onBlur={applyCustom}
              className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
            />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">Height</span>
            <input
              type="number"
              step="0.1"
              value={localH}
              onChange={(e) => setLocalH(e.target.value)}
              onBlur={applyCustom}
              className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
            />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">Unit</span>
            <select
              value={localUnit}
              onChange={(e) => {
                const newUnit = e.target.value as Unit;
                setLocalUnit(newUnit);
                setLocalW(fromMm(selectedPreset.widthMm, newUnit).toFixed(1));
                setLocalH(fromMm(selectedPreset.heightMm, newUnit).toFixed(1));
              }}
              className="w-full mt-1 px-2 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">inches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resolution & Quality indicator */}
      <ResolutionAlert
        cropWidthPx={crop.width}
        cropHeightPx={crop.height}
        preset={selectedPreset}
        targetDpi={dpi}
      />
    </div>
  );
};