export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black mb-2">Politique de Confidentialite</h1>
        <p className="text-white/40 text-sm mb-12">Derniere mise a jour : 2 mai 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white">1. Responsable du traitement</h2>
            <p>Le responsable du traitement des donnees personnelles est :</p>
            <p><strong className="text-white">[NOM DE LA SOCIETE]</strong>, SAS au capital de [MONTANT] euros<br/>
            Siege social : [ADRESSE DU SIEGE]<br/>
            RCS [VILLE] — SIRET : [NUMERO SIRET]<br/>
            Co-fondateurs : Steven Franco, Hugo Bourgain<br/>
            Contact DPO : <a href="mailto:contact@novavivo.online" className="text-orange-400 hover:underline">contact@novavivo.online</a></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Donnees collectees</h2>
            <p>Dans le cadre de la fourniture de nos services, nous collectons les categories de donnees suivantes :</p>

            <h3 className="text-lg font-semibold text-white/90 mt-4">2.1 Donnees des professionnels (Clients restaurateurs)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identite : nom, prenom, email, telephone</li>
              <li>Donnees de l'etablissement : nom, adresse, SIRET, logo, photos</li>
              <li>Donnees de paiement : traitees exclusivement par Stripe (nous ne stockons jamais les numeros de carte)</li>
              <li>Donnees d'utilisation : logs de connexion, actions dans le dashboard</li>
            </ul>

            <h3 className="text-lg font-semibold text-white/90 mt-4">2.2 Donnees des employes du Client (serveurs)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom, photo (optionnelle), code PIN, horaires de service</li>
            </ul>

            <h3 className="text-lg font-semibold text-white/90 mt-4">2.3 Donnees des consommateurs finaux (clients du restaurant)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Avis et notes laisses via le systeme de QR code</li>
              <li>Reponses aux questions de l'assistant IA (chatHistory)</li>
              <li>Adresse email (uniquement si le consommateur reclame une offre promotionnelle)</li>
              <li>Donnees de reservation : nom, telephone, email, date, heure, nombre de convives</li>
              <li>Donnees de commande : articles commandes, montant, mode de paiement</li>
              <li>Pourboires : montant, identifiant Stripe (aucune donnee bancaire stockee)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. Finalites du traitement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fourniture et amelioration des services MaTable Pro</li>
              <li>Gestion des abonnements et de la facturation</li>
              <li>Generation d'avis assistes par intelligence artificielle</li>
              <li>Envoi de codes de verification par email (reclamation de bons de reduction)</li>
              <li>Envoi de confirmations de reservation et de tickets de caisse</li>
              <li>Analyse statistique anonymisee pour l'amelioration du service</li>
              <li>Respect des obligations legales et fiscales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Bases legales</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Execution du contrat</strong> : traitement des donnees necessaire a la fourniture des services souscrits (art. 6.1.b RGPD)</li>
              <li><strong className="text-white">Consentement</strong> : collecte de l'email pour l'envoi de bons promotionnels (art. 6.1.a RGPD)</li>
              <li><strong className="text-white">Interet legitime</strong> : amelioration des services, securite, prevention de la fraude (art. 6.1.f RGPD)</li>
              <li><strong className="text-white">Obligation legale</strong> : conservation des factures et donnees comptables (art. 6.1.c RGPD)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Sous-traitants et transferts</h2>
            <p>Nous faisons appel aux sous-traitants suivants :</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-2">
                <thead><tr className="border-b border-white/10 text-white/50 text-left">
                  <th className="pb-2 pr-4">Sous-traitant</th><th className="pb-2 pr-4">Finalite</th><th className="pb-2">Localisation</th>
                </tr></thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Railway</td><td className="py-2 pr-4">Hebergement serveurs</td><td className="py-2">USA (clauses contractuelles types)</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Paiement en ligne</td><td className="py-2">USA (certifie PCI DSS)</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Resend</td><td className="py-2 pr-4">Envoi d'emails transactionnels</td><td className="py-2">USA</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Vercel</td><td className="py-2 pr-4">Hebergement frontend</td><td className="py-2">USA (clauses contractuelles types)</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">Les transferts hors UE sont encadres par des clauses contractuelles types (CCT) approuvees par la Commission europeenne ou par des decisions d'adequation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Intelligence artificielle</h2>
            <p>Nos services utilisent des modeles d'intelligence artificielle pour :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Generer des brouillons d'avis Google a partir des reponses du consommateur</li>
              <li>Fournir des recommandations de gestion (stocks, finance, comptabilite)</li>
            </ul>
            <p>Les reponses des consommateurs sont transmises au modele IA uniquement pour generer l'avis demande. Elles ne sont pas utilisees pour entrainer ou ameliorer les modeles. Les conversations sont stockees dans notre base de donnees pour permettre au restaurateur de consulter les retours de ses clients.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. Duree de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Donnees de compte Client</strong> : conservees pendant toute la duree du contrat, puis 3 ans apres la fin du contrat</li>
              <li><strong className="text-white">Donnees de facturation</strong> : 10 ans (obligation legale)</li>
              <li><strong className="text-white">Avis et chatHistory</strong> : conserves tant que le compte Client est actif, supprimes sur demande</li>
              <li><strong className="text-white">Emails des consommateurs (voucher claim)</strong> : 24 mois maximum</li>
              <li><strong className="text-white">Codes de verification</strong> : 10 minutes (en memoire uniquement, jamais persistes)</li>
              <li><strong className="text-white">Logs de connexion</strong> : 12 mois</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">8. Cookies</h2>
            <p>La plateforme MaTable Pro utilise uniquement des cookies strictement necessaires au fonctionnement du service (authentification, session). Aucun cookie publicitaire ou de tracking tiers n'est utilise.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">9. Droits des personnes concernees</h2>
            <p>Conformement au Reglement General sur la Protection des Donnees (RGPD) et a la loi Informatique et Libertes, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Droit d'acces</strong> : obtenir la confirmation que vos donnees sont traitees et en recevoir une copie</li>
              <li><strong className="text-white">Droit de rectification</strong> : corriger des donnees inexactes ou incompletes</li>
              <li><strong className="text-white">Droit a l'effacement</strong> : demander la suppression de vos donnees (sous reserve des obligations legales de conservation)</li>
              <li><strong className="text-white">Droit a la portabilite</strong> : recevoir vos donnees dans un format structure et lisible par machine</li>
              <li><strong className="text-white">Droit d'opposition</strong> : vous opposer au traitement de vos donnees pour des motifs legitimes</li>
              <li><strong className="text-white">Droit a la limitation</strong> : demander la suspension du traitement dans certains cas</li>
            </ul>
            <p className="mt-3">Pour exercer vos droits, contactez-nous a : <a href="mailto:contact@novavivo.online" className="text-orange-400 hover:underline">contact@novavivo.online</a></p>
            <p>Vous disposez egalement du droit d'introduire une reclamation aupres de la CNIL (Commission Nationale de l'Informatique et des Libertes) — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">www.cnil.fr</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">10. Securite</h2>
            <p>Nous mettons en oeuvre les mesures techniques et organisationnelles appropriees pour proteger vos donnees :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chiffrement des communications (HTTPS/TLS)</li>
              <li>Hashage des mots de passe (bcrypt)</li>
              <li>Authentification par tokens JWT</li>
              <li>Acces restreint aux bases de donnees en production</li>
              <li>Sauvegardes automatiques quotidiennes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">11. Modification de la politique</h2>
            <p>La presente politique peut etre modifiee a tout moment. Les Clients seront informes par email de toute modification substantielle au moins trente (30) jours avant son entree en vigueur.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
