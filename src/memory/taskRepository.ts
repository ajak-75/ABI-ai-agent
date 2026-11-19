import { getDatabase } from './database';
import type { AgentTask, NewTask, RiskLevel, TaskStatus } from './types';
import { newId, now } from './utils';

interface TaskRow {
  id: string;
  session_id: string | null;
  title: string;
  tool_id: string | null;
  payload: string | null;
  status: string;
  risk: string;
  result: string | null;
  created_at: number;
  updated_at: number;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
  completed: '완료',
  failed: '실패',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

function mapTask(row: TaskRow): AgentTask {
  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    toolId: row.tool_id,
    payload: row.payload,
    status: row.status as TaskStatus,
    risk: row.risk as RiskLevel,
    result: row.result,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTask(input: NewTask): Promise<AgentTask> {
  const db = await getDatabase();
  const timestamp = now();
  const task: AgentTask = {
    id: newId('task'),
    sessionId: input.sessionId ?? null,
    title: input.title.trim(),
    toolId: input.toolId ?? null,
    payload: input.payload ?? null,
    status: input.status ?? 'pending',
    risk: input.risk ?? 'low',
    result: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO tasks (id, session_id, title, tool_id, payload, status, risk, result, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    task.id,
    task.sessionId,
    task.title,
    task.toolId,
    task.payload,
    task.status,
    task.risk,
    task.result,
    task.createdAt,
    task.updatedAt
  );

  return task;
}

export async function listTasks(limit = 50): Promise<AgentTask[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    'SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?;',
    limit
  );
  return rows.map(mapTask);
}

export async function listTasksByStatus(status: TaskStatus, limit = 50): Promise<AgentTask[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC LIMIT ?;',
    status,
    limit
  );
  return rows.map(mapTask);
}

export async function countPendingTasks(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM tasks WHERE status = 'pending';"
  );
  return row?.count ?? 0;
}

export async function resolveTask(
  id: string,
  status: TaskStatus,
  result?: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE tasks SET status = ?, result = COALESCE(?, result), updated_at = ? WHERE id = ?;',
    status,
    result ?? null,
    now(),
    id
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tasks WHERE id = ?;', id);
}
