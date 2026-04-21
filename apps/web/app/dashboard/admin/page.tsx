"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Subscription = "STARTER" | "PRO" | "PRO_IA";
type Restaurant = {
  id: string;
  name: string;
  subscription: Subscription;
  ollamaApiKey?: string;
  maxTables?: number;
  createdAt: string;
};

const SUBSCRIPTION_PLANS = {
  STARTER: { name: "Starter", price: "49,99€", tables: 30, ia: false },
  PRO: { name: "Pro", price: "139,99€", tables: -1, ia: false },
  PRO_IA: { name: "Pro + NovaTech IA", price: "299€", tables: -1, ia: true },
};

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [selectedSub, setSelectedSub] = useState<Subscription>("STARTER");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pour cette démo, on utilise localStorage
    // En prod, ce serait une vraie API
    const stored = localStorage.getItem("restaurants");
    if (stored) {
      setRestaurants(JSON.parse(stored));
    }
  }, []);

  const generateOllamaKey = () => {
    const key = `ollama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return key;
  };

  const addRestaurant = async () => {
    const name = prompt("Nom du restaurant:");
    if (!name) return;

    const newResto: Restaurant = {
      id: `resto_${Date.now()}`,
      name,
      subscription: selectedSub,
      ollamaApiKey: selectedSub === "PRO_IA" ? generateOllamaKey() : undefined,
      maxTables: selectedSub === "STARTER" ? 30 : -1,
      createdAt: new Date().toISOString(),
    };

    const updated = [...restaurants, newResto];
    setRestaurants(updated);
    localStorage.setItem("restaurants", JSON.stringify(updated));
  };

  const updateSubscription = (id: string, newSub: Subscription) => {
    const updated = restaurants.map((r) =>
      r.id === id
        ? {
            ...r,
            subscription: newSub,
            ollamaApiKey:
              newSub === "PRO_IA" && !r.ollamaApiKey
                ? generateOllamaKey()
                : r.ollamaApiKey,
            maxTables: newSub === "STARTER" ? 30 : -1,
          }
        : r
    );
    setRestaurants(updated);
    localStorage.setItem("restaurants", JSON.stringify(updated));
    setEditingId(null);
  };

  const regenerateKey = (id: string) => {
    const updated = restaurants.map((r) =>
      r.id === id ? { ...r, ollamaApiKey: generateOllamaKey() } : r
    );
    setRestaurants(updated);
    localStorage.setItem("restaurants", JSON.stringify(updated));
  };

  const deleteRestaurant = (id: string) => {
    if (!confirm("Supprimer ce restaurant ?")) return;
    const updated = restaurants.filter((r) => r.id !== id);
    setRestaurants(updated);
    localStorage.setItem("restaurants", JSON.stringify(updated));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">🛡️ Admin Nova</h1>
      <p className="text-white/50 mb-8">Gestion des souscriptions & clés API Ollama</p>

      {/* Bouton ajouter */}
      <button
        onClick={addRestaurant}
        className="mb-6 px-6 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-semibold"
      >
        + Ajouter un restaurant
      </button>

      {/* Tableau des restaurants */}
      <div className="space-y-4">
        {restaurants.map((resto) => (
          <div
            key={resto.id}
            className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{resto.name}</h2>
                <p className="text-xs text-white/50">
                  ID: {resto.id} | Créé: {new Date(resto.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => deleteRestaurant(resto.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                ✕ Supprimer
              </button>
            </div>

            {/* Souscription */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/50 mb-2 block">
                  Souscription
                </label>
                {editingId === resto.id ? (
                  <select
                    value={resto.subscription}
                    onChange={(e) => updateSubscription(resto.id, e.target.value as Subscription)}
                    className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white text-sm"
                  >
                    {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                      <option key={key} value={key}>
                        {plan.name} - {plan.price}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">
                      {SUBSCRIPTION_PLANS[resto.subscription].name}
                    </span>
                    <button
                      onClick={() => setEditingId(resto.id)}
                      className="text-orange-400 hover:text-orange-300 text-xs"
                    >
                      ✏️ Modifier
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 mb-2 block">
                  Tables maximum
                </label>
                <span className="text-white font-semibold">
                  {resto.maxTables === -1 ? "Illimitées" : resto.maxTables}
                </span>
              </div>
            </div>

            {/* Clé API Ollama (si Pro IA) */}
            {resto.subscription === "PRO_IA" && (
              <div>
                <label className="text-xs font-medium text-white/50 mb-2 block">
                  🔑 Clé API Ollama
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-xs break-all">
                    {resto.ollamaApiKey}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resto.ollamaApiKey || "");
                      alert("Clé copiée!");
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs"
                  >
                    📋 Copier
                  </button>
                  <button
                    onClick={() => regenerateKey(resto.id)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
                  >
                    🔄 Régénérer
                  </button>
                </div>
                <p className="text-[10px] text-white/40 mt-2">
                  À partager avec le restaurant pour l'authentification IA
                </p>
              </div>
            )}

            {/* Features */}
            <div>
              <label className="text-xs font-medium text-white/50 mb-2 block">
                Fonctionnalités incluses
              </label>
              <div className="space-y-1 text-sm text-white/70">
                <div>✅ Commandes QR & paiement Stripe</div>
                <div>✅ Dashboard temps réel (Socket.io)</div>
                {resto.subscription !== "STARTER" && <div>✅ Export Z comptable</div>}
                {resto.subscription !== "STARTER" && <div>✅ Multi-utilisateurs & analytics avancées</div>}
                {resto.subscription === "PRO_IA" && (
                  <>
                    <div>✨ Magic Scan (IA Vision pour menu)</div>
                    <div>✨ Chatbot Nova client</div>
                    <div>✨ Gamification serveur & leaderboard</div>
                    <div>✨ Prédiction d'affluence & planning IA</div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div className="mt-8 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <p className="text-white text-sm">
          <strong>Total restaurants:</strong> {restaurants.length} |{" "}
          <strong>Pro IA actifs:</strong> {restaurants.filter((r) => r.subscription === "PRO_IA").length}
        </p>
      </div>
    </div>
  );
}
