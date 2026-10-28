"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@muslimspaces/shared";

type Session = {
  user: AuthUser | null;
  favoriteIds: ReadonlySet<string>;
  // "loading" until the first /api/session response. Pages are ISR-cached
  // and can't know the viewer at render time, so consumers must render a
  // neutral (logged-out looking) state meanwhile and not act on `user`.
  status: "loading" | "ready";
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

const EMPTY: ReadonlySet<string> = new Set();

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
      setFavoriteIds(new Set<string>(data.favoriteIds ?? []));
    } catch {
      setUser(null);
      setFavoriteIds(EMPTY);
    }
    setStatus("ready");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ user, favoriteIds, status, refresh }), [user, favoriteIds, status, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
