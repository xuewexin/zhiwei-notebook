import React, { useState, useEffect, useMemo } from 'react';
const CapApp = typeof window !== 'undefined' ? (window as any).Capacitor?.Plugins?.App : null;
const StatusBar = typeof window !== 'undefined' ? (window as any).Capacitor?.Plugins?.StatusBar : null;
import { 
  Search, 
  Plus, 
  RefreshCw, 
  GitBranch, 
  SlidersHorizontal, 
  BookOpen, 
  Folder as FolderIcon,
  Moon,
  Sun,
  Layers,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Brain,
  Sparkles,
  ArrowUpCircle,
  User,
  CloudOff
} from 'lucide-react';
import { Folder, Question, GitStatus, MasteryStatus } from './types';
import { api, isNativePlatform } from './api/client';
import { Sidebar } from './components/Sidebar';
import { FolderGrid } from './components/FolderGrid';
import { QuestionList } from './components/QuestionList';
import { QuestionDetail } from './components/QuestionDetail';
import { QuestionModal } from './components/QuestionModal';
import { GitSyncModal } from './components/GitSyncModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { OneNoteSyncIndicator } from './components/OneNoteSyncIndicator';
import { UpdateModal } from './components/UpdateModal';
import { UserProfileView } from './components/UserProfileView';
import { ReviewCheckinView } from './components/ReviewCheckinView';
import { ReviewSessionView } from './components/ReviewSessionView';
import { OnboardingTutorialModal, ONBOARDING_STORAGE_KEY } from './components/OnboardingTutorialModal';
import { reviewService, ReviewSettings } from './services/reviewService';
import { checkForUpdates, UpdateInfo, CURRENT_VERSION } from './services/updateService';
import { settingsService, ThemeColorKey, BackgroundConfig, UserProfile, THEME_PALETTES } from './services/settingsService';

export const App: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // Global questions for stable sidebar badges
  const [questions, setQuestions] = useState<Question[]>([]);       // Current filtered view questions
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('last_active_question_id');
    } catch {
      return null;
    }
  });
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(() => {
    try {
      const qId = new URLSearchParams(window.location.search).get('question');
      if (qId) {
        const raw = localStorage.getItem('zhiwei_questions_clean_v2');
        if (raw) {
          const qs = JSON.parse(raw);
          const found = qs.find((item: any) => item.id === qId);
          if (found) return found;
        }
      }
    } catch {}
    return null;
  });
  const [selectedMastery, setSelectedMastery] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'folders' | 'questions' | 'review' | 'profile'>(() => {
    try {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'profile' || tab === 'questions' || tab === 'review') return tab;
    } catch {}
    return 'folders';
  });
  const [isReviewOnly, setIsReviewOnly] = useState(false);
  const [isReviewSessionActive, setIsReviewSessionActive] = useState(false);
  const [isProfileView, setIsProfileView] = useState(false);
  const [themeKey, setThemeKey] = useState<ThemeColorKey>(() => settingsService.getThemeColor());
  const currentTheme = THEME_PALETTES[themeKey] || THEME_PALETTES.blue;
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(() => settingsService.getBackground());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => settingsService.getProfile());
  const [isGitNotConfiguredNoticeOpen, setIsGitNotConfiguredNoticeOpen] = useState(false);

  // Sync mobileTab with review and profile modes
  useEffect(() => {
    if (mobileTab === 'profile') {
      setIsProfileView(true);
      setIsReviewOnly(false);
      setIsReviewSessionActive(false);
    } else if (mobileTab === 'review') {
      setIsReviewOnly(true);
      setIsProfileView(false);
    } else {
      setIsProfileView(false);
      setIsReviewOnly(false);
      setIsReviewSessionActive(false);
    }
  }, [mobileTab]);

  // Apply active theme color
  useEffect(() => {
    settingsService.applyThemeToDOM(themeKey);
  }, [themeKey]);
  
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(ONBOARDING_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Virtual Keyboard & Active Input Detection for Mobile Navigation Bar
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkKeyboard = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 120) {
          setIsKeyboardVisible(true);
          return;
        }
      }
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );
      if (!isInput) {
        setIsKeyboardVisible(false);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        setIsKeyboardVisible(true);
      }
    };

    const onFocusOut = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable
        );
        if (!isInput) {
          setIsKeyboardVisible(false);
        }
      }, 150);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboard);
      window.visualViewport.addEventListener('scroll', checkKeyboard);
    }
    window.addEventListener('resize', checkKeyboard);
    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('focusout', onFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkKeyboard);
        window.visualViewport.removeEventListener('scroll', checkKeyboard);
      }
      window.removeEventListener('resize', checkKeyboard);
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Smoothly transition and remove splash screen
  useEffect(() => {
    // Guarantee clean cache on version upgrade across mobile APK and WebView2
    try {
      const savedVersion = localStorage.getItem('zhiwei_installed_version');
      if (savedVersion !== CURRENT_VERSION) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            for (const r of regs) r.unregister();
          });
        }
        if ('caches' in window) {
          caches.keys().then(keys => {
            for (const k of keys) caches.delete(k);
          });
        }
        localStorage.setItem('zhiwei_installed_version', CURRENT_VERSION);
      }
    } catch {}

    const splash = document.getElementById('app-splash');
    if (splash) {
      const timer = setTimeout(() => {
        splash.classList.add('splash-fade-out');
        setTimeout(() => {
          splash.remove();
        }, 650);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto check for updates on startup (after 2.8s calm delay)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await checkForUpdates({ checkIgnored: true });
        if (res && res.hasUpdate) {
          setUpdateInfo(res);
          setIsUpdateModalOpen(true);
        }
      } catch (err) {
        console.warn('Auto update check failed:', err);
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setSyncNotice('正在比对 GitHub 官方仓库最新版本...');
    try {
      const res = await checkForUpdates({ checkIgnored: false });
      if (res && res.hasUpdate) {
        setUpdateInfo(res);
        setIsUpdateModalOpen(true);
        setSyncNotice(`发现新版本 v${res.latestVersion}！`);
      } else {
        setSyncNotice(`当前已是最新版本 (v${CURRENT_VERSION})`);
      }
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (err) {
      setSyncNotice('检测更新失败，请检查网络');
      setTimeout(() => setSyncNotice(null), 3500);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Auto-restore or sync selected question from loaded list
  useEffect(() => {
    if (selectedQuestionId && allQuestions.length > 0) {
      const found = allQuestions.find(q => q.id === selectedQuestionId);
      if (found) {
        setSelectedQuestion(found);
      }
    }
  }, [allQuestions, selectedQuestionId]);

  // Load initial data
  useEffect(() => {
    loadFolders();
    loadAllQuestions();
    loadQuestions();
    loadGitStatus();
  }, []);

  // 1. Android Status Bar Theme Adaptation (white background with notch inset handling)
  useEffect(() => {
    try {
      if (StatusBar) {
        StatusBar.setStyle?.({ style: 'LIGHT' });
        StatusBar.setBackgroundColor?.({ color: '#ffffff' });
        StatusBar.setOverlaysWebView?.({ overlay: true });
      }
    } catch (e) {
      // Ignored outside native container
    }
  }, []);

  // 2. Android Hardware / Gesture Back Button Interception
  useEffect(() => {
    let backHandler: any;
    let lastBackPress = 0;
    try {
      if (CapApp?.addListener) {
        backHandler = CapApp.addListener('backButton', () => {
        // Priority 0: Close Onboarding Tutorial Modal
        if (isOnboardingOpen) {
          setIsOnboardingOpen(false);
          try {
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          } catch {}
          return;
        }
        // Priority 1: Close lightbox image viewer
        if (viewerImageUrl) {
          setViewerImageUrl(null);
          return;
        }
        // Priority 2: Close QuestionModal
        if (isQuestionModalOpen) {
          setIsQuestionModalOpen(false);
          return;
        }
        // Priority 3: Close GitSyncModal
        if (isGitModalOpen) {
          setIsGitModalOpen(false);
          return;
        }
        // Priority 4: Close mobile sidebar drawer
        if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
          return;
        }
        // Priority 4.5: Close mobile search bar
        if (isMobileSearchOpen) {
          setIsMobileSearchOpen(false);
          setSearchQuery('');
          return;
        }
        // Priority 5: Exit QuestionDetail back to QuestionList
        if (selectedQuestion) {
          handleSelectQuestion(null);
          return;
        }
        // Priority 5.2: Exit Profile View
        if (isProfileView) {
          setMobileTab('folders');
          return;
        }
        // Priority 5.5: Exit review-only mode
        if (isReviewOnly) {
          setMobileTab('folders');
          return;
        }
        // Priority 6: Return from subfolder to all questions
        if (currentFolderId) {
          setCurrentFolderId(null);
          return;
        }
        // Priority 7: Exit App at root - require double tap within 2000ms
        const now = Date.now();
        if (now - lastBackPress < 2000) {
          CapApp?.exitApp?.();
        } else {
          lastBackPress = now;
          setSyncNotice('再按一次返回键退出知微错题');
          setTimeout(() => setSyncNotice(null), 2000);
        }
      });
    }
  } catch (err) {
      // Ignored outside native container
    }

    return () => {
      if (backHandler && backHandler.remove) {
        backHandler.remove();
      }
    };
  }, [isOnboardingOpen, viewerImageUrl, isQuestionModalOpen, isGitModalOpen, isMobileSidebarOpen, isMobileSearchOpen, selectedQuestion, isReviewOnly, currentFolderId]);

  const loadFolders = async () => {
    try {
      const data = await api.getFolders();
      setFolders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('加载文件夹失败:', e);
      setFolders([]);
    }
  };

  const loadAllQuestions = async () => {
    try {
      const data = await api.getQuestions({});
      setAllQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('加载全部错题失败:', e);
    }
  };

  const loadQuestions = async () => {
    try {
      const data = await api.getQuestions({
        folderId: currentFolderId || undefined,
        search: searchQuery || undefined,
        mastery: selectedMastery || undefined
      });
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('加载错题失败:', e);
      setQuestions([]);
    }
  };

  const loadGitStatus = async () => {
    try {
      const st = await api.getGitStatus();
      setGitStatus(st);
    } catch (e) {
      console.error('加载 Git 状态失败:', e);
    }
  };

  // Reload questions when folder, search, or mastery filter changes
  useEffect(() => {
    loadQuestions();
  }, [currentFolderId, searchQuery, selectedMastery]);

  const handleCreateFolder = async (folderData: Partial<Folder>) => {
    try {
      const created = await api.createFolder(folderData);
      setFolders(prev => {
        const filtered = prev.filter(f => f.id !== created.id);
        return [...filtered, created];
      });
      setSyncNotice(`已创建文件夹: ${created.name}`);
      setTimeout(() => setSyncNotice(null), 2500);
      loadFolders();
    } catch (e: any) {
      alert('创建文件夹失败: ' + (e?.message || '未知错误'));
    }
  };

  const handleUpdateFolder = async (id: string, folderData: Partial<Folder>) => {
    try {
      const updated = await api.updateFolder(id, folderData);
      setFolders(prev => prev.map(f => f.id === id ? updated : f));
      setSyncNotice(`已修改文件夹: ${updated.name}`);
      setTimeout(() => setSyncNotice(null), 2500);
      loadFolders();
    } catch (e: any) {
      alert('更新文件夹失败: ' + (e?.message || '未知错误'));
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      const res = await api.deleteFolder(id);
      const deletedSet = new Set(res.deletedFolderIds);
      setFolders(prev => prev.filter(f => !deletedSet.has(f.id)));
      if (currentFolderId && deletedSet.has(currentFolderId)) {
        setCurrentFolderId(null);
      }
      loadQuestions();
      setTimeout(loadGitStatus, 800);
      setTimeout(loadGitStatus, 3200);
    } catch (e: any) {
      alert('删除文件夹失败: ' + e.message);
    }
  };

  const handleQuickSync = async () => {
    if (!gitStatus || !gitStatus.isRepo) {
      setIsGitNotConfiguredNoticeOpen(true);
      return;
    }
    setIsSyncing(true);
    setSyncNotice('正在与 Git 云端仓库同步中...');
    try {
      const res = await api.syncGit();
      if (res.success) {
        setSyncNotice('云端同步成功！已更新最新数据');
        loadFolders();
        loadAllQuestions();
        loadQuestions();
        loadGitStatus();
      } else {
        setSyncNotice('同步遇到问题，请检查仓库配置');
      }
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (e: any) {
      setSyncNotice('同步异常: ' + e.message);
      setTimeout(() => setSyncNotice(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickPull = async () => {
    if (!gitStatus || !gitStatus.isRepo) {
      setIsGitNotConfiguredNoticeOpen(true);
      return;
    }
    setIsSyncing(true);
    setSyncNotice('正在从云端拉取最新错题...');
    try {
      const res = await api.pullGit();
      if (res.success) {
        setSyncNotice('云端拉取完成！已获取最新数据');
        loadFolders();
        loadAllQuestions();
        loadQuestions();
        loadGitStatus();
      } else {
        setSyncNotice('拉取提示: ' + (res.message || ''));
      }
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (e: any) {
      setSyncNotice('拉取异常: ' + e.message);
      setTimeout(() => setSyncNotice(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickPush = async () => {
    if (!gitStatus || !gitStatus.isRepo) {
      setIsGitNotConfiguredNoticeOpen(true);
      return;
    }
    setIsSyncing(true);
    setSyncNotice('正在向云端推送本地错题...');
    try {
      const res = await api.pushGit();
      if (res.success) {
        setSyncNotice('本地错题已成功同步推送到云端！');
        loadGitStatus();
      } else {
        setSyncNotice('推送失败: ' + (res.message || ''));
      }
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (e: any) {
      setSyncNotice('推送异常: ' + e.message);
      setTimeout(() => setSyncNotice(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectQuestion = (q: Question | null) => {
    setSelectedQuestion(q);
    try {
      if (q) {
        localStorage.setItem('last_active_question_id', q.id);
        setSelectedQuestionId(q.id);
      } else {
        localStorage.removeItem('last_active_question_id');
        setSelectedQuestionId(null);
      }
    } catch {}
  };

  const handleQuestionCreated = (newQ: Question) => {
    setQuestions(prev => [newQ, ...prev]);
    setAllQuestions(prev => [newQ, ...prev]);
    handleSelectQuestion(newQ);
    setTimeout(loadGitStatus, 800);
    setTimeout(loadGitStatus, 3200);
  };

  const handleQuestionUpdated = (updatedQ: Question) => {
    setQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    setAllQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    setSelectedQuestion(updatedQ);
    try {
      localStorage.setItem('last_active_question_id', updatedQ.id);
      setSelectedQuestionId(updatedQ.id);
    } catch {}
    setTimeout(loadGitStatus, 800);
    setTimeout(loadGitStatus, 3200);
  };

  const handleQuestionDeleted = async (id: string) => {
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      setAllQuestions(prev => prev.filter(q => q.id !== id));
      handleSelectQuestion(null);
      setTimeout(loadGitStatus, 800);
      setTimeout(loadGitStatus, 3200);
    } catch (e: any) {
      alert('删除错题失败: ' + e.message);
    }
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);

  // Ebbinghaus Daily Review Settings & Memory Curve calculations
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(() => reviewService.getReviewSettings());

  const dailyReviewResult = useMemo(() => {
    return reviewService.getDailyReviewQuestions(allQuestions, reviewSettings);
  }, [allQuestions, reviewSettings]);

  const dueTodayQuestions = dailyReviewResult.reviewQuestions;
  const dueTodayCount = dueTodayQuestions.length;
  const remainingReviewCount = useMemo(() => {
    return reviewService.getRemainingDueCount(dueTodayQuestions);
  }, [dueTodayQuestions, questions, allQuestions]);

  // Final filtered questions to display
  const displayQuestions = isReviewOnly
    ? dueTodayQuestions.filter(q => !searchQuery || q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || q.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : questions;

  return (
    <div className="flex h-screen w-screen bg-slate-100/70 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans pb-[env(safe-area-inset-bottom,0px)] relative">
      {/* Optional Custom Background Wallpaper */}
      {bgConfig.imageUrl && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: `url(${bgConfig.imageUrl})`,
            opacity: bgConfig.opacity
          }}
        />
      )}

      {/* 1. Sleek Left Sidebar with stable global counts and mobile drawer */}
      {!isDesktopSidebarCollapsed && (
        <Sidebar
          folders={folders}
          allQuestions={allQuestions}
          currentFolderId={currentFolderId}
          selectedMastery={selectedMastery}
          gitStatus={gitStatus}
          onSelectFolder={(fId) => {
            setMobileTab('folders');
            setIsReviewOnly(false);
            setCurrentFolderId(fId);
            handleSelectQuestion(null);
          }}
          onSelectMastery={(m) => {
            setMobileTab('questions');
            setIsReviewOnly(false);
            setSelectedMastery(m);
            handleSelectQuestion(null);
          }}
          onOpenCreateQuestion={() => setIsQuestionModalOpen(true)}
          onOpenGitModal={() => setIsGitModalOpen(true)}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar - Optimized for Mobile & Desktop (safe from camera notch/island) */}
        <header 
          style={isNativePlatform ? { 
            paddingTop: 'max(env(safe-area-inset-top, 0px), 42px)',
            minHeight: '88px',
            height: 'auto'
          } : undefined}
          className="px-3.5 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-xs h-14 sm:h-16"
        >
          {/* Mobile Top Header (Hidden on Desktop) */}
          {isMobileSearchOpen ? (
            <div className="flex items-center gap-2 w-full md:hidden">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索错题标题、知识点、考点..."
                  className="w-full text-xs pl-8 pr-7 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-1 py-1 whitespace-nowrap cursor-pointer"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full md:hidden">
              {/* Left: Top-left Drawer Button + Clean Title (No bloated logo or subtitle) */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-1.5 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer shrink-0"
                  title="打开学科分类抽屉"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedQuestion
                      ? (selectedQuestion.title || '错题详情')
                      : mobileTab === 'profile'
                      ? '个人主页'
                      : mobileTab === 'review'
                      ? '今日复盘'
                      : mobileTab === 'folders'
                      ? (currentFolder ? currentFolder.name : '全部科目')
                      : (currentFolder ? currentFolder.name : selectedMastery ? (selectedMastery === 'mastered' ? '已掌握错题' : selectedMastery === 'reviewing' ? '攻关中错题' : '未掌握错题') : '全部错题')}
                  </h1>
                  {!selectedQuestion && !isReviewSessionActive && (
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                      ({mobileTab === 'review' 
                        ? `待复盘 ${remainingReviewCount} 题` 
                        : mobileTab === 'folders' 
                        ? (currentFolder ? `${displayQuestions.length} 题` : `${folders.length} 科目`) 
                        : `${displayQuestions.length} 题`})
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Quick Search + OneNote Sync */}
              <div className="flex items-center gap-1.5 shrink-0">
                {syncNotice && (
                  <div className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg animate-fade-in truncate max-w-[95px]">
                    {syncNotice}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  title="搜索错题"
                >
                  <Search className="w-4 h-4" />
                </button>

                <OneNoteSyncIndicator
                  gitStatus={gitStatus}
                  isSyncing={isSyncing}
                  onSyncNow={handleQuickSync}
                  onPullNow={handleQuickPull}
                  onPushNow={handleQuickPush}
                  onOpenSettings={() => setIsGitModalOpen(true)}
                />
              </div>
            </div>
          )}

          {/* Desktop/Tablet Header (Hidden on Mobile) */}
          <div className="hidden md:flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDesktopSidebarCollapsed(prev => !prev)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isDesktopSidebarCollapsed ? "展开分类侧栏" : "折叠侧栏 (沉浸做题/全屏手写)"}
              >
                {isDesktopSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            {/* Desktop Search bar */}
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索错题标题、考点..."
                className="w-full text-xs pl-8 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Desktop Sync notification pill */}
            {syncNotice && (
              <div className="text-xs font-semibold px-2.5 sm:px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl animate-fade-in shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span className="truncate max-w-[120px] sm:max-w-none">{syncNotice}</span>
              </div>
            )}

            {/* Desktop Right Header Actions */}
            <div className="flex items-center gap-2.5">
              <OneNoteSyncIndicator
                gitStatus={gitStatus}
                isSyncing={isSyncing}
                onSyncNow={handleQuickSync}
                onPullNow={handleQuickPull}
                onPushNow={handleQuickPush}
                onOpenSettings={() => setIsGitModalOpen(true)}
              />

              <button
                type="button"
                onClick={handleManualCheckUpdate}
                disabled={isCheckingUpdate}
                className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title={`检测软件更新 (当前 v${CURRENT_VERSION})`}
              >
                <ArrowUpCircle className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              {/* Desktop Header User Profile Pill (Avatar + Nickname) */}
              <button
                type="button"
                onClick={() => {
                  handleSelectQuestion(null);
                  setMobileTab(prev => prev === 'profile' ? 'folders' : 'profile');
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border ${
                  mobileTab === 'profile'
                    ? 'bg-slate-100 dark:bg-slate-800 font-bold border-slate-300 dark:border-slate-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                }`}
                style={mobileTab === 'profile' ? { color: currentTheme.primary, borderColor: `${currentTheme.primary}50` } : {}}
                title="个人主页与系统设置"
              >
                <img
                  src={userProfile.avatar || '/app-icon.png'}
                  alt={userProfile.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-400/40 shrink-0"
                />
                <span className="text-xs font-bold truncate max-w-[95px]">
                  {userProfile.name || '知微学者'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Plus className="w-4 h-4" />
                <span>录入错题</span>
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Body: Profile View OR Detail View OR Folders / Questions */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 md:pb-6 relative z-10">
          {mobileTab === 'profile' ? (
            <UserProfileView
              questions={allQuestions}
              folders={folders}
              onOpenGitModal={() => setIsGitModalOpen(true)}
              onRefreshData={() => {
                loadFolders();
                loadAllQuestions();
                loadQuestions();
              }}
              onCheckUpdate={handleManualCheckUpdate}
              onBackToQuestions={() => setMobileTab('folders')}
              onProfileUpdated={(p) => setUserProfile(p)}
              onBackgroundUpdated={(bg) => setBgConfig(bg)}
              onThemeUpdated={(t) => setThemeKey(t)}
              onOpenTutorial={() => setIsOnboardingOpen(true)}
            />
          ) : isReviewSessionActive ? (
            <ReviewSessionView
              currentTheme={currentTheme}
              questions={dueTodayQuestions}
              folders={folders}
              onBack={() => setIsReviewSessionActive(false)}
              onQuestionUpdated={handleQuestionUpdated}
              onViewImage={(url) => setViewerImageUrl(url)}
            />
          ) : selectedQuestion ? (
            <QuestionDetail
              question={selectedQuestion}
              folder={folders.find(f => f.id === selectedQuestion.folderId)}
              allFolders={folders}
              onBack={() => handleSelectQuestion(null)}
              onUpdate={handleQuestionUpdated}
              onDelete={handleQuestionDeleted}
              onViewImage={(url) => setViewerImageUrl(url)}
              currentTheme={currentTheme}
            />
          ) : (
            <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
              {/* Ebbinghaus Review & Checkin Streak Calendar (when Review Mode is active) */}
              {mobileTab === 'review' && (
                <ReviewCheckinView
                  currentTheme={currentTheme}
                  reviewQuestions={dueTodayQuestions}
                  folders={folders}
                  allQuestions={allQuestions}
                  onStartReview={() => {
                    setIsReviewSessionActive(true);
                  }}
                  onViewAllQuestions={() => {
                    setMobileTab('questions');
                    setIsReviewOnly(false);
                  }}
                  onQuestionUpdated={handleQuestionUpdated}
                  onSelectQuestion={handleSelectQuestion}
                  onSettingsChange={setReviewSettings}
                />
              )}

              {/* 1. GoodNotes Folder Grid Hierarchy (Shown when in 'folders' tab or on desktop) */}
              {mobileTab !== 'review' && (mobileTab === 'folders' || typeof window === 'undefined' || window.innerWidth >= 768) && (
                <FolderGrid
                  currentFolderId={currentFolderId}
                  folders={folders}
                  questions={questions}
                  onSelectFolder={(fId) => setCurrentFolderId(fId)}
                  onCreateFolder={handleCreateFolder}
                  onUpdateFolder={handleUpdateFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              )}

              {/* 2. Questions in this Category or Flat List */}
              {/* On mobile: if on 'folders' and currentFolderId is null, keep focus on folder covers; otherwise show questions */}
              {(mobileTab === 'questions' || currentFolderId !== null || (typeof window !== 'undefined' && window.innerWidth >= 768 && mobileTab !== 'review' && mobileTab !== 'profile')) && (
                <QuestionList
                  questions={displayQuestions}
                  folders={folders}
                  currentFolderId={currentFolderId}
                  onSelectQuestion={handleSelectQuestion}
                  onOpenCreateModal={() => setIsQuestionModalOpen(true)}
                  onQuestionUpdated={handleQuestionUpdated}
                  currentTheme={currentTheme}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. Mobile Bottom Navigation Bar (5 Streamlined Flagship Tabs) */}
      {/* Automatically hidden when soft keyboard pops up or when any modal/input is active */}
      <nav 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 pb-[max(env(safe-area-inset-bottom,0px),6px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 ${
          isKeyboardVisible || isQuestionModalOpen || isGitModalOpen || !!viewerImageUrl || isUpdateModalOpen
            ? 'hidden pointer-events-none'
            : 'block'
        }`}
      >
        <div className="w-full max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1 relative">
          {/* Tab 1: 全部科目 (GoodNotes 学科分类) */}
          <button
            type="button"
            onClick={() => {
              setMobileTab('folders');
              setIsReviewOnly(false);
              handleSelectQuestion(null);
            }}
            className={`col-span-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-92 select-none ${
              mobileTab === 'folders' && !selectedQuestion
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-normal'
            }`}
            style={mobileTab === 'folders' && !selectedQuestion ? { color: currentTheme.primary } : {}}
          >
            <FolderIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap">全部科目</span>
          </button>

          {/* Tab 2: 全部错题 */}
          <button
            type="button"
            onClick={() => {
              setMobileTab('questions');
              setIsReviewOnly(false);
              handleSelectQuestion(null);
              setCurrentFolderId(null);
              setSelectedMastery(null);
            }}
            className={`col-span-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-92 select-none ${
              mobileTab === 'questions' && !selectedQuestion
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-normal'
            }`}
            style={mobileTab === 'questions' && !selectedQuestion ? { color: currentTheme.primary } : {}}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap">全部错题</span>
          </button>

          {/* Center Elevated Floating Plus Button */}
          <div className="col-span-1 flex items-center justify-center -mt-6">
            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(true)}
              className="w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-white dark:ring-slate-900"
              style={{ backgroundColor: currentTheme.primary }}
              title="录入新错题"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {/* Tab 4: 今日复盘 */}
          <button
            type="button"
            onClick={() => {
              setMobileTab('review');
              handleSelectQuestion(null);
              setIsReviewOnly(true);
              setIsReviewSessionActive(false);
            }}
            className={`col-span-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-92 select-none relative ${
              mobileTab === 'review' && !selectedQuestion && !isReviewSessionActive
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-normal'
            }`}
            style={mobileTab === 'review' && !selectedQuestion && !isReviewSessionActive ? { color: currentTheme.primary } : {}}
          >
            <div className="relative">
              <Brain className="w-5 h-5 mb-1" />
              {remainingReviewCount > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                  {remainingReviewCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap">今日复盘</span>
          </button>

          {/* Tab 5: 个人主页 */}
          <button
            type="button"
            onClick={() => {
              handleSelectQuestion(null);
              setMobileTab('profile');
            }}
            className={`col-span-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all active:scale-92 select-none relative ${
              mobileTab === 'profile'
                ? 'font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-normal'
            }`}
            style={mobileTab === 'profile' ? { color: currentTheme.primary } : {}}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap">个人主页</span>
          </button>
        </div>
      </nav>

      {/* MODALS */}
      {/* 1. Create Question Modal */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        currentFolderId={currentFolderId}
        folders={folders}
        onClose={() => setIsQuestionModalOpen(false)}
        onCreated={handleQuestionCreated}
      />

      {/* 2. Git Cloud Sync Modal */}
      <GitSyncModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        onSyncSuccess={() => {
          loadFolders();
          loadQuestions();
          loadGitStatus();
        }}
      />

      {/* 3. Fullscreen Lightbox Image Viewer */}
      <ImageViewerModal
        isOpen={!!viewerImageUrl}
        imageUrl={viewerImageUrl || ''}
        onClose={() => setViewerImageUrl(null)}
      />

      {/* 4. Auto Update Modal */}
      {updateInfo && (
        <UpdateModal
          updateInfo={updateInfo}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}

      {/* 5. Git Not Configured Alert Modal */}
      {isGitNotConfiguredNoticeOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <CloudOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              未配置 Git 云端同步仓库
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              当前尚未关联 Gitee 或 GitHub 远程仓库，无法进行多端数据双向同步。<br />
              请先在 Git 仓库设置中填入您的仓库 HTTPS 地址与 Personal Access Token，配置完成后即可自动同步。
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsGitNotConfiguredNoticeOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                稍后配置
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGitNotConfiguredNoticeOpen(false);
                  setIsGitModalOpen(true);
                }}
                className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>立即配置 Git 仓库</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Onboarding Swiping Tutorial Modal (First launch only) */}
      <OnboardingTutorialModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentTheme={currentTheme}
      />
    </div>
  );
};
export default App;
