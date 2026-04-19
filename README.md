# A table ! — Interface Web

Dashboard restaurateur + page client de commande par QR code.

## Démarrage local

```bash
npm install
npm run dev  # Next.js sur http://localhost:3000
```

## Déploiement Railway

Variables :
- `API_URL` = URL publique du service API (ex. `https://atable-api.up.railway.app`)
- `NEXT_PUBLIC_API_URL` = même URL
- `NODE_ENV` = `production`

Le Dockerfile lance `npm run start` qui démarre Next.js sur port `$PORT`.

## Architecture

- `/order/[tableUuid]` — page client (scanner QR, panier, commande)
- `/dashboard` — interface restaurateur
  - `/dashboard/live` — cuisine temps réel (Socket.io)
  - `/dashboard/tables` — gestion des tables
  - `/dashboard/menu` — gestion du menu
  - `/dashboard/print` — génération PDF QR codes
