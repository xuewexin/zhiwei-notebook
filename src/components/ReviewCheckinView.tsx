import React, { useState } from 'react';
import { 
  Flame, 
  Trophy, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Brain, 
  Sparkles,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  ExternalLink,
  ImageIcon,
  Sliders,
  X
} from 'lucide-react';
import { checkinService, CheckinData } from '../services/checkinService';
import { reviewService, ReviewTier, REVIEW_TIERS, ReviewSettings, DEFAULT_REVIEW_SETTINGS } from '../services/reviewService';
import { ThemeConfig } from '../services/settingsService';
import { Question, Folder } from '../types';
import { marked } from 'marked';
import katex from 'katex';

interface ReviewCheckinViewProps {
  currentTheme: ThemeConfig;
  reviewQuestions: Question[];
  folders?: Folder[];
  allQuestions?: Question[];
  onStartReview: () => void;
  onViewAllQuestions: () => void;
  onQuestionUpdated?: (updated: Question) => void;
  onSelectQuestion?: (question: Question) => void;
  onSettingsChange?: (settings: ReviewSettings) => void;
}

export const ReviewCheckinView: React.FC<ReviewCheckinViewProps> = ({
  currentTheme,
  reviewQuestions,
  folders = [],
  allQuestions = [],
  onStartReview,
  onViewAllQuestions,
  onQuestionUpdated,
  onSelectQuestion,
  onSettingsChange
}) => {
  const [checkinData, setCheckinData] = useState<CheckinData>(() => checkinService.getCheckinData());
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [justCheckedInAnim, setJustCheckedInAnim] = useState(false);
  const [makeupNotice, setMakeupNotice] = useState<string | null>(null);

  // Review Scope & Daily Quota Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ReviewSettings>(() => reviewService.getReviewSettings());
  const [tempQuota, setTempQuota] = useState(settings.dailyQuota);
  const [tempScope, setTempScope] = useState<'all' | 'custom'>(settings.folderScope);
  const [tempFolderIds, setTempFolderIds] = useState<string[]>(settings.selectedFolderIds);

  const makeUpStatus = reviewService.getMakeUpStatus();

  const handleOpenSettings = () => {
    setTempQuota(settings.dailyQuota);
    setTempScope(settings.folderScope);
    setTempFolderIds(settings.selectedFolderIds);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    const updated = reviewService.saveReviewSettings({
      dailyQuota: Math.max(1, Number(tempQuota) || 5),
      folderScope: tempScope,
      selectedFolderIds: tempFolderIds
    });
    setSettings(updated);
    setIsSettingsOpen(false);
    onSettingsChange?.(updated);
  };

  const handleResetSettings = () => {
    setTempQuota(DEFAULT_REVIEW_SETTINGS.dailyQuota);
    setTempScope(DEFAULT_REVIEW_SETTINGS.folderScope);
    setTempFolderIds([]);
  };

  const handleTriggerMakeUp = () => {
    const res = reviewService.triggerMakeUp();
    if (res.success && res.dateStr) {
      setCheckinData(checkinService.getCheckinData());
      setMakeupNotice(res.message);
      setTimeout(() => setMakeupNotice(null), 5000);
    } else {
      setMakeupNotice(res.message);
      setTimeout(() => setMakeupNotice(null), 4000);
    }
  };

  const getScopeLabel = () => {
    if (settings.folderScope === 'all') {
      return '全部科目 (不区分文件夹)';
    }
    if (settings.selectedFolderIds.length === 0) {
      return '未选科目 (默认全题库)';
    }
    if (settings.selectedFolderIds.length === 1) {
      const f = folders.find(item => item.id === settings.selectedFolderIds[0]);
      return `固定: ${f ? f.name : '指定科目'}`;
    }
    const matchedNames = folders.filter(f => settings.selectedFolderIds.includes(f.id)).map(f => f.name);
    return `已选 ${settings.selectedFolderIds.length} 个科目: ${matchedNames.slice(0, 2).join('、')}${settings.selectedFolderIds.length > 2 ? '等' : ''}`;
  };

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const cells = checkinService.getMonthCalendarGrid(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleResetToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const handleCheckIn = () => {
    const updated = checkinService.checkInToday();
    setCheckinData(updated);
    setJustCheckedInAnim(true);
    setTimeout(() => setJustCheckedInAnim(false), 2000);
  };

  const weekHeaders = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* 1. Top Review & Streak Banner - Pure Solid Color, No Gradient */}
      <div 
        className="text-white p-5 sm:p-6 rounded-3xl shadow-sm relative overflow-hidden"
        style={{ backgroundColor: currentTheme.primary }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                  Ebbinghaus Mastery
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/25 rounded-md text-white">
                  今日复盘
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                艾宾浩斯复盘计划
                <span className="text-xs font-normal text-white/90">
                  (待攻克 {reviewQuestions.length} 题)
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleOpenSettings}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all cursor-pointer backdrop-blur-xs border border-white/25 shadow-2xs active:scale-95"
                  title="点击自定义每日复盘题目数量与出处分类"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>每日计划: {settings.dailyQuota} 题</span>
                  <span className="opacity-60">•</span>
                  <span>出处: {getScopeLabel()}</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-md bg-white/25 font-bold">设置</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onViewAllQuestions}
              className="px-3.5 py-2 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer"
            >
              全部错题
            </button>
            <button
              type="button"
              onClick={onStartReview}
              className="px-5 py-2 text-xs font-bold bg-white text-slate-800 hover:bg-slate-100 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <BookOpen className="w-4 h-4" style={{ color: currentTheme.primary }} />
              <span>开始今日复盘</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.5. Daily Review Goal & Double Make-Up Progress Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${currentTheme.primary}18`, color: currentTheme.primary }}
            >
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>今日复盘进度与打卡激励</span>
                {makeUpStatus.isDoubleReached && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    双倍目标达成
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                每日计划目标 {makeUpStatus.dailyQuota} 题 · 多做一倍达到 {makeUpStatus.doubleQuota} 题可补打一次本月漏卡
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {makeUpStatus.isDoubleReached && makeUpStatus.missedDatesThisMonth.length > 0 && (
              <button
                type="button"
                onClick={handleTriggerMakeUp}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>立即补打本月漏卡</span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartReview}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <BookOpen className="w-4 h-4" />
              <span>{makeUpStatus.todayCompletedCount > 0 ? '继续复盘刷题' : '开始今日复盘'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Metric Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              今日已复盘 <strong className="font-mono text-slate-900 dark:text-white">{makeUpStatus.todayCompletedCount}</strong> 题
            </span>
            <span className="text-[11px] text-slate-400">
              {makeUpStatus.isDoubleReached ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ 已解锁双倍补卡资格
                </span>
              ) : (
                <span>
                  距双倍补卡还需复盘 <strong className="font-mono text-slate-700 dark:text-slate-300">{makeUpStatus.remainingToDouble}</strong> 题
                </span>
              )}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className="h-full transition-all duration-500 rounded-full"
              style={{ 
                backgroundColor: currentTheme.primary,
                width: `${Math.min(100, (makeUpStatus.todayCompletedCount / Math.max(1, makeUpStatus.doubleQuota)) * 100)}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>起点 (0题)</span>
            <span className="text-center">每日目标 ({makeUpStatus.dailyQuota}题)</span>
            <span className="text-right">双倍补卡目标 ({makeUpStatus.doubleQuota}题)</span>
          </div>
        </div>

        {/* Feedback message for makeup check-in */}
        {makeupNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{makeupNotice}</span>
          </div>
        )}
      </div>

      {/* 2. Streak Counter & Check-in Control Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Consecutive Days */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${currentTheme.primary}18`, color: currentTheme.primary }}
          >
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">连续打卡复盘</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono flex items-baseline gap-1">
              {checkinData.currentStreak}
              <span className="text-xs font-bold text-slate-500">天</span>
            </div>
          </div>
        </div>

        {/* Max Streak Record */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">历史最长连击</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono flex items-baseline gap-1">
              {checkinData.maxStreak}
              <span className="text-xs font-bold text-slate-500">天</span>
            </div>
          </div>
        </div>

        {/* Total Days & One-click Checkin */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400">累计研习天数</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono flex items-baseline gap-1">
              {checkinData.totalDays}
              <span className="text-xs font-bold text-slate-500">天</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckIn}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              checkinData.isTodayCheckedIn
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'text-white hover:opacity-90 active:scale-95'
            }`}
            style={!checkinData.isTodayCheckedIn ? { backgroundColor: currentTheme.primary } : {}}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{checkinData.isTodayCheckedIn ? '今日已打卡' : '完成今日打卡'}</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive Monthly Check-in Calendar Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        {/* Calendar Month Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              {year} 年 {month + 1} 月复盘打卡日历
            </h3>
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 cursor-pointer font-medium"
            >
              本月
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="上个月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="下个月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Row */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
          {weekHeaders.map((w, idx) => (
            <div key={idx} className="py-1">周{w}</div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((cell) => {
            const isThemeActive = cell.isCheckedIn;
            return (
              <div
                key={cell.dateStr}
                className={`relative min-h-[46px] sm:min-h-[58px] p-1.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                  cell.isCurrentMonth
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200'
                    : 'bg-transparent text-slate-300 dark:text-slate-700 opacity-60'
                } ${
                  cell.isToday
                    ? 'ring-2 font-bold'
                    : ''
                }`}
                style={cell.isToday ? { ringColor: currentTheme.primary } : {}}
              >
                {/* Day Number */}
                <span className={`text-xs sm:text-sm font-mono ${
                  cell.isToday ? 'font-black' : 'font-medium'
                }`}>
                  {cell.dayNumber}
                </span>

                {/* Checkin Status Indicator */}
                <div className="mt-1">
                  {cell.isCheckedIn ? (
                    <span 
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full text-white flex items-center justify-center text-[10px] shadow-2xs font-bold"
                      style={{ backgroundColor: currentTheme.primary }}
                      title={`已于 ${cell.dateStr} 复盘打卡`}
                    >
                      ✓
                    </span>
                  ) : cell.isToday ? (
                    <span 
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: currentTheme.primary }}
                      title="今日待打卡"
                    />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Footer Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full text-white text-[8px] flex items-center justify-center" style={{ backgroundColor: currentTheme.primary }}>✓</span>
              已打卡
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-400" />
              今日待打卡
            </span>
          </div>

          <span className="hidden sm:inline italic">
            博观而约取，厚积而薄发 · 每日复盘是卓越的阶梯
          </span>
        </div>
      </div>

      {/* Review Settings Modal */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-in my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    每日复盘个性化设置
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    系统将依据记忆遗忘曲线与紧迫度智能排序抽题
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: 每日复盘题目数量 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>1. 每日复盘题目数量（目标上限）</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  当前设定: {tempQuota} 题
                </span>
              </div>
              
              {/* Presets */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[3, 5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTempQuota(num)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      tempQuota === num
                        ? 'text-white border-transparent shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                    style={tempQuota === num ? { backgroundColor: currentTheme.primary } : {}}
                  >
                    {num} 题
                    {num === 5 && <span className="block text-[9px] font-normal opacity-85">默认</span>}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500">自定义题数:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tempQuota}
                  onChange={(e) => setTempQuota(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2.5 py-1 text-xs text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
                <span className="text-[11px] text-slate-400">道题 / 每天（系统按遗忘衰减程度截取前 {tempQuota} 道）</span>
              </div>
            </div>

            {/* Section 2: 题目出处（文件夹范围） */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                2. 题目出处与科目范围
              </label>

              {/* Scope Radio 1: All Folders */}
              <div 
                onClick={() => setTempScope('all')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  tempScope === 'all'
                    ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60'
                }`}
              >
                <input 
                  type="radio" 
                  name="review_scope" 
                  checked={tempScope === 'all'} 
                  onChange={() => setTempScope('all')} 
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>不区分文件夹（全部科目 · 默认）</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">推荐</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    跨越全部学科，系统严格按全题库的艾宾浩斯记忆遗忘紧迫度综合排序抽取题目，不偏科、遗忘阻断最高效。
                  </p>
                </div>
              </div>

              {/* Scope Radio 2: Custom Folders */}
              <div 
                onClick={() => setTempScope('custom')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  tempScope === 'custom'
                    ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60'
                }`}
              >
                <input 
                  type="radio" 
                  name="review_scope" 
                  checked={tempScope === 'custom'} 
                  onChange={() => setTempScope('custom')} 
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    指定科目与文件夹（可固定单个，也可多选组合）
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    仅从您勾选的指定分类中，依据记忆遗忘曲线排序抽题进行每日复盘。
                  </p>
                </div>
              </div>

              {/* Folder Multi-select Matrix (Visible when custom scope is active) */}
              {tempScope === 'custom' && (
                <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 rounded-2xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      请勾选复盘科目（已选 {tempFolderIds.length} 个）:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTempFolderIds(folders?.map(f => f.id) || []);
                        }}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                      >
                        全选
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTempFolderIds([]);
                        }}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        清空
                      </button>
                    </div>
                  </div>

                  {folders && folders.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                      {folders.map(f => {
                        const isSelected = tempFolderIds.includes(f.id);
                        const qCount = allQuestions ? allQuestions.filter(q => q.folderId === f.id).length : 0;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTempFolderIds(prev => 
                                isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id]
                              );
                            }}
                            className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-2xs font-bold text-slate-900 dark:text-white'
                                : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0" 
                                style={{ backgroundColor: f.color || '#3b82f6' }} 
                              />
                              <span className="truncate">{f.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {qCount}题
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2 text-center">暂无文件夹分类</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetSettings}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                恢复默认 (5题/全部科目)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  保存并应用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
