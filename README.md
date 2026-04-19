# A table !

SaaS de commande par QR code en salle. Les clients scannent le QR collé à leur table, accèdent au menu, commandent et payent via Stripe — sans créer de compte. Le restaurateur gère ses tables, son menu et voit les commandes en temps réel depuis un dashboard.

## Architecture

Monorepo npm workspaces :

```
apps/
  api/    Fastify + Socket.io + Prisma
  web/    Next.js 14 (App Router) — dashboard + page client /order/[tableUuid]
packages/
  db/     Schéma Prisma + migrations + seed
```

## Démarrage local

```bash
npm install
cp .env.example .env       # renseigner DATABASE_URL + JWT_SECRET + STRIPE_*
npm run db:migrate
npm run db:seed
npm run dev                # api sur :3001, web sur :3000
```

Dashboard pro : http://localhost:3000/dashboard (login seedé `demo@atable.fr` / `demo1234`).
Page client exemple : http://localhost:3000/order/<TABLE_UUID>.

## Déploiement Railway

Trois services : `web`, `api`, `postgres`. Dockerfile multi-stage à la racine, `railway.json` décrit les commandes de build et de démarrage. Variables à définir : `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_WEB_URL`, `API_URL`.

## Sécurité — modèle de session

Aucun verrou IP. La session client est un JWT signé, stocké en `localStorage`, qui porte `{ sessionId, tableId, restaurantId }`. Au paiement (webhook Stripe `checkout.session.completed`), la `TableSession` passe `active = false` et le token devient invalide. Le restaurateur dispose d'un bouton **Reset Table** pour forcer la fermeture d'une session suspecte.
