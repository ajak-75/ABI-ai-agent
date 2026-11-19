import * as SQLite from 'expo-sqlite';

import { ALL_MIGRATIONS, DATABASE_NAME, SCHEMA_VERSION } from './schema';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Returns the single shared SQLite connection, opening and migrating it on
 * first use. Safe to call from any screen: the promise is memoised.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndMigrate();
  }
  return databasePromise;
}

/** Opens the database, applies pragmas and runs pending migrations. */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDatabase();
  return db;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // WAL keeps reads fast while a write is in flight; busy timeout avoids
  // SQLITE_BUSY when two screens touch the database at once.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA busy_timeout = 3000;');

  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    );`
  );

  const row = await db.getFirstAsync<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_migrations;'
  );
  const current = row?.version ?? 0;

  if (current >= SCHEMA_VERSION) {
    return;
  }

  for (let version = current + 1; version <= SCHEMA_VERSION; version += 1) {
    const statements = ALL_MIGRATIONS[version];
    if (!statements) {
      throw new Error(`No migration registered for schema version ${version}.`);
    }

    await db.withTransactionAsync(async () => {
      for (const statement of statements) {
        await db.execAsync(statement);
      }
      await db.runAsync(
        'INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?);',
        version,
        Date.now()
      );
    });
  }
}

/** Wipes every row while keeping the schema (used by the settings screen). */
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM messages;');
    await db.execAsync('DELETE FROM sessions;');
    await db.execAsync('DELETE FROM memories;');
    await db.execAsync('DELETE FROM tasks;');
    await db.execAsync('DELETE FROM audit_logs;');
  });
}

/** Deletes the whole database file; the next read recreates it from scratch. */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA journal_mode = DELETE;');
  databasePromise = null;
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
}
