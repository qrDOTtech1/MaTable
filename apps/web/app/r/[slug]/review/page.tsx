"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Server = { id: string; name: string; photoUrl: string | null };
type Config = {
  restaurant: { id: string; name: string };
  googleReviewLink: string | null;
  reviewVoucherConfig: { active?: boolean | string; title?: string; description?: string; code?: string } | null;
  servers: Server[];
};

function resolveAssetUrl(url: string | null | undefined) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function AvatarImage({ src, alt, fallback }: { src: string | null; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      decoding="async"
      loading="eager"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
    />
  );
}

type Drafts = { version1: string; version2: string };

// ── Step definitions for progress bar ────────────────────────────────────────
const STEPS = ["server", "rating", "chat", "drafts", "tip", "claim", "voucher"] as const;
type Step = typeof STEPS[number];
const STEP_LABELS: Record<Step, string> = {
  server: "Serveur",
  rating: "Notes",
  chat: "Avis IA",
  drafts: "Relecture",
  tip: "Pourboire",
  claim: "Cadeau",
  voucher: "Merci",
};

// ── Progress bar component ───────────────────────────────────────────────────
function ProgressBar({ current, onBack }: { current: Step; onBack: (() => void) | null }) {
  const idx = STEPS.indexOf(current);
  const pct = Math.round(((idx + 1) / STEPS.length) * 100);

  return (
    <div className="mb-8">
      {/* Back + progress text */}
      <div className="flex items-center justify-between mb-2">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1 text-white/40 hover:text-white text-sm transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour
          </button>
        ) : <div />}
        <span className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">{STEP_LABELS[current]} &middot; {idx + 1}/{STEPS.length}</span>
      </div>
      {/* Bar */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Star row — extracted as a top-level component for performance ─────────────
function StarRow({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-white/40 text-xl w-6 flex justify-center">{icon}</div>
        <span className="text-sm font-semibold text-white/80">{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(r => (
          <button key={r} onClick={() => onChange(r)} className={`text-2xl transition-transform hover:scale-110 ${r <= value ? "text-yellow-400" : "text-white/10"}`}>
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function normalizeVoucher(config: Config | null) {
  const voucher = config?.reviewVoucherConfig;
  if (!voucher) return null;
  const active = voucher.active === true || voucher.active === "true";
  const code = `${voucher.code ?? ""}`.trim();
  if (!active || !code) return null;
  return {
    code,
    title: `${voucher.title ?? "Merci pour votre avis !"}`.trim() || "Merci pour votre avis !",
    description: `${voucher.description ?? "Présentez ce code lors de votre prochain passage."}`.trim() || "Présentez ce code lors de votre prochain passage.",
  };
}

function parseDraftsFromText(text: string): Drafts | null {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  const candidates = [
    cleaned,
    jsonStart >= 0 && jsonEnd > jsonStart ? cleaned.slice(jsonStart, jsonEnd + 1) : "",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed.version1 === "string" && typeof parsed.version2 === "string") {
        return { version1: parsed.version1.trim(), version2: parsed.version2.trim() };
      }
    } catch {}
  }

  const chunks = cleaned
    .split(/(?:version\s*1\s*:|version\s*2\s*:|\n\s*[-•]\s*)/i)
    .map((s) => s.replace(/^['"\s:,-]+|['"\s,]+$/g, "").trim())
    .filter((s) => s.length > 20);
  if (chunks.length >= 2) return { version1: chunks[0], version2: chunks[1] };
  return null;
}

export default function PublicReviewPage() {
  const params = useParams() as { slug: string };
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flow State — if returning from Stripe tip success, start on a loading hold until config arrives
  const tipParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tip") : null;
  const [step, setStep] = useState<Step>(tipParam === "success" ? "claim" : "server");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [ratings, setRatings] = useState({ food: 0, service: 0, atmosphere: 0, value: 0 });

  // Back navigation — compute where "back" should go based on current step
  const getBackTarget = useCallback((): Step | null => {
    switch (step) {
      case "rating": return "server";
      case "chat": return "rating";
      case "drafts": return "chat";
      case "tip": return "drafts";
      default: return null; // no back for server, claim, voucher
    }
  }, [step]);

  const handleBack = useCallback(() => {
    const target = getBackTarget();
    if (target) setStep(target);
  }, [getBackTarget]);

  // Tip State
  const searchParams = useSearchParams();
  const [tipLoading, setTipLoading] = useState(false);
  const [customTip, setCustomTip] = useState("");
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: "ai"|"user", content: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentAiText, setCurrentAiText] = useState("");
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // AI Drafts State
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [liveText, setLiveText] = useState("");

  // Voucher claim state
  const [claimEmail, setClaimEmail] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [claimStep, setClaimStep] = useState<"email" | "code" | "already">("email");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedVoucher, setClaimedVoucher] = useState<{active?: boolean|string; title?: string; description?: string; code?: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/r/${params.slug}/review-campaign`)
      .then(res => {
        if (!res.ok) throw new Error("Campagne non trouvée ou désactivée");
        return res.json();
      })
      .then(data => setConfig(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Handle return from Stripe — wait for config to load before setting step
    const tipStatus = searchParams.get("tip");
    if (tipStatus === "cancel") {
      setStep("tip");
    }
    // "success" is handled below once config is loaded
  }, [params.slug, searchParams]);

  // When returning from Stripe tip success, go to claim step (needs config loaded)
  useEffect(() => {
    if (config && searchParams.get("tip") === "success") {
      setStep("claim");
    }
  }, [config, searchParams]);

  const handleServerSelect = (s: Server) => {
    setSelectedServer(s);
    setStep("rating");
  };

  const handleTip = async (amountCents: number) => {
    setTipLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/r/${params.slug}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          serverName: selectedServer?.name || "L'équipe",
          serverId: selectedServer?.id === "team" ? undefined : selectedServer?.id,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur paiement");
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (e: any) {
      alert("Impossible de procéder au pourboire pour le moment.");
      setTipLoading(false);
      setStep("voucher"); // Skip if error
    }
  };

  const handleRatingsSubmit = () => {
    setStep("chat");
    startAiChat([]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, currentAiText]);

  const startAiChat = (history: {role: "ai"|"user", content: string}[]) => {
    setChatLoading(true);
    setCurrentAiText("");
    setCurrentChoices([]);
    
    let streamedText = "";
    fetch(`${API_URL}/api/ia/review-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: config?.restaurant.id,
        serverName: selectedServer?.name || "l'équipe",
        ratings,
        history
      })
    })
    .then(async (res) => {
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      let partial = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setChatLoading(false);
          break;
        }
        partial += new TextDecoder().decode(value);
        const lines = partial.split("\n\n");
        partial = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            let data: any;
            try { data = JSON.parse(line.slice(6)); } catch { continue; }
            
            if (data.type === "chunk" && data.text) {
              streamedText += data.text;
              if (!streamedText.includes("{")) {
                // It's a question
                const parts = streamedText.split("|");
                const questionPart = parts[0].replace(/QUESTION:\s*/i, "").trim();
                setCurrentAiText(questionPart);
                if (parts.length > 1) {
                  setCurrentChoices(parts.slice(1).map((s: string) => s.trim()).filter(Boolean));
                }
              }
            } else if (data.type === "done") {
              const fullOutput = typeof data.text === "string" ? data.text : streamedText;
              
              if (fullOutput.includes("{")) {
                // It's a draft
                setStep("drafts");
                const parsed = parseDraftsFromText(fullOutput);
                if (parsed) setDrafts(parsed);
                else alert("Erreur format IA");
              } else {
                // It's a question, add to history
                const parts = fullOutput.split("|");
                const q = parts[0].replace(/QUESTION:\s*/i, "").trim();
                setChatHistory(prev => [...prev, { role: "ai", content: q }]);
                setCurrentAiText("");
                if (parts.length > 1) {
                  setCurrentChoices(parts.slice(1).map((s: string) => s.trim()).filter(Boolean));
                }
              }
            } else if (data.type === "error") {
              alert("Erreur IA");
            }
          }
        }
      }
    })
    .catch(() => {
      alert("Erreur réseau");
      setChatLoading(false);
    });
  };

  const handleUserReply = (ans: string) => {
    if (!ans.trim()) return;
    const newHistory = [...chatHistory, { role: "user" as const, content: ans }];
    setChatHistory(newHistory);
    setCurrentChoices([]);
    setFreeText("");
    startAiChat(newHistory);
  };


  // Editable drafts state
  const [editingDraft, setEditingDraft] = useState<1 | 2 | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedDraft, setCopiedDraft] = useState<1 | 2 | null>(null);

  const startEditDraft = (version: 1 | 2) => {
    if (!drafts) return;
    setEditText(version === 1 ? drafts.version1 : drafts.version2);
    setEditingDraft(version);
  };

  const saveEditDraft = () => {
    if (!drafts || !editingDraft) return;
    const updated = { ...drafts };
    if (editingDraft === 1) updated.version1 = editText;
    else updated.version2 = editText;
    setDrafts(updated);
    setEditingDraft(null);
    setEditText("");
  };

  const copyAndGoToGoogle = (text: string, version: 1 | 2) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(version);
    setTimeout(() => setCopiedDraft(null), 2000);
    if (config?.googleReviewLink) {
      window.setTimeout(() => window.open(config.googleReviewLink!, "_blank"), 300);
    }
    // Don't auto-advance — let user click "Continuer" when ready
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/50 text-sm">Chargement...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-xs">
        <div className="text-4xl">:(</div>
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-white/40 hover:text-white underline">Recharger la page</button>
      </div>
    </div>
  );
  if (!config) return null;
  const voucher = normalizeVoucher(config);
  const backTarget = getBackTarget();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-md mx-auto flex flex-col pt-8">
      {/* Restaurant header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-black mb-1">{config.restaurant.name}</h1>
        <p className="text-white/50 text-sm">Merci pour votre visite !</p>
      </div>

      {/* Progress bar + back button */}
      <ProgressBar current={step} onBack={backTarget ? handleBack : null} />

      {step === "server" && (
        <div className="animate-fade-in space-y-6">
          <h2 className="text-xl font-bold text-center">Qui s'est occupé de vous ?</h2>
          <div className="grid grid-cols-2 gap-4">
            {(config.servers.length ? config.servers : [{ id: "team", name: "L'équipe", photoUrl: null }]).map(s => (
              <button 
                key={s.id} 
                onClick={() => handleServerSelect(s)}
                className="bg-white/5 border border-white/10 hover:border-orange-500 rounded-2xl p-4 flex flex-col items-center gap-3 transition-colors"
              >
                 <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xl font-bold text-white/40">
                  <AvatarImage
                    src={resolveAssetUrl(s.photoUrl)}
                    alt={s.name}
                    fallback={s.name.charAt(0)}
                  />
                </div>
                <span className="font-semibold">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "rating" && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold">Votre expérience ?</h2>
            <p className="text-sm text-white/50 mt-1">Notez les différents aspects de votre repas.</p>
          </div>
          
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 rounded-3xl space-y-6 shadow-2xl">
            <StarRow label="Cuisine" icon="🍽️" value={ratings.food} onChange={v => setRatings(r => ({ ...r, food: v }))} />
            <StarRow label="Service" icon="😊" value={ratings.service} onChange={v => setRatings(r => ({ ...r, service: v }))} />
            <StarRow label="Ambiance" icon="🏠" value={ratings.atmosphere} onChange={v => setRatings(r => ({ ...r, atmosphere: v }))} />
            <StarRow label="Qualité/Prix" icon="💰" value={ratings.value} onChange={v => setRatings(r => ({ ...r, value: v }))} />
          </div>

          <div className="pt-4">
            <button
              disabled={!ratings.food || !ratings.service || !ratings.atmosphere || !ratings.value}
              onClick={handleRatingsSubmit}
              className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20"
            >
              Continuer
            </button>
            <button
              onClick={() => setStep("tip")}
              className="w-full mt-4 text-sm text-white/40 hover:text-white transition-colors underline underline-offset-4"
            >
              Passer l'avis et laisser juste un pourboire
            </button>
          </div>
        </div>
      )}

      {step === "chat" && (
        <div className="animate-fade-in flex flex-col h-[70vh]">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">Assistant IA</h2>
            <p className="text-sm text-white/50">L'IA rédige votre avis à partir de vos réponses.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-none">
            {chatHistory.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
              >
                <div className={`px-4 py-3 max-w-[85%] rounded-2xl text-sm ${msg.role === "ai" ? "bg-white/10 text-white rounded-tl-sm" : "bg-orange-600 text-white rounded-tr-sm"}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            
            {(currentAiText || chatLoading) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="px-4 py-3 max-w-[85%] rounded-2xl text-sm bg-white/10 text-white rounded-tl-sm flex items-center gap-2">
                  {currentAiText || <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDelay: "150ms"}}/><span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDelay: "300ms"}}/></span>}
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {currentChoices.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-wrap gap-2"
                >
                  {currentChoices.map(ans => (
                    <button 
                      key={ans} 
                      onClick={() => handleUserReply(ans)} 
                      className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold text-sm hover:bg-orange-500/30 transition-colors"
                    >
                      {ans}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleUserReply(freeText)}
                disabled={chatLoading}
                placeholder="Écrire une réponse..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
              />
              <button 
                onClick={() => handleUserReply(freeText)}
                disabled={!freeText.trim() || chatLoading}
                className="w-12 h-[46px] flex items-center justify-center bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "drafts" && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Votre avis est pret !</h2>
            <p className="text-sm text-white/50">Modifiez si besoin, puis copiez la version que vous preferez.</p>
          </div>

          {generating ? (
            <div className="text-center p-8 space-y-4">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-orange-400 font-medium">L'IA redige votre avis...</p>
              {liveText && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl text-left font-mono text-xs whitespace-pre-wrap text-white/70 overflow-hidden break-words border border-white/10">
                  {liveText}
                </div>
              )}
            </div>
          ) : drafts ? (
            <div className="space-y-4">
              {/* Draft version 1 */}
              {editingDraft === 1 ? (
                <div className="bg-white/5 border border-orange-500/40 p-4 rounded-2xl space-y-3">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={5}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEditDraft} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm transition-colors">Enregistrer</button>
                    <button onClick={() => setEditingDraft(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 hover:bg-white/[0.07] border border-white/10 p-5 rounded-2xl transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Version 1</span>
                    <button onClick={() => startEditDraft(1)} className="text-[10px] uppercase tracking-wider text-white/30 hover:text-orange-400 font-bold transition-colors flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Modifier
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed mb-4">{drafts.version1}</p>
                  <button
                    onClick={() => copyAndGoToGoogle(drafts.version1, 1)}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white"
                  >
                    {copiedDraft === 1 ? "Copie !" : "Copier & Publier sur Google"} {copiedDraft !== 1 && <span className="text-xs">↗</span>}
                  </button>
                </div>
              )}

              {/* Draft version 2 */}
              {editingDraft === 2 ? (
                <div className="bg-white/5 border border-orange-500/40 p-4 rounded-2xl space-y-3">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={5}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEditDraft} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm transition-colors">Enregistrer</button>
                    <button onClick={() => setEditingDraft(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm transition-colors">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 hover:bg-white/[0.07] border border-white/10 p-5 rounded-2xl transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Version 2</span>
                    <button onClick={() => startEditDraft(2)} className="text-[10px] uppercase tracking-wider text-white/30 hover:text-orange-400 font-bold transition-colors flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Modifier
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed mb-4">{drafts.version2}</p>
                  <button
                    onClick={() => copyAndGoToGoogle(drafts.version2, 2)}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white"
                  >
                    {copiedDraft === 2 ? "Copie !" : "Copier & Publier sur Google"} {copiedDraft !== 2 && <span className="text-xs">↗</span>}
                  </button>
                </div>
              )}

              {/* Continue button */}
              <button
                onClick={() => setStep("tip")}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20 mt-2"
              >
                Continuer
              </button>
            </div>
          ) : null}
        </div>
      )}

      {step === "tip" && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">Avant de partir...</h2>
            <p className="text-white/50 text-sm">Le service de {selectedServer?.name || "l'équipe"} vous a plu ? Laissez un pourboire rapide et 100% sécurisé.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
             <p className="text-xs font-bold text-white/70 mb-4 flex items-center justify-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Paiement express disponible
             </p>
             <div className="flex justify-center items-center gap-4 mb-6">
               <div className="px-3 py-1.5 bg-black rounded-lg border border-white/20 flex items-center shadow-sm">
                 <span className="text-lg"></span> <span className="font-semibold text-sm ml-1">Pay</span>
               </div>
               <div className="px-3 py-1.5 bg-black rounded-lg border border-white/20 flex items-center shadow-sm">
                 <span className="font-bold text-sm">G Pay</span>
               </div>
               <div className="px-3 py-1.5 bg-black rounded-lg border border-white/20 flex items-center shadow-sm">
                 <span className="text-lg">💳</span>
               </div>
             </div>
             
             
             <div className="grid grid-cols-2 gap-3 mb-3">
               {[200, 300, 500, 1000].map(cents => (
                 <button
                   key={cents}
                   disabled={tipLoading}
                   onClick={() => handleTip(cents)}
                   className="bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500 rounded-xl p-3 font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {(cents / 100).toFixed(2)} €
                 </button>
               ))}
             </div>

             <div className="flex gap-2">
                <input
                  type="number" min="0" step="0.50" placeholder="Montant libre (€)"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 text-center"
                />
                {parseFloat(customTip) > 0 && (
                  <button
                    onClick={() => handleTip(Math.round(parseFloat(customTip) * 100))}
                    disabled={tipLoading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-sm transition-colors shrink-0"
                  >
                    Valider
                  </button>
                )}
             </div>
          </div>

          <button
            disabled={tipLoading}
            onClick={() => setStep("claim")}
            className="w-full py-4 text-white/40 hover:text-white transition-colors text-sm font-semibold"
          >
            Non merci
          </button>
        </div>
      )}

      {step === "claim" && (
        <div className="animate-fade-in space-y-6 py-4">
          {/* Si pas de voucher configuré, skip directement */}
          {!voucher ? (
            (() => { if (typeof window !== "undefined") setTimeout(() => setStep("voucher"), 0); return null; })()
          ) : claimStep === "already" ? (
            <>
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl mb-2">😊</div>
                <h2 className="text-xl font-bold">Merci pour votre fidelite !</h2>
                <p className="text-white/50 text-sm max-w-xs mx-auto">Vous avez deja profite d'une offre pour cet etablissement.</p>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-4">
                  <p className="text-sm text-orange-400 font-semibold">Revenez bientot nous donner un nouvel avis — de nouvelles offres pourraient etre disponibles !</p>
                </div>
              </div>
              <button onClick={() => setStep("voucher")} className="w-full py-3 text-white/40 hover:text-white transition-colors text-sm font-semibold mt-4">
                Continuer
              </button>
            </>
          ) : claimStep === "email" ? (
            <>
              <div className="text-center mb-4">
                <div className="text-5xl mb-4">🎁</div>
                <h2 className="text-xl font-bold mb-2">Recevez votre récompense !</h2>
                <p className="text-white/50 text-sm">Entrez votre email pour recevoir un code de vérification et débloquer votre cadeau.</p>
              </div>

              {claimError && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 text-center">
                  {claimError}
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="email"
                  value={claimEmail}
                  onChange={e => { setClaimEmail(e.target.value); setClaimError(null); }}
                  placeholder="votre@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <button
                  disabled={claimLoading || !claimEmail.includes("@")}
                  onClick={async () => {
                    setClaimLoading(true);
                    setClaimError(null);
                    try {
                      const res = await fetch(`${API_URL}/api/r/${params.slug}/voucher-request`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: claimEmail }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        if (data.error === "already_claimed") {
                          setClaimError(null);
                          setClaimStep("already");
                        } else {
                          setClaimError(data.message || "Erreur lors de l'envoi.");
                        }
                      } else {
                        setClaimStep("code");
                      }
                    } catch {
                      setClaimError("Erreur reseau. Reessayez.");
                    } finally {
                      setClaimLoading(false);
                    }
                  }}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                >
                  {claimLoading ? "Envoi en cours..." : "Recevoir le code"}
                </button>
              </div>

              <button onClick={() => setStep("voucher")} className="w-full text-sm text-white/30 hover:text-white/60 transition-colors pt-2">
                Passer
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="text-5xl mb-4">📩</div>
                <h2 className="text-xl font-bold mb-2">Verifiez votre email</h2>
                <p className="text-white/50 text-sm">Un code a 6 chiffres a ete envoye a <strong className="text-white">{claimEmail}</strong></p>
              </div>

              {claimError && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 text-center">
                  {claimError}
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={claimCode}
                  onChange={e => { setClaimCode(e.target.value.replace(/\D/g, "")); setClaimError(null); }}
                  placeholder="000000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-3xl font-mono tracking-[0.5em] placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <button
                  disabled={claimLoading || claimCode.length !== 6}
                  onClick={async () => {
                    setClaimLoading(true);
                    setClaimError(null);
                    try {
                      const res = await fetch(`${API_URL}/api/r/${params.slug}/voucher-verify`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: claimEmail, code: claimCode }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setClaimError(data.message || "Code incorrect.");
                      } else {
                        setClaimedVoucher(data.voucher);
                        setStep("voucher");
                      }
                    } catch {
                      setClaimError("Erreur reseau. Reessayez.");
                    } finally {
                      setClaimLoading(false);
                    }
                  }}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                >
                  {claimLoading ? "Verification..." : "Valider"}
                </button>
              </div>

              <button
                onClick={() => { setClaimStep("email"); setClaimCode(""); setClaimError(null); }}
                className="w-full text-sm text-white/30 hover:text-white/60 transition-colors pt-2"
              >
                Changer d'email
              </button>
            </>
          )}
        </div>
      )}

      {step === "voucher" && (() => {
        const v = claimedVoucher ?? voucher;
        const claimed = !!claimedVoucher;
        return v && claimed ? (
          <div className="animate-fade-in text-center space-y-6 py-8">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold">Un grand merci !</h2>
            <p className="text-white/50">Pour vous remercier, voici un cadeau lors de votre prochain passage.</p>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-900/20 border border-orange-500/30 rounded-3xl p-8 mt-8">
              <h3 className="text-xl font-black text-orange-400 mb-2">{v.title}</h3>
              <p className="text-sm text-white/70 mb-6">{v.description}</p>
              <div className="bg-black/40 rounded-xl py-3 px-6 inline-block">
                <span className="font-mono text-2xl font-black tracking-widest text-white">{v.code}</span>
              </div>
              <p className="text-[10px] text-white/30 mt-6 uppercase tracking-wider">Sur présentation de cet écran</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in text-center space-y-6 py-12">
            <div className="text-6xl mb-4">🙌</div>
            <h2 className="text-2xl font-bold">Un grand merci !</h2>
            <p className="text-white/50">Votre visite compte énormément pour nous et pour notre équipe. À très bientôt !</p>
          </div>
        );
      })()}

    </div>
  );
}
