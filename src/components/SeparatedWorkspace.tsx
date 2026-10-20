import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  ExternalLink, 
  Download, 
  Trash2, 
  Upload, 
  ZoomIn, 
  Plus, 
  Layers, 
  Eye, 
  Sparkles,
  FileCheck,
  Star,
  Check,
  PenTool
} from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { HandwritingCanvas } from './HandwritingCanvas';
import { api } from '../api/client';
import { WorkspaceTab, OverlayDrawings } from '../types';

export interface SeparatedWorkspaceLabels {
  mdTab?: string;
  pdfTab?: string;
  imagesTab?: string;
  drawingTab?: string;
  allTab?: string;
  mdTitle?: string;
  mdSubtitle?: string;
  pdfTitle?: string;
  pdfSubtitle?: string;
  pdfEmptyHint?: string;
  imagesTitle?: string;
  imagesSubtitle?: string;
  imagesEmptyHint?: string;
  drawingTitle?: string;
  drawingSubtitle?: string;
}

export interface SeparatedWorkspaceProps {
  // Area 1: MD Notes & Formulas
  mdContent: string;
  onMdContentChange?: (val: string) => void;
  mdPlaceholder?: string;

  // Area 2: PDF Document
  pdfUrl?: string;
  pdfName?: string;
  onPdfChange?: (url: string, name: string) => void;
  onPdfRemove?: () => void;

  // Area 3: Photos (Multiple handwritten drafts / screenshots)
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  onViewImage: (url: string) => void;

  // Mode-isolated overlay annotations (each mode has its own handwriting layer!)
  overlayDrawings?: OverlayDrawings;
  onOverlayDrawingsChange?: (drawings: OverlayDrawings) => void;

  // Area 4: Hand-drawn & Stylus Annotation Layer (Separated from MD/PDF/Photos)
  drawingData?: string;
  drawingPages?: string[];
  onDrawingChange?: (val: string) => void;
  onDrawingPagesChange?: (pages: string[]) => void;

  // Modes & Layout
  isEditing?: boolean;
  defaultTab?: WorkspaceTab; // Default is 'md'
  currentDefaultTab?: WorkspaceTab;
  onSetDefaultTab?: (tab: WorkspaceTab) => void;
  className?: string;
  labels?: SeparatedWorkspaceLabels;
}

export const SeparatedWorkspace: React.FC<SeparatedWorkspaceProps> = ({
  mdContent,
  onMdContentChange,
  mdPlaceholder,
  pdfUrl,
  pdfName,
  onPdfChange,
  onPdfRemove,
  images = [],
  onImagesChange,
  onViewImage,
  overlayDrawings,
  onOverlayDrawingsChange,
  drawingData = '',
  drawingPages,
  onDrawingChange,
  onDrawingPagesChange,
  isEditing = false,
  defaultTab = 'md',
  currentDefaultTab,
  onSetDefaultTab,
  className = '',
  labels = {}
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(defaultTab || 'md');
  const [isOverlayAnnotationActive, setIsOverlayAnnotationActive] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Per-mode overlay drawings state (isolated for MD, PDF, Images)
  const [internalOverlays, setInternalOverlays] = useState<OverlayDrawings>(() => {
    return overlayDrawings || {};
  });

  useEffect(() => {
    if (overlayDrawings) {
      setInternalOverlays(overlayDrawings);
    }
  }, [overlayDrawings]);

  // Current tab's isolated overlay drawing
  const currentTabOverlay = activeTab === 'md'
    ? (internalOverlays.md !== undefined ? internalOverlays.md : (drawingData || ''))
    : activeTab === 'pdf'
      ? (internalOverlays.pdf || '')
      : activeTab === 'images'
        ? (internalOverlays.images || '')
        : '';

  const hasCurrentTabOverlay = Boolean(currentTabOverlay && currentTabOverlay.trim().length > 0);

  const handleSaveOverlay = (dataUrl: string) => {
    if (activeTab === 'drawing' || activeTab === 'all') return;
    const updated = {
      ...internalOverlays,
      [activeTab]: dataUrl
    };
    setInternalOverlays(updated);
    onOverlayDrawingsChange?.(updated);
    // Also update drawingData for md tab for backwards compatibility
    if (activeTab === 'md' && onDrawingChange) {
      onDrawingChange(dataUrl);
    }
  };

  // Keep activeTab in sync if parent changes defaultTab
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Support Ctrl+V clipboard image paste when editing
  useEffect(() => {
    if (!isEditing || !onImagesChange) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            setIsUploadingImages(true);
            try {
              const res = await api.uploadFile(blob);
              onImagesChange([...images, res.url]);
            } catch (err: any) {
              console.error('剪贴板图片上传失败:', err);
              alert('剪贴板图片上传失败: ' + (err.message || '未知错误'));
            } finally {
              setIsUploadingImages(false);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isEditing, images, onImagesChange]);

  // Handle PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    try {
      const res = await api.uploadFile(file);
      onPdfChange?.(res.url, res.originalName || file.name);
    } catch (err: any) {
      alert('PDF 上传失败: ' + (err.message || '未知错误'));
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Handle Multi Images Upload
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onImagesChange) return;

    setIsUploadingImages(true);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await api.uploadFile(file);
        newUrls.push(res.url);
      }
      onImagesChange([...images, ...newUrls]);
    } catch (err: any) {
      alert('图片上传失败: ' + (err.message || '未知错误'));
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (!onImagesChange) return;
    const nextImages = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(nextImages);
  };

  const hasPdf = Boolean(pdfUrl);
  const photoCount = images.length;
  const hasMd = Boolean(mdContent && mdContent.trim().length > 0);
  const hasDraftDrawing = Boolean(
    (drawingData && drawingData.trim().length > 0) ||
    (Array.isArray(drawingPages) && drawingPages.some(p => p && p.trim().length > 0))
  );
  const pageCount = Array.isArray(drawingPages) && drawingPages.length > 0 ? drawingPages.length : (hasDraftDrawing ? 1 : 0);
  const effectiveDefault = currentDefaultTab || defaultTab || 'md';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Segmented Navigation Bar - Single Line Horizontally Scrollable / Swipeable */}
      <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto scrollbar-none select-none flex-nowrap min-w-0 touch-pan-x">
        {/* Left: Mode Tabs in a Single Horizontal Row */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none py-0.5 flex-nowrap">
          {/* Tab 1: MD Document (Default) */}
          <button
            type="button"
            onClick={() => setActiveTab('md')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'md'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-500" />
            <span>{labels.mdTab || '📝 MD 文档'}</span>
            {hasMd && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
            {Boolean(internalOverlays.md) && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="MD已有独立批注" />
            )}
          </button>

          {/* Tab 2: PDF Document */}
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>{labels.pdfTab || '📑 PDF 展示'}</span>
            {hasPdf && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                1
              </span>
            )}
            {Boolean(internalOverlays.pdf) && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="PDF已有独立批注" />
            )}
          </button>

          {/* Tab 3: Photos Gallery */}
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>{labels.imagesTab || '📷 照片展示'}</span>
            {photoCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                {photoCount}
              </span>
            )}
            {Boolean(internalOverlays.images) && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="照片已有独立批注" />
            )}
          </button>

          {/* Tab 4: Hand-drawn Scratchpad (Dedicated) */}
          <button
            type="button"
            onClick={() => setActiveTab('drawing')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'drawing'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-purple-500" />
            <span>{labels.drawingTab || '🎨 手绘草稿'}</span>
            {pageCount > 1 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold">
                {pageCount}页
              </span>
            ) : hasDraftDrawing ? (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            ) : null}
          </button>

          {/* Tab 5: All Areas Tiled */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>{labels.allTab || '🔲 平铺'}</span>
          </button>
        </div>

        {/* Right side: Tablet Floating Pen & Default Setting */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {/* Tablet Stylus Floating Overlay Toggle (on MD / PDF / Images) */}
          {activeTab !== 'drawing' && activeTab !== 'all' && (
            <button
              type="button"
              onClick={() => setIsOverlayAnnotationActive(!isOverlayAnnotationActive)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border whitespace-nowrap ${
                isOverlayAnnotationActive
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : hasCurrentTabOverlay
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
              }`}
              title="针对当前展示区域开启独立透明手写批注"
            >
              <PenTool className="w-3 h-3" />
              <span>{isOverlayAnnotationActive ? '批注中' : '✏️ 批注'}</span>
              {hasCurrentTabOverlay && !isOverlayAnnotationActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              )}
            </button>
          )}

          {/* Set Default Display for this unit */}
          {onSetDefaultTab && (
            <div className="shrink-0">
              {activeTab === effectiveDefault ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60 shadow-2xs whitespace-nowrap">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  <span className="hidden sm:inline">默认</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetDefaultTab(activeTab)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-amber-300 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  title="将当前选中的显示模式设为该单元的默认展示模式"
                >
                  <Star className="w-3 h-3 text-slate-400 hover:text-amber-500" />
                  <span className="hidden sm:inline">设为默认</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area Container with Optional Floating Transparent Annotation Layer */}
      <div className="relative rounded-2xl">
        {/* Floating Handwriting Overlay Layer on top of MD / PDF / Photos (Keyed per tab so each mode has isolated ink!) */}
        {activeTab !== 'drawing' && activeTab !== 'all' && (isOverlayAnnotationActive || hasCurrentTabOverlay) && (
          <HandwritingCanvas
            key={`overlay-${activeTab}`}
            initialDrawing={currentTabOverlay}
            onSave={handleSaveOverlay}
            isOverlay={true}
            isActive={isOverlayAnnotationActive}
            onToggleActive={() => setIsOverlayAnnotationActive(false)}
            title={`批注层 (${activeTab === 'md' ? 'Markdown' : activeTab === 'pdf' ? 'PDF' : '照片'})`}
          />
        )}

        {/* ================= AREA 1: MD 演练与记录区 ================= */}
        {(activeTab === 'all' || activeTab === 'md') && (
          <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs ${activeTab === 'all' ? 'mb-4' : ''}`}>
            {/* Body */}
            <div className="p-3">
              <MarkdownEditor
                value={mdContent}
                onChange={onMdContentChange}
                placeholder={mdPlaceholder || "在此写下内容、推导步骤、LaTeX 数学公式（如 $f(x)=x^2$）、代码块及复盘心得..."}
                readOnly={!isEditing}
                minHeight={isEditing ? '140px' : '80px'}
              />
            </div>
          </div>
        )}

        {/* ================= AREA 2: PDF 展示区 ================= */}
        {(activeTab === 'all' || activeTab === 'pdf') && (
          <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs ${activeTab === 'all' ? 'mb-4' : ''}`}>
            {/* Body */}
            <div className="p-4">
              {hasPdf ? (
                <div className="space-y-3">
                  {/* PDF File Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 rounded-xl">
                    <div className="flex items-center gap-2.5 truncate max-w-full">
                      <FileCheck className="w-5 h-5 text-rose-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {pdfName || '未命名 PDF 文档'}
                        </p>
                        <p className="text-[11px] text-slate-400">已成功关联 PDF 文档</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
                        title="在新标签页全屏查看 PDF"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        新窗口打开
                      </a>
                      <a
                        href={pdfUrl}
                        download={pdfName || '错题讲义.pdf'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="下载 PDF 文件到本地"
                      >
                        <Download className="w-3.5 h-3.5" />
                        下载
                      </a>

                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            {isUploadingPdf ? '上传中...' : '更换 PDF'}
                            <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                          </label>
                          <button
                            type="button"
                            onClick={onPdfRemove}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
                            title="移除此 PDF"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Embedded PDF Viewer */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-inner">
                    <iframe
                      src={pdfUrl}
                      title={pdfName || 'PDF 预览'}
                      className="w-full h-[450px] border-none"
                    />
                  </div>
                </div>
              ) : (
                // Empty State
                <div>
                  {isEditing ? (
                    <div className="p-6 border-2 border-dashed border-rose-200 dark:border-rose-900/60 rounded-xl bg-rose-50/20 dark:bg-rose-950/10 text-center hover:bg-rose-50/40 transition-colors">
                      <FileText className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        暂未关联 PDF 文件
                      </p>
                      <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
                        {labels.pdfEmptyHint || '可上传试卷原题 PDF、配套解析讲义、专题考点汇总等，支持内置嵌入式预览与全屏阅读'}
                      </p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingPdf ? '正在上传 PDF...' : '点击上传 PDF 讲义/试卷'}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                      </label>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      暂未关联 PDF 文档
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= AREA 3: 照片展示区 ================= */}
        {(activeTab === 'all' || activeTab === 'images') && (
          <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs ${activeTab === 'all' ? 'mb-4' : ''}`}>
            {/* Body */}
            <div className="p-4">
              {photoCount > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={`${imgUrl}-${idx}`}
                      className="relative group aspect-4/3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={imgUrl}
                        alt={`照片 ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => onViewImage(imgUrl)}
                      />

                      {/* Overlay Zoom Button */}
                      <div
                        onClick={() => onViewImage(imgUrl)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white transition-opacity cursor-pointer text-xs font-medium gap-1"
                      >
                        <ZoomIn className="w-4 h-4" /> 查看大图
                      </div>

                      {/* Delete Photo Button in Edit Mode */}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg opacity-90 hover:opacity-100 transition-all shadow-sm cursor-pointer z-10"
                          title="删除此张照片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Index Tag */}
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono pointer-events-none">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* Additional Add Tile in Edit Mode */}
                  {isEditing && (
                    <label className="cursor-pointer aspect-4/3 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 flex flex-col items-center justify-center gap-1.5 text-amber-700 dark:text-amber-300 transition-colors">
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-semibold">添加更多照片</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />
                    </label>
                  )}
                </div>
              ) : (
                // Empty State
                <div>
                  {isEditing ? (
                    <div className="p-6 border-2 border-dashed border-amber-200 dark:border-amber-900/60 rounded-xl bg-amber-50/20 dark:bg-amber-950/10 text-center hover:bg-amber-50/40 transition-colors">
                      <ImageIcon className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        暂无图片或照片
                      </p>
                      <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
                        {labels.imagesEmptyHint || '支持多张手写演算纸、做题步骤截图、错因定位照片等同时上传，支持 Ctrl+V 剪贴板快速粘贴'}
                      </p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingImages ? '正在上传照片...' : '点击上传照片 (支持多选 / Ctrl+V粘贴)'}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />
                      </label>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      暂未附加图片或做题照片
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= AREA 4: 手绘草稿与触控手写板 (Dedicated Canvas) ================= */}
        {(activeTab === 'all' || activeTab === 'drawing') && (
          <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs ${activeTab === 'all' ? 'mb-4' : ''}`}>
            {/* Body */}
            <div className="p-3">
              <HandwritingCanvas
                initialDrawing={drawingData}
                initialPages={drawingPages}
                onSave={onDrawingChange}
                onSavePages={onDrawingPagesChange}
                isOverlay={false}
                defaultHeight={820}
                bgType="grid"
                showBgSelector={true}
                title={labels.drawingTitle || '手绘草稿区'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
