# PhotoCraft Studio 📸

A client-side web application for editing photos, resizing them to international passport & print standards, and automatically arranging duplicate copies on printable sheets (A4, 4x6", Letter, etc.) with cut marks and 100% true-to-scale PDF/image exports.

## Key Features
- **100% Client-Side Architecture**: Zero paid APIs; runs in the browser.
- **Official Passport Presets**:
    - Standard Passport (35 x 45 mm)
    - US Passport / Visa (2 x 2 in / 50.8 x 50.8 mm)
    - Canada Passport (50 x 70 mm)
    - China Visa (33 x 48 mm)
    - Japan Visa (35 x 45 mm)
    - Stamp Size (20 x 25 mm)
    - Standard Prints (4x6", 5x7", 6x8")
    - Custom user dimensions in `mm`, `cm`, or `in`.
- **Pixel-Baking Image Pipeline**:
    - Brightness, Contrast, Exposure, Saturation, Color Temperature, Tint, Highlights, Shadows, 3x3 Convolution Sharpness, Vignette, and 1-click Auto-Enhance.
- **In-Browser Open-Source AI Background Removal**:
    - Powered by `@imgly/background-removal` running via WebAssembly/Web Workers.
    - Background replacement palette: Transparent, Pure White, Light Blue, Royal Blue, Red, or Custom Hex.
- **Print Layout Sheet Generator**:
    - Paper sizes: A4, A3, A5, Letter, Legal, 4x6" (10x15cm), 5x7", B5, B6.
    - Auto-calculates maximum duplicate capacity with spacing & margin constraints.
    - Cutting guides / crop marks toggle for effortless scissor or trimmer alignment.
- **High-DPI PDF & Image Exports**:
    - 72, 150, 300, and 600 DPI rendering.
    - Generates PDFs with physical millimeter scales so prints match official embassy requirements without distortion.

## Getting Started

### 1. Install Dependencies
```bash
npm install