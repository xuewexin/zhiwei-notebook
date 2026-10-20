import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Eraser, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  Highlighter, 
  Hand,
  Maximize2,
  Minimize2,
  Grid,
  FileText,
  Square,
  Sparkles,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Copy,
  ArrowUpDown,
  ArrowDownUp,
  X
} from 'lucide-react';

export type CanvasBgType = 'transparent' | 'grid' | 'lines' | 'white' | 'dark';
export type DrawingTool = 'pen' | 'highlighter' | 'eraser';

export interface HandwritingCanvasProps {
  initialDrawing?: string; // Legacy / single page
  initialPages?: string[]; // Multi-page list of data URLs
  onSave?: (dataUrl: string) => void;
  onSavePages?: (pages: string[]) => void;
  isOverlay?: boolean;
  isActive?: boolean;
  onToggleActive?: () => void;
  defaultHeight?: number;
  bgType?: CanvasBgType;
  onBgTypeChange?: (bg: CanvasBgType) => void;
  showBgSelector?: boolean;
  className?: string;
  title?: string;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  tool: DrawingTool;
  color: string;
  size: number;
  points: Point[];
}

const PEN_COLORS = [
  { name: '经典黑', value: '#1e293b' },
  { name: '科技蓝', value: '#2563eb' },
  { name: '批改红', value: '#dc2626' },
  { name: '森林绿', value: '#16a34a' },
  { name: '典雅紫', value: '#9333ea' },
  { name: '纯净白', value: '#f8fafc' }
];

const HIGHLIGHTER_COLORS = [
  { name: '荧光黄', value: 'rgba(250, 204, 21, 0.45)' },
  { name: '薄荷绿', value: 'rgba(74, 222, 128, 0.45)' },
  { name: '天青蓝', value: 'rgba(96, 165, 250, 0.45)' },
  { name: '蜜桃粉', value: 'rgba(244, 114, 182, 0.45)' }
];

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  initialDrawing = '',
  initialPages,
  onSave,
  onSavePages,
  isOverlay = false,
  isActive = true,
  onToggleActive,
  defaultHeight = 820,
  bgType = 'grid',
  onBgTypeChange,
  showBgSelector = true,
  className = '',
  title = '手绘草稿与触控笔迹'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Multi-page state
  const [pages, setPages] = useState<string[]>(() => {
    if (Array.isArray(initialPages) && initialPages.length > 0) {
      return initialPages;
    }
    if (initialDrawing && initialDrawing.trim().length > 0) {
      return [initialDrawing];
    }
    return [''];
  });
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Canvas dimensions state (supports dynamic expansion +200px)
  const [canvasHeight, setCanvasHeight] = useState<number>(defaultHeight);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Drawing tools state
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pen');
  const [penColor, setPenColor] = useState<string>('#2563eb');
  const [highlighterColor, setHighlighterColor] = useState<string>('rgba(250, 204, 21, 0.45)');
  const [strokeSize, setStrokeSize] = useState<number>(3.5);
  const [eraserSize, setEraserSize] = useState<number>(28);
  const [penOnly, setPenOnly] = useState<boolean>(false); // Palm rejection (stylus only)
  const [isInkVisible, setIsInkVisible] = useState<boolean>(true);
  const [currentBg, setCurrentBg] = useState<CanvasBgType>(bgType);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [contentBottomY, setContentBottomY] = useState<number>(0);

  // Stroke history for Undo / Redo
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  // Sync with initialPages if changed externally
  useEffect(() => {
    if (Array.isArray(initialPages) && initialPages.length > 0) {
      setPages(initialPages);
    } else if (initialDrawing && initialDrawing.trim().length > 0) {
      setPages([initialDrawing]);
    }
  }, [initialPages, initialDrawing]);

  // Keep internal bg synced with prop
  useEffect(() => {
    if (bgType) setCurrentBg(bgType);
  }, [bgType]);

  const handleBgSelect = (bg: CanvasBgType) => {
    setCurrentBg(bg);
    onBgTypeChange?.(bg);
  };

  // Inspect lowest Y coordinate containing vector strokes or raster ink pixels
  const updateContentBottomY = useCallback((): number => {
    let maxY = 0;
    // 1. Check all vector strokes
    strokes.forEach(s => {
      s.points.forEach(p => {
        if (p.y > maxY) maxY = p.y;
      });
    });

    // 2. Also inspect raster canvas pixels (e.g. from previously loaded image)
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width;
        const h = canvas.height;
        try {
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;
          const stepY = Math.max(1, Math.round(dpr * 3));
          const stepX = Math.max(1, Math.round(dpr * 6));
          outer: for (let py = h - 1; py >= 0; py -= stepY) {
            for (let px = 0; px < w; px += stepX) {
              const alpha = data[(py * w + px) * 4 + 3];
              if (alpha > 15) {
                const logicalY = py / dpr;
                if (logicalY > maxY) maxY = logicalY;
                break outer;
              }
            }
          }
        } catch {
          // Ignore canvas read errors if any
        }
      }
    }
    const finalMax = Math.ceil(maxY);
    setContentBottomY(finalMax);
    return finalMax;
  }, [strokes]);

  useEffect(() => {
    updateContentBottomY();
  }, [strokes, updateContentBottomY]);

  // Load image of current page into baseImageRef
  const loadPageImage = useCallback((imgSrc: string) => {
    if (!imgSrc || imgSrc.trim().length === 0) {
      baseImageRef.current = null;
      redrawAll();
      setContentBottomY(0);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImageRef.current = img;
      redrawAll();
      setTimeout(updateContentBottomY, 60);
    };
    img.src = imgSrc;
  }, [updateContentBottomY]);

  // When currentPageIndex changes or on mount, load that page
  useEffect(() => {
    const currentPageSrc = pages[currentPageIndex] || '';
    setStrokes([]);
    setRedoStack([]);
    loadPageImage(currentPageSrc);
  }, [currentPageIndex]);

  // Redraw all strokes and base image
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isInkVisible) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Draw base image if exists (draw 1:1 in draft mode to avoid vertical stretch when extending/shrinking paper)
    if (baseImageRef.current) {
      const img = baseImageRef.current;
      const logicalWidth = canvas.width / dpr;
      if (isOverlay) {
        ctx.drawImage(img, 0, 0, logicalWidth, canvas.height / dpr);
      } else {
        const imgLogicalHeight = img.naturalHeight > 0 ? (img.naturalHeight / dpr) : (canvas.height / dpr);
        ctx.drawImage(img, 0, 0, logicalWidth, imgLogicalHeight);
      }
    }

    // Draw all strokes
    strokes.forEach(stroke => {
      renderStroke(ctx, stroke);
    });

    // Draw active stroke
    if (activeStrokeRef.current) {
      renderStroke(ctx, activeStrokeRef.current);
    }

    ctx.restore();
  }, [strokes, isInkVisible, isOverlay]);

  // Adjust canvas resolution to match DPR and container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(300, rect.width);
    
    // In overlay mode, match container height; in draft mode, use canvasHeight
    let h: number;
    if (isFullscreen) {
      h = Math.max(600, window.innerHeight - 150);
    } else if (isOverlay) {
      h = Math.max(300, rect.height);
    } else {
      h = canvasHeight;
    }

    if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
      canvas.width = width * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${h}px`;
      redrawAll();
    }
  }, [canvasHeight, isOverlay, isFullscreen, redrawAll]);

  useEffect(() => {
    resizeCanvas();
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [resizeCanvas]);

  useEffect(() => {
    redrawAll();
  }, [strokes, isInkVisible, redrawAll]);

  const renderStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (!stroke.points || stroke.points.length === 0) return;

    ctx.save();
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = stroke.size;
    } else if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'square';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.beginPath();
    const pts = stroke.points;
    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Coordinate conversion taking into account canvas bounding client rect and DPR
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x,
      y,
      pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    // Palm rejection: if enabled, only allow stylus/pen pointer
    if (penOnly && e.pointerType !== 'pen') return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const pt = getCanvasCoords(e);
    isDrawingRef.current = true;

    const strokeConfig: Stroke = {
      tool: currentTool,
      color: currentTool === 'highlighter' ? highlighterColor : penColor,
      size: currentTool === 'eraser' ? eraserSize : currentTool === 'highlighter' ? 22 : strokeSize,
      points: [pt]
    };
    activeStrokeRef.current = strokeConfig;
    redrawAll();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    if (penOnly && e.pointerType !== 'pen') return;

    e.preventDefault();
    const pt = getCanvasCoords(e);
    activeStrokeRef.current.points.push(pt);

    // Fast incremental rendering for responsiveness
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    renderStroke(ctx, activeStrokeRef.current);
    ctx.restore();
  };

  const finishStroke = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeStrokeRef.current && activeStrokeRef.current.points.length > 0) {
      const finishedStroke = { ...activeStrokeRef.current };
      activeStrokeRef.current = null;
      setStrokes(prev => [...prev, finishedStroke]);
      setRedoStack([]); // Clear redo stack on new action
      setHasUnsavedChanges(true);
    }

    if (e && canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Pointer might already be released
      }
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [...prev, last]);
    setHasUnsavedChanges(true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setStrokes(prev => [...prev, next]);
    setHasUnsavedChanges(true);
  };

  const handleClear = () => {
    if (strokes.length === 0 && !baseImageRef.current) return;
    if (window.confirm(`确定要清空第 ${currentPageIndex + 1} 页的手写笔迹吗？（不可撤销）`)) {
      baseImageRef.current = null;
      setStrokes([]);
      setRedoStack([]);
      setHasUnsavedChanges(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      // Update pages array
      const updated = [...pages];
      updated[currentPageIndex] = '';
      setPages(updated);
      onSavePages?.(updated);
      onSave?.(updated[0] || '');
    }
  };

  // Save current page to state and notify parents
  const saveCurrentPageToData = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return pages[currentPageIndex] || '';
    const dataUrl = canvas.toDataURL('image/png');
    const updated = [...pages];
    updated[currentPageIndex] = dataUrl;
    setPages(updated);
    setHasUnsavedChanges(false);
    onSavePages?.(updated);
    onSave?.(updated[0] || '');
    return dataUrl;
  };

  // Page switching via Corner Badges / Pills
  const handleSwitchPage = (targetIdx: number) => {
    if (targetIdx === currentPageIndex || targetIdx < 0 || targetIdx >= pages.length) return;
    // 1. Commit current page canvas to data
    const canvas = canvasRef.current;
    const currentUrl = canvas ? canvas.toDataURL('image/png') : (pages[currentPageIndex] || '');
    const updated = [...pages];
    updated[currentPageIndex] = currentUrl;
    setPages(updated);
    onSavePages?.(updated);
    onSave?.(updated[0] || '');
    setHasUnsavedChanges(false);

    // 2. Switch to target page
    setCurrentPageIndex(targetIdx);
  };

  // Add a new blank page
  const handleAddPage = () => {
    // 1. Commit current page
    const canvas = canvasRef.current;
    const currentUrl = canvas ? canvas.toDataURL('image/png') : (pages[currentPageIndex] || '');
    const updated = [...pages];
    updated[currentPageIndex] = currentUrl;
    updated.push(''); // New blank page
    setPages(updated);
    onSavePages?.(updated);
    onSave?.(updated[0] || '');
    setHasUnsavedChanges(false);

    // 2. Switch to the newly created page
    setCurrentPageIndex(updated.length - 1);
  };

  // Delete current page
  const handleDeletePage = (indexToDelete: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (pages.length <= 1) {
      alert('至少保留一页草稿纸');
      return;
    }
    if (!window.confirm(`确定要删除第 ${indexToDelete + 1} 页吗？该页笔迹将被永久移除。`)) {
      return;
    }
    const updated = pages.filter((_, idx) => idx !== indexToDelete);
    setPages(updated);
    onSavePages?.(updated);
    onSave?.(updated[0] || '');

    const nextIndex = indexToDelete >= updated.length ? updated.length - 1 : indexToDelete;
    setCurrentPageIndex(nextIndex);
  };

  // Extend Canvas Height (+250px)
  const handleExtendHeight = (increment: number = 250) => {
    setCanvasHeight(prev => Math.min(2600, prev + increment));
  };

  // Shrink Canvas Height (-200px), with content bottom bound protection
  const handleShrinkHeight = (decrement: number = 200) => {
    const bottomY = updateContentBottomY();
    // Safety buffer of 80px so the lowest stroke is not clipped
    const minLimit = bottomY > 0 ? Math.max(380, bottomY + 80) : 380;
    setCanvasHeight(prev => {
      const target = prev - decrement;
      if (target <= minLimit) {
        return Math.max(minLimit, Math.min(prev, minLimit));
      }
      return target;
    });
  };

  // One-click Smart Shrink / Fit paper height to content bottom + 80px
  const handleAutoFitHeight = () => {
    const bottomY = updateContentBottomY();
    if (bottomY <= 0) {
      setCanvasHeight(420);
      return;
    }
    const target = Math.max(420, bottomY + 80);
    setCanvasHeight(target);
  };

  // ================= RENDER OVERLAY MODE (Transparent Floating Layer Directly Over Content) =================
  if (isOverlay) {
    return (
      <div 
        ref={containerRef}
        className={`absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl select-none ${className}`}
      >
        {/* Floating Toolbar when overlay active */}
        {isActive && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 max-w-[95%] pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200 dark:border-blue-900/70 p-1.5 flex flex-wrap items-center justify-between gap-1.5 animate-fade-in">
            {/* Left: Tools Selection */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentTool('pen')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                  currentTool === 'pen' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="钢笔 / 圆珠笔"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>钢笔</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTool('highlighter')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                  currentTool === 'highlighter' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="荧光高亮笔 (适合圈划重点)"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>荧光笔</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTool('eraser')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                  currentTool === 'eraser' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="橡皮擦"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>橡皮</span>
              </button>

              <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

              {/* Colors Palette */}
              {currentTool === 'pen' ? (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {PEN_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setPenColor(c.value)}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                        penColor === c.value ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-black/10 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              ) : currentTool === 'highlighter' ? (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {HIGHLIGHTER_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setHighlighterColor(c.value)}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                        highlighterColor === c.value ? 'scale-125 ring-2 ring-amber-500 ring-offset-1 border-white' : 'border-black/10 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEraserSize(18)}
                    className={`px-2 py-0.5 text-[11px] rounded-lg cursor-pointer ${eraserSize === 18 ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}
                  >
                    细
                  </button>
                  <button
                    type="button"
                    onClick={() => setEraserSize(36)}
                    className={`px-2 py-0.5 text-[11px] rounded-lg cursor-pointer ${eraserSize === 36 ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}
                  >
                    粗
                  </button>
                </div>
              )}

              {/* Stroke Width selection for Pen */}
              {currentTool === 'pen' && (
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px]">
                  {[
                    { label: '细', size: 2 },
                    { label: '中', size: 3.5 },
                    { label: '粗', size: 6 }
                  ].map(s => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setStrokeSize(s.size)}
                      className={`px-1.5 py-0.5 rounded-lg cursor-pointer ${strokeSize === s.size ? 'bg-white dark:bg-slate-700 text-blue-600 font-bold shadow-2xs' : 'text-slate-500'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Palm Rejection Toggle */}
              <button
                type="button"
                onClick={() => setPenOnly(!penOnly)}
                className={`p-1.5 rounded-xl text-xs font-medium cursor-pointer border ${
                  penOnly ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={penOnly ? '当前仅响应手写笔（防误触开）' : '开启防手掌误触'}
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

              {/* Undo / Redo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 rounded-xl cursor-pointer"
                title="撤销"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 rounded-xl cursor-pointer"
                title="重做"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Ink Visibility */}
              <button
                type="button"
                onClick={() => setIsInkVisible(!isInkVisible)}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                title={isInkVisible ? '隐藏笔迹' : '显示笔迹'}
              >
                {isInkVisible ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                title="清空笔迹"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={saveCurrentPageToData}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{hasUnsavedChanges ? '保存' : '已保存'}</span>
              </button>

              {/* Finish overlay button */}
              {onToggleActive && (
                <button
                  type="button"
                  onClick={() => {
                    saveCurrentPageToData();
                    onToggleActive();
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer"
                >
                  完成批注
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transparent Canvas overlaying the content directly */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className={`absolute inset-0 w-full h-full block ${
            isActive 
              ? 'pointer-events-auto cursor-crosshair touch-none z-10' 
              : 'pointer-events-none z-10'
          }`}
          style={{
            touchAction: 'none'
          }}
        />
      </div>
    );
  }

  // Get paper background style
  const getBgStyle = (): React.CSSProperties => {
    if (currentBg === 'transparent') {
      return { backgroundColor: 'transparent' };
    }
    if (currentBg === 'white') {
      return { backgroundColor: '#ffffff' };
    }
    if (currentBg === 'dark') {
      return { backgroundColor: '#0f172a' };
    }
    if (currentBg === 'lines') {
      return {
        backgroundColor: '#ffffff',
        backgroundImage: 'linear-gradient(to bottom, transparent 27px, rgba(203, 213, 225, 0.7) 28px)',
        backgroundSize: '100% 28px'
      };
    }
    // 'grid' (Math Grid)
    return {
      backgroundColor: '#ffffff',
      backgroundImage: `
        linear-gradient(to right, rgba(203, 213, 225, 0.6) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(203, 213, 225, 0.6) 1px, transparent 1px)
      `,
      backgroundSize: '24px 24px'
    };
  };

  const currentDisplayHeight = isFullscreen 
    ? '100%' 
    : isOverlay 
      ? '100%' 
      : `${canvasHeight}px`;

  return (
    <div 
      className={isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 flex flex-col animate-fade-in' : ''}
    >
      <div 
        ref={containerRef}
        className={`relative select-none ${
          isFullscreen
            ? 'flex-1 w-full max-w-6xl mx-auto rounded-3xl overflow-hidden border border-slate-700 bg-white dark:bg-slate-900 shadow-2xl flex flex-col'
            : isOverlay 
              ? 'absolute inset-0 z-20 pointer-events-none' 
              : 'w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs'
        } ${className}`}
        style={{ minHeight: currentDisplayHeight }}
      >
        {/* Background Container for Standalone Draft Paper */}
        {!isOverlay && (
          <div 
            className="absolute inset-0 transition-colors pointer-events-none"
            style={getBgStyle()}
          />
        )}

        {/* ================= TOP CONTROLS & CORNER PAGE BADGES ================= */}
        <div 
          className={`z-30 flex flex-col gap-2 p-2 pointer-events-auto transition-all ${
            isOverlay 
              ? 'absolute top-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-200 dark:border-blue-900/70'
              : 'relative bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Row 1: Tools & Tablet Settings */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Left: Tools Selection */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Pen */}
              <button
                type="button"
                onClick={() => setCurrentTool('pen')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTool === 'pen'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="钢笔 / 圆珠笔"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>钢笔</span>
              </button>

              {/* Highlighter */}
              <button
                type="button"
                onClick={() => setCurrentTool('highlighter')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTool === 'highlighter'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="荧光高亮笔 (适合圈划重点)"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>荧光笔</span>
              </button>

              {/* Eraser */}
              <button
                type="button"
                onClick={() => setCurrentTool('eraser')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTool === 'eraser'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title="橡皮擦"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>橡皮</span>
              </button>

              <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />

              {/* Colors Palette */}
              {currentTool === 'pen' ? (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {PEN_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setPenColor(c.value)}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                        penColor === c.value ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-black/10 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              ) : currentTool === 'highlighter' ? (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {HIGHLIGHTER_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setHighlighterColor(c.value)}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                        highlighterColor === c.value ? 'scale-125 ring-2 ring-amber-500 ring-offset-1 border-white' : 'border-black/10 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEraserSize(18)}
                    className={`px-2 py-0.5 text-[11px] rounded-lg cursor-pointer ${
                      eraserSize === 18 ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-slate-900 dark:text-white' : 'text-slate-500'
                    }`}
                  >
                    细
                  </button>
                  <button
                    type="button"
                    onClick={() => setEraserSize(36)}
                    className={`px-2 py-0.5 text-[11px] rounded-lg cursor-pointer ${
                      eraserSize === 36 ? 'bg-white dark:bg-slate-700 shadow-2xs font-bold text-slate-900 dark:text-white' : 'text-slate-500'
                    }`}
                  >
                    粗
                  </button>
                </div>
              )}

              {/* Stroke Width selection for Pen */}
              {currentTool === 'pen' && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px]">
                  {[
                    { label: '细', size: 2 },
                    { label: '中', size: 3.5 },
                    { label: '粗', size: 6 }
                  ].map(s => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => setStrokeSize(s.size)}
                      className={`px-2 py-0.5 rounded-lg cursor-pointer transition-all ${
                        strokeSize === s.size
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Palm Rejection, Paper BG, Undo, Clear, Save */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Palm Rejection Toggle */}
              <button
                type="button"
                onClick={() => setPenOnly(!penOnly)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  penOnly
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={penOnly ? '当前仅响应手写笔（防手掌误触已开启）' : '点击开启防手掌误触（仅允许电容笔/触控笔书写）'}
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{penOnly ? '防手掌误触 (开)' : '防误触'}</span>
              </button>

              {/* Paper Background Switcher (when not in overlay mode) */}
              {!isOverlay && showBgSelector && (
                <div className="hidden lg:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleBgSelect('grid')}
                    className={`p-1.5 rounded-lg text-xs cursor-pointer ${currentBg === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs' : 'text-slate-500'}`}
                    title="方格草稿纸 (数学/坐标推导)"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBgSelect('lines')}
                    className={`p-1.5 rounded-lg text-xs cursor-pointer ${currentBg === 'lines' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs' : 'text-slate-500'}`}
                    title="横线稿纸 (行文书写)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBgSelect('white')}
                    className={`p-1.5 rounded-lg text-xs cursor-pointer ${currentBg === 'white' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs' : 'text-slate-500'}`}
                    title="纯白无痕稿纸"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Undo & Redo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-xl cursor-pointer"
                title="撤销 (Undo)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 rounded-xl cursor-pointer"
                title="重做 (Redo)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Visibility toggle */}
              <button
                type="button"
                onClick={() => setIsInkVisible(!isInkVisible)}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                title={isInkVisible ? '隐藏笔迹' : '显示笔迹'}
              >
                {isInkVisible ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                title="清空本页笔迹"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Paper Height Adjustment (Shrink & Extend) */}
              {!isOverlay && !isFullscreen && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleShrinkHeight(200)}
                    disabled={canvasHeight <= (contentBottomY > 0 ? contentBottomY + 80 : 380)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                    title={`缩短纸张 (-200px)，极限保留已有内容末尾 (当前底端: ${contentBottomY}px)`}
                  >
                    <ArrowDownUp className="w-3 h-3 text-amber-500" />
                    <span className="hidden sm:inline">缩短</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendHeight(250)}
                    disabled={canvasHeight >= 2600}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                    title="加长纸张 (+250px)"
                  >
                    <ArrowUpDown className="w-3 h-3 text-purple-500" />
                    <span className="hidden sm:inline">加长</span>
                  </button>
                </div>
              )}

              {/* Fullscreen Canvas Toggle */}
              {!isOverlay && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  title={isFullscreen ? '退出全屏书写' : '全屏沉浸草稿板 (平板最大书写面积)'}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-purple-600" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={saveCurrentPageToData}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                  hasUnsavedChanges
                    ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{hasUnsavedChanges ? '保存' : '已保存'}</span>
              </button>

              {/* Close Overlay Mode button */}
              {isOverlay && onToggleActive && (
                <button
                  type="button"
                  onClick={onToggleActive}
                  className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-xl cursor-pointer border border-purple-200 dark:border-purple-800"
                >
                  完成批注
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Corner Page Badges & Switcher ("通过角标可以切换页，支持添加新页") */}
          {!isOverlay && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
              {/* Left: Multi-page Badge Pills */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                  📑 草稿页签:
                </span>
                
                {pages.map((pUrl, idx) => {
                  const isCurrent = idx === currentPageIndex;
                  const hasInk = Boolean(pUrl && pUrl.trim().length > 0) || (isCurrent && strokes.length > 0);
                  return (
                    <div
                      key={idx}
                      className={`group flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none border ${
                        isCurrent
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300 dark:ring-purple-900'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-750 hover:border-purple-300'
                      }`}
                      onClick={() => handleSwitchPage(idx)}
                    >
                      <span>第 {idx + 1} 页</span>
                      {hasInk && (
                        <span 
                          className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-amber-300' : 'bg-purple-500'}`} 
                          title="此页已有手写笔迹"
                        />
                      )}

                      {/* Delete page icon on hover if >1 page */}
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePage(idx, e)}
                          className={`p-0.5 rounded-md hover:bg-black/20 transition-opacity ${
                            isCurrent ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title={`删除第 ${idx + 1} 页`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Page Badge Button */}
                <button
                  type="button"
                  onClick={handleAddPage}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-2xs hover:shadow"
                  title="新增一页草稿纸，随时扩展做题演算空间"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加新页</span>
                </button>
              </div>

              {/* Right: Quick Pagination Stepper */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => handleSwitchPage(currentPageIndex - 1)}
                  disabled={currentPageIndex <= 0}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="上一页"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 px-1">
                  {currentPageIndex + 1} / {pages.length}
                </span>

                <button
                  type="button"
                  onClick={() => handleSwitchPage(currentPageIndex + 1)}
                  disabled={currentPageIndex >= pages.length - 1}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="下一页"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Drawing Canvas Area */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className={`w-full block relative z-10 ${
            isActive 
              ? 'pointer-events-auto cursor-crosshair touch-none' 
              : 'pointer-events-none'
          }`}
          style={{
            touchAction: 'none'
          }}
        />

        {/* Bottom Expand & Shrink Paper Banner (visible in standalone mode) */}
        {!isOverlay && !isFullscreen && (
          <div className="relative z-20 py-2.5 px-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                📄 页高: {canvasHeight}px
              </span>
              {contentBottomY > 0 && (
                <span className="text-[11px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                  笔迹底端: {contentBottomY}px
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleShrinkHeight(200)}
                disabled={canvasHeight <= (contentBottomY > 0 ? contentBottomY + 80 : 380)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title={`缩短纸张 (-200px)，极限保留已有内容末尾 (当前底端: ${contentBottomY}px)`}
              >
                <span>➖ 缩短纸张</span>
              </button>

              <button
                type="button"
                onClick={handleAutoFitHeight}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg border border-amber-200 dark:border-amber-850 transition-colors cursor-pointer"
                title="一键收拢底部多余空白，刚好贴合笔迹内容"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>收拢空白</span>
              </button>

              <button
                type="button"
                onClick={() => handleExtendHeight(250)}
                disabled={canvasHeight >= 2600}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>➕ 加长纸张 (+250px)</span>
              </button>

              <button
                type="button"
                onClick={handleAddPage}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建下一页</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
