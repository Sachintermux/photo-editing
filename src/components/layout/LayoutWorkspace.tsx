import React, { useRef, useEffect, useState } from 'react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { calculateGrid } from '../../utils/gridCalculator';
import { renderSinglePhotoCanvas, renderLayoutSheetCanvas } from '../../utils/exportHelpers';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const LayoutWorkspace: React.FC = () => {
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
    backgroundColor
  } = usePhotoStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(0.2);

  const targetPagePreset = PAGE_SIZES.find((p) => p.id === layout.pageSizeId) || PAGE_SIZES[0];
  const pageWidthMm =
    layout.orientation === 'portrait' ? targetPagePreset.widthMm : targetPagePreset.heightMm;
  const pageHeightMm =
    layout.orientation === 'portrait' ? targetPagePreset.heightMm : targetPagePreset.widthMm;

  // Real-time grid calculation
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

  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    let isMounted = true;
    (async () => {
      // 1. Generate single photo canvas at 150 DPI for snappy responsive preview
      const singleCanvas = await renderSinglePhotoCanvas(
        originalImage,
        crop,
        rotation,
        flipH,
        flipV,
        selectedPreset,
        150,
        adjustments,
        border,
        backgroundColor === 'transparent' ? '#FFFFFF' : backgroundColor
      );

      if (!isMounted) return;

      // 2. Render arranged sheet canvas
      const sheetCanvas = await renderLayoutSheetCanvas(
        singleCanvas,
        pageWidthMm,
        pageHeightMm,
        150,
        gridResult.cells,
        layout.showCuttingGuides
      );

      if (!isMounted || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = sheetCanvas.width;
        canvasRef.current.height = sheetCanvas.height;
        ctx.drawImage(sheetCanvas, 0, 0);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
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
    pageWidthMm,
    pageHeightMm,
    gridResult.cells
  ]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-950 select-none overflow-auto">
      {/* Zoom controls floating bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center bg-zinc-900/80 backdrop-blur border border-zinc-700/60 rounded-lg p-1 space-x-1 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.max(0.05, z - 0.05))}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-medium text-zinc-300 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.05))}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(0.3)}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid Warning notification */}
      {gridResult.warning && (
        <div className="absolute bottom-4 z-30 bg-amber-500/90 text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur">
          {gridResult.warning}
        </div>
      )}

      <div
        style={{ transform: `scale(${zoom})` }}
        className="transition-transform duration-100 ease-out shadow-2xl p-1 bg-white"
      >
        <canvas ref={canvasRef} className="max-w-none block shadow-lg" />
      </div>
    </div>
  );
};