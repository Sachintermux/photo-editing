import { LightingAdjustments } from '../types';

export const DEFAULT_LIGHTING: LightingAdjustments = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  vignette: 0
};

/**
 * High-performance offscreen pixel processing baking all 10 lighting adjustments
 * directly into image data pixels.
 */
export const applyLightingAdjustments = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: LightingAdjustments
) => {
 const isDefault = Object.values(adjustments).every((val) => val === 0);
  if (isDefault) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Pre-calculations
  const brightnessOffset = adjustments.brightness * 2.55; // [-255, 255]
  const contrastFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
  const exposureMult = Math.pow(2, adjustments.exposure / 100);
  const satMult = 1 + adjustments.saturation / 100;

  // Temperature: warm (more R, less B) vs cold (more B, less R)
  const tempR = adjustments.temperature > 0 ? adjustments.temperature * 0.8 : adjustments.temperature * 0.3;
  const tempB = adjustments.temperature > 0 ? -adjustments.temperature * 0.6 : -adjustments.temperature * 0.9;

  // Tint: green (-) to magenta (+)
  const tintG = -adjustments.tint * 0.6;
  const tintR = adjustments.tint * 0.3;
  const tintB = adjustments.tint * 0.3;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  const vignetteStrength = adjustments.vignette / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue; // Transparent pixel

    // 1. Exposure
    if (adjustments.exposure !== 0) {
      r *= exposureMult;
      g *= exposureMult;
      b *= exposureMult;
    }

    // 2. Brightness
    if (adjustments.brightness !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    // 3. Contrast
    if (adjustments.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 4. Color Temperature & Tint
    r += tempR + tintR;
    g += tintG;
    b += tempB + tintB;

    // 5. Highlights & Shadows
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (adjustments.shadows !== 0 && lum < 128) {
      const shadowDelta = (adjustments.shadows / 100) * (1 - lum / 128) * 45;
      r += shadowDelta;
      g += shadowDelta;
      b += shadowDelta;
    }
    if (adjustments.highlights !== 0 && lum >= 128) {
      const highlightDelta = (adjustments.highlights / 100) * ((lum - 128) / 128) * 45;
      r += highlightDelta;
      g += highlightDelta;
      b += highlightDelta;
    }

    // 6. Saturation
    if (adjustments.saturation !== 0) {
      const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = currentLum + (r - currentLum) * satMult;
      g = currentLum + (g - currentLum) * satMult;
      b = currentLum + (b - currentLum) * satMult;
    }

    // 7. Vignette
    if (vignetteStrength > 0) {
      const pixelIdx = i / 4;
      const x = pixelIdx % width;
      const y = Math.floor(pixelIdx / width);
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const vigFactor = Math.max(0, 1 - (dist / maxDist) * vignetteStrength * 1.3);
      r *= vigFactor;
      g *= vigFactor;
      b *= vigFactor;
    }

    // Clamp
    data[i] = Math.min(255, Math.max(0, Math.round(r)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }

  // 8. Sharpness (Convolution 3x3 kernel)
  if (adjustments.sharpness > 0) {
    applySharpness(imgData, width, height, adjustments.sharpness / 100);
  }

  ctx.putImageData(imgData, 0, 0);
};

const applySharpness = (imgData: ImageData, w: number, h: number, strength: number) => {
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;
  const k = strength * 0.7; // factor

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = src[((y - 1) * w + x) * 4 + c];
        const bottom = src[((y + 1) * w + x) * 4 + c];
        const left = src[(y * w + (x - 1)) * 4 + c];
        const right = src[(y * w + (x + 1)) * 4 + c];
        const center = src[idx + c];

        const sharpened = center + k * (4 * center - top - bottom - left - right);
        dst[idx + c] = Math.min(255, Math.max(0, Math.round(sharpened)));
      }
    }
  }
};

/** Automatic histogram stretch & contrast normalization */
export const calculateAutoEnhance = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): Partial<LightingAdjustments> => {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  let minLum = 255;
  let maxLum = 0;
  let sumLum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] === 0) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
    sumLum += lum;
    count++;
  }

  if (count === 0) return {};
  const avgLum = sumLum / count;

  // Calculate recommended adjustments
  const brightness = Math.round((128 - avgLum) * 0.25);
  const contrast = Math.round(Math.min(25, (255 / Math.max(50, maxLum - minLum) - 1) * 30));

  return {
    brightness: Math.max(-20, Math.min(25, brightness)),
    contrast: Math.max(5, Math.min(30, contrast)),
    saturation: 8,
    highlights: -10,
    shadows: 15,
    sharpness: 25
  };
};