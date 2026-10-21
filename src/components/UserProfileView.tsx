import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Settings, 
  Palette, 
  Image as ImageIcon, 
  HardDrive, 
  Info, 
  Sparkles, 
  Cpu, 
  ArrowUpCircle, 
  Check, 
  Upload, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  Flame, 
  Edit3, 
  Download, 
  FileJson, 
  RefreshCw, 
  Eye, 
  EyeOff,
  GitBranch,
  FolderOpen,
  Share2,
  Mail,
  Copy
} from 'lucide-react';
import { 
  settingsService, 
  UserProfile, 
  ThemeColorKey, 
  THEME_PALETTES, 
  BackgroundConfig, 
  AiConfig,
  StoragePathConfig
} from '../services/settingsService';
import { CURRENT_VERSION, checkForUpdates, UpdateInfo } from '../services/updateService';
import { api, isNativePlatform } from '../api/client';
import { Folder, Question } from '../types';

interface UserProfileViewProps {
  questions: Question[];
  folders: Folder[];
  onOpenGitModal: () => void;
  onRefreshData: () => void;
  onCheckUpdate: () => void;
  onBackToQuestions?: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  questions,
  folders,
  onOpenGitModal,
  onRefreshData,
  onCheckUpdate,
  onBackToQuestions,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<UserProfile>(settingsService.getProfile());
  const [themeKey, setThemeKey] = useState<ThemeColorKey>(settingsService.getThemeColor());
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(settingsService.getBackground());
  const [aiConfig, setAiConfig] = useState<AiConfig>(settingsService.getAiConfig());
  const [storagePath, setStoragePath] = useState<StoragePathConfig>(() => settingsService.getStoragePath());
  const [customDirInput, setCustomDirInput] = useState<string>(() => settingsService.getStoragePath().customDirectory);
  const [pathSavedNotice, setPathSavedNotice] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [copyEmailNotice, setCopyEmailNotice] = useState<string | null>(null);

  // Editing profile modal/state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [tempMotto, setTempMotto] = useState(profile.motto);

  // AI test status
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Export / Import status
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const totalCount = questions.length;
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  const dueTodayCount = questions.filter(
    q => !q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= tomorrow
  ).length;
  const masteredCount = questions.filter(q => q.mastery === 'mastered').length;

  const currentTheme = THEME_PALETTES[themeKey] || THEME_PALETTES.blue;

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = settingsService.saveProfile({ avatar: dataUrl });
      setProfile(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle custom background wallpaper upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = settingsService.saveBackground({ imageUrl: dataUrl });
      setBgConfig(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Switch Theme Color
  const handleSelectTheme = (k: ThemeColorKey) => {
    setThemeKey(k);
    settingsService.saveThemeColor(k);
  };

  // Save Name & Motto
  const handleSaveProfile = () => {
    const updated = settingsService.saveProfile({
      name: tempName.trim() || '知微学者',
      motto: tempMotto.trim() || '见微知著，省思改错'
    });
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    setIsEditingName(false);
  };

  // Share Application
  const handleShareApp = async () => {
    const shareData = {
      title: '知微错题本 (ZhiWei Note) - 跨平台本地优先错题复盘神器',
      text: '推荐给你这款超棒的错题本应用！支持iPad/Apple Pencil手写演练、艾宾浩斯复盘算法、LaTeX与代码排版，本地优先且支持 Git 多端同步，完全免费纯净：',
      url: 'https://github.com/xuewexin/zhiwei-notebook'
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n下载地址: ${shareData.url}`);
      setShareNotice('已复制分享推荐文案与下载链接至剪贴板，可直接粘贴发给学友！');
      setTimeout(() => setShareNotice(null), 3500);
    } catch {
      alert('下载地址: https://github.com/xuewexin/zhiwei-notebook');
    }
  };

  // Copy Author Email
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('2792893068@qq.com');
      setCopyEmailNotice('作者邮箱 2792893068@qq.com 已成功复制！');
      setTimeout(() => setCopyEmailNotice(null), 3000);
    } catch {
      alert('作者联系邮箱: 2792893068@qq.com');
    }
  };

  // Directory Picker
  const handlePickDirectory = async () => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        if (handle && handle.name) {
          const selectedPath = isNativePlatform
            ? `Download/${handle.name}`
            : `D:\\${handle.name}`;
          setCustomDirInput(selectedPath);
          const u = settingsService.saveStoragePath({ customDirectory: selectedPath });
          setStoragePath(u);
          setPathSavedNotice(true);
          setTimeout(() => setPathSavedNotice(false), 2500);
          return;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    const nextDir = isNativePlatform ? 'Download/知微错题本' : 'D:\\知微错题库';
    setCustomDirInput(nextDir);
    const u = settingsService.saveStoragePath({ customDirectory: nextDir });
    setStoragePath(u);
    setPathSavedNotice(true);
    setTimeout(() => setPathSavedNotice(false), 2500);
  };

  // Test AI Connection
  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await settingsService.testAiConnection(aiConfig);
      setAiTestResult(res);
    } finally {
      setIsTestingAi(false);
    }
  };

  // Save AI Config on change
  const handleAiChange = (partial: Partial<AiConfig>) => {
    const updated = settingsService.saveAiConfig(partial);
    setAiConfig(updated);
  };

  // Export Backup JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: CURRENT_VERSION,
        exportTime: new Date().toISOString(),
        folders,
        questions,
        profile
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `知微错题本_题库备份_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupNotice('备份文件导出成功！');
      setTimeout(() => setBackupNotice(null), 3000);
    } catch (e: any) {
      alert('导出备份失败: ' + e.message);
    }
  };

  // Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (Array.isArray(data.folders) && Array.isArray(data.questions)) {
          // Store folders & questions via API
          for (const f of data.folders) {
            await api.createFolder(f).catch(() => {});
          }
          for (const q of data.questions) {
            await api.createQuestion(q).catch(() => {});
          }
          setBackupNotice('题库恢复成功！');
          onRefreshData();
          setTimeout(() => setBackupNotice(null), 3000);
        } else {
          alert('备份文件格式不正确，缺少 folders 或 questions 数据');
        }
      } catch (err: any) {
        alert('解析备份文件失败: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* 1. User Profile Header Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${currentTheme.gradient} text-white p-6 sm:p-8 shadow-xl`}>
        {/* Decorative backdrop shapes */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-12 w-36 h-36 bg-blue-300/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with upload trigger */}
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <input 
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-3 border-white/40 shadow-xl bg-white/20 backdrop-blur-md">
              <img 
                src={profile.avatar || '/app-icon.png'} 
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/app-icon.png';
                }}
              />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
              更换照片
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-wide">
                {profile.name}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setTempName(profile.name);
                  setTempMotto(profile.motto);
                  setIsEditingName(true);
                }}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="修改姓名与座右铭"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-lg font-medium leading-relaxed">
              “{profile.motto}”
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4 text-xs">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full font-semibold border border-white/20 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                收录错题: {totalCount} 道
              </span>
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full font-semibold border border-white/20 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                今日待复盘: {dueTodayCount} 题
              </span>
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full font-semibold border border-white/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                完全掌握: {masteredCount} 题
              </span>
            </div>
          </div>
        </div>

        {/* Edit Name & Motto Form Overlay */}
        {isEditingName && (
          <div className="mt-5 pt-4 border-t border-white/20 flex flex-col sm:flex-row gap-3 items-center">
            <input 
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="输入你的姓名/昵称"
              className="w-full sm:w-48 text-xs px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"
            />
            <input 
              type="text"
              value={tempMotto}
              onChange={(e) => setTempMotto(e.target.value)}
              placeholder="输入励志座右铭"
              className="flex-1 text-xs px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="px-3 py-2 bg-white/20 text-white rounded-xl text-xs font-semibold hover:bg-white/30 transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {backupNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* 2. Theme & Appearance Customization */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">软件配置颜色与背景</h3>
            <p className="text-xs text-slate-400">个性化定制学习空间，打造沉浸专注的高颜值界面</p>
          </div>
        </div>

        {/* Theme Color Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
            软件主题主色调
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            {(Object.keys(THEME_PALETTES) as ThemeColorKey[]).map((k) => {
              const pal = THEME_PALETTES[k];
              const isSelected = themeKey === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleSelectTheme(k)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className="w-5 h-5 rounded-full shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: pal.primary }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {pal.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Background Image Wallpaper */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                自定义背景壁纸图片
              </label>
              <span className="text-[11px] text-slate-400">
                可上传自己喜欢的壁纸，背景经过护眼低透明度渲染，不影响公式和文本阅读
              </span>
            </div>
            {bgConfig.imageUrl && (
              <button
                type="button"
                onClick={() => {
                  const updated = settingsService.saveBackground({ imageUrl: '' });
                  setBgConfig(updated);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> 清除壁纸
              </button>
            )}
          </div>

          <input 
            ref={bgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBgUpload}
          />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-purple-600" />
              <span>上传本地背景图片</span>
            </button>

            {bgConfig.imageUrl && (
              <div className="flex-1 flex items-center gap-3 w-full">
                <span className="text-xs text-slate-500 shrink-0">背景不透明度:</span>
                <input 
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.05"
                  value={bgConfig.opacity}
                  onChange={(e) => {
                    const op = parseFloat(e.target.value);
                    const updated = settingsService.saveBackground({ opacity: op });
                    setBgConfig(updated);
                  }}
                  className="flex-1 accent-purple-600 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-10">
                  {Math.round(bgConfig.opacity * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Storage Location & Backup Management */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">文件存储位置与数据管理</h3>
            <p className="text-xs text-slate-400">数据 100% 存储于本地，无第三方中心化窥探</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">当前存储模式:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              本地物理隔离模式 (Local-First)
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">设备存储路径:</span>
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
              {storagePath.customDirectory || (isNativePlatform 
                ? '应用私有加密沙盒 (Android App Sandboxed Storage)' 
                : '%LOCALAPPDATA%\\ZhiWeiNote & IndexedDB')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">错题库容量:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {questions.length} 道错题 · {folders.length} 个分类文件夹
            </span>
          </div>
        </div>

        {/* Custom Storage Directory Setting */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {isNativePlatform ? '📱 手机端本地存储与备份文件夹' : '💻 电脑端本地存储与备份文件夹'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isNativePlatform 
                  ? '支持自定义手机内部存储目录，导出备份与导出错题将自动归档至此目录' 
                  : '支持设置 Windows 电脑本地磁盘目录，数据及备份将自动归档至此目录'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              已启用自定义
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative flex items-center">
              <FolderOpen className="w-4 h-4 text-blue-500 absolute left-3 pointer-events-none" />
              <input 
                type="text"
                value={customDirInput}
                onChange={(e) => setCustomDirInput(e.target.value)}
                placeholder={isNativePlatform ? '例如: Download/知微错题本' : '例如: D:\\知微错题库'}
                className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            
            <button
              type="button"
              onClick={handlePickDirectory}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
              title="点击快捷选择/切换系统目录"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>快捷选择目录</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const updated = settingsService.saveStoragePath({ customDirectory: customDirInput.trim() });
                setStoragePath(updated);
                setPathSavedNotice(true);
                setTimeout(() => setPathSavedNotice(false), 2500);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存路径</span>
            </button>
          </div>

          {pathSavedNotice && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>文件存储目录已更新为: {storagePath.customDirectory}</span>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <span className="text-[10px] text-slate-400 block mb-1.5">常用预设目录（点击即换）:</span>
            <div className="flex flex-wrap gap-1.5">
              {isNativePlatform ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDirInput('Download/知微错题本');
                      const u = settingsService.saveStoragePath({ customDirectory: 'Download/知微错题本' });
                      setStoragePath(u);
                      setPathSavedNotice(true);
                      setTimeout(() => setPathSavedNotice(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer font-mono"
                  >
                    Download/知微错题本
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDirInput('Documents/知微错题本');
                      const u = settingsService.saveStoragePath({ customDirectory: 'Documents/知微错题本' });
                      setStoragePath(u);
                      setPathSavedNotice(true);
                      setTimeout(() => setPathSavedNotice(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer font-mono"
                  >
                    Documents/知微错题本
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDirInput('/storage/emulated/0/Download/ZhiWeiNote');
                      const u = settingsService.saveStoragePath({ customDirectory: '/storage/emulated/0/Download/ZhiWeiNote' });
                      setStoragePath(u);
                      setPathSavedNotice(true);
                      setTimeout(() => setPathSavedNotice(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer font-mono"
                  >
                    /storage/emulated/0/Download/ZhiWeiNote
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDirInput('D:\\知微错题库');
                      const u = settingsService.saveStoragePath({ customDirectory: 'D:\\知微错题库' });
                      setStoragePath(u);
                      setPathSavedNotice(true);
                      setTimeout(() => setPathSavedNotice(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer font-mono"
                  >
                    D:\知微错题库
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDirInput('E:\\我的错题本');
                      const u = settingsService.saveStoragePath({ customDirectory: 'E:\\我的错题本' });
                      setStoragePath(u);
                      setPathSavedNotice(true);
                      setTimeout(() => setPathSavedNotice(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer font-mono"
                  >
                    E:\我的错题本
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDirInput('%LOCALAPPDATA%\\ZhiWeiNote');
                      const u = settingsService.saveStoragePath({ customDirectory: '%LOCALAPPDATA%\\ZhiWeiNote' });
                      setStoragePath(u);
                      setPathSavedNotice(true);
                      setTimeout(() => setPathSavedNotice(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 cursor-pointer font-mono"
                  >
                    系统默认应用目录
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Backup & Restore Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-bold border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>导出题库全量备份 (.json)</span>
          </button>

          <input 
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportBackup}
          />

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-amber-500" />
            <span>导入恢复错题库</span>
          </button>

          <button
            type="button"
            onClick={onOpenGitModal}
            className="flex items-center justify-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-2xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
          >
            <GitBranch className="w-4 h-4 text-indigo-500" />
            <span>Git 云端仓库同步设置</span>
          </button>
        </div>
      </div>

      {/* 4. AI Assistant API Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                AI 智能助教与复习规划接口
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                  API 接口
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                支持直连 DeepSeek、OpenAI、Kimi、通义千问等，APK 本地纯客户端发起，零服务器中转
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={aiConfig.enabled}
              onChange={(e) => handleAiChange({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {aiConfig.enabled ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  API 接口地址 (Base URL)
                </label>
                <input 
                  type="text"
                  value={aiConfig.baseUrl}
                  onChange={(e) => handleAiChange({ baseUrl: e.target.value })}
                  placeholder="例如: https://api.deepseek.com/v1"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  模型名称 (Model)
                </label>
                <input 
                  type="text"
                  value={aiConfig.model}
                  onChange={(e) => handleAiChange({ model: e.target.value })}
                  placeholder="例如: deepseek-chat 或 gpt-4o-mini"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API 密钥 (API Key)
              </label>
              <div className="relative">
                <input 
                  type={showApiKey ? 'text' : 'password'}
                  value={aiConfig.apiKey}
                  onChange={(e) => handleAiChange({ apiKey: e.target.value })}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full text-xs pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* AI Features Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
                <input 
                  type="checkbox"
                  checked={aiConfig.autoAnalyzeErrorCauses}
                  onChange={(e) => handleAiChange({ autoAnalyzeErrorCauses: e.target.checked })}
                  className="accent-blue-600"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">错题错因智能诊断</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
                <input 
                  type="checkbox"
                  checked={aiConfig.autoStudyPlan}
                  onChange={(e) => handleAiChange({ autoStudyPlan: e.target.checked })}
                  className="accent-blue-600"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">个性化复习规划排期</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
                <input 
                  type="checkbox"
                  checked={aiConfig.autoClassify}
                  onChange={(e) => handleAiChange({ autoClassify: e.target.checked })}
                  className="accent-blue-600"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">智能整理科目分类</span>
              </label>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestAi}
                disabled={isTestingAi}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin' : ''}`} />
                <span>{isTestingAi ? '正在测试连接中...' : '测试 API 连通性'}</span>
              </button>

              {aiTestResult && (
                <span className={`text-xs font-semibold ${aiTestResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {aiTestResult.message}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>AI 智能助教当前未开启。开启后可在做题详情页一键剖析错因并获得专属解法推导建议。</span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">点击右上角开启</span>
          </div>
        )}
      </div>

      {/* 5. Software, Version & Author Info */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">软件信息、作者与版本</h3>
            <p className="text-xs text-slate-400">关于知微错题本官方团队与最新版本号</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-500">软件全称:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">知微错题本 (ZhiWei Note)</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-500">当前版本号:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">v{CURRENT_VERSION} (最新旗舰版)</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-500">作者与团队:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">xuewexin · 知微工作室</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-500">开源协议:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">MIT Open Source</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <a
            href="https://github.com/xuewexin/zhiwei-notebook"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>GitHub 官方仓库地址 (xuewexin/zhiwei-notebook)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onCheckUpdate}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>检测最新版本 (比对官方 Release)</span>
          </button>
        </div>
      </div>

      {/* 6. Contact Author, Feedback & Share */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">联系作者与问题反馈</h3>
              <p className="text-xs text-slate-400">有任何使用疑问、Bug 报错或改进建议，欢迎随时反馈</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShareApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="向好友或同学分享本软件"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>向学友分享</span>
          </button>
        </div>

        {shareNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{shareNotice}</span>
          </div>
        )}

        {copyEmailNotice && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-blue-600" />
            <span>{copyEmailNotice}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                📮 作者唯一官方反馈邮箱
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
                2792893068@qq.com
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>复制邮箱</span>
              </button>

              <a
                href="mailto:2792893068@qq.com?subject=【知微错题本】使用反馈与建议"
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>立即发送邮件</span>
              </a>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-700/60">
            提示：在使用过程中如遇到手写板压感异常、同步连接错误或移动端界面适配问题，可随时将截图或操作步骤发至上述邮箱，作者将竭诚排查并持续发布优化更新！
          </p>
        </div>
      </div>
    </div>
  );
};
