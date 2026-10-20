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
  Bold, 
  Italic, 
  Heading1,
  Heading2,
  Heading3,
  List, 
  ListOrdered,
  Code2, 
  Sigma, 
  Eye, 
  Edit3, 
  Columns, 
  Copy, 
  Check, 
  Quote,
  Keyboard,
  Sparkles
} from 'lucide-react';

export interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
  defaultView?: 'edit' | 'preview' | 'split';
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'java', name: 'Java' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'sql', name: 'SQL' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'bash', name: 'Shell/Bash' }
];

// Helper to render KaTeX formulas in Markdown text
export function renderMarkdownWithKaTeX(rawText: string): string {
  if (!rawText) return '';

  // 1. Replace $$...$$ block formulas
  let processed = rawText.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      return `<div class="my-3 py-1 flex justify-center">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch (e: any) {
      return `<span class="text-rose-500 font-mono">[KaTeX 渲染错误: ${e.message}]</span>`;
    }
  });

  // 2. Replace $...$ inline formulas
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

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '在此输入 Markdown 笔记，支持数学公式（如 $f(x)=x^2$）、代码块及图文推演...',
  minHeight = '140px',
  readOnly = false,
  defaultView,
  className = ''
}) => {
  const [view, setView] = useState<'edit' | 'preview' | 'split'>(
    defaultView || (readOnly ? 'preview' : 'edit')
  );
  const [selectedLang, setSelectedLang] = useState('python');
  const [copied, setCopied] = useState(false);
  const [shortcutNotice, setShortcutNotice] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (readOnly && !defaultView) {
      setView('preview');
    }
  }, [readOnly, defaultView]);

  // Highlight code blocks inside preview whenever HTML renders
  useEffect(() => {
    if (previewRef.current) {
      const codeBlocks = previewRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        Prism.highlightElement(block);
      });
    }
  }, [value, view]);

  const showShortcutPill = (msg: string) => {
    setShortcutNotice(msg);
    setTimeout(() => setShortcutNotice(null), 1800);
  };

  // Insert or wrap text
  const insertSnippet = (before: string, after: string = '', defaultText: string = '文本') => {
    if (readOnly || !onChange) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((value || '') + `${before}${defaultText}${after}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  // Keyboard Shortcuts Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly || !onChange) return;

    // Tab key -> 2 spaces indentation
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
      return;
    }

    // Ctrl+B -> Bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertSnippet('**', '**', '加粗文本');
      showShortcutPill('快捷键: 粗体 (Ctrl+B)');
      return;
    }

    // Ctrl+I -> Italic
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertSnippet('*', '*', '斜体文本');
      showShortcutPill('快捷键: 斜体 (Ctrl+I)');
      return;
    }

    // Ctrl+K -> Code Block
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      insertSnippet(`\n\`\`\`${selectedLang}\n`, '\n```\n', '// 在此输入代码');
      showShortcutPill(`快捷键: 插入代码块 (Ctrl+K [${selectedLang}])`);
      return;
    }

    // Ctrl+M -> Math inline formula
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      insertSnippet('$', '$', 'f(x)');
      showShortcutPill('快捷键: 行内公式 (Ctrl+M)');
      return;
    }

    // Ctrl+H -> Cycle Headings (H1 -> H2 -> H3)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      insertSnippet('### ', '', '小标题');
      showShortcutPill('快捷键: 标题 (Ctrl+H)');
      return;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all ${className}`}>
      {/* 1. Rich Markdown Toolbar with shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700/80 text-xs">
        {/* Left Formatting Tools */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('# ', '', '一级大标题')}
              title="一级标题 (H1)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('## ', '', '二级标题')}
              title="二级标题 (H2)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('### ', '', '三级考点')}
              title="三级标题 (H3, 快捷键 Ctrl+H)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bold & Italic */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('**', '**', '加粗文本')}
              title="粗体 (快捷键 Ctrl+B)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40 font-bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('*', '*', '斜体文本')}
              title="斜体 (快捷键 Ctrl+I)"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40 italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Code Block with Language Selector */}
          <div className="flex items-center bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-lg p-0.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet(`\n\`\`\`${selectedLang}\n`, '\n```\n', '// 在此输入代码')}
              title={`插入代码块 (快捷键 Ctrl+K)`}
              className="flex items-center gap-1 px-1.5 py-0.5 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded cursor-pointer disabled:opacity-40 font-semibold"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">代码块</span>
            </button>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent text-[11px] text-purple-800 dark:text-purple-300 font-mono pr-1 focus:outline-none cursor-pointer"
              title="选择代码语言"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id} className="text-slate-800 bg-white">
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* LaTeX Math Formulas */}
          <div className="flex items-center bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-lg p-0.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('$', '$', 'f(x)')}
              title="行内公式 (快捷键 Ctrl+M)"
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded cursor-pointer disabled:opacity-40"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">$f(x)$</span>
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('$$\n', '\n$$', 'E = mc^2')}
              title="独占行公式块"
              className="px-1.5 py-0.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded cursor-pointer disabled:opacity-40 text-[11px] font-mono"
            >
              $$公式块$$
            </button>
          </div>

          {/* Lists & Quote */}
          <div className="hidden sm:flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('- ', '', '列表项')}
              title="无序列表"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('1. ', '', '第1步')}
              title="有序列表"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => insertSnippet('> ', '', '解题突破口：')}
              title="引用块"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer disabled:opacity-40"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right View Switchers (Edit / Split / Preview) & Copy */}
        <div className="flex items-center gap-1.5 shrink-0">
          {shortcutNotice && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-fade-in font-medium">
              {shortcutNotice}
            </span>
          )}

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setView('edit')}
              title={readOnly ? '查看原始 Markdown 源码' : '编辑源码模式'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                view === 'edit'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="text-[11px]">{readOnly ? '源码' : '编辑'}</span>
            </button>

            <button
              type="button"
              onClick={() => setView('split')}
              title="分屏对照 (左侧编辑，右侧实时KaTeX与代码高亮渲染)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer hidden md:flex ${
                view === 'split'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="text-[11px]">分屏</span>
            </button>

            <button
              type="button"
              onClick={() => setView('preview')}
              title="预览渲染效果 (LaTeX数学公式与代码块高亮)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                view === 'preview'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[11px]">渲染预览</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="复制全部 Markdown 文本"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Editor Body */}
      <div>
        {/* VIEW 1: Pure Edit Mode */}
        {view === 'edit' && (
          <textarea
            ref={textareaRef}
            readOnly={readOnly}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ minHeight }}
            className={`w-full p-4 text-xs leading-relaxed text-slate-800 dark:text-slate-100 bg-transparent resize-y focus:outline-none font-mono ${
              readOnly ? 'bg-slate-50/40 dark:bg-slate-900/40 cursor-default' : ''
            }`}
          />
        )}

        {/* VIEW 2: Rendered Preview Mode */}
        {view === 'preview' && (
          <div
            ref={previewRef}
            style={{ minHeight }}
            className="p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto text-slate-800 dark:text-slate-100 leading-relaxed font-sans"
            dangerouslySetInnerHTML={{
              __html: renderMarkdownWithKaTeX(value) || '<p class="text-slate-400 italic">暂无内容，点击上方「编辑」输入推演步骤与心得...</p>'
            }}
          />
        )}

        {/* VIEW 3: Side-by-Side Split View */}
        {view === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
            <textarea
              ref={textareaRef}
              readOnly={readOnly}
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ minHeight }}
              className={`w-full p-3.5 text-xs leading-relaxed text-slate-800 dark:text-slate-100 bg-transparent resize-none focus:outline-none font-mono ${
                readOnly ? 'bg-slate-50/30 dark:bg-slate-900/30 cursor-default' : ''
              }`}
            />
            <div
              ref={previewRef}
              style={{ minHeight }}
              className="p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto text-slate-800 dark:text-slate-100 bg-slate-50/40 dark:bg-slate-900/40 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownWithKaTeX(value) || '<p class="text-slate-400 italic">实时公式渲染预览区域...</p>'
              }}
            />
          </div>
        )}
      </div>

      {/* Editor Footer: Quick tip bar */}
      {!readOnly && (
        <div className="px-3 py-1 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
              <Keyboard className="w-3 h-3" />
              快捷键支持:
            </span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Ctrl+B</kbd> 粗体</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Ctrl+I</kbd> 斜体</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Ctrl+K</kbd> 代码块</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Ctrl+M</kbd> 公式</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Tab</kbd> 缩进</span>
          </div>
          <span>{(value || '').length} 字符</span>
        </div>
      )}
    </div>
  );
};
