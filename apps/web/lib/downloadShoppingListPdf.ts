/**
 * Génère et télécharge la liste de courses en PDF avec branding MaTable.
 * Utilise l'API Print du navigateur via une fenêtre masquée — aucune dépendance npm.
 */

type ShopItem = {
  ingredient: string;
  estimatedNeeded: number;
  alreadyHave: number;
  toBuy: number;
  unit: string;
  priority: string;
  estimatedCost?: number;
  reason: string;
};

type FreshAlert = {
  product: string;
  expiresIn: string;
  qty: string;
  recommendation: string;
  affectedDishes: string[];
};

type Promotion = {
  item: string;
  reason: string;
  suggestedDiscount: string;
  urgency: string;
  action: string;
};

export interface ShoppingListPdfOptions {
  restaurantName?: string;
  shoppingList: ShopItem[];
  freshProductAlerts?: FreshAlert[];
  promotions?: Promotion[];
  supplierOrderNote?: string;
  costSavings?: string;
  totalShoppingBudget?: number;
  budget?: string;
  generatedAt?: Date;
}

const PRIORITY_LABEL: Record<string, string> = { HIGH: "URGENT", MEDIUM: "Moyen", LOW: "Faible" };
const PRIORITY_COLOR: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#6b7280" };

export function downloadShoppingListPdf(opts: ShoppingListPdfOptions) {
  const now     = opts.generatedAt ?? new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const high   = opts.shoppingList.filter(s => s.priority === "HIGH");
  const medium = opts.shoppingList.filter(s => s.priority === "MEDIUM");
  const low    = opts.shoppingList.filter(s => s.priority === "LOW" || !s.priority);

  const totalCost = opts.totalShoppingBudget
    ?? opts.shoppingList.reduce((sum, s) => sum + (s.estimatedCost ?? 0), 0);

  const renderRows = (items: ShopItem[]) => items.map(s => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111;">${s.ingredient}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">${s.alreadyHave} ${s.unit}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">${s.estimatedNeeded} ${s.unit}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:#ea580c;">${s.toBuy} ${s.unit}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#059669;font-weight:600;">${s.estimatedCost ? `~${s.estimatedCost}€` : "—"}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:11px;">${s.reason}</td>
    </tr>
  `).join("");

  const sectionHtml = (title: string, color: string, items: ShopItem[]) => items.length === 0 ? "" : `
    <div style="margin-bottom:4px;padding:6px 10px;background:${color};border-radius:4px;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.05em;text-transform:uppercase;">${title}</div>
    ${renderRows(items)}
  `;

  const freshSection = (!opts.freshProductAlerts?.length) ? "" : `
    <div style="margin-top:24px;">
      <h3 style="font-size:14px;font-weight:700;color:#dc2626;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
        🥬 Alertes produits frais — Action immédiate
      </h3>
      ${opts.freshProductAlerts!.map(f => `
        <div style="border:1px solid #fca5a5;background:#fff5f5;border-radius:6px;padding:10px 12px;margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <strong style="color:#111;">${f.product}</strong>
            <span style="background:#dc2626;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">⏱ ${f.expiresIn}</span>
          </div>
          <p style="margin:4px 0 2px;color:#dc2626;font-size:12px;font-weight:600;">${f.recommendation}</p>
          ${f.affectedDishes?.length ? `<p style="margin:0;color:#9ca3af;font-size:11px;">Plats : ${f.affectedDishes.join(", ")}</p>` : ""}
        </div>
      `).join("")}
    </div>
  `;

  const promoSection = (!opts.promotions?.length) ? "" : `
    <div style="margin-top:24px;">
      <h3 style="font-size:14px;font-weight:700;color:#7c3aed;margin-bottom:8px;">🏷️ Promotions recommandées</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${opts.promotions!.map(p => `
          <div style="border:1px solid #e9d5ff;background:#faf5ff;border-radius:6px;padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
              <strong style="color:#111;font-size:12px;">${p.item}</strong>
              <span style="color:#059669;font-weight:700;font-size:14px;">${p.suggestedDiscount}</span>
            </div>
            <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">${p.reason}</p>
            <p style="margin:0;color:#7c3aed;font-size:11px;font-weight:600;">${p.action}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Liste de courses — ${opts.restaurantName ?? "MaTable"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; background: #fff; }
    @page { margin: 15mm 12mm; size: A4; }
    @media print { .no-print { display: none !important; } }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
    th:not(:first-child) { text-align: center; }
  </style>
</head>
<body>
  <!-- En-tête branding -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 14px;border-bottom:3px solid #ea580c;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;background:#ea580c;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🍽️</div>
      <div>
        <div style="font-size:20px;font-weight:800;color:#ea580c;letter-spacing:-0.5px;">MaTable</div>
        <div style="font-size:10px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;">Nova Stock IA</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:16px;font-weight:700;color:#111;">${opts.restaurantName ?? "Mon restaurant"}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">📋 Liste de courses — ${dateStr} à ${timeStr}</div>
    </div>
  </div>

  <!-- Résumé budget -->
  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
    <div style="flex:1;min-width:140px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#ea580c;">${opts.shoppingList.length}</div>
      <div style="font-size:11px;color:#9a3412;">ingrédients à acheter</div>
    </div>
    <div style="flex:1;min-width:140px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#16a34a;">~${totalCost.toFixed(0)}€</div>
      <div style="font-size:11px;color:#15803d;">budget estimé total</div>
    </div>
    ${opts.budget ? `
    <div style="flex:1;min-width:140px;background:${totalCost > parseFloat(opts.budget) ? '#fef2f2' : '#f0fdf4'};border:1px solid ${totalCost > parseFloat(opts.budget) ? '#fecaca' : '#bbf7d0'};border-radius:8px;padding:12px 16px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:${totalCost > parseFloat(opts.budget) ? '#dc2626' : '#16a34a'};">${opts.budget}€</div>
      <div style="font-size:11px;color:#6b7280;">budget défini</div>
    </div>
    ` : ""}
    <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;text-align:center;">
      <div style="font-size:24px;font-weight:800;color:#dc2626;">${high.length}</div>
      <div style="font-size:11px;color:#6b7280;">achats urgents</div>
    </div>
  </div>

  <!-- Table liste de courses -->
  <h3 style="font-size:14px;font-weight:700;color:#111;margin-bottom:10px;">🛒 Liste de courses complète</h3>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Ingrédient</th>
        <th>En stock</th>
        <th>Besoin sem.</th>
        <th>À acheter</th>
        <th>Coût est.</th>
        <th style="text-align:left;">Pour</th>
      </tr>
    </thead>
    <tbody>
      ${sectionHtml("🔴 Priorité haute — Acheter en premier", "#dc2626", high)}
      ${sectionHtml("🟡 Priorité moyenne", "#d97706", medium)}
      ${sectionHtml("⚪ Priorité faible", "#6b7280", low)}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="padding:10px;font-weight:700;font-size:13px;border-top:2px solid #e5e7eb;">TOTAL ESTIMÉ</td>
        <td style="padding:10px;text-align:center;font-weight:800;font-size:15px;color:#059669;border-top:2px solid #e5e7eb;">~${totalCost.toFixed(0)}€</td>
        <td style="border-top:2px solid #e5e7eb;"></td>
      </tr>
    </tfoot>
  </table>

  ${freshSection}
  ${promoSection}

  <!-- Conseils fournisseur -->
  ${opts.supplierOrderNote ? `
  <div style="margin-top:24px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;">
    <strong style="color:#1d4ed8;font-size:12px;">🏪 Stratégie fournisseur</strong>
    <p style="margin:4px 0 0;color:#374151;font-size:12px;">${opts.supplierOrderNote}</p>
  </div>
  ` : ""}

  ${opts.costSavings ? `
  <div style="margin-top:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;">
    <strong style="color:#15803d;font-size:12px;">💡 Anti-gaspillage & économies</strong>
    <p style="margin:4px 0 0;color:#374151;font-size:12px;">${opts.costSavings}</p>
  </div>
  ` : ""}

  <!-- Pied de page -->
  <div style="margin-top:30px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:10px;color:#9ca3af;">Généré par Nova Stock IA · MaTable.pro · ${dateStr}</span>
    <span style="font-size:10px;color:#ea580c;font-weight:600;">matable.pro</span>
  </div>

  <!-- Bouton impression (masqué à l'impression) -->
  <div class="no-print" style="margin-top:20px;text-align:center;">
    <button onclick="window.print()" style="padding:12px 32px;background:#ea580c;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">
      🖨️ Imprimer / Enregistrer en PDF
    </button>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Autorisez les pop-ups pour télécharger le PDF."); return; }
  win.document.write(html);
  win.document.close();
  // Déclenche l'impression après le chargement complet
  win.onload = () => win.print();
}
