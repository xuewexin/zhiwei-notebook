import { Folder, Question, Attempt, GitConfig, GitStatus, SyncLog, QuestionVersion, MasteryStatus } from '../types';

const STORAGE_KEYS = {
  FOLDERS: 'zhiwei_folders_pure_v1',
  QUESTIONS: 'zhiwei_questions_pure_v1',
  CONFIG: 'zhiwei_config_pure_v1',
  LOGS: 'zhiwei_logs_pure_v1'
};

// Clean up old legacy keys to prevent QuotaExceededError and bloat
try {
  const legacyKeys = [
    'mistake_notebook_folders',
    'mistake_notebook_questions',
    'mistake_notebook_git_config',
    'mistake_notebook_git_logs',
    'zhiwei_folders_v1',
    'zhiwei_questions_v1',
    'zhiwei_config_v1',
    'zhiwei_logs_v1'
  ];
  for (const k of legacyKeys) {
    localStorage.removeItem(k);
  }
} catch {}

let memoryFolders: Folder[] | null = null;
let memoryQuestions: Question[] | null = null;

const INITIAL_STARTER_FOLDERS: Folder[] = [
  {
    id: "folder-math",
    name: "高等数学 · 导数与积分",
    parentId: null,
    color: "#1e56a0",
    icon: "Sigma",
    description: "泰勒展开、极值点偏移、不定积分技巧与微分方程",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "folder-physics",
    name: "大学物理 · 电磁场",
    parentId: null,
    color: "#6d28d9",
    icon: "Atom",
    description: "高斯定理、麦克斯韦方程组、电磁感应定律与波动力学",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "folder-cs",
    name: "数据结构与算法",
    parentId: null,
    color: "#047857",
    icon: "Code2",
    description: "二叉树递归遍历、动态规划状态转移、图论与背包问题",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "folder-english",
    name: "考研英语 · 题源长难句",
    parentId: null,
    color: "#b45309",
    icon: "BookOpen",
    description: "经济学人外刊精读、非谓语动词结构、倒装句与长难翻译",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_STARTER_QUESTIONS: Question[] = [
  {
    id: "seed-q1",
    folderId: "folder-math",
    title: "求未定式极限 $\\lim_{x \\to 0} \\frac{x - \\sin x}{x^3}$ 并给出泰勒级数与洛必达证明",
    source: "2026 全国硕士研究生统一招生考试 · 数学一",
    difficulty: 4,
    mastery: "unmastered",
    tags: ["极限与连续", "泰勒展开", "麦克劳林级数", "洛必达法则"],
    contentType: "text",
    content: "### 题目描述\n\n求极限：\n$$\\lim_{x \\to 0} \\frac{x - \\sin x}{x^3}$$\n\n试分别采用 **麦克劳林展开（泰勒公式）** 与 **洛必达法则** 求解，并说明在什么情况下泰勒展开显著优于洛必达法则。",
    standardAnswer: "### 标准解析\n\n#### 方法一：泰勒公式（麦克劳林展开，推荐）\n根据已知常用展开式：\n$$\\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} + o(x^5) = x - \\frac{x^3}{6} + o(x^3)$$\n\n代入原式：\n$$\\lim_{x \\to 0} \\frac{x - \\left(x - \\frac{x^3}{6} + o(x^3)\\right)}{x^3} = \\lim_{x \\to 0} \\frac{\\frac{x^3}{6} + o(x^3)}{x^3} = \\frac{1}{6}$$\n\n#### 方法二：洛必达法则\n原式为 $\\frac{0}{0}$ 型未定式，连续求导三次：\n$$\\lim_{x \\to 0} \\frac{x - \\sin x}{x^3} = \\lim_{x \\to 0} \\frac{1 - \\cos x}{3x^2} = \\lim_{x \\to 0} \\frac{\\sin x}{6x} = \\frac{1}{6}$$",
    reflectionContent: "### 解题心得与错因反思\n1. **核心突破口**：遇到形如 $x - \\sin x$ 或 $x - \\tan x$ 的相消项，洛必达法则需连续多次求导容易算错，而直接展开到分母阶数（3阶）一步到位！\n2. **考点警示**：注意展开时精度必须一致，分母为 $x^3$，分子必须展开至 $x^3$ 项！",
    errorCauses: ["公式遗忘", "审题失误"],
    attempts: [],
    nextReviewDate: new Date().toISOString(),
    reviewStage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "seed-q2",
    folderId: "folder-physics",
    title: "麦克斯韦全电流安培环路定理与位移电流连续性推导",
    source: "大学物理（下）· 电磁学期末核心大题",
    difficulty: 5,
    mastery: "unmastered",
    tags: ["电磁学", "麦克斯韦方程组", "位移电流", "高斯定理"],
    contentType: "text",
    content: "### 题目描述\n\n电容器在充放电过程中，两极板之间的导线内存在传导电流 $I_c$。试依据电荷守恒定律与高斯定理，推导两极板之间的位移电流 $I_d$ 的表达式，并写出包含位移电流的安培环路定理积分形式。",
    standardAnswer: "### 标准解析\n\n极板间电位移通量为：\n$$\\Phi_D = \\iint_S \\vec{D} \\cdot d\\vec{S} = q$$\n\n两边对时间求导：\n$$I_d = \\frac{d\\Phi_D}{dt} = \\iint_S \\frac{\\partial \\vec{D}}{\\partial t} \\cdot d\\vec{S}$$\n\n修改后的安培环路定理为：\n$$\\oint_L \\vec{H} \\cdot d\\vec{l} = \\iint_S \\left( \\vec{j} + \\frac{\\partial \\vec{D}}{\\partial t} \\right) \\cdot d\\vec{S}$$",
    reflectionContent: "位移电流的本质是变化的电场激发磁场，切勿死记公式，从场与通量的变化率理解！",
    errorCauses: ["知识盲区", "计算失误"],
    attempts: [],
    nextReviewDate: new Date().toISOString(),
    reviewStage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "seed-q3",
    folderId: "folder-cs",
    title: "最长递增子序列（LIS）二分查找优化 $O(N \\log N)$ 状态转移",
    source: "LeetCode 300 / 考研计算机 408 算法真题",
    difficulty: 4,
    mastery: "unmastered",
    tags: ["动态规划", "贪心算法", "二分查找", "408统考"],
    contentType: "text",
    content: "### 题目描述\n\n给你一个整数数组 `nums`，找到其中最长严格递增子序列的长度。\n\n请分析普通动态规划 $O(N^2)$ 与耐人寻味的贪心+二分优化 $O(N \\log N)$ 的状态转移设计。",
    standardAnswer: "### 核心算法实现\n\n```python\nclass Solution:\n    def lengthOfLIS(self, nums: list[int]) -> int:\n        tails = []\n        for x in nums:\n            i, j = 0, len(tails)\n            while i < j:\n                m = (i + j) // 2\n                if tails[m] < x:\n                    i = m + 1\n                else:\n                    j = m\n            if i == len(tails):\n                tails.append(x)\n            else:\n                tails[i] = x\n        return len(tails)\n```",
    reflectionContent: "维护 tails[k] 表示长度为 k+1 的所有递增子序列中最小的末尾元素。贪心策略：末尾元素越小，后续越容易接上更大的数！",
    errorCauses: ["思维定势"],
    attempts: [],
    nextReviewDate: new Date().toISOString(),
    reviewStage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function getLocalFolders(): Folder[] {
  if (memoryFolders !== null) {
    return [...memoryFolders];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryFolders = parsed;
        return [...parsed];
      }
    }
  } catch (err) {
    console.warn('getLocalFolders read failed:', err);
  }
  // Initialize default starter folders if pristine/empty
  memoryFolders = [...INITIAL_STARTER_FOLDERS];
  saveLocalFolders(INITIAL_STARTER_FOLDERS);
  return [...INITIAL_STARTER_FOLDERS];
}

function saveLocalFolders(folders: Folder[]): void {
  memoryFolders = [...folders];
  try {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (err) {
    console.warn('saveLocalFolders write failed:', err);
  }
}

function getLocalQuestions(): Question[] {
  if (memoryQuestions !== null) {
    return [...memoryQuestions];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryQuestions = parsed;
        return [...parsed];
      }
    }
  } catch (err) {
    console.warn('getLocalQuestions read failed:', err);
  }
  // Initialize default starter questions if pristine/empty
  memoryQuestions = [...INITIAL_STARTER_QUESTIONS];
  saveLocalQuestions(INITIAL_STARTER_QUESTIONS);
  return [...INITIAL_STARTER_QUESTIONS];
}

function saveLocalQuestions(questions: Question[]): void {
  memoryQuestions = [...questions];
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.warn('localStorage write failed:', err);
  }
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
    if (!isImage) {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 1600;
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  });
}

function compressBase64(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/') || dataUrl.length < 350000) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 1600;
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const EBBINGHAUS_DAYS = [1, 2, 4, 7, 15, 30];

export const localEngine = {
  async getFolders(): Promise<Folder[]> {
    return getLocalFolders();
  },

  async createFolder(data: Partial<Folder>): Promise<Folder> {
    const folders = getLocalFolders();
    const newFolder: Folder = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: data.name || '新建分类',
      parentId: (data.parentId && typeof data.parentId === 'string' && data.parentId.trim() !== '') ? data.parentId.trim() : null,
      color: data.color || '#3b82f6',
      icon: data.icon || 'Folder',
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    folders.push(newFolder);
    saveLocalFolders(folders);
    return newFolder;
  },

  async updateFolder(id: string, data: Partial<Folder>): Promise<Folder> {
    const folders = getLocalFolders();
    const idx = folders.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('文件夹未找到');
    folders[idx] = {
      ...folders[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };
    saveLocalFolders(folders);
    return folders[idx];
  },

  async deleteFolder(id: string): Promise<{ success: boolean; deletedFolderIds: string[] }> {
    let folders = getLocalFolders();
    const idsToDelete = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      folders.forEach(f => {
        if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
          idsToDelete.add(f.id);
          changed = true;
        }
      });
    }
    folders = folders.filter(f => !idsToDelete.has(f.id));
    saveLocalFolders(folders);

    // Also delete or unclassify questions inside these folders
    let questions = getLocalQuestions();
    questions = questions.filter(q => !idsToDelete.has(q.folderId));
    saveLocalQuestions(questions);

    return { success: true, deletedFolderIds: Array.from(idsToDelete) };
  },

  async getQuestions(params: { folderId?: string; search?: string; mastery?: string } = {}): Promise<Question[]> {
    let list = getLocalQuestions();
    if (params.folderId) {
      const folders = getLocalFolders();
      const getDescendants = (pId: string): Set<string> => {
        const s = new Set<string>();
        folders.filter(f => f.parentId === pId).forEach(c => {
          s.add(c.id);
          getDescendants(c.id).forEach(sub => s.add(sub));
        });
        return s;
      };
      const allowed = getDescendants(params.folderId);
      allowed.add(params.folderId);
      list = list.filter(q => allowed.has(q.folderId));
    }

    if (params.mastery) {
      if (params.mastery === 'due_today') {
        const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
        list = list.filter(q => !q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= tomorrow);
      } else {
        list = list.filter(q => q.mastery === params.mastery);
      }
    }

    if (params.search) {
      const qLower = params.search.toLowerCase();
      list = list.filter(q =>
        (q.title && q.title.toLowerCase().includes(qLower)) ||
        (q.content && q.content.toLowerCase().includes(qLower)) ||
        (q.reflectionContent && q.reflectionContent.toLowerCase().includes(qLower)) ||
        (q.tags && q.tags.some(t => t.toLowerCase().includes(qLower)))
      );
    }

    list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return list;
  },

  async getQuestionById(id: string): Promise<Question> {
    const questions = getLocalQuestions();
    const q = questions.find(item => item.id === id);
    if (!q) throw new Error('错题未找到');
    return q;
  },

  async createQuestion(data: Partial<Question>): Promise<Question> {
    const questions = getLocalQuestions();
    const newQuestion: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      folderId: data.folderId || 'math',
      title: data.title || '无标题错题',
      source: data.source || '',
      difficulty: data.difficulty || 3,
      mastery: data.mastery || 'unmastered',
      tags: data.tags || [],
      contentType: data.contentType || 'text',
      content: data.content || '',
      mdContent: data.mdContent || data.content || '',
      pdfUrl: data.pdfUrl || '',
      pdfName: data.pdfName || '',
      images: data.images || [],
      drawingData: data.drawingData || '',
      drawingPages: data.drawingPages || [''],
      questionOverlayDrawings: data.questionOverlayDrawings || {},
      questionDefaultTab: data.questionDefaultTab || 'md',
      answerContent: data.answerContent || '',
      answerMd: data.answerMd || data.answerContent || '',
      answerPdfUrl: data.answerPdfUrl || '',
      answerPdfName: data.answerPdfName || '',
      answerImages: data.answerImages || [],
      answerDrawing: data.answerDrawing || '',
      answerDrawingPages: data.answerDrawingPages || [''],
      answerOverlayDrawings: data.answerOverlayDrawings || {},
      answerDefaultTab: data.answerDefaultTab || 'md',
      reflectionContent: data.reflectionContent || '',
      reflectionMd: data.reflectionMd || data.reflectionContent || '',
      reflectionPdfUrl: data.reflectionPdfUrl || '',
      reflectionPdfName: data.reflectionPdfName || '',
      reflectionImages: data.reflectionImages || [],
      reflectionDrawing: data.reflectionDrawing || '',
      reflectionDrawingPages: data.reflectionDrawingPages || [''],
      reflectionOverlayDrawings: data.reflectionOverlayDrawings || {},
      reflectionDefaultTab: data.reflectionDefaultTab || 'md',
      errorCauses: data.errorCauses || [],
      attempts: [],
      reviewStage: 0,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    questions.unshift(newQuestion);
    saveLocalQuestions(questions);
    return newQuestion;
  },

  async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    const questions = getLocalQuestions();
    const idx = questions.findIndex(item => item.id === id);
    if (idx === -1) throw new Error('错题未找到');
    questions[idx] = {
      ...questions[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };
    saveLocalQuestions(questions);
    return questions[idx];
  },

  async deleteQuestion(id: string): Promise<boolean> {
    let questions = getLocalQuestions();
    questions = questions.filter(q => q.id !== id);
    saveLocalQuestions(questions);
    return true;
  },

  async addAttempt(questionId: string, attemptData: Partial<Attempt>): Promise<{ success: boolean; question: Question; newAttempt: Attempt }> {
    const questions = getLocalQuestions();
    const idx = questions.findIndex(q => q.id === questionId);
    if (idx === -1) throw new Error('错题未找到');
    const question = questions[idx];
    const currentAttempts = question.attempts || [];

    const newAttempt: Attempt = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      attemptNumber: currentAttempts.length + 1,
      date: attemptData.date || new Date().toISOString(),
      result: attemptData.result || 'wrong',
      timeSpentMinutes: attemptData.timeSpentMinutes || 0,
      mdContent: attemptData.mdContent || '',
      pdfUrl: attemptData.pdfUrl || '',
      pdfName: attemptData.pdfName || '',
      images: attemptData.images || [],
      defaultTab: attemptData.defaultTab || 'md',
      drawingData: attemptData.drawingData || '',
      drawingPages: attemptData.drawingPages || [''],
      overlayDrawings: attemptData.overlayDrawings || {}
    };

    question.attempts = [...currentAttempts, newAttempt];

    let stage = question.reviewStage !== undefined ? question.reviewStage : 0;
    let nextDays = 1;
    if (newAttempt.result === 'correct') {
      stage = Math.min(stage + 1, EBBINGHAUS_DAYS.length - 1);
      nextDays = EBBINGHAUS_DAYS[stage];
      question.mastery = stage >= 4 ? 'mastered' : 'reviewing';
    } else if (newAttempt.result === 'partial') {
      stage = Math.max(stage - 1, 0);
      nextDays = 2;
      question.mastery = 'reviewing';
    } else {
      stage = 0;
      nextDays = 1;
      question.mastery = 'unmastered';
    }

    question.reviewStage = stage;
    question.lastReviewDate = new Date().toISOString();
    question.nextReviewDate = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString();
    question.updatedAt = new Date().toISOString();

    questions[idx] = question;
    saveLocalQuestions(questions);
    return { success: true, question, newAttempt };
  },

  async updateAttempt(questionId: string, attemptId: string, attemptData: Partial<Attempt>): Promise<{ success: boolean; question: Question; updatedAttempt: Attempt }> {
    const questions = getLocalQuestions();
    const qIdx = questions.findIndex(q => q.id === questionId);
    if (qIdx === -1) throw new Error('错题未找到');
    const question = questions[qIdx];
    const aIdx = (question.attempts || []).findIndex(a => a.id === attemptId);
    if (aIdx === -1) throw new Error('练习记录未找到');
    question.attempts[aIdx] = {
      ...question.attempts[aIdx],
      ...attemptData
    };
    question.updatedAt = new Date().toISOString();
    questions[qIdx] = question;
    saveLocalQuestions(questions);
    return { success: true, question, updatedAttempt: question.attempts[aIdx] };
  },

  async deleteAttempt(questionId: string, attemptId: string): Promise<{ success: boolean; question: Question }> {
    const questions = getLocalQuestions();
    const qIdx = questions.findIndex(q => q.id === questionId);
    if (qIdx === -1) throw new Error('错题未找到');
    const question = questions[qIdx];
    question.attempts = (question.attempts || []).filter(a => a.id !== attemptId);
    question.attempts.forEach((a, i) => { a.attemptNumber = i + 1; });
    question.updatedAt = new Date().toISOString();
    questions[qIdx] = question;
    saveLocalQuestions(questions);
    return { success: true, question };
  },

  async uploadFile(file: File): Promise<{ success: boolean; url: string; filename: string; originalName: string; isPdf?: boolean }> {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const dataUrl = await compressImageFile(file);
    return {
      success: true,
      url: dataUrl,
      filename: `${Date.now()}_${file.name}`,
      originalName: file.name,
      isPdf
    };
  },

  async uploadImage(file: File): Promise<{ success: boolean; url: string; filename: string; originalName: string; isPdf?: boolean }> {
    return this.uploadFile(file);
  },

  async uploadBase64(base64Data: string): Promise<{ success: boolean; url: string; filename: string }> {
    const finalUrl = await compressBase64(base64Data);
    return {
      success: true,
      url: finalUrl,
      filename: `img_${Date.now()}.jpg`
    };
  },

  async getGitConfig(): Promise<GitConfig> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      enabled: false,
      platform: 'gitee',
      remoteUrl: '',
      branch: 'main',
      username: '',
      token: ''
    };
  },

  async saveGitConfig(config: Partial<GitConfig>): Promise<{ success: boolean; config: GitConfig }> {
    const current = await this.getGitConfig();
    const updated: GitConfig = { ...current, ...config };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    return { success: true, config: updated };
  },

  async getGitStatus(): Promise<GitStatus> {
    return {
      isRepo: true,
      currentBranch: 'main',
      hasRemote: false,
      isClean: true,
      ahead: 0,
      behind: 0,
      modified: [],
      untracked: []
    };
  },

  async getGitLogs(): Promise<SyncLog[]> {
    return [];
  },

  async pullGit(): Promise<{ success: boolean; message?: string }> {
    return { success: true, message: '单机纯净版：离线本地存储已就绪' };
  },

  async pushGit(): Promise<{ success: boolean; message?: string }> {
    return { success: true, message: '单机纯净版：本地数据已自动保存' };
  },

  async syncGit(): Promise<{ success: boolean; pull: any; push: any }> {
    return { success: true, pull: { success: true }, push: { success: true } };
  },

  async getQuestionVersions(): Promise<QuestionVersion[]> {
    return [];
  },

  async getQuestionAtVersion(): Promise<Question> {
    throw new Error('本地离线模式无快照版本');
  },

  async rollbackQuestion(): Promise<{ success: boolean; question: Question }> {
    throw new Error('本地离线模式无快照版本');
  }
};
