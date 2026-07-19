const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? "/api/v1" : "http://localhost:4000/api/v1");
export const SESSION_KEY = "pantry-to-plate-session";
export const SESSION_CHANGE_EVENT = "pantry-to-plate-session-change";
const API_CACHE_PREFIX = "pantry-to-plate-api-cache:";

type CachedValue = {
  expiresAt: number;
  value: unknown;
};

type ApiCacheOptions = {
  ttlMs?: number;
  persist?: boolean;
  force?: boolean;
};

const responseCache = new Map<string, CachedValue>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user?: { id: string; email?: string; user_metadata?: { display_name?: string } };
};

export type SignUpResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id: string; email?: string; user_metadata?: { display_name?: string } };
};

function readSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function getSession() {
  return readSession();
}

export function hasAuthSession() {
  return Boolean(readSession()?.access_token);
}

export function saveSession(session: AuthSession) {
  clearApiCache();
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function clearSession() {
  clearApiCache();
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

/** Start Supabase's Google OAuth flow and return to the in-app callback route. */
export function startGoogleSignIn() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey || supabaseUrl.includes("your-project-ref")) {
    throw new Error("Google sign-in is not configured yet. Please try email sign-in or contact support.");
  }

  const authorizeUrl = new URL("/auth/v1/authorize", supabaseUrl);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", `${window.location.origin}/auth/callback`);
  authorizeUrl.searchParams.set("apikey", publishableKey);
  window.location.assign(authorizeUrl.toString());
}

/** Read the Supabase implicit OAuth response after Google redirects back. */
export function readOAuthCallbackSession(): AuthSession | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (!accessToken || !refreshToken) return null;

  const expiresIn = Number(hash.get("expires_in"));
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    ...(Number.isFinite(expiresIn) ? { expires_in: expiresIn } : {}),
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message.join(" ") : data.message;
    throw new Error(message ?? "Something went wrong. Please try again.");
  }
  return data;
}

export async function publicApi<T>(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

async function refreshSession() {
  const current = readSession();
  if (!current?.refresh_token) throw new Error("Please sign in again.");
  const refreshed = await publicApi<AuthSession>("/auth/refresh", {
    refreshToken: current.refresh_token,
  });
  saveSession(refreshed);
  return refreshed;
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const session = readSession();
  if (!session?.access_token) throw new Error("Please sign in to continue.");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });
  if (response.status === 401 && retry) {
    await refreshSession();
    return api<T>(path, options, false);
  }
  const value = await parseResponse<T>(response);
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    invalidateApiCache("/dashboard/summary");
    invalidateApiCache("/recipe-matcher/from-pantry");
    if (path.startsWith("/favorites")) invalidateApiCache("/favorites");
    if (path.startsWith("/users")) invalidateApiCache("/users/me");
  }
  return value;
}

function apiCacheKey(path: string) {
  const userId = readSession()?.user?.id ?? "anonymous";
  return `${userId}:${path}`;
}

function readPersistentCache(key: string): CachedValue | null {
  try {
    const raw = sessionStorage.getItem(`${API_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedValue;
    if (cached.expiresAt <= Date.now()) {
      sessionStorage.removeItem(`${API_CACHE_PREFIX}${key}`);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

export function getCachedApiValue<T>(path: string): T | null {
  const key = apiCacheKey(path);
  const cached = responseCache.get(key) ?? readPersistentCache(key);
  if (!cached || cached.expiresAt <= Date.now()) return null;
  responseCache.set(key, cached);
  return cached.value as T;
}

export async function cachedApi<T>(path: string, options: ApiCacheOptions = {}): Promise<T> {
  const { ttlMs = 60_000, persist = false, force = false } = options;
  const key = apiCacheKey(path);
  if (!force) {
    const cached = getCachedApiValue<T>(path);
    if (cached !== null) return cached;
    const pending = inFlightRequests.get(key);
    if (pending) return pending as Promise<T>;
  }

  const request = api<T>(path).then((value) => {
    const cached = { value, expiresAt: Date.now() + ttlMs } satisfies CachedValue;
    responseCache.set(key, cached);
    if (persist) {
      try {
        sessionStorage.setItem(`${API_CACHE_PREFIX}${key}`, JSON.stringify(cached));
      } catch {
        // Memory caching still prevents duplicate requests when storage is unavailable.
      }
    }
    return value;
  }).finally(() => {
    if (inFlightRequests.get(key) === request) inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, request);
  return request;
}

export function invalidateApiCache(path?: string) {
  const suffix = path ? `:${path}` : "";
  for (const key of responseCache.keys()) {
    if (!path || key.endsWith(suffix)) responseCache.delete(key);
  }
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(API_CACHE_PREFIX) && (!path || key.endsWith(suffix))) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Cache invalidation is best-effort when storage is unavailable.
  }
}

export function clearApiCache() {
  responseCache.clear();
  inFlightRequests.clear();
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(API_CACHE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // The in-memory cache has already been cleared.
  }
}
