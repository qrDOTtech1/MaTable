# Changelog — A table ! Web

Toutes les modifications notables sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)

---

## [Unreleased] — v1.1 + v1.2 (en cours)

### Ajouté — Lot A : Menu enrichi
- **Photos plats** : champ `imageUrl`, affichage sur page client et vitrine publique.
- **Allergènes & régimes** : filtre par allergène / régime alimentaire sur page client, badges affichés.
- **Gestion des stocks** : colonne `stockQty` au dashboard, badge "Stock faible", décrément auto à la commande.
- **Modifications & variantes** : sélecteur cuisson, extras (bacon, double steak), sans oignons, etc. Impact sur prix.
- **Multi-langues menu** : champs de traduction par locale (EN, ES, IT, ...) au dashboard.

### Ajouté — Lot B : Expérience client
- **Avis plats** : formulaire post-paiement (1-5 étoiles + commentaire optionnel), moyenne affichée sur menu.
- **Serveurs** : attribution dynamique d'un serveur à la session, affichage en fin de repas, formulaire d'avis serveur.
- **Pourboires** : slider % + montant fixe lors du checkout Stripe, inclus dans l'addition.
- **Appel serveur** : bouton "Appeler un serveur" pendant la session, raison optionnelle, alerte temps réel dashboard.
- **Horaires d'ouverture (commande)** : sur la page client `/order/[tableUuid]`, le bouton "Commander" est désactivé si le restaurant est fermé selon les horaires configurés.
- **Zoom images (commande)** : clic sur la photo d'un plat pour l'agrandir (lightbox) sur `/order/[tableUuid]`.

### Ajouté — Lot C : Analytics & fiscalité
- **Dashboard analytiques** : `/dashboard/analytics` — CA, nombre de commandes, ticket moyen, top 10 plats, CA par jour/serveur.
- **Export Z journalier** : CSV téléchargeable (commandes payées, montants, mode de paiement, serveur, horodatage).

### Ajouté — Lot D : Infrastructure
- **Rôles utilisateurs** : préparation pour multi-utilisateurs par restaurant (`OWNER`, `MANAGER`, `STAFF`).
- **Paramètres restaurant** : `/dashboard/settings` — vitrine (description, adresse, téléphone), flags (avis, pourboire, appel serveur).

### Ajouté — Lot E : Vitrine publique
- **Page publique** `/r/[slug]` : détails resto (photo, description, adresse), menu public avec photos, note moyenne, derniers avis vérifiés.
- **Référencement** : slug unique par restaurant, meta tags OpenGraph.
- **URL propres `matable.pro/nomdurestaurant`** : route racine `app/[slug]/page.tsx` — chaque restaurateur obtient une URL courte sans préfixe `/r/`.
- **Zoom images** : clic sur la photo d'un plat pour l'agrandir (lightbox).
- **Redirection `/r/:slug` → `/:slug`** : rétrocompatibilité totale pour les anciens liens et QR codes imprimés.
- **Page de réservation** `/:slug/reserve` : formulaire date + couverts + créneaux dynamiques, paiement arrhes Stripe, confirmation email.
- **Dashboard layout** : lien "🌐 matable.pro/[slug]" en barre de nav + raccourci "Voir ma page publique ↗" en bas de sidebar.
- **Paramètres** : aperçu live de l'URL publique `matable.pro/[slug]` avec bouton copier, mis à jour au fil de la saisie du slug.

### Ajouté — Lot F : Réservations
- **Disponibilité slots** : calcul dynamique des créneaux libres en fonction des horaires, durée de repas, réservations existantes.
- **Création réservation** : `/r/[slug]/reserve` — date, heure, nombre de couverts, paiement arrhes Stripe si requis.
- **Gestion pro** : `/dashboard/reservations` — liste filtrée, changement de statut (confirmée, installée, honorée, no-show, annulée), assignation de table.

### Modifié
- **Dashboard layout** : sidebar élargi avec sections (Service, Contenu, Analyse, Config), liens vers toutes les nouvelles pages.
- **Menu dashboard** : enrichissement avec photos, allergens, diets, stock, modifier groups.
- **Page client** : filtre allergènes/régimes, photos des plats, modifier picker, service call button, tips slider, reviews post-payment.
- **Seed démo** : restaurant complet avec vitrine, horaires, 3 serveurs, 7 plats, allergens, stocks, modifiers.

## [Unreleased] — v1.0.x (socle billing antérieur)

### Modifié
- **Paiement** : le bouton client paie maintenant l'**addition de la session** (toutes les commandes non payées) au lieu de payer uniquement la dernière commande.

### Ajouté
- **Addition** : choix du mode de paiement côté client (Carte / Caisse / Espèces) + demande d'addition.
- **Tables (dashboard)** : affichage "Addition demandée" et bouton "Encaisser" pour clôturer une session payée hors Stripe.
- **Planning** : prise en compte des **horaires d'ouverture** (configurés dans les paramètres) pour désactiver la commande côté client quand le restaurant est fermé.

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
- **Upload photo** : le restaurateur peut importer une image (upload) au lieu de saisir une URL.
