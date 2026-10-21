import { Question, Attempt, MasteryStatus } from '../types';
import { api } from '../api/client';
import { checkinService, formatDateKey } from './checkinService';

export type ReviewTier = 'perfect' | 'good' | 'unfamiliar';

export interface TodayReviewRecord {
  questionId: string;
  tier: ReviewTier;
  reviewedAt: string;
  timeSpentSeconds?: number;
  note?: string;
  previousState: {
    reviewStage?: number;
    lastReviewDate?: string;
    nextReviewDate?: string;
    mastery: MasteryStatus;
  };
  attemptId: string;
}

const getTodayReviewStorageKey = () => `zhiwei_today_reviews_${formatDateKey(new Date())}`;
const getTodayMakeUpStorageKey = () => `zhiwei_makeup_awarded_${formatDateKey(new Date())}`;

export interface ReviewTierMeta {
  tier: ReviewTier;
  label: string;
  shortLabel: string;
  icon: string;
  colorClass: string;
  badgeClass: string;
  description: string;
}

export const REVIEW_TIERS: Record<ReviewTier, ReviewTierMeta> = {
  perfect: {
    tier: 'perfect',
    label: '完全掌握',
    shortLabel: '已掌握',
    icon: '🌟',
    colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: '记忆牢固，周期进阶，延长复盘间隔'
  },
  good: {
    tier: 'good',
    label: '基本掌握',
    shortLabel: '攻关中',
    icon: '👍',
    colorClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
    description: '基本做对或思路清晰，维持当前周期巩固'
  },
  unfamiliar: {
    tier: 'unfamiliar',
    label: '不熟悉',
    shortLabel: '未掌握',
    icon: '🔄',
    colorClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
    description: '遗忘或做错，重置回初级阶段，明天重新复查'
  }
};

export const EBBINGHAUS_DAYS = [1, 2, 4, 7, 15, 30];

export interface NextReviewPlan {
  tier: ReviewTier;
  nextStage: number;
  nextDays: number;
  nextReviewDate: string;
  nextReviewDateFormatted: string;
  mastery: MasteryStatus;
  summary: string;
}

export interface ReviewSettings {
  dailyQuota: number; // 每日复盘题目数量，默认 5
  folderScope: 'all' | 'custom'; // 'all' (不区分文件夹，默认) | 'custom' (指定文件夹)
  selectedFolderIds: string[]; // 当 folderScope === 'custom' 时选中的文件夹 ID 列表，支持单个或多个
}

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  dailyQuota: 5,
  folderScope: 'all',
  selectedFolderIds: []
};

const REVIEW_SETTINGS_KEY = 'zhiwei_review_settings';

export const reviewService = {
  /**
   * Preview or calculate the next review plan for a given question and tier without committing
   */
  calculatePlan(currentStage: number = 0, tier: ReviewTier): NextReviewPlan {
    let nextStage = currentStage;
    let nextDays = 1;
    let mastery: MasteryStatus = 'reviewing';
    let summary = '';

    if (tier === 'perfect') {
      nextStage = Math.min(currentStage + 1, EBBINGHAUS_DAYS.length - 1);
      nextDays = EBBINGHAUS_DAYS[nextStage];
      mastery = nextStage >= 4 ? 'mastered' : 'reviewing';
      summary = `完全掌握！进阶至第 ${nextStage + 1} 周期，下次复盘在 ${nextDays} 天后`;
    } else if (tier === 'good') {
      nextStage = currentStage;
      if (currentStage === 0) {
        nextDays = 2;
      } else {
        nextDays = Math.max(2, Math.round(EBBINGHAUS_DAYS[currentStage] * 0.75));
      }
      mastery = 'reviewing';
      summary = `基本掌握！维持第 ${nextStage + 1} 周期巩固，下次复盘在 ${nextDays} 天后`;
    } else {
      nextStage = 0;
      nextDays = 1;
      mastery = 'unmastered';
      summary = `不熟悉！已重置回初级记忆周期，系统将于明天（1天后）安排重点复查`;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextDays);
    const dateFormatted = nextDate.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short'
    });

    return {
      tier,
      nextStage,
      nextDays,
      nextReviewDate: nextDate.toISOString(),
      nextReviewDateFormatted: dateFormatted,
      mastery,
      summary
    };
  },

  /**
   * Get all review records completed today
   */
  getTodayReviews(): Record<string, TodayReviewRecord> {
    try {
      const raw = localStorage.getItem(getTodayReviewStorageKey());
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  /**
   * Check if a specific question has already been reviewed today
   */
  isQuestionReviewedToday(questionId: string): TodayReviewRecord | null {
    const reviews = this.getTodayReviews();
    return reviews[questionId] || null;
  },

  /**
   * Get total number of distinct questions reviewed today
   */
  getTodayCompletedCount(): number {
    return Object.keys(this.getTodayReviews()).length;
  },

  /**
   * Calculate remaining review quota count for today
   * Drops by 1 for each completed question, down to 0 minimum
   */
  getRemainingDueCount(dailyReviewQuestions: Question[]): number {
    const reviews = this.getTodayReviews();
    const uncompleted = dailyReviewQuestions.filter(q => !reviews[q.id]);
    return uncompleted.length;
  },

  /**
   * Get double-quota make-up checkin status
   */
  getMakeUpStatus(): {
    dailyQuota: number;
    doubleQuota: number;
    todayCompletedCount: number;
    isDoubleReached: boolean;
    remainingToDouble: number;
    awardedDateStr: string | null;
    missedDatesThisMonth: string[];
  } {
    const settings = this.getReviewSettings();
    const dailyQuota = Math.max(1, settings.dailyQuota || 5);
    const doubleQuota = dailyQuota * 2;
    const todayCompletedCount = this.getTodayCompletedCount();
    const isDoubleReached = todayCompletedCount >= doubleQuota;
    const remainingToDouble = Math.max(0, doubleQuota - todayCompletedCount);
    const awardedDateStr = localStorage.getItem(getTodayMakeUpStorageKey());
    const missedDatesThisMonth = checkinService.getMissedDatesThisMonth();
    return {
      dailyQuota,
      doubleQuota,
      todayCompletedCount,
      isDoubleReached,
      remainingToDouble,
      awardedDateStr,
      missedDatesThisMonth
    };
  },

  /**
   * Trigger make-up checkin manually if double target reached
   */
  triggerMakeUp(): { success: boolean; dateStr?: string; message: string } {
    const status = this.getMakeUpStatus();
    if (!status.isDoubleReached) {
      return {
        success: false,
        message: `还需再复盘 ${status.remainingToDouble} 道题，即可解锁双倍补打卡！`
      };
    }
    const res = checkinService.autoMakeUpOldestMissedThisMonth();
    if (res.success && res.dateStr) {
      localStorage.setItem(getTodayMakeUpStorageKey(), res.dateStr);
      return {
        success: true,
        dateStr: res.dateStr,
        message: `恭喜达成双倍复盘！已成功为您补打本月 ${res.dateStr} 的打卡！`
      };
    } else {
      return {
        success: false,
        message: '本月暂无漏打卡日期，您太勤奋了！'
      };
    }
  },

  /**
   * Apply review completion: updates question, records attempt, locks today review, and triggers check-in/make-up
   */
  async completeReview(
    question: Question, 
    tier: ReviewTier, 
    options?: { note?: string; timeSpentSeconds?: number }
  ): Promise<{ 
    updatedQuestion: Question; 
    plan: NextReviewPlan; 
    makeUpAwarded?: { dateStr: string } | null 
  }> {
    const currentStage = question.reviewStage !== undefined ? question.reviewStage : 0;
    const plan = this.calculatePlan(currentStage, tier);

    // Save snapshot of question state before this review for undo/revert support
    const previousState = {
      reviewStage: question.reviewStage,
      lastReviewDate: question.lastReviewDate,
      nextReviewDate: question.nextReviewDate,
      mastery: question.mastery
    };

    const attemptId = 'att_rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const noteText = options?.note?.trim() ? `\n【复盘做题笔记/思考反思】：\n${options.note.trim()}` : '';

    const newAttempt: Attempt = {
      id: attemptId,
      date: new Date().toISOString(),
      result: tier === 'perfect' ? 'correct' : tier === 'good' ? 'partial' : 'wrong',
      note: `【今日复盘】${REVIEW_TIERS[tier].label}：${plan.summary}${noteText}`,
      timeSpentSeconds: options?.timeSpentSeconds || 0,
      defaultTab: 'md',
      images: [],
      drawingPages: ['']
    };

    const updatedAttempts = [...(question.attempts || []), newAttempt];

    const updatedQuestion = await api.updateQuestion(question.id, {
      reviewStage: plan.nextStage,
      lastReviewDate: new Date().toISOString(),
      nextReviewDate: plan.nextReviewDate,
      mastery: plan.mastery,
      attempts: updatedAttempts
    });

    // Record today's review log for single-selection & undo mechanism
    try {
      const reviews = this.getTodayReviews();
      reviews[question.id] = {
        questionId: question.id,
        tier,
        reviewedAt: new Date().toISOString(),
        timeSpentSeconds: options?.timeSpentSeconds || 0,
        note: options?.note,
        previousState,
        attemptId
      };
      localStorage.setItem(getTodayReviewStorageKey(), JSON.stringify(reviews));
    } catch (e) {
      console.warn('Failed to save today review record:', e);
    }

    // Automatically check in for today's review
    try {
      checkinService.checkInToday();
    } catch (e) {
      console.warn('Checkin trigger failed:', e);
    }

    // Check double-quota rule for make-up checkin (多做一倍每日题目数量的题就可以补一次打卡，不过是本月补卡)
    let makeUpAwarded: { dateStr: string } | null = null;
    try {
      const settings = this.getReviewSettings();
      const doubleQuota = Math.max(2, (settings.dailyQuota || 5) * 2);
      const completedToday = this.getTodayCompletedCount();

      if (completedToday >= doubleQuota) {
        const alreadyAwarded = localStorage.getItem(getTodayMakeUpStorageKey());
        if (!alreadyAwarded) {
          const res = checkinService.autoMakeUpOldestMissedThisMonth();
          if (res.success && res.dateStr) {
            localStorage.setItem(getTodayMakeUpStorageKey(), res.dateStr);
            makeUpAwarded = { dateStr: res.dateStr };
          }
        }
      }
    } catch (e) {
      console.warn('Make-up checkin auto calculation error:', e);
    }

    return { updatedQuestion, plan, makeUpAwarded };
  },

  /**
   * Revert/Undo today's review selection for a question (一题一天只能选一次掌握程度，可以撤销重选)
   */
  async revertReview(question: Question): Promise<{ updatedQuestion: Question }> {
    const reviews = this.getTodayReviews();
    const record = reviews[question.id];

    if (!record) {
      return { updatedQuestion: question };
    }

    // Restore previous stage, dates, mastery and remove the review attempt
    const updatedAttempts = (question.attempts || []).filter(a => a.id !== record.attemptId);

    const updatedQuestion = await api.updateQuestion(question.id, {
      reviewStage: record.previousState.reviewStage ?? 0,
      lastReviewDate: record.previousState.lastReviewDate,
      nextReviewDate: record.previousState.nextReviewDate,
      mastery: record.previousState.mastery,
      attempts: updatedAttempts
    });

    // Remove from today review registry
    delete reviews[question.id];
    try {
      localStorage.setItem(getTodayReviewStorageKey(), JSON.stringify(reviews));
    } catch (e) {
      console.warn('Failed to delete today review record:', e);
    }

    return { updatedQuestion };
  },

  /**
   * Get user's review configuration (daily quota, folder scope, etc.)
   */
  getReviewSettings(): ReviewSettings {
    try {
      const raw = localStorage.getItem(REVIEW_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          dailyQuota: typeof parsed.dailyQuota === 'number' && parsed.dailyQuota > 0 ? parsed.dailyQuota : DEFAULT_REVIEW_SETTINGS.dailyQuota,
          folderScope: parsed.folderScope === 'custom' ? 'custom' : 'all',
          selectedFolderIds: Array.isArray(parsed.selectedFolderIds) ? parsed.selectedFolderIds : []
        };
      }
    } catch (e) {
      console.warn('Failed to read review settings:', e);
    }
    return { ...DEFAULT_REVIEW_SETTINGS };
  },

  /**
   * Persist user's review configuration
   */
  saveReviewSettings(settings: Partial<ReviewSettings>): ReviewSettings {
    const current = this.getReviewSettings();
    const updated: ReviewSettings = {
      ...current,
      ...settings,
      dailyQuota: typeof settings.dailyQuota === 'number' && settings.dailyQuota > 0 ? settings.dailyQuota : current.dailyQuota,
      folderScope: settings.folderScope || current.folderScope,
      selectedFolderIds: Array.isArray(settings.selectedFolderIds) ? settings.selectedFolderIds : current.selectedFolderIds
    };
    try {
      localStorage.setItem(REVIEW_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save review settings:', e);
    }
    return updated;
  },

  /**
   * Filter and sort questions according to Ebbinghaus memory curve and user settings
   * - Folders: All (不区分文件夹) or Custom (多个或单个固定分类)
   * - Memory curve sorting:
   *   1. Overdue/due questions come first, with the most overdue (earliest nextReviewDate) first
   *   2. Fragile memories (lower reviewStage, unmastered) take priority
   *   3. Upcoming questions sorted by upcoming review timestamp
   * - Limited to daily quota (default: 5)
   */
  getDailyReviewQuestions(allQuestions: Question[], customSettings?: ReviewSettings): {
    reviewQuestions: Question[];
    candidateCount: number;
    settings: ReviewSettings;
  } {
    const settings = customSettings || this.getReviewSettings();
    const reviews = this.getTodayReviews();

    // 1. Filter by folder scope
    let candidates = allQuestions;
    if (settings.folderScope === 'custom' && settings.selectedFolderIds.length > 0) {
      candidates = candidates.filter(q => settings.selectedFolderIds.includes(q.folderId));
    }

    // 2. Sort by Ebbinghaus memory curve urgency & today review status
    const now = Date.now();
    const tomorrow = now + 24 * 60 * 60 * 1000;

    const sorted = [...candidates].sort((a, b) => {
      const aReviewed = Boolean(reviews[a.id]);
      const bReviewed = Boolean(reviews[b.id]);

      // Unreviewed questions for today take precedence so user sees what is remaining first
      if (!aReviewed && bReviewed) return -1;
      if (aReviewed && !bReviewed) return 1;

      const aNext = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
      const bNext = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;

      const aIsDue = aNext <= tomorrow;
      const bIsDue = bNext <= tomorrow;

      // Rule 1: Due / Overdue questions always take priority over future scheduled questions
      if (aIsDue && !bIsDue) return -1;
      if (!aIsDue && bIsDue) return 1;

      // Rule 2: Both are due/overdue -> Earliest due date (longest overdue) comes first
      if (aIsDue && bIsDue) {
        if (aNext !== bNext) return aNext - bNext;
        // If equal, lower review stage (more fragile memory) comes first
        const aStage = a.reviewStage ?? 0;
        const bStage = b.reviewStage ?? 0;
        if (aStage !== bStage) return aStage - bStage;
        // Unmastered before reviewing before mastered
        const masteryWeight: Record<MasteryStatus, number> = { unmastered: 0, reviewing: 1, mastered: 2 };
        return (masteryWeight[a.mastery] ?? 1) - (masteryWeight[b.mastery] ?? 1);
      }

      // Rule 3: Both are future scheduled questions -> Soonest nextReviewDate first
      if (aNext !== bNext) return aNext - bNext;
      return (a.reviewStage ?? 0) - (b.reviewStage ?? 0);
    });

    const quota = Math.max(1, settings.dailyQuota || 5);
    const todayReviewedCount = Object.keys(reviews).length;
    // Ensure all already-reviewed questions today are included, plus enough unreviewed candidates to satisfy the daily quota
    const finalLimit = Math.max(quota, todayReviewedCount + quota);
    const reviewQuestions = sorted.slice(0, Math.min(sorted.length, finalLimit));

    return {
      reviewQuestions,
      candidateCount: sorted.length,
      settings
    };
  }
};
