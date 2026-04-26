"use client";
import { useState } from "react";
import { api, redirectOn401 } from "@/lib/api";
import { IaHistoryPanel, type HistoryEntry } from "@/components/ia/IaHistoryPanel";

type Day = { date: string; label: string; dishes: string[]; theme?: string; notes?: string };
type PlanningResult = { week: Day[]; intro?: string };

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function getNextWeekDates(): string[] {
  const today = new Date();
  const next = new Date(today);
  next.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7 || 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(next);
    d.setDate(next.getDate() + i);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  });
}

export default function PlanningIAPage() {
  const [cuisine, setCuisine]       = useState("");
  const [constraints, setConstraints] = useState("");
  const [budget, setBudget]         = useState("moyen");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<PlanningResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const dates = getNextWeekDates();

  const onRestoreHistory = (entry: HistoryEntry) => {
    if (entry.outputData?.result) {
      setResult(entry.outputData.result as PlanningResult);
      setSaved(false);
    }
  };

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    const prompt = `Génère un planning de plats du jour pour une semaine (lundi à dimanche) pour un restaurant ${cuisine || "français"}.
Budget : ${budget}. ${constraints ? `Contraintes : ${constraints}.` : ""}
Pour chaque jour, propose 1 entrée, 1 plat principal et 1 dessert. Ajoute un thème optionnel et des notes culinaires.
Réponds en JSON strict avec ce format :
{
  "intro": "phrase d'intro",
  "week": [
    { "label": "Lundi", "theme": "...", "dishes": ["Entrée: ...", "Plat: ...", "Dessert: ..."], "notes": "..." },
    ...7 jours
  ]
}`;

    try {
      const res = await api<{ message: { content: string } }>("/api/pro/ia/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Tu es un chef cuisinier expert. Réponds uniquement en JSON valide, sans markdown." },
            { role: "user", content: prompt },
          ],
        }),
      });
      const raw = res.message.content.trim().replace(/^```json\n?|```$/g, "");
      const parsed = JSON.parse(raw) as PlanningResult;
      setResult(parsed);
    } catch (e: any) {
      redirectOn401(e);
      setError("Génération impossible. Vérifiez votre clé API Nova IA.");
    } finally {
      setLoading(false);
    }
  }

  async function saveToHistory() {
    if (!result || saving) return;
    setSaving(true);
    try {
      const label = cuisine || "français";
      const weekRange = dates.length >= 7 ? `${dates[0]} – ${dates[6]}` : "";
      await api("/api/pro/ia/history", {
        method: "POST",
        body: JSON.stringify({
          type: "PLANNING",
          title: `Planning ${label} · ${weekRange}`,
          outputData: { result, cuisine, constraints, budget },
        }),
      });
      setSaved(true);
      setHistoryKey(k => k + 1);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  function exportText() {
    if (!result) return;
    const lines = result.week.map((day, i) =>
      `${DAYS_FR[i]} ${dates[i]}\n${day.theme ? `Thème : ${day.theme}\n` : ""}${day.dishes.join("\n")}${day.notes ? `\n💡 ${day.notes}` : ""}`
    );
    const text = `Planning de la semaine\n${"─".repeat(40)}\n\n${lines.join("\n\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">🗓️</div>
        <div>
          <h1 className="text-xl font-bold text-white">Planning IA</h1>
          <p className="text-sm text-white/40">Générez votre planning de plats du jour pour la semaine</p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">✨ PRO IA</span>
        <IaHistoryPanel type="PLANNING" onRestore={onRestoreHistory} refreshKey={historyKey} />
      </div>

      {/* Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="space-y-1">
          <label className="text-xs text-white/40 uppercase tracking-wider">Type de cuisine</label>
          <input
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="ex: française, italienne, fusion asiatique…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40 uppercase tracking-wider">Contraintes</label>
          <input
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="ex: sans gluten, végétarien-friendly, saison été…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/40 uppercase tracking-wider">Budget ingrédients</label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
          >
            <option value="économique">Économique (food cost &lt;25%)</option>
            <option value="moyen">Moyen (food cost 25–35%)</option>
            <option value="premium">Premium (food cost &gt;35%)</option>
          </select>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="mb-8 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white font-semibold flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Génération en cours…
          </>
        ) : (
          "✨ Générer le planning"
        )}
      </button>

      {error && (
        <div className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">⚠️ {error}</div>
      )}

      {result && (
        <div className="space-y-4">
          {result.intro && (
            <p className="text-white/60 text-sm italic mb-6">💡 {result.intro}</p>
          )}

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold text-white">Semaine du {dates[0]} au {dates[6]}</h2>
            <div className="flex gap-2">
              {/* Sauvegarder dans l'historique */}
              <button
                onClick={saveToHistory}
                disabled={saving || saved}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${
                  saved
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                {saving
                  ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Sauvegarde…</>
                  : saved
                    ? "✅ Sauvegardé"
                    : "💾 Sauvegarder"}
              </button>
              <button
                onClick={exportText}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm text-white/60 hover:text-white"
              >
                {copied ? "✅ Copié !" : "📋 Copier le planning"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {result.week.map((day, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 hover:border-purple-500/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white">{DAYS_FR[i] ?? day.label}</p>
                    <p className="text-xs text-white/30">{dates[i]}</p>
                  </div>
                  {day.theme && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0 ml-2">
                      {day.theme}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {day.dishes.map((dish, j) => (
                    <div key={j} className="text-sm text-white/70 flex gap-2">
                      <span className="text-white/20 shrink-0">{["🥗", "🍽️", "🍮"][j] ?? "•"}</span>
                      <span>{dish.replace(/^(Entrée|Plat|Dessert)\s*:\s*/i, "")}</span>
                    </div>
                  ))}
                </div>
                {day.notes && (
                  <p className="mt-3 text-xs text-white/30 italic border-t border-white/5 pt-3">💡 {day.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
