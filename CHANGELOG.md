# Changelog — A table ! Web

Toutes les modifications notables sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Unreleased]

### Modifié
- **Paiement** : le bouton client paie maintenant l'**addition de la session** (toutes les commandes non payées) au lieu de payer uniquement la dernière commande.

### Ajouté
- **Addition** : choix du mode de paiement côté client (Carte / Caisse / Espèces) + demande d'addition.
- **Tables (dashboard)** : affichage "Addition demandée" et bouton "Encaisser" pour clôturer une session payée hors Stripe.

## [1.0.0] — 2026-04-19

### Première version publique — MVP complet

#### Ajouté
- **Landing page commerciale** : hero animé, mock UI client/cuisine, stats, features, CTA, footer
- **Inscription restaurateur** (`/register`) : création de compte + restaurant en une étape
- **Connexion** (`/login`) : JWT Bearer stocké en localStorage, pas de cookie cross-domain
- **Dashboard live** (`/dashboard`) : colonnes Kanban PENDING / COOKING / SERVED, mise à jour Socket.io temps réel
- **Gestion des tables** (`/dashboard/tables`) : ajout de tables, statut occupé/libre, bouton Reset Table
- **Gestion du menu** (`/dashboard/menu`) : CRUD complet, activation/désactivation par plat, catégories
- **Génération QR codes** (`/dashboard/print`) : PDF A4 multi-tables avec jsPDF + qrcode
- **Page client** (`/order/[tableUuid]`) : menu groupé par catégorie, panier, commande, paiement Stripe
- **Panier persistant** : survit au refresh grâce au localStorage
- **Déploiement Railway** : Dockerfile multi-stage, `ARG NEXT_PUBLIC_API_URL` injecté au build

#### Technique
- Next.js 14 App Router + Tailwind CSS
- Auth JWT Bearer (localStorage) — compatible cross-domain
- Socket.io client pour le dashboard temps réel
- `NEXT_PUBLIC_API_URL` baked au build via ARG Docker
