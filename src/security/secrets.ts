import * as SecureStore from 'expo-secure-store';

/**
 * Secret storage (Phase 1).
 *
 * API keys live in the Android Keystore through expo-secure-store. They are
 * never written to SQLite, never placed in source, and never rendered in full:
 * the UI only ever sees a masked hint (last four characters).
 *
 * Phase 1 does not call any API — this module only stores, checks and deletes.
 */

export type SecretProvider = 'cloud_free';

const KEY_PREFIX = 'ajak.aiagent.apikey.';

function storageKey(provider: SecretProvider): string {
  return `${KEY_PREFIX}${provider}`;
}

let availability: boolean | null = null;

export async function isSecureStoreAvailable(): Promise<boolean> {
  if (availability === null) {
    try {
      availability = await SecureStore.isAvailableAsync();
    } catch {
      availability = false;
    }
  }
  return availability;
}

export async function saveApiKey(provider: SecretProvider, key: string): Promise<boolean> {
  const available = await isSecureStoreAvailable();
  if (!available) return false;

  const trimmed = key.trim();
  if (!trimmed) {
    await deleteApiKey(provider);
    return true;
  }

  await SecureStore.setItemAsync(storageKey(provider), trimmed, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  return true;
}

/** Reads the key back — callers must never log or display the return value. */
export async function readApiKey(provider: SecretProvider): Promise<string | null> {
  if (!(await isSecureStoreAvailable())) return null;
  try {
    return await SecureStore.getItemAsync(storageKey(provider));
  } catch {
    return null;
  }
}

export async function hasApiKey(provider: SecretProvider): Promise<boolean> {
  const key = await readApiKey(provider);
  return Boolean(key && key.length > 0);
}

/** Masked hint for display, e.g. "•••• 3f9a". Never the full key. */
export async function getApiKeyHint(provider: SecretProvider): Promise<string | null> {
  const key = await readApiKey(provider);
  if (!key) return null;
  const tail = key.slice(-4);
  return `•••• ${tail}`;
}

export async function deleteApiKey(provider: SecretProvider): Promise<void> {
  if (!(await isSecureStoreAvailable())) return;
  try {
    await SecureStore.deleteItemAsync(storageKey(provider));
  } catch {
    // Nothing to delete.
  }
}
