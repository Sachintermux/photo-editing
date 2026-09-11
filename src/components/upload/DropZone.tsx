import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';

export const DropZone: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setImage } = usePhotoStore();

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|webp|jpg)/i)) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImage(img, src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Quick-load demo portrait for immediate testing without personal photo
  const loadDemoPortrait = () => {
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 1200;
    demoCanvas.height = 1600;
    const ctx = demoCanvas.getContext('2d');
    if (!ctx) return;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, 1600);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1600);

    // Draw stylized portrait silhouette
    ctx.fillStyle = '#334155';
    // Head
    ctx.beginPath();
    ctx.arc(600, 650, 220, 0, Math.PI * 2);
    ctx.fill();
    // Torso / Shoulders
    ctx.beginPath();
    ctx.ellipse(600, 1250, 420, 350, 0, 0, Math.PI * 2);
    ctx.fill();

    const dataUrl = demoCanvas.toDataURL('image/jpeg', 0.95);
    const img = new Image();
    img.onload = () => setImage(img, dataUrl);
    img.src = dataUrl;
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[75vh]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all duration-200 flex flex-col items-center justify-center space-y-4 shadow-sm ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
            : 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:border-brand-400 dark:hover:border-brand-500'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Upload your photo
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-sm">
            Drag and drop your image here, or tap to browse from your gallery / camera.
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Supports High-Res JPG, PNG, WEBP</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        <span className="text-xs text-gray-500 dark:text-zinc-500">Need a test image?</span>
        <button
          onClick={loadDemoPortrait}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Load Demo Passport Portrait</span>
        </button>
      </div>
    </div>
  );
};