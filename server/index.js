import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initStorage,
  getFolders,
  saveFolders,
  getQuestions,
  getQuestionById,
  saveQuestion,
  deleteQuestion,
  getConfig,
  saveConfig,
  IMAGES_DIR
} from './storageService.js';
import {
  ensureGitRepo,
  pullRemote,
  pushRemote,
  fullSync,
  getGitStatus,
  getLogs,
  restartAutoSync,
  scheduleAutoPush,
  getQuestionVersions,
  getQuestionAtVersion,
  rollbackQuestion
} from './gitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Init storage and seed data
initStorage();
ensureGitRepo().then(() => {
  restartAutoSync();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve images statically
app.use('/uploads', express.static(IMAGES_DIR));

// Configure multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const prefix = ext.toLowerCase() === '.pdf' ? 'pdf_' : 'img_';
    const uniqueName = `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 8)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// File upload endpoint (supports PDF, PNG, JPG, WEBP, and clipboard paste)
app.post('/api/upload', upload.any(), (req, res) => {
  const file = (req.files && req.files.length > 0) ? req.files[0] : req.file;
  if (!file) {
    return res.status(400).json({ error: '没有上传任何文件' });
  }
  let originalName = file.originalname;
  try {
    originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  } catch {}

  const fileUrl = `/uploads/${file.filename}`;
  scheduleAutoPush(`上传文件: ${originalName}`);
  res.json({
    success: true,
    url: fileUrl,
    filename: file.filename,
    originalName: originalName,
    size: file.size,
    isPdf: path.extname(file.originalname).toLowerCase() === '.pdf'
  });
});

// Upload base64 image (useful for direct canvas / clipboard paste)
app.post('/api/upload-base64', (req, res) => {
  try {
    const { data, filename } = req.body;
    if (!data) return res.status(400).json({ error: '缺少图片数据' });
    
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = '.png';
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
      const mime = matches[1];
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      if (mime.includes('webp')) ext = '.webp';
    } else {
      buffer = Buffer.from(data, 'base64');
    }

    const uniqueName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 8)}${ext}`;
    const targetPath = path.join(IMAGES_DIR, uniqueName);
    fs.writeFileSync(targetPath, buffer);

    scheduleAutoPush('上传图片');
    res.json({ success: true, url: `/uploads/${uniqueName}`, filename: uniqueName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= FOLDER APIS =================
app.get('/api/folders', (req, res) => {
  const folders = getFolders();
  res.json(folders);
});

app.post('/api/folders', (req, res) => {
  const { name, parentId, color, icon, description } = req.body;
  if (!name) return res.status(400).json({ error: '文件夹名称不能为空' });

  const folders = getFolders();
  const newFolder = {
    id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    name,
    parentId: parentId || null,
    color: color || '#3b82f6',
    icon: icon || 'Folder',
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  folders.push(newFolder);
  saveFolders(folders);
  scheduleAutoPush(`新建分类: ${newFolder.name}`);
  res.json(newFolder);
});

app.put('/api/folders/:id', (req, res) => {
  const { id } = req.params;
  const { name, parentId, color, icon, description } = req.body;
  const folders = getFolders();
  const idx = folders.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: '文件夹未找到' });

  folders[idx] = {
    ...folders[idx],
    name: name !== undefined ? name : folders[idx].name,
    parentId: parentId !== undefined ? parentId : folders[idx].parentId,
    color: color !== undefined ? color : folders[idx].color,
    icon: icon !== undefined ? icon : folders[idx].icon,
    description: description !== undefined ? description : folders[idx].description,
    updatedAt: new Date().toISOString()
  };
  saveFolders(folders);
  scheduleAutoPush(`修改分类: ${folders[idx].name}`);
  res.json(folders[idx]);
});

app.delete('/api/folders/:id', (req, res) => {
  const { id } = req.params;
  let folders = getFolders();
  // Filter out the folder and its children
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
  saveFolders(folders);
  scheduleAutoPush('删除分类');
  res.json({ success: true, deletedFolderIds: Array.from(idsToDelete) });
});

// ================= QUESTION APIS =================
app.get('/api/questions', (req, res) => {
  const { folderId, search, mastery } = req.query;
  const list = getQuestions({ folderId, search, mastery });
  res.json(list);
});

app.get('/api/questions/:id', (req, res) => {
  const question = getQuestionById(req.params.id);
  if (!question) return res.status(404).json({ error: '错题未找到' });
  res.json(question);
});

app.post('/api/questions', (req, res) => {
  const qData = req.body;
  if (!qData.title && !qData.content) {
    return res.status(400).json({ error: '题目内容或标题不能为空' });
  }
  const saved = saveQuestion(qData);
  const createdDateStr = saved.createdAt ? new Date(saved.createdAt).toLocaleString('zh-CN') : '未知';
  scheduleAutoPush(`新增错题: 《${saved.title || '无标题'}》 (创建时间: ${createdDateStr})`);
  res.json(saved);
});

app.put('/api/questions/:id', (req, res) => {
  const existing = getQuestionById(req.params.id);
  if (!existing) return res.status(404).json({ error: '错题未找到' });
  const updated = saveQuestion({
    ...existing,
    ...req.body,
    id: req.params.id
  });
  const createdDateStr = updated.createdAt ? new Date(updated.createdAt).toLocaleString('zh-CN') : '未知';
  scheduleAutoPush(`修改错题: 《${updated.title || '无标题'}》 (创建时间: ${createdDateStr})`);
  res.json(updated);
});

app.delete('/api/questions/:id', (req, res) => {
  const ok = deleteQuestion(req.params.id);
  if (ok) {
    scheduleAutoPush('删除错题');
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '错题未找到或已被删除' });
  }
});

// Add a follow-up attempt ("第一次做", "第二次做", ...)
app.post('/api/questions/:id/attempts', (req, res) => {
  const question = getQuestionById(req.params.id);
  if (!question) return res.status(404).json({ error: '错题未找到' });

  const currentAttempts = question.attempts || [];
  const nextNumber = currentAttempts.length + 1;

  const newAttempt = {
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    attemptNumber: nextNumber,
    date: req.body.date || new Date().toISOString(),
    result: req.body.result || 'wrong', // 'correct' | 'wrong' | 'partial'
    timeSpentMinutes: req.body.timeSpentMinutes || 0,
    // 3 separated areas
    mdContent: req.body.mdContent !== undefined ? req.body.mdContent : (req.body.solutionContent || ''),
    pdfUrl: req.body.pdfUrl || '',
    pdfName: req.body.pdfName || '',
    images: Array.isArray(req.body.images) ? req.body.images : (req.body.solutionContent && req.body.solutionType === 'image' ? [req.body.solutionContent] : []),
    defaultTab: req.body.defaultTab || 'md',
    drawingData: req.body.drawingData || (Array.isArray(req.body.drawingPages) ? req.body.drawingPages[0] || '' : ''),
    drawingPages: Array.isArray(req.body.drawingPages) ? req.body.drawingPages : (req.body.drawingData ? [req.body.drawingData] : []),
    overlayDrawings: req.body.overlayDrawings || {},
    // Legacy compatibility fields
    solutionType: req.body.solutionType || 'text',
    solutionContent: req.body.mdContent !== undefined ? req.body.mdContent : (req.body.solutionContent || ''),
    notesContent: req.body.notesContent || ''
  };

  question.attempts = [...currentAttempts, newAttempt];
  
  // Ebbinghaus Forgetting Cycle Algorithm (遗忘循环算法)
  const EBBINGHAUS_DAYS = [1, 2, 4, 7, 15, 30];
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
    // 'wrong'
    stage = 0;
    nextDays = 1;
    question.mastery = 'unmastered';
  }

  question.reviewStage = stage;
  question.lastReviewDate = new Date().toISOString();
  question.nextReviewDate = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString();

  saveQuestion(question);
  const createdDateStr = question.createdAt ? new Date(question.createdAt).toLocaleString('zh-CN') : '未知';
  scheduleAutoPush(`做题打卡: 《${question.title || '无标题'}》 第 ${newAttempt.attemptNumber} 次做题 (创建时间: ${createdDateStr})`);
  res.json({ success: true, question, newAttempt });
});

// Update an attempt
app.put('/api/questions/:id/attempts/:attemptId', (req, res) => {
  const question = getQuestionById(req.params.id);
  if (!question) return res.status(404).json({ error: '错题未找到' });

  const idx = (question.attempts || []).findIndex(a => a.id === req.params.attemptId);
  if (idx === -1) return res.status(404).json({ error: '该练习记录不存在' });

  question.attempts[idx] = {
    ...question.attempts[idx],
    ...req.body
  };

  saveQuestion(question);
  const createdDateStr = question.createdAt ? new Date(question.createdAt).toLocaleString('zh-CN') : '未知';
  scheduleAutoPush(`更新做题记录: 《${question.title || '无标题'}》 第 ${question.attempts[idx].attemptNumber} 次 (创建时间: ${createdDateStr})`);
  res.json({ success: true, question, updatedAttempt: question.attempts[idx] });
});

// Delete an attempt
app.delete('/api/questions/:id/attempts/:attemptId', (req, res) => {
  const question = getQuestionById(req.params.id);
  if (!question) return res.status(404).json({ error: '错题未找到' });

  question.attempts = (question.attempts || []).filter(a => a.id !== req.params.attemptId);
  // Re-number remaining attempts
  question.attempts.forEach((a, i) => { a.attemptNumber = i + 1; });

  saveQuestion(question);
  const createdDateStr = question.createdAt ? new Date(question.createdAt).toLocaleString('zh-CN') : '未知';
  scheduleAutoPush(`删除做题记录: 《${question.title || '无标题'}》 (创建时间: ${createdDateStr})`);
  res.json({ success: true, question });
});

// ================= QUESTION VERSION HISTORY & ROLLBACK =================
app.get('/api/questions/:id/versions', async (req, res) => {
  try {
    const versions = await getQuestionVersions(req.params.id);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/questions/:id/versions/:commitHash', async (req, res) => {
  try {
    const snapshot = await getQuestionAtVersion(req.params.id, req.params.commitHash);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions/:id/rollback', async (req, res) => {
  const { commitHash } = req.body;
  if (!commitHash) return res.status(400).json({ error: '缺少 commitHash 参数' });
  try {
    const restored = await rollbackQuestion(req.params.id, commitHash);
    res.json({ success: true, question: restored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GIT SYNC APIS =================
app.get('/api/git/config', (req, res) => {
  const cfg = getConfig();
  res.json(cfg.git || {});
});

app.post('/api/git/config', (req, res) => {
  const currentCfg = getConfig();
  currentCfg.git = {
    ...currentCfg.git,
    ...req.body
  };
  saveConfig(currentCfg);
  restartAutoSync();
  res.json({ success: true, config: currentCfg.git });
});

app.get('/api/git/status', async (req, res) => {
  try {
    const status = await getGitStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/git/logs', (req, res) => {
  res.json(getLogs());
});

app.post('/api/git/pull', async (req, res) => {
  try {
    const result = await pullRemote();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/git/push', async (req, res) => {
  try {
    const result = await pushRemote();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/git/sync', async (req, res) => {
  try {
    const result = await fullSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve production frontend build if present
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Mistake Notebook Local API Server running at http://localhost:${PORT}`);
});
