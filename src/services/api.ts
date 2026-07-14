const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const SESSION_KEY = "pantry-to-plate-session";

export type AuthSession = {
  access_token: string;
  refresh_token: string;
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

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
  return parseResponse<T>(response);
}
