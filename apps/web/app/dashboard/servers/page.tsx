"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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

  useEffect(() => {
    api<{ servers: Server[] }>("/api/pro/servers")
      .then((r) => setServers(r.servers))
      .catch(() => (window.location.href = "/login"));
  }, []);

  const add = async () => {
    if (!newName.trim()) return;
    await api("/api/pro/servers", {
      method: "POST",
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    const r = await api<{ servers: Server[] }>("/api/pro/servers");
    setServers(r.servers);
  };

  const toggle = async (s: Server) => {
    await api(`/api/pro/servers/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !s.active }),
    });
    const r = await api<{ servers: Server[] }>("/api/pro/servers");
    setServers(r.servers);
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer ce serveur ?")) return;
    await api(`/api/pro/servers/${id}`, { method: "DELETE" });
    const r = await api<{ servers: Server[] }>("/api/pro/servers");
    setServers(r.servers);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Serveurs</h1>
      <div className="card flex gap-2 mb-6">
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="Nom du serveur"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn-primary" onClick={add}>Ajouter</button>
      </div>
      <div className="grid gap-3">
        {servers.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              {s.reviewsCount > 0 && (
                <div className="text-sm text-slate-500">
                  ⭐ {(s.avgRating ?? 0).toFixed(1)} ({s.reviewsCount} avis)
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                className="btn-ghost text-sm"
                onClick={() => toggle(s)}
              >
                {s.active ? "Actif" : "Inactif"}
              </button>
              <button className="btn-ghost text-sm text-red-600" onClick={() => del(s.id)}>
                Suppr
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
