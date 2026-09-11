import React from 'react';
import { Camera, Undo2, Redo2, RotateCcw, Moon, Sun, Printer } from 'lucide-react';
import { usePhotoStore } from '../../store/usePhotoStore';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode }) => {
  const { currentStep, undo, redo, history, future, resetProject, originalImage, setStep } =
    usePhotoStore();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-gray-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center space-x-2.5">
        <div className="bg-brand-600 text-white p-1.5 rounded-lg shadow-sm">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-gray-900 dark:text-white leading-none">
            PhotoCraft Studio
          </h1>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium">
            Passport & Print Creator
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2">
        {originalImage && currentStep === 'edit' && (
          <>
            <button
              onClick={undo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
              className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={resetProject}
              title="Reset project"
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}

        {originalImage && currentStep === 'edit' && (
          <button
            onClick={() => setStep('layout')}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Continue to Layout</span>
            <span className="sm:hidden">Layout</span>
          </button>
        )}

        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
          className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};