# BREVET D'INVENTION - INPI
# TITRE : SYSTÈME ET PROCÉDÉ DE GESTION RESTAURATEUR INTÉGRANT COMMANDE PAR QR CODE, TRAITEMENT EN TEMPS RÉEL, INTELLIGENCE ARTIFICIELLE ET PAIEMENT FRACTIONNÉ DYNAMIQUE

## DESCRIPTION

**1. Domaine de l'invention**
La présente invention concerne le domaine des systèmes informatiques de gestion pour la restauration. Plus particulièrement, l'invention se rapporte à un système de gestion unifié (SaaS) combinant un portail de commande client via QR code sans application ni compte, un portail de gestion temps réel pour les serveurs et la cuisine, un module d'intelligence artificielle pour l'analyse des stocks, l'optimisation financière et la génération de contenu, ainsi qu'un système de paiement fractionné dynamique.

**2. État de la technique antérieure**
Actuellement, les établissements de restauration utilisent une multitude d'outils disparates pour gérer leurs opérations : des terminaux de point de vente (POS) traditionnels, des applications tierces de réservation, des menus papier ou des QR codes menant à des PDF statiques, et des logiciels de comptabilité séparés. 

Les solutions de commande par QR code existantes imposent souvent le téléchargement d'une application ou la création d'un compte, générant des frictions pour le consommateur. Par ailleurs, la synchronisation entre la salle, la cuisine et la caisse souffre fréquemment de latence, nécessitant une intervention manuelle ou un rafraîchissement des écrans. Enfin, la gestion des stocks, la tarification (food cost) et l'optimisation des cartes reposent sur des calculs manuels fastidieux, rarement mis à jour en temps réel.

**3. Exposé de l'invention**
L'invention a pour but de pallier les inconvénients de l'état de l'art en proposant une plateforme globale et synchrone, caractérisée en ce qu'elle intègre :

- Un module client, accessible via un navigateur web mobile après scan d'un code optique (QR code) physiquement lié à une table, permettant la passation de commandes sans friction.
- Un module serveur et cuisine, fonctionnant par communication bidirectionnelle en temps réel (type WebSocket), garantissant l'affichage instantané des états de commande (reçue, en préparation, servie).
- Un module de traitement de l'addition et d'encaissement, permettant un paiement fractionné complexe (division égale ou par sélection d'articles) depuis le dispositif client, avec intégration des pourboires via incitation psychologique (UI).
- Un moteur d'Intelligence Artificielle (IA) couplé à la base de données centrale, configuré pour :
  - Analyser les photographies de plats pour en extraire les ingrédients, les allergènes et générer des descriptions textuelles (Magic Scan).
  - Calculer en temps réel le coût de revient (Food Cost) en croisant l'inventaire et les ventes.
  - Suggérer automatiquement des accords mets-vins et des articles complémentaires lors de la commande (Up-selling).
  - Générer des listes d'approvisionnement automatiques basées sur l'épuisement des stocks en temps réel.

**4. Description détaillée d'un mode de réalisation**
Le système selon l'invention comprend un serveur central hébergeant une base de données relationnelle et des services d'Intelligence Artificielle. Le serveur central communique via une API et des WebSockets avec :
a) Les terminaux clients (smartphones).
b) Les terminaux du personnel (tablettes, écrans tactiles).

Lorsqu'un client scanne le QR code de sa table, une session de table ("TableSession") est initiée ou rejointe. Le client sélectionne ses plats. Le système, via son module d'IA "Sommelier", analyse dynamiquement les choix et pousse des suggestions de boissons complémentaires sur l'interface du client.

Une fois la commande validée, elle est transmise instantanément au terminal "Cuisine" et au portail "Serveur". La synchronisation est absolue ; le client voit une estimation du temps de préparation calculée algorithmiquement. Si le délai est dépassé, une alerte est déclenchée.

En fin de repas, le client sollicite l'addition numériquement. Le module de paiement s'active, proposant une interface de sélection des articles consommés pour un paiement partagé. Une fois la transaction numérique approuvée par le processeur de paiement (ex: Stripe), le serveur central clôture la session de table et transmet une instruction d'acquittement au terminal "Caisse", évitant toute double saisie. Le reçu est ensuite envoyé par voie électronique à l'adresse fournie par l'utilisateur.

---

## REVENDICATIONS

1. **Système de gestion intégrée pour la restauration**, comprenant un serveur central, une pluralité de terminaux clients et de terminaux employés, caractérisé en ce qu'il comporte :
   - Un module d'ouverture de session activé par le scan d'un code optique (QR code) depuis un terminal client sans installation logicielle préalable ;
   - Un module de synchronisation en temps réel (WebSocket) maintenant l'état de la commande entre le terminal client, le terminal cuisine et le terminal serveur ;
   - Un module de paiement fractionné permettant à plusieurs terminaux clients de s'acquitter de parts spécifiques d'une même session de table ;
   - Un moteur d'Intelligence Artificielle configuré pour intercepter les flux de données et réaliser des prédictions d'inventaire, générer des fiches produits par analyse d'image, et formuler des recommandations d'accords mets-vins en temps réel au terminal client.

2. **Système selon la revendication 1**, caractérisé en ce que le moteur d'Intelligence Artificielle comprend un module "Magic Scan" capable d'identifier les ingrédients d'un plat à partir d'une photographie numérique, de les croiser avec une base de données d'allergènes (règlementation EU) et d'insérer ces métadonnées automatiquement dans le menu électronique.

3. **Système selon la revendication 1 ou 2**, caractérisé en ce que le moteur d'Intelligence Artificielle comprend un module d'optimisation financière ("Nova Finance") calculant dynamiquement la marge brute (Food Cost) en fonction de l'évolution des stocks et des ventes, et suggérant des promotions en temps réel pour l'écoulement des denrées périssables.

4. **Procédé d'orchestration de service de restauration** mis en œuvre par ordinateur, comprenant les étapes suivantes :
   a) L'ouverture d'une session numérique associée à une table physique par l'intermédiaire d'un dispositif mobile client ;
   b) L'affichage d'un menu interactif généré et enrichi dynamiquement par Intelligence Artificielle (suggestions d'accompagnements) ;
   c) La transmission instantanée des ordres de préparation aux terminaux d'affichage en cuisine via un canal de communication bidirectionnel persistant ;
   d) Le calcul et l'affichage côté client d'un temps de préparation estimé, avec déclenchement d'alertes en cas de dépassement ;
   e) La clôture de session via un processus d'encaissement numérique partagé et l'envoi d'un ticket dématérialisé sans intervention humaine au comptoir.

---

## ABRÉGÉ

L'invention concerne un système et un procédé informatique global de gestion pour la restauration (SaaS) remplaçant les architectures fragmentées. Le système intègre la commande par QR code sans application, la gestion des bons de préparation et de salle en temps réel absolu (via WebSockets), un système de paiement fractionné intelligent et un moteur d'Intelligence Artificielle central. Ce moteur (nommé Nova) automatise la gestion des stocks, déduit les coûts de revient, génère des fiches produits à partir de simples photographies (analyse visuelle des ingrédients et allergènes) et augmente le ticket moyen en proposant des accords mets-vins dynamiques directement sur l'interface du client. L'invention vise à supprimer les temps de latence matériels et logiciels tout en maximisant la rentabilité de l'établissement.