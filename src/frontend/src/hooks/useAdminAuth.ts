import { useCallback, useEffect, useState } from "react";
import { unwrapOpt, useNexusActor } from "./useNexusActor";

const TOKEN_KEY = "nexus_admin_token";

export function useAdminAuth() {
  const { actor, isFetching } = useNexusActor();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (isFetching || !actor) return;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsAdmin(false);
      setIsVerifying(false);
      return;
    }
    actor
      .verifyAdminToken(stored)
      .then((valid) => {
        if (valid) {
          setToken(stored);
          setIsAdmin(true);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [actor, isFetching]);

  const login = useCallback(
    async (
      username: string,
      password: string,
    ): Promise<boolean | "no_actor"> => {
      if (!actor) return "no_actor";
      try {
        const raw = await actor.adminLogin(username, password);
        const tokenValue = unwrapOpt(raw);
        if (tokenValue) {
          localStorage.setItem(TOKEN_KEY, tokenValue);
          setToken(tokenValue);
          setIsAdmin(true);
          return true;
        }
        return false;
      } catch (err) {
        console.error("adminLogin error:", err);
        throw err;
      }
    },
    [actor],
  );

  const logout = useCallback(async () => {
    if (actor && token) {
      try {
        await actor.logoutAdmin(token);
      } catch (_) {
        // ignore
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setIsAdmin(false);
  }, [actor, token]);

  return { token, isAdmin, isVerifying, isFetching, login, logout };
}
