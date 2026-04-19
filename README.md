# A table ! — Interface Web v1.0

> SaaS de commande par QR code en salle. Les clients scannent, commandent et payent depuis leur téléphone — sans app ni compte.

**Repo API :** [github.com/qrDOTtech1/MaTable-API](https://github.com/qrDOTtech1/MaTable-API)  
**Production web :** [matable-production-d7aa.up.railway.app](https://matable-production-d7aa.up.railway.app)

---

## Stack

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Style | Tailwind CSS 3 |
| Temps réel | Socket.io client |
| PDF / QR | jsPDF + qrcode |
| Auth | JWT Bearer (localStorage) |
| Déploiement | Railway (Dockerfile) |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page commerciale |
| `/register` | Inscription restaurateur |
| `/login` | Connexion restaurateur |
| `/dashboard` | Vue cuisine temps réel |
| `/dashboard/tables` | Gestion des tables |
| `/dashboard/menu` | Gestion du menu |
| `/dashboard/print` | Génération PDF des QR codes |
| `/order/[tableUuid]` | Page client (scan QR → commande) |

---

## Démarrage local

```bash
git clone https://github.com/qrDOTtech1/MaTable.git
cd MaTable
npm install

# Créer apps/web/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > apps/web/.env.local

npm run dev   # http://localhost:3000
```

L'API doit tourner en parallèle sur `:3001` ([voir MaTable-API](https://github.com/qrDOTtech1/MaTable-API)).

---

## Déploiement Railway

**Variables requises sur le service web :**

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://matable-api-production.up.railway.app` |
| `NODE_ENV` | `production` |

> ⚠️ `NEXT_PUBLIC_*` est baked au build — un **Redeploy** complet est nécessaire après tout changement de cette variable.

**Dockerfile :** multi-stage (`deps → build → runner`), `ARG NEXT_PUBLIC_API_URL` injecté au build.

---

## Architecture technique

```
apps/web/
├── app/
│   ├── page.tsx                  ← Landing page
│   ├── login/page.tsx            ← Auth
│   ├── register/page.tsx         ← Inscription
│   ├── dashboard/
│   │   ├── layout.tsx            ← Sidebar nav
│   │   ├── page.tsx              ← Live cuisine (Socket.io)
│   │   ├── tables/page.tsx       ← CRUD tables
│   │   ├── menu/page.tsx         ← CRUD menu
│   │   └── print/page.tsx        ← Génération QR PDF
│   └── order/[tableUuid]/
│       └── page.tsx              ← Page client
└── lib/
    └── api.ts                    ← Fetch wrapper + token localStorage
```

**Auth pro :** JWT Bearer stocké en `localStorage` (`atable_pro_token`), envoyé en header `Authorization: Bearer <token>`.  
**Session client :** JWT par table stocké en `localStorage` (`atable_session_<tableId>`), invalide dès paiement.  
**Panier :** Persisté en `localStorage` (`atable_cart_<tableId>`), survit au refresh.

---

## Contribuer

```bash
git checkout -b feature/ma-feature
# ... développer ...
git commit -m "feat: description"
git push origin feature/ma-feature
# Ouvrir une Pull Request
```
