import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowUpCircle, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { UpdateInfo, setVersionIgnored } from '../services/updateService';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, isOpen, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [ignoreThisVersion, setIgnoreThisVersion] = useState(false);

  if (!isOpen) return null;

  // Determine current platform
  const isWindows = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent || '');
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
  const isApple = typeof navigator !== 'undefined' && /iphone|ipad|ipod|mac/i.test(navigator.userAgent || '');

  const handleDismiss = () => {
    if (ignoreThisVersion) {
      setVersionIgnored(updateInfo.latestVersion);
    }
    onClose();
  };

  const handleDirectUpdate = () => {
    setIsUpdating(true);

    let targetUrl = updateInfo.htmlUrl;

    if (isWindows && updateInfo.windowsExeUrl) {
      targetUrl = updateInfo.windowsExeUrl;
    } else if (isAndroid && updateInfo.androidApkUrl) {
      targetUrl = updateInfo.androidApkUrl;
    } else if (isApple && updateInfo.ipadIpaUrl) {
      targetUrl = updateInfo.ipadIpaUrl;
    }

    // Trigger download or open release URL
    const a = document.createElement('a');
    a.href = targetUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // If ServiceWorker is active, refresh caches
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const reg of regs) {
          reg.update();
        }
      });
    }

    setTimeout(() => {
      setIsUpdating(false);
      setUpdateSuccess(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Gradient Accent */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white overflow-hidden">
          {/* Background decorative circles */}
          <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute left-1/3 -top-12 w-28 h-28 bg-blue-400/20 rounded-full blur-lg pointer-events-none" />

          <button
            onClick={handleDismiss}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200 block">
                Official Release
              </span>
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                发现全新版本
              </h3>
            </div>
          </div>

          {/* Version Comparison Pill */}
          <div className="mt-3 flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full w-fit text-sm">
            <span className="text-blue-200 font-medium">当前 v{updateInfo.currentVersion}</span>
            <span className="text-white/60">➔</span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              最新 v{updateInfo.latestVersion}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Data Protection Banner */}
          <div className="flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">覆盖更新保障 · 个人数据 100% 零风险</span>
              <p className="text-emerald-700 dark:text-emerald-400/90 leading-relaxed text-xs">
                系统采用数据与程序分离架构，软件更新仅替换前端应用内核，你的所有学科分类、错题手稿、心得笔记与 Git 配置将完好无损地保留在本地！
              </p>
            </div>
          </div>

          {/* Release Notes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              更新内容与改进
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-sans">
              {updateInfo.releaseNotes}
            </div>
          </div>

          {updateSuccess && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>新版本安装文件已开始下载！下载完成后直接打开安装包覆盖即可完成升级。</span>
            </div>
          )}

          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer pt-1 select-none">
            <input 
              type="checkbox"
              checked={ignoreThisVersion}
              onChange={(e) => setIgnoreThisVersion(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>暂不提醒此版本 (v{updateInfo.latestVersion})</span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm transition-colors"
          >
            暂不更新
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={updateInfo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="查看 GitHub 发布页"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleDirectUpdate}
              disabled={isUpdating}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-medium text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在获取更新...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>立即覆盖更新</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
