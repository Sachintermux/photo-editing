import { DPI, Unit } from '../types';

export const MM_PER_INCH = 25.4;

export const mmToInches = (mm: number): number => mm / MM_PER_INCH;
export const inchesToMm = (inches: number): number => inches * MM_PER_INCH;
export const cmToMm = (cm: number): number => cm * 10;
export const mmToCm = (mm: number): number => mm / 10;

/** Convert any unit to millimeters */
export const toMm = (val: number, unit: Unit): number => {
  switch (unit) {
    case 'in': return inchesToMm(val);
    case 'cm': return cmToMm(val);
    case 'mm': default: return val;
  }
};

/** Convert millimeters to specified unit */
export const fromMm = (mm: number, unit: Unit): number => {
  switch (unit) {
    case 'in': return mmToInches(mm);
    case 'cm': return mmToCm(mm);
    case 'mm': default: return mm;
  }
};

/** Convert physical millimeters to canvas pixels at chosen DPI */
export const mmToPixels = (mm: number, dpi: DPI): number => {
  return Math.round((mm / MM_PER_INCH) * dpi);
};

/** Convert pixels to physical millimeters at chosen DPI */
export const pixelsToMm = (px: number, dpi: DPI): number => {
  return (px / dpi) * MM_PER_INCH;
};

/** Calculate effective resolution (DPI) from cropped pixel size and target mm */
export const calculateEffectiveDpi = (pixels: number, targetMm: number): number => {
  if (targetMm <= 0) return 0;
  return Math.round((pixels / (targetMm / MM_PER_INCH)));
};