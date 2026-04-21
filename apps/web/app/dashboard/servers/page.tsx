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

type ServerSchedule = {
  id?: string;
  dayOfWeek: number;
  openMin: number;
  closeMin: number;
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSchedules, setEditingSchedules] = useState<ServerSchedule[]>([]);

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

  const startEdit = async (server: Server) => {
    setEditingId(server.id);
    try {
      const res = await api<{ schedules: ServerSchedule[] }>(`/api/pro/servers/${server.id}/schedules`);
      setEditingSchedules(res.schedules);
    } catch (err) {
      setError("Erreur chargement planning");
    }
  };

  const saveSchedules = async () => {
    if (!editingId) return;
    try {
      await api(`/api/pro/servers/${editingId}/schedules`, {
        method: "PUT",
        body: JSON.stringify(editingSchedules.map(({ dayOfWeek, openMin, closeMin }) => ({ dayOfWeek, openMin, closeMin }))),
      });
      setEditingId(null);
    } catch (err) {
      setError("Erreur sauvegarde planning");
    }
  };

  const addScheduleRow = () => {
    setEditingSchedules(p => [...p, { dayOfWeek: 1, openMin: 660, closeMin: 900 }]);
  };

  const updateScheduleRow = (idx: number, field: keyof ServerSchedule, value: any) => {
    setEditingSchedules(p => p.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeScheduleRow = (idx: number) => {
    setEditingSchedules(p => p.filter((_, i) => i !== idx));
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
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Gestion de l'équipe</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button className="ml-auto text-red-400/50 hover:text-red-400" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 flex gap-2 p-4">
            <input
              className="flex-1 border border-white/10 rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-orange-500/50 focus:outline-none"
              placeholder="Nom du serveur"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              disabled={adding}
            />
            <button className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-all" onClick={add} disabled={adding || !newName.trim()}>
              {adding ? "..." : "Ajouter"}
            </button>
          </div>

          <div className="space-y-3">
            {servers.map((s) => (
              <div key={s.id}
                className={`rounded-lg border p-4 flex items-center justify-between gap-3 cursor-pointer transition-all ${editingId === s.id ? "border-orange-500/50 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                onClick={() => startEdit(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">{s.name}</div>
                    <div className="text-xs text-white/50">Cliquez pour le planning</div>
                  </div>
                </div>
                <button className="text-white/50 hover:text-red-400 p-1 transition-colors" onClick={(e) => { e.stopPropagation(); del(s.id); }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          {editingId ? (
            <div className="rounded-lg border border-orange-500/30 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-orange-400">Planning de {servers.find(s => s.id === editingId)?.name}</h2>
                <button className="text-xs font-bold text-orange-400 px-2 py-1 bg-orange-500/20 rounded hover:bg-orange-500/30 transition-colors" onClick={addScheduleRow}>
                  + AJOUTER UN CRÉNEAU
                </button>
              </div>

              <div className="space-y-2">
                {editingSchedules.length === 0 && (
                  <p className="text-center py-6 text-sm text-white/50">Aucun créneau défini.</p>
                )}
                {editingSchedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 group">
                    <select className="text-xs border border-white/10 rounded px-1 py-1 bg-white/5 text-white" value={s.dayOfWeek}
                      onChange={(e) => updateScheduleRow(i, "dayOfWeek", parseInt(e.target.value))}>
                      {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                    </select>
                    <input type="time" className="text-xs border border-white/10 rounded px-1 py-1 w-20 bg-white/5 text-white" value={minToTime(s.openMin)}
                      onChange={(e) => updateScheduleRow(i, "openMin", timeToMin(e.target.value))} />
                    <span className="text-white/50">-</span>
                    <input type="time" className="text-xs border border-white/10 rounded px-1 py-1 w-20 bg-white/5 text-white" value={minToTime(s.closeMin)}
                      onChange={(e) => updateScheduleRow(i, "closeMin", timeToMin(e.target.value))} />
                    <button className="text-white/50 hover:text-red-400 ml-auto transition-colors" onClick={() => removeScheduleRow(i)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-all" onClick={saveSchedules}>Enregistrer le planning</button>
                <button className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white font-semibold text-sm transition-all" onClick={() => setEditingId(null)}>Annuler</button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
              <div className="text-4xl mb-2">👤</div>
              <p className="text-white/50 text-sm">Sélectionnez un membre de l'équipe à gauche pour gérer ses horaires de travail.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}