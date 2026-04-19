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

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string; pro?: boolean } = {}
): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");

  const bearerToken = opts.token ?? (opts.pro !== false ? getProToken() : null);
  if (bearerToken) headers.set("Authorization", `Bearer ${bearerToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}
