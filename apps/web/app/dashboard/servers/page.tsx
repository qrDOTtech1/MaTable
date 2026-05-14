"use client";
import { useEffect, useState } from "react";
import { api, apiUpload, API_URL, redirectOn401 } from "@/lib/api";
import QRCode from "qrcode";

type Server = {
  id: string;
  name: string;
  photoUrl?: string | null;
  active: boolean;
  pin?: string | null;
  avgRating?: number | null;
  reviewsCount: number;
};

type ServerSchedule = {
  id?: string;
  dayOfWeek: number;
  openMin: number;
  closeMin: number;
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]; // index = dayOfWeek (0=Sun)
const DAYS_ORDERED = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAY_INDEX: Record<string, number> = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };
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
  const [editingPin, setEditingPin] = useState<string>("");
  const [pinSaving, setPinSaving] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [nfcQrCodes, setNfcQrCodes] = useState<Record<string, string>>({});
  const [nfcWriting, setNfcWriting] = useState<string | null>(null);
  const [nfcWritten, setNfcWritten] = useState<string | null>(null);
  const [serverUniqueQr, setServerUniqueQr] = useState<boolean>(true);
  const [uniqueQrSaving, setUniqueQrSaving] = useState(false);
  const [restaurantQrCode, setRestaurantQrCode] = useState<string | null>(null);

  useEffect(() => {
    api<{ restaurant: { slug?: string | null; serverUniqueReviewQr?: boolean | null } }>("/api/pro/me")
      .then((r) => {
        setSlug(r.restaurant.slug ?? null);
        setServerUniqueQr(r.restaurant.serverUniqueReviewQr ?? true);
      })
      .catch(() => {});
  }, []);

  const reload = async () => {
    const r = await api<{ servers: Server[] }>("/api/pro/servers");
    setServers(r.servers);
  };

  // Generate restaurant-wide QR when serverUniqueQr is OFF
  useEffect(() => {
    if (serverUniqueQr || !slug) { setRestaurantQrCode(null); return; }
    QRCode.toDataURL(`https://matable.pro/r/${slug}/review`, {
      width: 300, margin: 1,
      color: { dark: "#ffffff", light: "#0a0a0a" },
    }).then(setRestaurantQrCode).catch(() => {});
  }, [serverUniqueQr, slug]);

  const toggleUniqueQr = async (val: boolean) => {
    setUniqueQrSaving(true);
    try {
      await api("/api/pro/restaurant", {
        method: "PATCH",
        body: JSON.stringify({ serverUniqueReviewQr: val }),
      });
      setServerUniqueQr(val);
    } catch {
      setError("Impossible de sauvegarder le paramètre.");
    } finally {
      setUniqueQrSaving(false);
    }
  };

  // Generate NFC QR codes for all servers once slug + servers are available
  useEffect(() => {
    if (!slug || servers.length === 0) return;
    servers.forEach(async (s) => {
      if (nfcQrCodes[s.id]) return; // already generated
      const url = `https://matable.pro/r/${slug}/review?server=${s.id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 1,
        color: { dark: "#ffffff", light: "#0a0a0a" },
      });
      setNfcQrCodes((prev) => ({ ...prev, [s.id]: dataUrl }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers, slug]);

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
    setEditingPin(server.pin ?? "");
    try {
      const res = await api<{ schedules: ServerSchedule[] }>(`/api/pro/servers/${server.id}/schedules`);
      setEditingSchedules(res.schedules);
    } catch (err) {
      setError("Erreur chargement planning");
    }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;

    try {
      const res = await apiUpload<{ ok: boolean; photoUrl: string }>(
        `/api/pro/servers/${editingId}/photo`,
        [file],
      );
      if (!res.ok) throw new Error("Erreur upload");
      await reload();
    } catch (err) {
      setError("Erreur lors de l'envoi de la photo.");
    }
  };

  const savePin = async () => {
    if (!editingId) return;
    if (editingPin && (editingPin.length < 4 || editingPin.length > 6 || !/^\d+$/.test(editingPin))) {
      setError("Le PIN doit être composé de 4 à 6 chiffres.");
      return;
    }
    setPinSaving(true);
    try {
      await api(`/api/pro/servers/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ pin: editingPin || null }),
      });
      await reload();
    } catch (err: any) {
      setError("Erreur sauvegarde PIN");
    } finally {
      setPinSaving(false);
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

  const writeNfc = async (serverId: string, serverName: string) => {
    if (!slug) return;
    if (!("NDEFReader" in window)) {
      alert("L'écriture NFC n'est disponible que sur Chrome pour Android.");
      return;
    }
    const url = `https://matable.pro/r/${slug}/review?server=${serverId}`;
    try {
      setNfcWriting(serverId);
      const ndef = new (window as any).NDEFReader();
      await ndef.write({ records: [{ recordType: "url", data: url }] });
      setNfcWritten(serverId);
      setTimeout(() => setNfcWritten(null), 3000);
    } catch (err: any) {
      alert(`Écriture NFC annulée : ${err.message ?? "Erreur inconnue"}`);
    } finally {
      setNfcWriting(null);
    }
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

      {/* ── Switch : ID unique par serveur ── */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-4">
        <button
          type="button"
          disabled={uniqueQrSaving}
          onClick={() => toggleUniqueQr(!serverUniqueQr)}
          className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            serverUniqueQr ? "bg-orange-500" : "bg-white/20"
          }`}
          aria-checked={serverUniqueQr}
          role="switch"
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            serverUniqueQr ? "translate-x-6" : "translate-x-0"
          }`} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">ID unique par serveur</span>
            {uniqueQrSaving && <span className="text-xs text-white/40 animate-pulse">Enregistrement…</span>}
          </div>
          {serverUniqueQr ? (
            <p className="text-xs text-white/50 mt-0.5">
              ✅ <strong className="text-orange-400">Activé</strong> — chaque serveur a son propre QR / NFC. Les avis Google sont attribués nominativement.
            </p>
          ) : (
            <p className="text-xs text-white/50 mt-0.5">
              ⚠️ <strong className="text-amber-400">Désactivé</strong> — un seul QR / NFC pour le restaurant entier. Impossible de créer des serveurs dans ce mode.
            </p>
          )}
        </div>
      </div>

      {/* ── Mode QR unique restaurant (serverUniqueQr OFF) ── */}
      {!serverUniqueQr && slug && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
          <h2 className="font-bold text-amber-400 text-sm">🪪 QR Code & NFC — Restaurant entier</h2>
          <p className="text-xs text-white/50">Ce code unique dirige vos clients vers la page d'avis Google de votre restaurant, sans attribution à un serveur particulier.</p>
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2">
            <span className="font-mono text-[11px] text-white/60 flex-1 truncate">matable.pro/r/{slug}/review</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(`https://matable.pro/r/${slug}/review`)}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors shrink-0 font-semibold"
            >
              📋 Copier
            </button>
          </div>
          {restaurantQrCode ? (
            <div className="flex items-center gap-4 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <img src={restaurantQrCode} alt="QR restaurant" className="w-full h-full" />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/50">QR code global du restaurant — à imprimer sur vos tables.</p>
                <a
                  href={restaurantQrCode}
                  download="nfc-restaurant.png"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  ⬇ Télécharger PNG
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/30">
              <span className="w-4 h-4 border-2 border-white/20 border-t-transparent rounded-full animate-spin" />
              Génération du QR…
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className={`rounded-lg border flex gap-2 p-4 ${serverUniqueQr ? "border-white/10 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-50 pointer-events-none"}`}>
            <input
              className="flex-1 border border-white/10 rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-orange-500/50 focus:outline-none"
              placeholder={serverUniqueQr ? "Nom du serveur" : "Désactivé — activez « ID unique par serveur »"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              disabled={adding || !serverUniqueQr}
            />
            <button className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-all" onClick={add} disabled={adding || !newName.trim() || !serverUniqueQr}>
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
                    <div className="text-xs text-white/50">
                      {s.pin ? `PIN: ${"●".repeat(s.pin.length)}` : "Pas de PIN · Cliquez pour configurer"}
                    </div>
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
            <div className="space-y-6">
              {/* Photo Upload Section */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-6 flex items-center gap-6">
                <div className="relative group">
                   <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-3xl shrink-0">
                    {servers.find(s => s.id === editingId)?.photoUrl ? (
                      <img
                        src={(() => {
                          const u = servers.find(s => s.id === editingId)?.photoUrl as string;
                          return u.startsWith("http") ? u : `${API_URL}${u}`;
                        })()}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <label className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-bold">
                    Changer
                    <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                  </label>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Photo du serveur</h3>
                  <p className="text-xs text-white/50 mb-3">S'affiche pour vos clients lorsqu'ils laissent un avis ou un pourboire.</p>
                  <label className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded cursor-pointer transition-colors font-semibold">
                    Importer une photo
                    <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                  </label>
                </div>
              </div>

              {/* Planning Section */}
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
                      {DAYS_ORDERED.map((d) => <option key={d} value={DAY_INDEX[d]}>{d}</option>)}
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

              {/* PIN section */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Code PIN portail serveur</p>
                    <p className="text-xs text-white/40">4–6 chiffres · permet au serveur de se connecter sur <span className="font-mono text-orange-400">{slug ? `matable.pro/${slug}/login` : "…/login"}</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={editingPin}
                    onChange={(e) => setEditingPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="ex: 1234"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={savePin}
                    disabled={pinSaving}
                    className="px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-semibold hover:bg-orange-500/30 transition-all disabled:opacity-40"
                  >
                    {pinSaving ? "…" : "Sauver PIN"}
                  </button>
                </div>
              </div>

              {/* NFC Card section */}
              {slug && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-white">🪪 Carte NFC & QR Code</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5">
                      Encodez cette URL sur une carte NFC ou imprimez le QR code. Quand un client scanne, il est directement redirigé vers l'avis pour ce serveur.
                    </p>
                  </div>

                  {/* URL row */}
                  <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2">
                    <span className="font-mono text-[11px] text-white/60 flex-1 truncate">
                      matable.pro/r/{slug}/review?server={editingId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://matable.pro/r/${slug}/review?server=${editingId}`);
                      }}
                      className="text-xs text-orange-400 hover:text-orange-300 transition-colors shrink-0 font-semibold"
                    >
                      📋 Copier
                    </button>
                  </div>

                  {/* QR Code preview */}
                  {editingId && nfcQrCodes[editingId] ? (
                    <div className="flex items-center gap-4 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={nfcQrCodes[editingId]} alt="QR NFC" className="w-full h-full" />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <p className="text-xs text-white/50 leading-relaxed">
                          À imprimer ou encoder sur carte NFC. Le client scanne → avis attribué à{" "}
                          <strong className="text-white/70">{servers.find((s) => s.id === editingId)?.name}</strong>.
                        </p>
                        <a
                          href={nfcQrCodes[editingId]}
                          download={`nfc-${servers.find((s) => s.id === editingId)?.name ?? "serveur"}.png`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                          ⬇ Télécharger PNG
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-transparent rounded-full animate-spin" />
                      Génération du QR…
                    </div>
                  )}

                  {/* Write NFC button */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => writeNfc(editingId!, servers.find((s) => s.id === editingId)?.name ?? "")}
                      disabled={nfcWriting === editingId}
                      className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 rounded-lg text-blue-300 transition-colors disabled:opacity-60"
                    >
                      {nfcWriting === editingId ? (
                        <>
                          <span className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin shrink-0" />
                          Approchez la carte NFC…
                        </>
                      ) : nfcWritten === editingId ? (
                        "✅ Carte encodée !"
                      ) : (
                        "📱 Encoder la carte NFC"
                      )}
                    </button>
                    <p className="text-[11px] text-white/25 leading-relaxed">
                      ⚠ Réservé à <strong className="text-white/35">Chrome sur Android</strong> — sur iPhone, utilisez l'app <em>NFC Tools</em> et collez l'URL ci-dessus.
                    </p>
                  </div>
                </div>
              )}
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