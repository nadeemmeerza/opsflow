import type { AuthUser } from './authSlice';

const AUTH_STORAGE_KEY = 'opsflow_auth';

export interface StoredAuth {
  user: AuthUser;
  accessToken: string;
}

export function saveAuth(data: StoredAuth) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(data),
  );
}

export function loadAuth(): StoredAuth | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(
    AUTH_STORAGE_KEY,
  );

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as StoredAuth;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
}