import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DPI, PhotoPreset } from '../../types';
import { calculateEffectiveDpi } from '../../utils/unitConverter';

interface Props {
  cropWidthPx: number;
  cropHeightPx: number;
  preset: PhotoPreset;
  targetDpi: DPI;
}

export const ResolutionAlert: React.FC<Props> = ({
  cropWidthPx,
  cropHeightPx,
  preset,
  targetDpi
}) => {
  const effectiveDpiW = calculateEffectiveDpi(cropWidthPx, preset.widthMm);
  const effectiveDpiH = calculateEffectiveDpi(cropHeightPx, preset.heightMm);
  const minEffectiveDpi = Math.min(effectiveDpiW, effectiveDpiH);

  const isLowRes = minEffectiveDpi < targetDpi;
  const isCritical = minEffectiveDpi < 150;

  if (!isLowRes) {
    return (
      <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          Sharp print resolution: <b>{minEffectiveDpi} DPI</b> (Exceeds {targetDpi} DPI target)
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start space-x-2 text-xs px-2.5 py-2 rounded-md border ${
        isCritical
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
      }`}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Resolution Warning: </span>
        Current crop supplies <b>{minEffectiveDpi} DPI</b> for this print size. Official embassy
        standards usually recommend at least <b>300 DPI</b>.
      </div>
    </div>
  );
};