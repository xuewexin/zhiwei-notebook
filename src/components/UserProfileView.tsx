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
  Copy,
  X,
  Smartphone,
  Laptop,
  ChevronDown
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
import { CURRENT_VERSION } from '../services/updateService';
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
  onBackgroundUpdated?: (bg: BackgroundConfig) => void;
  onThemeUpdated?: (theme: ThemeColorKey) => void;
}

// Compress wallpaper image via Canvas to fit strictly within LocalStorage limits (~150KB)
const compressImageForWallpaper = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取背景图片文件失败'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('解析背景图片数据失败'));
      img.onload = () => {
        try {
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  questions,
  folders,
  onOpenGitModal,
  onRefreshData,
  onCheckUpdate,
  onBackToQuestions,
  onProfileUpdated,
  onBackgroundUpdated,
  onThemeUpdated
}) => {
  const [profile, setProfile] = useState<UserProfile>(settingsService.getProfile());
  const [themeKey, setThemeKey] = useState<ThemeColorKey>(settingsService.getThemeColor());
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(settingsService.getBackground());
  const [aiConfig, setAiConfig] = useState<AiConfig>(settingsService.getAiConfig());
  const [storagePath, setStoragePath] = useState<StoragePathConfig>(() => settingsService.getStoragePath());
  const [customDirInput, setCustomDirInput] = useState<string>(() => settingsService.getStoragePath().customDirectory);
  const [pathSavedNotice, setPathSavedNotice] = useState(false);
  const [bgUploadNotice, setBgUploadNotice] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [copyEmailNotice, setCopyEmailNotice] = useState<string | null>(null);

  // All settings sections are collapsed by default as requested by user
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    theme: false,
    background: false,
    storage: false,
    ai: false,
    version: false,
    contact: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
  const nativeFolderInputRef = useRef<HTMLInputElement>(null);

  // Sync state with settings
  useEffect(() => {
    setProfile(settingsService.getProfile());
    setThemeKey(settingsService.getThemeColor());
    setBgConfig(settingsService.getBackground());
    setAiConfig(settingsService.getAiConfig());
    setStoragePath(settingsService.getStoragePath());
  }, []);

  const currentTheme = THEME_PALETTES[themeKey] || THEME_PALETTES.blue;

  // Handle Avatar Upload with Canvas compression
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageForWallpaper(file);
      const updated = settingsService.saveProfile({ avatar: dataUrl });
      setProfile(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch {
      alert('上传头像失败，请重试');
    }
  };

  // Handle Background Upload with Canvas compression
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageForWallpaper(file);
      const updated = settingsService.saveBackground({ 
        imageUrl: dataUrl,
        opacity: bgConfig.opacity || 0.18
      });
      setBgConfig(updated);
      if (onBackgroundUpdated) {
        onBackgroundUpdated(updated);
      }
      setBgUploadNotice('背景壁纸已成功保存');
      setTimeout(() => setBgUploadNotice(null), 3000);
    } catch {
      alert('处理背景壁纸失败，请重试');
    }
  };

  // Remove background
  const handleClearBackground = () => {
    const updated = settingsService.saveBackground({ imageUrl: '' });
    setBgConfig(updated);
    if (onBackgroundUpdated) {
      onBackgroundUpdated(updated);
    }
  };

  // Update background opacity
  const handleOpacityChange = (op: number) => {
    const updated = settingsService.saveBackground({ opacity: op });
    setBgConfig(updated);
    if (onBackgroundUpdated) {
      onBackgroundUpdated(updated);
    }
  };

  // Switch Theme
  const handleThemeChange = (k: ThemeColorKey) => {
    setThemeKey(k);
    settingsService.saveThemeColor(k);
    if (onThemeUpdated) {
      onThemeUpdated(k);
    }
  };

  // Directly trigger system native folder picker on click
  const handlePickDirectory = async () => {
    // 1. Windows Native Host (WebView2 WinForms FolderBrowserDialog)
    const host = (window as any).chrome?.webview?.hostObjects?.nativeHost;
    if (host && typeof host.PickFolder === 'function') {
      try {
        const picked = await host.PickFolder(customDirInput || '');
        if (picked) {
          handleApplyDirectory(picked);
          return;
        }
      } catch (err) {
        console.warn('Windows native folder pick error:', err);
      }
    }

    // 2. Android Native Bridge (SAF ACTION_OPEN_DOCUMENT_TREE)
    const androidBridge = (window as any).AndroidNativeBridge;
    if (androidBridge && typeof androidBridge.pickFolder === 'function') {
      try {
        (window as any).onAndroidFolderSelected = (path: string) => {
          if (path) {
            handleApplyDirectory(path);
          }
        };
        androidBridge.pickFolder();
        return;
      } catch (err) {
        console.warn('Android SAF pick error:', err);
      }
    }

    // 3. Modern Web standard showDirectoryPicker
    if (typeof (window as any).showDirectoryPicker === 'function') {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        if (dirHandle && dirHandle.name) {
          handleApplyDirectory(dirHandle.name);
          return;
        }
      } catch {}
    }

    // 4. Fallback HTML5 directory input
    if (nativeFolderInputRef.current) {
      nativeFolderInputRef.current.click();
    }
  };

  const handleApplyDirectory = (dir: string) => {
    if (!dir) return;
    const clean = dir.trim();
    setCustomDirInput(clean);
    const updated = settingsService.saveStoragePath({ customDirectory: clean });
    setStoragePath(updated);
    setPathSavedNotice(true);
    setTimeout(() => setPathSavedNotice(false), 3000);
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

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareNotice('分享成功！感谢支持知微错题本');
        setTimeout(() => setShareNotice(null), 3000);
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      setShareNotice('已复制分享推荐语与 GitHub 链接至剪贴板');
      setTimeout(() => setShareNotice(null), 3000);
    } catch {
      alert(`分享链接: ${shareData.url}`);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('2792893068@qq.com');
      setCopyEmailNotice('已复制作者邮箱 (2792893068@qq.com) 至剪贴板');
      setTimeout(() => setCopyEmailNotice(null), 3000);
    } catch {
      alert('作者邮箱: 2792893068@qq.com');
    }
  };

  // AI Config Save
  const handleAiChange = (partial: Partial<AiConfig>) => {
    const updated = settingsService.saveAiConfig(partial);
    setAiConfig(updated);
  };

  // Test AI Connection
  const handleTestAi = async () => {
    if (!aiConfig.apiKey) {
      setAiTestResult({ success: false, message: '请先填写 API Key 密钥' });
      return;
    }
    setIsTestingAi(true);
    setAiTestResult(null);

    try {
      const url = `${aiConfig.baseUrl.replace(/\/+$/, '')}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model || 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful educational tutor.' },
            { role: 'user', content: '你好！请回复一句话测试连接。' }
          ],
          max_tokens: 50
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 100)}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '连接成功！';
      setAiTestResult({ success: true, message: `接口测试成功！助教回复: "${reply.trim()}"` });
    } catch (err: any) {
      setAiTestResult({ success: false, message: `连接失败: ${err.message || '请检查 Base URL 与 Key'}` });
    } finally {
      setIsTestingAi(false);
    }
  };

  // Full Export JSON
  const handleExportBackup = () => {
    const backupData = {
      version: CURRENT_VERSION,
      exportTime: new Date().toISOString(),
      folders,
      questions,
      profile,
      storagePath
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `知微错题本_题库备份_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupNotice('全量错题备份 JSON 文件已成功生成并导出！');
    setTimeout(() => setBackupNotice(null), 3000);
  };

  // Full Import JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.folders) && Array.isArray(parsed.questions)) {
          if (!confirm(`备份包含 ${parsed.folders.length} 个分类和 ${parsed.questions.length} 道错题，确认导入并合并/恢复到当前错题库吗？`)) {
            return;
          }
          localStorage.setItem('zhiwei_folders', JSON.stringify(parsed.folders));
          localStorage.setItem('zhiwei_questions', JSON.stringify(parsed.questions));
          if (parsed.profile) {
            settingsService.saveProfile(parsed.profile);
            setProfile(parsed.profile);
          }
          setBackupNotice(`成功恢复 ${parsed.questions.length} 道错题与分类数据！正在刷新...`);
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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 pb-20 animate-fade-in">
      {/* 1. User Profile Header Card - Pure Solid Color, No Gradient */}
      <div 
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-sm"
        style={{ backgroundColor: currentTheme.primary }}
      >
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-white/40 shadow-sm bg-white/20 backdrop-blur-md">
              <img 
                src={profile.avatar || '/app-icon.png'} 
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/app-icon.png';
                }}
              />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-semibold">
              更换头像
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {profile.name}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setTempName(profile.name);
                    setTempMotto(profile.motto);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white/90"
                  title="修改昵称与座右铭"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Stats badges */}
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
                  {folders.length} 个分类笔记本
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
                  {questions.length} 道错题记录
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/85 max-w-xl font-medium">
              "{profile.motto}"
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-white/75">
              <span>研习加入时间: {profile.joinDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                数据纯本地加密存储
              </span>
            </div>
          </div>
        </div>

        {/* Edit profile inline modal */}
        {isEditingName && (
          <div className="mt-5 p-4 rounded-2xl bg-black/30 border border-white/20 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1">用户昵称</label>
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="输入昵称"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1">座右铭 / 励志寄语</label>
                <input 
                  type="text" 
                  value={tempMotto}
                  onChange={(e) => setTempMotto(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="输入座右铭"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsEditingName(false)}
                className="px-3 py-1.5 rounded-lg text-xs hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-white/90 transition-colors cursor-pointer"
              >
                保存修改
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Status Notices */}
      {backupNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* Collapsible Section 1: 界面外观与主题配色 (Default Collapsed) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('theme')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-2xl text-white shrink-0"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">界面外观与主题配色</h3>
              <p className="text-xs text-slate-400">当前主题: {currentTheme.name} · 点击展开切换 6 款经典纯色</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
              openSections.theme ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {openSections.theme && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {(Object.keys(THEME_PALETTES) as ThemeColorKey[]).map((k) => {
                const item = THEME_PALETTES[k];
                const isActive = themeKey === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleThemeChange(k)}
                    className={`relative p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-22 cursor-pointer shadow-2xs ${
                      isActive 
                        ? 'ring-2 bg-slate-50 dark:bg-slate-800 border-transparent shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                    style={isActive ? { ringColor: item.primary } : {}}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-xs"
                      style={{ backgroundColor: item.primary }}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.primary}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Collapsible Section 2: 个性化背景壁纸 (Default Collapsed) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('background')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">个性化背景壁纸</h3>
              <p className="text-xs text-slate-400">
                {bgConfig.imageUrl ? '已启用自定义背景壁纸' : '未设置壁纸 · 支持上传本地图片'}
              </p>
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
              openSections.background ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {openSections.background && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4 animate-fade-in">
            <input 
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBgUpload}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{bgConfig.imageUrl ? '更换本地背景图片' : '上传本地背景图片'}</span>
              </button>

              {bgConfig.imageUrl && (
                <button
                  type="button"
                  onClick={handleClearBackground}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清除背景</span>
                </button>
              )}
            </div>

            {bgConfig.imageUrl && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    背景透明度: {Math.round((bgConfig.opacity || 0.15) * 100)}%
                  </span>
                  <span className="text-[10px] text-slate-400">推荐 15%~25% 护眼且不影响阅读公式</span>
                </div>
                <input 
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.02"
                  value={bgConfig.opacity || 0.15}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            )}

            {bgUploadNotice && (
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-medium">
                <Check className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{bgUploadNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Collapsible Section 3: 文件存储与数据备份 (Only Essential Part) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('storage')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">文件存储与数据备份</h3>
              <p className="text-xs text-slate-400">
                目录: {storagePath.customDirectory || '默认本地路径'} · 备份与同步
              </p>
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
              openSections.storage ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {openSections.storage && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4 animate-fade-in">
            {/* Folder Location Setting */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-slate-500" />
                  <span>文件夹位置设置</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {questions.length} 道错题 · {folders.length} 个分类
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Hidden native input for webkitdirectory */}
                <input
                  ref={nativeFolderInputRef}
                  type="file"
                  // @ts-ignore
                  webkitdirectory="true"
                  directory="true"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const relative = files[0].webkitRelativePath || '';
                      const folderName = relative.split('/')[0] || relative.split('\\')[0];
                      if (folderName) {
                        handleApplyDirectory(folderName);
                      }
                    }
                  }}
                />

                <div className="flex-1 relative flex items-center">
                  <FolderOpen className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input 
                    type="text"
                    value={customDirInput}
                    onChange={(e) => setCustomDirInput(e.target.value)}
                    placeholder={isNativePlatform ? '例如: Download/知微错题本' : '例如: D:\\知微错题本数据'}
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 font-medium"
                    style={{ outlineColor: currentTheme.primary }}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handlePickDirectory}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 flex items-center justify-center gap-1.5"
                  title="调起系统文件夹浏览窗口选择目录"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>选择文件夹</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updated = settingsService.saveStoragePath({ customDirectory: customDirInput.trim() });
                    setStoragePath(updated);
                    setPathSavedNotice(true);
                    setTimeout(() => setPathSavedNotice(false), 2500);
                  }}
                  className="px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存路径</span>
                </button>
              </div>

              {pathSavedNotice && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in pt-0.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>存储路径已成功保存: {storagePath.customDirectory}</span>
                </div>
              )}
            </div>

            {/* Backup, Restore & Sync Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>导出题库备份 (.json)</span>
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
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                <FileJson className="w-4 h-4 text-amber-500" />
                <span>导入恢复题库 (.json)</span>
              </button>

              <button
                type="button"
                onClick={onOpenGitModal}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                <GitBranch className="w-4 h-4 text-emerald-500" />
                <span>Git 云端同步设置</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Collapsible Section 4: AI 智能助教接口 (Default Collapsed) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('ai')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI 智能助教与复习规划接口</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  aiConfig.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {aiConfig.enabled ? '已启用' : '未开启'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">支持直连 DeepSeek / OpenAI / Kimi API</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
              openSections.ai ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {openSections.ai && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                开启 AI 智能错题分析与计划助教
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={aiConfig.enabled}
                  onChange={(e) => handleAiChange({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {aiConfig.enabled && (
              <div className="space-y-3.5 animate-fade-in">
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
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
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
                      placeholder="例如: deepseek-chat"
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    API Key 授权密钥 (本地纯客户端存储)
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value={aiConfig.apiKey}
                      onChange={(e) => handleAiChange({ apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full text-xs px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTestAi}
                    disabled={isTestingAi}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {isTestingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{isTestingAi ? '正在测试连通性...' : '测试 API 连通性'}</span>
                  </button>
                </div>

                {aiTestResult && (
                  <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in ${
                    aiTestResult.success 
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {aiTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{aiTestResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Collapsible Section 5: 关于知微错题本与更新 (Default Collapsed) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('version')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>关于知微错题本</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  v{CURRENT_VERSION}
                </span>
              </h3>
              <p className="text-xs text-slate-400">官方版本信息与 Release 比对更新</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
              openSections.version ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {openSections.version && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4 animate-fade-in">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">应用软件名称:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">知微错题本 (ZhiWei Note)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">当前已安装版本:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">v{CURRENT_VERSION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-400">软件核心设计:</span>
                <span className="text-slate-700 dark:text-slate-300">本地优先 · 护眼纯色 · 艾宾浩斯复盘</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <a
                href="https://github.com/xuewexin/zhiwei-notebook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>GitHub 官方仓库地址 (xuewexin/zhiwei-notebook)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={onCheckUpdate}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>检测最新版本 (比对官方 Release)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Collapsible Section 6: 联系作者与问题反馈 (Default Collapsed) */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('contact')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">联系作者与问题反馈</h3>
              <p className="text-xs text-slate-400">官方邮箱: 2792893068@qq.com · 向学友分享</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
              openSections.contact ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {openSections.contact && (
          <div className="px-5 pb-6 sm:px-6 sm:pb-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3.5 animate-fade-in">
            {shareNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shareNotice}</span>
              </div>
            )}

            {copyEmailNotice && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{copyEmailNotice}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-0.5">
                  <Mail className="w-4 h-4 text-rose-500" />
                  <span>作者唯一官方反馈邮箱</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 select-all">
                  2792893068@qq.com
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制邮箱</span>
                </button>

                <a
                  href="mailto:2792893068@qq.com?subject=【知微错题本】使用反馈与建议"
                  className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>发邮件反馈</span>
                </a>

                <button
                  type="button"
                  onClick={handleShareApp}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ml-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>分享软件</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
