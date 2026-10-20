import React, { useState } from 'react';
import { 
  Folder as FolderIcon, 
  FolderPlus, 
  ChevronRight, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Layers, 
  BookOpen, 
  ArrowLeft,
  Sigma,
  TrendingUp,
  Compass,
  Languages,
  Atom,
  Code2,
  FileText
} from 'lucide-react';
import { Folder, Question } from '../types';

interface FolderGridProps {
  currentFolderId: string | null;
  folders: Folder[];
  questions: Question[];
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (data: Partial<Folder>) => void;
  onUpdateFolder: (id: string, data: Partial<Folder>) => void;
  onDeleteFolder: (id: string) => void;
}

const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f97316'  // Orange
];

const ICON_MAP: Record<string, React.ElementType> = {
  Sigma,
  TrendingUp,
  Compass,
  Languages,
  BookOpen,
  Atom,
  Code2,
  FileText,
  Folder: FolderIcon
};

export const FolderGrid: React.FC<FolderGridProps> = ({
  currentFolderId,
  folders,
  questions,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderColor, setFolderColor] = useState(COLOR_PALETTE[0]);
  const [folderIcon, setFolderIcon] = useState('Folder');

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const crumbs: Folder[] = [];
    let curr = folders.find(f => f.id === currentFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find(f => f.id === curr?.parentId);
    }
    return crumbs;
  };
  const breadcrumbs = getBreadcrumbs();
  const currentFolder = folders.find(f => f.id === currentFolderId);

  // Folders to display at this level
  const displayedFolders = folders.filter(f => (f.parentId || null) === (currentFolderId || null));

  // Helper to count questions in a folder (including subfolders)
  const getFolderStats = (fId: string) => {
    const subFolderIds = new Set<string>([fId]);
    let changed = true;
    while (changed) {
      changed = false;
      folders.forEach(f => {
        if (f.parentId && subFolderIds.has(f.parentId) && !subFolderIds.has(f.id)) {
          subFolderIds.add(f.id);
          changed = true;
        }
      });
    }

    const folderQuestions = questions.filter(q => subFolderIds.has(q.folderId));
    const masteredCount = folderQuestions.filter(q => q.mastery === 'mastered').length;
    const reviewingCount = folderQuestions.filter(q => q.mastery === 'reviewing').length;
    const unmasteredCount = folderQuestions.filter(q => q.mastery === 'unmastered').length;
    
    return {
      total: folderQuestions.length,
      mastered: masteredCount,
      subfolders: folders.filter(f => (f.parentId || null) === fId).length,
      percent: folderQuestions.length > 0 ? Math.round((masteredCount / folderQuestions.length) * 100) : 0
    };
  };

  const openCreateModal = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDesc('');
    setFolderColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    setFolderIcon('Folder');
    setIsModalOpen(true);
  };

  const openEditModal = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDesc(folder.description || '');
    setFolderColor(folder.color || COLOR_PALETTE[0]);
    setFolderIcon(folder.icon || 'Folder');
    setIsModalOpen(true);
  };

  const handleSave = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      alert('请输入文件夹名称');
      return;
    }

    if (editingFolder) {
      onUpdateFolder(editingFolder.id, {
        name: trimmed,
        description: folderDesc.trim(),
        color: folderColor,
        icon: folderIcon
      });
    } else {
      onCreateFolder({
        name: trimmed,
        description: folderDesc.trim(),
        color: folderColor,
        icon: folderIcon,
        parentId: currentFolderId || null
      });
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm">
      {/* 模块顶部标题栏与界限分割 */}
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4.5 rounded-full bg-blue-600 shrink-0"></span>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            学科分类
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md">
              {displayedFolders.length} 个
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentFolderId && (
            <button
              type="button"
              onClick={() => {
                const parent = folders.find(f => f.id === currentFolderId)?.parentId || null;
                onSelectFolder(parent);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>返回上级</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/70 dark:border-blue-900/70 rounded-lg transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>新建文件夹</span>
          </button>
        </div>
      </div>

      {/* 面包屑导航（如果在子文件夹中） */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 px-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            type="button"
            onClick={() => onSelectFolder(null)}
            className="hover:text-blue-600 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>全部科目</span>
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <button
                type="button"
                onClick={() => onSelectFolder(crumb.id)}
                className={`shrink-0 cursor-pointer ${
                  idx === breadcrumbs.length - 1
                    ? 'font-bold text-slate-800 dark:text-slate-200'
                    : 'hover:text-blue-600'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Folders Grid - GoodNotes Card Style */}
      {displayedFolders.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {displayedFolders.map((folder) => {
            const stats = getFolderStats(folder.id);
            const IconComponent = ICON_MAP[folder.icon] || FolderIcon;

            return (
              <div
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className="group relative cursor-pointer flex flex-col justify-between bg-slate-50/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs hover:shadow-notebook transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {/* Notebook spine / top accent bar */}
                <div
                  className="absolute top-0 left-3 right-3 sm:left-4 sm:right-4 h-1.5 rounded-b-md"
                  style={{ backgroundColor: folder.color }}
                />

                {/* Card Header: Icon & Action */}
                <div className="flex items-start justify-between pt-1 mb-2.5">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
                    style={{ backgroundColor: folder.color }}
                  >
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(folder, e)}
                      className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="编辑分类"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Folder Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate group-hover:text-blue-600 transition-colors">
                    {folder.name}
                  </h4>
                  {folder.description && (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                      {folder.description}
                    </p>
                  )}
                </div>

                {/* Stats & Progress */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>{stats.total} 题 {stats.subfolders > 0 ? `· ${stats.subfolders} 子类` : ''}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.percent}% 掌握</span>
                  </div>

                  {/* Tiny progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700/80 rounded-2xl p-6 text-center shadow-xs mb-4">
          <FolderPlus className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {currentFolderId ? '当前分类下暂无子分类' : '暂无分类文件夹'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 mb-3">
            {currentFolderId ? '可点击下方按钮创建子章节，或直接在下方录入错题' : '纯净版已就绪！点击下方按钮创建第一个文件夹（名称可随意填写，如数学、错题集、期末复习等）'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900 rounded-xl transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            {currentFolderId ? '新建子文件夹' : '新建文件夹'}
          </button>
        </div>
      )}
    </section>

    {/* Create / Edit Folder Modal */}
    {isModalOpen && (
        <div 
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
          className="fixed inset-0 z-50 flex justify-center items-start bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 mb-8 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FolderIcon className="w-5 h-5 text-blue-600" />
              {editingFolder ? '编辑文件夹' : '新建文件夹'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  文件夹名称 *
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  placeholder="输入任意文件夹名称（如：数学、物理、高数、期末冲刺...）"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  文件夹描述 (可选)
                </label>
                <input
                  type="text"
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  placeholder="例如: 重点关注切线方程与极值点偏移..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  封面色调
                </label>
                <div className="flex gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFolderColor(c);
                      }}
                      className={`w-7 h-7 rounded-full transition-transform ${folderColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  代表图标
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {Object.keys(ICON_MAP).map((iKey) => {
                    const Comp = ICON_MAP[iKey];
                    return (
                      <button
                        key={iKey}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFolderIcon(iKey);
                        }}
                        className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                          folderIcon === iKey
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {editingFolder ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`确定删除文件夹 "${editingFolder.name}" 及其所有子分类吗？`)) {
                        onDeleteFolder(editingFolder.id);
                        setIsModalOpen(false);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除此文件夹
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
                  >
                    {editingFolder ? '保存修改' : '确认创建文件夹'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
