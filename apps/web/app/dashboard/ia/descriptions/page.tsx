"use client";
import { useState } from "react";
import { api, redirectOn401 } from "@/lib/api";

const TONES = [
  { id: "gastronomique", label: "Gastronomique", emoji: "🎩", desc: "Élégant, poétique, pour une clientèle haut de gamme" },
  { id: "bistrot", label: "Bistrot", emoji: "🍷", desc: "Chaleureux, convivial, typiquement français" },
  { id: "moderne", label: "Moderne", emoji: "⚡", desc: "Concis, punchy, tendance street-food / brasserie" },
  { id: "familial", label: "Familial", emoji: "🏠", desc: "Simple, rassurant, accessible à tous" },
];

const LENGTHS = [
  { id: "court", label: "Court", desc: "1–2 phrases" },
  { id: "moyen", label: "Moyen", desc: "3–4 phrases" },
  { id: "long", label: "Long", desc: "5–6 phrases" },
];

export default function DescriptionsPage() {
  const [dishName, setDishName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [tone, setTone] = useState("bistrot");
  const [length, setLength] = useState("moyen");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!dishName.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults([]);

    const toneLabel = TONES.find((t) => t.id === tone)?.label ?? tone;
    const lengthLabel = LENGTHS.find((l) => l.id === length)?.desc ?? length;
    const prompt = `Génère 3 descriptions de menu différentes pour le plat "${dishName}" dans un style ${toneLabel}.
${ingredients ? `Ingrédients principaux : ${ingredients}.` : ""}
Longueur souhaitée : ${lengthLabel} par description.
Mets en valeur les saveurs, les textures et l'expérience gustative.
Réponds UNIQUEMENT avec un tableau JSON de 3 chaînes de caractères, sans markdown :
["description 1", "description 2", "description 3"]`;

    try {
      const res = await api<{ message: { content: string } }>("/api/pro/ia/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Tu es un expert en rédaction gastronomique. Réponds uniquement en JSON valide sans markdown." },
            { role: "user", content: prompt },
          ],
        }),
      });
      const raw = res.message.content.trim().replace(/^```json\n?|```$/g, "");
      const parsed = JSON.parse(raw) as string[];
      setResults(Array.isArray(parsed) ? parsed : [parsed.toString()]);
    } catch (e: any) {
      redirectOn401(e);
      setError("Génération impossible. Vérifiez votre clé API Nova IA.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">✍️</div>
        <div>
          <h1 className="text-xl font-bold text-white">Descriptions IA</h1>
          <p className="text-sm text-white/40">Générez 3 descriptions de plats en un clic, dans le ton de votre restaurant</p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">✨ PRO IA</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-wider">Nom du plat *</label>
            <input
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="ex: Risotto aux truffes noires"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-wider">Ingrédients principaux</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="ex: riz arborio, parmesan, truffe noire, bouillon de volaille, vin blanc…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs text-white/40 uppercase tracking-wider">Ton</label>
            {TONES.map((t) => (
              <label
                key={t.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  tone === t.id
                    ? "bg-purple-500/10 border-purple-500/40 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/20"
                }`}
              >
                <input type="radio" name="tone" value={t.id} checked={tone === t.id} onChange={() => setTone(t.id)} className="mt-0.5 accent-purple-500" />
                <div>
                  <p className="font-medium text-sm">{t.emoji} {t.label}</p>
                  <p className="text-xs text-white/40">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-wider">Longueur</label>
            <div className="flex gap-2">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLength(l.id)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all ${
                    length === l.id
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300 font-semibold"
                      : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:border-white/20"
                  }`}
                >
                  <p>{l.label}</p>
                  <p className="text-xs opacity-60">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!dishName.trim() || loading}
            className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Génération…
              </>
            ) : (
              "✨ Générer 3 descriptions"
            )}
          </button>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">⚠️ {error}</div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-3 space-y-4">
          {results.length === 0 && !loading && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 flex flex-col items-center justify-center gap-3 text-center h-full">
              <span className="text-4xl">✍️</span>
              <p className="text-white/40 text-sm">Les 3 variantes de description apparaîtront ici</p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Nova rédige vos descriptions…</p>
            </div>
          )}

          {results.map((desc, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 hover:border-purple-500/20 transition-all group">
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">Variante {i + 1}</span>
                <button
                  onClick={() => copy(desc, i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white/40 hover:text-white px-3 py-1 rounded-lg bg-white/5 border border-white/10 shrink-0"
                >
                  {copiedIdx === i ? "✅ Copié !" : "📋 Copier"}
                </button>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
