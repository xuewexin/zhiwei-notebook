export type MasteryStatus = 'unmastered' | 'reviewing' | 'mastered';
export type AttemptResult = 'correct' | 'wrong' | 'partial';
export type EditorMode = 'text' | 'markdown' | 'code';
export type ContentType = 'image' | 'text';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceTab = 'all' | 'md' | 'pdf' | 'images' | 'drawing';

export interface OverlayDrawings {
  md?: string;
  pdf?: string;
  images?: string;
}

export interface Attempt {
  id: string;
  attemptNumber: number;
  date: string;
  result: AttemptResult;
  timeSpentMinutes?: number;

  // 4 Separated Areas
  mdContent?: string;      // 1. MD记录区 (包含步骤、推导、LaTeX公式、代码块、复盘体会)
  pdfUrl?: string;         // 2. PDF展示区 (讲义/试卷/标准答案 PDF 访问链接)
  pdfName?: string;        // PDF 文件名
  images?: string[];       // 3. 照片展示区 (演算纸手写草稿、做题截图等多图列表)
  drawingData?: string;    // 4. 手绘草稿与批注 (独立于MD/PDF/照片的触控笔迹层，首页或主图)
  drawingPages?: string[]; // 4. 手绘草稿多页列表 (通过角标自由切换/加页)
  overlayDrawings?: OverlayDrawings; // 各模式独立透明手写批注层 (MD / PDF / 照片)
  defaultTab?: WorkspaceTab; // 本做题单元的默认展示模式 (默认 'md')

  // Legacy backwards compatibility fields
  solutionType?: ContentType;
  solutionMode?: EditorMode;
  solutionContent?: string;
  notesMode?: EditorMode;
  notesContent?: string;
  codeLanguage?: string;
}

export interface Question {
  id: string;
  folderId: string;
  title: string;
  source?: string;
  difficulty: number; // 1-5
  mastery: MasteryStatus;
  tags: string[];
  
  // 1. 题目本身 (支持 MD / PDF / 照片 / 手绘 四种方式，默认展示 MD)
  contentType: ContentType;
  content: string; // image url or text (legacy)
  mdContent?: string;
  pdfUrl?: string;
  pdfName?: string;
  images?: string[];
  drawingData?: string; // 题目手绘草稿与批注层 (单页/主页)
  drawingPages?: string[]; // 题目手绘多页列表
  questionOverlayDrawings?: OverlayDrawings; // 题目各模式独立透明手写批注层 (MD / PDF / 照片)
  questionDefaultTab?: WorkspaceTab; // 题目原题单元的默认展示 (默认 'md')

  // 2. 参考答案/解析 (支持 MD / PDF / 照片 / 手绘 四种方式，默认展示 MD)
  answerType?: ContentType;
  answerContent?: string;
  answerMd?: string;
  answerPdfUrl?: string;
  answerPdfName?: string;
  answerImages?: string[];
  answerDrawing?: string; // 标准答案手绘草稿与批注层
  answerDrawingPages?: string[]; // 标准答案手绘多页列表
  answerOverlayDrawings?: OverlayDrawings; // 答案各模式独立透明手写批注层 (MD / PDF / 照片)
  answerDefaultTab?: WorkspaceTab; // 标准答案单元的默认展示 (默认 'md')

  // 3. 写题心得与错因剖析 (支持 MD / PDF / 照片 / 手绘 四种方式，默认展示 MD)
  reflectionMode?: EditorMode;
  reflectionContent?: string;
  reflectionMd?: string;
  reflectionPdfUrl?: string;
  reflectionPdfName?: string;
  reflectionImages?: string[];
  reflectionDrawing?: string; // 心得手绘草稿与批注层
  reflectionDrawingPages?: string[]; // 心得手绘多页列表
  reflectionOverlayDrawings?: OverlayDrawings; // 心得各模式独立透明手写批注层 (MD / PDF / 照片)
  reflectionDefaultTab?: WorkspaceTab; // 心得剖析单元的默认展示 (默认 'md')
  errorCauses?: string[];

  // 4. 历次做题分区
  attempts: Attempt[];

  // 艾宾浩斯遗忘循环算法字段
  reviewStage?: number;      // 0:初次, 1:第1阶段(2天), 2:第2阶段(4天), 3:第3阶段(7天), 4:第4阶段(15天), 5:第5阶段(30天完全掌握)
  nextReviewDate?: string;   // 下次艾宾浩斯建议复盘日期 (ISO)
  lastReviewDate?: string;   // 上次复盘日期 (ISO)

  createdAt: string;
  updatedAt: string;
}

export interface GitConfig {
  enabled: boolean;
  platform: 'github' | 'gitee' | 'custom';
  remoteUrl: string;
  branch: string;
  username: string;
  token: string;
  authorName: string;
  authorEmail: string;
  autoSync: boolean;
  autoSyncIntervalMinutes: number;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'syncing' | 'idle';
  lastSyncMessage?: string;
}

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  hasUncommittedChanges: boolean;
  changesSummary: string;
  commitCount: number;
  autoSyncEnabled: boolean;
  autoSyncIntervalMinutes: number;
  nextAutoSyncTimestamp: number | null;
  lastSyncTime: string | null;
  lastSyncStatus: string;
  lastSyncMessage: string;
  isSyncing?: boolean;
  pendingPush?: boolean;
  pendingPushDeadline?: number | null;
}

export interface SyncLog {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: string | null;
}

export interface QuestionVersion {
  commitHash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  isMerge: boolean;
  isConflict: boolean;
  isCurrent: boolean;
}
