import { getDatabase } from './database';
import type { AuditEntry } from './types';
import { newId, now } from './utils';

interface AuditRow {
  id: string;
  task_id: string | null;
  action: string;
  detail: string | null;
  created_at: number;
}

function mapEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

/**
 * Append-only audit trail. Every meaningful local action (database init,
 * session created, message stored, routing decision, approval decision)
 * lands here so the task screen can show what actually happened.
 */
export async function recordAudit(action: string, detail?: string, taskId?: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO audit_logs (id, task_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?);',
      newId('log'),
      taskId ?? null,
      action,
      detail ?? null,
      now()
    );
  } catch {
    // Logging must never break a user action.
  }
}

export async function listAudit(limit = 60): Promise<AuditEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AuditRow>(
    'SELECT * FROM audit_logs ORDER BY created_at DESC, rowid DESC LIMIT ?;',
    limit
  );
  return rows.map(mapEntry);
}

export async function countAudit(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM audit_logs;');
  return row?.count ?? 0;
}

export async function clearAudit(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM audit_logs;');
}
