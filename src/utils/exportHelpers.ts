import jsPDF from 'jspdf';
import { DPI, ExportFormat, PhotoPreset, BorderSettings, LightingAdjustments } from '../types';
import { mmToPixels } from './unitConverter';
import { applyLightingAdjustments } from './imageFilters';
import { PhotoCellPosition } from './gridCalculator';

/**
 * Calculates the exact bounding box width and height for any rotation angle.
 */
export const getTransformedDimensions = (width: number, height: number, rotation: number) => {
  const rad = (rotation * Math.PI) / 180;
  const boxW = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
  const boxH = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
  return { width: Math.round(boxW), height: Math.round(boxH) };
};

/**
 * Renders the source image with rotation and flips baked in.
 */
export const createTransformedSourceCanvas = (
  image: HTMLImageElement,
  rotation: number,
  flipH: boolean,
  flipV: boolean
): HTMLCanvasElement => {
  const { width: boxW, height: boxH } = getTransformedDimensions(
    image.naturalWidth,
    image.naturalHeight,
    rotation
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, boxW);
  canvas.height = Math.max(1, boxH);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2,
    image.naturalWidth,
    image.naturalHeight
  );
  ctx.restore();

  return canvas;
};

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
  backgroundColor: string
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const targetWidthPx = mmToPixels(preset.widthMm, dpi);
  const targetHeightPx = mmToPixels(preset.heightMm, dpi);

  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Fill background
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
  }

  // 2. Calculate borders and paddings in pixels
  const borderWidthPx = border.enabled ? mmToPixels(border.widthMm, dpi) : 0;
  const paddingPx = border.enabled ? mmToPixels(border.paddingMm, dpi) : 0;
  const radiusPx = border.enabled ? mmToPixels(border.radiusMm, dpi) : 0;

  const photoAreaX = borderWidthPx + paddingPx;
  const photoAreaY = borderWidthPx + paddingPx;
  const photoAreaW = Math.max(1, targetWidthPx - 2 * (borderWidthPx + paddingPx));
  const photoAreaH = Math.max(1, targetHeightPx - 2 * (borderWidthPx + paddingPx));

  ctx.save();
  if (radiusPx > 0) {
    drawRoundedRectPath(ctx, photoAreaX, photoAreaY, photoAreaW, photoAreaH, radiusPx);
    ctx.clip();
  }

  // 3. Bake rotation and flips into an intermediate source canvas
  const transformedSource = createTransformedSourceCanvas(image, rotation, flipH, flipV);

  // 4. Crop from the transformed source into the target photo area
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = photoAreaW;
  tempCanvas.height = photoAreaH;
  const tCtx = tempCanvas.getContext('2d');

  if (tCtx) {
    const sx = Math.max(0, Math.min(crop.x, transformedSource.width - 1));
    const sy = Math.max(0, Math.min(crop.y, transformedSource.height - 1));
    const sw = Math.min(crop.width, transformedSource.width - sx);
    const sh = Math.min(crop.height, transformedSource.height - sy);

    tCtx.drawImage(transformedSource, sx, sy, sw, sh, 0, 0, photoAreaW, photoAreaH);

    // 5. Bake lighting filters
    applyLightingAdjustments(tCtx, photoAreaW, photoAreaH, adjustments);

    // 6. Composite onto main canvas
    ctx.drawImage(tempCanvas, photoAreaX, photoAreaY);
  }

  ctx.restore();

  // 7. Draw border stroke if enabled
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

  // Sheet paper is white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

  for (const cell of cells) {
    const xPx = mmToPixels(cell.xMm, dpi);
    const yPx = mmToPixels(cell.yMm, dpi);
    const wPx = mmToPixels(cell.widthMm, dpi);
    const hPx = mmToPixels(cell.heightMm, dpi);

    ctx.drawImage(singlePhotoCanvas, xPx, yPx, wPx, hPx);

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
  ctx.strokeStyle = '#9ca3af';
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

export const downloadCanvasFile = (
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  filename: string,
  quality = 0.95
) => {
  if (format === 'pdf') return;

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