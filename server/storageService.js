import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root data folder path: e:\错题本\data
export const DATA_DIR = path.resolve(__dirname, '..', 'data');
export const IMAGES_DIR = path.join(DATA_DIR, 'images');
export const QUESTIONS_DIR = path.join(DATA_DIR, 'questions');
export const NOTES_DIR = path.join(DATA_DIR, 'notes');
export const FOLDERS_FILE = path.join(DATA_DIR, 'folders.json');
export const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Ensure directories exist
export function initStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(QUESTIONS_DIR)) fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });

  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      git: {
        enabled: false,
        platform: 'gitee', // 'github' | 'gitee' | 'custom'
        remoteUrl: '',
        branch: 'main',
        token: '',
        username: '',
        authorName: 'MistakeNotebook User',
        authorEmail: 'user@mistake-notebook.local',
        autoSync: true,
        autoSyncIntervalMinutes: 10,
        lastSyncTime: null,
        lastSyncStatus: 'idle',
        lastSyncMessage: ''
      }
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }

  if (!fs.existsSync(FOLDERS_FILE)) {
    fs.writeFileSync(FOLDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getFolders() {
  if (!fs.existsSync(FOLDERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FOLDERS_FILE, 'utf-8').replace(/^\uFEFF/, ''));
  } catch (e) {
    console.error('Error reading folders:', e);
    return [];
  }
}

export function saveFolders(folders) {
  fs.writeFileSync(FOLDERS_FILE, JSON.stringify(folders, null, 2), 'utf-8');
}

export function getQuestions(filter = {}) {
  if (!fs.existsSync(QUESTIONS_DIR)) return [];
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  let list = [];
  for (const f of files) {
    try {
      const q = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf-8').replace(/^\uFEFF/, ''));
      list.push(q);
    } catch (e) {
      console.error('Error reading question file:', f, e);
    }
  }

  // Sorting: newest updated first
  list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  if (filter.folderId) {
    // If folder has children, include them too
    const allFolders = getFolders();
    const folderIds = getDescendantFolderIds(filter.folderId, allFolders);
    folderIds.add(filter.folderId);
    list = list.filter(q => folderIds.has(q.folderId));
  }

  if (filter.mastery) {
    if (filter.mastery === 'due_today') {
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      list = list.filter(q => !q.nextReviewDate || new Date(q.nextReviewDate).getTime() <= tomorrow);
    } else {
      list = list.filter(q => q.mastery === filter.mastery);
    }
  }

  if (filter.search) {
    const qLower = filter.search.toLowerCase();
    list = list.filter(q => 
      (q.title && q.title.toLowerCase().includes(qLower)) ||
      (q.content && q.content.toLowerCase().includes(qLower)) ||
      (q.reflectionContent && q.reflectionContent.toLowerCase().includes(qLower)) ||
      (q.tags && q.tags.some(t => t.toLowerCase().includes(qLower)))
    );
  }

  return list;
}

function getDescendantFolderIds(parentFolderId, allFolders) {
  const set = new Set();
  const children = allFolders.filter(f => f.parentId === parentFolderId);
  for (const child of children) {
    set.add(child.id);
    const sub = getDescendantFolderIds(child.id, allFolders);
    for (const s of sub) set.add(s);
  }
  return set;
}

export function getQuestionById(id) {
  const filePath = path.join(QUESTIONS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''));
  } catch (e) {
    return null;
  }
}

// Sync question to a clean, human-readable Markdown file named by Creation Date and Title
export function syncQuestionMarkdown(question) {
  try {
    if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });

    const folders = getFolders();
    const folder = folders.find(f => f.id === question.folderId);
    const folderName = folder ? folder.name.replace(/[/\\?%*:|"<>]/g, '_') : '默认分类';
    const folderDir = path.join(NOTES_DIR, folderName);
    if (!fs.existsSync(folderDir)) fs.mkdirSync(folderDir, { recursive: true });

    const createDate = (question.createdAt || new Date().toISOString()).slice(0, 10);
    const safeTitle = (question.title || '未命名错题').slice(0, 50).replace(/[/\\?%*:|"<>]/g, '_').trim();
    const fileName = `[${createDate}] ${safeTitle}.md`;
    const targetFile = path.join(folderDir, fileName);

    const lines = [
      `# ${question.title || '未命名错题'}`,
      '',
      `- **归属学科/分类**: ${folderName}`,
      `- **创建时间**: ${question.createdAt ? new Date(question.createdAt).toLocaleString('zh-CN') : '未知'}`,
      `- **掌握状态**: ${question.mastery === 'mastered' ? '✅ 已掌握' : question.mastery === 'reviewing' ? '🔄 复习中' : '❌ 未掌握'}`,
      `- **难度等级**: ${'★'.repeat(question.difficulty || 3)}`,
      `- **考点标签**: ${(question.tags || []).join(', ') || '无'}`,
      `- **错因剖析**: ${(question.errorCauses || []).join(', ') || '无'}`,
      '',
      '---',
      ''
    ];

    // Question Content Area
    lines.push('## 📌 题目内容呈现');
    if (question.mdContent || (question.contentType !== 'image' && question.content)) {
      lines.push('', question.mdContent || question.content, '');
    }
    if (question.pdfUrl) {
      lines.push(`- **关联试卷/题目 PDF**: [${question.pdfName || '查看文档'}](${question.pdfUrl})`, '');
    }
    const qImages = Array.isArray(question.images) && question.images.length > 0 
      ? question.images 
      : (question.contentType === 'image' && question.content ? [question.content] : []);
    if (qImages.length > 0) {
      lines.push('### 题目图片与截图');
      qImages.forEach((img, i) => lines.push(`![题目原图 ${i + 1}](${img})`));
      lines.push('');
    }
    const qDrawings = Array.isArray(question.drawingPages) && question.drawingPages.length > 0
      ? question.drawingPages
      : (question.drawingData ? [question.drawingData] : []);
    if (qDrawings.length > 0) {
      lines.push('### 🎨 题目手绘草稿与批注 (共 ' + qDrawings.length + ' 页)');
      qDrawings.forEach((pg, i) => lines.push(`![题目手绘 第 ${i + 1} 页](${pg})`));
      lines.push('');
    }

    // Standard Answer Area
    if (question.answerContent || question.answerMd || question.answerPdfUrl || (question.answerImages && question.answerImages.length > 0) || question.answerDrawing || (question.answerDrawingPages && question.answerDrawingPages.length > 0)) {
      lines.push('## 🎯 参考标准解答');
      if (question.answerMd || (question.answerType !== 'image' && question.answerContent)) {
        lines.push('', question.answerMd || question.answerContent, '');
      }
      if (question.answerPdfUrl) {
        lines.push(`- **关联官方解析 PDF**: [${question.answerPdfName || '查看解析'}](${question.answerPdfUrl})`, '');
      }
      const ansImages = Array.isArray(question.answerImages) && question.answerImages.length > 0
        ? question.answerImages
        : (question.answerType === 'image' && question.answerContent ? [question.answerContent] : []);
      if (ansImages.length > 0) {
        lines.push('### 标准解答手稿与图片');
        ansImages.forEach((img, i) => lines.push(`![解析图 ${i + 1}](${img})`));
        lines.push('');
      }
      const ansDrawings = Array.isArray(question.answerDrawingPages) && question.answerDrawingPages.length > 0
        ? question.answerDrawingPages
        : (question.answerDrawing ? [question.answerDrawing] : []);
      if (ansDrawings.length > 0) {
        lines.push('### 🎨 标准解答手绘批注 (共 ' + ansDrawings.length + ' 页)');
        ansDrawings.forEach((pg, i) => lines.push(`![答案手写 第 ${i + 1} 页](${pg})`));
        lines.push('');
      }
    }

    // Reflection Area
    if (question.reflectionContent || question.reflectionMd || question.reflectionPdfUrl || (question.reflectionImages && question.reflectionImages.length > 0) || question.reflectionDrawing || (question.reflectionDrawingPages && question.reflectionDrawingPages.length > 0)) {
      lines.push('## 💡 写题心得与错因剖析');
      if (question.reflectionMd || question.reflectionContent) {
        lines.push('', question.reflectionMd || question.reflectionContent, '');
      }
      if (question.reflectionPdfUrl) {
        lines.push(`- **关联心得资料 PDF**: [${question.reflectionPdfName || '查看资料'}](${question.reflectionPdfUrl})`, '');
      }
      if (Array.isArray(question.reflectionImages) && question.reflectionImages.length > 0) {
        lines.push('### 复盘手写笔记与模型卡');
        question.reflectionImages.forEach((img, i) => lines.push(`![笔记照片 ${i + 1}](${img})`));
        lines.push('');
      }
      const refDrawings = Array.isArray(question.reflectionDrawingPages) && question.reflectionDrawingPages.length > 0
        ? question.reflectionDrawingPages
        : (question.reflectionDrawing ? [question.reflectionDrawing] : []);
      if (refDrawings.length > 0) {
        lines.push('### 🎨 复盘手绘图与草稿 (共 ' + refDrawings.length + ' 页)');
        refDrawings.forEach((pg, i) => lines.push(`![心得手绘 第 ${i + 1} 页](${pg})`));
        lines.push('');
      }
    }

    if (Array.isArray(question.attempts) && question.attempts.length > 0) {
      lines.push('---', '', '## 📝 历次做题演练分区与打卡记录', '');
      question.attempts.forEach(att => {
        const resultLabel = att.result === 'correct' ? '✅ 正确' : att.result === 'partial' ? '⚠️ 部分正确/步骤分' : '❌ 解答错误';
        const dateStr = att.date ? new Date(att.date).toLocaleString('zh-CN') : '';
        lines.push(`### 第 ${att.attemptNumber} 次做题 (${resultLabel} · 耗时 ${att.timeSpentMinutes || 0} 分钟 · ${dateStr})`, '');
        if (att.mdContent) {
          lines.push('#### 演练与步骤笔记', att.mdContent, '');
        }
        if (att.pdfUrl) {
          lines.push(`- **关联 PDF 讲义/试卷**: [${att.pdfName || '查看文档'}](${att.pdfUrl})`, '');
        }
        if (Array.isArray(att.images) && att.images.length > 0) {
          lines.push('#### 演算草稿照片');
          att.images.forEach((img, i) => {
            lines.push(`![草稿 ${i + 1}](${img})`);
          });
          lines.push('');
        }
        const attDrawings = Array.isArray(att.drawingPages) && att.drawingPages.length > 0
          ? att.drawingPages
          : (att.drawingData ? [att.drawingData] : []);
        if (attDrawings.length > 0) {
          lines.push('#### 🎨 触控手写演算板 (共 ' + attDrawings.length + ' 页)');
          attDrawings.forEach((pg, i) => lines.push(`![手写演算 第 ${i + 1} 页](${pg})`));
          lines.push('');
        }
      });
    }

    fs.writeFileSync(targetFile, lines.join('\n'), 'utf-8');
  } catch (err) {
    console.error('生成 Markdown 笔记失败:', err);
  }
}

export function saveQuestion(question) {
  if (!question.id) {
    question.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }
  question.updatedAt = new Date().toISOString();
  if (!question.createdAt) {
    question.createdAt = question.updatedAt;
  }
  if (!Array.isArray(question.attempts)) {
    question.attempts = [];
  }
  if (question.reviewStage === undefined) {
    question.reviewStage = 0;
  }
  if (!question.nextReviewDate) {
    // Default: review tomorrow (in 1 day)
    question.nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  const filePath = path.join(QUESTIONS_DIR, `${question.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(question, null, 2), 'utf-8');
  syncQuestionMarkdown(question);
  return question;
}

export function deleteQuestion(id) {
  const filePath = path.join(QUESTIONS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

export function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) initStorage();
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8').replace(/^\uFEFF/, ''));
  } catch (e) {
    return {};
  }
}

export function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  return cfg;
}
