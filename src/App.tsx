import React, { useState, useEffect } from 'react';
import { usePhotoStore } from './store/usePhotoStore';
import { Header } from './components/common/Header';
import { StepperNav } from './components/common/StepperNav';
import { DropZone } from './components/upload/DropZone';
import { EditorWorkspace } from './components/editor/EditorWorkspace';
import { SizePanel } from './components/editor/SizePanel';
import { AdjustmentsPanel } from './components/editor/AdjustmentsPanel';
import { TransformPanel } from './components/editor/TransformPanel';
import { BackgroundPanel } from './components/editor/BackgroundPanel';
import { BorderPanel } from './components/editor/BorderPanel';
import { SingleExportModal } from './components/export/SingleExportModal';
import { LayoutWorkspace } from './components/layout/LayoutWorkspace';
import { LayoutSidebar } from './components/layout/LayoutSidebar';
import { LayoutExportModal } from './components/layout/LayoutExportModal';
import { Crop, Sliders, RefreshCw, Palette, Square, Download } from 'lucide-react';

type EditorTab = 'size' | 'adjust' | 'transform' | 'background' | 'border';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('size');
  const { currentStep, originalImage, setStep } = usePhotoStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const editorTabs: { id: EditorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'size', label: 'Size & Crop', icon: Crop },
    { id: 'adjust', label: 'Lighting', icon: Sliders },
    { id: 'transform', label: 'Transform', icon: RefreshCw },
    { id: 'background', label: 'Background', icon: Palette },
    { id: 'border', label: 'Borders', icon: Square }
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-zinc-950 font-sans">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <StepperNav />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* STEP 1: Upload */}
        {currentStep === 'upload' && <DropZone />}

        {/* STEP 2: Photo Editor */}
        {currentStep === 'edit' && originalImage && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Editor Canvas Canvas */}
            <div className="flex-1 h-1/2 md:h-full relative overflow-hidden bg-zinc-950">
              <EditorWorkspace />
            </div>

            {/* Sidebar / Bottom Drawer for Editing Tools */}
            <div className="w-full md:w-80 lg:w-96 h-1/2 md:h-full bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden shadow-lg">
              {/* Tab navigation for Editor Controls */}
              <div className="flex border-b border-gray-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
                {editorTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 min-w-[70px] py-3 px-1 flex flex-col items-center justify-center space-y-1 text-[11px] font-medium transition ${
                        isActive
                          ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Panel Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'size' && <SizePanel />}
                {activeTab === 'adjust' && <AdjustmentsPanel />}
                {activeTab === 'transform' && <TransformPanel />}
                {activeTab === 'background' && <BackgroundPanel />}
                {activeTab === 'border' && <BorderPanel />}
              </div>

              {/* Quick Action Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80 flex items-center space-x-2">
                <button
                  onClick={() => setStep('export-single')}
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-lg flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Single</span>
                </button>
                <button
                  onClick={() => setStep('layout')}
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
                >
                  Continue to Layout →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Single Export */}
        {currentStep === 'export-single' && originalImage && (
          <div className="flex-1 overflow-y-auto p-4">
            <SingleExportModal />
          </div>
        )}

        {/* STEP 4: Print Sheet Layout */}
        {currentStep === 'layout' && originalImage && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 h-1/2 md:h-full relative overflow-hidden bg-zinc-950">
              <LayoutWorkspace />
            </div>
            <div className="w-full md:w-80 lg:w-96 h-1/2 md:h-full bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-zinc-800 flex flex-col overflow-y-auto shadow-lg">
              <LayoutSidebar />
            </div>
          </div>
        )}

        {/* STEP 5: Export Print Sheet */}
        {currentStep === 'export-layout' && originalImage && (
          <div className="flex-1 overflow-y-auto p-4">
            <LayoutExportModal />
          </div>
        )}
      </main>
    </div>
  );
};