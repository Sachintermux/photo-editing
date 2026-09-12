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
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch tracking for 2-finger pinch-to-zoom & pan
  const touchState = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    midpoint: { x: number; y: number };
    isPinching: boolean;
  }>({
    initialDist: 0,
    initialZoom: 0.7,
    initialPan: { x: 0, y: 0 },
    midpoint: { x: 0, y: 0 },
    isPinching: false
  });

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
      // 1. Generate single photo canvas at 150 DPI for responsive preview
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

  // Distance helper between touches
  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  // Midpoint helper between touches
  const getMidpoint = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  };

  // Multi-Touch Handlers for Pinch & Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const mid = getMidpoint(e.touches[0], e.touches[1]);
      touchState.current = {
        initialDist: dist,
        initialZoom: zoom,
        initialPan: { ...pan },
        midpoint: mid,
        isPinching: true
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchState.current.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const newMid = getMidpoint(e.touches[0], e.touches[1]);

      if (touchState.current.initialDist > 0) {
        const scaleFactor = newDist / touchState.current.initialDist;
        const newZoom = Math.min(3.0, Math.max(0.2, touchState.current.initialZoom * scaleFactor));
        setZoom(newZoom);

        const deltaX = newMid.x - touchState.current.midpoint.x;
        const deltaY = newMid.y - touchState.current.midpoint.y;
        setPan({
          x: touchState.current.initialPan.x + deltaX,
          y: touchState.current.initialPan.y + deltaY
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchState.current.isPinching = false;
    }
  };

  const resetZoomAndPan = () => {
    setZoom(0.7);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-gray-200 dark:bg-zinc-950 select-none overflow-hidden touch-none transition-colors duration-200"
    >
      {/* Floating Zoom & Reset Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center bg-white/90 dark:bg-zinc-900/80 text-gray-800 dark:text-zinc-200 backdrop-blur border border-gray-300 dark:border-zinc-700/60 rounded-lg p-1 space-x-1 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-medium px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3.0, z + 0.1))}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={resetZoomAndPan}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
          title="Reset View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Two-finger touch hint on mobile */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none md:hidden bg-white/80 dark:bg-zinc-900/70 backdrop-blur text-[10px] text-gray-600 dark:text-zinc-400 px-2 py-1 rounded-md border border-gray-300 dark:border-zinc-800 shadow-sm">
        ✌️ Pinch with 2 fingers to zoom sheet
      </div>

      {/* Grid Capacity Warning Notification */}
      {gridResult.warning && (
        <div className="absolute bottom-20 md:bottom-4 z-20 bg-amber-500/90 text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur">
          {gridResult.warning}
        </div>
      )}

      {/* Zoomable & Pannable Printable Sheet Area */}
      <div
        ref={containerRef}
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
        className="transition-transform duration-75 ease-out shadow-2xl p-1 bg-white touch-none"
      >
        <canvas ref={canvasRef} className="max-w-none block shadow-lg" />
      </div>
    </div>
  );
};