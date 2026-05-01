"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

type Server = { id: string; name: string; photoUrl: string | null };
type Config = {
  restaurant: { id: string; name: string };
  googleReviewLink: string | null;
  reviewVoucherConfig: { active?: boolean | string; title?: string; description?: string; code?: string } | null;
  servers: Server[];
};

type Drafts = { version1: string; version2: string };

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

  // Flow State
  const [step, setStep] = useState<"server" | "rating" | "chat" | "drafts" | "google" | "voucher">("server");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [rating, setRating] = useState(0);
  
  // Chat State
  const questions = [
    "Qu'avez-vous pensé de l'accueil ?",
    "Comment étaient les plats ?",
    "Un mot sur l'ambiance ?"
  ];
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  
  // AI Drafts State
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [liveText, setLiveText] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/r/${params.slug}/review-campaign`)
      .then(res => {
        if (!res.ok) throw new Error("Campagne non trouvée ou désactivée");
        return res.json();
      })
      .then(data => setConfig(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleServerSelect = (s: Server) => {
    setSelectedServer(s);
    setStep("rating");
  };

  const handleRatingSelect = (r: number) => {
    setRating(r);
    setStep("chat");
  };

  const handleAnswer = (ans: string) => {
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("drafts");
      generateDrafts(newAnswers);
    }
  };

  const generateDrafts = (finalAnswers: string[]) => {
    setGenerating(true);
    setDrafts(null);
    setLiveText("");
    let streamedText = "";
    let receivedDone = false;
    // Use the SSE endpoint /api/ia/review-draft
    fetch(`${API_URL}/api/ia/review-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: config?.restaurant.id,
        serverName: selectedServer?.name,
        rating,
        answers: finalAnswers
      })
    })
    .then(async (res) => {
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      let partial = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (!receivedDone) {
            const parsed = parseDraftsFromText(streamedText);
            if (parsed) setDrafts(parsed);
          }
          setGenerating(false);
          break;
        }
        partial += new TextDecoder().decode(value);
        const lines = partial.split("\n\n");
        partial = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            let data: any;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (data.type === "chunk" && data.text) {
              streamedText += data.text;
              setLiveText(prev => prev + data.text);
            } else if (data.type === "done") {
              receivedDone = true;
              const parsed =
                typeof data.version1 === "string" && typeof data.version2 === "string"
                  ? { version1: data.version1.trim(), version2: data.version2.trim() }
                  : parseDraftsFromText(streamedText);
              if (parsed) setDrafts(parsed);
              else alert("L'IA a répondu, mais le format est illisible. Réessayez.");
              setGenerating(false);
            } else if (data.type === "error") {
              alert("Erreur de génération IA");
              setGenerating(false);
            }
          }
        }
      }
    })
    .catch(() => {
      alert("Erreur réseau de l'IA");
      setGenerating(false);
    });
  };

  const copyAndGoToGoogle = (text: string) => {
    navigator.clipboard.writeText(text);
    const voucher = normalizeVoucher(config);
    setStep(voucher ? "voucher" : "google");
    if (config?.googleReviewLink) {
      window.setTimeout(() => window.open(config.googleReviewLink!, "_blank"), 150);
    }
  };

  if (loading) return <div className="p-8 text-center text-white/50">Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!config) return null;
  const voucher = normalizeVoucher(config);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-md mx-auto flex flex-col pt-12">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-black mb-2">{config.restaurant.name}</h1>
        <p className="text-white/50 text-sm">Merci pour votre visite !</p>
      </div>

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
                  {s.photoUrl ? <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                </div>
                <span className="font-semibold">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "rating" && (
        <div className="animate-fade-in space-y-6 text-center">
          <h2 className="text-xl font-bold">Quelle note donnez-vous ?</h2>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(r => (
              <button 
                key={r} 
                onClick={() => handleRatingSelect(r)}
                className="text-5xl hover:scale-110 transition-transform hover:text-orange-500 text-white/20"
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "chat" && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-orange-400 font-bold mb-2">Assistant IA</p>
            <p className="text-lg">{questions[currentQ]}</p>
          </div>
          <div className="space-y-3">
            {currentQ === 0 && ["Excellent", "Très bien", "Moyen", "À revoir"].map(ans => (
              <button key={ans} onClick={() => handleAnswer(ans)} className="w-full text-left px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold">{ans}</button>
            ))}
            {currentQ === 1 && ["Délicieux", "Très bon", "Correct", "Décevant"].map(ans => (
              <button key={ans} onClick={() => handleAnswer(ans)} className="w-full text-left px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold">{ans}</button>
            ))}
            {currentQ === 2 && ["Superbe", "Cosy", "Animée", "Calme"].map(ans => (
              <button key={ans} onClick={() => handleAnswer(ans)} className="w-full text-left px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold">{ans}</button>
            ))}
          </div>
        </div>
      )}

      {step === "drafts" && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">Votre avis est prêt !</h2>
            <p className="text-sm text-white/50">Choisissez la version que vous préférez. Elle sera copiée pour que vous puissiez la coller sur Google.</p>
          </div>

          {generating ? (
            <div className="text-center p-8 space-y-4">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-orange-400 font-medium">L'IA rédige votre avis...</p>
              {liveText && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl text-left font-mono text-xs whitespace-pre-wrap text-white/70 overflow-hidden break-words border border-white/10">
                  {liveText}
                </div>
              )}
            </div>
          ) : drafts ? (
            <div className="space-y-4">
              <button 
                onClick={() => copyAndGoToGoogle(drafts.version1)}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl transition-colors group"
              >
                <p className="text-sm leading-relaxed mb-4">{drafts.version1}</p>
                <div className="text-xs font-bold text-orange-500 group-hover:text-orange-400">Copier & Publier sur Google ↗</div>
              </button>
              
              <button 
                onClick={() => copyAndGoToGoogle(drafts.version2)}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl transition-colors group"
              >
                <p className="text-sm leading-relaxed mb-4">{drafts.version2}</p>
                <div className="text-xs font-bold text-orange-500 group-hover:text-orange-400">Copier & Publier sur Google ↗</div>
              </button>
            </div>
          ) : null}
        </div>
      )}

      {step === "google" && (
        <div className="animate-fade-in text-center space-y-6 py-12">
          <div className="text-6xl mb-4">🙌</div>
          <h2 className="text-2xl font-bold">Un grand merci !</h2>
          <p className="text-white/50">Votre avis compte énormément pour nous et pour notre équipe.</p>
        </div>
      )}

      {step === "voucher" && voucher && (
        <div className="animate-fade-in text-center space-y-6 py-8">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold">Merci pour votre avis !</h2>
          <p className="text-white/50">Pour vous remercier, voici un cadeau lors de votre prochain passage.</p>
          
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-900/20 border border-orange-500/30 rounded-3xl p-8 mt-8">
            <h3 className="text-xl font-black text-orange-400 mb-2">{voucher.title}</h3>
            <p className="text-sm text-white/70 mb-6">{voucher.description}</p>
            <div className="bg-black/40 rounded-xl py-3 px-6 inline-block">
              <span className="font-mono text-2xl font-black tracking-widest text-white">{voucher.code}</span>
            </div>
            <p className="text-[10px] text-white/30 mt-6 uppercase tracking-wider">Sur présentation de cet écran</p>
          </div>
        </div>
      )}

    </div>
  );
}
