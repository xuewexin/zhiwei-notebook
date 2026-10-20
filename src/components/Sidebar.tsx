import React from 'react';
import { 
  BookOpen, 
  Folder as FolderIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  GitBranch, 
  Settings, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Sparkles,
  Layers,
  FolderPlus,
  Flame,
  X
} from 'lucide-react';
import { Folder, Question, GitStatus } from '../types';
import { isNativePlatform } from '../api/client';

interface SidebarProps {
  folders: Folder[];
  allQuestions: Question[];
  currentFolderId: string | null;
  selectedMastery: string | null;
  gitStatus: GitStatus | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectMastery: (mastery: string | null) => void;
  onOpenCreateQuestion: () => void;
  onOpenGitModal: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  allQuestions,
  currentFolderId,
  selectedMastery,
  gitStatus,
  onSelectFolder,
  onSelectMastery,
  onOpenCreateQuestion,
  onOpenGitModal,
  isOpen = false,
  onClose
}) => {
  const handleSelectFolder = (folderId: string | null) => {
    onSelectFolder(folderId);
    onClose?.();
  };

  const handleSelectMastery = (mastery: string | null) => {
    onSelectMastery(mastery);
    onClose?.();
  };

  const handleCreateQuestion = () => {
    onOpenCreateQuestion();
    onClose?.();
  };

  const handleOpenGitModal = () => {
    onOpenGitModal();
    onClose?.();
  };
  // Top-level folders (parentId is null, undefined, or empty)
  const rootFolders = (folders || []).filter(f => !f.parentId);

  // Stats computed from allQuestions (stable and accurate)
  const qList = allQuestions || [];
  const totalQuestions = qList.length;
  const unmasteredCount = qList.filter(q => q.mastery === 'unmastered').length;
  const reviewingCount = qList.filter(q => q.mastery === 'reviewing').length;
  const masteredCount = qList.filter(q => q.mastery === 'mastered').length;
  
  // Ebbinghaus Due Today count
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  const dueTodayCount = qList.filter(q => !q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= tomorrow).length;

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0
        w-72 md:w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        flex flex-col justify-between select-none shrink-0 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Section: App Branding & New Button */}
        <div className="p-4 pt-5 md:pt-4">
          {/* App Title */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2.5">
              <img 
                src="/app-icon.png" 
                alt="知微错题本" 
                className="w-9 h-9 rounded-2xl shadow-md shrink-0 object-cover" 
              />
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  知微错题本
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">
                  见微知著 · 墨迹批注 · 艾宾浩斯复盘
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="关闭侧边栏"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Primary Action Button: New Question */}
          <button
            type="button"
            onClick={handleCreateQuestion}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>录入新错题</span>
          </button>
        </div>

        {/* Middle Section: Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6 text-xs font-medium">
          {/* 1. Overview & Mastery Filters */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              错题概览与复盘
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  handleSelectFolder(null);
                  handleSelectMastery(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  currentFolderId === null && selectedMastery === null
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>全部错题</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                  {totalQuestions}
                </span>
              </button>

              {/* Ebbinghaus Due Today Filter */}
              <button
                type="button"
                onClick={() => handleSelectMastery('due_today')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedMastery === 'due_today'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-indigo-500" />
                  <span>今日待复盘 (遗忘周期)</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  dueTodayCount > 0 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {dueTodayCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMastery('unmastered')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedMastery === 'unmastered'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>未掌握 (急需重做)</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 font-semibold">
                  {unmasteredCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMastery('reviewing')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedMastery === 'reviewing'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>攻关复盘中</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 font-semibold">
                  {reviewingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMastery('mastered')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedMastery === 'mastered'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>已完全掌握</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-semibold">
                  {masteredCount}
                </span>
              </button>
            </div>
          </div>

          {/* 2. Folders / Subjects Tree */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                科目分类 (GoodNotes 文件夹)
              </span>
            </div>

            <div className="space-y-0.5">
              {rootFolders.map((rf) => {
                const isSelected = currentFolderId === rf.id;
                const subCount = (folders || []).filter(f => f.parentId === rf.id).length;
                const qCount = qList.filter(q => q.folderId === rf.id).length;

                return (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => {
                      handleSelectFolder(rf.id);
                      handleSelectMastery(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: rf.color }}
                      />
                      <span className="truncate">{rf.name}</span>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {subCount > 0 ? `${subCount} 子类` : qCount > 0 ? `${qCount} 题` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section: Git Cloud Sync Status Bar */}
        <div 
          style={isNativePlatform ? { paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' } : undefined}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60"
        >
          <button
            type="button"
            onClick={handleOpenGitModal}
            className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs hover:shadow transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${gitStatus?.autoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                  Git 同步中心
                </span>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{gitStatus?.autoSyncEnabled ? '10分钟定时拉取开启' : '点击配置 Gitee/GitHub'}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
