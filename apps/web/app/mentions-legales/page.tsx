export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black mb-2">Mentions Legales</h1>
        <p className="text-white/40 text-sm mb-12">Conformement a la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'economie numerique.</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white">1. Editeur du site</h2>
            <p>
              <strong className="text-white">[NOM DE LA SOCIETE]</strong><br/>
              Forme juridique : SAS (Societe par Actions Simplifiee)<br/>
              Capital social : [MONTANT] euros<br/>
              Siege social : [ADRESSE DU SIEGE]<br/>
              RCS : [VILLE] — N° SIRET : [NUMERO SIRET]<br/>
              N° TVA intracommunautaire : [NUMERO TVA]<br/>
            </p>
            <p>
              <strong className="text-white">Co-fondateurs et dirigeants :</strong><br/>
              Steven Franco — Co-fondateur<br/>
              Hugo Bourgain — Co-fondateur
            </p>
            <p>
              <strong className="text-white">Contact :</strong><br/>
              Email : <a href="mailto:contact@novavivo.online" className="text-orange-400 hover:underline">contact@novavivo.online</a><br/>
              Site web : <a href="https://matable.pro" className="text-orange-400 hover:underline">matable.pro</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Directeur de la publication</h2>
            <p>Steven Franco, en qualite de co-fondateur de [NOM DE LA SOCIETE].</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. Hebergement</h2>
            <p>
              <strong className="text-white">Frontend (site web) :</strong><br/>
              Vercel Inc.<br/>
              440 N Baxter St, Los Angeles, CA 90012, USA<br/>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">vercel.com</a>
            </p>
            <p className="mt-3">
              <strong className="text-white">Backend (API et base de donnees) :</strong><br/>
              Railway Corp.<br/>
              San Francisco, CA, USA<br/>
              <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">railway.app</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Propriete intellectuelle</h2>
            <p>L'ensemble du contenu du site matable.pro (textes, graphismes, logos, icones, images, logiciels, bases de donnees, algorithmes IA) est la propriete exclusive de [NOM DE LA SOCIETE] ou fait l'objet d'une autorisation d'utilisation.</p>
            <p>Les marques MaTable, MaTable Pro, Nova Stock IA, Nova Finance IA, Nova Contab IA et les logos associes sont des marques de [NOM DE LA SOCIETE]. Toute reproduction, representation, modification ou exploitation non autorisee est interdite et constitue une contrefacon sanctionnee par les articles L.335-2 et suivants du Code de la propriete intellectuelle.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Donnees personnelles</h2>
            <p>Le traitement de vos donnees personnelles est decrit dans notre <a href="/confidentialite" className="text-orange-400 hover:underline">Politique de Confidentialite</a>.</p>
            <p>Conformement au RGPD (Reglement UE 2016/679) et a la loi Informatique et Libertes du 6 janvier 1978 modifiee, vous disposez d'un droit d'acces, de rectification, de suppression, de portabilite et d'opposition sur vos donnees personnelles.</p>
            <p>Pour exercer ces droits : <a href="mailto:contact@novavivo.online" className="text-orange-400 hover:underline">contact@novavivo.online</a></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Cookies</h2>
            <p>Le site utilise uniquement des cookies techniques necessaires au bon fonctionnement du service (authentification, gestion de session). Aucun cookie de tracking publicitaire n'est utilise.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. Limitation de responsabilite</h2>
            <p>[NOM DE LA SOCIETE] s'efforce de fournir des informations aussi precises que possible sur le site matable.pro. Toutefois, elle ne pourra etre tenue responsable des omissions, inexactitudes ou defauts de mise a jour.</p>
            <p>Les liens hypertextes vers d'autres sites ne sauraient engager la responsabilite de [NOM DE LA SOCIETE] quant au contenu de ces sites.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">8. Droit applicable</h2>
            <p>Les presentes mentions legales sont soumises au droit francais. Tout litige sera porte devant les juridictions competentes du ressort du siege social de [NOM DE LA SOCIETE].</p>
          </section>

        </div>
      </div>
    </div>
  );
}
