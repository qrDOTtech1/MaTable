import { API_URL } from "@/lib/api";

const CHAIN_TOKEN_KEY = "atable_chain_token";

export function getChainToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CHAIN_TOKEN_KEY);
}
export function setChainToken(t: string) {
  localStorage.setItem(CHAIN_TOKEN_KEY, t);
}
export function clearChainToken() {
  localStorage.removeItem(CHAIN_TOKEN_KEY);
}

export async function chainApi<T = any>(
  path: string,
  opts?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const token = getChainToken();
  const res = await fetch(`${API_URL}/api/chain${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token && !opts?.skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  if (res.status === 401) {
    clearChainToken();
    if (typeof window !== "undefined") window.location.href = "/chain/login";
    throw new Error("unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error ?? "api_error"), { status: res.status });
  return data as T;
}

export type ChainRestaurant = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  address: string | null;
  businessType: string;
  mapLat: number | null;
  mapLng: number | null;
  mapLabel: string | null;
  totalOrders: number;
  totalRevenueCents: number;
  avgRating: number;
  ordersToday: number;
};

export type ChainStats = {
  totalEstablishments: number;
  totalRevenueCents: number;
  totalOrders: number;
  avgRating: number;
};

export type ChainInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
};
