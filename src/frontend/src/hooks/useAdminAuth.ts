import { useCallback, useEffect, useState } from "react";
import { useActor } from "./useActor";

const TOKEN_KEY = "nexus_admin_token";

// Candid ?Text comes back as [] | [string] from the JS agent.
// This helper safely unwraps it regardless of whether the binding
// returns the raw Candid form or has already been coerced to null.
function unwrapOptionalText(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") return raw.length > 0 ? raw : null;
  if (Array.isArray(raw))
    return raw.length > 0 && typeof raw[0] === "string" ? raw[0] : null;
  return null;
}

type AdminActor = {
  adminLogin(username: string, password: string): Promise<unknown>;
  verifyAdminToken(token: string): Promise<boolean>;
  logoutAdmin(token: string): Promise<void>;
};

export function useAdminAuth() {
  const { actor, isFetching } = useActor();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  // Verify token on mount / when actor becomes available
  useEffect(() => {
    if (isFetching || !actor) return;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsAdmin(false);
      setIsVerifying(false);
      return;
    }
    (actor as unknown as AdminActor)
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
        const raw = await (actor as unknown as AdminActor).adminLogin(
          username,
          password,
        );
        const tokenValue = unwrapOptionalText(raw);
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
        await (actor as unknown as AdminActor).logoutAdmin(token);
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
