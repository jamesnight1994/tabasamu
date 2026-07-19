'use client';

/**
 * SESSION PROVIDER
 *
 * ⚠ HOLDS A DESCRIPTOR, NOT A TOKEN.
 *
 *   This context holds who the customer is and when their session expires — the
 *   information the UI needs to render "Hi Amina" and to pre-empt a 401. It does
 *   NOT hold the credential that authorises requests; that is an httpOnly cookie
 *   the JavaScript cannot read, which is the entire security argument. A token
 *   in a React state or localStorage is a token an XSS can steal. [D-55]
 *
 * ⚠ THE SESSION IS FETCHED FROM THE SERVER ON LOAD.
 *   On mount we ask the AuthService who we are (it reads the cookie). We never
 *   trust a client-persisted "isLoggedIn" flag — that is spoofable and drifts.
 *   The server is the authority; this is a cache of its answer.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useAdapters } from './AdapterProvider';
import {
  type Session,
  type Email,
  type AuthError,
  isSessionExpiringSoon,
} from '../../domain/identity/auth';
import type { Result } from '../../domain/shared';

export interface SessionContextValue {
  readonly session: Session | null;
  /** True until the initial "who am I?" resolves — prevents an auth-flash. */
  readonly loading: boolean;
  readonly isAuthenticated: boolean;
  readonly expiringSoon: boolean;
  signIn(email: Email, password: string): Promise<Result<Session, AuthError>>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
  /** After register/verify, push the new session into context without a reload. */
  setSession(session: Session | null): void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>.');
  return ctx;
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const adapters = useAdapters();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Initial "who am I?" — the server reads the cookie and answers.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const s = await adapters.auth.currentSession();
        if (!cancelled) setSession(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapters]);

  // A slow tick so `expiringSoon` becomes true without a user action — the
  // banner needs to appear on its own as the clock runs down.
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [session]);

  const signIn = useCallback(
    async (emailAddr: Email, password: string) => {
      const r = await adapters.auth.signIn(emailAddr, password);
      if (r.ok) setSession(r.value);
      return r;
    },
    [adapters]
  );

  const signOut = useCallback(async () => {
    await adapters.auth.signOut();
    setSession(null);
  }, [adapters]);

  const refresh = useCallback(async () => {
    const r = await adapters.auth.refresh();
    if (r.ok) setSession(r.value);
    else setSession(null); // refresh failed → treat as signed out
  }, [adapters]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      loading,
      isAuthenticated: session !== null,
      expiringSoon: session ? isSessionExpiringSoon(session, now) : false,
      signIn,
      signOut,
      refresh,
      setSession,
    }),
    [session, loading, now, signIn, signOut, refresh]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
