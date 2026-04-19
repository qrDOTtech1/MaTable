"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Table = {
  id: string;
  number: number;
  sessions: Array<{ id: string; active: boolean }>;
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);

  async function reload() {
    const r = await api<{ tables: Table[] }>(`/api/pro/tables`);
    setTables(r.tables);
  }

  useEffect(() => {
    reload().catch(() => (window.location.href = "/login"));
  }, []);

  async function add() {
    await api(`/api/pro/tables`, { method: "POST" });
    reload();
  }

  async function reset(id: string) {
    if (!confirm("Fermer la session en cours sur cette table ?")) return;
    await api(`/api/pro/tables/${id}/reset`, { method: "POST" });
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tables</h1>
        <button className="btn-primary" onClick={add}>+ Ajouter une table</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tables.map((t) => {
          const active = t.sessions.some((s) => s.active);
          return (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold">Table {t.number}</div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {active ? "Occupée" : "Libre"}
                </span>
              </div>
              <div className="text-xs text-slate-500 break-all mb-3">{t.id}</div>
              <button
                className="btn-ghost w-full text-sm"
                disabled={!active}
                onClick={() => reset(t.id)}
              >
                Reset Table
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
