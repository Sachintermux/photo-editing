import { create } from 'zustand';
import {
  AppStep,
  BorderSettings,
  CropRect,
  DPI,
  LayoutSettings,
  LightingAdjustments,
  PhotoPreset,
  Unit
} from '../types';
import { DEFAULT_PRESET } from '../constants/presets';
import { DEFAULT_PAGE_SIZE } from '../constants/pageSizes';
import { DEFAULT_LIGHTING } from '../utils/imageFilters';
import { getTransformedDimensions } from '../utils/exportHelpers';

export interface EditorSnapshot {
  crop: CropRect;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  adjustments: LightingAdjustments;
  backgroundColor: string;
  border: BorderSettings;
}

interface PhotoStoreState {
  currentStep: AppStep;
  setStep: (step: AppStep) => void;

  originalImage: HTMLImageElement | null;
  imageSrc: string | null;
  isAiRemovingBg: boolean;
  bgRemovalProgress: number;
  bgRemovalStatus: string;
  setImage: (img: HTMLImageElement, src: string) => void;
  resetProject: () => void;

  selectedPreset: PhotoPreset;
  customWidth: number;
  customHeight: number;
  unit: Unit;
  dpi: DPI;
  setPreset: (p: PhotoPreset) => void;
  setCustomSize: (w: number, h: number, unit: Unit) => void;
  setDpi: (dpi: DPI) => void;

  crop: CropRect;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  setCrop: (crop: CropRect) => void;
  rotate90: (direction?: 'cw' | 'ccw') => void;
  setRotation: (deg: number) => void;
  toggleFlipH: () => void;
  toggleFlipV: () => void;
  resetTransform: () => void;

  adjustments: LightingAdjustments;
  setAdjustment: (key: keyof LightingAdjustments, value: number) => void;
  setAllAdjustments: (adj: LightingAdjustments) => void;
  resetAdjustments: () => void;

  backgroundColor: string;
  border: BorderSettings;
  setBackgroundColor: (color: string) => void;
  setBorder: (border: Partial<BorderSettings>) => void;
  setIsAiRemovingBg: (val: boolean, status?: string, progress?: number) => void;

  layout: LayoutSettings;
  setLayout: (settings: Partial<LayoutSettings>) => void;

  history: EditorSnapshot[];
  future: EditorSnapshot[];
  undo: () => void;
  redo: () => void;
  pushHistorySnapshot: () => void;
}

// Adjusts crop rectangle to remain within valid transformed canvas bounds
const fitCropToBounds = (
  currentCrop: CropRect,
  boundsW: number,
  boundsH: number,
  aspect: number
): CropRect => {
  let w = currentCrop.width;
  let h = w / aspect;

  if (w > boundsW) {
    w = boundsW;
    h = w / aspect;
  }
  if (h > boundsH) {
    h = boundsH;
    w = h * aspect;
  }

  if (w <= 0 || h <= 0 || isNaN(w) || isNaN(h)) {
    w = boundsW * 0.8;
    h = w / aspect;
    if (h > boundsH) {
      h = boundsH * 0.8;
      w = h * aspect;
    }
  }

  const x = Math.max(0, Math.min(currentCrop.x, boundsW - w));
  const y = Math.max(0, Math.min(currentCrop.y, boundsH - h));

  return { x, y, width: w, height: h };
};

export const usePhotoStore = create<PhotoStoreState>((set, get) => ({
  currentStep: 'upload',
  setStep: (step) => set({ currentStep: step }),

  originalImage: null,
  imageSrc: null,
  isAiRemovingBg: false,
  bgRemovalProgress: 0,
  bgRemovalStatus: '',

  setImage: (img, src) => {
    const targetAspect = DEFAULT_PRESET.widthMm / DEFAULT_PRESET.heightMm;
    let cW = img.naturalWidth * 0.85;
    let cH = cW / targetAspect;
    if (cH > img.naturalHeight) {
      cH = img.naturalHeight * 0.85;
      cW = cH * targetAspect;
    }

    const cX = (img.naturalWidth - cW) / 2;
    const cY = (img.naturalHeight - cH) / 2;

    set({
      originalImage: img,
      imageSrc: src,
      currentStep: 'edit',
      crop: { x: cX, y: cY, width: cW, height: cH },
      rotation: 0,
      flipH: false,
      flipV: false,
      history: [],
      future: []
    });
  },

  resetProject: () =>
    set({
      currentStep: 'upload',
      originalImage: null,
      imageSrc: null,
      rotation: 0,
      flipH: false,
      flipV: false,
      adjustments: { ...DEFAULT_LIGHTING },
      backgroundColor: 'transparent',
      history: [],
      future: []
    }),

  selectedPreset: DEFAULT_PRESET,
  customWidth: 35,
  customHeight: 45,
  unit: 'mm',
  dpi: 300,

  setPreset: (preset) => {
    const { originalImage, crop, rotation } = get();
    if (!originalImage) {
      set({ selectedPreset: preset });
      return;
    }

    const bounds = getTransformedDimensions(
      originalImage.naturalWidth,
      originalImage.naturalHeight,
      rotation
    );
    const aspect = preset.widthMm / preset.heightMm;
    const newCrop = fitCropToBounds(crop, bounds.width, bounds.height, aspect);

    set({ selectedPreset: preset, crop: newCrop });
  },

  setCustomSize: (w, h, unit) => {
    const customPreset: PhotoPreset = {
      id: 'custom',
      name: `Custom (${w} x ${h} ${unit})`,
      category: 'standard',
      widthMm: unit === 'in' ? w * 25.4 : unit === 'cm' ? w * 10 : w,
      heightMm: unit === 'in' ? h * 25.4 : unit === 'cm' ? h * 10 : h,
      description: 'Custom user defined photo dimensions'
    };
    get().setPreset(customPreset);
    set({ customWidth: w, customHeight: h, unit });
  },

  setDpi: (dpi) => set({ dpi }),

  crop: { x: 0, y: 0, width: 300, height: 400 },
  rotation: 0,
  flipH: false,
  flipV: false,
  setCrop: (crop) => set({ crop }),

  rotate90: (dir = 'cw') => {
    get().pushHistorySnapshot();
    const current = get().rotation;
    const next = dir === 'cw' ? (current + 90) % 360 : (current - 90 + 360) % 360;
    const img = get().originalImage;

    if (img) {
      const bounds = getTransformedDimensions(img.naturalWidth, img.naturalHeight, next);
      const aspect = get().selectedPreset.widthMm / get().selectedPreset.heightMm;
      const newCrop = fitCropToBounds(get().crop, bounds.width, bounds.height, aspect);
      set({ rotation: next, crop: newCrop });
    } else {
      set({ rotation: next });
    }
  },

  setRotation: (deg) => {
    const img = get().originalImage;
    if (img) {
      const bounds = getTransformedDimensions(img.naturalWidth, img.naturalHeight, deg);
      const aspect = get().selectedPreset.widthMm / get().selectedPreset.heightMm;
      const newCrop = fitCropToBounds(get().crop, bounds.width, bounds.height, aspect);
      set({ rotation: deg, crop: newCrop });
    } else {
      set({ rotation: deg });
    }
  },

  toggleFlipH: () => {
    get().pushHistorySnapshot();
    set((s) => ({ flipH: !s.flipH }));
  },

  toggleFlipV: () => {
    get().pushHistorySnapshot();
    set((s) => ({ flipV: !s.flipV }));
  },

  resetTransform: () => {
    get().pushHistorySnapshot();
    const img = get().originalImage;
    if (img) {
      const aspect = get().selectedPreset.widthMm / get().selectedPreset.heightMm;
      const newCrop = fitCropToBounds(get().crop, img.naturalWidth, img.naturalHeight, aspect);
      set({ rotation: 0, flipH: false, flipV: false, crop: newCrop });
    } else {
      set({ rotation: 0, flipH: false, flipV: false });
    }
  },

  adjustments: { ...DEFAULT_LIGHTING },
  setAdjustment: (key, val) =>
    set((s) => ({ adjustments: { ...s.adjustments, [key]: val } })),
  setAllAdjustments: (adj) => {
    get().pushHistorySnapshot();
    set({ adjustments: adj });
  },
  resetAdjustments: () => {
    get().pushHistorySnapshot();
    set({ adjustments: { ...DEFAULT_LIGHTING } });
  },

  backgroundColor: 'transparent',
  border: {
    enabled: false,
    color: '#000000',
    widthMm: 0.1,
    style: 'solid',
    radiusMm: 0,
    paddingMm: 0
  },
  setBackgroundColor: (color) => {
    get().pushHistorySnapshot();
    set({ backgroundColor: color });
  },
  setBorder: (b) => {
    get().pushHistorySnapshot();
    set((s) => ({ border: { ...s.border, ...b } }));
  },
  setIsAiRemovingBg: (val, status = '', progress = 0) =>
    set({ isAiRemovingBg: val, bgRemovalStatus: status, bgRemovalProgress: progress }),

  layout: {
    pageSizeId: DEFAULT_PAGE_SIZE.id,
    customPageWidthMm: 210,
    customPageHeightMm: 297,
    orientation: 'portrait',
    dpi: 300,
    duplicateCount: 6,
    spacingHorizontalMm: 5,
    spacingVerticalMm: 5,
    marginTopMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 10,
    marginRightMm: 10,
    showCuttingGuides: true
  },
  setLayout: (settings) =>
    set((s) => ({
      layout: { ...s.layout, ...settings }
    })),

  history: [],
  future: [],
  pushHistorySnapshot: () => {
    const s = get();
    const snap: EditorSnapshot = {
      crop: { ...s.crop },
      rotation: s.rotation,
      flipH: s.flipH,
      flipV: s.flipV,
      adjustments: { ...s.adjustments },
      backgroundColor: s.backgroundColor,
      border: { ...s.border }
    };
    set((state) => ({
      history: [...state.history.slice(-20), snap],
      future: []
    }));
  },
  undo: () => {
    const { history, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const s = get();
    const currentSnap: EditorSnapshot = {
      crop: { ...s.crop },
      rotation: s.rotation,
      flipH: s.flipH,
      flipV: s.flipV,
      adjustments: { ...s.adjustments },
      backgroundColor: s.backgroundColor,
      border: { ...s.border }
    };
    set({
      crop: previous.crop,
      rotation: previous.rotation,
      flipH: previous.flipH,
      flipV: previous.flipV,
      adjustments: previous.adjustments,
      backgroundColor: previous.backgroundColor,
      border: previous.border,
      history: history.slice(0, -1),
      future: [currentSnap, ...future]
    });
  },
  redo: () => {
    const { history, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    const s = get();
    const currentSnap: EditorSnapshot = {
      crop: { ...s.crop },
      rotation: s.rotation,
      flipH: s.flipH,
      flipV: s.flipV,
      adjustments: { ...s.adjustments },
      backgroundColor: s.backgroundColor,
      border: { ...s.border }
    };
    set({
      crop: next.crop,
      rotation: next.rotation,
      flipH: next.flipH,
      flipV: next.flipV,
      adjustments: next.adjustments,
      backgroundColor: next.backgroundColor,
      border: next.border,
      history: [...history, currentSnap],
      future: future.slice(1)
    });
  }
}));