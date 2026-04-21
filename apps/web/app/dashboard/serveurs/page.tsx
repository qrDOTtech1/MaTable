"use client";

import { useState } from "react";
import { DashboardLayout, Table, Badge, Button, Modal, Input } from "@/components/ui";

interface Staff {
  id: string;
  name: string;
  role: "waiter" | "chef" | "manager";
  email: string;
  phone: string;
  status: "active" | "inactive";
  joinDate: string;
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
  },
  {
    id: "2",
    name: "Marie Martin",
    role: "waiter",
    email: "marie@example.com",
    phone: "+33 6 23 45 67 89",
    status: "active",
    joinDate: "2024-02-20",
  },
  {
    id: "3",
    name: "Chef Laurent",
    role: "chef",
    email: "laurent@example.com",
    phone: "+33 6 34 56 78 90",
    status: "active",
    joinDate: "2023-11-01",
  },
  {
    id: "4",
    name: "Sophie Bernard",
    role: "manager",
    email: "sophie@example.com",
    phone: "+33 6 45 67 89 01",
    status: "active",
    joinDate: "2023-06-10",
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
