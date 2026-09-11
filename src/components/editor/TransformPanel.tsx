import React from 'react';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, RefreshCw } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';

export const TransformPanel: React.FC = () => {
  const { rotation, rotate90, setRotation, toggleFlipH, toggleFlipV, resetTransform, flipH, flipV } =
    usePhotoStore();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
          Rotate 90° & Flip
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => rotate90('ccw')}
            className="p-2.5 flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs text-gray-700 dark:text-zinc-200"
          >
            <RotateCcw className="w-4 h-4 mb-1" />
            <span>-90°</span>
          </button>
          <button
            onClick={() => rotate90('cw')}
            className="p-2.5 flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs text-gray-700 dark:text-zinc-200"
          >
            <RotateCw className="w-4 h-4 mb-1" />
            <span>+90°</span>
          </button>
          <button
            onClick={toggleFlipH}
            className={`p-2.5 flex flex-col items-center justify-center rounded-lg border text-xs transition ${
              flipH
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200'
            }`}
          >
            <FlipHorizontal className="w-4 h-4 mb-1" />
            <span>Flip H</span>
          </button>
          <button
            onClick={toggleFlipV}
            className={`p-2.5 flex flex-col items-center justify-center rounded-lg border text-xs transition ${
              flipV
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200'
            }`}
          >
            <FlipVertical className="w-4 h-4 mb-1" />
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* Free Straighten slider */}
      <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
        <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
          <span>Fine Straighten</span>
          <span className="font-mono">{rotation}°</span>
        </div>
        <input
          type="range"
          min={-45}
          max={45}
          value={rotation > 180 ? rotation - 360 : rotation}
          onChange={(e) => setRotation((parseInt(e.target.value, 10) + 360) % 360)}
          className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={resetTransform}
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Rotation</span>
        </button>
      </div>
    </div>
  );
};