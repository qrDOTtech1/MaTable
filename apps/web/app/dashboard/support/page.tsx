"use client";
import { useEffect, useState } from "react";
import { api, redirectOn401 } from "@/lib/api";

type Ticket = {
  id: string; subject: string; message: string; status: string;
  priority: string; adminReply: string | null; repliedAt: string | null; createdAt: string;
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  OPEN:     { label: "Ouvert",   cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  REPLIED:  { label: "Repondu",  cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  CLOSED:   { label: "Ferme",    cls: "bg-white/10 text-white/40 border-white/10" },
};

const PRIORITY_STYLE: Record<string, { label: string; cls: string }> = {
  LOW:    { label: "Faible",  cls: "text-white/40" },
  NORMAL: { label: "Normal",  cls: "text-white/60" },
  URGENT: { label: "Urgent",  cls: "text-red-400 font-bold" },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "URGENT">("NORMAL");
  const [success, setSuccess] = useState(false);

  const load = async () => {
    try {
      const r = await api<{ tickets: Ticket[] }>("/api/pro/support");
      setTickets(r.tickets);
    } catch (err) { redirectOn401(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await api("/api/pro/support", {
        method: "POST",
        body: JSON.stringify({ subject, message, priority }),
      });
      setSubject(""); setMessage(""); setPriority("NORMAL");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      load();
    } catch (e: any) { alert("Erreur: " + e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-1">SAV / Support</h1>
      <p className="text-sm text-white/40 mb-6">Envoyez un message directement a l'equipe MaTable</p>

      {/* Form */}
      <form onSubmit={submit} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Sujet *</label>
          <input
            value={subject} onChange={e => setSubject(e.target.value)} required
            placeholder="Ex: Probleme de paiement, Bug sur le menu..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Message *</label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)} required rows={5}
            placeholder="Decrivez votre probleme en detail..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 resize-none"
          />
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-white/60 mb-1">Priorite</label>
            <select value={priority} onChange={e => setPriority(e.target.value as any)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50">
              <option value="LOW">Faible</option>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <button type="submit" disabled={sending}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
        {success && (
          <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
            Message envoye ! L'equipe MaTable vous repondra rapidement.
          </div>
        )}
      </form>

      {/* Tickets list */}
      <h2 className="text-lg font-bold text-white mb-4">Historique ({tickets.length})</h2>
      {loading ? (
        <div className="text-white/30 text-sm">Chargement...</div>
      ) : tickets.length === 0 ? (
        <div className="text-white/30 text-sm">Aucun ticket pour le moment.</div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => {
            const s = STATUS_STYLE[t.status] ?? STATUS_STYLE.OPEN;
            const p = PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.NORMAL;
            return (
              <div key={t.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                    <span className={`text-xs ${p.cls}`}>{p.label}</span>
                    <h3 className="font-semibold text-white text-sm truncate">{t.subject}</h3>
                  </div>
                  <span className="text-xs text-white/30 shrink-0">
                    {new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-white/60 whitespace-pre-wrap">{t.message}</p>
                {t.adminReply && (
                  <div className="mt-3 bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-xs text-orange-400 font-bold mb-1">Reponse MaTable :</p>
                    <p className="text-sm text-white/70 whitespace-pre-wrap">{t.adminReply}</p>
                    {t.repliedAt && (
                      <p className="text-xs text-white/30 mt-1">{new Date(t.repliedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
