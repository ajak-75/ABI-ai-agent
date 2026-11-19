/** Small helpers shared by the repositories (ids, dates, mapping rows). */

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Generates a sortable-ish local identifier: <prefix>_<timestamp base36><random>.
 * No network or native crypto dependency, which keeps Phase 1 fully offline.
 */
export function newId(prefix: string): string {
  const time = Date.now().toString(36);
  let random = '';
  for (let i = 0; i < 8; i += 1) {
    random += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return `${prefix}_${time}${random}`;
}

export function now(): number {
  return Date.now();
}

/** "11월 20일 09:41" — locale-safe formatting without Intl. */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}월 ${day}일 ${hours}:${minutes}`;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '방금';
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;
  return formatTimestamp(timestamp);
}

export function toBool(value: number | null | undefined): boolean {
  return value === 1;
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}
