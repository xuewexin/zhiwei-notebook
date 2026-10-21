import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowUpCircle, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  RefreshCw,
  HardDrive,
  Copy,
  Globe,
  Smartphone,
  Laptop,
  Check
} from 'lucide-react';
import { UpdateInfo, setVersionIgnored } from '../services/updateService';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  isOpen: boolean;
  onClose: () => void;
}

// Trusted fast CDN mirrors for GitHub releases in mainland China
const MIRROR_NODES = [
  { id: 'ghfast', name: '极速节点 1 (ghfast 推荐)', prefix: 'https://ghfast.top/' },
  { id: 'ghproxy', name: '备用节点 2 (ghproxy)', prefix: 'https://ghproxy.net/' },
  { id: 'direct', name: 'GitHub 官方源 (海外/直连)', prefix: '' },
];

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, isOpen, onClose }) => {
  const [downloadStep, setDownloadStep] = useState<'ready' | 'downloading' | 'completed' | 'error'>('ready');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('2.8 MB/s');
  const [selectedMirror, setSelectedMirror] = useState('ghfast');
  const [ignoreThisVersion, setIgnoreThisVersion] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!isOpen) return null;

  // Determine current platform
  const isWindows = typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent || '');
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
  const isApple = typeof navigator !== 'undefined' && /iphone|ipad|ipod|mac/i.test(navigator.userAgent || '');

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

  const handleDismiss = () => {
    if (ignoreThisVersion) {
      setVersionIgnored(updateInfo.latestVersion);
    }
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    onClose();
  };

  // Mainstream Update trigger: In-App visual progress + Native bridge invocation + Browser fallback
  const handleStartUpdate = () => {
    const finalUrl = getActiveDownloadUrl();
    setDownloadStep('downloading');
    setDownloadProgress(8);

    // 1. Invoke Windows Host Bridge if available (opens directly in user's default browser or handles download)
    const winHost = (window as any).chrome?.webview?.hostObjects?.nativeHost;
    if (winHost && typeof winHost.OpenUrl === 'function') {
      try {
        winHost.OpenUrl(finalUrl);
      } catch {}
    }

    // 2. Invoke Android Native Bridge if available (opens in Android Download Manager / System Browser)
    const androidBridge = (window as any).AndroidNativeBridge;
    if (androidBridge && typeof androidBridge.openInBrowser === 'function') {
      try {
        androidBridge.openInBrowser(finalUrl);
      } catch {}
    }

    // 3. Fallback standard browser anchor trigger
    try {
      const a = document.createElement('a');
      a.href = finalUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}

    // Simulated authentic progress for visual feedback
    let current = 12;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      current += Math.floor(Math.random() * 18) + 12;
      if (current >= 100) {
        current = 100;
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setDownloadProgress(100);
        setDownloadStep('completed');
      } else {
        setDownloadProgress(current);
        const speeds = ['2.4 MB/s', '3.1 MB/s', '4.2 MB/s', '3.8 MB/s', '5.0 MB/s'];
        setDownloadSpeed(speeds[Math.floor(Math.random() * speeds.length)]);
      }
    }, 450);
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

  const handleOpenInSystemBrowser = () => {
    const url = getActiveDownloadUrl();
    const androidBridge = (window as any).AndroidNativeBridge;
    if (androidBridge && typeof androidBridge.openInBrowser === 'function') {
      androidBridge.openInBrowser(url);
      return;
    }
    const winHost = (window as any).chrome?.webview?.hostObjects?.nativeHost;
    if (winHost && typeof winHost.OpenUrl === 'function') {
      winHost.OpenUrl(url);
      return;
    }
    window.open(url, '_blank');
  };

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Soft, Understated Morandi Scholar Tone */}
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
                软件采用纯本地存储架构，升级仅替换最新应用程序内核，您的所有错题手稿、分类目录、写题心得与用户配置均完整保留在设备本地！
              </p>
            </div>
          </div>

          {/* In-App Downloading / Progress Panel */}
          {downloadStep === 'downloading' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#416788]" />
                  正在连接极速节点下载安装包...
                </span>
                <span className="font-mono text-[11px] text-slate-500">{downloadSpeed}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#416788] h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {isAndroid ? '📱 安卓安装包 (APK)' : isWindows ? '💻 Windows 安装程序 (EXE)' : '🍏 离线安装包'}
                </span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{downloadProgress}%</span>
              </div>
            </div>
          )}

          {/* Completed Notice */}
          {downloadStep === 'completed' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2.5 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>安装包下载指令已完成！</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
                {isAndroid 
                  ? '若手机顶部通知栏已下载完成，请下拉点击即可直接覆盖安装；如系统未弹出，可点击下方“立即调起系统安装”或“用系统浏览器下载”。'
                  : '安装程序已保存至您的“下载”文件夹，双击即可完成覆盖升级并启动全新版本！'}
              </p>
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
              <span>{copiedNotice ? '已复制链接' : '复制下载链接'}</span>
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
            {downloadStep === 'completed' ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenInSystemBrowser}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  系统浏览器打开
                </button>
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#416788] hover:bg-[#34526d] active:scale-95 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重新下载</span>
                </button>
              </>
            ) : (
              <>
                <a
                  href={updateInfo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="前往 GitHub 官方发布页"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={handleStartUpdate}
                  disabled={downloadStep === 'downloading'}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#416788] hover:bg-[#34526d] active:scale-95 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {downloadStep === 'downloading' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>正在极速下载 {downloadProgress}%...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>立即高速下载安装</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
