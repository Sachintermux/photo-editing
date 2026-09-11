import React, { useState } from 'react';
import { Download, ArrowRight } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { DPI, ExportFormat } from '../../types';
import { mmToPixels } from '../../utils/unitConverter';
import { renderSinglePhotoCanvas, downloadCanvasFile, exportToPdf } from '../../utils/exportHelpers';

export const SingleExportModal: React.FC = () => {
  const {
    originalImage,
    crop,
    rotation,
    flipH,
    flipV,
    selectedPreset,
    dpi,
    setDpi,
    adjustments,
    border,
    backgroundColor,
    setStep
  } = usePhotoStore();

  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [quality, setQuality] = useState(0.95);
  const [fileName, setFileName] = useState(`passport_${selectedPreset.widthMm}x${selectedPreset.heightMm}mm`);
  const [isExporting, setIsExporting] = useState(false);

  const finalWidthPx = mmToPixels(selectedPreset.widthMm, dpi);
  const finalHeightPx = mmToPixels(selectedPreset.heightMm, dpi);

  const handleExport = async () => {
    if (!originalImage) return;
    setIsExporting(true);

    try {
      const canvas = await renderSinglePhotoCanvas(
        originalImage,
        crop,
        rotation,
        flipH,
        flipV,
        selectedPreset,
        dpi,
        adjustments,
        border,
        format === 'jpeg' && backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor
      );

      if (format === 'pdf') {
        exportToPdf(canvas, selectedPreset.widthMm, selectedPreset.heightMm, fileName);
      } else {
        downloadCanvasFile(canvas, format, fileName, quality);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 my-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800">
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-4 mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Export Single Photo
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Save your individually sized & formatted photo ready for official online upload or printing.
        </p>
      </div>

      <div className="space-y-4">
        {/* Dimensions info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-xs">
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Physical Print Size:</span>
            <div className="font-semibold text-gray-900 dark:text-white mt-0.5">
              {selectedPreset.widthMm} × {selectedPreset.heightMm} mm
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Target Pixel Resolution:</span>
            <div className="font-semibold text-gray-900 dark:text-white font-mono mt-0.5">
              {finalWidthPx} × {finalHeightPx} px @ {dpi} DPI
            </div>
          </div>
        </div>

        {/* DPI Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-zinc-400 mb-1.5">
            Export DPI
          </label>
          <div className="grid grid-cols-4 gap-2">
            {([72, 150, 300, 600] as DPI[]).map((d) => (
              <button
                key={d}
                onClick={() => setDpi(d)}
                className={`py-2 text-xs font-semibold rounded-lg border ${
                  dpi === d
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-600'
                    : 'border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                {d} DPI
              </button>
            ))}
          </div>
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-zinc-400 mb-1.5">
            File Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['jpeg', 'png', 'pdf'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`py-2 uppercase text-xs font-semibold rounded-lg border ${
                  format === fmt
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-600'
                    : 'border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* JPEG Quality slider */}
        {format === 'jpeg' && (
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
              <span>JPEG Quality</span>
              <span className="font-mono">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.0}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        )}

        {/* File name input */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
            File Name
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md"
          />
        </div>

        {/* Action buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => setStep('layout')}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-xl transition"
          >
            <span>Arrange on Printable Sheet</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : `Download ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};