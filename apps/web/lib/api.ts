export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const PRO_TOKEN_KEY = "atable_pro_token";

export function getProToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PRO_TOKEN_KEY);
}
export function setProToken(token: string) {
  localStorage.setItem(PRO_TOKEN_KEY, token);
}
export function clearProToken() {
  localStorage.removeItem(PRO_TOKEN_KEY);
}

// Erreur distinguant 401 (session expirée) des autres erreurs réseau/serveur
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
  get isAuthError() { return this.status === 401; }
}

// IA routes need long timeout (vision can take 5-7min) and NO retries
const IA_PATHS = ["/ia/", "/ia-"];
const IA_TIMEOUT_MS = 480_000;     // 8 min
const DEFAULT_TIMEOUT_MS = 30_000; // 30s

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string; pro?: boolean; retries?: number; timeoutMs?: number } = {}
): Promise<T> {
  const isIA = IA_PATHS.some(p => path.includes(p));
  const { retries = isIA ? 0 : 2, timeoutMs, ...fetchOpts } = opts;
  const headers = new Headers(fetchOpts.headers);
  headers.set("Content-Type", "application/json");

  const bearerToken = fetchOpts.token ?? (fetchOpts.pro !== false ? getProToken() : null);
  if (bearerToken) headers.set("Authorization", `Bearer ${bearerToken}`);

  // AbortController with explicit timeout — critical for IA routes
  const timeout = timeoutMs ?? (isIA ? IA_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...fetchOpts,
        headers,
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text();
        throw new ApiError(res.status, `${res.status}: ${body}`);
      }
      return res.json() as Promise<T>;
    } catch (err: any) {
      lastErr = err;
      // Timeout → surface a clear error, no retry
      if (err?.name === "AbortError") {
        throw new ApiError(504, "La requête a expiré. Le serveur IA met trop de temps à répondre.");
      }
      // Ne pas réessayer sur 401/403/404 — erreur définitive
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) break;
      // Réessayer uniquement sur erreur réseau ou 5xx
      if (attempt < retries) await sleep(600 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

// Redirige vers /login UNIQUEMENT sur 401, logge les autres erreurs
export function redirectOn401(err: unknown) {
  if (err instanceof ApiError && err.isAuthError) {
    clearProToken();
    window.location.href = "/login";
  } else {
    console.error("[api]", err);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * SSE streaming request — returns an async generator of parsed events.
 * The connection stays alive as the server streams chunks,
 * preventing timeout issues on long-running AI requests.
 */
export async function apiStream(
  path: string,
  body: unknown,
  opts: { timeoutMs?: number } = {},
): Promise<AsyncGenerator<{ type: string; [key: string]: unknown }>> {
  const token = getProToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Long timeout for initial connection — once streaming starts, the connection stays alive
  const timeout = opts.timeoutMs ?? 600_000; // 10min max
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!res.ok) {
    clearTimeout(timer);
    const text = await res.text();
    throw new ApiError(res.status, `${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    clearTimeout(timer);
    throw new Error("No response body for SSE stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  async function* generate(): AsyncGenerator<{ type: string; [key: string]: unknown }> {
    try {
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              yield event;
            } catch { /* skip malformed event */ }
          }
        }
      }
      // Process any remaining buffer
      if (buffer.startsWith("data: ")) {
        try {
          const event = JSON.parse(buffer.slice(6));
          yield event;
        } catch { /* skip */ }
      }
    } finally {
      clearTimeout(timer);
      reader!.releaseLock();
    }
  }

  return generate();
}

// Upload de fichiers (multipart) — ne met PAS Content-Type (le navigateur ajoute le boundary)
export async function apiUpload<T>(
  path: string,
  files: File[],
  opts: { query?: Record<string, string | undefined> } = {}
): Promise<T> {
  const token = getProToken();
  const form = new FormData();
  files.forEach((f) => form.append("files", f, f.name));

  const qs = new URLSearchParams();
  Object.entries(opts.query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const url = `${API_URL}${path}${qs.toString() ? `?${qs}` : ""}`;

  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { method: "POST", body: form, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, `${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}
