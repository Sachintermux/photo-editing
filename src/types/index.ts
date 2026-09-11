export type Unit = 'mm' | 'cm' | 'in';
export type DPI = 72 | 150 | 300 | 600;
export type ExportFormat = 'png' | 'jpeg' | 'pdf';
export type AppStep = 'upload' | 'edit' | 'export-single' | 'layout' | 'export-layout';

export interface PhotoPreset {
  id: string;
  name: string;
  category: 'passport' | 'visa' | 'print' | 'standard';
  widthMm: number;
  heightMm: number;
  description: string;
}

export interface PageSizePreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LightingAdjustments {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  exposure: number;    // -100 to 100
  saturation: number;  // -100 to 100
  temperature: number; // -100 to 100 (blue to orange)
  tint: number;        // -100 to 100 (green to magenta)
  highlights: number;  // -100 to 100
  shadows: number;     // -100 to 100
  sharpness: number;   // 0 to 100
  vignette: number;    // 0 to 100
}

export interface BorderSettings {
  enabled: boolean;
  color: string;
  widthMm: number;
  style: 'solid' | 'dashed' | 'dotted';
  radiusMm: number;
  paddingMm: number;
}

export interface LayoutSettings {
  pageSizeId: string;
  customPageWidthMm: number;
  customPageHeightMm: number;
  orientation: 'portrait' | 'landscape';
  dpi: DPI;
  duplicateCount: number;
  spacingHorizontalMm: number;
  spacingVerticalMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  showCuttingGuides: boolean;
}