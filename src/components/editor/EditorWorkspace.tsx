import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { applyLightingAdjustments } from '../../utils/imageFilters';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const EditorWorkspace: React.FC = () => {
  const {
    originalImage,
    crop,
    setCrop,
    selectedPreset,
    rotation,
    flipH,
    flipV,
    adjustments,
    backgroundColor,
    border
  } = usePhotoStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch tracking for pinch-to-zoom
  const touchState = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    midpoint: { x: number; y: number };
    isPinching: boolean;
  }>({
    initialDist: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    midpoint: { x: 0, y: 0 },
    isPinching: false
  });

  // Crop Dragging state
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState(crop);

  // Render baked preview onto canvas
  const renderPreview = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;

    ctx.save();
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(originalImage, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();

    applyLightingAdjustments(ctx, canvas.width, canvas.height, adjustments);
  }, [originalImage, rotation, flipH, flipV, adjustments, backgroundColor]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Helper distance between two touches
  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  // Helper midpoint between two touches
  const getMidpoint = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  };

  // Touch Handlers for Multi-Touch Pinch & Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Begin 2-finger pinch
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
      // Cancel crop drag if two fingers are down
      setIsDraggingCrop(false);
      setDragHandle(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchState.current.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const newMid = getMidpoint(e.touches[0], e.touches[1]);

      if (touchState.current.initialDist > 0) {
        const scaleFactor = newDist / touchState.current.initialDist;
        const newZoom = Math.min(3.5, Math.max(0.5, touchState.current.initialZoom * scaleFactor));
        setZoom(newZoom);

        // Adjust pan with touch movement
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

  // Crop manipulation handlers
  const handlePointerDown = (e: React.PointerEvent, handle: string | null) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingCrop(true);
    setDragHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...crop });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCrop || !originalImage || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = originalImage.naturalWidth / rect.width;
    const scaleY = originalImage.naturalHeight / rect.height;

    const deltaX = (e.clientX - dragStart.x) * scaleX;
    const deltaY = (e.clientY - dragStart.y) * scaleY;
    const targetAspect = selectedPreset.widthMm / selectedPreset.heightMm;

    if (dragHandle === 'move') {
      const maxX = originalImage.naturalWidth - initialCrop.width;
      const maxY = originalImage.naturalHeight - initialCrop.height;
      setCrop({
        ...crop,
        x: Math.max(0, Math.min(maxX, initialCrop.x + deltaX)),
        y: Math.max(0, Math.min(maxY, initialCrop.y + deltaY))
      });
    } else if (dragHandle === 'se') {
      let newW = Math.max(80, initialCrop.width + deltaX);
      let newH = newW / targetAspect;

      if (initialCrop.x + newW > originalImage.naturalWidth) {
        newW = originalImage.naturalWidth - initialCrop.x;
        newH = newW / targetAspect;
      }
      if (initialCrop.y + newH > originalImage.naturalHeight) {
        newH = originalImage.naturalHeight - initialCrop.y;
        newW = newH * targetAspect;
      }

      setCrop({
        ...crop,
        width: newW,
        height: newH
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingCrop) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe release
      }
      setIsDraggingCrop(false);
      setDragHandle(null);
    }
  };

  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!originalImage) return null;

  const cropLeftPct = (crop.x / originalImage.naturalWidth) * 100;
  const cropTopPct = (crop.y / originalImage.naturalHeight) * 100;
  const cropWidthPct = (crop.width / originalImage.naturalWidth) * 100;
  const cropHeightPct = (crop.height / originalImage.naturalHeight) * 100;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col items-center justify-center p-2 bg-zinc-950 select-none overflow-hidden touch-none"
    >
      {/* Floating Zoom Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center bg-zinc-900/80 backdrop-blur border border-zinc-700/60 rounded-lg p-1 space-x-1 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-medium text-zinc-300 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={resetZoomAndPan}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
          title="Reset View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Two-finger instruction hint on mobile */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none md:hidden bg-zinc-900/70 backdrop-blur text-[10px] text-zinc-400 px-2 py-1 rounded-md border border-zinc-800">
        ✌️ Pinch with 2 fingers to zoom
      </div>

      {/* Main Canvas + Crop Area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
        className="relative max-w-full max-h-full aspect-auto shadow-2xl transition-transform duration-75 ease-out touch-none"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[75vh] md:max-h-[70vh] object-contain rounded block"
        />

        {/* Backdrop Mask */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            style={{
              clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${cropLeftPct}% ${cropTopPct}%, ${cropLeftPct}% ${cropTopPct + cropHeightPct}%, ${cropLeftPct + cropWidthPct}% ${cropTopPct + cropHeightPct}%, ${cropLeftPct + cropWidthPct}% ${cropTopPct}%, ${cropLeftPct}% ${cropTopPct}%)`
            }}
            className="w-full h-full bg-black/60 backdrop-blur-[1px]"
          />
        </div>

        {/* Crop Selection Frame */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'move')}
          style={{
            left: `${cropLeftPct}%`,
            top: `${cropTopPct}%`,
            width: `${cropWidthPct}%`,
            height: `${cropHeightPct}%`,
            borderColor: border.enabled ? border.color : '#3b82f6',
            borderStyle: border.enabled ? border.style : 'solid'
          }}
          className="absolute border-2 cursor-move shadow-outline touch-none"
        >
          {/* Rule of Thirds */}
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
            <div className="border-r border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div />
          </div>

          {/* Large Touch-friendly Corner Resize Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'se')}
            className="absolute -bottom-3 -right-3 w-7 h-7 bg-brand-500 border-2 border-white rounded-full cursor-se-resize shadow-lg flex items-center justify-center hover:scale-110 active:scale-125 transition-transform touch-none"
          >
            <div className="w-2 h-2 bg-white rounded-full pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};