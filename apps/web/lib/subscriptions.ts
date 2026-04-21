/**
 * Gestion des souscriptions & clés API Ollama
 * Utilitaire pour vérifier les niveaux d'accès IA
 */

export type SubscriptionLevel = "STARTER" | "PRO" | "PRO_IA";

export interface SubscriptionInfo {
  level: SubscriptionLevel;
  hasAI: boolean;
  maxTables: number;
  features: string[];
  ollamaKey?: string;
}

const SUBSCRIPTIONS: Record<SubscriptionLevel, SubscriptionInfo> = {
  STARTER: {
    level: "STARTER",
    hasAI: false,
    maxTables: 30,
    features: [
      "Commandes QR",
      "Paiement Stripe",
      "Dashboard temps réel",
      "Réservations",
    ],
  },
  PRO: {
    level: "PRO",
    hasAI: false,
    maxTables: -1,
    features: [
      "Commandes QR",
      "Paiement Stripe",
      "Dashboard temps réel",
      "Réservations",
      "Export Z comptable",
      "Multi-utilisateurs",
      "Analytics avancées",
    ],
  },
  PRO_IA: {
    level: "PRO_IA",
    hasAI: true,
    maxTables: -1,
    features: [
      "Commandes QR",
      "Paiement Stripe",
      "Dashboard temps réel",
      "Réservations",
      "Export Z comptable",
      "Multi-utilisateurs",
      "Analytics avancées",
      "✨ Magic Scan (Vision IA)",
      "✨ Chatbot Nova",
      "✨ Gamification serveur",
      "✨ Planning IA",
    ],
  },
};

/**
 * Récupère les infos de souscription d'un restaurant
 */
export function getSubscriptionInfo(level: SubscriptionLevel, ollamaKey?: string): SubscriptionInfo {
  return {
    ...SUBSCRIPTIONS[level],
    ollamaKey,
  };
}

/**
 * Vérifie si un restaurant a accès aux features IA
 */
export function hasAIAccess(level: SubscriptionLevel): boolean {
  return SUBSCRIPTIONS[level].hasAI;
}

/**
 * Récupère la clé Ollama depuis le localStorage (démo)
 * En prod, ce serait un appel API sécurisé
 */
export function getOllamaKey(): string | null {
  if (typeof window === "undefined") return null;

  const restaurants = localStorage.getItem("restaurants");
  if (!restaurants) return null;

  try {
    const data = JSON.parse(restaurants);
    const first = data[0];
    return first?.ollamaApiKey || null;
  } catch {
    return null;
  }
}

/**
 * Récupère le niveau de souscription actuel (démo)
 */
export function getCurrentSubscription(): SubscriptionLevel {
  if (typeof window === "undefined") return "STARTER";

  const restaurants = localStorage.getItem("restaurants");
  if (!restaurants) return "STARTER";

  try {
    const data = JSON.parse(restaurants);
    return data[0]?.subscription || "STARTER";
  } catch {
    return "STARTER";
  }
}
