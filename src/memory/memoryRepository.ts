import { getDatabase } from './database';
import type { MemoryKind, MemorySource, NewMemory, UserMemory } from './types';
import { fromBool, newId, now, toBool } from './utils';

interface MemoryRow {
  id: string;
  kind: string;
  label: string | null;
  value: string;
  source: string;
  active: number;
  created_at: number;
  updated_at: number;
}

function mapMemory(row: MemoryRow): UserMemory {
  return {
    id: row.id,
    kind: row.kind as MemoryKind,
    label: row.label,
    value: row.value,
    source: row.source as MemorySource,
    active: toBool(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const MEMORY_KIND_LABELS: Record<MemoryKind, string> = {
  preference: '선호',
  fact: '사실',
  instruction: '지시',
};

export async function listMemories(includeInactive = false): Promise<UserMemory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MemoryRow>(
    includeInactive
      ? 'SELECT * FROM memories ORDER BY created_at DESC;'
      : 'SELECT * FROM memories WHERE active = 1 ORDER BY created_at DESC;'
  );
  return rows.map(mapMemory);
}

export async function createMemory(input: NewMemory): Promise<UserMemory> {
  const db = await getDatabase();
  const timestamp = now();
  const memory: UserMemory = {
    id: newId('mem'),
    kind: input.kind,
    label: input.label?.trim() ? input.label.trim() : null,
    value: input.value.trim(),
    source: input.source ?? 'user',
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO memories (id, kind, label, value, source, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    memory.id,
    memory.kind,
    memory.label,
    memory.value,
    memory.source,
    fromBool(memory.active),
    memory.createdAt,
    memory.updatedAt
  );

  return memory;
}

export async function updateMemory(
  id: string,
  patch: { kind?: MemoryKind; label?: string | null; value?: string }
): Promise<void> {
  const db = await getDatabase();
  const current = await db.getFirstAsync<MemoryRow>('SELECT * FROM memories WHERE id = ?;', id);
  if (!current) return;

  const kind = patch.kind ?? (current.kind as MemoryKind);
  const label = patch.label === undefined ? current.label : patch.label;
  const value = patch.value?.trim() ? patch.value.trim() : current.value;

  await db.runAsync(
    'UPDATE memories SET kind = ?, label = ?, value = ?, updated_at = ? WHERE id = ?;',
    kind,
    label,
    value,
    now(),
    id
  );
}

export async function setMemoryActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE memories SET active = ?, updated_at = ? WHERE id = ?;',
    fromBool(active),
    now(),
    id
  );
}

export async function deleteMemory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM memories WHERE id = ?;', id);
}

export async function countMemories(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM memories WHERE active = 1;'
  );
  return row?.count ?? 0;
}
