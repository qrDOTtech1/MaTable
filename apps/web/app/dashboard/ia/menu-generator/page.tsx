"use client";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type MenuItem = {
  name: string;
  description?: string;
  priceCents: number;
  category?: string;
  allergens?: string[];
  diets?: string[];
  waitMinutes?: number;
};

const PRICE_RANGES = [
  { id: "budget",        label: "Budget",        range: "5–12€" },
  { id: "mid",           label: "Moyen",         range: "12–22€" },
  { id: "premium",       label: "Premium",       range: "22–45€" },
  { id: "gastronomique", label: "Gastronomique", range: "35–80€" },
] as const;

const CUISINE_PRESETS = [
  "Français traditionnel", "Bistrot parisien", "Italien", "Japonais / Sushi",
  "Libanais / Méditerranéen", "Burger gourmet", "Pizzeria", "Thaïlandais",
  "Mexicain", "Indien", "Brasserie", "Crêperie bretonne", "Fruits de mer",
  "Végétarien / Vegan", "Street food fusion",
];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function NovaMenuGeneratorPage() {
  // Mode: "generate" = créer de zéro | "import" = importer photo
  const [mode, setMode] = useState<"generate" | "import">("generate");

  // Paramètres génération
  const [cuisineType, setCuisineType] = useState("");
  const [priceRange, setPriceRange]   = useState<"budget" | "mid" | "premium" | "gastronomique">("mid");
  const [itemCount, setItemCount]     = useState(12);
  const [style, setStyle]             = useState("");

  // Photo import
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName]     = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const cameraInputRef                = useRef<HTMLInputElement>(null);

  // Résultats
  const [loading, setLoading]   = useState(false);
  const [items, setItems]       = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [applied, setApplied]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [genMode, setGenMode]   = useState<"generate" | "photo-import">("generate");

  const isPhotoMode = mode === "import" && !!imageBase64;

  // Paste d'image depuis le presse-papiers
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const base64 = await fileToBase64(file);
            setImageBase64(base64);
            setImageName("image collée");
            setMode("import");
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handler as any);
    return () => window.removeEventListener("paste", handler as any);
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Veuillez importer une image."); return; }
    setError(null);
    const base64 = await fileToBase64(file);
    setImageBase64(base64);
    setImageName(file.name);
  };

  const onFileChange  = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };
  const onDragOver    = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave   = () => setIsDragging(false);
  const onDrop        = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => { setImageBase64(null); setImageName(null); };

  const generate = async () => {
    if (mode === "generate" && !cuisineType.trim()) return;
    if (mode === "import" && !imageBase64) return;
    setLoading(true); setError(null); setItems([]); setSelected(new Set()); setApplied(false);
    setGenMode(mode === "import" ? "photo-import" : "generate");
    try {
      const r = await api<{ menu: { items: MenuItem[] }; meta: any }>("/api/pro/ia/menu-generate", {
        method: "POST",
        body: JSON.stringify({
          cuisineType: cuisineType || undefined,
          priceRange,
          itemCount,
          style:       style || undefined,
          imageBase64: mode === "import" ? imageBase64 : undefined,
        }),
      });
      setItems(r.menu.items);
      setSelected(new Set(r.menu.items.map((_, i) => i)));
    } catch (e: any) {
      if (e.message?.includes("403")) setError("Abonnement PRO_IA requis.");
      else if (e.message?.includes("503")) setError("Clé API IA non configurée. Contactez l'admin.");
      else if (e.message?.includes("400")) setError("Ajoutez un type de cuisine ou une photo du menu.");
      else setError("Erreur : " + e.message);
    } finally { setLoading(false); }
  };

  const toggleItem  = (i: number) => setSelected(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const selectAll   = () => setSelected(new Set(items.map((_, i) => i)));
  const selectNone  = () => setSelected(new Set());

  const applyMenu = async () => {
    const toApply = items.filter((_, i) => selected.has(i));
    if (!toApply.length) return;
    setApplying(true);
    try {
      await api("/api/pro/ia/menu-generate/apply", { method: "POST", body: JSON.stringify({ items: toApply }) });
      setApplied(true);
    } catch (e: any) { setError("Erreur lors de l'ajout : " + e.message); }
    finally { setApplying(false); }
  };

  return (
    <div className="p-8 max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">🍽️</span> Nova Menu IA
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Générez un menu complet de zéro ou importez votre carte existante depuis une photo.
        </p>
      </div>

      {/* Sélecteur de mode */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode("generate")}
          className={`rounded-2xl border p-5 text-left transition-all ${
            mode === "generate"
              ? "border-orange-500/40 bg-orange-500/10"
              : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
          }`}
        >
          <div className="text-3xl mb-2">✨</div>
          <h2 className={`font-bold text-sm ${mode === "generate" ? "text-orange-400" : "text-white"}`}>
            Générer un menu
          </h2>
          <p className="text-xs text-white/40 mt-1">L'IA crée une carte complète à partir de votre style de cuisine</p>
        </button>

        <button
          onClick={() => setMode("import")}
          className={`rounded-2xl border p-5 text-left transition-all ${
            mode === "import"
              ? "border-blue-500/40 bg-blue-500/10"
              : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
          }`}
        >
          <div className="text-3xl mb-2">📸</div>
          <h2 className={`font-bold text-sm ${mode === "import" ? "text-blue-400" : "text-white"}`}>
            Importer ma carte existante
          </h2>
          <p className="text-xs text-white/40 mt-1">Photographiez votre carte papier, ardoise ou menu PDF — l'IA extrait tout</p>
        </button>
      </div>

      {/* ── Mode Génération ───────────────────────────────────────────────────── */}
      {mode === "generate" && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">

          {/* Type de cuisine */}
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-3">Type de cuisine</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {CUISINE_PRESETS.map(c => (
                <button key={c} type="button" onClick={() => setCuisineType(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    cuisineType === c
                      ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                      : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
            <input
              value={cuisineType}
              onChange={e => setCuisineType(e.target.value)}
              placeholder="Ou décrivez votre propre cuisine..."
              className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Gamme + Quantité + Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2">Gamme de prix</label>
              <div className="space-y-2">
                {PRICE_RANGES.map(p => (
                  <button key={p.id} type="button" onClick={() => setPriceRange(p.id as any)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${
                      priceRange === p.id
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                        : "border-white/[0.07] bg-white/[0.02] text-white/60 hover:text-white/80"
                    }`}>
                    <span className="font-medium">{p.label}</span>
                    <span className="text-xs opacity-60">{p.range}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2">Nombre de plats</label>
              <div className="flex items-center gap-3">
                <input type="range" min={3} max={50} value={itemCount} onChange={e => setItemCount(+e.target.value)}
                  className="flex-1 accent-orange-500" />
                <span className="text-orange-400 font-bold w-8 text-center">{itemCount}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-3">
                {[6, 12, 20, 35].map(n => (
                  <button key={n} type="button" onClick={() => setItemCount(n)}
                    className={`text-xs py-1.5 rounded-lg border transition-all ${
                      itemCount === n ? "border-orange-500/40 text-orange-400 bg-orange-500/10" : "border-white/[0.07] text-white/40 hover:text-white/60"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2">Notes / particularités</label>
              <textarea
                value={style}
                onChange={e => setStyle(e.target.value)}
                rows={5}
                placeholder={"Ex:\n- Produits locaux uniquement\n- Sans porc\n- Spécialités de saison\n- 2 plats végétariens minimum"}
                className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50 resize-none"
              />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !cuisineType.trim()}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold rounded-xl transition-colors text-base flex items-center justify-center gap-3"
          >
            {loading
              ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération en cours (20–30s)...</>
              : "✨ Générer le menu avec Nova IA"}
          </button>
        </div>
      )}

      {/* ── Mode Import Photo ─────────────────────────────────────────────────── */}
      {mode === "import" && (
        <div className="space-y-4">
          {!imageBase64 ? (
            // Zone de drop
            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed transition-all p-12 text-center ${
                isDragging ? "border-blue-400/60 bg-blue-500/10" : "border-white/20 bg-white/[0.02]"
              }`}
            >
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-white mb-2">Importez votre carte actuelle</h2>
              <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
                Photographiez votre carte papier, menu ardoise, ou convertissez votre PDF en image.
                Nova IA extrait automatiquement tous les plats visibles.
              </p>

              {/* Boutons d'import */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {/* Prise de photo directe (mobile) */}
                <label className="cursor-pointer flex flex-col items-center gap-2 px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-2xl transition-colors">
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-bold">Prendre une photo</span>
                  <span className="text-xs opacity-60">Appareil photo</span>
                </label>

                {/* Import depuis bibliothèque/ordinateur */}
                <label className="cursor-pointer flex flex-col items-center gap-2 px-6 py-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.12] text-white/70 rounded-2xl transition-colors">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-bold">Importer une image</span>
                  <span className="text-xs opacity-50">JPG, PNG, WebP</span>
                </label>
              </div>

              <p className="text-xs text-white/20 mt-6">
                Glissez-déposez une image ici · ou collez avec Ctrl+V
              </p>
            </div>
          ) : (
            // Prévisualisation image
            <div className="bg-white/[0.03] border border-blue-500/20 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📸</span>
                  <div>
                    <p className="text-sm font-bold text-white">{imageName || "Image importée"}</p>
                    <p className="text-xs text-white/40">Nova IA va analyser et extraire tous les plats visibles</p>
                  </div>
                </div>
                <button onClick={clearImage} className="text-xs px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white/60 rounded-lg transition-colors">
                  ✕ Changer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0">
                <img src={imageBase64} alt="Aperçu menu" className="w-full max-h-80 object-contain bg-black/30 p-4" />
                <div className="p-5 border-t md:border-t-0 md:border-l border-white/[0.07] space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-2">Type de cuisine <span className="text-white/30">(optionnel)</span></label>
                    <input
                      value={cuisineType}
                      onChange={e => setCuisineType(e.target.value)}
                      placeholder="Aide Nova à contextualiser..."
                      className="w-full bg-black/20 border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-2">Gamme de prix</label>
                    <select value={priceRange} onChange={e => setPriceRange(e.target.value as any)}
                      className="w-full bg-black/20 border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50">
                      {PRICE_RANGES.map(p => <option key={p.id} value={p.id}>{p.label} ({p.range})</option>)}
                    </select>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
                    <p className="text-xs text-blue-400/80 font-medium">Ce que Nova va faire :</p>
                    <ul className="text-xs text-white/40 mt-1.5 space-y-1">
                      <li>• Lire les noms de plats sur la photo</li>
                      <li>• Récupérer les prix visibles</li>
                      <li>• Écrire des descriptions vendeuses</li>
                      <li>• Détecter les allergènes probables</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-white/[0.07]">
                <button onClick={generate} disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Extraction en cours (20–40s)...</>
                    : "📸 Importer et améliorer ma carte"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* ── Résultats ─────────────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {genMode === "photo-import" ? "📸" : "✨"}
                {items.length} plats {genMode === "photo-import" ? "extraits de la photo" : "générés par Nova IA"}
              </h2>
              <p className="text-xs text-white/40 mt-1">
                Sélectionnez les plats à ajouter à votre menu MaTable.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={selectAll}   className="text-xs px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white/80 rounded-lg">Tout sélectionner</button>
              <button onClick={selectNone}  className="text-xs px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white/80 rounded-lg">Tout désélectionner</button>
            </div>
          </div>

          {/* Plats groupés par catégorie */}
          {(() => {
            const cats: Record<string, (MenuItem & { idx: number })[]> = {};
            items.forEach((item, idx) => { const c = item.category || "Autres"; (cats[c] ||= []).push({ ...item, idx }); });
            return Object.entries(cats).map(([cat, catItems]) => (
              <div key={cat}>
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-2 flex items-center gap-3">
                  <span className="flex-1 h-px bg-orange-500/20" /> {cat} <span className="flex-1 h-px bg-orange-500/20" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {catItems.map(item => {
                    const isSel = selected.has(item.idx);
                    return (
                      <div key={item.idx} onClick={() => toggleItem(item.idx)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          isSel ? "bg-orange-500/5 border-orange-500/30" : "bg-white/[0.02] border-white/[0.05] opacity-50"
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSel ? "bg-orange-500 border-orange-500" : "border-white/20"
                          }`}>
                            {isSel && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-white text-sm">{item.name}</h4>
                              <span className="font-black text-orange-400 text-sm shrink-0">{(item.priceCents / 100).toFixed(2)}€</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(item.waitMinutes ?? 0) > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">⏱ {item.waitMinutes}min</span>
                              )}
                              {item.allergens?.map(a => (
                                <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">{a}</span>
                              ))}
                              {item.diets?.map(d => (
                                <span key={d} className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">{d}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          {/* Bouton appliquer */}
          {!applied ? (
            <div className="sticky bottom-4">
              <button
                onClick={applyMenu}
                disabled={applying || selected.size === 0}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black rounded-2xl transition-colors text-base flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20"
              >
                {applying
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ajout en cours...</>
                  : <>✅ Ajouter {selected.size} plat{selected.size > 1 ? "s" : ""} à mon menu MaTable</>}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-emerald-400">{selected.size} plats ajoutés au menu !</h3>
              <p className="text-sm text-white/40 mt-1">Retrouvez-les dans l'onglet Menu pour les personnaliser.</p>
              <button
                onClick={() => { setItems([]); setApplied(false); setImageBase64(null); }}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white/60 rounded-xl text-sm transition-colors"
              >
                Importer d'autres plats
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!items.length && !loading && !error && (
        <div className="text-center py-16 text-white/30">
          <div className="text-5xl mb-3">{mode === "import" ? "📸" : "✨"}</div>
          <p className="text-sm">
            {mode === "import"
              ? "Importez une photo de votre carte pour commencer"
              : "Choisissez un type de cuisine et générez votre menu"}
          </p>
        </div>
      )}
    </div>
  );
}
