"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type DishReview = { id: string; rating: number; comment?: string; menuItem: { name: string }; createdAt: string };
type ServerReview = { id: string; rating: number; comment?: string; server: { name: string }; createdAt: string };

export default function ReviewsPage() {
  const [dishReviews, setDishReviews] = useState<DishReview[]>([]);
  const [serverReviews, setServerReviews] = useState<ServerReview[]>([]);
  const [tab, setTab] = useState<"dishes" | "servers">("dishes");

  useEffect(() => {
    api<{ reviews: DishReview[] }>("/api/pro/reviews/dishes")
      .then((r) => setDishReviews(r.reviews))
      .catch(() => {});
    api<{ reviews: ServerReview[] }>("/api/pro/reviews/servers")
      .then((r) => setServerReviews(r.reviews))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Avis</h1>
      <div className="flex gap-2 mb-4">
        <button
          className={tab === "dishes" ? "btn-primary" : "btn-ghost"}
          onClick={() => setTab("dishes")}
        >
          Plats ({dishReviews.length})
        </button>
        <button
          className={tab === "servers" ? "btn-primary" : "btn-ghost"}
          onClick={() => setTab("servers")}
        >
          Serveurs ({serverReviews.length})
        </button>
      </div>
      {tab === "dishes" ? (
        <div className="space-y-2">
          {dishReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{r.menuItem.name}</div>
                  <div className="text-sm">{"⭐".repeat(r.rating)} ({r.rating}/5)</div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {serverReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{r.server.name}</div>
                  <div className="text-sm">{"⭐".repeat(r.rating)} ({r.rating}/5)</div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
