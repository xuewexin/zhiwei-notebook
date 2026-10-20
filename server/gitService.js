import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { DATA_DIR, QUESTIONS_DIR, getConfig, saveConfig, saveQuestion } from './storageService.js';

const execPromise = util.promisify(exec);

let autoSyncIntervalId = null;
let syncLogs = [];
let nextAutoSyncTimestamp = null;
let autoPushTimer = null;
let autoPushDeadline = null;
let isSyncInProgress = false;
let pendingCommitReason = '自动同步错题本更新';

function addLog(type, message, details = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type, // 'info' | 'success' | 'warn' | 'error'
    message,
    details
  };
  syncLogs.unshift(logEntry);
  if (syncLogs.length > 50) syncLogs.pop(); // keep last 50 logs
  console.log(`[GitSync ${type.toUpperCase()}] ${message}`);
  return logEntry;
}

export function getLogs() {
  return syncLogs;
}

export async function runGitCommand(cmd) {
  try {
    const { stdout, stderr } = await execPromise(cmd, { cwd: DATA_DIR });
    return { success: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : error.message
    };
  }
}

// Format remote URL with authentication token
function getAuthenticatedUrl(config) {
  if (!config.remoteUrl) return '';
  let url = config.remoteUrl.trim();
  const token = (config.token || '').trim();
  
  if (!token) return url;

  // If already contains token, return
  if (url.includes('@') && (url.includes('http://') || url.includes('https://'))) {
    return url;
  }

  // Extract repo owner from URL if available (e.g. https://gitee.com/quanzhounbcelas/error-notebook.git)
  let urlOwner = '';
  try {
    const match = url.match(/(?:github\.com|gitee\.com)\/([^/]+)\/([^/.]+)/i);
    if (match && match[1]) {
      urlOwner = match[1].trim();
    }
  } catch {}

  let username = (config.username || '').trim();

  // If username is empty, or contains non-ASCII (e.g. Chinese nickname like "等我"):
  // Gitee strictly requires the account username (e.g. quanzhounbcelas), NOT a Chinese display name.
  const hasNonAscii = /[^\x00-\x7F]/.test(username);
  if (!username || hasNonAscii) {
    if (urlOwner) {
      username = urlOwner;
    } else if (config.platform === 'gitee') {
      username = urlOwner || 'oauth2';
    } else {
      username = 'oauth2';
    }
  }

  try {
    const parsed = new URL(url);
    parsed.username = username;
    parsed.password = token;
    return parsed.toString();
  } catch (e) {
    // If not standard URL format
    if (url.startsWith('https://')) {
      return `https://${encodeURIComponent(username)}:${encodeURIComponent(token)}@${url.slice(8)}`;
    }
    return url;
  }
}

export async function ensureGitRepo() {
  const gitDir = path.join(DATA_DIR, '.git');
  if (!fs.existsSync(gitDir)) {
    addLog('info', '正在为本地数据目录初始化 Git 仓库...');
    const initRes = await runGitCommand('git init');
    if (!initRes.success) {
      addLog('error', 'Git 初始化失败', initRes.stderr);
      return false;
    }
    
    // Create .gitignore
    const gitignorePath = path.join(DATA_DIR, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '# Mistake notebook ignore\n.DS_Store\nThumbs.db\n*.tmp\n', 'utf-8');
    }

    await runGitCommand('git add .gitignore');
    await runGitCommand('git commit -m "init: initialize mistake notebook repository"');
    addLog('success', 'Git 仓库初始化成功！');
  }

  // Set user info
  const config = getConfig().git || {};
  const authorName = config.authorName || 'MistakeNotebook';
  const authorEmail = config.authorEmail || 'user@mistake-notebook.local';
  await runGitCommand(`git config user.name "${authorName}"`);
  await runGitCommand(`git config user.email "${authorEmail}"`);

  return true;
}

export async function setupRemote() {
  const config = getConfig().git;
  if (!config || !config.remoteUrl) return { success: false, message: '未配置远程仓库地址' };

  await ensureGitRepo();

  const authUrl = getAuthenticatedUrl(config);
  const branch = config.branch || 'main';

  // Check current remotes
  const remotesRes = await runGitCommand('git remote -v');
  if (remotesRes.stdout.includes('origin')) {
    await runGitCommand('git remote remove origin');
  }

  const addRemoteRes = await runGitCommand(`git remote add origin "${authUrl}"`);
  if (!addRemoteRes.success) {
    addLog('error', '添加远程仓库失败', addRemoteRes.stderr);
    return { success: false, message: addRemoteRes.stderr };
  }

  // Ensure branch is named correctly
  await runGitCommand(`git branch -M ${branch}`);

  addLog('info', `已成功配置远程仓库源 [${config.platform}] -> ${config.remoteUrl}`);
  return { success: true };
}

export async function pullRemote() {
  const config = getConfig().git || {};
  if (!config.enabled || !config.remoteUrl) {
    return { success: false, message: 'Git 同步功能未启用或未配置远程仓库' };
  }

  isSyncInProgress = true;
  updateLastSync('syncing', '正在从云端拉取最新数据...');
  addLog('info', '开始从远程仓库拉取数据 (git pull)...');
  await setupRemote();

  const branch = config.branch || 'main';
  const pullRes = await runGitCommand(`git pull origin ${branch} --allow-unrelated-histories -X theirs`);

  isSyncInProgress = false;

  if (!pullRes.success) {
    // If remote repository is empty or branch not found
    if (pullRes.stderr.includes("Couldn't find remote ref") || pullRes.stderr.includes('did not match any')) {
      addLog('warn', `远程分支 ${branch} 尚未创建或为空，拉取跳过`);
      return { success: true, message: '远程分支为空，拉取跳过' };
    }
    addLog('error', '拉取失败', pullRes.stderr);
    updateLastSync('error', `拉取失败: ${pullRes.stderr}`);
    return { success: false, message: pullRes.stderr };
  }

  addLog('success', '拉取成功！已同步远程最新错题数据', pullRes.stdout);
  updateLastSync('success', '远程数据拉取成功');
  return { success: true, details: pullRes.stdout };
}

export async function pushRemote() {
  const config = getConfig().git || {};
  if (!config.enabled || !config.remoteUrl) {
    return { success: false, message: 'Git 同步功能未启用或未配置远程仓库' };
  }

  isSyncInProgress = true;
  updateLastSync('syncing', '正在向云端推送数据...');
  addLog('info', '开始向远程仓库推送数据 (git push)...');
  await setupRemote();

  // Stage all files
  await runGitCommand('git add -A');
  
  // Check if anything to commit
  const statusRes = await runGitCommand('git status --porcelain');
  if (statusRes.stdout) {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });
    const commitMsg = `${pendingCommitReason} [${timestamp}]`;
    const msgFile = path.join(DATA_DIR, '.git_commit_msg.tmp');
    try {
      fs.writeFileSync(msgFile, commitMsg, 'utf-8');
      const commitRes = await runGitCommand(`git commit -F "${msgFile}"`);
      if (!commitRes.success) {
        addLog('warn', '提交可能无需变更', commitRes.stderr);
      }
    } finally {
      if (fs.existsSync(msgFile)) {
        try { fs.unlinkSync(msgFile); } catch (e) {}
      }
    }
  }

  const branch = config.branch || 'main';
  let pushRes = await runGitCommand(`git push -u origin ${branch}`);

  // Auto-handle remote conflicts / non-fast-forward (pull and re-push)
  if (!pushRes.success) {
    const errText = (pushRes.stderr || '') + (pushRes.stdout || '');
    if (errText.includes('fetch first') || errText.includes('non-fast-forward') || errText.includes('Updates were rejected')) {
      addLog('info', '检测到远程仓库有其他设备的新提交，正在自动拉取合并后重新推送...');
      await pullRemote();
      pushRes = await runGitCommand(`git push -u origin ${branch}`);
    }
  }

  isSyncInProgress = false;

  if (!pushRes.success) {
    addLog('error', '推送到远程失败', pushRes.stderr);
    updateLastSync('error', `推送失败: ${pushRes.stderr}`);
    return { success: false, message: pushRes.stderr };
  }

  addLog('success', '推送成功！本地错题已安全备份至云端', pushRes.stdout);
  updateLastSync('success', '推送成功，本地数据已同步至云端');
  return { success: true, details: pushRes.stdout };
}

// OneNote-style debounced auto sync on change (添加/修改错题、记录、分类后 10 秒无其他操作时自动推送)
export function scheduleAutoPush(reason = '本地数据修改') {
  const config = getConfig().git || {};
  if (!config.enabled || !config.remoteUrl) return;

  pendingCommitReason = reason || '本地数据修改';
  updateLastSync('pending', `已保存本地，10 秒无其他操作后自动同步至云端 (${reason})...`);

  if (autoPushTimer) {
    clearTimeout(autoPushTimer);
  }

  // 10 秒静置倒计时截止时间
  autoPushDeadline = Date.now() + 10000;

  // 10000ms debounce: 添加或修改后，十秒内无其他操作再进行同步；期间有新操作则重置计时器
  autoPushTimer = setTimeout(async () => {
    autoPushTimer = null;
    autoPushDeadline = null;
    if (isSyncInProgress) {
      // Re-schedule if another sync is currently running
      scheduleAutoPush(reason);
      return;
    }

    try {
      addLog('info', `[OneNote 智能同步] 检测到数据变更后 10 秒无其他操作 (${reason})，触发自动后台推送...`);
      await pushRemote();
    } catch (err) {
      console.error('[OneNote 增量同步] 自动推送失败:', err);
    }
  }, 10000);
}

export async function fullSync() {
  addLog('info', '启动全自动双向同步流程 (Pull -> Push)...');
  const pullResult = await pullRemote();
  const pushResult = await pushRemote();
  return {
    pull: pullResult,
    push: pushResult,
    success: pullResult.success && pushResult.success
  };
}

function updateLastSync(status, message) {
  const fullCfg = getConfig();
  if (!fullCfg.git) fullCfg.git = {};
  fullCfg.git.lastSyncTime = new Date().toISOString();
  fullCfg.git.lastSyncStatus = status;
  fullCfg.git.lastSyncMessage = message;
  saveConfig(fullCfg);
}

export async function getGitStatus() {
  await ensureGitRepo();
  const branchRes = await runGitCommand('git branch --show-current');
  const statusRes = await runGitCommand('git status -s');
  const commitCountRes = await runGitCommand('git rev-list --count HEAD');
  const config = getConfig().git || {};

  return {
    isRepo: true,
    branch: branchRes.stdout || config.branch || 'main',
    hasUncommittedChanges: !!statusRes.stdout || !!autoPushTimer,
    changesSummary: statusRes.stdout,
    commitCount: parseInt(commitCountRes.stdout || '0', 10),
    autoSyncEnabled: !!config.autoSync,
    autoSyncIntervalMinutes: config.autoSyncIntervalMinutes || 10,
    nextAutoSyncTimestamp,
    lastSyncTime: config.lastSyncTime,
    lastSyncStatus: isSyncInProgress ? 'syncing' : (autoPushTimer ? 'pending' : (config.lastSyncStatus || 'idle')),
    lastSyncMessage: config.lastSyncMessage || '',
    isSyncing: isSyncInProgress || !!autoPushTimer,
    pendingPush: !!autoPushTimer,
    pendingPushDeadline: autoPushDeadline
  };
}

export function restartAutoSync() {
  if (autoSyncIntervalId) {
    clearInterval(autoSyncIntervalId);
    autoSyncIntervalId = null;
  }

  const config = getConfig().git || {};
  if (!config.enabled || !config.autoSync || !config.remoteUrl) {
    nextAutoSyncTimestamp = null;
    return;
  }

  const intervalMinutes = config.autoSyncIntervalMinutes || 10;
  const intervalMs = intervalMinutes * 60 * 1000;
  nextAutoSyncTimestamp = Date.now() + intervalMs;

  addLog('info', `已激活自动后台拉取任务：每 ${intervalMinutes} 分钟自动执行一次 git pull`);

  autoSyncIntervalId = setInterval(async () => {
    console.log(`[Timer] 触发定时自动拉取任务 (${intervalMinutes}分钟定时器)`);
    try {
      await pullRemote();
    } catch (e) {
      console.error('[Timer] 自动拉取异常:', e);
    }
    nextAutoSyncTimestamp = Date.now() + intervalMs;
  }, intervalMs);
}

// ================= QUESTION VERSION HISTORY & ROLLBACK =================

/**
 * Get all historical commit snapshots for a specific question file
 */
export async function getQuestionVersions(questionId) {
  await ensureGitRepo();
  const filePath = `questions/${questionId}.json`;
  const fullPath = path.join(QUESTIONS_DIR, `${questionId}.json`);

  if (!fs.existsSync(fullPath)) {
    return [];
  }

  // Get commit log for this specific question file
  // Format: %H|%h|%an|%ad|%s|%P
  const logRes = await runGitCommand(`git log -n 50 --pretty=format:"%H|%h|%an|%ad|%s|%P" --date=iso -- "${filePath}"`);
  const versions = [];

  if (logRes.success && logRes.stdout) {
    const lines = logRes.stdout.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach((line, idx) => {
      const parts = line.split('|');
      const commitHash = parts[0] || '';
      const shortHash = parts[1] || commitHash.slice(0, 7);
      const author = parts[2] || '用户';
      const date = parts[3] || '';
      const message = parts[4] || '';
      const parents = parts[5] || '';

      const parentList = parents ? parents.trim().split(/\s+/) : [];
      const isMerge = parentList.length > 1 || message.toLowerCase().includes('merge') || message.includes('合并');
      const isConflict = message.includes('冲突') || message.toLowerCase().includes('conflict');

      versions.push({
        commitHash,
        shortHash,
        author,
        date,
        message,
        isMerge,
        isConflict,
        isCurrent: idx === 0
      });
    });
  }

  // Check if there are uncommitted working directory changes for this file
  const diffRes = await runGitCommand(`git status --porcelain -- "${filePath}"`);
  if (diffRes.stdout && diffRes.stdout.trim()) {
    // Unshift working tree version
    versions.unshift({
      commitHash: 'working-tree',
      shortHash: '工作区修改',
      author: '当前设备',
      date: new Date().toISOString(),
      message: '本地未提交修改 (Working Tree)',
      isMerge: false,
      isConflict: false,
      isCurrent: true
    });

    if (versions[1]) {
      versions[1].isCurrent = false;
    }
  }

  return versions;
}

/**
 * Get the full question JSON content at a specific commit snapshot
 */
export async function getQuestionAtVersion(questionId, commitHash) {
  await ensureGitRepo();

  if (commitHash === 'working-tree') {
    const fullPath = path.join(QUESTIONS_DIR, `${questionId}.json`);
    if (!fs.existsSync(fullPath)) throw new Error('工作区中未找到错题');
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  }

  // Safe commit hash validation
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(commitHash)) {
    throw new Error('无效的 Commit 哈希');
  }

  const filePath = `questions/${questionId}.json`;
  const showRes = await runGitCommand(`git show ${commitHash}:"${filePath}"`);
  if (!showRes.success) {
    throw new Error(`获取历史快照失败: ${showRes.stderr || '未在该版本中找到文件'}`);
  }

  try {
    return JSON.parse(showRes.stdout);
  } catch (err) {
    throw new Error(`历史快照 JSON 格式错误: ${err.message}`);
  }
}

/**
 * Roll back a question to a specific commit snapshot
 */
export async function rollbackQuestion(questionId, commitHash) {
  if (commitHash === 'working-tree') {
    throw new Error('无法回退到未提交的工作区');
  }

  const targetQuestion = await getQuestionAtVersion(questionId, commitHash);
  if (!targetQuestion) {
    throw new Error('无法读取指定版本的内容');
  }

  targetQuestion.id = questionId;
  targetQuestion.updatedAt = new Date().toISOString();

  // Save the question (updates questions/<id>.json and notes/<folder>/<title>.md)
  const saved = saveQuestion(targetQuestion);

  // Trigger auto sync with explicit rollback commit message
  const shortH = commitHash.slice(0, 7);
  const createdDateStr = saved.createdAt ? new Date(saved.createdAt).toLocaleString('zh-CN') : '未知';
  scheduleAutoPush(`版本回退: 《${saved.title || questionId}》 恢复至历史快照 [${shortH}] (创建时间: ${createdDateStr})`);

  return saved;
}

