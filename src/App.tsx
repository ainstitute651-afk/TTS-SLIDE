import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Presentation,
  Slide,
  SlideElement,
  TextElement,
  ShapeElement,
  ImageElement,
  TableElement,
  IconElement,
  Theme,
  ShapeType,
  MasterSlide,
  PronunciationEntry,
  VoiceSettings,
} from './types/presentation';
import { SAMPLE_PRESENTATION } from './constants/samplePresentation';
import { SLIDE_LAYOUTS } from './constants/layouts';
import { loadPresentation, savePresentation } from './services/storage';

// Components
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { SlideDeckPanel } from './components/SlideDeckPanel';
import { CanvasArea } from './components/CanvasArea';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ScriptPanel } from './components/ScriptPanel';
import { PresentationMode } from './components/PresentationMode';
import { VideoExportModal } from './components/VideoExportModal';
import { PreviewModal } from './components/PreviewModal';
import { PronunciationModal } from './components/PronunciationModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { TableModal } from './components/TableModal';
import { IconPickerModal } from './components/IconPickerModal';

export default function App() {
  // 1. Core Presentation State
  const [presentation, setPresentation] = useState<Presentation>(() => {
    return loadPresentation(SAMPLE_PRESENTATION);
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(52);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSaved, setIsSaved] = useState(true);

  // 2. Undo / Redo History Stack
  const historyRef = useRef<Presentation[]>([presentation]);
  const historyIndexRef = useRef(0);
  const isUndoRedoActionRef = useRef(false);

  // 3. Modals State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPresentationMode, setShowPresentationMode] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showIconPickerModal, setShowIconPickerModal] = useState(false);

  // Safe slide reference
  const currentSlide = presentation.slides[currentSlideIndex] || presentation.slides[0];
  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId) || null;

  // Push to history
  const pushState = useCallback((newPres: Presentation) => {
    if (isUndoRedoActionRef.current) {
      isUndoRedoActionRef.current = false;
      return;
    }
    const currentHist = historyRef.current.slice(0, historyIndexRef.current + 1);
    currentHist.push(JSON.parse(JSON.stringify(newPres)));
    if (currentHist.length > 30) currentHist.shift();
    historyRef.current = currentHist;
    historyIndexRef.current = currentHist.length - 1;
  }, []);

  // Update presentation helper
  const updatePresentation = useCallback((updater: (prev: Presentation) => Presentation) => {
    setPresentation((prev) => {
      const next = updater(prev);
      pushState(next);
      setIsSaved(false);
      return next;
    });
  }, [pushState]);

  // Auto-save to LocalStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      savePresentation(presentation);
      setIsSaved(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [presentation]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const targetState = historyRef.current[historyIndexRef.current];
      isUndoRedoActionRef.current = true;
      setPresentation(JSON.parse(JSON.stringify(targetState)));
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const targetState = historyRef.current[historyIndexRef.current];
      isUndoRedoActionRef.current = true;
      setPresentation(JSON.parse(JSON.stringify(targetState)));
    }
  }, []);

  // Slide CRUD Operations
  const handleSelectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setSelectedElementId(null);
  };

  const handleAddSlide = (layoutId: string) => {
    const layout = SLIDE_LAYOUTS.find((l) => l.id === layoutId) || SLIDE_LAYOUTS[0];
    const defaultElements = layout.createElements(
      '#6366f1',
      '#a855f7',
      '#ffffff',
      '#94a3b8'
    );
    const newSlide: Slide = {
      id: 'slide_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: layout.name,
      layout: layoutId,
      background: { ...currentSlide.background },
      duration: 5,
      transition: { ...currentSlide.transition },
      script: '',
      elements: JSON.parse(JSON.stringify(defaultElements)),
    };

    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides.splice(currentSlideIndex + 1, 0, newSlide);
      return { ...prev, slides: newSlides };
    });

    setCurrentSlideIndex((idx) => idx + 1);
    setSelectedElementId(null);
  };

  const handleDuplicateSlide = (index: number) => {
    const target = presentation.slides[index];
    if (!target) return;
    const duplicated: Slide = JSON.parse(JSON.stringify(target));
    duplicated.id = 'slide_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    duplicated.title = `${target.title} (Copy)`;

    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides.splice(index + 1, 0, duplicated);
      return { ...prev, slides: newSlides };
    });

    setCurrentSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (presentation.slides.length <= 1) return;
    updatePresentation((prev) => {
      const newSlides = prev.slides.filter((_, i) => i !== index);
      return { ...prev, slides: newSlides };
    });
    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex((idx) => idx - 1);
    }
    setSelectedElementId(null);
  };

  const handleMoveSlide = (fromIndex: number, toIndex: number) => {
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const [moved] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, moved);
      return { ...prev, slides: newSlides };
    });
    setCurrentSlideIndex(toIndex);
  };

  // Element Insertion Handlers
  const handleAddText = (type: 'heading' | 'subheading' | 'body' | 'callout') => {
    let newEl: TextElement;
    const id = 'el_text_' + Date.now();

    if (type === 'heading') {
      newEl = {
        id,
        type: 'text',
        x: 160,
        y: 200,
        width: 1600,
        height: 120,
        rotation: 0,
        text: 'Enter Bold Heading',
        fontSize: 64,
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 1.2,
      };
    } else if (type === 'subheading') {
      newEl = {
        id,
        type: 'text',
        x: 200,
        y: 350,
        width: 1520,
        height: 80,
        rotation: 0,
        text: 'Enter descriptive subheading or key takeaway',
        fontSize: 34,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 1.4,
      };
    } else if (type === 'callout') {
      newEl = {
        id,
        type: 'text',
        x: 160,
        y: 120,
        width: 240,
        height: 48,
        rotation: 0,
        text: 'KEY HIGHLIGHT',
        fontSize: 16,
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 'bold',
        color: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        textAlign: 'center',
        lineHeight: 1.4,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
      };
    } else {
      newEl = {
        id,
        type: 'text',
        x: 160,
        y: 300,
        width: 1200,
        height: 200,
        rotation: 0,
        text: 'Add your detailed body content, bullet points, or discussion details here.',
        fontSize: 26,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        color: '#cbd5e1',
        textAlign: 'left',
        lineHeight: 1.5,
      };
    }

    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex].elements.push(newEl);
      return { ...prev, slides };
    });
    setSelectedElementId(id);
  };

  const handleAddShape = (shapeType: ShapeType) => {
    const id = 'el_shape_' + Date.now();
    const newEl: ShapeElement = {
      id,
      type: 'shape',
      shapeType,
      x: 300,
      y: 300,
      width: shapeType === 'line' ? 800 : shapeType === 'circle' ? 240 : 360,
      height: shapeType === 'line' ? 6 : shapeType === 'circle' ? 240 : 220,
      rotation: 0,
      fillColor: shapeType === 'line' ? '#818cf8' : 'rgba(99, 102, 241, 0.2)',
      borderColor: '#6366f1',
      borderWidth: 2,
      borderRadius: shapeType === 'rounded-rect' ? 20 : 0,
    };

    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex].elements.push(newEl);
      return { ...prev, slides };
    });
    setSelectedElementId(id);
  };

  const handleAddImage = (url: string) => {
    const id = 'el_img_' + Date.now();
    const newEl: ImageElement = {
      id,
      type: 'image',
      src: url,
      x: 360,
      y: 180,
      width: 1200,
      height: 700,
      rotation: 0,
      borderRadius: 16,
      objectFit: 'cover',
      shadowBlur: 30,
      shadowColor: 'rgba(0,0,0,0.6)',
    };

    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex].elements.push(newEl);
      return { ...prev, slides };
    });
    setSelectedElementId(id);
  };

  const handleInsertTable = (rows: number, cols: number) => {
    const id = 'el_table_' + Date.now();
    const data: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        row.push(r === 0 ? `Header ${c + 1}` : `Data ${r},${c + 1}`);
      }
      data.push(row);
    }

    const newEl: TableElement = {
      id,
      type: 'table',
      x: 200,
      y: 220,
      width: 1520,
      height: 550,
      rows,
      cols,
      data,
      headerBgColor: '#1e293b',
      headerTextColor: '#38bdf8',
      cellBgColor: '#0f172a',
      cellTextColor: '#cbd5e1',
      borderColor: '#334155',
      borderWidth: 1,
      fontSize: 22,
    };

    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex].elements.push(newEl);
      return { ...prev, slides };
    });
    setSelectedElementId(id);
  };

  const handleInsertIcon = (iconName: string, color: string) => {
    const id = 'el_icon_' + Date.now();
    const newEl: IconElement = {
      id,
      type: 'icon',
      iconName,
      color,
      x: 880,
      y: 400,
      width: 160,
      height: 160,
      rotation: 0,
    };

    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex].elements.push(newEl);
      return { ...prev, slides };
    });
    setSelectedElementId(id);
  };

  // Element Update / Delete / Duplicate
  const handleUpdateElement = (elementId: string, updates: Partial<SlideElement>) => {
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      const targetSlide = slides[currentSlideIndex];
      targetSlide.elements = targetSlide.elements.map((el) =>
        el.id === elementId ? ({ ...el, ...updates } as SlideElement) : el
      );
      return { ...prev, slides };
    });
  };

  const handleDuplicateElement = () => {
    if (!selectedElement) return;
    const duplicated: SlideElement = JSON.parse(JSON.stringify(selectedElement));
    duplicated.id = 'el_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    duplicated.x += 40;
    duplicated.y += 40;

    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex].elements.push(duplicated);
      return { ...prev, slides };
    });
    setSelectedElementId(duplicated.id);
  };

  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex].elements = slides[currentSlideIndex].elements.filter(
        (el) => el.id !== selectedElementId
      );
      return { ...prev, slides };
    });
    setSelectedElementId(null);
  };

  // Layering (Z-Index)
  const handleBringForward = () => {
    if (!selectedElementId) return;
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      const elements = [...slides[currentSlideIndex].elements];
      const idx = elements.findIndex((el) => el.id === selectedElementId);
      if (idx < elements.length - 1) {
        const temp = elements[idx];
        elements[idx] = elements[idx + 1];
        elements[idx + 1] = temp;
      }
      slides[currentSlideIndex].elements = elements;
      return { ...prev, slides };
    });
  };

  const handleSendBackward = () => {
    if (!selectedElementId) return;
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      const elements = [...slides[currentSlideIndex].elements];
      const idx = elements.findIndex((el) => el.id === selectedElementId);
      if (idx > 0) {
        const temp = elements[idx];
        elements[idx] = elements[idx - 1];
        elements[idx - 1] = temp;
      }
      slides[currentSlideIndex].elements = elements;
      return { ...prev, slides };
    });
  };

  const handleBringToFront = () => {
    if (!selectedElementId) return;
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      const elements = slides[currentSlideIndex].elements.filter((el) => el.id !== selectedElementId);
      const target = slides[currentSlideIndex].elements.find((el) => el.id === selectedElementId);
      if (target) elements.push(target);
      slides[currentSlideIndex].elements = elements;
      return { ...prev, slides };
    });
  };

  const handleSendToBack = () => {
    if (!selectedElementId) return;
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      const elements = slides[currentSlideIndex].elements.filter((el) => el.id !== selectedElementId);
      const target = slides[currentSlideIndex].elements.find((el) => el.id === selectedElementId);
      if (target) elements.unshift(target);
      slides[currentSlideIndex].elements = elements;
      return { ...prev, slides };
    });
  };

  // Background, Theme & Master Slide
  const handleUpdateSlideBackground = (bg: Slide['background'], applyToAll?: boolean) => {
    updatePresentation((prev) => {
      const slides = prev.slides.map((s, idx) =>
        applyToAll || idx === currentSlideIndex ? { ...s, background: { ...bg } } : s
      );
      return { ...prev, slides };
    });
  };

  const handleUpdateSlideTransition = (tr: Slide['transition'], applyToAll?: boolean) => {
    updatePresentation((prev) => {
      const slides = prev.slides.map((s, idx) =>
        applyToAll || idx === currentSlideIndex ? { ...s, transition: { ...tr } } : s
      );
      return { ...prev, slides };
    });
  };

  const handleApplyTheme = (theme: Theme) => {
    updatePresentation((prev) => {
      const slides = prev.slides.map((s) => ({
        ...s,
        background: { ...theme.background },
      }));
      return {
        ...prev,
        themeId: theme.id,
        slides,
      };
    });
  };

  const handleUpdateMasterSlide = (master: Partial<MasterSlide>) => {
    updatePresentation((prev) => ({
      ...prev,
      masterSlide: { ...prev.masterSlide, ...master },
    }));
  };

  // Script & Voice
  const handleUpdateSlideScript = (script: string) => {
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex] = { ...slides[currentSlideIndex], script };
      return { ...prev, slides };
    });
  };

  const handleUpdateSlideVoiceSettings = (settings: VoiceSettings) => {
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex] = { ...slides[currentSlideIndex], voiceSettings: settings };
      return { ...prev, slides };
    });
  };

  const handleUpdateSlideDuration = (duration: number) => {
    updatePresentation((prev) => {
      const slides = [...prev.slides];
      slides[currentSlideIndex] = { ...slides[currentSlideIndex], duration };
      return { ...prev, slides };
    });
  };

  const handleUpdateSlideKenBurns = (kenBurns: Slide['kenBurns'], applyToAll = false) => {
    updatePresentation((prev) => {
      const slides = prev.slides.map((s, idx) => {
        if (applyToAll || idx === currentSlideIndex) {
          return { ...s, kenBurns };
        }
        return s;
      });
      return { ...prev, slides };
    });
  };

  const handleUpdatePresentationSettings = (settings: Partial<Presentation>) => {
    updatePresentation((prev) => ({
      ...prev,
      ...settings,
    }));
  };

  // JSON / HTML / Print Export
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(presentation, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentation.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.slides && Array.isArray(parsed.slides)) {
            setPresentation(parsed);
            setCurrentSlideIndex(0);
            setSelectedElementId(null);
          }
        } catch (err) {
          alert('Failed to load presentation JSON file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportHTML = () => {
    const serializedData = JSON.stringify(presentation);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${presentation.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    #viewport { width: 100vw; height: 56.25vw; max-height: 100vh; max-width: 177.78vh; position: relative; background: #0f172a; aspect-ratio: 16/9; }
    #canvas { width: 100%; height: 100%; object-fit: contain; }
    #controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.1); display: flex; gap: 12px; align-items: center; font-size: 14px; }
    button { background: #3b82f6; border: none; color: #fff; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; }
    button:disabled { opacity: 0.3; cursor: not-allowed; }
  </style>
</head>
<body>
  <div id="viewport">
    <canvas id="canvas" width="1920" height="1080"></canvas>
  </div>
  <div id="controls">
    <button id="prevBtn">Prev</button>
    <span id="counter">1 / 1</span>
    <button id="nextBtn">Next</button>
    <button id="fullscreenBtn">Fullscreen</button>
  </div>
  <script>
    const presentation = ${serializedData};
    let currentIdx = 0;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const counter = document.getElementById('counter');

    function render() {
      const slide = presentation.slides[currentIdx];
      counter.textContent = (currentIdx + 1) + ' / ' + presentation.slides.length;
      prevBtn.disabled = currentIdx === 0;
      nextBtn.disabled = currentIdx === presentation.slides.length - 1;

      // Draw background
      ctx.fillStyle = slide.background.color || '#0f172a';
      ctx.fillRect(0, 0, 1920, 1080);

      // Draw elements
      for (const el of slide.elements) {
        if (el.type === 'text') {
          ctx.fillStyle = el.color || '#fff';
          ctx.font = (el.fontWeight || 'normal') + ' ' + (el.fontSize || 32) + 'px sans-serif';
          ctx.textAlign = el.textAlign || 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(el.text, el.x, el.y);
        } else if (el.type === 'shape') {
          ctx.fillStyle = el.fillColor || '#6366f1';
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
      }
    }

    prevBtn.onclick = () => { if (currentIdx > 0) { currentIdx--; render(); } };
    nextBtn.onclick = () => { if (currentIdx < presentation.slides.length - 1) { currentIdx++; render(); } };
    document.getElementById('fullscreenBtn').onclick = () => { document.documentElement.requestFullscreen(); };
    window.onkeydown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { if (currentIdx < presentation.slides.length - 1) { currentIdx++; render(); } }
      if (e.key === 'ArrowLeft') { if (currentIdx > 0) { currentIdx--; render(); } }
    };
    render();
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentation.title.replace(/\s+/g, '_')}_presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if (e.key === 'F5') {
        e.preventDefault();
        setShowPresentationMode(true);
        return;
      }

      if (isInput) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          handleAddSlide('layout_content');
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          if (selectedElementId) handleDuplicateElement();
          else handleDuplicateSlide(currentSlideIndex);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          handleDeleteElement();
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
      } else if (selectedElementId && (e.key.startsWith('Arrow'))) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') handleUpdateElement(selectedElementId, { y: (selectedElement?.y || 0) - delta });
        if (e.key === 'ArrowDown') handleUpdateElement(selectedElementId, { y: (selectedElement?.y || 0) + delta });
        if (e.key === 'ArrowLeft') handleUpdateElement(selectedElementId, { x: (selectedElement?.x || 0) - delta });
        if (e.key === 'ArrowRight') handleUpdateElement(selectedElementId, { x: (selectedElement?.x || 0) + delta });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, selectedElement, currentSlideIndex, handleUndo, handleRedo]);

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden select-none font-sans ${isDarkMode ? 'dark bg-[#0F0F0F] text-gray-300' : 'bg-gray-100 text-gray-900'}`}>
      {/* 1. Top Navbar */}
      <Navbar
        presentation={presentation}
        onUpdateTitle={(title) => updatePresentation((p) => ({ ...p, title }))}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToScreen={() => setZoom(52)}
        onStartPresenting={() => setShowPresentationMode(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenPreviewModal={() => setShowPreviewModal(true)}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportHTML={handleExportHTML}
        onPrint={handlePrint}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isSaved={isSaved}
      />

      {/* 2. Secondary Toolbar */}
      <Toolbar
        selectedElement={selectedElement}
        onUpdateElement={(updates) => {
          if (selectedElementId) handleUpdateElement(selectedElementId, updates);
        }}
        onAddText={handleAddText}
        onAddShape={handleAddShape}
        onAddImage={handleAddImage}
        onOpenTableModal={() => setShowTableModal(true)}
        onOpenIconPicker={() => setShowIconPickerModal(true)}
        onDuplicateElement={handleDuplicateElement}
        onDeleteElement={handleDeleteElement}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Slide Deck Thumbnails */}
        <SlideDeckPanel
          slides={presentation.slides}
          currentSlideIndex={currentSlideIndex}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
          masterSlide={presentation.masterSlide}
        />

        {/* Center Canvas Stage */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <CanvasArea
            slide={currentSlide}
            slideIndex={currentSlideIndex}
            totalSlides={presentation.slides.length}
            masterSlide={presentation.masterSlide}
            zoom={zoom}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onDeselect={() => setSelectedElementId(null)}
          />

          {/* Bottom Audio Script Panel */}
          <ScriptPanel
            slide={currentSlide}
            presentation={presentation}
            onUpdateSlideScript={handleUpdateSlideScript}
            onUpdateSlideVoiceSettings={handleUpdateSlideVoiceSettings}
            onUpdateSlideDuration={handleUpdateSlideDuration}
            onOpenPronunciationModal={() => setShowPronunciationModal(true)}
          />
        </div>

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          currentSlide={currentSlide}
          presentation={presentation}
          onUpdateElement={(updates) => {
            if (selectedElementId) handleUpdateElement(selectedElementId, updates);
          }}
          onUpdateSlideBackground={handleUpdateSlideBackground}
          onUpdateSlideTransition={handleUpdateSlideTransition}
          onApplyTheme={handleApplyTheme}
          onUpdateMasterSlide={handleUpdateMasterSlide}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onUpdateSlideKenBurns={handleUpdateSlideKenBurns}
          onUpdatePresentationSettings={handleUpdatePresentationSettings}
        />
      </div>

      {/* Modals */}
      {showPresentationMode && (
        <PresentationMode
          presentation={presentation}
          initialSlideIndex={currentSlideIndex}
          onExit={() => setShowPresentationMode(false)}
        />
      )}

      {showExportModal && (
        <VideoExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          presentation={presentation}
          onUpdatePresentationSettings={handleUpdatePresentationSettings}
        />
      )}

      {showPreviewModal && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          presentation={presentation}
          onOpenExportModal={() => {
            setShowPreviewModal(false);
            setShowExportModal(true);
          }}
        />
      )}

      {showPronunciationModal && (
        <PronunciationModal
          isOpen={showPronunciationModal}
          onClose={() => setShowPronunciationModal(false)}
          entries={presentation.pronunciationDictionary || []}
          onSaveEntries={(entries) => updatePresentation((p) => ({ ...p, pronunciationDictionary: entries }))}
        />
      )}

      {showShortcutsModal && (
        <ShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {showTableModal && (
        <TableModal
          isOpen={showTableModal}
          onClose={() => setShowTableModal(false)}
          onInsertTable={handleInsertTable}
        />
      )}

      {showIconPickerModal && (
        <IconPickerModal
          isOpen={showIconPickerModal}
          onClose={() => setShowIconPickerModal(false)}
          onSelectIcon={handleInsertIcon}
        />
      )}
    </div>
  );
}
