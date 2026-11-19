import { getDatabase } from './database';
import { now } from './utils';

export const SETTING_KEYS = {
  routeMode: 'route_mode',
  saveHistory: 'save_history',
  engineNoticeDismissed: 'engine_notice_dismissed',
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    key,
    value,
    now()
  );
}

export async function getBooleanSetting(key: string, fallback: boolean): Promise<boolean> {
  const value = await getSetting(key);
  if (value === null) return fallback;
  return value === 'true';
}

export async function setBooleanSetting(key: string, value: boolean): Promise<void> {
  await setSetting(key, value ? 'true' : 'false');
}

export async function clearSettings(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM app_settings;');
}
