import React from 'react';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { usePhotoStore } from '../../store/usePhotoStore';
import { calculateGrid } from '../../utils/gridCalculator';
import { Grid, Sparkles, Scissors } from 'lucide-react';

export const LayoutSidebar: React.FC = () => {
  const { layout, setLayout, selectedPreset, setStep } = usePhotoStore();

  const targetPagePreset = PAGE_SIZES.find((p) => p.id === layout.pageSizeId) || PAGE_SIZES[0];
  const pageWidthMm =
    layout.orientation === 'portrait' ? targetPagePreset.widthMm : targetPagePreset.heightMm;
  const pageHeightMm =
    layout.orientation === 'portrait' ? targetPagePreset.heightMm : targetPagePreset.widthMm;

  const grid = calculateGrid({
    pageWidthMm,
    pageHeightMm,
    photoWidthMm: selectedPreset.widthMm,
    photoHeightMm: selectedPreset.heightMm,
    spacingHorizontalMm: layout.spacingHorizontalMm,
    spacingVerticalMm: layout.spacingVerticalMm,
    marginTopMm: layout.marginTopMm,
    marginBottomMm: layout.marginBottomMm,
    marginLeftMm: layout.marginLeftMm,
    marginRightMm: layout.marginRightMm,
    desiredCount: layout.duplicateCount
  });

  return (
    <div className="p-4 space-y-4 text-xs">
      {/* Page Size & Orientation */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
          Paper / Sheet Size
        </label>
        <select
          value={layout.pageSizeId}
          onChange={(e) => setLayout({ pageSizeId: e.target.value })}
          className="w-full px-2.5 py-2 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white"
        >
          {PAGE_SIZES.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name} ({page.widthMm} x {page.heightMm} mm)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
          Orientation
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['portrait', 'landscape'] as const).map((orient) => (
            <button
              key={orient}
              onClick={() => setLayout({ orientation: orient })}
              className={`py-2 capitalize font-medium rounded-lg border ${
                layout.orientation === orient
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                  : 'border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300'
              }`}
            >
              {orient}
            </button>
          ))}
        </div>
      </div>

      {/* Duplicate count & Auto-fill */}
      <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
            Copies Count
          </label>
          <button
            onClick={() => setLayout({ duplicateCount: grid.maxCapacity })}
            className="flex items-center space-x-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Sparkles className="w-3 h-3" />
            <span>Fill Page Max ({grid.maxCapacity})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="number"
            min={1}
            max={grid.maxCapacity || 50}
            value={layout.duplicateCount}
            onChange={(e) => setLayout({ duplicateCount: parseInt(e.target.value, 10) || 1 })}
            className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg font-mono font-bold"
          />
          <span className="text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            of max {grid.maxCapacity}
          </span>
        </div>
      </div>

      {/* Spacing Controls */}
      <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 space-y-2.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
          Photo Spacing (mm)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">Horizontal</span>
            <input
              type="number"
              min={0}
              max={30}
              value={layout.spacingHorizontalMm}
              onChange={(e) =>
                setLayout({ spacingHorizontalMm: parseFloat(e.target.value) || 0 })
              }
              className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
            />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">Vertical</span>
            <input
              type="number"
              min={0}
              max={30}
              value={layout.spacingVerticalMm}
              onChange={(e) => setLayout({ spacingVerticalMm: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Margins */}
      <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 space-y-2.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
          Page Margins (mm)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">Top / Bottom</span>
            <input
              type="number"
              min={0}
              max={50}
              value={layout.marginTopMm}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setLayout({ marginTopMm: v, marginBottomMm: v });
              }}
              className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
            />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 dark:text-zinc-400">Left / Right</span>
            <input
              type="number"
              min={0}
              max={50}
              value={layout.marginLeftMm}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setLayout({ marginLeftMm: v, marginRightMm: v });
              }}
              className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Cutting Guides toggle */}
      <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Scissors className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-zinc-300">
            Show Cutting Guides / Crop Marks
          </span>
        </div>
        <input
          type="checkbox"
          checked={layout.showCuttingGuides}
          onChange={(e) => setLayout({ showCuttingGuides: e.target.checked })}
          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
        />
      </div>

      {/* Next step to export */}
      <div className="pt-4">
        <button
          onClick={() => setStep('export-layout')}
          className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center justify-center space-x-1.5"
        >
          <Grid className="w-4 h-4" />
          <span>Proceed to Print / Export</span>
        </button>
      </div>
    </div>
  );
};