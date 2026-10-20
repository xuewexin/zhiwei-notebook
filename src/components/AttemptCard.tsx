import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Save, 
  Edit2,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Attempt, AttemptResult, OverlayDrawings } from '../types';
import { SeparatedWorkspace } from './SeparatedWorkspace';

interface AttemptCardProps {
  attempt: Attempt;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  defaultCollapsed?: boolean;
  onUpdate: (updated: Partial<Attempt>) => Promise<void>;
  onDelete: () => Promise<void>;
  onViewImage: (url: string) => void;
}

export const AttemptCard: React.FC<AttemptCardProps> = ({
  attempt,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  defaultCollapsed = true,
  onUpdate,
  onDelete,
  onViewImage
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    setInternalCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  };

  const getInitialMd = (att: Attempt) => {
    if (att.mdContent !== undefined) return att.mdContent;
    const parts: string[] = [];
    if (att.solutionType !== 'image' && att.solutionContent) {
      parts.push(att.solutionContent);
    }
    if (att.notesContent) {
      parts.push(`### 💡 复盘反思\n${att.notesContent}`);
    }
    return parts.join('\n\n');
  };

  const getInitialImages = (att: Attempt): string[] => {
    if (Array.isArray(att.images) && att.images.length > 0) return att.images;
    if (att.solutionType === 'image' && att.solutionContent) return [att.solutionContent];
    return [];
  };

  const [isEditing, setIsEditing] = useState(false);
  const [result, setResult] = useState<AttemptResult>(attempt.result);
  const [timeSpent, setTimeSpent] = useState<number>(attempt.timeSpentMinutes || 0);
  
  // 4 Separated Areas state
  const [mdContent, setMdContent] = useState<string>(getInitialMd(attempt));
  const [pdfUrl, setPdfUrl] = useState<string>(attempt.pdfUrl || '');
  const [pdfName, setPdfName] = useState<string>(attempt.pdfName || '');
  const [images, setImages] = useState<string[]>(getInitialImages(attempt));
  const [drawingData, setDrawingData] = useState<string>(attempt.drawingData || '');
  const [drawingPages, setDrawingPages] = useState<string[]>(
    Array.isArray(attempt.drawingPages) && attempt.drawingPages.length > 0
      ? attempt.drawingPages
      : (attempt.drawingData ? [attempt.drawingData] : [''])
  );
  const [overlayDrawings, setOverlayDrawings] = useState<OverlayDrawings>(attempt.overlayDrawings || {});

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setResult(attempt.result);
    setTimeSpent(attempt.timeSpentMinutes || 0);
    setMdContent(getInitialMd(attempt));
    setPdfUrl(attempt.pdfUrl || '');
    setPdfName(attempt.pdfName || '');
    setImages(getInitialImages(attempt));
    setDrawingData(attempt.drawingData || '');
    setDrawingPages(
      Array.isArray(attempt.drawingPages) && attempt.drawingPages.length > 0
        ? attempt.drawingPages
        : (attempt.drawingData ? [attempt.drawingData] : [''])
    );
    setOverlayDrawings(attempt.overlayDrawings || {});
  }, [attempt.id, attempt.result, attempt.timeSpentMinutes, attempt.mdContent, attempt.pdfUrl, attempt.pdfName, attempt.images, attempt.drawingData, attempt.drawingPages, attempt.overlayDrawings, attempt.solutionContent, attempt.notesContent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        result,
        timeSpentMinutes: Number(timeSpent),
        mdContent,
        pdfUrl,
        pdfName,
        images,
        drawingData,
        drawingPages,
        overlayDrawings,
        // Compatibility
        solutionContent: mdContent,
        solutionType: images.length > 0 ? 'image' : 'text'
      });
      setIsEditing(false);
    } catch (e: any) {
      alert('保存练习记录失败: ' + (e.message || '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setResult(attempt.result);
    setTimeSpent(attempt.timeSpentMinutes || 0);
    setMdContent(getInitialMd(attempt));
    setPdfUrl(attempt.pdfUrl || '');
    setPdfName(attempt.pdfName || '');
    setImages(getInitialImages(attempt));
    setDrawingData(attempt.drawingData || '');
    setDrawingPages(
      Array.isArray(attempt.drawingPages) && attempt.drawingPages.length > 0
        ? attempt.drawingPages
        : (attempt.drawingData ? [attempt.drawingData] : [''])
    );
    setOverlayDrawings(attempt.overlayDrawings || {});
    setIsEditing(false);
  };

  const resultBadgeConfig = {
    correct: {
      label: '解答正确',
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    partial: {
      label: '部分正确 / 步骤分',
      icon: AlertCircle,
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    wrong: {
      label: '解答错误 / 需重练',
      icon: XCircle,
      bgColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    }
  };

  const currentResultMeta = resultBadgeConfig[attempt.result] || resultBadgeConfig.wrong;
  const ResultIcon = currentResultMeta.icon;

  const formattedDate = new Date(attempt.date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-sm overflow-hidden mb-3 transition-all">
      {/* Clickable Header bar (Accordion toggle) */}
      <div
        onClick={() => {
          if (!isEditing) toggleCollapse();
        }}
        className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 gap-2 cursor-pointer hover:bg-slate-100/90 dark:hover:bg-slate-800 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs">
            #{attempt.attemptNumber}
          </span>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              第 {attempt.attemptNumber} 次做题复盘
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${currentResultMeta.bgColor}`}>
                <ResultIcon className="w-3.5 h-3.5" />
                {currentResultMeta.label}
              </span>
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{formattedDate}</span>
              {attempt.timeSpentMinutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  耗时 {attempt.timeSpentMinutes} 分钟
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action buttons & collapse toggle */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  if (isCollapsed) toggleCollapse();
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                编辑三区记录
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="删除本次记录"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? '保存中...' : '完成保存'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
            </>
          )}

          {/* Explicit Expand / Collapse Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer"
            title={isCollapsed ? '点击展开详情' : '点击折叠收起'}
          >
            <span>{isCollapsed ? '展开' : '折叠'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Collapsed 1-line preview */}
      {isCollapsed && !isEditing && (
        <div 
          onClick={toggleCollapse}
          className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors select-none group"
        >
          <div className="flex flex-wrap items-center gap-3 truncate max-w-[85%]">
            {mdContent ? (
              <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                <FileCode className="w-3.5 h-3.5" />
                <span>MD笔记: {mdContent.replace(/[#*`$\n]/g, ' ').slice(0, 45)}...</span>
              </span>
            ) : null}
            {pdfUrl ? (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span>PDF: {pdfName || '已附讲义'}</span>
              </span>
            ) : null}
            {images.length > 0 ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{images.length} 张草稿图</span>
              </span>
            ) : null}
            {!mdContent && !pdfUrl && images.length === 0 && (
              <span className="text-slate-400 italic">暂无三区记录内容</span>
            )}
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 shrink-0 font-medium flex items-center gap-1 group-hover:underline">
            点击展开三区详情 <ChevronDown className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Expanded Content */}
      {(!isCollapsed || isEditing) && (
        <div className="p-4 space-y-4">
          {/* Metadata editor (Result & Time) in Edit Mode */}
          {isEditing && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    做题结果评价
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResult('correct')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border font-semibold transition-all cursor-pointer ${
                        result === 'correct'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> 正确
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult('partial')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border font-semibold transition-all cursor-pointer ${
                        result === 'partial'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> 半对/步骤分
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult('wrong')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border font-semibold transition-all cursor-pointer ${
                        result === 'wrong'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> 错误
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    做题耗时 (分钟)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(Number(e.target.value))}
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                    placeholder="例如: 15"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Three Separated Areas: MD Notes + PDF Viewer + Photos Gallery */}
          <SeparatedWorkspace
            mdContent={mdContent}
            onMdContentChange={setMdContent}
            mdPlaceholder="在此记录第几次做题的推导步骤、LaTeX公式、代码块及心得体会..."
            pdfUrl={pdfUrl}
            pdfName={pdfName}
            onPdfChange={(url, name) => {
              setPdfUrl(url);
              setPdfName(name);
            }}
            onPdfRemove={() => {
              setPdfUrl('');
              setPdfName('');
            }}
            images={images}
            onImagesChange={setImages}
            onViewImage={onViewImage}
            overlayDrawings={overlayDrawings}
            onOverlayDrawingsChange={(drawings) => {
              setOverlayDrawings(drawings);
              onUpdate({ overlayDrawings: drawings });
            }}
            drawingData={drawingData}
            drawingPages={drawingPages}
            onDrawingChange={(val) => {
              setDrawingData(val);
              onUpdate({ drawingData: val });
            }}
            onDrawingPagesChange={(pgs) => {
              setDrawingPages(pgs);
              onUpdate({ drawingPages: pgs, drawingData: pgs[0] || '' });
            }}
            isEditing={isEditing}
            defaultTab={attempt.defaultTab || 'md'}
            currentDefaultTab={attempt.defaultTab || 'md'}
            onSetDefaultTab={(tab) => onUpdate({ defaultTab: tab })}
            labels={{
              mdTab: '📝 演练草稿',
              pdfTab: '📑 对应 PDF',
              imagesTab: '📷 演算纸照片',
              drawingTab: '🎨 触控手绘板',
              allTab: '🔲 四区平铺',
              mdTitle: '📝 做题过程与草稿演算 (Markdown)',
              pdfTitle: '📑 练习作答 PDF',
              imagesTitle: '📷 演算草稿照片与做题截图',
              drawingTitle: '🎨 做题手绘演算板与笔迹批注'
            }}
          />

          {/* Bottom collapse footer for quick closing */}
          {!isEditing && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={toggleCollapse}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer select-none"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                折叠收起此做题记录
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
