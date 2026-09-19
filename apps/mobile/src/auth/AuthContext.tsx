import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@muslimspaces/shared";
import { api, getToken, setToken } from "../lib/api-client";
import { i18n, isSupportedLocale } from "../i18n";
import { applyLocaleDirection } from "../i18n/rtl";
import { storeLocale } from "../i18n/locale-storage";

// A logged-in account's saved preferredLocale wins over whatever the app
// was already showing — someone who set Arabic from another device expects
// to see it here too. Only applied right after login/signup (not on every
// refreshUser) so it can't fight a mid-session change made from Edit
// profile before that change has had a chance to reach the server.
async function applyAccountLocale(user: AuthUser): Promise<void> {
  if (!isSupportedLocale(user.preferredLocale) || user.preferredLocale === i18n.language) return;
  await storeLocale(user.preferredLocale);
  await i18n.changeLanguage(user.preferredLocale);
  await applyLocaleDirection(
    user.preferredLocale,
    i18n.t("editProfile.restartTitle"),
    i18n.t("editProfile.restartBody"),
    i18n.t("editProfile.restartConfirm"),
  );
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      setUser(await api.auth.me());
    } catch {
      // Expired/invalid token — treat as logged out.
      await setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    await setToken(res.accessToken);
    setUser(res.user);
    await applyAccountLocale(res.user);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await api.auth.signup({ email, password });
    await setToken(res.accessToken);
    setUser(res.user);
    await applyAccountLocale(res.user);
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
