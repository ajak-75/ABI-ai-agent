import type { RouteMode } from '../router/types';

/** Roles that can appear inside a stored conversation. */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Lifecycle of a locally stored message row. */
export type MessageStatus = 'pending' | 'complete' | 'failed';

/** Kinds of long-term user memory kept on the device. */
export type MemoryKind = 'preference' | 'fact' | 'instruction';

export type MemorySource = 'user' | 'assistant';

export interface Session {
  id: string;
  title: string;
  mode: RouteMode;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SessionSummary extends Session {
  messageCount: number;
  lastMessage: string | null;
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  routeMode: RouteMode | null;
  engineId: string | null;
  status: MessageStatus;
  createdAt: number;
}

export interface NewMessage {
  sessionId: string;
  role: MessageRole;
  content: string;
  routeMode?: RouteMode | null;
  engineId?: string | null;
  status?: MessageStatus;
}

export interface UserMemory {
  id: string;
  kind: MemoryKind;
  label: string | null;
  value: string;
  source: MemorySource;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NewMemory {
  kind: MemoryKind;
  label?: string | null;
  value: string;
  source?: MemorySource;
}

/** Status of a task waiting for (or given) user approval. */
export type TaskStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface AgentTask {
  id: string;
  sessionId: string | null;
  title: string;
  toolId: string | null;
  payload: string | null;
  status: TaskStatus;
  risk: RiskLevel;
  result: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface NewTask {
  title: string;
  sessionId?: string | null;
  toolId?: string | null;
  payload?: string | null;
  status?: TaskStatus;
  risk?: RiskLevel;
}

export interface AuditEntry {
  id: string;
  taskId: string | null;
  action: string;
  detail: string | null;
  createdAt: number;
}
