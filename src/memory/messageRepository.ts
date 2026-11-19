import { getDatabase } from './database';
import type { Message, MessageRole, MessageStatus, NewMessage } from './types';
import type { RouteMode } from '../router/types';
import { newId, now } from './utils';

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  route_mode: string | null;
  engine_id: string | null;
  status: string;
  created_at: number;
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role as MessageRole,
    content: row.content,
    routeMode: (row.route_mode as RouteMode | null) ?? null,
    engineId: row.engine_id,
    status: row.status as MessageStatus,
    createdAt: row.created_at,
  };
}

export async function appendMessage(input: NewMessage): Promise<Message> {
  const db = await getDatabase();
  const message: Message = {
    id: newId('msg'),
    sessionId: input.sessionId,
    role: input.role,
    content: input.content,
    routeMode: input.routeMode ?? null,
    engineId: input.engineId ?? null,
    status: input.status ?? 'complete',
    createdAt: now(),
  };

  await db.runAsync(
    `INSERT INTO messages (id, session_id, role, content, route_mode, engine_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    message.id,
    message.sessionId,
    message.role,
    message.content,
    message.routeMode,
    message.engineId,
    message.status,
    message.createdAt
  );

  return message;
}

export async function listMessages(sessionId: string): Promise<Message[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MessageRow>(
    `SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC, rowid ASC;`,
    sessionId
  );
  return rows.map(mapMessage);
}

export async function listRecentMessages(limit = 20): Promise<Message[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MessageRow>(
    `SELECT * FROM messages ORDER BY created_at DESC, rowid DESC LIMIT ?;`,
    limit
  );
  return rows.map(mapMessage).reverse();
}

export async function countMessages(sessionId?: string): Promise<number> {
  const db = await getDatabase();
  const row = sessionId
    ? await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM messages WHERE session_id = ?;',
        sessionId
      )
    : await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM messages;');
  return row?.count ?? 0;
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus,
  content?: string
): Promise<void> {
  const db = await getDatabase();
  if (typeof content === 'string') {
    await db.runAsync('UPDATE messages SET status = ?, content = ? WHERE id = ?;', status, content, id);
    return;
  }
  await db.runAsync('UPDATE messages SET status = ? WHERE id = ?;', status, id);
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM messages WHERE id = ?;', id);
}
