"use client";
import { useState, useEffect } from "react";
import { api, apiStream } from "@/lib/api";
import { IaHistoryPanel, type HistoryEntry } from "@/components/ia/IaHistoryPanel";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
type ReportData = {
  period: { start: string; end: string };
  revenue: { totalCents: number; onSiteCents: number; takeAwayCents: number };
  ordersCount: number;
};

type NovaContabAnalysis = {
  summary: string;
  urssaf: {
    totalRevenueToDeclare: number;
    estimatedContributions: number;
    breakdown: Array<{ category: string; revenue: number; ratePercent: number; contribution: number }>;
  };
  vat: {
    status: string;
    alert: string | null;
    estimatedToPay: number;
  };
  tips: Array<{ title: string; description: string }>;
};

function fmt(cents: number) { return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }

// ── Composant principal ───────────────────────────────────────────────────────
export default function NovaContabPage() {
  const [isNovaActive, setIsNovaActive] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Configuration period
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [periodType, setPeriodType] = useState<"MONTH" | "QUARTER">("MONTH");
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [quarter, setQuarter] = useState("1");

  // Configuration IA inputs
  const [legalStatus, setLegalStatus] = useState<"MICRO" | "SASU" | "SARL" | "EURL" | "OTHER">("MICRO");
  const [taxRegime, setTaxRegime] = useState<"FRANCHISE" | "REEL_SIMPLIFIE" | "REEL_NORMAL">("FRANCHISE");
  const [notes, setNotes] = useState("");

  // Results
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NovaContabAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    api<{ restaurant: { subscription?: string } }>("/api/pro/me")
      .then((me) => setIsNovaActive(me.restaurant.subscription === "PRO_IA"))
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const onRestoreHistory = (entry: HistoryEntry) => {
    if (entry.outputData?.analysis) {
      setAnalysis(entry.outputData.analysis as NovaContabAnalysis);
      
      // Essayer de pré-remplir les inputs depuis l'historique
      const inputs = entry.outputData.inputs as any;
      if (inputs) {
        if (inputs.legalStatus) setLegalStatus(inputs.legalStatus);
        if (inputs.taxRegime) setTaxRegime(inputs.taxRegime);
        if (inputs.notes) setNotes(inputs.notes);
      }
      
      // On masque le rapport brut puisqu'on affiche l'historique IA
      setReport(null); 
      setError(null);
    }
  };

  const fetchReport = async () => {
    setLoadingReport(true); setError(null); setAnalysis(null);
    try {
      const q = new URLSearchParams({ year });
      if (periodType === "MONTH") q.set("month", month);
      else q.set("quarter", quarter);

      const res = await api<ReportData>(`/api/pro/novacontab/report?${q}`);
      setReport(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const runNovaAnalysis = async () => {
    if (!report) return;
    setAnalyzing(true); setError(null); setAnalysis(null);

    const periodLabel = periodType === "MONTH" 
      ? `Mois ${month}/${year}` 
      : `Trimestre ${quarter} ${year}`;

    try {
      let resultAnalysis: NovaContabAnalysis | null = null;
      const stream = await apiStream("/api/pro/ia/novacontab", {
        periodLabel,
        revenueTotal: report.revenue.totalCents / 100,
        revenueOnSite: report.revenue.onSiteCents / 100,
        revenueTakeAway: report.revenue.takeAwayCents / 100,
        legalStatus,
        taxRegime,
        notes: notes || undefined,
      });

      for await (const event of stream) {
        if (event.type === "result") {
          resultAnalysis = event.analysis as NovaContabAnalysis;
        } else if (event.type === "error") {
          throw new Error((event.message as string) || "Erreur IA");
        }
      }

      if (resultAnalysis) {
        setAnalysis(resultAnalysis);
        setHistoryKey(k => k + 1);
      } else {
        throw new Error("L'IA n'a pas retourné de résultat.");
      }
    } catch (e: any) {
      if (e.message?.includes("403")) setError("Abonnement PRO_IA requis pour cette fonctionnalité.");
      else setError("Erreur lors de l'analyse : " + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loadingConfig) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-3xl">🧮</span> NovaContab IA
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Calculez votre chiffre d'affaires exact pour l'URSSAF et anticipez vos cotisations.
          </p>
        </div>
        {isNovaActive && (
          <IaHistoryPanel type="NOVACONTAB" onRestore={onRestoreHistory} refreshKey={historyKey} />
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* ── 1. Sélecteur de période ────────────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">1. Période à déclarer</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-1">Année</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none min-w-[100px]">
              {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-white/40 mb-1">Type de déclaration</label>
            <select value={periodType} onChange={e => setPeriodType(e.target.value as any)} className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none">
              <option value="MONTH">Mensuelle</option>
              <option value="QUARTER">Trimestrielle</option>
            </select>
          </div>
          {periodType === "MONTH" ? (
            <div>
              <label className="block text-[10px] uppercase text-white/40 mb-1">Mois</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none min-w-[120px]">
                <option value="1">Janvier</option><option value="2">Février</option><option value="3">Mars</option>
                <option value="4">Avril</option><option value="5">Mai</option><option value="6">Juin</option>
                <option value="7">Juillet</option><option value="8">Août</option><option value="9">Septembre</option>
                <option value="10">Octobre</option><option value="11">Novembre</option><option value="12">Décembre</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] uppercase text-white/40 mb-1">Trimestre</label>
              <select value={quarter} onChange={e => setQuarter(e.target.value)} className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none min-w-[120px]">
                <option value="1">T1 (Jan-Mar)</option><option value="2">T2 (Avr-Juin)</option>
                <option value="3">T3 (Juil-Sep)</option><option value="4">T4 (Oct-Déc)</option>
              </select>
            </div>
          )}
          <button onClick={fetchReport} disabled={loadingReport} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all h-[38px]">
            {loadingReport ? "Calcul..." : "Calculer le CA encaissé"}
          </button>
        </div>
      </div>

      {/* ── 2. Données brutes (Tous forfaits) ─────────────────────────────────── */}
      {report && !analysis && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07]">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest flex justify-between items-center">
              <span>2. Chiffres à déclarer</span>
              <span className="text-xs text-emerald-400 normal-case bg-emerald-500/10 px-2 py-1 rounded">Basé sur {report.ordersCount} commandes encaissées</span>
            </h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-white/40 mb-2">CA Total Encaissé sur la période</p>
              <p className="text-4xl font-black text-emerald-400 mb-4">{fmt(report.revenue.totalCents)}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-white">Restauration sur place</p>
                    <p className="text-[10px] text-white/30">Prestations de services</p>
                  </div>
                  <p className="text-lg font-bold text-white">{fmt(report.revenue.onSiteCents)}</p>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-white">Vente à emporter / Livraison</p>
                    <p className="text-[10px] text-white/30">Ventes de marchandises</p>
                  </div>
                  <p className="text-lg font-bold text-white">{fmt(report.revenue.takeAwayCents)}</p>
                </div>
              </div>
            </div>

            {/* Encadré d'action */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5 flex flex-col justify-center">
              {isNovaActive ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-orange-400 mb-1 flex items-center gap-2">✨ Analyse URSSAF IA</h3>
                    <p className="text-xs text-white/50">Complétez vos infos pour laisser Nova IA estimer vos cotisations et vérifier vos seuils de TVA.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-white/40 mb-1">Statut</label>
                      <select value={legalStatus} onChange={e => setLegalStatus(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500 outline-none">
                        <option value="MICRO">Micro-entreprise</option>
                        <option value="SASU">SASU / SAS</option>
                        <option value="EURL">EURL / SARL</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-white/40 mb-1">Régime TVA</label>
                      <select value={taxRegime} onChange={e => setTaxRegime(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500 outline-none">
                        <option value="FRANCHISE">Franchise (Non assujetti)</option>
                        <option value="REEL_SIMPLIFIE">Réel Simplifié</option>
                        <option value="REEL_NORMAL">Réel Normal</option>
                      </select>
                    </div>
                  </div>
                  
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (ex: Achat d'un frigo ce mois-ci, TVA à déduire...)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500 outline-none" />

                  <button onClick={runNovaAnalysis} disabled={analyzing} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                    {analyzing ? "Analyse en cours..." : "✨ Estimer mes cotisations & TVA"}
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2"><span>✨</span> Automatisez vos impôts</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    L'abonnement <strong className="text-white/80">Nova+</strong> vous donne accès à NovaContab IA qui estime automatiquement vos cotisations URSSAF selon votre statut (Micro, SASU, etc.), surveille vos seuils de TVA (franchise) et vous conseille sur l'optimisation fiscale de votre mois.
                  </p>
                  <a href="mailto:contact@novavivo.online?subject=Demande démo NovaContab IA" className="inline-block mt-2 px-6 py-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl text-sm font-bold transition-all">
                    Découvrir NovaContab IA →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Rapport IA ─────────────────────────────────────────────────────── */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-2">Diagnostic NovaContab</h2>
            <p className="text-white text-lg font-medium leading-relaxed">{analysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* URSSAF Panel */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">🏛️ Cotisations URSSAF</h3>
              <div className="mb-6">
                <p className="text-xs text-white/40">Montant estimé à payer</p>
                <p className="text-3xl font-black text-red-400">~{analysis.urssaf.estimatedContributions.toFixed(2)} €</p>
                <p className="text-[10px] text-white/30 mt-1">sur {analysis.urssaf.totalRevenueToDeclare.toFixed(2)} € de CA déclaré</p>
              </div>

              <div className="space-y-3">
                {analysis.urssaf.breakdown.map((b, i) => (
                  <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white/80">{b.category}</p>
                      <p className="text-[10px] text-white/40">CA : {b.revenue.toFixed(2)} € · Taux : {b.ratePercent}%</p>
                    </div>
                    <p className="text-sm font-bold text-red-300">~{b.contribution.toFixed(2)} €</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TVA Panel */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">🧾 Statut TVA</h3>
              <div className="mb-6">
                <p className="text-xs text-white/40">Régime détecté</p>
                <p className="text-xl font-bold text-blue-400">{analysis.vat.status}</p>
                {analysis.vat.estimatedToPay > 0 && (
                  <p className="text-sm text-white/60 mt-1">TVA nette estimée : <strong className="text-white">~{analysis.vat.estimatedToPay.toFixed(2)} €</strong></p>
                )}
              </div>

              {analysis.vat.alert ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-xs font-bold text-amber-400 mb-1">⚠️ Alerte TVA</p>
                  <p className="text-sm text-amber-100/80 leading-relaxed">{analysis.vat.alert}</p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs font-bold text-emerald-400 mb-1">✅ Pas d'alerte TVA</p>
                  <p className="text-sm text-white/50">Votre situation semble stable concernant les seuils de TVA.</p>
                </div>
              )}
            </div>
          </div>

          {/* Conseils fiscaux */}
          {analysis.tips.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">💡 Conseils de l'expert</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.tips.map((t, i) => (
                  <div key={i} className="p-4 border border-white/10 rounded-xl bg-black/20">
                    <p className="text-sm font-bold text-orange-300 mb-1">{t.title}</p>
                    <p className="text-xs text-white/60 leading-relaxed">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <button onClick={() => { setAnalysis(null); setReport(null); }} className="text-sm px-4 py-2 text-white/40 hover:text-white transition-colors">
              Faire une nouvelle analyse
            </button>
          </div>
        </div>
      )}

    </div>
  );
}