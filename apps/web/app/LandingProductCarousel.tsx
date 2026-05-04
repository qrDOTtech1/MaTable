"use client";

import { useEffect, useState } from "react";

const slides = [
  { id: "cuisine", label: "Cuisine", kicker: "Les tickets papier ont eu leur chance.", title: "Trois colonnes. Zéro excuse.", desc: "Reçues, en préparation, servies. La brigade voit tout, tout de suite." },
  { id: "serveur", label: "Salle", kicker: "La table 12 veut l'addition. Pas une pièce de théâtre.", title: "Serveur assigné. Addition visible.", desc: "Chaque table affiche son statut, son serveur, son mode de paiement et l'action suivante." },
  { id: "caisse", label: "Caisse", kicker: "Encaisser ne devrait pas ressembler à une enquête policière.", title: "Carte, espèces, comptoir.", desc: "La demande d'addition remonte en direct. Le paiement ferme la session proprement." },
  { id: "stats", label: "Stats", kicker: "Votre instinct est utile. Les chiffres gagnent.", title: "CA, ticket moyen, top plats.", desc: "Vous savez ce qui marche, qui performe, et ce qui doit sortir de la carte." },
  { id: "stock", label: "Stock", kicker: "Le plat star en rupture à 21h14. Magnifique. Plus jamais.", title: "Stock faible. Rupture. Réassort.", desc: "Les quantités et alertes sont visibles depuis la gestion menu, au même endroit que vos plats." },
  { id: "reservations", label: "Réservations", kicker: "Les no-shows vous coûtent 3 000€/an en moyenne.", title: "Arrhes. Confirmation. Anti no-show.", desc: "Créneaux dynamiques, arrhes Stripe automatiques, confirmation SMS. La réservation blindée." },
  { id: "avis", label: "Avis", kicker: "Un client content qui ne laisse pas d'avis, c'est invisible.", title: "QR → Avis → Google. Automatique.", desc: "Campagne QR sur table, rédaction IA, bons de réduction pour les contributeurs. Seuls ceux qui paient notent." },
  { id: "nova", label: "Nova IA", kicker: "Votre second qui ne dort jamais et qui ne se trompe jamais.", title: "Tomates en trop ? Menu suggéré.", desc: "Nova analyse vos stocks, prédit vos marges, rédige vos descriptions et génère vos plats du jour." },
  { id: "menu", label: "Menu", kicker: "Votre carte doit parler 9 langues sans que vous n'en parliez une.", title: "QR. Multilingue. En 2 minutes.", desc: "Menu digital avec photos, allergènes auto, traduction IA et catégories drag & drop." },
];

function KitchenMockup() {
  const columns = [
    { title: "Reçues", color: "bg-orange-50", orders: [{ table: 4, time: "19:44", items: ["2x Burger maison", "1x Frites"], total: "33.00 €" }, { table: 8, time: "19:48", items: ["1x Salade César"], total: "14.00 €" }] },
    { title: "En préparation", color: "bg-amber-50", orders: [{ table: 2, time: "19:38", items: ["3x Tiramisu", "2x Café"], total: "28.50 €" }] },
    { title: "Servies", color: "bg-green-50", orders: [{ table: 7, time: "19:22", items: ["1x Entrecôte", "1x Vin rouge"], total: "42.00 €" }] },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 min-w-[620px]">
      {columns.map((col) => (
        <div key={col.title}>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">{col.title}</h4>
          <div className="space-y-2">
            {col.orders.map((order) => (
              <div key={`${col.title}-${order.table}`} className={`rounded-2xl border border-slate-200 ${col.color} p-4 shadow-sm`}>
                <div className="mb-2 flex items-center justify-between">
                  <strong>Table {order.table}</strong>
                  <span className="text-xs text-slate-400">{order.time}</span>
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

function ReservationsMockup() {
  const slots = [
    { time: "12:00", name: "Dupont M.", covers: 4, status: "confirmed", deposit: "20.00 €", phone: "+33 6 12 34 56 78" },
    { time: "12:30", name: "Garcia L.", covers: 2, status: "pending", deposit: "—", phone: "+33 7 65 43 21 09" },
    { time: "13:00", name: "Martin J.", covers: 6, status: "confirmed", deposit: "30.00 €", phone: "+33 6 98 76 54 32" },
    { time: "19:30", name: "Bernard S.", covers: 3, status: "cancelled", deposit: "Retenu", phone: "+33 7 11 22 33 44" },
    { time: "20:00", name: "Petit A.", covers: 8, status: "confirmed", deposit: "50.00 €", phone: "+33 6 55 66 77 88" },
  ];
  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    confirmed: { label: "Confirmée", bg: "bg-green-100", text: "text-green-700" },
    pending: { label: "En attente", bg: "bg-amber-100", text: "text-amber-700" },
    cancelled: { label: "No-show", bg: "bg-red-100", text: "text-red-700" },
  };
  return (
    <div className="min-w-[620px] space-y-3">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Aujourd'hui</div>
          <div className="text-2xl font-bold">12 réservations</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Couverts réservés</div>
          <div className="text-2xl font-bold">38 couverts</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="text-sm text-green-600">Arrhes encaissées</div>
          <div className="text-2xl font-bold text-green-700">320.00 €</div>
        </div>
      </div>
      {slots.map((s) => {
        const st = statusMap[s.status];
        return (
          <div key={s.time + s.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-orange-500 w-14">{s.time}</div>
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-slate-500">{s.covers} couverts · {s.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Arrhes</div>
                <div className="text-sm font-semibold">{s.deposit}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.bg} ${st.text}`}>{st.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AvisMockup() {
  const reviews = [
    { name: "Sophie M.", stars: 5, text: "Service impeccable, le burger était incroyable. L'addition est arrivée...", time: "il y a 2h", verified: true, tip: "3.00 €" },
    { name: "Pierre L.", stars: 4, text: "Très bon rapport qualité/prix. Le tiramisu est à tomber.", time: "il y a 5h", verified: true, tip: "5.00 €" },
    { name: "Claire D.", stars: 5, text: "Meilleure expérience restaurant depuis longtemps. Tout est fluide...", time: "hier", verified: true, tip: "—" },
  ];
  return (
    <div className="min-w-[620px] space-y-3">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Note moyenne</div>
          <div className="text-3xl font-bold">4.8 <span className="text-lg text-amber-400">★</span></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Avis ce mois</div>
          <div className="text-3xl font-bold">47</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Taux de réponse</div>
          <div className="text-3xl font-bold text-green-600">92%</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Pourboires IA</div>
          <div className="text-3xl font-bold text-orange-500">+34%</div>
        </div>
      </div>
      {reviews.map((r) => (
        <div key={r.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                {r.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.name}</span>
                  {r.verified && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">Vérifié</span>}
                </div>
                <div className="text-xs text-slate-400">{r.time}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-400">{"★".repeat(r.stars)}</span>
              {r.tip !== "—" && <span className="ml-2 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">Tip {r.tip}</span>}
            </div>
          </div>
          <p className="text-sm text-slate-600">{r.text}</p>
          <div className="mt-3 flex gap-2">
            <div className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-bold text-white">Répondre avec IA</div>
            <div className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">Publier sur Google</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NovaMockup() {
  return (
    <div className="min-w-[620px] space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {/* Chat */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
          <h4 className="mb-3 font-bold text-purple-700 flex items-center gap-2">
            <span className="text-lg">🧠</span> Nova Assistant
          </h4>
          <div className="space-y-3">
            <div className="bg-white rounded-xl rounded-tl-none p-3 text-sm border border-slate-200">
              J'ai 3kg de tomates et 500g de mozzarella qui arrivent à expiration.
            </div>
            <div className="bg-purple-100 rounded-xl rounded-tr-none p-3 text-sm border border-purple-200 ml-4">
              <p className="font-medium text-purple-800 mb-1">✨ 2 plats suggérés :</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Caprese revisitée — marge <strong>84%</strong></li>
                <li>• Bruschetta duo tomate — marge <strong>79%</strong></li>
              </ul>
              <p className="text-xs text-purple-600 mt-2">Ajouter à la carte ?</p>
            </div>
            <div className="flex gap-2">
              <div className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white">Oui, publier</div>
              <div className="rounded-xl border border-purple-300 px-3 py-1.5 text-xs font-semibold text-purple-600">Modifier</div>
            </div>
          </div>
        </div>
        {/* Modules grid */}
        <div className="space-y-3">
          {[
            { icon: "🍷", name: "Sommelier", desc: "3 accords suggérés", status: "Actif", color: "amber" },
            { icon: "📦", name: "Stock", desc: "2 alertes frais", status: "1 alerte", color: "red" },
            { icon: "💹", name: "Finance", desc: "Food cost: 28.4%", status: "Optimal", color: "green" },
            { icon: "🧮", name: "Contab", desc: "Export TVA prêt", status: "Prêt", color: "blue" },
          ].map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <div className="font-medium">Nova {m.name}</div>
                  <div className="text-xs text-slate-500">{m.desc}</div>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                m.color === "green" ? "bg-green-100 text-green-700" :
                m.color === "red" ? "bg-red-100 text-red-700" :
                m.color === "blue" ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
              }`}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuMockup() {
  const items = [
    { name: "Burger Maison", price: "14.00 €", cat: "Plats", allergens: ["Gluten", "Lait", "Sésame"], langs: 9, img: "🍔" },
    { name: "Salade César", price: "12.00 €", cat: "Entrées", allergens: ["Gluten", "Œuf", "Lait"], langs: 9, img: "🥗" },
    { name: "Tiramisu", price: "7.00 €", cat: "Desserts", allergens: ["Gluten", "Lait", "Œuf"], langs: 9, img: "🍰" },
    { name: "Vin Rouge Bordeaux", price: "6.50 €", cat: "Boissons", allergens: ["Sulfites"], langs: 9, img: "🍷" },
  ];
  return (
    <div className="min-w-[620px] space-y-3">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-center">
          <div className="text-sm text-slate-500">Articles</div>
          <div className="text-2xl font-bold">34</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-center">
          <div className="text-sm text-slate-500">Catégories</div>
          <div className="text-2xl font-bold">6</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-center">
          <div className="text-sm text-slate-500">Langues</div>
          <div className="text-2xl font-bold text-orange-500">9</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3 shadow-sm text-center">
          <div className="text-sm text-green-600">QR actifs</div>
          <div className="text-2xl font-bold text-green-700">18</div>
        </div>
      </div>
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">{item.img}</div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {item.name}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{item.cat}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {item.allergens.map((a) => (
                  <span key={a} className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">{a}</span>
                ))}
                <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">{item.langs} langues</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{item.price}</div>
            <div className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 mt-1">Modifier</div>
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
  if (id === "reservations") return <ReservationsMockup />;
  if (id === "avis") return <AvisMockup />;
  if (id === "nova") return <NovaMockup />;
  if (id === "menu") return <MenuMockup />;
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
            Cuisine, salle, caisse, stats, stock, réservations, avis, IA, menu. Tout ce que vous ouvrez pendant le service.
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
