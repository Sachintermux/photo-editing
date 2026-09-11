import jsPDF from 'jspdf';
import { DPI, ExportFormat, PhotoPreset, BorderSettings, LightingAdjustments } from '../types';
import { mmToPixels } from './unitConverter';
import { applyLightingAdjustments } from './imageFilters';
import { PhotoCellPosition } from './gridCalculator';

/**
 * Render single edited photo to high-resolution Canvas at precise target DPI.
 */
export const renderSinglePhotoCanvas = async (
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  preset: PhotoPreset,
  dpi: DPI,
  adjustments: LightingAdjustments,
  border: BorderSettings,
  backgroundColor: string // 'transparent' or hex
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const targetWidthPx = mmToPixels(preset.widthMm, dpi);
  const targetHeightPx = mmToPixels(preset.heightMm, dpi);

  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Fill background
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
  }

  // Calculate borders and paddings in pixels
  const borderWidthPx = border.enabled ? mmToPixels(border.widthMm, dpi) : 0;
  const paddingPx = border.enabled ? mmToPixels(border.paddingMm, dpi) : 0;
  const radiusPx = border.enabled ? mmToPixels(border.radiusMm, dpi) : 0;

  const photoAreaX = borderWidthPx + paddingPx;
  const photoAreaY = borderWidthPx + paddingPx;
  const photoAreaW = Math.max(1, targetWidthPx - 2 * (borderWidthPx + paddingPx));
  const photoAreaH = Math.max(1, targetHeightPx - 2 * (borderWidthPx + paddingPx));

  // Save context for clipping and transformation
  ctx.save();

  // Rounded corner clipping for photo area
  if (radiusPx > 0) {
    drawRoundedRectPath(ctx, photoAreaX, photoAreaY, photoAreaW, photoAreaH, radiusPx);
    ctx.clip();
  }

  // Temporary canvas to process crop, flip, rotate and lighting
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = photoAreaW;
  tempCanvas.height = photoAreaH;
  const tCtx = tempCanvas.getContext('2d');

  if (tCtx) {
    tCtx.save();
    tCtx.translate(photoAreaW / 2, photoAreaH / 2);
    tCtx.rotate((rotation * Math.PI) / 180);
    tCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw source cropped segment scaled into target photo area
    tCtx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      -photoAreaW / 2,
      -photoAreaH / 2,
      photoAreaW,
      photoAreaH
    );
    tCtx.restore();

    // Bake lighting adjustments directly into pixels
    applyLightingAdjustments(tCtx, photoAreaW, photoAreaH, adjustments);

    // Draw baked photo onto main canvas
    ctx.drawImage(tempCanvas, photoAreaX, photoAreaY);
  }

  ctx.restore();

  // Draw border stroke if enabled
  if (border.enabled && borderWidthPx > 0) {
    ctx.save();
    ctx.strokeStyle = border.color;
    ctx.lineWidth = borderWidthPx;

    if (border.style === 'dashed') {
      ctx.setLineDash([borderWidthPx * 3, borderWidthPx * 2]);
    } else if (border.style === 'dotted') {
      ctx.setLineDash([borderWidthPx, borderWidthPx * 1.5]);
    }

    const halfB = borderWidthPx / 2;
    drawRoundedRectPath(
      ctx,
      halfB,
      halfB,
      targetWidthPx - borderWidthPx,
      targetHeightPx - borderWidthPx,
      radiusPx
    );
    ctx.stroke();
    ctx.restore();
  }

  return canvas;
};

const drawRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * Render complete printable layout sheet to high-resolution Canvas.
 */
export const renderLayoutSheetCanvas = async (
  singlePhotoCanvas: HTMLCanvasElement,
  pageWidthMm: number,
  pageHeightMm: number,
  dpi: DPI,
  cells: PhotoCellPosition[],
  showCuttingGuides: boolean
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const sheetWidthPx = mmToPixels(pageWidthMm, dpi);
  const sheetHeightPx = mmToPixels(pageHeightMm, dpi);

  canvas.width = sheetWidthPx;
  canvas.height = sheetHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Print paper background is always white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

  // Render each photo cell at exact coordinates
  for (const cell of cells) {
    const xPx = mmToPixels(cell.xMm, dpi);
    const yPx = mmToPixels(cell.yMm, dpi);
    const wPx = mmToPixels(cell.widthMm, dpi);
    const hPx = mmToPixels(cell.heightMm, dpi);

    ctx.drawImage(singlePhotoCanvas, xPx, yPx, wPx, hPx);

    // Cutting guides (trim marks) around each photo
    if (showCuttingGuides) {
      drawCropMarks(ctx, xPx, yPx, wPx, hPx, mmToPixels(2.5, dpi));
    }
  }

  return canvas;
};

const drawCropMarks = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  markLength: number
) => {
  ctx.save();
  ctx.strokeStyle = '#9ca3af'; // light gray guides
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x - markLength, y);
  ctx.lineTo(x, y);
  ctx.moveTo(x, y - markLength);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w + markLength, y);
  ctx.lineTo(x + w, y);
  ctx.moveTo(x + w, y - markLength);
  ctx.lineTo(x + w, y);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x - markLength, y + h);
  ctx.lineTo(x, y + h);
  ctx.moveTo(x, y + h + markLength);
  ctx.lineTo(x, y + h);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w + markLength, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y + h + markLength);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  ctx.restore();
};

/**
 * File downloader helper with Blob URL cleanup.
 */
export const downloadCanvasFile = (
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  filename: string,
  quality = 0.95
) => {
  if (format === 'pdf') return; // Handled separately by exportToPdf

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    mimeType,
    quality
  );
};

/**
 * Export to PDF preserving 100% true physical millimeter scale.
 */
export const exportToPdf = (
  canvas: HTMLCanvasElement,
  widthMm: number,
  heightMm: number,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  const doc = new jsPDF({
    orientation: orientation === 'portrait' ? 'p' : 'l',
    unit: 'mm',
    format: [widthMm, heightMm]
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  doc.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  doc.save(`${filename}.pdf`);
};