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

function getLocalFolders(): Folder[] {
  if (memoryFolders !== null) {
    return [...memoryFolders];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryFolders = parsed;
        return [...parsed];
      }
    }
  } catch (err) {
    console.warn('getLocalFolders read failed:', err);
  }
  memoryFolders = [];
  return [];
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
      if (Array.isArray(parsed)) {
        memoryQuestions = parsed;
        return [...parsed];
      }
    }
  } catch (err) {
    console.warn('getLocalQuestions read failed:', err);
  }
  memoryQuestions = [];
  return [];
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
