import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { DPI, ExportFormat } from '../../types';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { calculateGrid } from '../../utils/gridCalculator';
import { renderSinglePhotoCanvas, renderLayoutSheetCanvas, downloadCanvasFile, exportToPdf } from '../../utils/exportHelpers';

export const LayoutExportModal: React.FC = () => {
  const {
    originalImage,
    crop,
    rotation,
    flipH,
    flipV,
    selectedPreset,
    layout,
    adjustments,
    border,
    backgroundColor,
    setStep
  } = usePhotoStore();

  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [exportDpi, setExportDpi] = useState<DPI>(300);
  const [quality, setQuality] = useState(0.98);
  const [isExporting, setIsExporting] = useState(false);

  const targetPagePreset = PAGE_SIZES.find((p) => p.id === layout.pageSizeId) || PAGE_SIZES[0];
  const pageWidthMm =
    layout.orientation === 'portrait' ? targetPagePreset.widthMm : targetPagePreset.heightMm;
  const pageHeightMm =
    layout.orientation === 'portrait' ? targetPagePreset.heightMm : targetPagePreset.widthMm;

  const gridResult = calculateGrid({
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

  const handleDownloadSheet = async () => {
    if (!originalImage) return;
    setIsExporting(true);

    try {
      // 1. Render single photo at requested high print DPI
      const singleCanvas = await renderSinglePhotoCanvas(
        originalImage,
        crop,
        rotation,
        flipH,
        flipV,
        selectedPreset,
        exportDpi,
        adjustments,
        border,
        backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor
      );

      // 2. Render sheet canvas with exact physical coordinates
      const sheetCanvas = await renderLayoutSheetCanvas(
        singleCanvas,
        pageWidthMm,
        pageHeightMm,
        exportDpi,
        gridResult.cells,
        layout.showCuttingGuides
      );

      const filename = `print_sheet_${targetPagePreset.name.toLowerCase()}_${layout.duplicateCount}x_${selectedPreset.widthMm}x${selectedPreset.heightMm}mm`;

      if (format === 'pdf') {
        exportToPdf(sheetCanvas, pageWidthMm, pageHeightMm, filename, layout.orientation);
      } else {
        downloadCanvasFile(sheetCanvas, format, filename, quality);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 my-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800">
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-4 mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Export Printable Sheet
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Ready for local print stores (CVS, Walgreens, Walmart) or standard home printers with 100% true-to-scale calibration.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-zinc-400">Paper Size:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {targetPagePreset.name} ({pageWidthMm} × {pageHeightMm} mm)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-zinc-400">Arranged Photos:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {gridResult.cells.length} copies of {selectedPreset.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-zinc-400">Cutting Guides:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {layout.showCuttingGuides ? 'Enabled (Corner Crop Marks)' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* DPI Choice */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-zinc-400 mb-1.5">
            Print Resolution (DPI)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {([150, 300, 600] as DPI[]).map((d) => (
              <button
                key={d}
                onClick={() => setExportDpi(d)}
                className={`py-2 text-xs font-semibold rounded-lg border ${
                  exportDpi === d
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-600'
                    : 'border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                {d} DPI {d === 300 && '⭐'}
              </button>
            ))}
          </div>
        </div>

        {/* Format Choice */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-zinc-400 mb-1.5">
            Output File Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['pdf', 'jpeg', 'png'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`py-2 uppercase text-xs font-semibold rounded-lg border ${
                  format === fmt
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-600'
                    : 'border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                {fmt} {fmt === 'pdf' ? '(Recommended)' : ''}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
            * PDF guarantees exact physical dimensions without automatic printer scaling distortions.
          </p>
        </div>

        {/* Printing Instructions Advice */}
        <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 rounded-lg text-xs text-brand-900 dark:text-brand-300 space-y-1">
          <div className="font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Printing Tip:</span>
          </div>
          <p>
            When printing the exported PDF or JPEG, always set your printer dialog to <b>"Actual Size"</b> or <b>"100% Scale"</b>. Do NOT choose "Fit to Page" to prevent millimeter discrepancies.
          </p>
        </div>

        {/* Action buttons */}
        <div className="pt-4 flex items-center justify-between border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => setStep('layout')}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Adjustments</span>
          </button>

          <button
            onClick={handleDownloadSheet}
            disabled={isExporting}
            className="flex items-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating High-Res Sheet...' : `Download ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};