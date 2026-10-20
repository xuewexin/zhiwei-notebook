import { Folder, Question, Attempt, GitConfig, GitStatus, SyncLog, QuestionVersion } from '../types';
import { localEngine } from './localStorageEngine';

// Standalone offline native platform - 100% local storage
export const isNativePlatform = true;

// Directly export localEngine as the sole data client for 100% serverless offline operation
export const api = {
  // Folders
  getFolders: () => localEngine.getFolders(),
  createFolder: (data: Partial<Folder>) => localEngine.createFolder(data),
  updateFolder: (id: string, data: Partial<Folder>) => localEngine.updateFolder(id, data),
  deleteFolder: (id: string) => localEngine.deleteFolder(id),

  // Questions
  getQuestions: (params: { folderId?: string; search?: string; mastery?: string } = {}) => localEngine.getQuestions(params),
  getQuestionById: (id: string) => localEngine.getQuestionById(id),
  createQuestion: (data: Partial<Question>) => localEngine.createQuestion(data),
  updateQuestion: (id: string, data: Partial<Question>) => localEngine.updateQuestion(id, data),
  deleteQuestion: (id: string) => localEngine.deleteQuestion(id),

  // Practice Attempts
  addAttempt: (questionId: string, attemptData: Partial<Attempt>) => localEngine.addAttempt(questionId, attemptData),
  updateAttempt: (questionId: string, attemptId: string, attemptData: Partial<Attempt>) => localEngine.updateAttempt(questionId, attemptId, attemptData),
  deleteAttempt: (questionId: string, attemptId: string) => localEngine.deleteAttempt(questionId, attemptId),

  // Uploads
  uploadFile: (file: File) => localEngine.uploadFile(file),
  uploadImage: (file: File) => localEngine.uploadImage(file),
  uploadBase64: (base64Data: string) => localEngine.uploadBase64(base64Data),

  // Git & Sync (Offline fallback)
  getGitConfig: () => localEngine.getGitConfig(),
  saveGitConfig: (config: Partial<GitConfig>) => localEngine.saveGitConfig(config),
  getGitStatus: () => localEngine.getGitStatus(),
  getGitLogs: () => localEngine.getGitLogs(),
  pullGit: () => localEngine.pullGit(),
  pushGit: () => localEngine.pushGit(),
  syncGit: () => localEngine.syncGit(),

  // Versions
  getQuestionVersions: () => localEngine.getQuestionVersions(),
  getQuestionAtVersion: (questionId: string, versionId: string) => localEngine.getQuestionAtVersion(questionId, versionId),
  rollbackQuestion: (questionId: string, versionId: string) => localEngine.rollbackQuestion(questionId, versionId)
};
