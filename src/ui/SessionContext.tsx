import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Tiny app-wide UI state: which conversation the chat tab shows, plus a
 * version counter that screens watch to reload after data is cleared.
 */
interface SessionContextValue {
  activeSessionId: string | null;
  selectSession: (id: string | null) => void;
  dataVersion: number;
  bumpDataVersion: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const selectSession = useCallback((id: string | null) => {
    setActiveSessionId(id);
  }, []);

  const bumpDataVersion = useCallback(() => {
    setDataVersion((version) => version + 1);
  }, []);

  const value = useMemo(
    () => ({ activeSessionId, selectSession, dataVersion, bumpDataVersion }),
    [activeSessionId, dataVersion, selectSession, bumpDataVersion]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionState(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionState must be used inside SessionProvider.');
  }
  return context;
}
