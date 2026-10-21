import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  RefreshCw, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  Globe, 
  Terminal, 
  Smartphone, 
  Monitor, 
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Info
} from 'lucide-react';
import { GitConfig, GitStatus, SyncLog } from '../types';
import { api } from '../api/client';

interface GitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export const GitSyncModal: React.FC<GitSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess
}) => {
  const [config, setConfig] = useState<GitConfig>({
    enabled: false,
    platform: 'gitee',
    remoteUrl: '',
    branch: 'main',
    username: '',
    token: '',
    authorName: '我的错题本',
    authorEmail: 'user@mistake-notebook.local',
    autoSync: true,
    autoSyncIntervalMinutes: 10
  });

  const [status, setStatus] = useState<GitStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'multidevice'>('config');

  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [cfg, st, lg] = await Promise.all([
        api.getGitConfig(),
        api.getGitStatus(),
        api.getGitLogs()
      ]);
      setConfig(prev => ({ ...prev, ...cfg }));
      setStatus(st);
      setLogs(lg);
    } catch (e) {
      console.error('加载 Git 状态失败:', e);
    }
  };

  if (!isOpen) return null;

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await api.saveGitConfig(config);
      setConfig(res.config);
      await loadData();
      setFeedback({ type: 'success', text: 'Git 同步配置已成功保存！后台定时任务已更新。' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', text: '保存配置失败: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    setFeedback(null);
    try {
      const res = await api.pullGit();
      if (res.success) {
        setFeedback({ type: 'success', text: '从云端拉取数据成功！' + (res.message || '') });
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setFeedback({ type: 'error', text: '拉取失败: ' + (res.message || '未知错误') });
      }
      await loadData();
    } catch (e) {
      setFeedback({ type: 'error', text: '拉取请求异常: ' + e.message });
    } finally {
      setIsPulling(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    setFeedback(null);
    try {
      const res = await api.pushGit();
      if (res.success) {
        setFeedback({ type: 'success', text: '本地错题与图片已成功备份推送到云端！' });
      } else {
        setFeedback({ type: 'error', text: '推送失败: ' + (res.message || '请检查权限或仓库地址') });
      }
      await loadData();
    } catch (e) {
      setFeedback({ type: 'error', text: '推送请求异常: ' + e.message });
    } finally {
      setIsPushing(false);
    }
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await api.syncGit();
      if (res.success) {
        setFeedback({ type: 'success', text: '全量双向同步完成！(已拉取最新 + 已推送本地)' });
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setFeedback({ type: 'error', text: '部分同步未能成功，请检查下方日志' });
      }
      await loadData();
    } catch (e) {
      setFeedback({ type: 'error', text: '同步请求异常: ' + e.message });
    } finally {
      setIsSyncing(false);
    }
  };

  // Remaining minutes until next auto-pull
  const getRemainingMinutes = () => {
    if (!status?.nextAutoSyncTimestamp) return null;
    const diff = Math.max(0, Math.round((status.nextAutoSyncTimestamp - Date.now()) / 60000));
    return diff;
  };

  return (
    <div 
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
      className="fixed inset-0 z-[9999] flex justify-center items-start bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 mb-8 animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                云端同步中心 (GitHub / Gitee / GitLab)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                数据安全保存在本地，同时可绑定 Git 仓库实现安卓/iOS/Windows 三端互通
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Pill & Real-time Action Bar */}
        <div className="my-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className={`flex h-3 w-3 rounded-full ${config.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {config.enabled && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 top-0 left-0" />
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{config.enabled ? 'Git 同步已激活' : 'Git 同步未启用'}</span>
                {config.autoSync && config.enabled && (
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    · 每 {config.autoSyncIntervalMinutes || 10} 分钟自动拉取
                    {getRemainingMinutes() !== null && ` (下次: 约 ${getRemainingMinutes()} 分钟后)`}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {status?.lastSyncTime ? `上次同步: ${new Date(status.lastSyncTime).toLocaleTimeString('zh-CN')}` : '尚未进行过同步'}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!config.remoteUrl || isPulling || isSyncing}
              onClick={handlePull}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 shadow-xs disabled:opacity-50"
              title="仅从云端拉取更新"
            >
              <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
              {isPulling ? '拉取中...' : '手动拉取'}
            </button>

            <button
              type="button"
              disabled={!config.remoteUrl || isPushing || isSyncing}
              onClick={handlePush}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 shadow-xs disabled:opacity-50"
              title="仅将本地数据推送到云端"
            >
              <Upload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
              {isPushing ? '推送中...' : '推送云端'}
            </button>

            <button
              type="button"
              disabled={!config.remoteUrl || isSyncing || isPulling || isPushing}
              onClick={handleFullSync}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
              title="执行双向全量同步 (Pull + Push)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? '同步中...' : '双向同步'}
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            仓库连接配置
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            运行日志 ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('multidevice')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'multidevice'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>安卓 / iOS 三端互通说明</span>
            </span>
          </button>
        </div>

        {/* TAB 1: Configuration Form */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            {/* Enable switch */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  启用 Git 云端自动同步
                </span>
                <span className="text-[11px] text-slate-400">
                  开启后可在后台定时自动拉取，或随时手动拉取与推送
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Platform selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                代码托管平台
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gitee', name: 'Gitee 码云 (推荐国内无障碍)' },
                  { id: 'github', name: 'GitHub' },
                  { id: 'custom', name: '自建 / GitLab / 其他' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setConfig({ ...config, platform: p.id as any })}
                    className={`py-2 px-3 text-xs rounded-xl border font-medium transition-all text-center ${
                      config.platform === p.id
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Remote URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                远程仓库 HTTPS 地址 *
              </label>
              <input
                type="url"
                required
                value={config.remoteUrl}
                onChange={(e) => {
                  const newUrl = e.target.value;
                  const match = newUrl.match(/(?:github\.com|gitee\.com)\/([^/]+)/i);
                  const suggestedUser = match ? match[1] : '';
                  setConfig(prev => ({
                    ...prev,
                    remoteUrl: newUrl,
                    username: (!prev.username || /[^\x00-\x7F]/.test(prev.username)) && suggestedUser ? suggestedUser : prev.username
                  }));
                }}
                placeholder="例如: https://gitee.com/your-username/my-mistakes.git"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                提示：在 Gitee 或 GitHub 上新建一个<strong className="text-indigo-600 dark:text-indigo-400">私有仓库 (Private)</strong>，复制其 HTTPS 链接填入此处即可。
              </p>
            </div>

            {/* Branch and Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  目标分支
                </label>
                <input
                  type="text"
                  value={config.branch}
                  onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                  placeholder="main 或 master"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  平台账号 / 个人空间名 *
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="例如: quanzhounbcelas"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                  注：请填 Gitee/GitHub 英文空间名或账号，勿填中文昵称
                </p>
              </div>
            </div>

            {/* Personal Access Token (PAT) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-500" />
                  个人访问令牌 (Personal Access Token / PAT) *
                </label>
                <a
                  href={config.platform === 'gitee' ? 'https://gitee.com/profile/personal_access_tokens' : 'https://github.com/settings/tokens'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  前往生成令牌 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={config.token}
                onChange={(e) => setConfig({ ...config, token: e.target.value })}
                placeholder="勾选 repo 权限后生成的访问令牌 (用于免密码安全推送拉取)"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Auto-pull Interval Settings */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  自动拉取频率设置
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={config.autoSyncIntervalMinutes}
                  onChange={(e) => setConfig({ ...config, autoSyncIntervalMinutes: Number(e.target.value) })}
                  className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value={5}>每 5 分钟拉取一次</option>
                  <option value={10}>每 10 分钟拉取一次 (默认)</option>
                  <option value={15}>每 15 分钟拉取一次</option>
                  <option value={30}>每 30 分钟拉取一次</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isSaving ? '正在保存与启动...' : '保存配置并应用'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Sync Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
              <span>最近执行记录 (最近 50 条)</span>
              <button
                type="button"
                onClick={loadData}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> 刷新日志
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl max-h-72 overflow-y-auto font-mono text-[11px] space-y-2">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-6">暂无同步日志</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-relaxed border-b border-slate-800/60 pb-1.5 last:border-0">
                    <span className="text-slate-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString('zh-CN')}]</span>
                    <span className={`font-bold mr-1.5 ${
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'error' ? 'text-rose-400' :
                      log.type === 'warn' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                    {log.details && (
                      <pre className="text-slate-400 text-[10px] mt-1 pl-4 whitespace-pre-wrap">
                        {log.details}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Cross-platform Multi-device Architecture Guide */}
        {activeTab === 'multidevice' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-4 bg-indigo-50/50 dark:bg-slate-800/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                三端 (Android、iOS、Windows) 互通设计架构
              </h4>
              <p>
                本错题本采用<strong>「本地优先 (Local-First) + Git 云端仓库中转」</strong>架构：
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                <li><strong>所有错题与原题图片</strong>均作为标准文件保存在本地存储，数据 100% 属于你，断网也可离线随意查阅、做题。</li>
                <li><strong>Windows 桌面端</strong>：通过本界面的 Git 引擎自动向 Gitee / GitHub 同步。每 10 分钟自动拉取，录入后自动推送。</li>
                <li><strong>安卓端 (Android) 与 iOS 端</strong>：后续我们打包移动端时（基于 Capacitor / Tauri 移动框架），移动端直接复用同一套 UI 与基于纯 JS 的 isomorphic-git 同步核心，使用相同的仓库链接与 Token 即可自动实现三端无缝同屏！</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <Monitor className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Windows 桌面端</span>
                <span className="text-[11px] text-slate-400">支持全屏大图、截图粘贴、定时后台拉取</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <Smartphone className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Android 安卓端</span>
                <span className="text-[11px] text-slate-400">随时拍照录错题、便携式随时复盘</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <Smartphone className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">iOS / iPadOS 端</span>
                <span className="text-[11px] text-slate-400">iPad 分屏配合 Apple Pencil 手写演算</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
