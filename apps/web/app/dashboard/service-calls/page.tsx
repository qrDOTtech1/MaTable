"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ServiceCall = {
  id: string;
  createdAt: string;
  table: { number: number };
  reason?: string;
};

export default function ServiceCallsPage() {
  const [calls, setCalls] = useState<ServiceCall[]>([]);

  useEffect(() => {
    const loadCalls = async () => {
      try {
        const r = await api<{ calls: ServiceCall[] }>("/api/pro/service-calls");
        setCalls(r.calls);
      } catch {}
    };
    loadCalls();
    const interval = setInterval(loadCalls, 3000);
    return () => clearInterval(interval);
  }, []);

  const resolve = async (id: string) => {
    await api(`/api/pro/service-calls/${id}/resolve`, { method: "POST" });
    setCalls(calls.filter((c) => c.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Appels serveur</h1>
      {calls.length === 0 ? (
        <div className="text-slate-500 text-center py-8">Aucun appel en attente</div>
      ) : (
        <div className="space-y-2">
          {calls.map((c) => (
            <div key={c.id} className="card bg-amber-50 border-amber-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Table {c.table.number}</div>
                <div className="text-sm text-amber-700">{c.reason || "Demande d'assistance"}</div>
                <div className="text-xs text-amber-600">
                  {new Date(c.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button className="btn-primary" onClick={() => resolve(c.id)}>
                Résolu
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
