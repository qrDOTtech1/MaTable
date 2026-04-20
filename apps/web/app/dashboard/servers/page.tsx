"use client";
import { useEffect, useState } from "react";
import { api, redirectOn401 } from "@/lib/api";

type Server = {
  id: string;
  name: string;
  photoUrl?: string | null;
  active: boolean;
  avgRating?: number | null;
  reviewsCount: number;
};

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const r = await api<{ servers: Server[] }>("/api/pro/servers");
    setServers(r.servers);
  };

  useEffect(() => {
    reload().catch(redirectOn401);
  }, []);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await api("/api/pro/servers", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      await reload();
    } catch (err: any) {
      setError("Impossible d'ajouter le serveur : " + (err?.message ?? "erreur inconnue"));
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (s: Server) => {
    try {
      await api(`/api/pro/servers/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !s.active }),
      });
      await reload();
    } catch (err: any) {
      setError("Erreur : " + (err?.message ?? ""));
    }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ce serveur ?")) return;
    try {
      await api(`/api/pro/servers/${id}`, { method: "DELETE" });
      await reload();
    } catch (err: any) {
      setError("Erreur : " + (err?.message ?? ""));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Serveurs</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Ajout */}
      <div className="card flex gap-2 mb-6">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Nom du serveur (ex : Marie, Théo…)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          disabled={adding}
        />
        <button
          className="btn-primary"
          onClick={add}
          disabled={adding || !newName.trim()}
        >
          {adding ? "Ajout…" : "Ajouter"}
        </button>
      </div>

      {/* Liste */}
      {servers.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">
          Aucun serveur pour l'instant. Ajoutez-en un ci-dessus.
        </p>
      ) : (
        <div className="grid gap-3">
          {servers.map((s) => (
            <div key={s.id} className={`card flex items-center justify-between gap-3 ${!s.active ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                {s.photoUrl ? (
                  <img src={s.photoUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
                    {s.name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium">{s.name}</div>
                  {s.reviewsCount > 0 ? (
                    <div className="text-xs text-slate-500">
                      ⭐ {(s.avgRating ?? 0).toFixed(1)} · {s.reviewsCount} avis
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Pas encore d'avis</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    s.active
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                  onClick={() => toggle(s)}
                >
                  {s.active ? "✓ Actif" : "Inactif"}
                </button>
                <button
                  className="text-xs px-2 py-1 rounded border border-red-100 text-red-500 hover:bg-red-50"
                  onClick={() => del(s.id)}
                >
                  Suppr
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
