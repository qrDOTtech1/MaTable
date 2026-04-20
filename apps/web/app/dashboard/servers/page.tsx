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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestion de l'équipe</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="card flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Nom du serveur"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              disabled={adding}
            />
            <button className="btn-primary" onClick={add} disabled={adding || !newName.trim()}>
              {adding ? "..." : "Ajouter"}
            </button>
          </div>

          <div className="space-y-3">
            {servers.map((s) => (
              <div key={s.id} 
                className={`card flex items-center justify-between gap-3 cursor-pointer hover:border-brand/40 transition-all ${editingId === s.id ? "ring-2 ring-brand border-brand" : ""}`}
                onClick={() => startEdit(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-500">Cliquez pour le planning</div>
                  </div>
                </div>
                <button className="text-slate-300 hover:text-red-500 p-1" onClick={(e) => { e.stopPropagation(); del(s.id); }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          {editingId ? (
            <div className="card space-y-4 border-2 border-brand/20 shadow-xl shadow-brand/5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-brand">Planning de {servers.find(s => s.id === editingId)?.name}</h2>
                <button className="text-xs font-bold text-brand px-2 py-1 bg-brand/5 rounded hover:bg-brand/10 transition-colors" onClick={addScheduleRow}>
                  + AJOUTER UN CRÉNEAU
                </button>
              </div>

              <div className="space-y-2">
                {editingSchedules.length === 0 && (
                  <p className="text-center py-6 text-sm text-slate-400">Aucun créneau défini.</p>
                )}
                {editingSchedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                    <select className="text-xs border rounded px-1 py-1 bg-white" value={s.dayOfWeek}
                      onChange={(e) => updateScheduleRow(i, "dayOfWeek", parseInt(e.target.value))}>
                      {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                    </select>
                    <input type="time" className="text-xs border rounded px-1 py-1 w-20 bg-white" value={minToTime(s.openMin)}
                      onChange={(e) => updateScheduleRow(i, "openMin", timeToMin(e.target.value))} />
                    <span className="text-slate-300">-</span>
                    <input type="time" className="text-xs border rounded px-1 py-1 w-20 bg-white" value={minToTime(s.closeMin)}
                      onChange={(e) => updateScheduleRow(i, "closeMin", timeToMin(e.target.value))} />
                    <button className="text-slate-300 hover:text-red-500 ml-auto" onClick={() => removeScheduleRow(i)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button className="btn-primary flex-1" onClick={saveSchedules}>Enregistrer le planning</button>
                <button className="btn-secondary" onClick={() => setEditingId(null)}>Annuler</button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="text-4xl mb-2">👤</div>
              <p className="text-slate-400 text-sm">Sélectionnez un membre de l'équipe à gauche pour gérer ses horaires de travail.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}