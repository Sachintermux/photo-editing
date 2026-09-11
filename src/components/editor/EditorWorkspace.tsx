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

  const [zoom, setZoom] = useState(1);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState(crop);

  // Render baked preview onto canvas whenever image, adjustments, or crop changes
  const renderPreview = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport preview dimensions
    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;

    ctx.save();
    // Fill custom background color if set
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(originalImage, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();

    // Bake lighting filters in real-time
    applyLightingAdjustments(ctx, canvas.width, canvas.height, adjustments);
  }, [originalImage, rotation, flipH, flipV, adjustments, backgroundColor]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Handle pointer drag for crop manipulation
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
      // Pan crop frame
      const maxX = originalImage.naturalWidth - initialCrop.width;
      const maxY = originalImage.naturalHeight - initialCrop.height;
      setCrop({
        ...crop,
        x: Math.max(0, Math.min(maxX, initialCrop.x + deltaX)),
        y: Math.max(0, Math.min(maxY, initialCrop.y + deltaY))
      });
    } else if (dragHandle === 'se') {
      // Corner resize keeping aspect ratio locked
      let newW = Math.max(100, initialCrop.width + deltaX);
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

  if (!originalImage) return null;

  // Percentage calculations for responsive crop overlay box
  const cropLeftPct = (crop.x / originalImage.naturalWidth) * 100;
  const cropTopPct = (crop.y / originalImage.naturalHeight) * 100;
  const cropWidthPct = (crop.width / originalImage.naturalWidth) * 100;
  const cropHeightPct = (crop.height / originalImage.naturalHeight) * 100;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-zinc-950 select-none overflow-hidden">
      {/* Zoom controls floating bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center bg-zinc-900/80 backdrop-blur border border-zinc-700/60 rounded-lg p-1 space-x-1 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-medium text-zinc-300 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded"
          title="Reset Zoom"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Canvas + Crop overlay wrapper */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ transform: `scale(${zoom})` }}
        className="relative max-w-full max-h-[68vh] aspect-auto shadow-2xl transition-transform duration-100 ease-out touch-none"
      >
        <canvas ref={canvasRef} className="max-w-full max-h-[68vh] object-contain rounded block" />

        {/* Dimmed backdrop outside of crop area */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            style={{
              clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${cropLeftPct}% ${cropTopPct}%, ${cropLeftPct}% ${cropTopPct + cropHeightPct}%, ${cropLeftPct + cropWidthPct}% ${cropTopPct + cropHeightPct}%, ${cropLeftPct + cropWidthPct}% ${cropTopPct}%, ${cropLeftPct}% ${cropTopPct}%)`
            }}
            className="w-full h-full bg-black/60 backdrop-blur-[1px]"
          />
        </div>

        {/* Active Crop Frame with Rule of Thirds */}
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
          className="absolute border-2 cursor-move shadow-outline"
        >
          {/* Rule of Thirds lines */}
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
            <div className="border-r border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-r border-b border-white/60" />
            <div className="border-b border-white/60" />
            <div className="border-r border-white/60" />
            <div className="border-r border-white/60" />
            <div />
          </div>

          {/* Corner resize handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'se')}
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-brand-500 border-2 border-white rounded-full cursor-se-resize shadow-md flex items-center justify-center hover:scale-125 transition-transform"
          />
        </div>
      </div>
    </div>
  );
};