import React, { useState, useEffect } from 'react';
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
  PanelLeftOpen
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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedMastery, setSelectedMastery] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isReviewOnly, setIsReviewOnly] = useState(false);
  
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

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
        // Priority 5.5: Exit review-only mode
        if (isReviewOnly) {
          setIsReviewOnly(false);
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
          setSyncNotice('再按一次返回键退出知微错题本');
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
  }, [viewerImageUrl, isQuestionModalOpen, isGitModalOpen, isMobileSidebarOpen, isMobileSearchOpen, selectedQuestion, isReviewOnly, currentFolderId]);

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

  // Ebbinghaus Due Today calculations
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  const dueTodayQuestions = allQuestions.filter(
    q => !q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= tomorrow
  );
  const dueTodayCount = dueTodayQuestions.length;

  // Final filtered questions to display
  const displayQuestions = isReviewOnly
    ? allQuestions.filter(q => (!q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= tomorrow) && (!searchQuery || q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || q.content?.toLowerCase().includes(searchQuery.toLowerCase())))
    : questions;

  return (
    <div className="flex h-screen w-screen bg-slate-100/70 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans pb-[env(safe-area-inset-bottom,0px)]">
      {/* 1. Sleek Left Sidebar with stable global counts and mobile drawer */}
      {!isDesktopSidebarCollapsed && (
        <Sidebar
          folders={folders}
          allQuestions={allQuestions}
          currentFolderId={currentFolderId}
          selectedMastery={selectedMastery}
          gitStatus={gitStatus}
          onSelectFolder={(fId) => {
            setIsReviewOnly(false);
            setCurrentFolderId(fId);
            handleSelectQuestion(null);
          }}
          onSelectMastery={(m) => {
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
              {/* Left: App Logo + Title */}
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/app-icon.png"
                  alt="知微错题本"
                  className="w-7 h-7 rounded-xl object-cover shadow-2xs shrink-0"
                />
                <div className="leading-tight truncate">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedQuestion
                      ? (selectedQuestion.title || '错题详情')
                      : isReviewOnly
                      ? '艾宾浩斯复盘'
                      : currentFolder
                      ? currentFolder.name
                      : selectedMastery
                      ? (selectedMastery === 'mastered' ? '已掌握错题' : selectedMastery === 'reviewing' ? '攻关中错题' : '未掌握错题')
                      : '知微错题本'}
                  </h1>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {selectedQuestion
                      ? '精细记录 · 考点剖析'
                      : isReviewOnly
                      ? `今日待复习 ${dueTodayCount} 题`
                      : `${displayQuestions.length} 道错题`}
                  </span>
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
                onClick={() => setIsQuestionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>录入错题</span>
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Body: Detail View OR FolderGrid + List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 md:pb-6">
          {selectedQuestion ? (
            <QuestionDetail
              question={selectedQuestion}
              folder={folders.find(f => f.id === selectedQuestion.folderId)}
              allFolders={folders}
              onBack={() => handleSelectQuestion(null)}
              onUpdate={handleQuestionUpdated}
              onDelete={handleQuestionDeleted}
              onViewImage={(url) => setViewerImageUrl(url)}
            />
          ) : (
            <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
              {/* Ebbinghaus Review Banner (when Review Mode is active) */}
              {isReviewOnly && (
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl sm:text-3xl shrink-0">🧠</span>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2 truncate">
                        今日艾宾浩斯复盘 ({displayQuestions.length} 题)
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-blue-100 mt-0.5 truncate">
                        按遗忘临界点规律强化练习，做对提升掌握等级，彻底攻克！
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewOnly(false)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    全部错题
                  </button>
                </div>
              )}

              {/* 1. GoodNotes Folder Grid Hierarchy (hidden in review-only mode for focus) */}
              {!isReviewOnly && (
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

              {/* 2. Questions in this Category */}
              <QuestionList
                questions={displayQuestions}
                folders={folders}
                currentFolderId={currentFolderId}
                onSelectQuestion={handleSelectQuestion}
                onOpenCreateModal={() => setIsQuestionModalOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      {/* 3. Mobile Bottom Navigation Bar (Flagship Mobile UX) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
        <div className="flex items-center justify-around h-15 px-2 max-w-lg mx-auto relative">
          {/* Tab 1: Folders */}
          <button
            type="button"
            onClick={() => {
              setIsReviewOnly(false);
              handleSelectQuestion(null);
              setCurrentFolderId(null);
              setSelectedMastery(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              !isReviewOnly && !selectedQuestion && currentFolderId === null && selectedMastery === null
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <FolderIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">分类</span>
          </button>

          {/* Tab 2: All Questions */}
          <button
            type="button"
            onClick={() => {
              setIsReviewOnly(false);
              handleSelectQuestion(null);
              setSelectedMastery(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              !isReviewOnly && !selectedQuestion && (currentFolderId !== null || selectedMastery !== null)
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">全部错题</span>
          </button>

          {/* Center Elevated Floating Plus Button */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(true)}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform active:scale-95 transition-all cursor-pointer ring-4 ring-white dark:ring-slate-900"
              title="录入新错题"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {/* Tab 4: Ebbinghaus Review Due */}
          <button
            type="button"
            onClick={() => {
              handleSelectQuestion(null);
              setIsReviewOnly(true);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors relative ${
              isReviewOnly && !selectedQuestion
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <span className="text-lg leading-none mb-0.5 block">🧠</span>
              {dueTodayCount > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[16px] text-center">
                  {dueTodayCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">今日复盘</span>
          </button>

          {/* Tab 5: Menu / Drawer */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">更多/抽屉</span>
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
    </div>
  );
};
export default App;
