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

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string; pro?: boolean; retries?: number } = {}
): Promise<T> {
  const { retries = 2, ...fetchOpts } = opts;
  const headers = new Headers(fetchOpts.headers);
  headers.set("Content-Type", "application/json");

  const bearerToken = fetchOpts.token ?? (fetchOpts.pro !== false ? getProToken() : null);
  if (bearerToken) headers.set("Authorization", `Bearer ${bearerToken}`);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, { ...fetchOpts, headers });
      if (!res.ok) {
        const body = await res.text();
        throw new ApiError(res.status, `${res.status}: ${body}`);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      lastErr = err;
      // Ne pas réessayer sur 401/403/404 — erreur définitive
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) break;
      // Réessayer uniquement sur erreur réseau ou 5xx
      if (attempt < retries) await sleep(600 * (attempt + 1));
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
