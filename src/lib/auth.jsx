import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setPlayer(null);
      setLoading(false);
      return null;
    }
    try {
      const { player: p } = await api("/auth/me");
      setPlayer(p);
      return p;
    } catch {
      setPlayer(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onLogout = () => setPlayer(null);
    window.addEventListener("codm:logout", onLogout);
    return () => window.removeEventListener("codm:logout", onLogout);
  }, [refresh]);

  const signIn = useCallback(({ token, player: p }) => {
    tokenStore.set(token);
    setPlayer(p);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.set(null);
    setPlayer(null);
  }, []);

  const value = useMemo(() => ({ player, loading, signIn, signOut, refresh, setPlayer }), [player, loading, signIn, signOut, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
