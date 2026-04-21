"use client";

import { useState } from "react";
import { DashboardLayout, Table, Badge, Button, Modal, Input, Card } from "@/components/ui";

interface Staff {
  id: string;
  name: string;
  role: "waiter" | "chef" | "manager";
  email: string;
  phone: string;
  status: "active" | "inactive";
  joinDate: string;
  points: number;
  level: number;
}

const MOCK_STAFF: Staff[] = [
  {
    id: "1",
    name: "Pierre Dupont",
    role: "waiter",
    email: "pierre@example.com",
    phone: "+33 6 12 34 56 78",
    status: "active",
    joinDate: "2024-01-15",
    points: 1250,
    level: 12,
  },
  {
    id: "2",
    name: "Marie Martin",
    role: "waiter",
    email: "marie@example.com",
    phone: "+33 6 23 45 67 89",
    status: "active",
    joinDate: "2024-02-20",
    points: 980,
    level: 9,
  },
  {
    id: "3",
    name: "Chef Laurent",
    role: "chef",
    email: "laurent@example.com",
    phone: "+33 6 34 56 78 90",
    status: "active",
    joinDate: "2023-11-01",
    points: 2100,
    level: 18,
  },
  {
    id: "4",
    name: "Sophie Bernard",
    role: "manager",
    email: "sophie@example.com",
    phone: "+33 6 45 67 89 01",
    status: "active",
    joinDate: "2023-06-10",
    points: 1500,
    level: 15,
  },
];

export default function ServeursDashboard() {
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: 0 },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: staff.length },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  const roleIcons = {
    waiter: "🎩",
    chef: "👨‍🍳",
    manager: "📊",
  };

  const roleLabels = {
    waiter: "Serveur",
    chef: "Chef",
    manager: "Manager",
  };

  return (
    <DashboardLayout
      activeTabId="serveurs"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName="Restaurant La Bella Vista"
      title="Serveurs et staff"
    >
      <div className="space-y-6">
        {/* NovaTech Gamification Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <Card variant="default" className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🏆 Nova Leaderboard
                </h3>
                <span className="text-xs text-white/40 uppercase tracking-widest">Top Performance</span>
              </div>
              <div className="space-y-3">
                {staff
                  .sort((a, b) => b.points - a.points)
                  .map((member, idx) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? "bg-yellow-500/20 text-yellow-500" : 
                        idx === 1 ? "bg-slate-300/20 text-slate-300" : 
                        idx === 2 ? "bg-orange-700/20 text-orange-700" : "bg-white/10 text-white/40"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="text-xs text-white/40">Niveau {member.level}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-400">{member.points} pts</div>
                        <div className="text-[10px] text-emerald-400">+{Math.floor(Math.random() * 100)} ce shift</div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Daily Quests */}
          <div className="lg:col-span-1">
            <Card variant="default" className="h-full border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🪄 Quêtes IA
                </h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-orange-500/20 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-orange-400 mb-1 uppercase">Objectif Volume</div>
                    <div className="text-sm text-white mb-2">Vendre 5 bouteilles de vin blanc (stock élevé).</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full w-3/5"></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-white/40">3/5 vendus</span>
                      <span className="text-[10px] font-bold text-orange-400">+150 XP</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-emerald-500/20 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-emerald-400 mb-1 uppercase">Objectif Qualité</div>
                    <div className="text-sm text-white mb-2">Obtenir 3 notes de 5 étoiles sur les commandes.</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-1/3"></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-white/40">1/3 avis</span>
                      <span className="text-[10px] font-bold text-emerald-400">+300 XP</span>
                    </div>
                  </div>
                </div>

                <Button variant="secondary" className="w-full text-xs py-2 bg-white/5 border-white/10 hover:bg-white/10">
                  Générer de nouveaux défis (IA)
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Équipe</h2>
            <p className="text-white/50">{staff.length} membre(s)</p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ Ajouter un membre</Button>
        </div>

        {/* Staff Table */}
        <Table
          columns={[
            { header: "Nom", key: "name", width: "25%", render: (value) => <span className="font-semibold">{value}</span> },
            {
              header: "Fonction",
              key: "role",
              width: "18%",
              render: (value: string) => (
                <span className="text-sm">
                  {roleIcons[value as keyof typeof roleIcons]} {roleLabels[value as keyof typeof roleLabels]}
                </span>
              ),
            },
            { header: "Email", key: "email", width: "22%" },
            { header: "Téléphone", key: "phone", width: "18%" },
            {
              header: "Statut",
              key: "status",
              width: "12%",
              render: (value) => (
                <Badge variant={value === "active" ? "served" : "pending"}>
                  {value === "active" ? "✅ Actif" : "⏸️ Inactif"}
                </Badge>
              ),
            },
          ]}
          data={staff}
        />

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Ajouter un membre"
          footer={{
            secondary: { label: "Annuler", onClick: () => setShowModal(false) },
            primary: { label: "Ajouter", onClick: () => setShowModal(false) },
          }}
        >
          <div className="space-y-4">
            <Input label="Nom complet" placeholder="Ex: Pierre Dupont" fullWidth />
            <Input label="Email" type="email" placeholder="pierre@example.com" fullWidth />
            <Input label="Téléphone" type="tel" placeholder="+33 6 12 34 56 78" fullWidth />
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-2">Fonction</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white">
                <option value="waiter">🎩 Serveur</option>
                <option value="chef">👨‍🍳 Chef</option>
                <option value="manager">📊 Manager</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
