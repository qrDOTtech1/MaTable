"use client";
import { useEffect, useState } from "react";
import { API_URL, api, getProToken, redirectOn401 } from "@/lib/api";
import { chatWithNova } from "@/lib/ai";
import PhotoUploader from "@/components/PhotoUploader";

const ALLERGENS = [
  "GLUTEN","CRUSTACEANS","EGGS","FISH","PEANUTS","SOYBEANS","MILK","NUTS",
  "CELERY","MUSTARD","SESAME","SULPHITES","LUPIN","MOLLUSCS",
] as const;
const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN:"Gluten", CRUSTACEANS:"Crustacés", EGGS:"Oeufs", FISH:"Poisson",
  PEANUTS:"Arachides", SOYBEANS:"Soja", MILK:"Lait", NUTS:"Fruits à coque",
  CELERY:"Céleri", MUSTARD:"Moutarde", SESAME:"Sésame", SULPHITES:"Sulfites",
  LUPIN:"Lupin", MOLLUSCS:"Mollusques",
};
const DIETS = ["VEGETARIAN","VEGAN","GLUTEN_FREE","LACTOSE_FREE","HALAL","KOSHER","SPICY"] as const;
const DIET_LABELS: Record<string, string> = {
  VEGETARIAN:"🌿 Végétarien", VEGAN:"🌱 Vegan", GLUTEN_FREE:"🌾 Sans gluten",
  LACTOSE_FREE:"🥛 Sans lactose", HALAL:"☪️ Halal", KOSHER:"✡️ Casher", SPICY:"🌶️ Épicé",
};

type ModifierOption = { id: string; name: string; priceDeltaCents: number };
type ModifierGroup = { id: string; name: string; required: boolean; multiple: boolean; options: ModifierOption[] };
type Item = {
  id: string; name: string; description?: string | null; priceCents: number;
  category?: string | null; available: boolean; imageUrl?: string | null;
  allergens: string[]; diets: string[];
  stockEnabled: boolean; stockQty?: number | null; lowStockThreshold?: number | null;
  waitMinutes: number;
  modifierGroups: ModifierGroup[];
};

type UploadRes = { id: string; path: string };

const emptyForm = {
  name: "", price: "", category: "", description: "", imageUrl: "",
  allergens: [] as string[], diets: [] as string[],
  stockEnabled: false, stockQty: "", lowStockThreshold: "5",
  waitMinutes: "0",
};

export default function MenuPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: "", required: false, multiple: false, options: "" });
  const [restockMap, setRestockMap] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const magicScan = async (file: File) => {
    setAiAnalyzing(true);
    try {
      // 1. Upload initial
      await uploadImage(file);
      
      // 2. Analyse IA (Simulée pour le moment car nécessite le backend AI endpoint)
      // Dans une version finale, on enverrait l'image à Ollama Cloud Vision
      const messages = [
        { 
          role: "system" as const, 
          content: "Tu es Nova, l'IA experte NovaTech OS. Analyse cette photo de plat et renvoie un JSON avec: name, description (courte et vendeuse), category, priceCents (estimé), allergens (parmi la liste officielle), diets (parmi la liste officielle). Ne parle pas, donne juste le JSON." 
        },
        { role: "user" as const, content: "Analyse ce plat." }
      ];
      
      const res = await chatWithNova("gpt-oss:120b-cloud", messages);
      if (!res || typeof res !== 'object') throw new Error("Réponse IA invalide");
      const content = 'message' in res ? res.message.content : "";
      const data = JSON.parse(content);
      
      setForm((f) => ({
        ...f,
        name: data.name || f.name,
        price: data.priceCents ? (data.priceCents / 100).toFixed(2) : f.price,
        description: data.description || f.description,
        category: data.category || f.category,
        allergens: data.allergens || f.allergens,
        diets: data.diets || f.diets,
      }));
    } catch (err) {
      console.error("[MagicScan]", err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const reload = async () => {
    const r = await api<{ items: Item[] }>("/api/pro/menu");
    setItems(r.items);
  };

  useEffect(() => {
    reload().catch(redirectOn401);
  }, []);

  const toggleAllergen = (a: string) =>
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(a) ? f.allergens.filter((x) => x !== a) : [...f.allergens, a],
    }));
  const toggleDiet = (d: string) =>
    setForm((f) => ({
      ...f,
      diets: f.diets.includes(d) ? f.diets.filter((x) => x !== d) : [...f.diets, d],
    }));

  const openEdit = (it: Item) => {
    setEditId(it.id);
    setForm({
      name: it.name, price: (it.priceCents / 100).toFixed(2),
      category: it.category ?? "", description: it.description ?? "",
      imageUrl: it.imageUrl ?? "", allergens: it.allergens ?? [], diets: it.diets ?? [],
      stockEnabled: it.stockEnabled, stockQty: it.stockQty?.toString() ?? "",
      lowStockThreshold: it.lowStockThreshold?.toString() ?? "5",
      waitMinutes: (it.waitMinutes ?? 0).toString(),
    });
  };

  const cancelEdit = () => { setEditId(null); setForm(emptyForm); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      priceCents: Math.round(parseFloat(form.price) * 100),
      category: form.category || undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      allergens: form.allergens,
      diets: form.diets,
      stockEnabled: form.stockEnabled,
      stockQty: form.stockEnabled && form.stockQty !== "" ? parseInt(form.stockQty) : null,
      lowStockThreshold: form.stockEnabled && form.lowStockThreshold !== "" ? parseInt(form.lowStockThreshold) : null,
      waitMinutes: parseInt(form.waitMinutes) || 0,
    };
    if (editId) {
      await api(`/api/pro/menu/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
      setEditId(null);
    } else {
      await api("/api/pro/menu", { method: "POST", body: JSON.stringify(payload) });
    }
    setForm(emptyForm);
    reload();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const token = getProToken();
      if (!token) throw new Error("unauthorized");

      const fd = new FormData();
      fd.set("file", file);

      const res = await fetch(`${API_URL}/api/pro/uploads/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const json = (await res.json()) as UploadRes;
      const url = `${API_URL}${json.path}`;
      setForm((f) => ({ ...f, imageUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (it: Item) => {
    await api(`/api/pro/menu/${it.id}`, { method: "PATCH", body: JSON.stringify({ available: !it.available }) });
    reload();
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ce plat ?")) return;
    await api(`/api/pro/menu/${id}`, { method: "DELETE" });
    reload();
  };

  const restock = async (id: string) => {
    const delta = parseInt(restockMap[id] || "0");
    if (!delta) return;
    await api(`/api/pro/menu/${id}/restock`, { method: "POST", body: JSON.stringify({ delta }) });
    setRestockMap((m) => ({ ...m, [id]: "" }));
    reload();
  };

  const addModifierGroup = async (itemId: string) => {
    const opts = newGroup.options.split("\n")
      .map((l) => l.trim()).filter(Boolean)
      .map((l) => {
        const parts = l.split("|");
        return { name: parts[0].trim(), priceDeltaCents: parts[1] ? Math.round(parseFloat(parts[1]) * 100) : 0 };
      });
    if (!newGroup.name || opts.length === 0) return;
    await api(`/api/pro/menu/${itemId}/modifiers`, {
      method: "POST",
      body: JSON.stringify({ name: newGroup.name, required: newGroup.required, multiple: newGroup.multiple, options: opts }),
    });
    setNewGroup({ name: "", required: false, multiple: false, options: "" });
    reload();
  };
  const delGroup = async (gid: string) => {
    await api(`/api/pro/menu/modifier-group/${gid}`, { method: "DELETE" });
    reload();
  };

  // All unique categories
  const allCategories = [...new Set(items.map(it => it.category || "Sans catégorie"))].sort();

  // Filter items by search + category
  const filteredItems = items.filter(it => {
    if (catFilter !== "all" && (it.category || "Sans catégorie") !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return it.name.toLowerCase().includes(q) || (it.description || "").toLowerCase().includes(q) || (it.category || "").toLowerCase().includes(q);
    }
    return true;
  });

  const byCat = filteredItems.reduce<Record<string, Item[]>>((acc, it) => {
    const k = it.category || "Sans catégorie";
    (acc[k] ||= []).push(it);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-white">Menu <span className="text-sm font-normal text-white/30">({items.length} plats)</span></h1>

        {/* Search + Category filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Rechercher un plat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-56 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"
          />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">Toutes les categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {(search || catFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setCatFilter("all"); }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Effacer filtres
            </button>
          )}
        </div>
      </div>

      {/* ── Formulaire ajout / édition ── */}
      <form onSubmit={save} className="card mb-6 space-y-3">
        <h2 className="font-semibold text-white">{editId ? "✏️ Modifier le plat" : "➕ Nouveau plat"}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="col-span-2">
            <label className="label">Nom *</label>
            <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Prix (€) *</label>
            <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" type="number" step="0.01"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="col-span-2 md:col-span-3">
            <label className="label">Description</label>
            <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Temps d'attente (min)</label>
            <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" type="number" min="0" max="180" step="1"
              value={form.waitMinutes} onChange={(e) => setForm({ ...form, waitMinutes: e.target.value })}
              placeholder="0 = instantané" title="0 = prêt instantanément, sinon durée en minutes" />
          </div>
        </div>
        <div>
          <label className="label">Photo</label>
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex-1 flex gap-2 items-center">
              <input
                className="w-full text-white text-sm"
                type="file"
                accept="image/*"
                disabled={uploading || aiAnalyzing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (confirm("✨ Utiliser le Magic Scan NovaTech pour remplir automatiquement ce plat ?")) {
                    magicScan(f);
                  } else {
                    uploadImage(f);
                  }
                }}
              />
              {aiAnalyzing && (
                <span className="animate-pulse text-orange-400 text-xs font-bold shrink-0">
                  🪄 Analyse IA...
                </span>
              )}
            </div>
            <input
              className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30"
              placeholder="https://... (optionnel)"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>
          {form.imageUrl && (
            <div className="mt-2">
              <img src={form.imageUrl} alt="preview" className="w-24 h-24 object-cover rounded" />
            </div>
          )}
        </div>

        {/* Allergènes */}
        <div>
          <label className="label">Allergènes (règlement UE)</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {ALLERGENS.map((a) => (
              <button key={a} type="button"
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  form.allergens.includes(a) ? "bg-red-500/20 border-red-500/50 text-red-400 font-semibold" : "border-white/10 text-white/50"
                }`}
                onClick={() => toggleAllergen(a)}
              >{ALLERGEN_LABELS[a]}</button>
            ))}
          </div>
        </div>

        {/* Régimes */}
        <div>
          <label className="label">Régimes</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {DIETS.map((d) => (
              <button key={d} type="button"
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  form.diets.includes(d) ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold" : "border-white/10 text-white/50"
                }`}
                onClick={() => toggleDiet(d)}
              >{DIET_LABELS[d]}</button>
            ))}
          </div>
        </div>

        {/* Stock */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.stockEnabled}
              onChange={(e) => setForm({ ...form, stockEnabled: e.target.checked })} />
            <span className="text-sm font-medium text-white">Gestion du stock</span>
          </label>
          {form.stockEnabled && (
            <>
              <div>
                <label className="label">Quantité</label>
                <input className="w-20 border border-white/10 rounded px-2 py-1 bg-white/5 text-white placeholder-white/30" type="number" min="0"
                  value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              </div>
              <div>
                <label className="label">Alerte si ≤</label>
                <input className="w-16 border border-white/10 rounded px-2 py-1 bg-white/5 text-white placeholder-white/30" type="number" min="0"
                  value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn-primary" type="submit">{editId ? "Enregistrer" : "Ajouter"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={cancelEdit}>Annuler</button>}
        </div>
      </form>

      {/* ── Liste des plats par catégorie ── */}
      {Object.entries(byCat).map(([cat, catItems]) => (
        <div key={cat} className="mb-6">
          <h2 className="text-sm font-bold text-white/30 uppercase tracking-wide mb-2">{cat}</h2>
          <div className="space-y-2">
            {catItems.map((it) => {
              const lowStock = it.stockEnabled && it.stockQty != null && it.lowStockThreshold != null && it.stockQty <= it.lowStockThreshold;
              const outOfStock = it.stockEnabled && it.stockQty != null && it.stockQty === 0;
              return (
                <div key={it.id} className={`card ${!it.available ? "opacity-60" : ""}`}>
                  {/* Ligne principale */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 items-start flex-1 min-w-0">
                      {it.imageUrl && (
                        <img src={it.imageUrl} alt={it.name}
                          className="w-14 h-14 object-cover rounded shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium flex items-center gap-2 flex-wrap text-white">
                          {it.name}
                          {!it.available && <span className="text-xs px-1.5 py-0.5 bg-white/10 text-white/50 rounded">Désactivé</span>}
                          {outOfStock && <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-semibold">Rupture</span>}
                          {lowStock && !outOfStock && <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Stock faible ({it.stockQty})</span>}
                          {it.stockEnabled && !lowStock && it.stockQty != null && (
                            <span className="text-xs text-white/50">📦 {it.stockQty}</span>
                          )}
                          {it.waitMinutes > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">⏱ {it.waitMinutes} min</span>
                          )}
                          {it.waitMinutes === 0 && (
                            <span className="text-xs text-white/30">⚡ Instantané</span>
                          )}
                        </div>
                        {it.description && <div className="text-xs text-white/50 truncate">{it.description}</div>}
                        <div className="text-sm font-semibold mt-0.5 text-white">{(it.priceCents / 100).toFixed(2)} €</div>
                        {/* Badges allergènes */}
                        {it.allergens?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {it.allergens.map((a) => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded border border-red-500/30">
                                ⚠️ {ALLERGEN_LABELS[a] ?? a}
                              </span>
                            ))}
                          </div>
                        )}
                        {it.diets?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {it.diets.map((d) => (
                              <span key={d} className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                                {DIET_LABELS[d] ?? d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button className="btn-ghost text-xs" onClick={() => openEdit(it)}>✏️ Modifier</button>
                      <button className="btn-ghost text-xs" onClick={() => toggle(it)}>
                        {it.available ? "Désactiver" : "Activer"}
                      </button>
                      <button className="btn-ghost text-xs text-red-600" onClick={() => del(it.id)}>Supprimer</button>
                      <button className="btn-ghost text-xs"
                        onClick={() => setExpandedId(expandedId === it.id ? null : it.id)}>
                        {expandedId === it.id ? "▲ Fermer" : "▼ Options"}
                      </button>
                    </div>
                  </div>

                  {/* Panneau expansible : photos + stock + modifiers */}
                  {expandedId === it.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-4">
                      {/* Galerie photos du plat */}
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                        <PhotoUploader menuItemId={it.id} label="Photos du plat" max={8} />
                      </div>

                      {/* Réassort */}
                      {it.stockEnabled && (
                        <div>
                          <p className="text-xs font-semibold text-white/70 mb-1">📦 Réassort</p>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              className="w-20 border border-white/10 rounded px-2 py-1 text-sm bg-white/5 text-white placeholder-white/30"
                              placeholder="Qté"
                              value={restockMap[it.id] ?? ""}
                              onChange={(e) => setRestockMap((m) => ({ ...m, [it.id]: e.target.value }))}
                            />
                            <button className="btn-primary text-xs" onClick={() => restock(it.id)}>
                              Ajouter
                            </button>
                            <span className="text-xs text-white/50">
                              Stock actuel : <strong>{it.stockQty ?? "—"}</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Modifier groups existants */}
                      {it.modifierGroups.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-white/70 mb-1">⚙️ Variantes & options</p>
                          <div className="space-y-1">
                            {it.modifierGroups.map((g) => (
                              <div key={g.id} className="bg-white/5 rounded p-2 text-xs flex items-start justify-between gap-2 border border-white/10">
                                <div>
                                  <span className="font-semibold text-white">{g.name}</span>
                                  {g.required && <span className="ml-1 text-red-400">(obligatoire)</span>}
                                  {g.multiple && <span className="ml-1 text-white/50">(multiple)</span>}
                                  <div className="mt-0.5 text-white/50">
                                    {g.options.map((o) => (
                                      <span key={o.id} className="mr-2">
                                        {o.name}{o.priceDeltaCents !== 0 ? ` +${(o.priceDeltaCents/100).toFixed(2)}€` : ""}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button className="text-red-400/50 hover:text-red-400 shrink-0" onClick={() => delGroup(g.id)}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ajouter un groupe */}
                      <div>
                        <p className="text-xs font-semibold text-white/70 mb-1">➕ Ajouter un groupe d'options</p>
                        <div className="space-y-2">
                          <input className="w-full border border-white/10 rounded px-2 py-1 text-xs bg-white/5 text-white placeholder-white/30"
                            placeholder='Nom du groupe ex: "Cuisson"'
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
                          <textarea
                            className="w-full border border-white/10 rounded px-2 py-1 text-xs font-mono bg-white/5 text-white placeholder-white/30"
                            rows={3}
                            placeholder={"Une option par ligne :\nSaignant\nBacon | 1.50\nDouble steak | 4.00"}
                            value={newGroup.options}
                            onChange={(e) => setNewGroup({ ...newGroup, options: e.target.value })}
                          />
                          <div className="flex gap-4 text-xs">
                            <label className="flex gap-1 items-center cursor-pointer">
                              <input type="checkbox" checked={newGroup.required}
                                onChange={(e) => setNewGroup({ ...newGroup, required: e.target.checked })} />
                              Obligatoire
                            </label>
                            <label className="flex gap-1 items-center cursor-pointer">
                              <input type="checkbox" checked={newGroup.multiple}
                                onChange={(e) => setNewGroup({ ...newGroup, multiple: e.target.checked })} />
                              Choix multiple
                            </label>
                          </div>
                          <button className="btn-primary text-xs" onClick={() => addModifierGroup(it.id)}>
                            Créer le groupe
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
