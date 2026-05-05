export const stats = [
  { value: "15 s", label: "Temps moyen de commande" },
  { value: "−78%", label: "Erreurs de commande" },
  { value: "+34%", label: "Panier moyen" },
  { value: "×4", label: "Moins de no-shows" },
];

export const MODULES = [
  { id: "avis", name: "Avis Google & Réputation", desc: "Campagne QR, IA rédactionnelle, Bons de réduction auto.", price: 79, required: true },
  { id: "qr", name: "Commande & Paiement", desc: "Menu digital QR, paiement fractionné ou espèces, tickets.", price: 99, required: false },
  { id: "server", name: "Portail Serveur (Live)", desc: "Portail serveur, portail cuisine dédié et portail caisse — gestion des tables, suivi commandes en temps réel, appels instantanés.", price: 69, required: false },
  { id: "stock", name: "Nova Stock IA", desc: "Listes de courses auto, alertes de ruptures, food cost. Quota mensuel inclus.", price: 89, required: false },
  { id: "finance", name: "Nova Finance IA", desc: "Food cost réel, KPIs, marges, prévisions CA et recommandations de rentabilité. Quota mensuel inclus.", price: 69, required: false },
  { id: "contab", name: "Nova Contab IA", desc: "Exports comptables, TVA, rapports de fin de mois intelligents. Quota mensuel inclus.", price: 69, required: false },
  { id: "reservations", name: "Réservations Intelligentes", desc: "Créneaux dynamiques, arrhes Stripe, confirmation automatique, anti no-show et gestion de salle en temps réel.", price: 129, required: false },
];

export const features = [
  { icon: "📱", title: "Scan → Commande. C'est tout.", desc: "Pas d'app. Pas de compte. Le client scanne, choisit, commande. Simplicite desarmante.", highlight: true, category: "commande" },
  { icon: "⚡", title: "Temps reel absolu", desc: "Chaque commande frappe l'ecran cuisine. Le client voit son statut evoluer en direct : en cours, pret, servi.", highlight: false, category: "commande" },
  { icon: "⏱️", title: "Attente estimee & Retards", desc: "Compte a rebours en direct. Si ca depasse, message d'excuse envoye et cuisine alertee.", highlight: false, category: "commande" },
  { icon: "💳", title: "Paiement fractionne", desc: "Chacun paie sa part. Carte, especes, caisse. La table se ferme automatiquement a la fin.", highlight: true, category: "commande" },
  { icon: "🧾", title: "Flux d'addition complet", desc: "Client demande → serveur confirme → encaissement. Et ticket de caisse par email automatique.", highlight: false, category: "commande" },
  { icon: "🍷", title: "Nova Sommelier", desc: "L'IA analyse le plat et propose les meilleurs accords mets & vins, et suggere des boissons manquantes.", highlight: true, category: "ia" },
  { icon: "📦", title: "Nova Stock IA", desc: "Analyse des ventes, generation de listes de courses et creation d'articles manquants. Plus de ruptures.", highlight: true, category: "ia" },
  { icon: "💹", title: "Nova Finance IA", desc: "Calcul du Food Cost reel, KPIs, marges et recommandations pour maximiser la rentabilite.", highlight: false, category: "ia" },
  { icon: "🧮", title: "Nova Contab IA", desc: "Analyse fiscale, synthese URSSAF, TVA, impots, CA ht/ttc. La comptabilite demystifiee par l'IA.", highlight: true, category: "ia" },
  { icon: "📷", title: "Magic Scan IA", desc: "Photographiez un plat. Nova extrait ingredients, allergenes et redige une description gastronomique.", highlight: false, category: "ia" },
  { icon: "🗓️", title: "Planning IA Intelligent", desc: "Generez vos plats du jour pour la semaine en un clic en fonction de vos stocks restants.", highlight: false, category: "ia" },
  { icon: "👤", title: "Portail Serveur", desc: "Dashboard individuel avec PIN. Appels de table en direct, fermetures de session, vue Kanban.", highlight: false, category: "gestion" },
  { icon: "🎯", title: "Up-Selling Intelligent", desc: "Suggestions d'ajouts lors de la commande (ex: 'Un supplement frites ?') pour gonfler le panier moyen.", highlight: true, category: "gestion" },
  { icon: "📅", title: "Reservations de fer", desc: "Creneaux dynamiques et arrhes Stripe. Les no-shows sont desormais un mauvais souvenir.", highlight: false, category: "gestion" },
  { icon: "🌿", title: "Allergenes EU (14)", desc: "14 allergenes affiches automatiquement. Vous etes en regle, vos clients en securite.", highlight: false, category: "gestion" },
  { icon: "⭐", title: "Avis verifies", desc: "Seuls ceux qui ont paye peuvent noter. Fini les faux avis Google, place a la verite.", highlight: false, category: "gestion" },
  { icon: "📊", title: "Analytics Recharts", desc: "CA, ticket moyen, top serveurs, top plats. Des graphiques clairs et interactifs.", highlight: false, category: "gestion" },
  { icon: "🔔", title: "Appel Serveur", desc: "Un bouton, une alerte sonore sur le dashboard du serveur. Precision chirurgicale.", highlight: false, category: "gestion" },
];

export const hardware = [
  { name: "POS Client", desc: "Une tablette murale pour la commande.", icon: "🖥️", tag: "Sur devis" },
  { name: "POS Serveur", desc: "La prise de commande mobile synchronisee.", icon: "📱", tag: "Sur devis" },
  { name: "POS Caisse", desc: "Terminal connecte.", icon: "🖨️", tag: "Sur devis" },
  { name: "QR Vinyle", desc: "Indestructible. QR unique par table.", icon: "🎯", tag: "Des 3€/table" },
  { name: "Chevalet Acrylique", desc: "Le luxe sur table. QR serigraphie.", icon: "💎", tag: "Des 8€/table" },
  { name: "PDF A4 Gratuit", desc: "Imprimez-le vous-meme. Gratuit.", icon: "📄", tag: "Gratuit" },
];

export const languageLines: [string, string][] = [
  ["GB", "I speak English."],
  ["ES", "Hablo español."],
  ["IT", "Parlo italiano."],
  ["DE", "Ich spreche Deutsch."],
  ["PT", "Falo português."],
  ["JP", "私は日本語を話します。"],
  ["CN", "我讲中文。"],
];

export const comparisons = [
  { feature: "Commande QR sans friction (0 app, 0 compte)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Suivi commande en temps réel côté client", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Temps d'attente estimé + compte à rebours", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Paiement fractionné (égal ou personnalisé)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Flux addition (client → serveur → caisse)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Temps réel WebSocket (cuisine + salle + client)", us: "✓", starter: "Partiel", dino: "✕" },
  { feature: "Dashboard individuel par serveur (PIN)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Tables assignées par serveur", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Planning de service par employé", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Nova Stock IA (liste de courses + alertes frais)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Nova Finance IA (KPIs + prévisions + offres)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Nova Menu IA (génération + import photo)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "IA Vision (Magic Scan plats)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Planning hebdomadaire IA", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Descriptions de plats IA", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Défis serveurs générés par IA (quotidiens)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Avis vérifiés anti-fraude", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Réservations + arrhes Stripe", us: "✓", starter: "✓", dino: "✕" },
  { feature: "Allergènes EU (14) automatiques", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Analytics de précision (CA, tips, splits)", us: "✓", starter: "Basique", dino: "✕" },
  { feature: "Page vitrine SEO incluse", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Réseau social culinaire (Nova Match)", us: "Bientôt", starter: "✕", dino: "✕" },
  { feature: "Essai gratuit sans CB", us: "✓", starter: "✕", dino: "✕" },
];

export const DURATIONS = [
  { key: "3m",  label: "3 mois",   sub: "Sans risque",         realMult: 1.07, fakeDiscount: 0  },
  { key: "6m",  label: "6 mois",   sub: "Le plus populaire",   realMult: 1.05, fakeDiscount: 2  },
  { key: "9m",  label: "9 mois",   sub: "Presque annuel",      realMult: 1.03, fakeDiscount: 4  },
  { key: "12m", label: "12 mois",  sub: "Tarif de reference",  realMult: 1.00, fakeDiscount: 7  },
  { key: "12a", label: "12 mois",  sub: "Paiement annuel",     realMult: 0.95, fakeDiscount: 12 },
] as const;

export type DurationKey = typeof DURATIONS[number]["key"];

export const teaserCards = [
  {
    href: "/fonctionnalites",
    icon: "⚡",
    title: "Fonctionnalités",
    desc: "18 outils intégrés, de la commande à la comptabilité.",
    cta: "Explorer →",
    color: "orange",
  },
  {
    href: "/nova-ia",
    icon: "🧠",
    title: "Nova IA",
    desc: "Votre brigade digitale : sommelier, stock, finance, scan.",
    cta: "Découvrir →",
    color: "purple",
  },
  {
    href: "/materiel",
    icon: "🖥️",
    title: "Matériel",
    desc: "POS, QR vinyle, chevalet acrylique ou PDF gratuit.",
    cta: "Voir →",
    color: "blue",
  },
  {
    href: "/tarifs",
    icon: "💶",
    title: "Tarifs",
    desc: "Payez uniquement ce que vous utilisez. Dès 79€/mois.",
    cta: "Construire →",
    color: "green",
  },
];

export const faqCategories = [
  {
    id: "general",
    label: "Questions generales",
    title: "Ce que les restaurateurs demandent avant de se lancer",
    intro: "Les questions les plus frequentes avant une demo, un essai gratuit ou un changement de solution.",
    items: [
      {
        question: "MaTable Pro, c'est quoi exactement ?",
        answer:
          "MaTable Pro est un logiciel restaurant tout-en-un. Vous centralisez la commande QR code, le paiement, le portail serveur en temps reel, la caisse, les reservations, les avis Google, le stock et les analyses dans une seule interface coherente.",
      },
      {
        question: "Pour quel type d'etablissement est-ce fait ?",
        answer:
          "La solution est pensee pour les restaurants, bistrots, brasseries, snacks, bars a tapas, etablissements saisonniers et concepts hybrides qui veulent gagner du temps en salle, fluidifier la prise de commande et mieux piloter leur activite.",
      },
      {
        question: "Faut-il installer une application pour les clients ?",
        answer:
          "Non. Le client scanne un QR code et commande directement depuis son telephone. Pas d'application a telecharger, pas de compte obligatoire, donc beaucoup moins de friction a table.",
      },
      {
        question: "Combien de temps faut-il pour etre operationnel ?",
        answer:
          "Dans la plupart des cas, une premiere mise en place peut etre preparee tres vite. Nous configurons votre compte, vos modules, votre menu et vos regles de service pour que vous puissiez tester sans bloquer votre exploitation.",
      },
    ],
  },
  {
    id: "transition",
    label: "Transition concurrents",
    title: "Vous etes deja engages ailleurs ?",
    intro: "Beaucoup de restaurateurs viennent a nous alors qu'ils utilisent deja une autre solution ou qu'ils ont encore un contrat en cours.",
    items: [
      {
        question: "On a deja un engagement chez un concurrent. Est-ce que ca vaut quand meme le coup d'en parler ?",
        answer:
          "Oui. Un contrat en cours n'empeche pas de preparer la suite. Nous pouvons cadrer un plan de transition, vous montrer ce qui sera gagne en exploitation, et programmer le basculement au bon moment pour eviter de perdre du temps le jour ou vous changez.",
      },
      {
        question: "Peut-on tester MaTable Pro avant la fin de notre contrat actuel ?",
        answer:
          "Oui. L'essai gratuit permet de valider l'ergonomie, les modules et le potentiel sur votre fonctionnement sans forcement couper votre solution actuelle. C'est utile pour comparer sereinement avant une decision.",
      },
      {
        question: "Est-ce que vous accompagnez une migration depuis une autre solution ?",
        answer:
          "Oui. Nous accompagnons la reprise du menu, la structuration de la carte, le parametrage des modules et l'organisation du demarrage. L'objectif est de limiter les manipulations cote restaurant et d'eviter une transition brutale pour l'equipe.",
      },
      {
        question: "Faut-il tout changer d'un coup ?",
        answer:
          "Pas forcement. Selon votre situation, vous pouvez demarrer par un besoin prioritaire, par exemple les avis, les reservations ou la commande QR, puis etendre ensuite. Cela permet une adoption plus simple et un risque operationnel plus faible.",
      },
    ],
  },
  {
    id: "pricing",
    label: "Tarifs et engagement",
    title: "Ce que vous payez, et pourquoi",
    intro: "Le modele est lisible : vous activez les modules dont vous avez besoin et la duree d'engagement fait evoluer le tarif.",
    items: [
      {
        question: "Comment sont calcules les tarifs ?",
        answer:
          "Vous choisissez vos modules, puis votre duree d'engagement. Plus l'engagement est long, plus le prix mensuel baisse. Des remises volume s'appliquent aussi lorsque vous activez plusieurs modules.",
      },
      {
        question: "Y a-t-il un essai gratuit ?",
        answer:
          "Oui. Vous pouvez tester MaTable Pro pendant 14 jours sans carte bancaire. L'objectif est que vous voyiez rapidement si la solution vous fait gagner du temps, du chiffre ou de la serenite au quotidien.",
      },
      {
        question: "Peut-on commencer petit puis ajouter des modules plus tard ?",
        answer:
          "Oui. Vous pouvez demarrer avec un besoin precis puis enrichir la solution au fil de votre croissance. L'interet de MaTable Pro est justement de faire cohabiter plusieurs briques dans un seul environnement plutot que d'empiler des outils disperses.",
      },
      {
        question: "Y a-t-il des frais caches ou du materiel impose ?",
        answer:
          "Non, l'approche est transparente. Certains usages peuvent fonctionner avec votre materiel existant, et si vous avez besoin d'equipements specifiques nous vous guidons avec une proposition claire plutot qu'une surprise en fin de parcours.",
      },
    ],
  },
  {
    id: "operations",
    label: "Utilisation au quotidien",
    title: "Ce que l'equipe gagne vraiment en service",
    intro: "Les objections reviennent souvent sur le terrain : adoption par l'equipe, reactions des clients, impact sur le service.",
    items: [
      {
        question: "Est-ce que les clients utilisent vraiment le QR code ?",
        answer:
          "Oui, surtout quand l'experience est simple. Chez MaTable Pro, le client scanne et agit tout de suite. Pas d'application, pas de tunnel inutile. Cela augmente fortement l'adoption et desengorge la salle sur les moments de rush.",
      },
      {
        question: "Est-ce que ca remplace les serveurs ?",
        answer:
          "Non. La solution aide les serveurs a mieux servir. Elle retire les aller-retours repetitifs, fluidifie les commandes et clarifie les priorites. L'equipe garde la relation humaine et gagne du temps la ou elle a le plus de valeur.",
      },
      {
        question: "Que se passe-t-il si on veut garder une prise de commande classique ?",
        answer:
          "C'est possible. MaTable Pro n'impose pas un mode unique. Vous pouvez conserver une organisation hybride selon vos services, vos equipes, votre clientele et votre rythme en salle.",
      },
      {
        question: "Les avis Google sont-ils vraiment utiles dans votre systeme ?",
        answer:
          "Oui, parce qu'ils sont mieux orchestrés. La plateforme aide a solliciter les bons moments, encadre la redaction avec l'IA et limite la fraude en s'appuyant sur de vrais clients. Vous transformez plus facilement une bonne experience en visibilite locale.",
      },
    ],
  },
  {
    id: "support",
    label: "Technique et accompagnement",
    title: "Ce qui se passe apres le oui",
    intro: "Une bonne demo ne suffit pas : les restaurateurs veulent savoir qui repond, quand, et comment le projet avance.",
    items: [
      {
        question: "Est-ce que vous nous accompagnez au demarrage ?",
        answer:
          "Oui. Vous n'etes pas laches seuls avec un outil. Nous vous aidons a parametrer la solution, a structurer les modules utiles et a organiser une mise en route adaptee a votre realite terrain.",
      },
      {
        question: "Peut-on vous joindre rapidement en cas de question ?",
        answer:
          "Oui. Vous pouvez nous contacter directement par telephone au +33 7 57 83 57 77 ou par email a contact@matable.pro pour une demo, une question commerciale ou un point sur votre configuration.",
      },
      {
        question: "Est-ce que la solution evolue avec nos besoins ?",
        answer:
          "Oui. MaTable Pro est concu comme une base evolutive. Vous pouvez commencer avec un perimetre simple puis ajouter des briques comme les reservations, le stock, la finance ou les avis sans repartir de zero.",
      },
      {
        question: "Si j'ai un doute, quelle est la meilleure prochaine etape ?",
        answer:
          "Le plus simple est de demander une demo ou d'echanger avec nous sur votre situation actuelle, surtout si vous etes deja equipes ailleurs. Nous vous dirons franchement s'il vaut mieux tester tout de suite, preparer une transition ou attendre une date plus strategique.",
      },
    ],
  },
];
