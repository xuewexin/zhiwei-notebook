import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  Clock, 
  Tag, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  ZoomIn, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Sparkles,
  Calendar,
  Layers,
  Save,
  Check,
  Folder as FolderIcon,
  History,
  Brain,
  Flame,
  CheckCircle2,
  XCircle,
  FileText,
  Camera,
  FileCode,
  X
} from 'lucide-react';
import { Question, Attempt, Folder, MasteryStatus, WorkspaceTab, OverlayDrawings } from '../types';
import { ThemeConfig, THEME_PALETTES } from '../services/settingsService';
import { AttemptCard } from './AttemptCard';
import { MarkdownEditor } from './MarkdownEditor';
import { SeparatedWorkspace } from './SeparatedWorkspace';
import { VersionHistoryModal } from './VersionHistoryModal';
import { api } from '../api/client';
import { reviewService, ReviewTier } from '../services/reviewService';
import { marked } from 'marked';
import katex from 'katex';

interface QuestionDetailProps {
  question: Question;
  folder?: Folder;
  allFolders: Folder[];
  onBack: () => void;
  onUpdate: (updated: Question) => void;
  onDelete: (id: string) => void;
  onViewImage: (url: string) => void;
  currentTheme?: ThemeConfig;
}

const EBBINGHAUS_STAGES = [
  { stage: 0, days: 1, label: '第1天' },
  { stage: 1, days: 2, label: '第2天' },
  { stage: 2, days: 4, label: '第4天' },
  { stage: 3, days: 7, label: '第7天' },
  { stage: 4, days: 15, label: '第15天' },
  { stage: 5, days: 30, label: '第30天 (掌握)' },
];

export const QuestionDetail: React.FC<QuestionDetailProps> = ({
  question,
  folder,
  allFolders,
  onBack,
  onUpdate,
  onDelete,
  onViewImage,
  currentTheme = THEME_PALETTES.blue
}) => {
  // 1. Question (题目原题) state
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionTitle, setQuestionTitle] = useState(question.title || '');
  const [questionMd, setQuestionMd] = useState(question.mdContent || (question.contentType !== 'image' ? question.content : ''));
  const [questionPdfUrl, setQuestionPdfUrl] = useState(question.pdfUrl || '');
  const [questionPdfName, setQuestionPdfName] = useState(question.pdfName || '');
  const [questionImages, setQuestionImages] = useState<string[]>(
    Array.isArray(question.images) && question.images.length > 0 
      ? question.images 
      : (question.contentType === 'image' && question.content ? [question.content] : [])
  );

  const [questionDrawing, setQuestionDrawing] = useState<string>(question.drawingData || '');
  const [questionDrawingPages, setQuestionDrawingPages] = useState<string[]>(
    Array.isArray(question.drawingPages) && question.drawingPages.length > 0
      ? question.drawingPages
      : (question.drawingData ? [question.drawingData] : [''])
  );
  const [questionOverlayDrawings, setQuestionOverlayDrawings] = useState<OverlayDrawings>(question.questionOverlayDrawings || {});

  // 2. Standard Answer (标准答案) state
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(Boolean(question.answerContent || question.answerMd || question.answerPdfUrl || question.answerImages?.length || question.answerDrawing || question.answerDrawingPages?.length));
  const [answerMd, setAnswerMd] = useState(question.answerMd || (question.answerType !== 'image' ? (question.answerContent || '') : ''));
  const [answerPdfUrl, setAnswerPdfUrl] = useState(question.answerPdfUrl || '');
  const [answerPdfName, setAnswerPdfName] = useState(question.answerPdfName || '');
  const [answerImages, setAnswerImages] = useState<string[]>(
    Array.isArray(question.answerImages) && question.answerImages.length > 0
      ? question.answerImages
      : (question.answerType === 'image' && question.answerContent ? [question.answerContent] : [])
  );
  const [answerDrawing, setAnswerDrawing] = useState<string>(question.answerDrawing || '');
  const [answerDrawingPages, setAnswerDrawingPages] = useState<string[]>(
    Array.isArray(question.answerDrawingPages) && question.answerDrawingPages.length > 0
      ? question.answerDrawingPages
      : (question.answerDrawing ? [question.answerDrawing] : [''])
  );
  const [answerOverlayDrawings, setAnswerOverlayDrawings] = useState<OverlayDrawings>(question.answerOverlayDrawings || {});

  // 3. Reflection (写题心得与错因剖析) state
  const [showReflection, setShowReflection] = useState<boolean>(true);
  const [isEditingReflection, setIsEditingReflection] = useState<boolean>(false);
  const [isSavingReflection, setIsSavingReflection] = useState<boolean>(false);
  const [reflectionMd, setReflectionMd] = useState<string>(
    typeof question.reflectionMd === 'string'
      ? question.reflectionMd
      : typeof question.reflectionContent === 'string'
      ? question.reflectionContent
      : ''
  );
  const [reflectionPdfUrl, setReflectionPdfUrl] = useState<string>(question.reflectionPdfUrl || '');
  const [reflectionPdfName, setReflectionPdfName] = useState<string>(question.reflectionPdfName || '');
  const [reflectionImages, setReflectionImages] = useState<string[]>(Array.isArray(question.reflectionImages) ? question.reflectionImages : []);
  const [reflectionDrawing, setReflectionDrawing] = useState<string>(question.reflectionDrawing || '');
  const [reflectionDrawingPages, setReflectionDrawingPages] = useState<string[]>(
    Array.isArray(question.reflectionDrawingPages) && question.reflectionDrawingPages.length > 0
      ? question.reflectionDrawingPages
      : (question.reflectionDrawing ? [question.reflectionDrawing] : [''])
  );
  const [reflectionOverlayDrawings, setReflectionOverlayDrawings] = useState<OverlayDrawings>(question.reflectionOverlayDrawings || {});

  const toggleReflectionCollapse = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isEditingReflection) {
      setIsEditingReflection(false);
    }
    setShowReflection(prev => !prev);
  };

  // Quick error tag toggles
  const DEFAULT_ERROR_CAUSES = ['审题失误', '知识盲区', '公式遗忘', '计算失误', '思维定势', '分类讨论不全'];
  const [errorCauses, setErrorCauses] = useState<string[]>(question.errorCauses || []);
  const [newTagInput, setNewTagInput] = useState<string>('');

  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [isAddingAttempt, setIsAddingAttempt] = useState<boolean>(false);
  // Track which attempt IDs are currently expanded (empty set means all collapsed by default)
  const [expandedAttemptIds, setExpandedAttemptIds] = useState<Set<string>>(new Set());

  const [newAttemptResult, setNewAttemptResult] = useState<'correct' | 'wrong' | 'partial'>('wrong');
  const [newAttemptTime, setNewAttemptTime] = useState<number>(15);
  // 4 Separated Areas for new attempt
  const [newAttemptMd, setNewAttemptMd] = useState<string>('');
  const [newAttemptPdfUrl, setNewAttemptPdfUrl] = useState<string>('');
  const [newAttemptPdfName, setNewAttemptPdfName] = useState<string>('');
  const [newAttemptImages, setNewAttemptImages] = useState<string[]>([]);
  const [newAttemptDrawing, setNewAttemptDrawing] = useState<string>('');
  const [newAttemptDrawingPages, setNewAttemptDrawingPages] = useState<string[]>(['']);
  const [newAttemptOverlayDrawings, setNewAttemptOverlayDrawings] = useState<OverlayDrawings>({});
  const [newAttemptDefaultTab, setNewAttemptDefaultTab] = useState<WorkspaceTab>('md');
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState<boolean>(false);

  // Sync state when question changes
  useEffect(() => {
    setQuestionTitle(question.title || '');
    setQuestionMd(question.mdContent || (question.contentType !== 'image' ? question.content : ''));
    setQuestionPdfUrl(question.pdfUrl || '');
    setQuestionPdfName(question.pdfName || '');
    setQuestionImages(
      Array.isArray(question.images) && question.images.length > 0 
        ? question.images 
        : (question.contentType === 'image' && question.content ? [question.content] : [])
    );
    setQuestionDrawing(question.drawingData || '');
    setQuestionDrawingPages(
      Array.isArray(question.drawingPages) && question.drawingPages.length > 0
        ? question.drawingPages
        : (question.drawingData ? [question.drawingData] : [''])
    );
    setQuestionOverlayDrawings(question.questionOverlayDrawings || {});

    setAnswerMd(question.answerMd || (question.answerType !== 'image' ? (question.answerContent || '') : ''));
    setAnswerPdfUrl(question.answerPdfUrl || '');
    setAnswerPdfName(question.answerPdfName || '');
    setAnswerImages(
      Array.isArray(question.answerImages) && question.answerImages.length > 0
        ? question.answerImages
        : (question.answerType === 'image' && question.answerContent ? [question.answerContent] : [])
    );
    setAnswerDrawing(question.answerDrawing || '');
    setAnswerDrawingPages(
      Array.isArray(question.answerDrawingPages) && question.answerDrawingPages.length > 0
        ? question.answerDrawingPages
        : (question.answerDrawing ? [question.answerDrawing] : [''])
    );
    setAnswerOverlayDrawings(question.answerOverlayDrawings || {});

    setReflectionMd(question.reflectionMd || question.reflectionContent || '');
    setReflectionPdfUrl(question.reflectionPdfUrl || '');
    setReflectionPdfName(question.reflectionPdfName || '');
    setReflectionImages(Array.isArray(question.reflectionImages) ? question.reflectionImages : []);
    setReflectionDrawing(question.reflectionDrawing || '');
    setReflectionDrawingPages(
      Array.isArray(question.reflectionDrawingPages) && question.reflectionDrawingPages.length > 0
        ? question.reflectionDrawingPages
        : (question.reflectionDrawing ? [question.reflectionDrawing] : [''])
    );
    setReflectionOverlayDrawings(question.reflectionOverlayDrawings || {});
    setErrorCauses(question.errorCauses || []);

    setIsEditingQuestion(false);
    setIsEditingAnswer(false);
    setIsEditingReflection(false);
    setShowAnswer(Boolean(question.answerContent || question.answerMd || question.answerPdfUrl || question.answerImages?.length || question.answerDrawing || question.answerDrawingPages?.length));
    setIsAddingAttempt(false);
    setNewAttemptOverlayDrawings({});
    setExpandedAttemptIds(new Set());
  }, [question.id]);

  const handleToggleErrorCause = async (tag: string) => {
    const nextCauses = errorCauses.includes(tag)
      ? errorCauses.filter(t => t !== tag)
      : [...errorCauses, tag];
    setErrorCauses(nextCauses);
    try {
      const updated = await api.updateQuestion(question.id, { errorCauses: nextCauses });
      onUpdate(updated);
    } catch (e) {
      console.error('更新错因标签失败:', e);
    }
  };

  const handleFolderChange = async (newFolderId: string) => {
    try {
      const updated = await api.updateQuestion(question.id, { folderId: newFolderId });
      onUpdate(updated);
    } catch (e) {
      alert('更新归类文件夹失败: ' + e.message);
    }
  };

  const handleAddCustomTag = async () => {
    const raw = newTagInput.trim();
    if (!raw) return;
    const splitTags = raw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
    const currentTags = question.tags || [];
    const newItems = splitTags.filter(t => !currentTags.includes(t));
    if (newItems.length === 0) {
      setNewTagInput('');
      return;
    }
    const nextTags = [...currentTags, ...newItems];
    setNewTagInput('');
    try {
      const updated = await api.updateQuestion(question.id, { tags: nextTags });
      onUpdate(updated);
    } catch (e) {
      console.error('添加标签失败:', e);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const nextTags = (question.tags || []).filter(t => t !== tagToRemove);
    try {
      const updated = await api.updateQuestion(question.id, { tags: nextTags });
      onUpdate(updated);
    } catch (e) {
      console.error('删除标签失败:', e);
    }
  };

  const handleSaveQuestion = async () => {
    setIsSavingQuestion(true);
    try {
      const updated = await api.updateQuestion(question.id, {
        title: questionTitle.trim() || question.title,
        mdContent: questionMd,
        content: questionMd || (questionImages[0] || ''),
        contentType: questionMd ? 'text' : (questionImages.length > 0 ? 'image' : question.contentType),
        pdfUrl: questionPdfUrl,
        pdfName: questionPdfName,
        images: questionImages,
        drawingData: questionDrawing || questionDrawingPages[0] || '',
        drawingPages: questionDrawingPages,
        questionOverlayDrawings
      });
      onUpdate(updated);
      setIsEditingQuestion(false);
    } catch (e: any) {
      alert('保存题目修改失败: ' + (e.message || '未知错误'));
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleSaveAnswer = async () => {
    setIsSavingAnswer(true);
    try {
      const updated = await api.updateQuestion(question.id, {
        answerContent: answerMd || (answerImages[0] || ''),
        answerMd,
        answerType: answerMd ? 'text' : (answerImages.length > 0 ? 'image' : 'text'),
        answerPdfUrl,
        answerPdfName,
        answerImages,
        answerDrawing: answerDrawing || answerDrawingPages[0] || '',
        answerDrawingPages,
        answerOverlayDrawings
      });
      onUpdate(updated);
      setIsEditingAnswer(false);
    } catch (e: any) {
      alert('保存标准解答失败: ' + (e.message || '未知错误'));
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const handleSaveReflection = async () => {
    setIsSavingReflection(true);
    try {
      const updated = await api.updateQuestion(question.id, {
        reflectionContent: reflectionMd,
        reflectionMd,
        reflectionPdfUrl,
        reflectionPdfName,
        reflectionImages,
        reflectionDrawing: reflectionDrawing || reflectionDrawingPages[0] || '',
        reflectionDrawingPages,
        reflectionOverlayDrawings,
        errorCauses
      });
      onUpdate(updated);
      setIsEditingReflection(false);
    } catch (e: any) {
      alert('保存写题心得失败: ' + e.message);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const handleSetUnitDefaultTab = async (unit: 'question' | 'answer' | 'reflection', tab: WorkspaceTab) => {
    try {
      const fieldMap = {
        question: 'questionDefaultTab',
        answer: 'answerDefaultTab',
        reflection: 'reflectionDefaultTab'
      } as const;
      const updated = await api.updateQuestion(question.id, {
        [fieldMap[unit]]: tab
      });
      onUpdate(updated);
    } catch (e: any) {
      alert('设置默认展示失败: ' + (e.message || '未知错误'));
    }
  };

  const handleMasteryChange = async (mastery: MasteryStatus) => {
    try {
      const updated = await api.updateQuestion(question.id, { mastery });
      onUpdate(updated);
    } catch (e) {
      alert('更新掌握状态失败: ' + e.message);
    }
  };

  const handleAddAttemptSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmittingAttempt(true);
    try {
      const res = await api.addAttempt(question.id, {
        result: newAttemptResult,
        timeSpentMinutes: Number(newAttemptTime),
        mdContent: newAttemptMd,
        pdfUrl: newAttemptPdfUrl,
        pdfName: newAttemptPdfName,
        images: newAttemptImages,
        drawingData: newAttemptDrawing || newAttemptDrawingPages[0] || '',
        drawingPages: newAttemptDrawingPages,
        overlayDrawings: newAttemptOverlayDrawings,
        defaultTab: newAttemptDefaultTab,
        // Legacy compatibility
        solutionContent: newAttemptMd,
        solutionType: newAttemptImages.length > 0 ? 'image' : 'text'
      });
      onUpdate(res.question);
      setIsAddingAttempt(false);
      setNewAttemptMd('');
      setNewAttemptPdfUrl('');
      setNewAttemptPdfName('');
      setNewAttemptImages([]);
      setNewAttemptDrawing('');
      setNewAttemptDrawingPages(['']);
      setNewAttemptOverlayDrawings({});
      setNewAttemptDefaultTab('md');
      // Auto-expand the newly created attempt
      const updatedAttempts = res.question?.attempts || [];
      const newest = updatedAttempts[updatedAttempts.length - 1];
      if (newest) {
        setExpandedAttemptIds(prev => new Set([...prev, newest.id]));
      }
    } catch (e: any) {
      alert('添加做题记录失败: ' + (e.message || '未知错误'));
    } finally {
      setIsSubmittingAttempt(false);
    }
  };

  const handleUpdateAttempt = async (attemptId: string, updatedFields: Partial<Attempt>) => {
    try {
      const res = await api.updateAttempt(question.id, attemptId, updatedFields);
      onUpdate(res.question);
    } catch (e) {
      alert('更新记录失败: ' + e.message);
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm('确定要删除该次练习记录吗？')) return;
    try {
      const res = await api.deleteAttempt(question.id, attemptId);
      onUpdate(res.question);
    } catch (e) {
      alert('删除记录失败: ' + e.message);
    }
  };

  const attempts = question.attempts || [];
  const allAttemptsExpanded = attempts.length > 0 && attempts.every(a => expandedAttemptIds.has(a.id));

  const handleToggleExpandAll = () => {
    if (allAttemptsExpanded) {
      setExpandedAttemptIds(new Set());
    } else {
      setExpandedAttemptIds(new Set(attempts.map(a => a.id)));
    }
  };

  const handleToggleAttemptCollapse = (attemptId: string) => {
    setExpandedAttemptIds(prev => {
      const next = new Set(prev);
      if (next.has(attemptId)) {
        next.delete(attemptId);
      } else {
        next.add(attemptId);
      }
      return next;
    });
  };

  // Ebbinghaus helpers
  const currentStage = question.reviewStage !== undefined ? question.reviewStage : 0;
  const isDueToday = !question.nextReviewDate || new Date(question.nextReviewDate).getTime() <= Date.now() + 24 * 60 * 60 * 1000;
  const daysRemaining = question.nextReviewDate 
    ? Math.max(0, Math.ceil((new Date(question.nextReviewDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
  const [isApplyingReview, setIsApplyingReview] = useState(false);

  const perfectPlan = reviewService.calculatePlan(currentStage, 'perfect');
  const goodPlan = reviewService.calculatePlan(currentStage, 'good');
  const unfamiliarPlan = reviewService.calculatePlan(currentStage, 'unfamiliar');

  const handleCompleteReviewTier = async (tier: ReviewTier) => {
    setIsApplyingReview(true);
    try {
      const { updatedQuestion, plan } = await reviewService.completeReview(question, tier);
      onUpdate(updatedQuestion);
      setReviewFeedback(plan.summary);
      setTimeout(() => {
        setReviewFeedback(null);
      }, 4500);
    } catch (err) {
      console.error('Failed to complete review tier:', err);
    } finally {
      setIsApplyingReview(false);
    }
  };

  // Helper to render KaTeX formulas in Markdown question text
  const renderFormattedText = (raw: string) => {
    if (!raw) return '';
    let processed = raw.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => {
      try {
        return `<div class="my-2 py-1 flex justify-center">${katex.renderToString(f.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return m;
      }
    });
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (m, f) => {
      try {
        return katex.renderToString(f.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return m;
      }
    });
    return marked.parse(processed, { breaks: true }) as string;
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 sm:pb-20 animate-fade-in">
      {/* 1. Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5 sm:mb-4 bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回</span>
          </button>

          {/* In-place Category Folder Selector */}
          <div className="flex items-center gap-1 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-1 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
            <FolderIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={question.folderId}
              onChange={(e) => handleFolderChange(e.target.value)}
              className="text-xs font-semibold bg-transparent text-blue-900 dark:text-blue-300 focus:outline-none cursor-pointer max-w-[90px] sm:max-w-none truncate"
              title="修改所属科目/分类"
            >
              {allFolders.map(f => (
                <option key={f.id} value={f.id} className="text-slate-800 bg-white">
                  {f.parentId ? `└ ${f.name}` : f.name}
                </option>
              ))}
            </select>
          </div>

          {question.source && (
            <span className="hidden sm:inline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs text-slate-500">
              来源: {question.source}
            </span>
          )}
        </div>

        {/* Mastery Status Selector & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            {(['unmastered', 'reviewing', 'mastered'] as MasteryStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleMasteryChange(st)}
                className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                  question.mastery === st
                    ? st === 'mastered'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : st === 'reviewing'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'unmastered' && '未掌握'}
                {st === 'reviewing' && '攻关中'}
                {st === 'mastered' && '已掌握'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowVersionModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-all border border-indigo-200/70 dark:border-indigo-900/60 shadow-2xs cursor-pointer"
            title="查看此题的历次上传版本与冲突快照，支持一键对比和回退"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1">版本</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('确定要删除这道错题吗？')) {
                onDelete(question.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="删除此错题"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 艾宾浩斯遗忘循环算法卡片 (Ebbinghaus Spaced Repetition) - 纯色无渐变 */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-700/80 mb-4 sm:mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-xs shrink-0"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Brain className="w-4 h-4 text-white" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  艾宾浩斯遗忘复盘
                </h4>
                {isDueToday ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1 animate-pulse shadow-xs">
                    <Flame className="w-3 h-3 fill-white" />
                    今日待复习
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {daysRemaining > 0 ? `建议 ${daysRemaining} 天后` : '已按期复盘'}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                做对自动推后复习天数，做错自动回退重新巩固
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px]">建议下次复盘</span>
            <span className="font-bold text-xs" style={{ color: currentTheme.primary }}>
              {question.nextReviewDate 
                ? new Date(question.nextReviewDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' }) 
                : '明天'}
            </span>
          </div>
        </div>

        {/* 6-Stage Visual Indicator: 3 cols on mobile, 6 cols on sm+ */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-1.5 pt-1">
          {EBBINGHAUS_STAGES.map((s, idx) => {
            const isCompleted = currentStage >= s.stage;
            const isCurrent = currentStage === s.stage;
            return (
              <div key={idx} className="text-center bg-white/70 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div 
                  className={`h-1.5 rounded-full mb-1 transition-all ${
                    !isCurrent && !isCompleted ? 'bg-slate-200 dark:bg-slate-700' : ''
                  }`}
                  style={
                    isCurrent ? { backgroundColor: currentTheme.primary, boxShadow: `0 0 0 2px ${currentTheme.primary}40` } :
                    isCompleted ? { backgroundColor: `${currentTheme.primary}80` } : {}
                  }
                />
                <span 
                  className={`text-[10px] block truncate ${isCurrent ? 'font-bold' : 'text-slate-500 dark:text-slate-400'}`}
                  style={isCurrent ? { color: currentTheme.primary } : {}}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3-Tier Review Completion Controls */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  完成本次复习
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                选择掌握程度，系统将依据记忆遗忘曲线自动安排下次复盘时间
              </p>
            </div>

            {/* 3 Tier Action Buttons */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <button
                type="button"
                disabled={isApplyingReview}
                onClick={() => handleCompleteReviewTier('perfect')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:shadow active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
                title={`完全掌握：${perfectPlan.summary}`}
              >
                <div className="flex items-center gap-1">
                  <span>完全掌握</span>
                </div>
                <span className="text-[9px] opacity-90 font-mono">
                  {perfectPlan.nextDays}天后复盘
                </span>
              </button>

              <button
                type="button"
                disabled={isApplyingReview}
                onClick={() => handleCompleteReviewTier('good')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs hover:shadow active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
                title={`基本掌握：${goodPlan.summary}`}
              >
                <div className="flex items-center gap-1">
                  <span>基本掌握</span>
                </div>
                <span className="text-[9px] opacity-90 font-mono">
                  {goodPlan.nextDays}天后巩固
                </span>
              </button>

              <button
                type="button"
                disabled={isApplyingReview}
                onClick={() => handleCompleteReviewTier('unfamiliar')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs hover:shadow active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
                title={`不熟悉：${unfamiliarPlan.summary}`}
              >
                <div className="flex items-center gap-1">
                  <span>不熟悉</span>
                </div>
                <span className="text-[9px] opacity-90 font-mono">
                  明天重点复查
                </span>
              </button>
            </div>
          </div>

          {reviewFeedback && (
            <div className="mt-2.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{reviewFeedback}</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                已自动记录并打卡 ✓
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2.5 模块单行横向滑动导航条 (Module Quick Jump Navigation Bar) */}
      <div className="flex items-center gap-1.5 p-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs mb-4 overflow-x-auto scrollbar-none flex-nowrap select-none sticky top-2 z-20 touch-pan-x">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 px-2 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>快速定位:</span>
        </span>
        <button
          type="button"
          onClick={() => document.getElementById('unit-question')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors shrink-0 whitespace-nowrap cursor-pointer border border-blue-200/60 dark:border-blue-900/60 shadow-2xs"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. 题目原题</span>
          {Boolean(questionOverlayDrawings?.md || questionOverlayDrawings?.pdf || questionOverlayDrawings?.images) && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="包含手写批注" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowAnswer(true);
            setTimeout(() => document.getElementById('unit-answer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-colors shrink-0 whitespace-nowrap cursor-pointer border border-emerald-200/60 dark:border-emerald-900/60 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>2. 标准解答</span>
          {Boolean(answerOverlayDrawings?.md || answerOverlayDrawings?.pdf || answerOverlayDrawings?.images) && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="包含手写批注" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowReflection(true);
            setTimeout(() => document.getElementById('unit-reflection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition-colors shrink-0 whitespace-nowrap cursor-pointer border border-indigo-200/60 dark:border-indigo-900/60 shadow-2xs"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>3. 写题心得与错因</span>
          {Boolean(reflectionOverlayDrawings?.md || reflectionOverlayDrawings?.pdf || reflectionOverlayDrawings?.images) && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="包含手写批注" />
          )}
        </button>

        <button
          type="button"
          onClick={() => document.getElementById('unit-attempts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 transition-colors shrink-0 whitespace-nowrap cursor-pointer border border-purple-200/60 dark:border-purple-900/60 shadow-2xs"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>4. 练习历程 ({attempts.length})</span>
        </button>
      </div>

      {/* 3. Main Question Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
        {/* Question Header & Title */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {question.title || '错题题目'}
            </h1>
            <div className="flex items-center gap-1 text-amber-500 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < (question.difficulty || 3) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tags (In-place editable) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {question.tags && question.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-600 ml-0.5 text-slate-400"
                  title="删除标签"
                >
                  ×
                </button>
              </span>
            ))}
            
            {/* Inline add tag input */}
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="+ 新增标签"
                className="text-xs px-2.5 py-0.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg w-24 focus:w-32 transition-all bg-transparent focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        {/* ================= UNIT 1: 题目原题呈现 ================= */}
        <div id="unit-question" className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                题目原题呈现
              </h4>
              <span className="text-[11px] text-slate-400">
                (支持 Markdown 演算题干、试卷 PDF 与题目原图)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isEditingQuestion ? (
                <button
                  type="button"
                  onClick={() => setIsEditingQuestion(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors border border-blue-200 dark:border-blue-900 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  编辑原题
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingQuestion(false);
                      setQuestionTitle(question.title || '');
                      setQuestionMd(question.mdContent || (question.contentType !== 'image' ? question.content : ''));
                      setQuestionPdfUrl(question.pdfUrl || '');
                      setQuestionPdfName(question.pdfName || '');
                      setQuestionImages(
                        Array.isArray(question.images) && question.images.length > 0 
                          ? question.images 
                          : (question.contentType === 'image' && question.content ? [question.content] : [])
                      );
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuestion}
                    disabled={isSavingQuestion}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingQuestion ? '保存中...' : '完成保存'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {isEditingQuestion && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                题目名称 / 标题：
              </label>
              <input
                type="text"
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                placeholder="例如: 已知函数 f(x) 恒有两个极值点求 a 范围..."
                className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          )}

          <SeparatedWorkspace
            mdContent={questionMd}
            onMdContentChange={setQuestionMd}
            mdPlaceholder="在此输入题干文本、推导公式或排版（支持 LaTeX 数学公式与 Markdown 语法）..."
            pdfUrl={questionPdfUrl}
            pdfName={questionPdfName}
            onPdfChange={(url, name) => {
              setQuestionPdfUrl(url);
              setQuestionPdfName(name);
            }}
            onPdfRemove={() => {
              setQuestionPdfUrl('');
              setQuestionPdfName('');
            }}
            images={questionImages}
            onImagesChange={setQuestionImages}
            onViewImage={onViewImage}
            overlayDrawings={questionOverlayDrawings}
            onOverlayDrawingsChange={async (drawings) => {
              setQuestionOverlayDrawings(drawings);
              try {
                const updated = await api.updateQuestion(question.id, {
                  questionOverlayDrawings: drawings
                });
                onUpdate(updated);
              } catch (e: any) {
                console.error('保存题目手写批注失败:', e);
              }
            }}
            drawingData={questionDrawing}
            drawingPages={questionDrawingPages}
            onDrawingChange={async (val) => {
              setQuestionDrawing(val);
              try {
                const updated = await api.updateQuestion(question.id, { drawingData: val });
                onUpdate(updated);
              } catch (e: any) {
                console.error('保存题目手绘失败:', e);
              }
            }}
            onDrawingPagesChange={async (pgs) => {
              setQuestionDrawingPages(pgs);
              try {
                const updated = await api.updateQuestion(question.id, {
                  drawingPages: pgs,
                  drawingData: pgs[0] || ''
                });
                onUpdate(updated);
              } catch (e: any) {
                console.error('保存题目多页手绘失败:', e);
              }
            }}
            isEditing={isEditingQuestion}
            defaultTab={question.questionDefaultTab || 'md'}
            currentDefaultTab={question.questionDefaultTab || 'md'}
            onSetDefaultTab={(tab) => handleSetUnitDefaultTab('question', tab)}
            labels={{
              mdTab: '题目内容 (MD)',
              pdfTab: '试卷 PDF',
              imagesTab: '题目原图',
              drawingTab: '题目手绘',
              allTab: '四区平铺',
              mdTitle: '题目内容 (Markdown 格式)',
              mdSubtitle: '(支持排版、推导步骤、LaTeX 数学公式)',
              pdfTitle: '试卷与题目 PDF 文档',
              pdfSubtitle: '(试卷原卷 / 题目专题 PDF)',
              pdfEmptyHint: '可上传试卷原题 PDF 文档，支持内置嵌入式预览与全屏阅读',
              imagesTitle: '题目原图与截图',
              imagesSubtitle: '(试题截图、题目原画、配图等)',
              imagesEmptyHint: '可上传或 Ctrl+V 粘贴题目照片或截图',
              drawingTitle: '题目手绘草稿与批注'
            }}
          />
        </div>

        {/* ================= UNIT 2: 标准解答 / 官方解析参考 ================= */}
        <div id="unit-answer" className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-emerald-50/30 dark:bg-emerald-950/20 gap-2">
            <button
              type="button"
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>标准解答 / 官方解析参考</span>
              <span className="text-[11px] font-normal text-slate-400">
                {showAnswer ? '(点击收起)' : '(点击展开查看)'}
              </span>
              {showAnswer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-2">
              {!isEditingAnswer ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAnswer(true);
                    setIsEditingAnswer(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  编辑答案
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAnswer(false);
                      setAnswerMd(question.answerMd || (question.answerType !== 'image' ? (question.answerContent || '') : ''));
                      setAnswerPdfUrl(question.answerPdfUrl || '');
                      setAnswerPdfName(question.answerPdfName || '');
                      setAnswerImages(
                        Array.isArray(question.answerImages) && question.answerImages.length > 0
                          ? question.answerImages
                          : (question.answerType === 'image' && question.answerContent ? [question.answerContent] : [])
                      );
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAnswer}
                    disabled={isSavingAnswer}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingAnswer ? '保存中...' : '完成保存'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {(showAnswer || isEditingAnswer) && (
            <div className="p-6 bg-emerald-50/10 dark:bg-emerald-950/10">
              <SeparatedWorkspace
                mdContent={answerMd}
                onMdContentChange={setAnswerMd}
                mdPlaceholder="在此输入官方标准解答步骤、详细推导、参考解析与考点得分要点..."
                pdfUrl={answerPdfUrl}
                pdfName={answerPdfName}
                onPdfChange={(url, name) => {
                  setAnswerPdfUrl(url);
                  setAnswerPdfName(name);
                }}
                onPdfRemove={() => {
                  setAnswerPdfUrl('');
                  setAnswerPdfName('');
                }}
                images={answerImages}
                onImagesChange={setAnswerImages}
                onViewImage={onViewImage}
                overlayDrawings={answerOverlayDrawings}
                onOverlayDrawingsChange={async (drawings) => {
                  setAnswerOverlayDrawings(drawings);
                  try {
                    const updated = await api.updateQuestion(question.id, {
                      answerOverlayDrawings: drawings
                    });
                    onUpdate(updated);
                  } catch (e: any) {
                    console.error('保存标准答案手写批注失败:', e);
                  }
                }}
                drawingData={answerDrawing}
                drawingPages={answerDrawingPages}
                onDrawingChange={async (val) => {
                  setAnswerDrawing(val);
                  try {
                    const updated = await api.updateQuestion(question.id, { answerDrawing: val });
                    onUpdate(updated);
                  } catch (e: any) {
                    console.error('保存标准答案手绘失败:', e);
                  }
                }}
                onDrawingPagesChange={async (pgs) => {
                  setAnswerDrawingPages(pgs);
                  try {
                    const updated = await api.updateQuestion(question.id, {
                      answerDrawingPages: pgs,
                      answerDrawing: pgs[0] || ''
                    });
                    onUpdate(updated);
                  } catch (e: any) {
                    console.error('保存标准答案多页手绘失败:', e);
                  }
                }}
                isEditing={isEditingAnswer}
                defaultTab={question.answerDefaultTab || 'md'}
                currentDefaultTab={question.answerDefaultTab || 'md'}
                onSetDefaultTab={(tab) => handleSetUnitDefaultTab('answer', tab)}
                labels={{
                  mdTab: '答案解答 (MD)',
                  pdfTab: '答案 PDF',
                  imagesTab: '解答图片',
                  drawingTab: '答案手绘',
                  allTab: '四区平铺',
                  mdTitle: '标准解答与详细解析 (Markdown)',
                  mdSubtitle: '(支持推导步骤、LaTeX 评分要点、公式化简)',
                  pdfTitle: '官方解析与讲义 PDF',
                  pdfSubtitle: '(标准答案讲义 / 官方红皮书 PDF)',
                  pdfEmptyHint: '可上传官方解析 PDF 或老师补充讲义，支持随时翻阅',
                  imagesTitle: '答案手稿与解析图片',
                  imagesSubtitle: '(标准答案照片、答案解析截图)',
                  imagesEmptyHint: '可上传或 Ctrl+V 粘贴标准答案照片',
                  drawingTitle: '标准解答手绘草稿与批注'
                }}
              />
            </div>
          )}
        </div>

        {/* ================= UNIT 3: 写题心得与错因剖析 ================= */}
        <div id="unit-reflection">
          <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-blue-50/20 dark:bg-blue-950/20 gap-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={toggleReflectionCollapse}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                  写题心得与错因剖析
                  <span className="text-xs font-normal text-slate-400">
                    {showReflection ? '(点击收起)' : '(点击展开)'}
                  </span>
                  {showReflection ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  总结解题突破口、核心模型与思维漏洞（支持 Markdown、拓展资料 PDF 与手写笔记照片）
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleReflectionCollapse}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-all"
              >
                <span>{showReflection ? '收起' : '展开'}</span>
                {showReflection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {!isEditingReflection ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowReflection(true);
                    setIsEditingReflection(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors border border-blue-200 dark:border-blue-900 cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  编辑心得
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingReflection(false);
                      setReflectionMd(question.reflectionMd || question.reflectionContent || '');
                      setReflectionPdfUrl(question.reflectionPdfUrl || '');
                      setReflectionPdfName(question.reflectionPdfName || '');
                      setReflectionImages(Array.isArray(question.reflectionImages) ? question.reflectionImages : []);
                      setErrorCauses(question.errorCauses || []);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReflection}
                    disabled={isSavingReflection}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingReflection ? '保存中...' : '完成保存'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Collapsed 1-line summary banner */}
          {!showReflection && !isEditingReflection && (
            <div
              onClick={() => setShowReflection(true)}
              className="px-6 py-3 bg-blue-50/30 dark:bg-slate-800/20 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors select-none group"
            >
              <div className="flex flex-wrap items-center gap-2.5 truncate max-w-[85%]">
                {Array.isArray(errorCauses) && errorCauses.length > 0 && (
                  <div className="flex items-center gap-1">
                    {errorCauses.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {Boolean(reflectionMd && typeof reflectionMd === 'string') && (
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {reflectionMd.replace(/[#*`$\n]/g, ' ').slice(0, 50)}...
                  </span>
                )}
                {reflectionPdfUrl && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium text-[11px] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    附 PDF: {reflectionPdfName || '讲义资料'}
                  </span>
                )}
                {Array.isArray(reflectionImages) && reflectionImages.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {reflectionImages.length} 张笔记照片
                  </span>
                )}
                {(reflectionDrawing || (Array.isArray(reflectionDrawingPages) && reflectionDrawingPages.length > 0)) && (
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-[11px] flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    附手绘画稿
                  </span>
                )}
                {!reflectionMd && !reflectionPdfUrl && (!Array.isArray(reflectionImages) || reflectionImages.length === 0) && (!Array.isArray(errorCauses) || errorCauses.length === 0) && (
                  <span className="text-slate-400 italic">暂无心得记录，点击展开录入</span>
                )}
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 shrink-0 font-semibold flex items-center gap-1 group-hover:underline">
                点击展开详情 <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Expanded Content: Error Tags & SeparatedWorkspace */}
          {(showReflection || isEditingReflection) && (
            <div className="p-6">
              {/* Quick Error Tags Selector (In-place toggle, does NOT reload or navigate) */}
              <div className="mb-4">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">
                  错因归类标签：
                </span>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_ERROR_CAUSES.map((cause) => {
                    const isSelected = errorCauses.includes(cause);
                    return (
                      <button
                        key={cause}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleErrorCause(cause);
                        }}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                        <span>{cause}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <SeparatedWorkspace
                mdContent={reflectionMd}
                onMdContentChange={setReflectionMd}
                mdPlaceholder="写下关于这道题的关键思路、思维突破口、易错点与解题模型归纳（支持 Ctrl+B 粗体、Ctrl+K 代码块、Ctrl+M 公式、Ctrl+H 标题）..."
                pdfUrl={reflectionPdfUrl}
                pdfName={reflectionPdfName}
                onPdfChange={(url, name) => {
                  setReflectionPdfUrl(url);
                  setReflectionPdfName(name);
                }}
                onPdfRemove={() => {
                  setReflectionPdfUrl('');
                  setReflectionPdfName('');
                }}
                images={reflectionImages}
                onImagesChange={setReflectionImages}
                onViewImage={onViewImage}
                overlayDrawings={reflectionOverlayDrawings}
                onOverlayDrawingsChange={async (drawings) => {
                  setReflectionOverlayDrawings(drawings);
                  try {
                    const updated = await api.updateQuestion(question.id, {
                      reflectionOverlayDrawings: drawings
                    });
                    onUpdate(updated);
                  } catch (e: any) {
                    console.error('保存心得手写批注失败:', e);
                  }
                }}
                drawingData={reflectionDrawing}
                drawingPages={reflectionDrawingPages}
                onDrawingChange={async (val) => {
                  setReflectionDrawing(val);
                  try {
                    const updated = await api.updateQuestion(question.id, { reflectionDrawing: val });
                    onUpdate(updated);
                  } catch (e: any) {
                    console.error('保存心得手绘失败:', e);
                  }
                }}
                onDrawingPagesChange={async (pgs) => {
                  setReflectionDrawingPages(pgs);
                  try {
                    const updated = await api.updateQuestion(question.id, {
                      reflectionDrawingPages: pgs,
                      reflectionDrawing: pgs[0] || ''
                    });
                    onUpdate(updated);
                  } catch (e: any) {
                    console.error('保存心得多页手绘失败:', e);
                  }
                }}
                isEditing={isEditingReflection}
                defaultTab={question.reflectionDefaultTab || 'md'}
                currentDefaultTab={question.reflectionDefaultTab || 'md'}
                onSetDefaultTab={(tab) => handleSetUnitDefaultTab('reflection', tab)}
                labels={{
                  mdTab: '心得笔记 (MD)',
                  pdfTab: '拓展资料 PDF',
                  imagesTab: '笔记照片',
                  drawingTab: '心得手绘',
                  allTab: '四区平铺',
                  mdTitle: '错因剖析与心得体会 (Markdown)',
                  mdSubtitle: '(支持归纳核心模型、解题套路与易错陷阱)',
                  pdfTitle: '拓展资料与讲义 PDF',
                  pdfSubtitle: '(专题拓展文档 / 易错考点总结 PDF)',
                  pdfEmptyHint: '可上传归纳总结、专题拓展文档 PDF',
                  imagesTitle: '错题手写反思与模型手卡',
                  imagesSubtitle: '(手写纠错笔记、手卡照片)',
                  imagesEmptyHint: '可上传或 Ctrl+V 粘贴手写复盘笔记照片',
                  drawingTitle: '心得反思手绘草稿与批注'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: 练习历程 / 做题分区 (第一次做、第二次做...) */}
      <div id="unit-attempts" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              练习历程与做题分区
              <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                共 {attempts.length} 次练习
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              遵循遗忘曲线反复演练，记录每次做题结果、演算草稿照片与最新反思（默认折叠，点击标题即可展开）
            </p>
          </div>

          <div className="flex items-center gap-2">
            {attempts.length > 0 && (
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                title={allAttemptsExpanded ? '折叠所有做题记录' : '展开所有做题记录'}
              >
                {allAttemptsExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    折叠全部
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    展开全部
                  </>
                )}
              </button>
            )}

            {!isAddingAttempt && (
              <button
                type="button"
                onClick={() => setIsAddingAttempt(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs hover:shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                添加第 {attempts.length + 1} 次做题记录
              </button>
            )}
          </div>
        </div>

        {/* New Attempt Input Form */}
        {isAddingAttempt && (
          <div className="mb-6 p-5 rounded-2xl bg-indigo-50/40 dark:bg-slate-800/40 border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-slate-700">
              <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                  #{attempts.length + 1}
                </span>
                创建第 {attempts.length + 1} 次做题分区
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingAttempt(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                取消
              </button>
            </div>

            {/* Result & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  做题结果
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAttemptResult('correct')}
                    className={`flex-1 py-1.5 text-xs rounded-xl border font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      newAttemptResult === 'correct'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>做对了</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAttemptResult('partial')}
                    className={`flex-1 py-1.5 text-xs rounded-xl border font-semibold transition-all cursor-pointer ${
                      newAttemptResult === 'partial'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    半对 / 步骤分
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAttemptResult('wrong')}
                    className={`flex-1 py-1.5 text-xs rounded-xl border font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      newAttemptResult === 'wrong'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>做错了</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  做题耗时 (分钟)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newAttemptTime}
                  onChange={(e) => setNewAttemptTime(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  placeholder="例如: 15"
                />
              </div>
            </div>

            {/* Three Separated Areas: MD Notes, PDF Handout, Photos Gallery */}
            <div className="pt-1">
              <SeparatedWorkspace
                mdContent={newAttemptMd}
                onMdContentChange={setNewAttemptMd}
                mdPlaceholder="在此记录本次练习推导步骤、LaTeX 数学公式（如 $f(x)=x^2$）、代码块及复盘体会..."
                pdfUrl={newAttemptPdfUrl}
                pdfName={newAttemptPdfName}
                onPdfChange={(url, name) => {
                  setNewAttemptPdfUrl(url);
                  setNewAttemptPdfName(name);
                }}
                onPdfRemove={() => {
                  setNewAttemptPdfUrl('');
                  setNewAttemptPdfName('');
                }}
                images={newAttemptImages}
                onImagesChange={setNewAttemptImages}
                onViewImage={onViewImage}
                overlayDrawings={newAttemptOverlayDrawings}
                onOverlayDrawingsChange={setNewAttemptOverlayDrawings}
                drawingData={newAttemptDrawing}
                drawingPages={newAttemptDrawingPages}
                onDrawingChange={setNewAttemptDrawing}
                onDrawingPagesChange={setNewAttemptDrawingPages}
                isEditing={true}
                defaultTab={newAttemptDefaultTab}
                currentDefaultTab={newAttemptDefaultTab}
                onSetDefaultTab={(tab) => setNewAttemptDefaultTab(tab)}
                labels={{
                  mdTab: '演练草稿',
                  pdfTab: '对应 PDF',
                  imagesTab: '演算纸照片',
                  drawingTab: '触控手绘板',
                  allTab: '四区平铺',
                  mdTitle: '做题过程与草稿演算 (Markdown)',
                  pdfTitle: '练习作答 PDF',
                  imagesTitle: '演算草稿照片与做题截图',
                  drawingTitle: '做题手绘演算板与笔迹批注'
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setIsAddingAttempt(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddAttemptSubmit}
                disabled={isSubmittingAttempt}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isSubmittingAttempt ? '保存中...' : '确认添加本次做题记录'}
              </button>
            </div>
          </div>
        )}

        {/* List of Attempts (Collapsed by default, click to open) */}
        {attempts.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              暂无后续做题复盘记录
            </h5>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              建议过 1~2 天后重做这道题，点击上方按钮创建「第 1 次做」分区，检验攻克成果！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((att) => (
              <AttemptCard
                key={att.id}
                attempt={att}
                isCollapsed={!expandedAttemptIds.has(att.id)}
                onToggleCollapse={() => handleToggleAttemptCollapse(att.id)}
                onUpdate={(fields) => handleUpdateAttempt(att.id, fields)}
                onDelete={() => handleDeleteAttempt(att.id)}
                onViewImage={onViewImage}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Git Version History & Conflict Rollback Modal */}
      <VersionHistoryModal
        question={question}
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        onRollbackSuccess={(restored) => {
          onUpdate(restored);
          setReflectionContent(restored.reflectionContent || '');
          setErrorCauses(restored.errorCauses || []);
        }}
      />
    </div>
  );
};
