import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Star, 
  Tag, 
  Plus, 
  Clipboard, 
  Layers, 
  Check, 
  Sparkles, 
  AlertCircle, 
  BookOpen, 
  Camera, 
  Trash2, 
  RefreshCw,
  FileCode,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Question, Folder, ContentType, EditorMode, MasteryStatus } from '../types';
import { MarkdownEditor } from './MarkdownEditor';
import { api } from '../api/client';

interface QuestionModalProps {
  isOpen: boolean;
  currentFolderId: string | null;
  folders: Folder[];
  onClose: () => void;
  onCreated: (newQuestion: Question) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  currentFolderId,
  folders,
  onClose,
  onCreated
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId || (folders[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [mastery, setMastery] = useState<MasteryStatus>('unmastered');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // 1. Question Content (Image, Text, or PDF)
  const [contentType, setContentType] = useState<ContentType>('image');
  const [content, setContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);

  // 2. Optional Standard Answer (用户可选上传答案)
  const [hasAnswer, setHasAnswer] = useState(false);
  const [answerType, setAnswerType] = useState<ContentType>('text');
  const [answerContent, setAnswerContent] = useState('');
  const [answerPdfUrl, setAnswerPdfUrl] = useState('');
  const [answerPdfName, setAnswerPdfName] = useState('');
  const [isAnswerUploading, setIsAnswerUploading] = useState(false);

  // 3. Reflection (写题心得)
  const [reflectionMode, setReflectionMode] = useState<EditorMode>('markdown');
  const [reflectionContent, setReflectionContent] = useState('');
  const [reflectionCodeLang, setReflectionCodeLang] = useState('python');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Input Refs
  const albumInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Answer File Input Refs
  const answerAlbumInputRef = useRef<HTMLInputElement>(null);
  const answerCameraInputRef = useRef<HTMLInputElement>(null);
  const answerPdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentFolderId) {
      setSelectedFolderId(currentFolderId);
    } else if (folders.length > 0 && !selectedFolderId) {
      setSelectedFolderId(folders[0].id);
    }
  }, [currentFolderId, folders]);

  // Support Ctrl+V paste image directly from clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            setIsUploading(true);
            try {
              const reader = new FileReader();
              reader.onload = async (event) => {
                const base64Data = event.target?.result as string;
                const res = await api.uploadBase64(base64Data);
                setContent(res.url);
                setContentType('image');
                setPasteNotice(true);
                setTimeout(() => setPasteNotice(false), 3000);
              };
              reader.readAsDataURL(blob);
            } catch (err: any) {
              alert('粘贴图片保存失败: ' + err?.message);
            } finally {
              setIsUploading(false);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Question Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        setContent(res.url);
        setContentType('image');
      }
    } catch (err: any) {
      alert('上传图片失败: ' + (err?.message || '未知错误'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle Question PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadFile(file);
      if (res && res.url) {
        setPdfUrl(res.url);
        setPdfName(file.name);
        setContentType('pdf');
      }
    } catch (err: any) {
      alert('上传 PDF 失败: ' + (err?.message || '未知错误'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle Answer Image Upload
  const handleAnswerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnswerUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        setAnswerContent(res.url);
        setAnswerType('image');
      }
    } catch (err: any) {
      alert('上传答案图片失败: ' + (err?.message || '未知错误'));
    } finally {
      setIsAnswerUploading(false);
      e.target.value = '';
    }
  };

  // Handle Answer PDF Upload
  const handleAnswerPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnswerUploading(true);
    try {
      const res = await api.uploadFile(file);
      if (res && res.url) {
        setAnswerPdfUrl(res.url);
        setAnswerPdfName(file.name);
        setAnswerType('pdf');
      }
    } catch (err: any) {
      alert('上传答案 PDF 失败: ' + (err?.message || '未知错误'));
    } finally {
      setIsAnswerUploading(false);
      e.target.value = '';
    }
  };

  const handleAddTag = () => {
    const raw = tagInput.trim();
    if (!raw) return;
    const splitTags = raw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean);
    const unique = splitTags.filter(t => !tags.includes(t));
    if (unique.length > 0) {
      setTags([...tags, ...unique]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !pdfUrl && !title.trim()) {
      alert('请输入错题内容、上传图片或上传 PDF');
      return;
    }

    setIsSubmitting(true);
    try {
      const newQuestion = await api.createQuestion({
        folderId: selectedFolderId || (folders[0]?.id || 'default'),
        title: title.trim() || (pdfName ? pdfName.replace(/\.pdf$/i, '') : '未命名错题'),
        source: source.trim(),
        difficulty,
        mastery,
        tags,
        contentType,
        content: content.trim(),
        mdContent: contentType === 'text' ? content.trim() : '',
        images: contentType === 'image' && content ? [content.trim()] : [],
        pdfUrl: pdfUrl || undefined,
        pdfName: pdfName || undefined,
        questionDefaultTab: contentType === 'pdf' ? 'pdf' : contentType === 'image' ? 'photo' : 'md',
        answerDefaultTab: answerType === 'pdf' ? 'pdf' : answerType === 'image' ? 'photo' : 'md',
        reflectionDefaultTab: 'md',
        reflectionMode,
        reflectionContent: reflectionContent.trim(),
        reflectionMd: reflectionContent.trim(),
        reflectionCodeLang,
        // Optional Answer Fields
        answerType: hasAnswer ? answerType : undefined,
        answerContent: hasAnswer ? answerContent.trim() : undefined,
        answerMd: (hasAnswer && answerType === 'text') ? answerContent.trim() : '',
        answerImages: (hasAnswer && answerType === 'image' && answerContent) ? [answerContent.trim()] : [],
        answerPdfUrl: (hasAnswer && answerType === 'pdf' && answerPdfUrl) ? answerPdfUrl : undefined,
        answerPdfName: (hasAnswer && answerType === 'pdf' && answerPdfName) ? answerPdfName : undefined,
        attempts: []
      });
      onCreated(newQuestion);
      onClose();
    } catch (err: any) {
      alert('保存错题失败: ' + err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
      className="fixed inset-0 z-50 flex justify-center items-start bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 mb-8 animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">录入新错题</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持题目拍照、截图粘贴、PDF 试卷上传及可选参考答案
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pasteNotice && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            已成功从剪贴板捕获并保存错题截图！
          </div>
        )}

        <div className="space-y-5">
          {/* 1. Categorization & Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                归属分类文件夹 *
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {folders.length === 0 ? (
                  <option value="">未分类 (默认暂存)</option>
                ) : (
                  folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                来源试卷/考点
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="例如: 2026八省联考、周测"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                难度评级
              </label>
              <div className="flex items-center gap-1.5 h-[34px] px-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDifficulty(i + 1)}
                    className="p-0.5 text-amber-500 transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${i < difficulty ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              错题标题 / 摘要简述
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: 已知函数 f(x) 恒有两个极值点求 a 范围..."
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* 3. Question Content Input (Image, Text, OR PDF) */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                题目内容录入方式
              </label>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setContentType('image')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    contentType === 'image'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> 上传图片
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('text')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    contentType === 'text'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> 文本/公式
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('pdf')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    contentType === 'pdf'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-rose-500" /> 上传 PDF
                </button>
              </div>
            </div>

            {/* Mode 1: Image Upload */}
            {contentType === 'image' && (
              <div className="space-y-3">
                <input
                  ref={albumInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {content ? (
                  <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xs">
                    <img src={content} alt="题目图片" className="max-h-72 object-contain w-full rounded-xl" />
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" /> 重新拍照
                        </button>
                        <button
                          type="button"
                          onClick={() => albumInputRef.current?.click()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> 相册换图
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContent('')}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold cursor-pointer"
                        title="删除此张照片"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-blue-200 dark:border-blue-900/60 rounded-2xl bg-blue-50/20 dark:bg-blue-950/10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {isUploading ? '正在压缩并保存照片...' : '录入错题原题照片'}
                    </p>
                    <p className="text-[11px] text-slate-400 mb-4 max-w-sm mx-auto">
                      支持平板/手机摄像头拍照，相册选图，或电脑端直接 Ctrl+V 粘贴
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>拍照录题</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => albumInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span>从相册选图</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Text / LaTeX */}
            {contentType === 'text' && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="直接键入题目题干，支持 LaTeX 公式（如 $f(x)=e^x+a$ 或 $$\int_0^1 x dx$$）与 Markdown 排版..."
                className="w-full p-3.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                rows={4}
              />
            )}

            {/* Mode 3: PDF Document Upload */}
            {contentType === 'pdf' && (
              <div className="space-y-3">
                <input 
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                />

                {pdfUrl ? (
                  <div className="flex items-center justify-between p-3.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        PDF
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {pdfName || '错题讲义/试卷.pdf'}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ 已成功载入，可在错题详情中多页翻阅与笔迹批注
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-100 cursor-pointer"
                      >
                        更换文件
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPdfUrl('');
                          setPdfName('');
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-xl cursor-pointer"
                        title="删除 PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => pdfInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-rose-200 dark:border-rose-900/50 rounded-2xl bg-rose-50/20 dark:bg-rose-950/10 text-center cursor-pointer hover:bg-rose-50/40 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {isUploading ? '正在解析并上传 PDF 试卷...' : '点击上传试卷或讲义 PDF 文件'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      支持整页原版试卷 PDF，做题时可直接在 PDF 上手写演算与标注
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Optional Standard Answer Section (用户可选上传答案) */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label 
                onClick={() => setHasAnswer(!hasAnswer)}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input 
                  type="checkbox"
                  checked={hasAnswer}
                  onChange={(e) => setHasAnswer(e.target.checked)}
                  className="accent-emerald-600 rounded w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  录入参考答案与标准解析 (可选)
                </span>
              </label>

              {hasAnswer && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAnswerType('text')}
                    className={`px-2 py-0.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      answerType === 'text'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    文字解析
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerType('image')}
                    className={`px-2 py-0.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      answerType === 'image'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    答案图片
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerType('pdf')}
                    className={`px-2 py-0.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      answerType === 'pdf'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    答案 PDF
                  </button>
                </div>
              )}
            </div>

            {hasAnswer && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fade-in space-y-2">
                {answerType === 'text' && (
                  <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="输入标准解题步骤、参考答案推导，支持 LaTeX 公式..."
                    className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                  />
                )}

                {answerType === 'image' && (
                  <div>
                    <input 
                      ref={answerAlbumInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAnswerImageUpload}
                    />
                    <input 
                      ref={answerCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleAnswerImageUpload}
                    />

                    {answerContent ? (
                      <div className="max-w-xs rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-900">
                        <img src={answerContent} alt="答案解析图" className="max-h-48 object-contain w-full rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setAnswerContent('')}
                          className="mt-2 text-rose-600 text-xs font-semibold hover:underline block"
                        >
                          删除此答案照片
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => answerCameraInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" /> 拍照答案
                        </button>
                        <button
                          type="button"
                          onClick={() => answerAlbumInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" /> 相册选择答案
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {answerType === 'pdf' && (
                  <div>
                    <input 
                      ref={answerPdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleAnswerPdfUpload}
                    />

                    {answerPdfUrl ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 truncate">
                          {answerPdfName || '答案解析.pdf'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAnswerPdfUrl('');
                            setAnswerPdfName('');
                          }}
                          className="text-rose-600 hover:underline font-semibold"
                        >
                          移除
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => answerPdfInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> 上传答案解析 PDF
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              知识点标签 (回车添加)
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-lg font-medium"
                >
                  <Tag className="w-3 h-3 text-blue-500" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="输入标签（支持逗号/空格分隔）..."
                  className="text-xs bg-transparent focus:outline-none px-2 py-1 flex-1 text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  添加
                </button>
              </div>
            </div>
          </div>

          {/* 6. Reflection (写题心得 - Markdown 模式) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                写题心得 / 错因剖析 (Markdown 模式)
              </label>
              <span className="text-[11px] text-slate-400 font-normal">支持 LaTeX 公式、代码块、Ctrl+B 粗体</span>
            </div>
            <MarkdownEditor
              value={reflectionContent}
              onChange={setReflectionContent}
              placeholder="初次做这道题的卡壳点、审题漏洞或解题思路总结..."
              minHeight="100px"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isSubmitting ? '保存中...' : '确认录入错题'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
