"use client";
import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { api, apiStream } from "@/lib/api";
import { IaHistoryPanel, type HistoryEntry } from "@/components/ia/IaHistoryPanel";
import { resizeImageToBase64 } from "@/lib/resizeImage";

// ── Messages dynamiques pendant le chargement ─────────────────────────────────
const LOADING_MESSAGES = [
  { icon: "🧑‍🍳", text: "Nova lit votre carte... patience, un bon plat se prépare !" },
  { icon: "🔥", text: "Saviez-vous ? Un chef cuisinier parcourt en moyenne 8 km par service dans sa cuisine." },
  { icon: "📖", text: "Le mot 'restaurant' vient du français 'restaurer' — nourrir le corps et l'esprit." },
  { icon: "🍳", text: "Auguste Escoffier a inventé la brigade de cuisine en 1903. Chaque poste, une mission." },
  { icon: "⏱️", text: "Dans un restaurant étoilé, une assiette est dressée en 47 secondes en moyenne." },
  { icon: "🧈", text: "Le beurre, c'est la vie. Un restaurant français moyen utilise 20 kg de beurre par semaine." },
  { icon: "📋", text: "Nova analyse chaque plat, prix et ingrédient visible sur votre photo..." },
  { icon: "🌍", text: "La France compte plus de 175 000 restaurants. Et chacun a sa carte unique." },
  { icon: "🍷", text: "Un sommelier goûte en moyenne 100 vins par semaine. Dur métier." },
  { icon: "🎯", text: "Le 'coup de feu' en cuisine désigne le rush du service — adrénaline pure." },
  { icon: "👨‍🍳", text: "Paul Bocuse a été élu 'Chef du siècle' par le Gault et Millau en 1989." },
  { icon: "🥘", text: "La mise en place, c'est 80% du travail d'un chef. Le reste, c'est de l'exécution." },
  { icon: "📸", text: "Nova extrait les noms, descriptions et prix de chaque plat visible..." },
  { icon: "🍕", text: "La pizza Margherita a été créée en 1889 en l'honneur de la reine Marguerite d'Italie." },
  { icon: "🧊", text: "Le premier restaurant avec un menu imprimé date de 1765 à Paris." },
  { icon: "🔪", text: "Un couteau de chef japonais est aiguisé à un angle de 15° — une précision chirurgicale." },
  { icon: "🍽️", text: "Encore quelques secondes... Nova prépare un résultat aux petits oignons." },
  { icon: "🌶️", text: "Le piment le plus fort du monde (Carolina Reaper) atteint 2,2 millions d'unités Scoville." },
  { icon: "🥐", text: "Le croissant n'est pas français. Il vient de Vienne, en Autriche. Oui, vraiment." },
  { icon: "💡", text: "Dernière ligne droite... Nova met les plats dans les bonnes catégories." },
];

function useLoadingMessages(isLoading: boolean) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) { setMsgIdx(0); setElapsed(0); return; }
    // Rotate messages every 6 seconds
    const msgTimer = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 6000);
    // Tick elapsed every second
    const tickTimer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(msgTimer); clearInterval(tickTimer); };
  }, [isLoading]);

  return { msg: LOADING_MESSAGES[msgIdx], elapsed };
}

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

type ImageEntry = { file: File; name: string; preview: string };

const MAX_IMAGES = 5;

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

// ── Composant principal ───────────────────────────────────────────────────────
export default function NovaMenuGeneratorPage() {
  // Main Tab
  const [mainTab, setMainTab] = useState<"CREATE" | "IMPROVE">("CREATE");

  // Mode: "generate" = créer de zéro | "import" = importer photo
  const [mode, setMode] = useState<"generate" | "import">("generate");

  // Paramètres génération
  const [cuisineType, setCuisineType] = useState("");
  const [priceRange, setPriceRange]   = useState<"budget" | "mid" | "premium" | "gastronomique">("mid");
  const [itemCount, setItemCount]     = useState(12);
  const [style, setStyle]             = useState("");

  // Photo import — jusqu'à 5 images
  const [images, setImages]         = useState<ImageEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const cameraInputRef              = useRef<HTMLInputElement>(null);

  // Résultats
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState<{ current: number; total: number } | null>(null);
  const { msg: loadingMsg, elapsed: loadingElapsed } = useLoadingMessages(loading);
  const [items, setItems]           = useState<MenuItem[]>([]);
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [applying, setApplying]     = useState(false);
  const [applied, setApplied]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [genMode, setGenMode]       = useState<"generate" | "photo-import">("generate");
  const [historyKey, setHistoryKey] = useState(0);

  const onRestoreHistory = (entry: HistoryEntry) => {
    const list = entry.outputData?.menu?.items as MenuItem[] | undefined;
    if (list?.length) {
      setItems(list);
      setSelected(new Set(list.map((_, i) => i)));
      setGenMode(entry.outputData?.meta?.mode === "photo-import" ? "photo-import" : "generate");
      setApplied(false);
    }
  };

  // Paste d'image depuis le presse-papiers
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      const clipItems = e.clipboardData?.items;
      if (!clipItems) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(clipItems)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        await addFiles(imageFiles);
        setMode("import");
      }
    };
    window.addEventListener("paste", handler as any);
    return () => window.removeEventListener("paste", handler as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const addFiles = async (files: FileList | File[]) => {
    setError(null);
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) { setError("Veuillez importer des images (JPG, PNG, WebP)."); return; }
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError(`Maximum ${MAX_IMAGES} images. Supprimez-en une pour en ajouter une autre.`); return; }
    const toAdd = arr.slice(0, remaining);
    const entries: ImageEntry[] = toAdd.map(f => ({
      file: f,
      name: f.name,
      preview: URL.createObjectURL(f),
    }));
    setImages(prev => [...prev, ...entries]);
    if (mode !== "import") setMode("import");
  };

  const removeImage  = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));
  const clearAllImages = () => { setImages([]); };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; };
  const onDragOver   = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave  = () => setIsDragging(false);
  const onDrop       = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); };

  // ── Helper: try SSE stream, fallback to normal POST if stream fails ───────
  const generateOne = async (
    payload: Record<string, unknown>,
  ): Promise<MenuItem[]> => {
    // Try SSE stream first
    try {
      console.log("[menu-gen] trying SSE stream...");
      const stream = await apiStream("/api/pro/ia/menu-generate/stream", payload);

      let result: MenuItem[] = [];
      for await (const event of stream) {
        if (event.type === "progress") {
          // keep-alive
        } else if (event.type === "chunk") {
          // streaming chunk
        } else if (event.type === "result") {
          result = (event.menu as any)?.items ?? [];
        } else if (event.type === "error") {
          throw new Error((event.message as string) || "Erreur IA");
        }
      }
      console.log(`[menu-gen] SSE stream success — ${result.length} items`);
      return result;
    } catch (streamErr: any) {
      console.warn("[menu-gen] SSE stream failed, falling back to normal POST:", streamErr.message);
    }

    // Fallback: normal POST (old method that worked)
    console.log("[menu-gen] using fallback POST /ia/menu-generate...");
    const r = await api<any>("/api/pro/ia/menu-generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return r?.menu?.items ?? r?.items ?? [];
  };

  // ── Génération ──────────────────────────────────────────────────────────────
  const generate = async () => {
    if (mode === "generate" && !cuisineType.trim()) return;
    if (mode === "import" && images.length === 0) return;

    setLoading(true); setError(null); setItems([]); setSelected(new Set()); setApplied(false); setProgress(null);
    setGenMode(mode === "import" ? "photo-import" : "generate");

    try {
      if (mode === "import") {
        // ── Traitement séquentiel de chaque image via SSE stream ────────────
        const total = images.length;
        const allItems: MenuItem[] = [];

        for (let i = 0; i < total; i++) {
          setProgress({ current: i + 1, total });
          const img = images[i];
          // Resize + compress to max 1536px JPEG 0.85 before sending
          const base64 = await resizeImageToBase64(img.file);
          console.log(`[menu-gen] image ${i + 1}/${total} — base64 length=${base64.length}`);

          const parsed = await generateOne({
            cuisineType: cuisineType || undefined,
            priceRange,
            itemCount,
            style:       style || undefined,
            imageBase64: base64,
          });

          console.log(`[menu-gen] image ${i + 1} → ${parsed.length} items`);
          allItems.push(...parsed);
        }

        // Déduplique par nom (insensible à la casse)
        const seen = new Set<string>();
        const deduped = allItems.filter(it => {
          const key = it.name.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        console.log(`[menu-gen] total items after dedup: ${deduped.length}`);
        setItems(deduped);
        setSelected(new Set(deduped.map((_, i) => i)));
        setHistoryKey(k => k + 1);
      } else {
        // ── Génération classique via SSE stream ────────────────────────────
        const parsed = await generateOne({
          cuisineType: cuisineType || undefined,
          priceRange,
          itemCount,
          style: style || undefined,
        });

        console.log(`[menu-gen] generated ${parsed.length} items`);
        setItems(parsed);
        setSelected(new Set(parsed.map((_, i) => i)));
        setHistoryKey(k => k + 1);
      }
    } catch (e: any) {
      console.error("[menu-gen] ERROR:", e);
      const msg = e?.message || String(e);
      if (msg.includes("403")) setError("Abonnement PRO_IA requis.");
      else if (msg.includes("503")) setError("Clé API IA non configurée. Contactez l'admin.");
      else if (msg.includes("502")) setError("L'IA n'a pas pu parser le menu de l'image. Réessayez ou utilisez une photo plus nette.");
      else if (msg.includes("504") || msg.includes("expiré") || msg.includes("timeout")) setError("Timeout — l'IA met trop de temps. Essayez avec une seule image.");
      else if (msg.includes("400")) setError("Ajoutez un type de cuisine ou une photo du menu.");
      else if (msg.includes("Failed to fetch") || msg.includes("fetch")) setError("Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez.");
      else setError("Erreur : " + msg);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const toggleItem = (i: number) => setSelected(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const selectAll  = () => setSelected(new Set(items.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

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

  const [improving, setImproving] = useState(false);
  const [improveProgress, setImproveProgress] = useState<string | null>(null);
  const [improvedCount, setImprovedCount] = useState(0);
  const [improvedItems, setImprovedItems] = useState<Array<any>>([]);
  const [newBeverageSuggestions, setNewBeverageSuggestions] = useState<string[]>([]);
  const [addingBeverages, setAddingBeverages] = useState(false);

  const improvePairings = async () => {
    setImproving(true); setError(null); setImproveProgress("Connexion à Nova Sommelier..."); 
    setImprovedCount(0); setImprovedItems([]); setNewBeverageSuggestions([]);
    try {
      const stream = await apiStream("/api/pro/ia/menu-improve-pairings", {});
      for await (const event of stream) {
        if (event.type === "progress") {
          setImproveProgress("Nova analyse vos plats et recherche les meilleurs accords...");
        } else if (event.type === "result") {
          setImprovedCount(Number(event.updatedCount) || 0);
          setImprovedItems(event.improvements as any[] || []);
          setNewBeverageSuggestions(event.newBeverageSuggestions as string[] || []);
          setHistoryKey(k => k + 1);
        } else if (event.type === "error") {
          throw new Error((event.message as string) || "Erreur IA");
        }
      }
    } catch (e: any) {
      if (e.message?.includes("403")) setError("Abonnement PRO_IA requis.");
      else setError("Erreur lors de l'analyse : " + e.message);
    } finally {
      setImproving(false);
      setImproveProgress(null);
    }
  };

  const addNewBeverages = async (bevs: string[]) => {
    if (!bevs.length) return;
    setAddingBeverages(true);
    try {
      const itemsToCreate = bevs.map(b => ({
        name: b,
        priceCents: 0,
        category: "Boissons à ajouter",
        available: false, // Default to out of stock
        waitMinutes: 0
      }));
      await api("/api/pro/ia/menu-generate/apply", { method: "POST", body: JSON.stringify({ items: itemsToCreate }) });
      setNewBeverageSuggestions(prev => prev.filter(b => !bevs.includes(b)));
      alert(`${bevs.length} boisson(s) ajoutée(s) au menu (en rupture de stock). N'oubliez pas de les ajouter à votre liste de courses !`);
    } catch (e: any) {
      setError("Erreur lors de l'ajout des boissons : " + e.message);
    } finally {
      setAddingBeverages(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🍽️</span> Nova Menu IA
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Générez un menu, importez une photo, ou améliorez votre carte existante avec Nova Sommelier.
          </p>
        </div>
        <IaHistoryPanel type="MENU" onRestore={onRestoreHistory} refreshKey={historyKey} />
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white/[0.03] border border-white/[0.08] p-1 rounded-2xl w-fit">
        <button
          onClick={() => setMainTab("CREATE")}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mainTab === "CREATE" ? "bg-orange-500 text-white shadow-lg" : "text-white/50 hover:text-white"}`}
        >
          Créer un Menu
        </button>
        <button
          onClick={() => setMainTab("IMPROVE")}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mainTab === "IMPROVE" ? "bg-purple-500 text-white shadow-lg" : "text-white/50 hover:text-white"}`}
        >
          <span>✨</span> Accords & Up-Selling
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {mainTab === "IMPROVE" ? (
        <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 rounded-2xl p-8 space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-purple-300 flex items-center gap-2 mb-2">
              <span>✨</span> Nova Sommelier
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-3xl">
              Laissez l'intelligence artificielle analyser tous les plats de votre carte actuelle. Pour chaque plat, Nova trouvera le meilleur accord (vin, bière, boisson) et suggèrera des produits croisés (up-selling) parmi ce qui existe déjà dans votre menu.
            </p>
            <p className="text-xs text-purple-300 mt-3 font-semibold bg-purple-500/10 inline-block px-3 py-1.5 rounded-lg border border-purple-500/20">
              Note : Ces suggestions apparaîtront automatiquement sur le QR code de vos clients lorsqu'ils commanderont pour augmenter le ticket moyen.
            </p>
          </div>

          <div className="pt-4 border-t border-purple-500/20">
            {improving ? (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 text-center">
                <div className="w-8 h-8 mx-auto border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-purple-300">{improveProgress}</p>
                <p className="text-xs text-white/40 mt-2">Cela peut prendre 1 à 2 minutes selon la taille de votre menu.</p>
              </div>
            ) : improvedCount > 0 ? (
              <div className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-1">Analyse terminée !</h3>
                  <p className="text-sm text-white/60">
                    <strong className="text-emerald-400">{improvedCount} plats</strong> ont été mis à jour avec de nouveaux accords et suggestions d'up-selling.
                  </p>
                  <div className="mt-4 flex justify-center gap-4">
                    <button onClick={() => setImprovedCount(0)} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white rounded-lg text-sm transition-colors border border-white/10">
                      Faire une nouvelle analyse
                    </button>
                    <a href="/dashboard/menu" className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold rounded-lg text-sm transition-colors border border-emerald-500/30">
                      Voir mon menu
                    </a>
                  </div>
                </div>

                {newBeverageSuggestions.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 animate-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                      <span>💡</span> Nouvelles boissons suggérées par l'IA
                    </h3>
                    <p className="text-xs text-white/60 mb-4">
                      Nova a remarqué que ces boissons manquent à votre carte pour proposer des accords parfaits avec vos plats existants. Voulez-vous les ajouter à votre menu (en rupture de stock pour que vous puissiez les commander) ?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {newBeverageSuggestions.map((bev, i) => (
                        <div key={i} className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white/80 truncate">
                          {bev}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => addNewBeverages(newBeverageSuggestions)}
                        disabled={addingBeverages}
                        className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {addingBeverages ? "Ajout..." : `+ Ajouter ces ${newBeverageSuggestions.length} boissons à ma carte`}
                      </button>
                      <a href="/dashboard/shopping" className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-semibold rounded-lg text-sm transition-colors">
                        Aller aux listes de courses →
                      </a>
                    </div>
                  </div>
                )}

                {improvedItems.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">Détail des plats mis à jour</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {improvedItems.map((item, i) => (
                        <div key={i} className="bg-black/40 border border-white/[0.06] rounded-xl p-4">
                          <p className="font-bold text-white mb-2">{item.dishName || `Plat #${item.menuItemId}`}</p>
                          <div className="space-y-2">
                            {item.suggestedPairings?.length > 0 && (
                              <div>
                                <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Accords (Textes)</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.suggestedPairings.map((p: string, idx: number) => (
                                    <span key={idx} className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20">{p}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.upsellItemIds?.length > 0 && (
                              <div>
                                <p className="text-[10px] text-orange-400 font-bold uppercase mb-1">Up-selling (Plats liés)</p>
                                <p className="text-xs text-white/50">{item.upsellItemIds.length} produit(s) de la carte lié(s)</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={improvePairings}
                className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <span>✨</span> Lancer l'analyse du menu
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          {/* Sélecteur de mode CREATE */}
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
          <p className="text-xs text-white/40 mt-1">
            Photographiez votre carte papier, ardoise ou menu PDF — jusqu'à 5 photos
          </p>
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
              ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Nova IA travaille, regardez ci-dessous...</>
              : "✨ Générer le menu avec Nova IA"}
          </button>
        </div>
      )}

      {/* ── Mode Import Photo ─────────────────────────────────────────────────── */}
      {mode === "import" && (
        <div className="space-y-4">

          {/* Zone de drop (toujours visible, plus compacte si images présentes) */}
          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed transition-all ${
              images.length === 0 ? "p-12 text-center" : "p-5"
            } ${isDragging ? "border-blue-400/60 bg-blue-500/10" : "border-white/20 bg-white/[0.02]"}`}
          >
            {images.length === 0 ? (
              /* ── Aucune image — affichage complet ── */
              <>
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-xl font-bold text-white mb-2">Importez votre carte actuelle</h2>
                <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">
                  Photographiez votre carte papier, menu ardoise, ou convertissez votre PDF en image.
                  Nova IA extrait automatiquement tous les plats visibles. Jusqu'à <strong className="text-white/60">5 photos</strong> par analyse.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <label className="cursor-pointer flex flex-col items-center gap-2 px-6 py-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-2xl transition-colors">
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
                    <span className="text-3xl">📷</span>
                    <span className="text-sm font-bold">Prendre une photo</span>
                    <span className="text-xs opacity-60">Appareil photo</span>
                  </label>
                  <label className="cursor-pointer flex flex-col items-center gap-2 px-6 py-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.12] text-white/70 rounded-2xl transition-colors">
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                    <span className="text-3xl">🖼️</span>
                    <span className="text-sm font-bold">Importer des images</span>
                    <span className="text-xs opacity-50">JPG, PNG, WebP · jusqu'à {MAX_IMAGES}</span>
                  </label>
                </div>
                <p className="text-xs text-white/20 mt-6">
                  Glissez-déposez ici · ou collez avec Ctrl+V
                </p>
              </>
            ) : (
              /* ── Images sélectionnées — grille compacte ── */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/60">
                    {images.length} photo{images.length > 1 ? "s" : ""} sélectionnée{images.length > 1 ? "s" : ""}
                    {images.length < MAX_IMAGES && <span className="text-white/30 ml-1">(max {MAX_IMAGES})</span>}
                  </p>
                  <div className="flex gap-2">
                    {images.length < MAX_IMAGES && (
                      <label className="cursor-pointer text-xs px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-colors">
                        <input type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                        + Ajouter
                      </label>
                    )}
                    <button onClick={clearAllImages} className="text-xs px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/40 rounded-lg transition-colors">
                      Tout supprimer
                    </button>
                  </div>
                </div>

                {/* Grille thumbnails */}
                <div className="flex flex-wrap gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
                      <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                      {/* Badge numéro */}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {idx + 1}
                      </div>
                      {/* Bouton suppression */}
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      {/* Tooltip nom */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3">
                        <p className="text-[9px] text-white/60 truncate leading-tight">{img.name}</p>
                      </div>
                    </div>
                  ))}
                  {/* Slot "ajouter" si place restante */}
                  {images.length < MAX_IMAGES && (
                    <label className="cursor-pointer w-24 h-24 rounded-xl border-2 border-dashed border-white/20 hover:border-blue-400/40 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-1 shrink-0 transition-all">
                      <input type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                      <span className="text-xl text-white/30">+</span>
                      <span className="text-[9px] text-white/30">Ajouter</span>
                    </label>
                  )}
                </div>

                {/* Options supplémentaires */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 mb-1">Type de cuisine <span className="text-white/20">(optionnel)</span></label>
                    <input
                      value={cuisineType}
                      onChange={e => setCuisineType(e.target.value)}
                      placeholder="Aide Nova à contextualiser..."
                      className="w-full bg-black/20 border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/40 mb-1">Gamme de prix</label>
                    <select value={priceRange} onChange={e => setPriceRange(e.target.value as any)}
                      className="w-full bg-black/20 border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50">
                      {PRICE_RANGES.map(p => <option key={p.id} value={p.id}>{p.label} ({p.range})</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
                  <p className="text-xs text-blue-400/80 font-medium mb-1">
                    🤖 Nova va analyser {images.length} photo{images.length > 1 ? "s" : ""} en {images.length} requête{images.length > 1 ? "s" : ""} séparée{images.length > 1 ? "s" : ""} :
                  </p>
                  <ul className="text-xs text-white/40 space-y-0.5">
                    <li>• Lire les noms de plats sur chaque photo</li>
                    <li>• Récupérer les prix visibles</li>
                    <li>• Écrire des descriptions vendeuses</li>
                    <li>• Fusionner et dédupliquer les résultats</li>
                  </ul>
                </div>

                {/* Bouton analyser */}
                <button onClick={generate} disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Nova analyse vos photos, regardez ci-dessous...
                    </>
                  ) : (
                    `📸 Analyser ${images.length} photo${images.length > 1 ? "s" : ""} et importer ma carte`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Barre de chargement dynamique ──────────────────────────────────── */}
      {loading && (
        <div className="bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-orange-500/5 border border-white/[0.08] rounded-2xl p-6 space-y-4">
          {/* Barre de progression animée */}
          <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-orange-500 rounded-full animate-loading-bar" />
          </div>

          {/* Temps écoulé + indicateur */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs text-white/50 font-mono">
                {Math.floor(loadingElapsed / 60)}:{String(loadingElapsed % 60).padStart(2, "0")}
              </span>
              {progress && (
                <span className="text-xs text-blue-400 font-semibold">
                  Photo {progress.current}/{progress.total}
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/30">
              Ne fermez pas cette page
            </span>
          </div>

          {/* Message dynamique */}
          <div className="flex items-start gap-3 min-h-[48px]" key={loadingMsg.text}>
            <span className="text-2xl shrink-0 animate-bounce-slow">{loadingMsg.icon}</span>
            <p className="text-sm text-white/60 leading-relaxed animate-fade-in">{loadingMsg.text}</p>
          </div>

          {/* Barre de phases */}
          <div className="grid grid-cols-4 gap-1.5">
            {["Compression image", "Envoi au serveur", "Analyse IA vision", "Extraction des plats"].map((phase, i) => {
              const phaseActive = loadingElapsed >= i * 15;
              const phaseDone = loadingElapsed >= (i + 1) * 15;
              return (
                <div key={phase} className={`text-center py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-500 ${
                  phaseDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : phaseActive ? "bg-blue-500/15 text-blue-400 border border-blue-500/25 animate-pulse"
                  : "bg-white/[0.03] text-white/25 border border-white/[0.05]"
                }`}>
                  {phaseDone ? "✓ " : phaseActive ? "⏳ " : ""}{phase}
                </div>
              );
            })}
          </div>
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
              <button onClick={selectAll}  className="text-xs px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white/80 rounded-lg">Tout sélectionner</button>
              <button onClick={selectNone} className="text-xs px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white/80 rounded-lg">Tout désélectionner</button>
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
                onClick={() => { setItems([]); setApplied(false); clearAllImages(); setMode("generate"); }}
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
          <div className="text-5xl mb-3">🍽️</div>
          <p className="text-sm">Configurez le générateur ou importez vos photos pour commencer.</p>
        </div>
      )}
      
      {/* End of CREATE block */}
      </div>
      )}
    </div>
  );
}
