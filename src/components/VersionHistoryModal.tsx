import React, { useState, useEffect } from 'react';
import {
  History,
  GitCommit,
  GitMerge,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Layers,
  X,
  RefreshCw,
  FileText,
  ChevronRight,
  Eye,
  Check,
  Tag
} from 'lucide-react';
import { Question, QuestionVersion } from '../types';
import { api } from '../api/client';
import { marked } from 'marked';
import katex from 'katex';

interface VersionHistoryModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onRollbackSuccess: (restored: Question) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  question,
  isOpen,
  onClose,
  onRollbackSuccess
}) => {
  const [versions, setVersions] = useState<QuestionVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);
  const [selectedVersion, setSelectedVersion] = useState<QuestionVersion | null>(null);
  const [snapshot, setSnapshot] = useState<Question | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState<boolean>(false);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showJsonRaw, setShowJsonRaw] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'reflection' | 'attempts' | 'content'>('reflection');

  // Load versions whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    } else {
      setSelectedVersion(null);
      setSnapshot(null);
      setErrorMsg(null);
    }
  }, [isOpen, question.id]);

  const loadVersions = async () => {
    setIsLoadingVersions(true);
    setErrorMsg(null);
    try {
      const list = await api.getQuestionVersions(question.id);
      setVersions(list);
      if (list.length > 0) {
        // Default select current or latest version
        setSelectedVersion(list[0]);
        loadSnapshot(list[0].commitHash);
      } else {
        setSelectedVersion(null);
        setSnapshot(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || '获取历史版本失败');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const loadSnapshot = async (commitHash: string) => {
    setIsLoadingSnapshot(true);
    setErrorMsg(null);
    try {
      const data = await api.getQuestionAtVersion(question.id, commitHash);
      setSnapshot(data);
    } catch (err: any) {
      setErrorMsg(err.message || '读取该版本快照失败');
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const handleSelectVersion = (v: QuestionVersion) => {
    setSelectedVersion(v);
    loadSnapshot(v.commitHash);
  };

  const handleRollback = async () => {
    if (!selectedVersion) return;
    if (selectedVersion.commitHash === 'working-tree') {
      alert('当前已是工作区版本，无需回退');
      return;
    }
    const confirmText = `确定要将错题《${question.title || '此题'}》回退到 [${selectedVersion.shortHash}] 版本吗？\n\n回退后将生成一次新的备份提交，并自动同步，不会丢失任何 Git 提交历史。`;
    if (!window.confirm(confirmText)) return;

    setIsRollingBack(true);
    setErrorMsg(null);
    try {
      const res = await api.rollbackQuestion(question.id, selectedVersion.commitHash);
      if (res.success && res.question) {
        onRollbackSuccess(res.question);
        await loadVersions();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '版本回退失败');
    } finally {
      setIsRollingBack(false);
    }
  };

  // Helper to render KaTeX and Markdown
  const renderFormatted = (text: string) => {
    if (!text) return '';
    let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => {
      try {
        return `<div class="my-2 py-1 flex justify-center">${katex.renderToString(f.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return m;
      }
    });
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (m, f) => {
      try {
        return katex.renderToString(f.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return m;
      }
    });
    return marked.parse(processed, { breaks: true }) as string;
  };

  if (!isOpen) return null;

  const isCurrentSelection = selectedVersion && (selectedVersion.isCurrent || selectedVersion.commitHash === 'working-tree');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[88vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  版本历史与冲突回退
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Git 快照追溯
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                题目: 《{question.title || '未命名错题'}》 · 创建时间: {question.createdAt ? new Date(question.createdAt).toLocaleString('zh-CN') : '未知'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadVersions}
              disabled={isLoadingVersions}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="刷新版本记录"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingVersions ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Main Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Commit Snapshots List */}
          <div className="w-full md:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/40 dark:bg-slate-900/40">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
                历次提交版本 ({versions.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingVersions ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                  <span>正在查询 Git 历史快照...</span>
                </div>
              ) : versions.length === 0 ? (
                <div className="py-12 px-4 text-center text-xs text-slate-400">
                  <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 stroke-[1.5]" />
                  暂无 Git 提交记录，首次保存或同步后将自动记录版本历史。
                </div>
              ) : (
                versions.map((ver) => {
                  const isSelected = selectedVersion?.commitHash === ver.commitHash;
                  return (
                    <div
                      key={ver.commitHash}
                      onClick={() => handleSelectVersion(ver)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all text-left relative ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-indigo-400 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-400 dark:ring-indigo-600'
                          : 'bg-white/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            #{ver.shortHash}
                          </span>

                          {ver.isCurrent && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                              当前最新
                            </span>
                          )}

                          {ver.isConflict && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              冲突版本
                            </span>
                          )}

                          {ver.isMerge && !ver.isConflict && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50 flex items-center gap-0.5">
                              <GitMerge className="w-3 h-3" />
                              合并快照
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed mb-2">
                        {ver.message || '无提交描述'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <User className="w-3 h-3" />
                          {ver.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ver.date ? new Date(ver.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '工作区'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Version Snapshot Detail & Rollback */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Snapshot Header Card */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {selectedVersion.shortHash === '工作区修改' ? '本地未提交修改' : `Commit #${selectedVersion.shortHash}`}
                      </h4>
                      {isCurrentSelection ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> 当前正在使用的版本
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          历史版本
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedVersion.message} · 提交者: {selectedVersion.author} · {selectedVersion.date ? new Date(selectedVersion.date).toLocaleString('zh-CN') : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowJsonRaw(!showJsonRaw)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        showJsonRaw
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {showJsonRaw ? '返回图文视图' : '查看原始 JSON'}
                    </button>

                    <button
                      type="button"
                      onClick={handleRollback}
                      disabled={isCurrentSelection || isRollingBack || selectedVersion.commitHash === 'working-tree'}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isCurrentSelection || selectedVersion.commitHash === 'working-tree'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                      }`}
                      title={isCurrentSelection ? '当前已是此版本' : '安全回退至此版本快照'}
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? 'animate-spin' : ''}`} />
                      <span>{isRollingBack ? '正在回退...' : '回退恢复至此版本'}</span>
                    </button>
                  </div>
                </div>

                {/* Snapshot Content Preview */}
                <div className="flex-1 overflow-y-auto p-6">
                  {isLoadingSnapshot ? (
                    <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>正在加载该历史版本完整数据...</span>
                    </div>
                  ) : !snapshot ? (
                    <div className="py-20 text-center text-xs text-slate-400">
                      无法加载此版本的错题数据快照
                    </div>
                  ) : showJsonRaw ? (
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl overflow-x-auto text-xs font-mono">
                      <pre>{JSON.stringify(snapshot, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-4xl">
                      {/* Overview Meta */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">掌握程度</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {snapshot.mastery === 'mastered' ? '✅ 已掌握' : snapshot.mastery === 'reviewing' ? '🔄 攻关中' : '❌ 未掌握'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">做题练习次数</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {(snapshot.attempts || []).length} 次做题记录
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">遗忘复习阶段</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            第 {snapshot.reviewStage || 0} 阶段
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">创建时间</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleDateString('zh-CN') : '未知'}
                          </span>
                        </div>
                      </div>

                      {/* Tabs Navigation */}
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('reflection')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'reflection'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          💡 当时的复盘与推导心得
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('attempts')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'attempts'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          🎯 历次做题历程 ({(snapshot.attempts || []).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('content')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            activeTab === 'content'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          📌 题干与标准答案
                        </button>
                      </div>

                      {/* Tab 1: Reflection Content */}
                      {activeTab === 'reflection' && (
                        <div className="space-y-4">
                          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                            <h5 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              推导心得内容 (Markdown 快照)
                            </h5>
                            {snapshot.reflectionContent ? (
                              <div
                                className="prose dark:prose-invert max-w-none text-xs leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: renderFormatted(snapshot.reflectionContent) }}
                              />
                            ) : (
                              <div className="text-xs text-slate-400 italic">
                                该版本当时暂无推导心得记录
                              </div>
                            )}
                          </div>

                          {/* Error Causes & Tags */}
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <h5 className="font-bold text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-amber-500" />
                              错因剖析与考点标签
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {(snapshot.errorCauses || []).map((cause, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
                                  {cause}
                                </span>
                              ))}
                              {(snapshot.tags || []).map((tag, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
                                  #{tag}
                                </span>
                              ))}
                              {(!snapshot.errorCauses?.length && !snapshot.tags?.length) && (
                                <span className="text-xs text-slate-400">无标签</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Attempts */}
                      {activeTab === 'attempts' && (
                        <div className="space-y-4">
                          {(snapshot.attempts || []).length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">
                              该版本中暂无练习做题记录
                            </div>
                          ) : (
                            snapshot.attempts.map((att) => (
                              <div
                                key={att.id}
                                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                                      #{att.attemptNumber}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                                      第 {att.attemptNumber} 次做题
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      {att.date ? new Date(att.date).toLocaleString('zh-CN') : ''}
                                    </span>
                                  </div>

                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                    att.result === 'correct'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                                      : att.result === 'partial'
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                                  }`}>
                                    {att.result === 'correct' ? '做对' : att.result === 'partial' ? '半对' : '做错'}
                                  </span>
                                </div>

                                {att.mdContent && (
                                  <div className="text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Markdown 演算笔记:</span>
                                    <div
                                      className="prose dark:prose-invert max-w-none text-xs"
                                      dangerouslySetInnerHTML={{ __html: renderFormatted(att.mdContent) }}
                                    />
                                  </div>
                                )}

                                {att.pdfName && (
                                  <div className="text-xs text-rose-600 bg-rose-50/60 dark:bg-rose-950/30 px-3 py-2 rounded-xl flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>关联 PDF 文件: {att.pdfName}</span>
                                  </div>
                                )}

                                {att.images && att.images.length > 0 && (
                                  <div className="flex gap-2 flex-wrap">
                                    {att.images.map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img}
                                        alt={`做题图片 ${idx + 1}`}
                                        className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Tab 3: Question Content & Answer */}
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h5 className="font-bold text-xs text-slate-500 mb-2">题目内容</h5>
                            {snapshot.contentType === 'image' ? (
                              <img src={snapshot.content} alt="题干" className="max-h-60 rounded-xl" />
                            ) : (
                              <div
                                className="prose dark:prose-invert max-w-none text-xs"
                                dangerouslySetInnerHTML={{ __html: renderFormatted(snapshot.content || '') }}
                              />
                            )}
                          </div>

                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h5 className="font-bold text-xs text-slate-500 mb-2">标准解答与答案</h5>
                            {snapshot.answerType === 'image' ? (
                              <img src={snapshot.answerContent} alt="答案" className="max-h-60 rounded-xl" />
                            ) : (
                              <div
                                className="prose dark:prose-invert max-w-none text-xs"
                                dangerouslySetInnerHTML={{ __html: renderFormatted(snapshot.answerContent || '暂无答案') }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                请在左侧选择一个版本进行查看与对比
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
