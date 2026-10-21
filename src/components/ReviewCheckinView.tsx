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
  ArrowRight
} from 'lucide-react';
import { checkinService, CheckinData } from '../services/checkinService';
import { ThemeConfig } from '../services/settingsService';
import { Question } from '../types';

interface ReviewCheckinViewProps {
  currentTheme: ThemeConfig;
  reviewQuestions: Question[];
  onStartReview: () => void;
  onViewAllQuestions: () => void;
}

export const ReviewCheckinView: React.FC<ReviewCheckinViewProps> = ({
  currentTheme,
  reviewQuestions,
  onStartReview,
  onViewAllQuestions
}) => {
  const [checkinData, setCheckinData] = useState<CheckinData>(() => checkinService.getCheckinData());
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [justCheckedInAnim, setJustCheckedInAnim] = useState(false);

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
              <span>立即开始做题</span>
            </button>
          </div>
        </div>
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
    </div>
  );
};
