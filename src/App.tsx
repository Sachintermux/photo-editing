import React, { useState, useEffect, useRef } from 'react';
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
import { AiLoadingModal } from './components/common/AiLoadingModal';
import { Crop, Sliders, RefreshCw, Palette, Square, Download, ChevronUp, ChevronDown } from 'lucide-react';

type EditorTab = 'size' | 'adjust' | 'transform' | 'background' | 'border';
type SheetPosition = 'collapsed' | 'half' | 'expanded';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('size');
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>('half');
  const [layoutSheetPosition, setLayoutSheetPosition] = useState<SheetPosition>('half');
  const { currentStep, originalImage, setStep } = usePhotoStore();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Touch tracking for swipe gestures on Editor bottom drawer
  const touchStartY = useRef<number>(0);
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -40) {
      if (sheetPosition === 'collapsed') setSheetPosition('half');
      else if (sheetPosition === 'half') setSheetPosition('expanded');
    } else if (deltaY > 40) {
      if (sheetPosition === 'expanded') setSheetPosition('half');
      else if (sheetPosition === 'half') setSheetPosition('collapsed');
    }
  };

  const cycleSheetPosition = () => {
    if (sheetPosition === 'collapsed') setSheetPosition('half');
    else if (sheetPosition === 'half') setSheetPosition('expanded');
    else setSheetPosition('collapsed');
  };

  // Touch tracking for swipe gestures on Layout bottom drawer
  const layoutTouchStartY = useRef<number>(0);
  const handleLayoutSheetTouchStart = (e: React.TouchEvent) => {
    layoutTouchStartY.current = e.touches[0].clientY;
  };
  const handleLayoutSheetTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - layoutTouchStartY.current;
    if (deltaY < -40) {
      if (layoutSheetPosition === 'collapsed') setLayoutSheetPosition('half');
      else if (layoutSheetPosition === 'half') setLayoutSheetPosition('expanded');
    } else if (deltaY > 40) {
      if (layoutSheetPosition === 'expanded') setLayoutSheetPosition('half');
      else if (layoutSheetPosition === 'half') setLayoutSheetPosition('collapsed');
    }
  };

  const cycleLayoutSheetPosition = () => {
    if (layoutSheetPosition === 'collapsed') setLayoutSheetPosition('half');
    else if (layoutSheetPosition === 'half') setLayoutSheetPosition('expanded');
    else setLayoutSheetPosition('collapsed');
  };

  const editorTabs: { id: EditorTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'size', label: 'Size', icon: Crop },
    { id: 'adjust', label: 'Lighting', icon: Sliders },
    { id: 'transform', label: 'Rotate', icon: RefreshCw },
    { id: 'background', label: 'Bg AI', icon: Palette },
    { id: 'border', label: 'Border', icon: Square }
  ];

  const getSheetHeightClass = (pos: SheetPosition) => {
    switch (pos) {
      case 'collapsed':
        return 'h-[64px]';
      case 'expanded':
        return 'h-[82vh]';
      case 'half':
      default:
        return 'h-[46vh]';
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-zinc-950 font-sans transition-colors duration-200">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <StepperNav />

      {/* Global Non-Blocking Background Worker Modal */}
      <AiLoadingModal />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* STEP 1: Upload */}
        {currentStep === 'upload' && <DropZone />}

        {/* STEP 2: Photo Editor */}
        {currentStep === 'edit' && originalImage && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            <div className="flex-1 w-full h-full relative overflow-hidden bg-gray-200 dark:bg-zinc-950 pb-[64px] md:pb-0 transition-colors duration-200">
              <EditorWorkspace />
            </div>

            {/* Slide up/down Drawer on mobile, Sidebar on desktop */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-30 md:static md:w-80 lg:w-96 md:h-full bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-zinc-800 flex flex-col shadow-2xl transition-all duration-300 ease-out rounded-t-2xl md:rounded-none ${getSheetHeightClass(sheetPosition)}`}
            >
              {/* Mobile Drag Bar Handle & Up/Down Toggle */}
              <div
                onTouchStart={handleSheetTouchStart}
                onTouchEnd={handleSheetTouchEnd}
                onClick={cycleSheetPosition}
                className="md:hidden flex items-center justify-between px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50 dark:bg-zinc-900/90 rounded-t-2xl select-none"
              >
                <span className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  Settings {sheetPosition === 'collapsed' ? '(Tap to Open)' : ''}
                </span>
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full" />
                <button
                  type="button"
                  aria-label="Toggle drawer height"
                  className="p-1 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {sheetPosition === 'expanded' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Tool Tabs */}
              <div className="flex border-b border-gray-200 dark:border-zinc-800 overflow-x-auto no-scrollbar flex-shrink-0">
                {editorTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (sheetPosition === 'collapsed') setSheetPosition('half');
                      }}
                      className={`flex-1 min-w-[65px] py-2.5 px-1 flex flex-col items-center justify-center space-y-1 text-[11px] font-medium transition ${
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

              {/* Active Tab Content Panel */}
              <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                {activeTab === 'size' && <SizePanel />}
                {activeTab === 'adjust' && <AdjustmentsPanel />}
                {activeTab === 'transform' && <TransformPanel />}
                {activeTab === 'background' && <BackgroundPanel />}
                {activeTab === 'border' && <BorderPanel />}
              </div>

              {/* Bottom Actions */}
              <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80 flex items-center space-x-2 flex-shrink-0">
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
                  Layout Sheet →
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
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            <div className="flex-1 w-full h-full relative overflow-hidden bg-gray-200 dark:bg-zinc-950 pb-[64px] md:pb-0 transition-colors duration-200">
              <LayoutWorkspace />
            </div>

            {/* Slide up/down Drawer on mobile, Sidebar on desktop */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-30 md:static md:w-80 lg:w-96 md:h-full bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-gray-200 dark:border-zinc-800 flex flex-col shadow-2xl transition-all duration-300 ease-out rounded-t-2xl md:rounded-none ${getSheetHeightClass(layoutSheetPosition)}`}
            >
              {/* Mobile Drag Bar Handle & Up/Down Toggle */}
              <div
                onTouchStart={handleLayoutSheetTouchStart}
                onTouchEnd={handleLayoutSheetTouchEnd}
                onClick={cycleLayoutSheetPosition}
                className="md:hidden flex items-center justify-between px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50 dark:bg-zinc-900/90 rounded-t-2xl select-none flex-shrink-0"
              >
                <span className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  Sheet Settings {layoutSheetPosition === 'collapsed' ? '(Tap to Open)' : ''}
                </span>
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full" />
                <button
                  type="button"
                  aria-label="Toggle drawer height"
                  className="p-1 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {layoutSheetPosition === 'expanded' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Layout Sidebar Settings Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <LayoutSidebar />
              </div>
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