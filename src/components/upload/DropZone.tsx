import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, FolderOpen } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';
import { PassportCameraModal } from '../camera/PassportCameraModal';

export const DropZone: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
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

  // Called when camera captures an image snapshot
  const handleCameraCapture = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setImage(img, dataUrl);
    };
    img.src = dataUrl;
  };

  // Quick-load demo portrait for instant testing without camera or upload
  const loadDemoPortrait = () => {
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 1200;
    demoCanvas.height = 1600;
    const ctx = demoCanvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 1600);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1600);

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
      {/* AI Live Camera Modal */}
      <PassportCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

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
        className={`w-full p-6 sm:p-10 border-2 border-dashed rounded-3xl text-center transition-all duration-200 flex flex-col items-center justify-center space-y-6 shadow-sm ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
            : 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/60'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
          <Camera className="w-8 h-8" />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Create Passport & Print Photo
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
            Take a photo using our live AI biometric guide or choose an existing photo from your gallery.
          </p>
        </div>

        {/* Dual Primary Action Buttons for Mobile & Desktop */}
        <div className="w-full flex flex-col sm:flex-row gap-3 pt-2 max-w-md">
          {/* Button 1: Live AI Camera */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition"
          >
            <Camera className="w-4 h-4" />
            <span>Open AI Camera</span>
          </button>

          {/* Button 2: Choose from Gallery / Files */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-98 text-gray-800 dark:text-zinc-200 text-xs font-bold rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-center space-x-2 transition"
          >
            <FolderOpen className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
            <span>Choose from Gallery</span>
          </button>
        </div>

        <div className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800/80 px-3 py-1 rounded-full">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Accepts JPG, PNG, WEBP — or drag & drop</span>
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

      <div className="mt-6 flex items-center gap-3 w-full justify-center">
        <span className="text-xs text-gray-500 dark:text-zinc-500">Need a quick test?</span>
        <button
          onClick={loadDemoPortrait}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Load Demo Portrait</span>
        </button>
      </div>
    </div>
  );
};