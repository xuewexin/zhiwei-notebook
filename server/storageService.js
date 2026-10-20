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
    const seedFolders = [
      {
        id: 'math',
        name: '数学',
        parentId: null,
        color: '#3b82f6', // blue
        icon: 'Sigma',
        description: '高频考点、导数、圆锥曲线、立体几何',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'math-derivative',
        name: '函数与导数',
        parentId: 'math',
        color: '#60a5fa',
        icon: 'TrendingUp',
        description: '导数切线、单调性讨论、极值最值与零点',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'math-conic',
        name: '圆锥曲线',
        parentId: 'math',
        color: '#818cf8',
        icon: 'Compass',
        description: '椭圆双曲线离心率、弦长联立消元',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'english',
        name: '英语',
        parentId: null,
        color: '#10b981', // green
        icon: 'Languages',
        description: '语法填空、七选五、完形填空、外刊长难句',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'english-grammar',
        name: '定语从句与时态',
        parentId: 'english',
        color: '#34d399',
        icon: 'BookOpen',
        description: '非谓语动词、介词+which、虚拟语气',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'physics',
        name: '物理',
        parentId: null,
        color: '#f59e0b', // amber
        icon: 'Atom',
        description: '电磁感应、带电粒子在复合场运动',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cs',
        name: '计算机/算法',
        parentId: null,
        color: '#8b5cf6', // purple
        icon: 'Code2',
        description: 'LeetCode、数据结构与动态规划错题',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(FOLDERS_FILE, JSON.stringify(seedFolders, null, 2), 'utf-8');

    // Create seed questions
    seedQuestions();
  }
}

function seedQuestions() {
  const seedQ1 = {
    id: 'seed-q1',
    folderId: 'math-derivative',
    title: '已知函数 f(x) = (x-2)e^x + a(x-1)^2 恒有两个不同极值点，求 a 的取值范围',
    source: '2026高考数学一模压轴题',
    difficulty: 4,
    mastery: 'reviewing',
    tags: ['导数与单调性', '分类讨论', '零点存在性定理'],
    contentType: 'text',
    content: `**【题目】**\n\n已知函数 $f(x) = (x-2)e^x + a(x-1)^2$。\n\n1. 当 $a = 0$ 时，求 $f(x)$ 的单调区间与极值；\n2. 若 $f(x)$ 在 $\\mathbb{R}$ 上存在两个不同的极值点 $x_1, x_2$，求实数 $a$ 的取值范围；\n3. 证明：$x_1 + x_2 > 2$。`,
    reflectionContent: `【错因剖析与心得】\n1. 主要错因：对导函数 f'(x) = (x-1)e^x + 2a(x-1) = (x-1)(e^x + 2a) 提公因式时不彻底，直接对展开式求导导致计算量暴增！\n2. 核心关键点：\n  - 注意观察公因式 (x-1)，提出来后方程简化为 (x-1) = 0 或 e^x + 2a = 0。\n  - 极值点必须满足导函数变号，因此 e^x = -2a 不能出现重根（即 x ≠ 1 且 -2a > 0 => a < 0 且 a ≠ -e/2）。\n  - 极值点偏移第三问用对数均值不等式或构造差函数对称化策略！`,
    errorCauses: ['审题与提公因式不细', '忽略导数变号条件(重根陷阱)', '极值点偏移思路受阻'],
    answerType: 'text',
    answerContent: `**【参考解答】**\n\n$f'(x) = e^x + (x-2)e^x + 2a(x-1) = (x-1)(e^x + 2a)$。\n令 $f'(x) = 0$，得 $x_1 = 1$ 或 $e^x = -2a$。\n若有两个不同极值点，则方程 $e^x = -2a$ 有异于 1 的实根，\n需 $-2a > 0 \\implies a < 0$，且 $e^1 \\neq -2a \\implies a \\neq -\\frac{e}{2}$。\n故 $a \\in (-\\infty, -\\frac{e}{2}) \\cup (-\\frac{e}{2}, 0)$。`,
    attempts: [
      {
        id: 'att-1',
        attemptNumber: 1,
        date: '2026-10-10T14:30:00.000Z',
        result: 'wrong',
        timeSpentMinutes: 25,
        solutionType: 'text',
        solutionContent: `第一次做的时候：展开强行求二阶导，算出 a < 0，但忘记排除 $a = -e/2$ 导致重根不取极值的情况，扣了6分！第三问完全没时间写。`,
        notesMode: 'text',
        notesContent: '重根陷阱非常致命！只要题目要求“两个不同极值点”，不仅导函数要有两根，而且这两根必须互异，且两侧必须变号！下周必须重做一遍。'
      },
      {
        id: 'att-2',
        attemptNumber: 2,
        date: '2026-10-17T09:15:00.000Z',
        result: 'partial',
        timeSpentMinutes: 18,
        solutionType: 'text',
        solutionContent: `第二次做：成功注意到提公因式 $(x-1)$，排除了重根 $a = -e/2$。第三问尝试设 $x_2 = \\ln(-2a)$，利用 $x_1+x_2 = 1+\\ln(-2a)$，结合 $a$ 的范围证明了一半，对称构造函数还没完全熟练。`,
        notesMode: 'markdown',
        notesContent: `**第二次复盘心得**：\n- 提公因式思维已建立，速度提升到 18 分钟。\n- 下次做题时要重点练习极值点偏移的**比值换元法**和**对数均值不等式**：\n  $$\\frac{x_1 - x_2}{\\ln x_1 - \\ln x_2} < \\frac{x_1 + x_2}{2}$$`
      }
    ],
    createdAt: '2026-10-10T14:00:00.000Z',
    updatedAt: '2026-10-17T09:30:00.000Z'
  };

  const seedQ2 = {
    id: 'seed-q2',
    folderId: 'cs',
    title: 'LeetCode 72. 编辑距离 (Edit Distance)',
    source: '力扣高频面试题',
    difficulty: 5,
    mastery: 'unmastered',
    tags: ['动态规划', '字符串', '经典DP'],
    contentType: 'text',
    content: `**【题目】**\n给你两个单词 word1 和 word2，请返回将 word1 转换成 word2 所使用的最少操作数。\n你可以对一个单词进行如下三种操作：\n1. 插入一个字符\n2. 删除一个字符\n3. 替换一个字符`,
    reflectionMode: 'code',
    reflectionContent: `class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        m, n = len(word1), len(word2)\n        # dp[i][j] 表示 word1 前 i 个字符转换到 word2 前 j 个字符的最小操作数\n        dp = [[0] * (n + 1) for _ in range(m + 1)]\n        \n        # base cases\n        for i in range(m + 1):\n            dp[i][0] = i\n        for j in range(n + 1):\n            dp[0][j] = j\n            \n        for i in range(1, m + 1):\n            for j in range(1, n + 1):\n                if word1[i - 1] == word2[j - 1]:\n                    dp[i][j] = dp[i - 1][j - 1]\n                else:\n                    # 插入: dp[i][j-1], 删除: dp[i-1][j], 替换: dp[i-1][j-1]\n                    dp[i][j] = min(dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1]) + 1\n        return dp[m][n]`,
    reflectionCodeLang: 'python',
    errorCauses: ['状态定义边界理解混淆', '二维矩阵初始化漏掉'],
    answerType: 'text',
    answerContent: '状态转移方程：\n若 word1[i-1] == word2[j-1]: dp[i][j] = dp[i-1][j-1]\n否则: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])',
    attempts: [
      {
        id: 'att-cs-1',
        attemptNumber: 1,
        date: '2026-10-15T20:00:00.000Z',
        result: 'wrong',
        timeSpentMinutes: 35,
        solutionType: 'text',
        solutionContent: '第一次做直接想用贪心双指针，遇到不同字符无法权衡是删除、插入还是替换，算法直接崩掉。',
        notesMode: 'code',
        notesContent: `// 错误教训：字符串双序列匹配最少操作数，必须用二维 DP！\n// 千万不要贪心！状态必须记忆化！`,
        codeLanguage: 'cpp'
      }
    ],
    createdAt: '2026-10-15T19:50:00.000Z',
    updatedAt: '2026-10-15T20:40:00.000Z'
  };

  saveQuestion(seedQ1);
  saveQuestion(seedQ2);
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
