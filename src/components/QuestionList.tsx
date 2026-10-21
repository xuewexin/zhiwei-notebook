import React from 'react';
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Tag, 
  BookOpen, 
  Image as ImageIcon, 
  Plus, 
  Layers,
  ArrowRight,
  TrendingUp,
  Flame
} from 'lucide-react';
import { Question, Folder, MasteryStatus } from '../types';
import { ThemeConfig, THEME_PALETTES } from '../services/settingsService';
import { reviewService } from '../services/reviewService';

interface QuestionListProps {
  questions: Question[];
  folders: Folder[];
  currentFolderId: string | null;
  onSelectQuestion: (question: Question) => void;
  onOpenCreateModal: () => void;
  onQuestionUpdated?: (updated: Question) => void;
  currentTheme?: ThemeConfig;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  folders,
  currentFolderId,
  onSelectQuestion,
  onOpenCreateModal,
  onQuestionUpdated,
  currentTheme = THEME_PALETTES.blue
}) => {
  const getFolderName = (fId: string) => {
    return folders.find(f => f.id === fId)?.name || '未分类';
  };

  const getFolderColor = (fId: string) => {
    return folders.find(f => f.id === fId)?.color || '#3b82f6';
  };

  const masteryMeta: Record<MasteryStatus, { label: string; badge: string; icon: React.ElementType }> = {
    unmastered: {
      label: '未掌握',
      badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
      icon: XCircle
    },
    reviewing: {
      label: '攻克中',
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      icon: AlertCircle
    },
    mastered: {
      label: '已掌握',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
      icon: CheckCircle2
    }
  };

  if (questions.length === 0) {
    return (
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 text-center border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner"
          style={{ backgroundColor: `${currentTheme.primary}18`, color: currentTheme.primary }}
        >
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
          当前分类下暂无错题
        </h3>
        <p className="text-[11px] text-slate-400 max-w-sm mx-auto mb-4">
          将做错的题目拍照或截图录入，记录写题心得，开启艾宾浩斯复盘彻底攻克！
        </p>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
        >
          <Plus className="w-4 h-4" />
          立即录入新错题
        </button>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm">
      {/* 模块顶部标题栏与界限分割 */}
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span 
            className="w-1.5 h-4.5 rounded-full shrink-0"
            style={{ backgroundColor: currentTheme.primary }}
          />
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            错题精选库
            <span 
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ color: currentTheme.primary, backgroundColor: `${currentTheme.primary}15` }}
            >
              共 {questions.length} 题
            </span>
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer border"
          style={{ 
            color: currentTheme.primary, 
            backgroundColor: `${currentTheme.primary}10`,
            borderColor: `${currentTheme.primary}25`
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>录题</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {questions.map((q) => {
          const meta = masteryMeta[q.mastery] || masteryMeta.unmastered;
          const StatusIcon = meta.icon;
          const attemptsCount = (q.attempts || []).length;
          const lastAttempt = attemptsCount > 0 ? q.attempts[attemptsCount - 1] : null;

          return (
            <div
              key={q.id}
              onClick={() => onSelectQuestion(q)}
              className="group cursor-pointer bg-slate-50/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs hover:shadow-notebook transition-all duration-200 flex flex-col justify-between active:scale-[0.99]"
              style={{ '--hover-color': currentTheme.primary } as any}
            >
              <div>
                {/* Top badges: Folder pill, Mastery status, Difficulty */}
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: getFolderColor(q.folderId) }}
                      />
                      <span className="truncate max-w-[85px] sm:max-w-none">{getFolderName(q.folderId)}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] sm:text-xs border font-medium ${meta.badge}`}>
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span>{meta.label}</span>
                    </span>

                    {/* Ebbinghaus Spaced Repetition Due Badge */}
                    {(!q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= Date.now() + 24 * 60 * 60 * 1000) ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
                        <Flame className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                        <span>待复习</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        下次: {new Date(q.nextReviewDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                          i < (q.difficulty || 3) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Question Title & Content Preview */}
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-relaxed mb-2">
                  {q.title || '未命名错题'}
                </h4>

                {/* Thumbnail if image or snippet if text */}
                {q.contentType === 'image' && q.content ? (
                  <div className="relative h-24 sm:h-28 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-700 mb-2.5">
                    <img
                      src={q.content}
                      alt="题目预览"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> 图片原题
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5 bg-white/80 dark:bg-slate-700/40 p-2 sm:p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    {q.content || '暂无详细题干'}
                  </p>
                )}
              </div>

                {/* Quick 3-Tier Review Action Bar on Card when due for review */}
                {(!q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= Date.now() + 24 * 60 * 60 * 1000) && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mb-2.5 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span>今日复习完成打卡:</span>
                      <span className="text-[9px] text-slate-400 font-normal">点击依曲线自动排期</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const { updatedQuestion } = await reviewService.completeReview(q, 'perfect');
                          onQuestionUpdated?.(updatedQuestion);
                        }}
                        className="py-1 px-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-center cursor-pointer active:scale-95 transition-all shadow-2xs"
                        title="完全掌握：进入下一周期，延长复盘时间"
                      >
                        完全掌握
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const { updatedQuestion } = await reviewService.completeReview(q, 'good');
                          onQuestionUpdated?.(updatedQuestion);
                        }}
                        className="py-1 px-1 rounded-lg text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white text-center cursor-pointer active:scale-95 transition-all shadow-2xs"
                        title="基本掌握：维持当前阶段继续巩固"
                      >
                        基本掌握
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const { updatedQuestion } = await reviewService.completeReview(q, 'unfamiliar');
                          onQuestionUpdated?.(updatedQuestion);
                        }}
                        className="py-1 px-1 rounded-lg text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white text-center cursor-pointer active:scale-95 transition-all shadow-2xs"
                        title="不熟悉：重置回第一阶段，明天重点复查"
                      >
                        不熟悉
                      </button>
                    </div>
                  </div>
                )}

              {/* Bottom footer: Attempts status & Tags */}
              <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {attemptsCount === 0 ? '待练习' : `${attemptsCount} 次练习`}
                  </span>

                  {lastAttempt && (
                    <span className="text-[10px] text-slate-400">
                      ({lastAttempt.result === 'correct' ? '✓ 正确' : '✕ 待巩固'})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                  <span>详情</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
