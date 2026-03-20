import { useEffect, useState } from "react";
import { resetNexusActor, robustCall } from "./useNexusActor";

const STORAGE_KEY = "nexus_admin_token";

// Shared state so all consumers re-render when auth changes
let _isAdmin = false;
let _token: string | null = null;
const _listeners: Array<() => void> = [];

function notify() {
  for (const cb of _listeners) cb();
}

function loadFromStorage(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveToStorage(token: string | null) {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Initialize from storage on module load
const storedToken = loadFromStorage();
if (storedToken) {
  _token = storedToken;
  _isAdmin = true;
}

export function useAdminAuth() {
  const [state, setState] = useState({ isAdmin: _isAdmin, token: _token });

  useEffect(() => {
    const cb = () => setState({ isAdmin: _isAdmin, token: _token });
    _listeners.push(cb);
    // Verify stored token is still valid
    if (_token) {
      const t = _token;
      robustCall((actor) => actor.verifyAdminToken(t), 3)
        .then((valid) => {
          if (!valid) {
            _isAdmin = false;
            _token = null;
            saveToStorage(null);
            notify();
          }
        })
        .catch(() => {
          // Keep existing auth state on network error — don't log out
        });
    }
    return () => {
      const idx = _listeners.indexOf(cb);
      if (idx >= 0) _listeners.splice(idx, 1);
    };
  }, []);

  function loginWithToken(token: string) {
    _token = token;
    _isAdmin = true;
    saveToStorage(token);
    notify();
  }

  function logout() {
    if (_token) {
      robustCall((actor) => actor.logoutAdmin(_token!), 1).catch(() => {});
    }
    _token = null;
    _isAdmin = false;
    saveToStorage(null);
    resetNexusActor();
    notify();
  }

  function getToken() {
    return state.token;
  }

  return {
    isAdmin: state.isAdmin,
    isFetching: false,
    getToken,
    loginWithToken,
    logout,
  };
}
