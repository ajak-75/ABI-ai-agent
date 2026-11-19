import { getDatabase } from './database';
import type { Session, SessionSummary } from './types';
import { formatTimestamp, newId, now, toBool } from './utils';

interface SessionRow {
  id: string;
  title: string;
  mode: string;
  archived: number;
  created_at: number;
  updated_at: number;
}

interface SessionSummaryRow extends SessionRow {
  message_count: number;
  last_message: string | null;
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    mode: (row.mode as Session['mode']) ?? 'auto',
    archived: toBool(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function defaultSessionTitle(timestamp: number = Date.now()): string {
  return `새 대화 · ${formatTimestamp(timestamp)}`;
}

export async function createSession(title?: string): Promise<Session> {
  const db = await getDatabase();
  const timestamp = now();
  const session: Session = {
    id: newId('ses'),
    title: title?.trim() || defaultSessionTitle(timestamp),
    mode: 'auto',
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO sessions (id, title, mode, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    session.id,
    session.title,
    session.mode,
    0,
    session.createdAt,
    session.updatedAt
  );

  return session;
}

/** Latest non-archived session, created on demand. */
export async function getOrCreateActiveSession(): Promise<Session> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE archived = 0 ORDER BY updated_at DESC LIMIT 1;`
  );
  if (row) return mapSession(row);
  return createSession();
}

export async function listSessions(limit = 50): Promise<Session[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions WHERE archived = 0 ORDER BY updated_at DESC LIMIT ?;`,
    limit
  );
  return rows.map(mapSession);
}

export async function listSessionSummaries(limit = 50): Promise<SessionSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionSummaryRow>(
    `SELECT s.*,
            (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count,
            (SELECT m2.content FROM messages m2 WHERE m2.session_id = s.id
              ORDER BY m2.created_at DESC, m2.rowid DESC LIMIT 1) AS last_message
       FROM sessions s
      WHERE s.archived = 0
      ORDER BY s.updated_at DESC
      LIMIT ?;`,
    limit
  );

  return rows.map((row) => ({
    ...mapSession(row),
    messageCount: row.message_count ?? 0,
    lastMessage: row.last_message,
  }));
}

export async function getSession(id: string): Promise<Session | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>('SELECT * FROM sessions WHERE id = ?;', id);
  return row ? mapSession(row) : null;
}

export async function touchSession(id: string, title?: string): Promise<void> {
  const db = await getDatabase();
  if (title) {
    await db.runAsync(
      'UPDATE sessions SET updated_at = ?, title = ? WHERE id = ?;',
      now(),
      title,
      id
    );
    return;
  }
  await db.runAsync('UPDATE sessions SET updated_at = ? WHERE id = ?;', now(), id);
}

export async function renameSession(id: string, title: string): Promise<void> {
  const db = await getDatabase();
  const clean = title.trim();
  if (!clean) return;
  await db.runAsync(
    'UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?;',
    clean,
    now(),
    id
  );
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sessions WHERE id = ?;', id);
}

export async function countSessions(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM sessions;'
  );
  return row?.count ?? 0;
}
