import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Sparkles, 
  PenTool, 
  BookOpen, 
  Flame, 
  Calendar as CalendarIcon, 
  Save, 
  Check, 
  Clock, 
  Trophy, 
  AlertCircle 
} from 'lucide-react';
import { Question, Folder, Attempt } from '../types';
import { reviewService, ReviewTier, REVIEW_TIERS, TodayReviewRecord } from '../services/reviewService';
import { checkinService } from '../services/checkinService';
import { ThemeConfig } from '../services/settingsService';
import { StopwatchTimer, formatTimerSeconds } from './StopwatchTimer';
import { marked } from 'marked';
import katex from 'katex';

interface ReviewSessionViewProps {
  currentTheme: ThemeConfig;
  questions: Question[];
  folders?: Folder[];
  onBack: () => void;
  onQuestionUpdated: (updated: Question) => void;
  onViewImage?: (url: string) => void;
}

export const ReviewSessionView: React.FC<ReviewSessionViewProps> = ({
  currentTheme,
  questions,
  folders = [],
  onBack,
  onQuestionUpdated,
  onViewImage
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptNote, setAttemptNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [celebrationModal, setCelebrationModal] = useState<{ show: boolean; dateStr: string } | null>(null);

  // Sync current question
  const safeIndex = questions.length > 0 ? Math.min(currentIndex, questions.length - 1) : 0;
  const currentQ = questions[safeIndex] || null;

  // Check today's review status for the current question
  const todayRecord: TodayReviewRecord | null = currentQ ? reviewService.isQuestionReviewedToday(currentQ.id) : null;
  const isReviewedToday = Boolean(todayRecord);

  // Make-up checkin status
  const makeUpStatus = reviewService.getMakeUpStatus();

  // Reset answer toggle & local note draft when switching questions
  useEffect(() => {
    setShowAnswer(false);
    if (todayRecord?.note) {
      setAttemptNote(todayRecord.note);
    } else {
      setAttemptNote('');
    }
  }, [currentIndex, currentQ?.id]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in textarea or input
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') return;

      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions.length]);

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

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3800);
  };

  // 1. Submit 3-tier rating
  const handleSelectTier = async (tier: ReviewTier) => {
    if (!currentQ || isSubmitting || isReviewedToday) return;
    setIsSubmitting(true);
    try {
      const { updatedQuestion, plan, makeUpAwarded } = await reviewService.completeReview(currentQ, tier, {
        note: attemptNote,
        timeSpentSeconds: elapsedSeconds
      });
      onQuestionUpdated(updatedQuestion);

      if (makeUpAwarded?.dateStr) {
        setCelebrationModal({ show: true, dateStr: makeUpAwarded.dateStr });
      } else {
        showToast(`已评定【${REVIEW_TIERS[tier].label}】：${plan.summary}`, 'success');
      }
    } catch (err) {
      console.error('Failed to submit review tier:', err);
      showToast('评级保存失败，请稍后重试', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Revert/Undo today's review
  const handleRevertTier = async () => {
    if (!currentQ || isSubmitting || !isReviewedToday) return;
    setIsSubmitting(true);
    try {
      const { updatedQuestion } = await reviewService.revertReview(currentQ);
      onQuestionUpdated(updatedQuestion);
      showToast('已撤销今日评级，您可以重新选择掌握程度', 'info');
    } catch (err) {
      console.error('Failed to revert review:', err);
      showToast('撤销评级失败，请稍后重试', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Save attempt note separately if user wants to update notes
  const handleSaveNoteDraft = async () => {
    if (!currentQ || isSubmitting) return;
    if (!attemptNote.trim()) {
      showToast('请先输入本次做题思路或反思心得', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      const newAttempt: Attempt = {
        id: 'att_note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        date: new Date().toISOString(),
        result: 'correct',
        note: `【做题反思记录】：${attemptNote.trim()}`,
        timeSpentSeconds: elapsedSeconds,
        defaultTab: 'md',
        images: [],
        drawingPages: ['']
      };
      const updatedAttempts = [...(currentQ.attempts || []), newAttempt];
      const updatedQ = { ...currentQ, attempts: updatedAttempts };
      onQuestionUpdated(updatedQ);
      showToast(`已成功保存做题记录（耗时 ${formatTimerSeconds(elapsedSeconds)}）`, 'success');
    } catch (e) {
      showToast('保存做题记录失败', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Trigger Make-Up
  const handleTriggerMakeUp = () => {
    const res = reviewService.triggerMakeUp();
    if (res.success && res.dateStr) {
      setCelebrationModal({ show: true, dateStr: res.dateStr });
    } else {
      showToast(res.message, 'info');
    }
  };

  const folderName = currentQ?.folderId 
    ? (folders.find(f => f.id === currentQ.folderId)?.name || '未分类科目') 
    : '全部科目';

  const currentStage = currentQ?.reviewStage ?? 0;
  const perfectPlan = currentQ ? reviewService.calculatePlan(currentStage, 'perfect') : null;
  const goodPlan = currentQ ? reviewService.calculatePlan(currentStage, 'good') : null;
  const unfamiliarPlan = currentQ ? reviewService.calculatePlan(currentStage, 'unfamiliar') : null;

  if (questions.length === 0 || !currentQ) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          今日暂无待复盘错题
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
          当前排期错题已全部达成今日目标，可以稍作休息或进入错题本浏览其他题目。
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow transition-all cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
        >
          返回今日复盘看板
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 sm:pb-16 px-3 sm:px-6 space-y-4 animate-fade-in select-none">
      {/* 1. Header Navigation & Stopwatch Timer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回看板</span>
          </button>

          <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px] sm:max-w-none">
            {folderName}
          </span>
        </div>

        {/* Center: Question Progress */}
        <div className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: currentTheme.primary }} 
          />
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
            第 {safeIndex + 1} / {questions.length} 题
          </span>
          {isReviewedToday && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              今日已评
            </span>
          )}
        </div>

        {/* Right: Stopwatch Timer */}
        <div className="flex items-center gap-2">
          <StopwatchTimer
            initialSeconds={0}
            onTimeChange={setElapsedSeconds}
            autoStart={true}
            themeColor={currentTheme.primary}
            label="复盘计时"
          />
        </div>
      </div>

      {/* 1.5 Double Quota Make-Up Notice Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:px-4 sm:py-2.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            今日已完成: <strong className="font-mono text-slate-900 dark:text-white">{makeUpStatus.todayCompletedCount}</strong> / {makeUpStatus.dailyQuota} 题
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            {makeUpStatus.isDoubleReached ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                已达成双倍目标 ({makeUpStatus.doubleQuota}题)！本月补卡资格已激活
              </span>
            ) : (
              <span>
                多做一倍达到 <strong className="font-mono text-slate-700 dark:text-slate-200">{makeUpStatus.doubleQuota}</strong> 题（还差 {makeUpStatus.remainingToDouble} 题）即可补一次本月打卡
              </span>
            )}
          </span>
        </div>

        {makeUpStatus.isDoubleReached && makeUpStatus.missedDatesThisMonth.length > 0 && !makeUpStatus.awardedDateStr && (
          <button
            type="button"
            onClick={handleTriggerMakeUp}
            className="px-3 py-1 rounded-xl text-xs font-bold text-white shadow-2xs hover:shadow transition-all cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>立即补打本月漏卡</span>
          </button>
        )}
      </div>

      {/* 2. Main Question Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        {/* Card Header: Quick Jump & Step Buttons */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {currentQ.title || '未命名错题'}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={safeIndex <= 0}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
              title="上一题 (← 快捷键)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={safeIndex >= questions.length - 1}
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-slate-600 dark:text-slate-300"
              title="下一题 (→ 快捷键)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Body: Content & Images */}
        <div className="space-y-3">
          {currentQ.contentType === 'image' && currentQ.content ? (
            <div 
              className="rounded-2xl overflow-hidden max-h-72 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 cursor-zoom-in"
              onClick={() => onViewImage?.(currentQ.content)}
            >
              <img src={currentQ.content} alt="题干原图" className="max-h-72 w-auto object-contain" />
            </div>
          ) : currentQ.content ? (
            <div 
              className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQ.content) }}
            />
          ) : (
            <p className="text-xs text-slate-400 italic">此题暂未输入文字题干。</p>
          )}

          {/* Question Attachment Images */}
          {currentQ.images && currentQ.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {currentQ.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  alt={`题干配图 ${i + 1}`} 
                  onClick={() => onViewImage?.(img)}
                  className="h-28 rounded-xl object-contain border border-slate-200 dark:border-slate-700 cursor-zoom-in hover:opacity-90"
                />
              ))}
            </div>
          )}
        </div>

        {/* 3. Standard Solution & Answer Accordion */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAnswer(prev => !prev)}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 py-1.5 cursor-pointer"
          >
            {showAnswer ? (
              <EyeOff className="w-4 h-4" style={{ color: currentTheme.primary }} />
            ) : (
              <Eye className="w-4 h-4" style={{ color: currentTheme.primary }} />
            )}
            <span>{showAnswer ? '隐藏标准解析与参考答案' : '查看标准解析与参考答案'}</span>
          </button>

          {showAnswer && (
            <div className="mt-2.5 p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-2.5 animate-fade-in">
              <span className="font-bold text-amber-800 dark:text-amber-300 block text-[11px] uppercase tracking-wider">
                💡 标准答案与思路解析:
              </span>
              {currentQ.answerMd || currentQ.answerContent ? (
                <div 
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQ.answerMd || currentQ.answerContent || '') }}
                />
              ) : currentQ.answerImages && currentQ.answerImages.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto">
                  {currentQ.answerImages.map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt="答案图" 
                      onClick={() => onViewImage?.(img)}
                      className="h-44 rounded-xl object-contain border border-amber-200 dark:border-amber-900 cursor-zoom-in" 
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">此题暂未录入标准解析。</p>
              )}
            </div>
          )}
        </div>

        {/* 4. Write Solving Process & Reflection (做题记录编写区) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-slate-500" />
              <span>编写做题记录与解题反思</span>
            </label>
            <span className="text-[11px] text-slate-400">
              当前用时: {formatTimerSeconds(elapsedSeconds)}
            </span>
          </div>

          <textarea
            rows={3}
            value={attemptNote}
            onChange={(e) => setAttemptNote(e.target.value)}
            placeholder="输入本次复盘的解题要点、卡壳处反思或错因总结（选择下方掌握程度时将自动归档入做题历程）..."
            className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-slate-100 resize-y transition-all"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveNoteDraft}
              disabled={isSubmitting || !attemptNote.trim()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>仅保存做题笔记</span>
            </button>
          </div>
        </div>

        {/* 5. 3-Tier Mastery Rating & Undo Re-selection (掌握程度选择与撤销重选) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>复习评级 · 一题一天限评一次</span>
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                系统将基于记忆曲线自动更新下次复盘日期；若选错，可随时点击“撤销重选”
              </span>
            </div>

            {/* If reviewed today: Show undo button */}
            {isReviewedToday && (
              <button
                type="button"
                onClick={handleRevertTier}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title="撤销今天的掌握程度评级，重新选择"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>撤销重选</span>
              </button>
            )}
          </div>

          {/* 3 Tier Buttons or Locked Status Banner */}
          {isReviewedToday && todayRecord ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">{REVIEW_TIERS[todayRecord.tier].icon}</span>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>今日已选：{REVIEW_TIERS[todayRecord.tier].label}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      已锁定
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    打卡已记录。如需调整掌握度，请点击上方“撤销重选”
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={safeIndex >= questions.length - 1}
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-40"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <span>下一题 →</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectTier('perfect')}
                className="p-3 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:shadow active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
                title={`完全掌握：${perfectPlan?.summary}`}
              >
                <div className="flex items-center gap-1">
                  <span>🌟 完全掌握</span>
                </div>
                <span className="text-[10px] opacity-90 font-mono mt-1">
                  {perfectPlan?.nextDays}天后复盘
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectTier('good')}
                className="p-3 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs hover:shadow active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
                title={`基本掌握：${goodPlan?.summary}`}
              >
                <div className="flex items-center gap-1">
                  <span>👍 基本掌握</span>
                </div>
                <span className="text-[10px] opacity-90 font-mono mt-1">
                  {goodPlan?.nextDays}天后巩固
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectTier('unfamiliar')}
                className="p-3 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs hover:shadow active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
                title={`不熟悉：${unfamiliarPlan?.summary}`}
              >
                <div className="flex items-center gap-1">
                  <span>🔄 不熟悉</span>
                </div>
                <span className="text-[10px] opacity-90 font-mono mt-1">
                  明天重点复查
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Quick Jump Indicator Pills */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
        {questions.map((q, idx) => {
          const rev = reviewService.isQuestionReviewedToday(q.id);
          const isCurrent = idx === safeIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-7 h-7 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                isCurrent
                  ? 'text-white shadow-xs ring-2 ring-offset-1'
                  : rev
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
              style={isCurrent ? { backgroundColor: currentTheme.primary, ringColor: currentTheme.primary } : {}}
              title={`第 ${idx + 1} 题 ${rev ? '(今日已评)' : '(待复盘)'}`}
            >
              {rev ? '✓' : idx + 1}
            </button>
          );
        })}
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white text-xs font-medium backdrop-blur-md shadow-lg border border-slate-700/60 flex items-center gap-2 animate-scale-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Celebration Modal for Make-Up Check-in */}
      {celebrationModal?.show && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setCelebrationModal(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                双倍复盘激励达成
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                🎉 成功补打本月漏卡！
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                您今日复盘题量已达到每日目标的 <strong>2 倍</strong>！系统已自动为您补齐本月 <strong>{celebrationModal.dateStr}</strong> 的复盘打卡，连续研习天数已延续！
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCelebrationModal(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow transition-all cursor-pointer"
              style={{ backgroundColor: currentTheme.primary }}
            >
              太棒了，继续学习
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
