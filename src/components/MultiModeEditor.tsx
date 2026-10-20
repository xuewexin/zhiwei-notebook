import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import { 
  FileText, 
  BookOpen, 
  Code2, 
  Eye, 
  Edit3, 
  Columns, 
  Copy, 
  Check, 
  Bold, 
  Italic, 
  Heading, 
  List, 
  Sigma,
  HelpCircle
} from 'lucide-react';
import { EditorMode } from '../types';

interface MultiModeEditorProps {
  mode: EditorMode;
  value: string;
  codeLanguage?: string;
  onChange: (value: string) => void;
  onModeChange: (mode: EditorMode) => void;
  onCodeLanguageChange?: (lang: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'java', name: 'Java' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Shell / Bash' }
];

// Helper to render KaTeX formulas in Markdown text
function renderMarkdownWithKaTeX(rawText: string): string {
  if (!rawText) return '';

  // Replace $$...$$ block formulas
  let processed = rawText.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      return `<div class="my-3 py-1 flex justify-center">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch (e) {
      return `<span class="text-rose-500 font-mono">[KaTeX 渲染错误: ${e.message}]</span>`;
    }
  });

  // Replace $...$ inline formulas
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return `<span class="text-rose-500 font-mono">[公式错误]</span>`;
    }
  });

  try {
    return marked.parse(processed, { breaks: true }) as string;
  } catch (e) {
    return marked.parse(rawText, { breaks: true }) as string;
  }
}

export const MultiModeEditor: React.FC<MultiModeEditorProps> = ({
  mode,
  value,
  codeLanguage = 'python',
  onChange,
  onModeChange,
  onCodeLanguageChange,
  placeholder = '写下你的解题思路、反思心得与易错考点...',
  minHeight = '140px',
  readOnly = false
}) => {
  const [currentMode, setCurrentMode] = useState<EditorMode>(mode || 'markdown');
  const [mdView, setMdView] = useState<'edit' | 'preview' | 'split'>(readOnly ? 'preview' : 'edit');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codePreviewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mode) {
      setCurrentMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (readOnly) {
      setMdView('preview');
    }
  }, [readOnly]);

  useEffect(() => {
    if (currentMode === 'code' && codePreviewRef.current) {
      Prism.highlightElement(codePreviewRef.current);
    }
  }, [value, codeLanguage, currentMode]);

  const handleSelectMode = (newMode: EditorMode) => {
    setCurrentMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Handle Tab key in textareas
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertMarkdownSnippet = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || '文本';
    const replacement = `${before}${selected}${after}`;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
      {/* Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSelectMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              currentMode === 'text'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>纯文本模式</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              currentMode === 'markdown'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>MD文档模式 (含公式)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              currentMode === 'code'
                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>代码块模式</span>
          </button>
        </div>

        {/* Sub-controls based on active mode */}
        <div className="flex items-center gap-1.5">
          {currentMode === 'markdown' && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setMdView('edit')}
                title={readOnly ? '查看原始MD源码' : '编辑源码模式'}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  mdView === 'edit'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="text-[11px]">{readOnly ? '源码' : '编辑'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMdView('split')}
                title="分屏对照 (左源码 右渲染)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer hidden sm:flex ${
                  mdView === 'split'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="text-[11px]">分屏</span>
              </button>
              <button
                type="button"
                onClick={() => setMdView('preview')}
                title="预览渲染效果 (KaTeX公式与排版)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  mdView === 'preview'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[11px]">预览</span>
              </button>
            </div>
          )}

          {currentMode === 'code' && (
            <div className="flex items-center gap-1.5">
              <select
                value={codeLanguage}
                onChange={(e) => onCodeLanguageChange && onCodeLanguageChange(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleCopyCode}
                title="复制代码"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">{copied ? '已复制' : '复制'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Markdown quick syntax toolbar */}
      {currentMode === 'markdown' && mdView !== 'preview' && !readOnly && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('**', '**')}
            title="粗体"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('*', '*')}
            title="斜体"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('### ')}
            title="三级标题"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('- ')}
            title="无序列表"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('$', '$')}
            title="行内公式 (LaTeX)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
          >
            <Sigma className="w-3.5 h-3.5" />
            <span className="text-[11px]">$f(x)$</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('$$\n', '\n$$')}
            title="公式块 (LaTeX)"
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-blue-600 dark:text-blue-400 font-medium text-[11px] cursor-pointer"
          >
            $$公式块$$
          </button>
          <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            支持 $f(x)=x^2$ 行内公式与 $$ 独占行公式
          </span>
        </div>
      )}

      {/* Editor Body */}
      <div className="relative">
        {/* MODE 1: Plain Text */}
        {currentMode === 'text' && (
          readOnly ? (
            <div
              style={{ minHeight }}
              className="w-full p-3.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-normal"
            >
              {value || <span className="text-slate-400 italic">暂无推演演算内容...</span>}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full p-3.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100 bg-transparent resize-y focus:outline-none font-normal"
            />
          )
        )}

        {/* MODE 2: Markdown Document */}
        {currentMode === 'markdown' && (
          <div className="w-full">
            {mdView === 'edit' && (
              <textarea
                ref={textareaRef}
                readOnly={readOnly}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                style={{ minHeight }}
                className={`w-full p-3.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100 bg-transparent resize-y focus:outline-none font-mono ${
                  readOnly ? 'bg-slate-50/50 dark:bg-slate-900/50 cursor-default' : ''
                }`}
              />
            )}

            {mdView === 'preview' && (
              <div
                style={{ minHeight }}
                className="p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto text-slate-800 dark:text-slate-100"
                dangerouslySetInnerHTML={{ __html: renderMarkdownWithKaTeX(value) || '<p class="text-slate-400 italic">暂无内容，切换到编辑/源码模式输入...</p>' }}
              />
            )}

            {mdView === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
                <textarea
                  ref={textareaRef}
                  readOnly={readOnly}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  style={{ minHeight }}
                  className={`w-full p-3.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100 bg-transparent resize-none focus:outline-none font-mono ${
                    readOnly ? 'bg-slate-50/30 dark:bg-slate-900/30 cursor-default' : ''
                  }`}
                />
                <div
                  style={{ minHeight }}
                  className="p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-900/50"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownWithKaTeX(value) || '<p class="text-slate-400 italic">实时公式渲染预览区域...</p>' }}
                />
              </div>
            )}
          </div>
        )}

        {/* MODE 3: Code Block */}
        {currentMode === 'code' && (
          <div className="flex flex-col">
            {!readOnly && (
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`// 输入你的 ${codeLanguage} 核心代码实现或思路算法...`}
                style={{ minHeight: '120px' }}
                className="w-full p-3 text-xs leading-relaxed font-mono text-purple-900 dark:text-purple-200 bg-purple-50/30 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 focus:outline-none resize-y"
              />
            )}
            
            <div className="bg-slate-950 p-4 rounded-b-xl overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <span>高亮渲染预览 [{codeLanguage}]</span>
                <span className="text-slate-500">{value.split('\n').length} 行代码</span>
              </div>
              <pre className="text-xs font-mono !bg-transparent !p-0 !m-0">
                <code ref={codePreviewRef} className={`language-${codeLanguage}`}>
                  {value || '// (等待输入代码)'}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
