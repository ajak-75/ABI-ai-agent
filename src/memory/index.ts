/**
 * Local memory layer — the only persistence surface the UI talks to.
 * All data stays on the device (expo-sqlite); nothing is uploaded.
 */

export { getDatabase, initDatabase, clearAllData, resetDatabase } from './database';
export { DATABASE_NAME, SCHEMA_VERSION } from './schema';

export * from './types';

export {
  createSession,
  getOrCreateActiveSession,
  getSession,
  listSessions,
  listSessionSummaries,
  touchSession,
  renameSession,
  deleteSession,
  countSessions,
  defaultSessionTitle,
} from './sessionRepository';

export {
  appendMessage,
  listMessages,
  listRecentMessages,
  countMessages,
  updateMessageStatus,
  deleteMessage,
} from './messageRepository';

export {
  listMemories,
  createMemory,
  updateMemory,
  setMemoryActive,
  deleteMemory,
  countMemories,
  MEMORY_KIND_LABELS,
} from './memoryRepository';

export {
  createTask,
  listTasks,
  listTasksByStatus,
  countPendingTasks,
  resolveTask,
  deleteTask,
  TASK_STATUS_LABELS,
  RISK_LABELS,
} from './taskRepository';

export { recordAudit, listAudit, countAudit, clearAudit } from './auditLog';

export {
  getSetting,
  setSetting,
  getBooleanSetting,
  setBooleanSetting,
  clearSettings,
  SETTING_KEYS,
} from './settingsRepository';

export { formatTimestamp, formatRelativeTime } from './utils';
