import { Question, Attempt, MasteryStatus } from '../types';
import { api } from '../api/client';
import { checkinService } from './checkinService';

export type ReviewTier = 'perfect' | 'good' | 'unfamiliar';

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
   * Apply review completion: updates question, adds review attempt log, and marks daily check-in
   */
  async completeReview(question: Question, tier: ReviewTier): Promise<{ updatedQuestion: Question; plan: NextReviewPlan }> {
    const currentStage = question.reviewStage !== undefined ? question.reviewStage : 0;
    const plan = this.calculatePlan(currentStage, tier);

    const newAttempt: Attempt = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: new Date().toISOString(),
      result: tier === 'perfect' ? 'correct' : tier === 'good' ? 'partial' : 'wrong',
      note: `【今日复盘】${REVIEW_TIERS[tier].label}：${plan.summary}`,
      timeSpentSeconds: 0,
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

    // Automatically check in for today's review
    try {
      checkinService.checkInToday();
    } catch (e) {
      console.warn('Checkin trigger failed:', e);
    }

    return { updatedQuestion, plan };
  }
};
