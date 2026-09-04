import React, { useState, useRef, useEffect } from 'react';
import { Slide, SlideElement, MasterSlide, TextElement, ShapeElement, ImageElement, TableElement, IconElement } from '../types/presentation';
import { Sparkles, Star, Check, TrendingUp, Zap, Target } from 'lucide-react';

interface CanvasAreaProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  masterSlide: MasterSlide;
  zoom: number; // percentage (e.g. 50% = 0.5)
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void;
  onDeselect: () => void;
}

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  slide,
  slideIndex,
  totalSlides,
  masterSlide,
  zoom,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeselect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);

  // Resizing state
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    elX: number;
    elY: number;
    elW: number;
    elH: number;
  } | null>(null);

  // Rotating state
  const [isRotating, setIsRotating] = useState(false);
  const [rotateCenter, setRotateCenter] = useState<{ cx: number; cy: number } | null>(null);

  // Smart Guides
  const [showCenterVGuide, setShowCenterVGuide] = useState(false);
  const [showCenterHGuide, setShowCenterHGuide] = useState(false);

  const scale = zoom / 100;
  const selectedElement = slide.elements.find(el => el.id === selectedElementId) || null;

  // Handle Drag Move & Resize & Rotate
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedElement) return;

      // DRAGGING
      if (isDragging && dragStart) {
        const dx = (e.clientX - dragStart.mouseX) / scale;
        const dy = (e.clientY - dragStart.mouseY) / scale;

        let newX = Math.round(dragStart.elX + dx);
        let newY = Math.round(dragStart.elY + dy);

        // Smart snapping to center
        const elCenterX = newX + selectedElement.width / 2;
        const elCenterY = newY + selectedElement.height / 2;

        if (Math.abs(elCenterX - CANVAS_WIDTH / 2) < 15) {
          newX = CANVAS_WIDTH / 2 - selectedElement.width / 2;
          setShowCenterVGuide(true);
        } else {
          setShowCenterVGuide(false);
        }

        if (Math.abs(elCenterY - CANVAS_HEIGHT / 2) < 15) {
          newY = CANVAS_HEIGHT / 2 - selectedElement.height / 2;
          setShowCenterHGuide(true);
        } else {
          setShowCenterHGuide(false);
        }

        onUpdateElement(selectedElement.id, { x: newX, y: newY });
      }

      // RESIZING
      if (resizeHandle && resizeStart) {
        const dx = (e.clientX - resizeStart.mouseX) / scale;
        const dy = (e.clientY - resizeStart.mouseY) / scale;

        let newX = resizeStart.elX;
        let newY = resizeStart.elY;
        let newW = resizeStart.elW;
        let newH = resizeStart.elH;

        if (resizeHandle.includes('e')) {
          newW = Math.max(30, Math.round(resizeStart.elW + dx));
        }
        if (resizeHandle.includes('s')) {
          newH = Math.max(30, Math.round(resizeStart.elH + dy));
        }
        if (resizeHandle.includes('w')) {
          const proposedW = resizeStart.elW - dx;
          if (proposedW > 30) {
            newW = Math.round(proposedW);
            newX = Math.round(resizeStart.elX + dx);
          }
        }
        if (resizeHandle.includes('n')) {
          const proposedH = resizeStart.elH - dy;
          if (proposedH > 30) {
            newH = Math.round(proposedH);
            newY = Math.round(resizeStart.elY + dy);
          }
        }

        // Shift key preserves aspect ratio
        if (e.shiftKey && resizeStart.elW > 0 && resizeStart.elH > 0) {
          const ratio = resizeStart.elW / resizeStart.elH;
          newH = Math.round(newW / ratio);
        }

        onUpdateElement(selectedElement.id, { x: newX, y: newY, width: newW, height: newH });
      }

      // ROTATING
      if (isRotating && rotateCenter) {
        const rad = Math.atan2(e.clientY - rotateCenter.cy, e.clientX - rotateCenter.cx);
        let deg = Math.round((rad * 180) / Math.PI) + 90;
        if (deg < 0) deg += 360;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15; // Snap 15 deg with shift
        onUpdateElement(selectedElement.id, { rotation: deg });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      setResizeHandle(null);
      setResizeStart(null);
      setIsRotating(false);
      setRotateCenter(null);
      setShowCenterVGuide(false);
      setShowCenterHGuide(false);
    };

    if (isDragging || resizeHandle || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, resizeHandle, resizeStart, isRotating, rotateCenter, selectedElement, scale, onUpdateElement]);

  // Compute CSS background style
  const bg = slide.background;
  const bgStyle: React.CSSProperties = {
    width: `${CANVAS_WIDTH}px`,
    height: `${CANVAS_HEIGHT}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
  };

  if (bg.type === 'solid') {
    bgStyle.backgroundColor = bg.color || '#0f172a';
  } else if (bg.type === 'linear-gradient') {
    bgStyle.backgroundImage = `linear-gradient(${bg.gradientAngle ?? 135}deg, ${bg.gradientStart || '#0f172a'}, ${bg.gradientEnd || '#1e1b4b'})`;
  } else if (bg.type === 'radial-gradient') {
    bgStyle.backgroundImage = `radial-gradient(circle, ${bg.gradientStart || '#1e1b4b'}, ${bg.gradientEnd || '#0f172a'})`;
  } else if (bg.type === 'image' && bg.imageUrl) {
    bgStyle.backgroundImage = `url(${bg.imageUrl})`;
    bgStyle.backgroundSize = 'cover';
    bgStyle.backgroundPosition = 'center';
  } else if (bg.type === 'pattern') {
    bgStyle.backgroundColor = bg.color || '#0f172a';
    if (bg.pattern === 'dots') {
      bgStyle.backgroundImage = `radial-gradient(${bg.patternColor || 'rgba(255,255,255,0.15)'} 1.5px, transparent 1.5px)`;
      bgStyle.backgroundSize = '32px 32px';
    } else if (bg.pattern === 'grid') {
      bgStyle.backgroundImage = `linear-gradient(${bg.patternColor || 'rgba(255,255,255,0.08)'} 1px, transparent 1px), linear-gradient(90deg, ${bg.patternColor || 'rgba(255,255,255,0.08)'} 1px, transparent 1px)`;
      bgStyle.backgroundSize = '48px 48px';
    }
  }

  const handleStartDrag = (e: React.MouseEvent, element: SlideElement) => {
    if (editingTextId === element.id) return;
    e.stopPropagation();
    onSelectElement(element.id);
    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: element.x,
      elY: element.y,
    });
  };

  const handleStartResize = (e: React.MouseEvent, handle: string) => {
    if (!selectedElement) return;
    e.stopPropagation();
    setResizeHandle(handle);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: selectedElement.x,
      elY: selectedElement.y,
      elW: selectedElement.width,
      elH: selectedElement.height,
    });
  };

  const handleStartRotate = (e: React.MouseEvent) => {
    if (!selectedElement) return;
    e.stopPropagation();
    const elRect = (e.currentTarget.parentElement as HTMLElement)?.getBoundingClientRect();
    if (!elRect) return;
    setIsRotating(true);
    setRotateCenter({
      cx: elRect.left + elRect.width / 2,
      cy: elRect.top + elRect.height / 2,
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={() => {
        onDeselect();
        setEditingTextId(null);
      }}
      className="flex-1 overflow-auto bg-[#0F0F0F] p-8 flex items-start justify-center select-none relative"
    >
      {/* 1920x1080 Virtual Stage Box */}
      <div
        id="presentation-stage"
        style={bgStyle}
        className="relative shadow-2xl shadow-black/80 rounded-sm overflow-hidden shrink-0 border border-[#2A2A2A]"
      >
        {/* Smart Center Guides */}
        {showCenterVGuide && (
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-50 pointer-events-none -translate-x-1/2" />
        )}
        {showCenterHGuide && (
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-blue-500 z-50 pointer-events-none -translate-y-1/2" />
        )}

        {/* Master Slide Header / Footer / Number */}
        {masterSlide.showHeader && masterSlide.headerText && (
          <div className="absolute top-8 left-14 text-gray-400 text-xl font-medium tracking-wide pointer-events-none">
            {masterSlide.headerText}
          </div>
        )}
        {masterSlide.brandingText && (
          <div className="absolute top-8 right-14 text-blue-400 font-semibold text-xl tracking-wider uppercase pointer-events-none">
            {masterSlide.brandingText}
          </div>
        )}
        {masterSlide.showFooter && masterSlide.footerText && (
          <div className="absolute bottom-8 left-14 text-gray-400 text-lg pointer-events-none">
            {masterSlide.footerText}
          </div>
        )}
        {masterSlide.showSlideNumber && (
          <div className={`absolute bottom-8 text-gray-400 text-lg font-mono pointer-events-none ${
            masterSlide.slideNumberPosition === 'bottom-left' ? 'left-14' : 'right-14'
          }`}>
            {slideIndex + 1} / {totalSlides}
          </div>
        )}

        {/* Slide Elements */}
        {slide.elements.map((el) => {
          const isSelected = el.id === selectedElementId;
          const isEditing = el.id === editingTextId;

          const elStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${el.x}px`,
            top: `${el.y}px`,
            width: `${el.width}px`,
            height: `${el.height}px`,
            transform: `rotate(${el.rotation || 0}deg)`,
            opacity: el.opacity ?? 1,
            zIndex: el.zIndex ?? 1,
            cursor: isSelected ? 'move' : 'pointer',
          };

          return (
            <div
              key={el.id}
              style={elStyle}
              onMouseDown={(e) => handleStartDrag(e, el)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (el.type === 'text') setEditingTextId(el.id);
              }}
              className={`group/el transition-shadow ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : 'hover:ring-1 hover:ring-blue-400/60'
              }`}
            >
              {/* Element Content Render */}
              {el.type === 'text' && (
                <TextElementView
                  element={el as TextElement}
                  isEditing={isEditing}
                  onUpdate={(text) => onUpdateElement(el.id, { text } as any)}
                  onBlur={() => setEditingTextId(null)}
                />
              )}
              {el.type === 'shape' && <ShapeElementView element={el as ShapeElement} />}
              {el.type === 'image' && <ImageElementView element={el as ImageElement} />}
              {el.type === 'table' && (
                <TableElementView
                  element={el as TableElement}
                  onUpdateCell={(r, c, val) => {
                    const tableEl = el as TableElement;
                    const nextData = tableEl.data.map(row => [...row]);
                    if (nextData[r]) nextData[r][c] = val;
                    onUpdateElement(el.id, { data: nextData });
                  }}
                />
              )}
              {el.type === 'icon' && <IconElementView element={el as IconElement} />}

              {/* Selection Handles (Resize + Rotation) */}
              {isSelected && (
                <>
                  {/* Rotation Handle */}
                  <div
                    onMouseDown={handleStartRotate}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow cursor-grab hover:scale-125 transition-transform flex items-center justify-center"
                    title="Drag to Rotate"
                  >
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                  <div className="absolute -top-3 left-1/2 w-0.5 h-3 bg-blue-500 pointer-events-none -translate-x-1/2" />

                  {/* 8 Resize Handles */}
                  <div onMouseDown={(e) => handleStartResize(e, 'nw')} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize shadow" />
                  <div onMouseDown={(e) => handleStartResize(e, 'n')} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-ns-resize shadow" />
                  <div onMouseDown={(e) => handleStartResize(e, 'ne')} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize shadow" />
                  <div onMouseDown={(e) => handleStartResize(e, 'e')} className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-ew-resize shadow" />
                  <div onMouseDown={(e) => handleStartResize(e, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize shadow" />
                  <div onMouseDown={(e) => handleStartResize(e, 's')} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-ns-resize shadow" />
                  <div onMouseDown={(e) => handleStartResize(e, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize shadow" />
                  <div onMouseDown={(e) => handleStartResize(e, 'w')} className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm cursor-ew-resize shadow" />

                  {/* Size & Coord Indicator */}
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#161616] text-gray-200 border border-[#2A2A2A] text-[10px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap">
                    {Math.round(el.width)} × {Math.round(el.height)} px ({Math.round(el.rotation || 0)}°)
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Sub-components for rendering elements inside DOM preview
const TextElementView: React.FC<{
  element: TextElement;
  isEditing: boolean;
  onUpdate: (text: string) => void;
  onBlur: () => void;
}> = ({ element, isEditing, onUpdate, onBlur }) => {
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily || 'Inter, sans-serif',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    color: element.color || '#ffffff',
    backgroundColor: element.backgroundColor || 'transparent',
    textAlign: element.textAlign || 'left',
    lineHeight: element.lineHeight || 1.4,
    padding: `${element.padding ?? 8}px`,
    borderWidth: element.borderWidth ? `${element.borderWidth}px` : undefined,
    borderColor: element.borderColor,
    borderStyle: element.borderStyle || 'none',
    borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
    boxShadow: element.shadowBlur ? `${element.shadowOffsetX || 0}px ${element.shadowOffsetY || 4}px ${element.shadowBlur}px ${element.shadowColor || 'rgba(0,0,0,0.5)'}` : undefined,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  if (isEditing) {
    return (
      <textarea
        autoFocus
        value={element.text}
        onChange={(e) => onUpdate(e.target.value)}
        onBlur={onBlur}
        style={style}
        className="outline-none resize-none bg-slate-800/80 border border-indigo-500 rounded"
      />
    );
  }

  return (
    <div style={style} className="overflow-hidden">
      {element.text}
    </div>
  );
};

const ShapeElementView: React.FC<{ element: ShapeElement }> = ({ element }) => {
  const { shapeType, fillColor, strokeColor, strokeWidth, borderRadius } = element;
  const stroke = strokeWidth ? `${strokeWidth}px solid ${strokeColor || fillColor}` : undefined;

  if (shapeType === 'rounded-rect') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: `${borderRadius || 16}px`,
          border: stroke,
        }}
      />
    );
  }

  if (shapeType === 'circle') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: '50%',
          border: stroke,
        }}
      />
    );
  }

  if (shapeType === 'line') {
    return (
      <div className="w-full h-full flex items-center">
        <div style={{ width: '100%', height: `${strokeWidth || 4}px`, backgroundColor: fillColor }} />
      </div>
    );
  }

  // Default Rectangle
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: fillColor,
        borderRadius: `${borderRadius || 0}px`,
        border: stroke,
      }}
    />
  );
};

const ImageElementView: React.FC<{ element: ImageElement }> = ({ element }) => {
  return (
    <img
      src={element.src}
      alt={element.alt || 'Presentation image'}
      style={{
        width: '100%',
        height: '100%',
        objectFit: element.objectFit || 'cover',
        borderRadius: `${element.borderRadius || 0}px`,
        filter: element.blur ? `blur(${element.blur}px)` : undefined,
        boxShadow: element.shadowBlur ? `0 ${element.shadowOffsetY || 8}px ${element.shadowBlur}px ${element.shadowColor || 'rgba(0,0,0,0.5)'}` : undefined,
      }}
      className="pointer-events-none"
    />
  );
};

const TableElementView: React.FC<{
  element: TableElement;
  onUpdateCell: (r: number, c: number, val: string) => void;
}> = ({ element, onUpdateCell }) => {
  const rows = element.rows || 3;
  const cols = element.cols || 3;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        border: `${element.borderWidth || 1}px solid ${element.borderColor || '#475569'}`,
        fontSize: `${element.fontSize || 20}px`,
      }}
      className="overflow-hidden rounded-md"
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const isHeader = r === 0;
          const text = element.data?.[r]?.[c] ?? '';
          return (
            <input
              key={`${r}-${c}`}
              type="text"
              value={text}
              onChange={(e) => onUpdateCell(r, c, e.target.value)}
              style={{
                backgroundColor: isHeader ? element.headerBgColor : element.cellBgColor,
                color: isHeader ? element.headerTextColor : element.cellTextColor,
                borderRight: `${element.borderWidth || 1}px solid ${element.borderColor || '#475569'}`,
                borderBottom: `${element.borderWidth || 1}px solid ${element.borderColor || '#475569'}`,
              }}
              className="text-center font-medium px-2 py-1 outline-none focus:bg-indigo-900/50"
            />
          );
        })
      )}
    </div>
  );
};

const IconElementView: React.FC<{ element: IconElement }> = ({ element }) => {
  const name = (element.iconName || 'sparkles').toLowerCase();
  const color = element.color || '#38bdf8';

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      {name.includes('star') && <Star className="w-full h-full fill-current" style={{ color }} />}
      {name.includes('check') && <Check className="w-full h-full" style={{ color }} />}
      {name.includes('chart') && <TrendingUp className="w-full h-full" style={{ color }} />}
      {name.includes('zap') && <Zap className="w-full h-full fill-current" style={{ color }} />}
      {name.includes('target') && <Target className="w-full h-full" style={{ color }} />}
      {!name.includes('star') && !name.includes('check') && !name.includes('chart') && !name.includes('zap') && !name.includes('target') && (
        <Sparkles className="w-full h-full" style={{ color }} />
      )}
    </div>
  );
};
