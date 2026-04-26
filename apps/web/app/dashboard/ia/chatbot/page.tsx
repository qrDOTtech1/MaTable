"use client";
import { useEffect, useRef, useState } from "react";
import { api, redirectOn401 } from "@/lib/api";
import { IaHistoryPanel, type HistoryEntry } from "@/components/ia/IaHistoryPanel";

type Role = "user" | "assistant" | "system";
type Message = { role: Role; content: string };

const SYSTEM_PROMPT =
  "Tu es Nova, l'assistant IA de Ma Table, spécialisé dans la restauration. Tu aides les restaurateurs à rédiger des descriptions de plats, gérer leur menu, répondre aux questions clients et optimiser leur service. Réponds toujours en français, de façon concise et professionnelle.";

export default function ChatbotPage() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const textareaRef                 = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Reset saved badge when new messages arrive
  useEffect(() => { setSaved(false); }, [messages.length]);

  const onRestoreHistory = (entry: HistoryEntry) => {
    if (entry.outputData?.messages) {
      setMessages(entry.outputData.messages as Message[]);
      setSaved(true); // already saved
    }
  };

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const payload: Message[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...newMessages,
      ];
      const res = await api<{ message: { content: string } }>("/api/pro/ia/chat", {
        method: "POST",
        body: JSON.stringify({ messages: payload }),
      });
      setMessages([...newMessages, { role: "assistant", content: res.message.content }]);
    } catch (e: any) {
      redirectOn401(e);
      setError("Impossible de joindre Nova IA. Vérifiez votre clé API dans les paramètres admin.");
      setMessages(newMessages);
    } finally {
      setLoading(false);
    }
  }

  async function saveConversation() {
    if (!messages.length || saving) return;
    setSaving(true);
    try {
      const firstUserMsg = messages.find(m => m.role === "user")?.content ?? "Conversation";
      const title = `${firstUserMsg.slice(0, 60)}${firstUserMsg.length > 60 ? "…" : ""}`;
      await api("/api/pro/ia/history", {
        method: "POST",
        body: JSON.stringify({
          type: "CHAT",
          title,
          outputData: { messages: messages.filter(m => m.role !== "system") },
        }),
      });
      setSaved(true);
      setHistoryKey(k => k + 1);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  function newConversation() {
    setMessages([]);
    setError(null);
    setSaved(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-8">
      {/* Header */}
      <div className="px-8 py-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="text-xl font-bold text-white">Chatbot Nova IA</h1>
            <p className="text-sm text-white/40">Assistant IA spécialisé restauration</p>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">✨ PRO IA</span>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-2">
            {messages.length > 0 && (
              <>
                {/* Save conversation */}
                <button
                  onClick={saveConversation}
                  disabled={saving || saved}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    saved
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.07]"
                  }`}
                >
                  {saving ? "…" : saved ? "✅ Sauvé" : "💾 Sauvegarder"}
                </button>
                {/* New conversation */}
                <button
                  onClick={newConversation}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-all"
                >
                  ✕ Nouvelle conv.
                </button>
              </>
            )}
            <IaHistoryPanel type="CHAT" onRestore={onRestoreHistory} refreshKey={historyKey} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">🤖</div>
            <div>
              <p className="text-white/70 font-medium mb-1">Bonjour ! Je suis Nova, votre assistant IA.</p>
              <p className="text-white/40 text-sm">Posez-moi des questions sur votre menu, vos clients, ou demandez-moi de rédiger des descriptions.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
              {[
                "Rédige une description pour un risotto aux truffes",
                "Comment améliorer mon taux de satisfaction client ?",
                "Suggère des plats du jour pour cette semaine",
                "Aide-moi à répondre à un avis négatif",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                  className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all text-sm text-white/60 hover:text-white/80"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm ${
              msg.role === "user"
                ? "bg-orange-500/20 border border-orange-500/30"
                : "bg-purple-500/20 border border-purple-500/30"
            }`}>
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-orange-500/15 border border-orange-500/20 text-white rounded-tr-sm"
                : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">🤖</div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-8 py-5 border-t border-white/[0.06] shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Posez une question à Nova… (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white font-semibold text-sm shrink-0"
          >
            Envoyer ↑
          </button>
        </div>
        <p className="text-xs text-white/20 mt-2">Nova utilise le modèle langage configuré dans Nova Admin · Les réponses peuvent contenir des erreurs.</p>
      </div>
    </div>
  );
}
