import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowUpCircle, 
  ShieldCheck, 
  ExternalLink, 
  X, 
  HardDrive, 
  Copy, 
  Check, 
  Globe,
  Info
} from 'lucide-react';
import { UpdateInfo, setVersionIgnored } from '../services/updateService';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, isOpen, onClose }) => {
  const [ignoreThisVersion, setIgnoreThisVersion] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen) return null;

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

  const handleOpenReleasePage = () => {
    launchExternalBrowser(updateInfo.htmlUrl);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(updateInfo.htmlUrl);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    } catch {
      alert('发行页地址: ' + updateInfo.htmlUrl);
    }
  };

  const handleDismiss = () => {
    if (ignoreThisVersion) {
      setVersionIgnored(updateInfo.latestVersion);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Pure Solid Scholar Color, No Gradient */}
        <div className="relative bg-[#1e56a0] p-6 text-white overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/15 rounded-2xl shadow-inner text-amber-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 block">
                ZhiWei Note Updates
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                发现软件新版本
              </h3>
            </div>
          </div>

          {/* Version Comparison Pill */}
          <div className="mt-3 flex items-center gap-2.5 bg-black/25 px-3.5 py-1.5 rounded-full w-fit text-xs font-mono">
            <span className="text-slate-200">当前版本 v{updateInfo.currentVersion}</span>
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
                数据与程序物理隔离 · 覆盖安装零风险
              </span>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                软件采用纯本地存储架构，更新仅替换程序本身，您的所有错题手稿、分类目录、写题心得与用户配置均完整保留在设备本地！
              </p>
            </div>
          </div>

          {/* Direct Release Page Instructions */}
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-[#1e56a0] dark:text-[#60a5fa] text-xs font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>官方发行页面直接安装</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              点击下方按钮将通过系统默认浏览器打开 GitHub Releases 官方版本发行页面，可根据您的设备（Android APK / Windows EXE / iPad IPA）直接下载安装。
            </p>
          </div>

          {/* Release Notes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              更新日志与改进细节
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-sans">
              {updateInfo.releaseNotes}
            </div>
          </div>

          {/* Ignore Version Checkbox */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={ignoreThisVersion}
                onChange={(e) => setIgnoreThisVersion(e.target.checked)}
                className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 w-3.5 h-3.5"
              />
              <span>暂不提醒此版本 (v{updateInfo.latestVersion})</span>
            </label>

            <button
              type="button"
              onClick={handleCopyLink}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotice ? '已复制链接' : '复制发行页链接'}</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer"
          >
            稍后提醒
          </button>

          <button
            onClick={handleOpenReleasePage}
            className="w-full sm:w-auto flex-1 px-6 py-2.5 rounded-xl bg-[#1e56a0] hover:bg-[#16427d] active:scale-95 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>前往 GitHub 官方版本发行页</span>
          </button>
        </div>
      </div>
    </div>
  );
};
