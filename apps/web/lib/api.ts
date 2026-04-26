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

// IA routes need long timeout (vision can take 3-4min) and NO retries
const IA_PATHS = ["/ia/", "/ia-"];
const IA_TIMEOUT_MS = 270_000;     // 4min30
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
