import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  Clock, 
  Settings, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GitStatus } from '../types';

interface OneNoteSyncIndicatorProps {
  gitStatus: GitStatus | null;
  isSyncing: boolean;
  onSyncNow: () => Promise<void>;
  onPullNow?: () => Promise<void>;
  onPushNow?: () => Promise<void>;
  onOpenSettings: () => void;
  className?: string;
}

export const OneNoteSyncIndicator: React.FC<OneNoteSyncIndicatorProps> = ({
  gitStatus,
  isSyncing: parentIsSyncing,
  onSyncNow,
  onPullNow,
  onPushNow,
  onOpenSettings,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalActionLoading, setInternalActionLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeSyncing = parentIsSyncing || gitStatus?.isSyncing;
  const isPending = gitStatus?.pendingPush || gitStatus?.lastSyncStatus === 'pending';
  const isError = gitStatus?.lastSyncStatus === 'error';
  const isConfigured = Boolean(gitStatus?.isRepo && gitStatus?.autoSyncEnabled);

  // Countdown for pending auto-push (10 seconds debounce)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!gitStatus?.pendingPush || !gitStatus?.pendingPushDeadline) {
      setSecondsRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const diff = Math.max(0, Math.ceil((gitStatus.pendingPushDeadline! - Date.now()) / 1000));
      setSecondsRemaining(diff);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 500);
    return () => clearInterval(timer);
  }, [gitStatus?.pendingPush, gitStatus?.pendingPushDeadline]);

  // Format relative time (e.g. "刚刚", "2分钟前")
  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '尚未同步';
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 30) return '刚刚已同步';
      if (diff < 60) return `${diff} 秒前`;
      if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return '刚刚';
    }
  };

  const remainingMinutes = () => {
    if (!gitStatus?.nextAutoSyncTimestamp) return null;
    const diff = Math.max(0, Math.round((gitStatus.nextAutoSyncTimestamp - Date.now()) / 60000));
    return diff;
  };

  const handleAction = async (action: () => Promise<any>) => {
    setInternalActionLoading(true);
    try {
      await action();
    } finally {
      setInternalActionLoading(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Clickable OneNote-style Sync Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs select-none ${
          activeSyncing
            ? 'bg-blue-50/90 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
            : isPending
            ? 'bg-amber-50/90 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse'
            : isError
            ? 'bg-rose-50/90 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            : 'bg-emerald-50/70 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/70'
        }`}
        title="OneNote 智能同步状态：添加或修改后 10 秒无其他操作时自动同步"
      >
        {activeSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
            <span>正在同步...</span>
          </>
        ) : isPending ? (
          <>
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{secondsRemaining !== null && secondsRemaining > 0 ? `${secondsRemaining}s 后自动同步` : '10s 待同步'}</span>
          </>
        ) : isError ? (
          <>
            <CloudOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>同步异常</span>
          </>
        ) : (
          <>
            <div className="relative">
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <span>{formatRelativeTime(gitStatus?.lastSyncTime)}</span>
          </>
        )}
      </button>

      {/* Flyout Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 animate-scale-in text-slate-800 dark:text-slate-100">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs">OneNote 智能同步</h5>
                <p className="text-[10px] text-slate-400">
                  {gitStatus?.branch ? `分支: ${gitStatus.branch}` : '支持 Gitee / GitHub'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              title="配置同步仓库与 Token"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Status Description */}
          <div className="py-3 space-y-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-2 text-xs">
              {activeSyncing ? (
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0 mt-0.5" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-xs leading-snug">
                  {activeSyncing
                    ? '正在与云端仓库进行双向同步...'
                    : isPending
                    ? (secondsRemaining !== null && secondsRemaining > 0
                        ? `检测到本地修改，静置 ${secondsRemaining} 秒后自动推送到云端...`
                        : '检测到本地修改，10 秒无其他操作后自动推送到云端...')
                    : isError
                    ? '同步遇到错误，请检查网络或授权'
                    : '所有错题与草稿均已同步至云端'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  上次同步：{gitStatus?.lastSyncTime ? new Date(gitStatus.lastSyncTime).toLocaleString('zh-CN') : '暂无记录'}
                </p>
              </div>
            </div>

            {/* Smart Sync Highlights */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>静置同步：添加/修改后 10 秒无其他操作自动推送云端</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  后台定时：每 10 分钟自动拉取远程更新
                  {remainingMinutes() !== null && ` (${remainingMinutes()} 分钟后)`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Manual Actions */}
          <div className="pt-3 space-y-2">
            <button
              type="button"
              disabled={activeSyncing || internalActionLoading}
              onClick={() => handleAction(onSyncNow)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activeSyncing || internalActionLoading ? 'animate-spin' : ''}`} />
              <span>{activeSyncing || internalActionLoading ? '正在同步...' : '立即手动同步 (双向)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {onPullNow && (
                <button
                  type="button"
                  disabled={activeSyncing || internalActionLoading}
                  onClick={() => handleAction(onPullNow)}
                  className="flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
                  <span>手动拉取 (Pull)</span>
                </button>
              )}
              {onPushNow && (
                <button
                  type="button"
                  disabled={activeSyncing || internalActionLoading}
                  onClick={() => handleAction(onPushNow)}
                  className="flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5 text-slate-500" />
                  <span>手动推送 (Push)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
