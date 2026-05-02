export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black mb-2">Conditions Generales de Vente</h1>
        <p className="text-white/40 text-sm mb-12">Derniere mise a jour : 2 mai 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white">Article 1 — Objet</h2>
            <p>Les presentes Conditions Generales de Vente (ci-apres « CGV ») regissent les relations contractuelles entre :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">[NOM DE LA SOCIETE]</strong>, SAS au capital de [MONTANT] euros, immatriculee au RCS de [VILLE] sous le numero [SIRET], dont le siege social est situe au [ADRESSE DU SIEGE], representee par ses co-fondateurs Steven Franco et Hugo Bourgain (ci-apres « le Prestataire »),</li>
              <li>et toute personne physique ou morale souscrivant a un abonnement aux services MaTable Pro (ci-apres « le Client »).</li>
            </ul>
            <p>Les CGV s'appliquent a l'ensemble des services proposes sur la plateforme matable.pro, incluant les solutions logicielles de gestion de restaurant commercialisees sous les marques MaTable, MaTable Pro, Nova Stock IA, Nova Finance IA, Nova Contab IA et toute autre solution editee par le Prestataire.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 2 — Services</h2>
            <p>Le Prestataire fournit une plateforme SaaS (Software as a Service) destinee aux professionnels de la restauration, comprenant selon l'abonnement souscrit :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Systeme de commande par QR code et paiement en ligne</li>
              <li>Portail serveur, cuisine et caisse en temps reel</li>
              <li>Campagne d'avis Google assistee par intelligence artificielle</li>
              <li>Gestion des stocks, finance et comptabilite par IA</li>
              <li>Systeme de reservations avec arrhes</li>
              <li>Analytics et reporting</li>
            </ul>
            <p>La liste exhaustive des fonctionnalites disponibles est consultable sur matable.pro.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 3 — Inscription et compte</h2>
            <p>L'acces aux services necessite la creation d'un compte professionnel. Le Client garantit l'exactitude des informations fournies lors de l'inscription. Le Client est seul responsable de la confidentialite de ses identifiants de connexion.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 4 — Duree et engagement</h2>
            <p>L'abonnement est souscrit pour une <strong className="text-white">duree minimale de douze (12) mois</strong> a compter de la date de souscription.</p>
            <p>A l'issue de cette periode initiale, l'abonnement est reconduit tacitement par periodes successives d'un (1) mois, sauf denonciation par l'une des parties avec un preavis de trente (30) jours avant la date de renouvellement.</p>
            <p>Une periode d'essai gratuite de quatorze (14) jours est proposee a tout nouveau Client. Durant cette periode, le Client peut resilier sans frais ni justification.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 5 — Tarifs et paiement</h2>
            <p>Les tarifs sont exprimes en euros hors taxes (HT). La TVA applicable sera ajoutee au moment de la facturation selon le taux en vigueur.</p>
            <p>Le Client choisit entre deux modes de facturation :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Mensuel</strong> : prelevement chaque mois a la date anniversaire de la souscription.</li>
              <li><strong className="text-white">Annuel</strong> : paiement en une seule fois pour 12 mois, beneficiant d'une remise de 5% sur le tarif mensuel.</li>
            </ul>
            <p>Des remises degressives sur le volume d'applications souscrites s'appliquent automatiquement : -10% a partir de 2 applications, -15% a partir de 3, -20% a partir de 4 ou plus.</p>
            <p>Le paiement s'effectue par carte bancaire via la plateforme securisee Stripe. En cas d'echec de paiement, le Prestataire se reserve le droit de suspendre l'acces aux services apres une relance restee sans effet pendant quinze (15) jours.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 6 — Resiliation anticipee</h2>
            <p>Toute resiliation avant le terme de la periode d'engagement de 12 mois entraine le paiement des mensualites restantes dues jusqu'a la fin de la periode d'engagement.</p>
            <p>Le Prestataire peut resilier l'abonnement de plein droit en cas de :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Non-paiement persistant apres mise en demeure</li>
              <li>Utilisation frauduleuse ou contraire aux presentes CGV</li>
              <li>Violation des lois et reglements en vigueur</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 7 — Disponibilite et maintenance</h2>
            <p>Le Prestataire s'engage a mettre en oeuvre les moyens necessaires pour assurer une disponibilite optimale de la plateforme (objectif de 99,5% de disponibilite annuelle, hors maintenance programmee).</p>
            <p>Le Prestataire se reserve le droit d'interrompre temporairement l'acces pour des operations de maintenance, en informant le Client dans un delai raisonnable sauf urgence technique.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 8 — Propriete intellectuelle</h2>
            <p>L'ensemble des logiciels, interfaces, contenus, algorithmes, modeles IA et marques (MaTable, MaTable Pro, Nova, etc.) sont la propriete exclusive de [NOM DE LA SOCIETE]. L'abonnement confere uniquement un droit d'utilisation non exclusif, non cessible et non transferable pour la duree du contrat.</p>
            <p>Le Client conserve la pleine propriete de ses donnees (menus, avis, donnees clients, photos, etc.).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 9 — Responsabilite</h2>
            <p>Le Prestataire ne saurait etre tenu responsable des dommages indirects, pertes d'exploitation, manque a gagner ou perte de donnees resultant de l'utilisation ou de l'impossibilite d'utilisation des services.</p>
            <p>La responsabilite totale du Prestataire est limitee au montant des sommes effectivement versees par le Client au cours des douze (12) derniers mois precedant le fait generateur.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 10 — Donnees personnelles</h2>
            <p>Le traitement des donnees personnelles est regi par notre Politique de Confidentialite, accessible a l'adresse <a href="/confidentialite" className="text-orange-400 hover:underline">matable.pro/confidentialite</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 11 — Droit applicable et litiges</h2>
            <p>Les presentes CGV sont regies par le droit francais. En cas de litige, les parties s'engagent a rechercher une solution amiable prealablement a toute action judiciaire. A defaut d'accord amiable dans un delai de trente (30) jours, le litige sera soumis aux tribunaux competents du ressort du siege social du Prestataire.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">Article 12 — Modification des CGV</h2>
            <p>Le Prestataire se reserve le droit de modifier les presentes CGV. Toute modification sera notifiee au Client par email au moins trente (30) jours avant son entree en vigueur. L'utilisation continue des services apres cette date vaut acceptation des nouvelles conditions.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
