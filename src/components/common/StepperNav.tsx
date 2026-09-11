import React from 'react';
import { UploadCloud, Sliders, Download, Grid, FileCheck } from 'lucide-react';
import { AppStep } from '../../types';
import { usePhotoStore } from '../../store/usePhotoStore';

export const StepperNav: React.FC = () => {
  const { currentStep, setStep, originalImage } = usePhotoStore();

  const steps: { id: AppStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'upload', label: '1. Upload', icon: UploadCloud },
    { id: 'edit', label: '2. Edit Photo', icon: Sliders },
    { id: 'export-single', label: '3. Single Export', icon: Download },
    { id: 'layout', label: '4. Print Sheet', icon: Grid },
    { id: 'export-layout', label: '5. Export Sheet', icon: FileCheck }
  ];

  return (
    <nav className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-2 sm:px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar space-x-1">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDisabled = !originalImage && step.id !== 'upload';

          return (
            <button
              key={step.id}
              disabled={isDisabled}
              onClick={() => setStep(step.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 font-semibold'
                  : isDisabled
                  ? 'text-gray-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};