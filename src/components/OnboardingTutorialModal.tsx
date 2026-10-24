import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FolderPlus, 
  Camera, 
  Timer, 
  Calendar, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Flame, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { ThemeConfig } from '../services/settingsService';

export const ONBOARDING_STORAGE_KEY = 'zhiwei_onboarding_completed_v1';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: ThemeConfig;
}

interface SlideItem {
  id: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  points: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
  }[];
}

const SLIDES: SlideItem[] = [
  {
    id: 'slide-hierarchy',
    badge: '极简学科体系 · 自由分类',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-600 dark:text-blue-400',
    title: '建立您的专属学科错题本',
    subtitle: '告别厚重试卷与凌乱剪贴。像 GoodNotes 一样创建多层级科目分类，让错题井然有序。',
    image: '/tutorial/slide-1-hierarchy.png',
    imageAlt: '知微错题学科分类视图',
    points: [
      {
        icon: FolderPlus,
        title: '自由创建学科',
        desc: '支持自定义纯色主题标签与科学图标，科目分类清晰明了'
      },
      {
        icon: Layers,
        title: '树形层级管理',
        desc: '支持母科目与子章节嵌套，快速按章节检索归纳错题'
      },
      {
        icon: ShieldCheck,
        title: '100% 本地优先',
        desc: '数据本地秒级读写，零预置杂项，开箱即是纯净空间'
      }
    ]
  },
  {
    id: 'slide-editor',
    badge: '多模态排版 · 深度反思',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    title: '拍照录题，研习解题精髓',
    subtitle: '支持手机拍照截取原题、LaTeX 绝美数学公式与代码高亮，记录每次卡壳错因。',
    image: '/tutorial/slide-2-editor.png',
    imageAlt: '错题精细排版与解析视图',
    points: [
      {
        icon: Camera,
        title: '拍照快速裁剪',
        desc: '手机端一键唤起相机扫题裁剪，原题原貌高清入库'
      },
      {
        icon: BookOpen,
        title: 'LaTeX 与公式排版',
        desc: '支持 KaTeX 数学公式与 Markdown 代码高亮混排'
      },
      {
        icon: Zap,
        title: '错因深度反思',
        desc: '记录卡壳突破点与考点警示，标准答案折叠防剧透'
      }
    ]
  },
  {
    id: 'slide-review',
    badge: '独立沉浸复盘 · 做题秒表',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    title: '抗遗忘复盘，做题秒表计时',
    subtitle: '点击「开始今日复盘」进入纯粹独立工作台，微型秒表精准记录做题耗时。',
    image: '/tutorial/slide-3-review.png',
    imageAlt: '沉浸复盘与做题计时视图',
    points: [
      {
        icon: Sparkles,
        title: '全新沉浸式刷题',
        desc: '左右无缝翻页切题，沉浸专注推导，无额外杂念'
      },
      {
        icon: Timer,
        title: '微型做题秒表',
        desc: '一键计时/暂停/归零，做题记录自动带入用时秒数'
      },
      {
        icon: CheckCircle2,
        title: '三档评级与随心撤销',
        desc: '一题一天限评一次防手滑误触，并支持随时撤销重选'
      }
    ]
  },
  {
    id: 'slide-checkin',
    badge: '坚持打卡 · 双倍补卡激励',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-600 dark:text-amber-400',
    title: '坚持点亮足迹，双倍刷题补卡',
    subtitle: '艾宾浩斯动态周期排期，每日复盘点亮打卡日历；多做一倍即可补齐本月漏签。',
    image: '/tutorial/slide-4-checkin.png',
    imageAlt: '打卡日历与连击足迹视图',
    points: [
      {
        icon: Flame,
        title: '连击打卡（Streak）',
        desc: '完成每日目标自动点亮打卡徽章，记录真实学习足迹'
      },
      {
        icon: Calendar,
        title: '双倍刷题本月补卡',
        desc: '复盘量达到计划 2 倍自动激活补卡资格，挽救漏签断连'
      },
      {
        icon: Sparkles,
        title: '底栏角标动态递减',
        desc: '快捷栏显示今日剩余待复盘题数，完成归零后自动隐藏'
      }
    ]
  },
  {
    id: 'slide-sync',
    badge: '多端互通 · Git 私有云',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-600 dark:text-rose-400',
    title: '电脑、手机、平板极速漫游',
    subtitle: '基于 Gitee / GitHub 私有仓库双向漫游，跨端协同复盘，数据 100% 掌握在自己手中。',
    image: '/tutorial/slide-5-sync.png',
    imageAlt: '知微错题三端互通架构图',
    points: [
      {
        icon: RefreshCw,
        title: '三端无缝互通',
        desc: '手机扫题、iPad 压感手写演算、Windows 电脑归纳整理'
      },
      {
        icon: ShieldCheck,
        title: '免服务器私有云',
        desc: '依托个人 Git 仓库 Token 加密传输，隐私绝不泄露'
      },
      {
        icon: Zap,
        title: '离线优先秒开',
        desc: '离线随时查看做题，网络就绪时一键双向安全同步'
      }
    ]
  }
];

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  currentTheme
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const themePrimary = currentTheme?.primary || '#1e56a0';

  // Mark onboarding as completed permanently
  const handleFinish = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {}
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  }, [currentIndex, handleFinish]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleFinish]);

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - dragStartX.current;
    const deltaY = currentY - dragStartY.current;

    // Detect direction on initial movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalSwipe.current) {
      // Prevent horizontal boundary overshoot resistance
      const isFirst = currentIndex === 0 && deltaX > 0;
      const isLast = currentIndex === SLIDES.length - 1 && deltaX < 0;
      const damped = (isFirst || isLast) ? deltaX * 0.3 : deltaX;
      setDragOffset(damped);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (isHorizontalSwipe.current) {
      const threshold = 45; // Minimum drag distance to switch
      if (dragOffset < -threshold && currentIndex < SLIDES.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (dragOffset > threshold && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }

    setDragOffset(0);
    isHorizontalSwipe.current = null;
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const isFirst = currentIndex === 0 && deltaX > 0;
    const isLast = currentIndex === SLIDES.length - 1 && deltaX < 0;
    const damped = (isFirst || isLast) ? deltaX * 0.35 : deltaX;
    setDragOffset(damped);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 60;
    if (dragOffset < -threshold && currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    setDragOffset(0);
  };

  if (!isOpen) return null;

  const currentSlide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-md select-none transition-opacity duration-300 animate-fade-in p-0 sm:p-4 md:p-6"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)'
      }}
    >
      <div 
        className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800"
      >
        {/* Top Header: Brand, Step Indicator, Skip Button */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-2.5 sm:px-6 sm:pt-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <img 
              src="/app-icon.png" 
              alt="知微错题" 
              className="w-6 h-6 rounded-lg shadow-xs" 
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              知微错题 · 新手使用指南
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {currentIndex + 1} / {SLIDES.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="跳过引导"
          >
            <span>跳过</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel Slider Viewport */}
        <div 
          ref={sliderRef}
          className="relative flex-1 overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Sliding Track */}
          <div 
            className="flex h-full w-full"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {SLIDES.map((slide) => (
              <div 
                key={slide.id}
                className="w-full h-full shrink-0 flex flex-col p-4 sm:p-6 overflow-y-auto"
              >
                {/* Visual Image Showcase Card */}
                <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200/90 dark:border-slate-700/80 p-3 sm:p-4 mb-4 flex items-center justify-center shadow-xs min-h-[170px] sm:min-h-[220px] max-h-[30vh] sm:max-h-[34vh] overflow-hidden group">
                  <img 
                    src={slide.image} 
                    alt={slide.imageAlt}
                    className="max-h-[26vh] sm:max-h-[30vh] max-w-full object-contain rounded-xl shadow-md transition-transform duration-300 group-hover:scale-102"
                    loading="eager"
                  />
                  {/* Subtle Swipe Hint Pill */}
                  <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-[10px] font-medium text-white flex items-center gap-1 pointer-events-none opacity-80">
                    <span>左右滑动切换</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>

                {/* Badge & Title */}
                <div className="space-y-1.5 mb-3.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: `${themePrimary}15`, color: themePrimary }}>
                    <Sparkles className="w-3 h-3" />
                    <span>{slide.badge}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {slide.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Feature Highlights Grid / List */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {slide.points.map((pt, idx) => {
                    const Icon = pt.icon;
                    return (
                      <div 
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors"
                      >
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${themePrimary}18`, color: themePrimary }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {pt.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                            {pt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Left/Right Navigation Floating Chevrons */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-md items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer z-10"
              title="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {currentIndex < SLIDES.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-md items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer z-10"
              title="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Bar: Dots & Action Buttons */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
          {/* Pagination Dots (Clickable) */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`切换到第 ${idx + 1} 页`}
                className={`transition-all duration-300 cursor-pointer rounded-full h-2 ${
                  idx === currentIndex 
                    ? 'w-6 shadow-xs' 
                    : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                style={idx === currentIndex ? { backgroundColor: themePrimary } : undefined}
              />
            ))}
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            {currentIndex > 0 && !isLastSlide && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                上一页
              </button>
            )}

            {!isLastSlide ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-all cursor-pointer active:scale-98"
                style={{ backgroundColor: themePrimary }}
              >
                <span>下一步</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-98 animate-pulse"
                style={{ backgroundColor: themePrimary }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>立即开启知微错题</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
