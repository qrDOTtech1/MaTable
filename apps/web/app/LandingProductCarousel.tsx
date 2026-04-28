"use client";

import { useEffect, useState } from "react";

const slides = [
  { id: "cuisine", label: "Cuisine", kicker: "Les tickets papier ont eu leur chance.", title: "Trois colonnes. Zéro excuse.", desc: "Reçues, en préparation, servies. La brigade voit tout, tout de suite." },
  { id: "serveur", label: "Salle", kicker: "La table 12 veut l'addition. Pas une pièce de théâtre.", title: "Serveur assigné. Addition visible.", desc: "Chaque table affiche son statut, son serveur, son mode de paiement et l'action suivante." },
  { id: "caisse", label: "Caisse", kicker: "Encaisser ne devrait pas ressembler à une enquête policière.", title: "Carte, espèces, comptoir.", desc: "La demande d'addition remonte en direct. Le paiement ferme la session proprement." },
  { id: "stats", label: "Stats", kicker: "Votre instinct est utile. Les chiffres gagnent.", title: "CA, ticket moyen, top plats.", desc: "Vous savez ce qui marche, qui performe, et ce qui doit sortir de la carte." },
  { id: "stock", label: "Stock", kicker: "Le plat star en rupture à 21h14. Magnifique. Plus jamais.", title: "Stock faible. Rupture. Réassort.", desc: "Les quantités et alertes sont visibles depuis la gestion menu, au même endroit que vos plats." },
];

function KitchenMockup() {
  const columns = [
    { title: "Reçues", orders: [{ table: 4, items: ["2x Burger maison", "1x Frites"], total: "33.00 €" }, { table: 8, items: ["1x Salade César"], total: "14.00 €" }] },
    { title: "En préparation", orders: [{ table: 2, items: ["3x Tiramisu", "2x Café"], total: "28.50 €" }] },
    { title: "Servies", orders: [{ table: 7, items: ["1x Entrecôte", "1x Vin rouge"], total: "42.00 €" }] },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 min-w-[620px]">
      {columns.map((col) => (
        <div key={col.title}>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">{col.title}</h4>
          <div className="space-y-2">
            {col.orders.map((order) => (
              <div key={`${col.title}-${order.table}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <strong>Table {order.table}</strong>
                  <span className="text-xs text-slate-400">19:4{order.table}</span>
                </div>
                <ul className="space-y-1 text-sm text-slate-600">
                  {order.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <div className="mt-3 text-sm font-semibold">Total : {order.total}</div>
                <div className="mt-3 rounded-xl bg-orange-500 px-3 py-2 text-center text-xs font-bold text-white">Action suivante</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TablesMockup() {
  const tables = [
    { n: 4, state: "Occupée", badge: "Addition demandée · CASH", server: "Nina", active: true },
    { n: 8, state: "Libre", badge: "4 couverts", server: "—", active: false },
    { n: 12, state: "Occupée", badge: "Serveur appelé", server: "Adam", active: true },
    { n: 3, state: "Occupée", badge: "CARD · +4.00 € pourboire", server: "Maya", active: true },
  ];
  return (
    <div className="grid min-w-[620px] grid-cols-4 gap-3">
      {tables.map((table) => (
        <div key={table.n} className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${table.active ? "border-green-200" : "border-slate-100"}`}>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-xl font-bold">Table {table.n}</div>
              <div className="text-xs text-slate-400">{table.n % 2 ? 2 : 4} couverts</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${table.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{table.state}</span>
          </div>
          <div className="mb-3 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{table.badge}</div>
          <div className="mb-3 text-xs text-slate-500">Serveur : <strong>{table.server}</strong></div>
          <div className="space-y-1.5">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700">Reset session</div>
            {table.active && <div className="rounded-xl bg-orange-500 px-3 py-2 text-center text-xs font-bold text-white">Encaisser</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CashierMockup() {
  return (
    <div className="grid min-w-[620px] grid-cols-[1.1fr_0.9fr] gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-bold">Table 4</h4>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Addition demandée</span>
        </div>
        {["Burger maison", "Frites maison", "Eau pétillante", "Tiramisu"].map((item, i) => (
          <div key={item} className="flex justify-between border-b border-slate-100 py-2 text-sm">
            <span>{i === 1 ? "2x " : "1x "}{item}</span>
            <strong>{[14, 10, 3.5, 7][i].toFixed(2)} €</strong>
          </div>
        ))}
        <div className="mt-4 flex items-end justify-between">
          <span className="text-sm text-slate-500">Total à encaisser</span>
          <span className="text-4xl font-extrabold">34.50 €</span>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-4 font-bold">Mode de paiement</h4>
        {[
          ["Carte", "Session fermée auto"],
          ["Caisse", "Validation comptoir"],
          ["Espèces", "Marquer payé"],
        ].map(([mode, desc], i) => (
          <div key={mode} className={`mb-2 rounded-xl border px-4 py-3 ${i === 1 ? "border-orange-300 bg-orange-50" : "border-slate-200"}`}>
            <div className="font-semibold">{mode}</div>
            <div className="text-xs text-slate-500">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsMockup() {
  return (
    <div className="min-w-[620px] space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[ ["Chiffre d'affaires", "1 847.00 €"], ["Commandes", "47"], ["Ticket moyen", "39.30 €"] ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-3 font-bold">Top 10 plats</h4>
          {["Burger maison (18)", "Tiramisu (11)", "Salade César (9)"].map((item, i) => (
            <div key={item} className="mb-2 flex justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <span>{item}</span><strong>{[252, 77, 126][i].toFixed(2)} €</strong>
            </div>
          ))}
        </div>
        <div>
          <h4 className="mb-3 font-bold">Par serveur</h4>
          {["Nina", "Adam", "Maya"].map((name, i) => (
            <div key={name} className="mb-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
              <div className="font-medium">{name}</div>
              <div className="text-slate-600">{[16, 13, 9][i]} commandes · {[624, 511, 302][i].toFixed(2)} €</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StockMockup() {
  return (
    <div className="min-w-[620px] space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 grid grid-cols-4 gap-2">
          <div className="col-span-2"><div className="text-xs text-slate-500">Nom</div><div className="rounded border px-2 py-1">Burger maison</div></div>
          <div><div className="text-xs text-slate-500">Quantité</div><div className="rounded border px-2 py-1">7</div></div>
          <div><div className="text-xs text-slate-500">Alerte si ≤</div><div className="rounded border px-2 py-1">10</div></div>
        </div>
        <div className="rounded-xl bg-orange-500 px-4 py-2 text-center text-sm font-bold text-white">Enregistrer</div>
      </div>
      {[
        ["Burger maison", "Stock faible (7)", "14.00 €", "amber"],
        ["Tiramisu", "Rupture", "7.00 €", "red"],
        ["Salade César", "24", "12.00 €", "slate"],
      ].map(([name, badge, price, tone]) => (
        <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-medium">
                {name}
                <span className={`rounded px-1.5 py-0.5 text-xs ${tone === "red" ? "bg-red-100 text-red-700" : tone === "amber" ? "bg-amber-100 text-amber-700" : "text-slate-400"}`}>{badge}</span>
              </div>
              <div className="text-sm font-semibold">{price}</div>
            </div>
            <div className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Réassort</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveMockup({ id }: { id: string }) {
  if (id === "serveur") return <TablesMockup />;
  if (id === "caisse") return <CashierMockup />;
  if (id === "stats") return <StatsMockup />;
  if (id === "stock") return <StockMockup />;
  return <KitchenMockup />;
}

export default function LandingProductCarousel() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  useEffect(() => {
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), 11000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="demo" className="border-y border-white/10 bg-[#0a0a0a] px-4 py-20 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 inline-block -rotate-2 border-4 border-white px-6 py-2 text-sm font-black uppercase tracking-[0.25em] md:text-xl text-white">Le vrai tableau de bord</div>
          <h2 className="text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] md:text-8xl text-white">
            Pas des slides.<br />Des écrans qui bossent.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-xl font-black leading-tight md:text-3xl text-white/80">
            Cuisine, salle, caisse, stats, stock. Tout ce que vous ouvrez pendant le service. Pas après. Pas demain. Maintenant.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
          <div className="rounded-[2rem] border-4 border-black bg-black p-6 text-white shadow-[12px_12px_0_rgba(0,0,0,0.25)]">
            <div className="mb-6 text-xs font-black uppercase tracking-[0.35em] text-orange-400">{slide.label}</div>
            <p className="text-2xl font-black leading-tight text-slate-400 md:text-3xl">{slide.kicker}</p>
            <h3 className="mt-5 text-4xl font-black uppercase leading-none text-orange-500 md:text-6xl">{slide.title}</h3>
            <p className="mt-5 text-lg font-bold leading-snug text-white md:text-xl">{slide.desc}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`rounded-full border-2 px-4 py-2 text-xs font-black uppercase transition ${i === active ? "border-orange-500 bg-orange-500 text-black" : "border-white/20 text-white/50 hover:border-white/50"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border-4 border-black bg-slate-50 p-4 text-slate-900 shadow-[12px_12px_0_rgba(0,0,0,0.25)] md:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xl font-bold">A table !</div>
                <div className="text-xs text-slate-500">Dashboard restaurateur · démo visuelle</div>
              </div>
              <div className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white">En direct</div>
            </div>
            <div className="overflow-x-auto pb-2">
              <ActiveMockup id={slide.id} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
