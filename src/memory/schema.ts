/**
 * Local SQLite schema (Phase 1).
 *
 * Everything the app remembers lives on the device only. No network table,
 * no server sync: this database is the single source of truth for
 * conversations, user memories, task history and audit logs.
 */

export const SCHEMA_VERSION = 1;

export const DATABASE_NAME = 'ajak-ai-agent.db';

/** Executed in order when the database is created or migrated up to SCHEMA_VERSION. */
export const MIGRATION_V1: string[] = [
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'auto',
    archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    route_mode TEXT,
    engine_id TEXT,
    status TEXT NOT NULL DEFAULT 'complete',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
  );`,

  `CREATE INDEX IF NOT EXISTS idx_messages_session
    ON messages (session_id, created_at);`,

  `CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL,
    label TEXT,
    value TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'user',
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,

  `CREATE INDEX IF NOT EXISTS idx_memories_active
    ON memories (active, created_at DESC);`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT,
    title TEXT NOT NULL,
    tool_id TEXT,
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    risk TEXT NOT NULL DEFAULT 'low',
    result TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,

  `CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks (status, created_at DESC);`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    created_at INTEGER NOT NULL
  );`,

  `CREATE INDEX IF NOT EXISTS idx_audit_created
    ON audit_logs (created_at DESC);`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
];

export const ALL_MIGRATIONS: Record<number, string[]> = {
  1: MIGRATION_V1,
};
