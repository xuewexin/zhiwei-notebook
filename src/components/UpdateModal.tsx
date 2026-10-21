import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowUpCircle, 
  ShieldCheck, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  RefreshCw,
  HardDrive,
  Copy,
  Globe,
  Smartphone,
  Laptop,
  Check,
  Compass
} from 'lucide-react';
import { UpdateInfo, setVersionIgnored } from '../services/updateService';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  isOpen: boolean;
  onClose: () => void;
}

// Trusted fast CDN mirrors for GitHub releases in mainland China
const MIRROR_NODES = [
  { id: 'ghfast', name: '极速加速源 1 (ghfast 推荐)', prefix: 'https://ghfast.top/' },
  { id: 'ghproxy', name: '备用加速源 2 (ghproxy)', prefix: 'https://ghproxy.net/' },
  { id: 'direct', name: 'GitHub 官方源 (海外/直连)', prefix: '' },
];

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, isOpen, onClose }) => {
  const [hasLaunchedBrowser, setHasLaunchedBrowser] = useState(false);
  const [selectedMirror, setSelectedMirror] = useState('ghfast');
  const [ignoreThisVersion, setIgnoreThisVersion] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen) return null;

  // Determine current platform
  const isWindows = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent || '');
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
  const isApple = typeof navigator !== 'undefined' && /iphone|ipad|ipod|mac/i.test(navigator.userAgent || '');

  const getPlatformPackageName = () => {
    if (isAndroid) return 'zhiwei-notebook-android.apk';
    if (isWindows) return 'zhiwei-notebook-windows.exe';
    if (isApple) return 'zhiwei-notebook-ipad.ipa';
    return '知微错题本最新安装包';
  };

  const getRawDownloadUrl = () => {
    if (isWindows && updateInfo.windowsExeUrl) return updateInfo.windowsExeUrl;
    if (isAndroid && updateInfo.androidApkUrl) return updateInfo.androidApkUrl;
    if (isApple && updateInfo.ipadIpaUrl) return updateInfo.ipadIpaUrl;
    return updateInfo.htmlUrl;
  };

  const getActiveDownloadUrl = () => {
    const raw = getRawDownloadUrl();
    const mirror = MIRROR_NODES.find(m => m.id === selectedMirror);
    if (!mirror || !mirror.prefix) return raw;
    return `${mirror.prefix}${raw}`;
  };

  // Safe external browser launcher across Android / Windows / Web
  const launchExternalBrowser = (targetUrl: string) => {
    if (!targetUrl) return;

    // 1. Android Native Bridge
    const androidBridge = (window as any).AndroidNativeBridge;
    if (androidBridge && typeof androidBridge.openInBrowser === 'function') {
      try {
        androidBridge.openInBrowser(targetUrl);
        return;
      } catch (e) {
        console.warn('Android native bridge call failed:', e);
      }
    }

    // 2. Windows Native Host Bridge
    const winHost = (window as any).chrome?.webview?.hostObjects?.nativeHost;
    if (winHost && typeof winHost.OpenUrl === 'function') {
      try {
        winHost.OpenUrl(targetUrl);
        return;
      } catch (e) {
        console.warn('Windows native host call failed:', e);
      }
    }

    // 3. Fallback standard browser window
    try {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 100);
    } catch {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStartUpdate = () => {
    const finalUrl = getActiveDownloadUrl();
    launchExternalBrowser(finalUrl);
    setHasLaunchedBrowser(true);
  };

  const handleOpenReleasePage = () => {
    launchExternalBrowser(updateInfo.htmlUrl);
  };

  const handleCopyLink = async () => {
    const url = getActiveDownloadUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    } catch {
      alert('下载链接: ' + url);
    }
  };

  const handleDismiss = () => {
    if (ignoreThisVersion) {
      setVersionIgnored(updateInfo.latestVersion);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Morandi Scholar Tone */}
        <div className="relative bg-gradient-to-r from-[#344d67] via-[#416788] to-[#4a637d] p-6 text-white overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl shadow-inner text-amber-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-200 block">
                ZhiWei Note Updates
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                发现软件新版本
              </h3>
            </div>
          </div>

          {/* Version Comparison Pill */}
          <div className="mt-3 flex items-center gap-2.5 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-full w-fit text-xs font-mono">
            <span className="text-slate-300">当前版本 v{updateInfo.currentVersion}</span>
            <span className="text-white/50">➔</span>
            <span className="text-amber-200 font-bold flex items-center gap-1">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              最新版本 v{updateInfo.latestVersion}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Data Protection Guarantee */}
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-700 dark:text-slate-300 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                数据与程序物理隔离 · 覆盖安装 100% 零风险
              </span>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                软件采用纯本地存储架构，更新仅替换程序本身，您的所有错题手稿、分类目录、写题心得与用户配置均完整保留在设备本地！
              </p>
            </div>
          </div>

          {/* External Browser Launched Notice Panel */}
          {hasLaunchedBrowser && (
            <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>已调起外部系统浏览器执行下载！</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                {isAndroid 
                  ? '手机系统默认浏览器已接管下载。请在浏览器中允许下载，下载完成后直接点击该 APK 即可覆盖升级。'
                  : '系统默认浏览器已打开并开始下载最新安装包。下载完成后直接运行安装即可平滑升级。'}
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                <span>若外部浏览器未自动弹出，可点击下方【再次调起】或【复制直链】手动在浏览器打开。</span>
              </div>
            </div>
          )}

          {/* Release Notes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              更新日志与改进细节
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto font-sans">
              {updateInfo.releaseNotes}
            </div>
          </div>

          {/* Download Mirror Selector & Options */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>下载加速源:</span>
              <select
                value={selectedMirror}
                onChange={(e) => setSelectedMirror(e.target.value)}
                className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
              >
                {MIRROR_NODES.map(node => (
                  <option key={node.id} value={node.id}>{node.name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotice ? '已复制直链' : '复制下载直链'}</span>
            </button>
          </div>

          {/* Ignore Version Checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 cursor-pointer pt-1 select-none">
            <input 
              type="checkbox"
              checked={ignoreThisVersion}
              onChange={(e) => setIgnoreThisVersion(e.target.checked)}
              className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 w-3.5 h-3.5"
            />
            <span>暂不提醒此版本 (v{updateInfo.latestVersion})</span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            稍后提醒
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenReleasePage}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="通过外部浏览器打开 GitHub 发布页"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartUpdate}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#416788] hover:bg-[#34526d] active:scale-95 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{hasLaunchedBrowser ? '再次调起外部浏览器下载' : '调起外部浏览器更新'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
