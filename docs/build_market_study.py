"""Genere docs/market-study-v1.pdf — Etude de marche & positionnement A table !"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
)
import os

OUT = os.path.join(os.path.dirname(__file__), "market-study-v1.pdf")

BRAND = colors.HexColor("#EA580C")       # orange-600
BRAND_DARK = colors.HexColor("#9A3412")  # orange-900
SLATE = colors.HexColor("#334155")
SLATE_LIGHT = colors.HexColor("#64748B")
BG_SOFT = colors.HexColor("#FFF7ED")

styles = getSampleStyleSheet()

H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                   fontSize=22, leading=26, textColor=BRAND_DARK, spaceAfter=14, spaceBefore=6)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                   fontSize=15, leading=19, textColor=BRAND, spaceAfter=8, spaceBefore=14)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
                   fontSize=11.5, leading=15, textColor=SLATE, spaceAfter=4, spaceBefore=8)
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica",
                     fontSize=10, leading=14.5, textColor=SLATE, alignment=TA_JUSTIFY,
                     spaceAfter=6)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=14, bulletIndent=4, spaceAfter=3)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=8.5, leading=11, textColor=SLATE_LIGHT)
COVER_TITLE = ParagraphStyle("CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold",
                            fontSize=34, leading=40, textColor=BRAND_DARK, alignment=TA_CENTER,
                            spaceAfter=18)
COVER_SUB = ParagraphStyle("CoverSub", parent=BODY, fontSize=14, leading=20,
                          textColor=SLATE, alignment=TA_CENTER)

def bullet(text):
    return Paragraph(f"\u2022 &nbsp; {text}", BULLET)

def kv_table(rows, col_widths=(5*cm, 11*cm)):
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,0), (-1,-1), 9.5),
        ("TEXTCOLOR", (0,0), (-1,-1), SLATE),
        ("BACKGROUND", (0,0), (0,-1), BG_SOFT),
        ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LINEBELOW", (0,0), (-1,-1), 0.3, colors.HexColor("#E2E8F0")),
    ]))
    return t

def comp_table():
    header = ["Acteur", "Positionnement", "Modele", "Forces", "Limites"]
    data = [
        ["Sunday", "Paiement QR a table (FR/US)", "Commission 1,5 % + abo", "Notoriete, levees $", "Paiement uniquement, pas de commande"],
        ["Uber Eats / Deliveroo In-Store", "Commande a table adossee livraison", "Commission ~15 %", "Trafic, marque", "Commissions lourdes, hors ecosysteme resto"],
        ["Zelty / Tiller / Lightspeed", "Caisse + commande a table (module)", "Licence SaaS + materiel", "Integration caisse complete", "Prix eleve, deploiement lourd"],
        ["LaFourchette Pay (TheFork)", "Paiement a table", "Commission", "Base utilisateurs", "Scope reduit, dependant TheFork"],
        ["QR-menu simples (Menukard, GloriaFood)", "Menu QR statique", "Freemium", "Gratuit / simple", "Pas de temps reel, pas de paiement integre"],
        ["A table !", "Commande + paiement QR zero friction", "SaaS abo / commission faible", "Deploiement 5 min, sans app, sans materiel", "Jeune produit, ecosysteme a construire"],
    ]
    rows = [header] + data
    t = Table(rows, colWidths=[2.6*cm, 3.6*cm, 3.2*cm, 3.8*cm, 3.8*cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("BACKGROUND", (0,0), (-1,0), BRAND),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTSIZE", (0,0), (-1,-1), 8.5),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("TEXTCOLOR", (0,1), (-1,-1), SLATE),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, BG_SOFT]),
        ("LINEBELOW", (0,0), (-1,-1), 0.25, colors.HexColor("#E2E8F0")),
        ("FONTNAME", (0,-1), (-1,-1), "Helvetica-Bold"),
        ("BACKGROUND", (0,-1), (-1,-1), colors.HexColor("#FED7AA")),
    ]))
    return t

def swot_table():
    data = [
        [Paragraph("<b>Forces</b>", H3), Paragraph("<b>Faiblesses</b>", H3)],
        [Paragraph(
            "Zero friction : pas d'app, pas de compte, 15s de la table a la cuisine.<br/>"
            "Stack moderne (Next.js 14, Fastify, Socket.io, Prisma).<br/>"
            "Deploiement cloud natif (Railway, Docker multi-stage).<br/>"
            "Isolation par UUID de table compatible 4G/5G et Wi-Fi partage.<br/>"
            "Modes de paiement flexibles (Carte Stripe, Caisse, Especes).<br/>"
            "Prix cible agressif : SaaS sans materiel dedie.",
            BODY),
         Paragraph(
            "Produit jeune, base clients a construire.<br/>"
            "Pas encore d'integration caisse (Zelty, Lightspeed, Tiller).<br/>"
            "Pas de module fidelite / CRM natif.<br/>"
            "Dependance a Stripe pour la partie paiement cartes.<br/>"
            "Multi-langues et multi-devises a industrialiser.",
            BODY)],
        [Paragraph("<b>Opportunites</b>", H3), Paragraph("<b>Menaces</b>", H3)],
        [Paragraph(
            "Penurie de personnel en salle : digitalisation comme levier de productivite.<br/>"
            "Pression sur les marges restauration : commissions Sunday/Uber jugees lourdes.<br/>"
            "Glissement du paiement vers le QR / tap-to-pay.<br/>"
            "Expansion segments : bars, food-courts, brasseries, hotels, festivals.<br/>"
            "API ouverte = integration POS, comptabilite, stocks.",
            BODY),
         Paragraph(
            "Sunday leve des fonds et agressive sur le marche FR.<br/>"
            "Editeurs de caisse (Lightspeed, Zelty) integrent progressivement le QR.<br/>"
            "Risque reglementaire (TVA, fiscalite caisse, RGPD).<br/>"
            "Dependance Stripe / Railway (fournisseurs critiques).",
            BODY)],
    ]
    t = Table(data, colWidths=[8.2*cm, 8.2*cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("BACKGROUND", (0,0), (0,0), BG_SOFT),
        ("BACKGROUND", (1,0), (1,0), BG_SOFT),
        ("BACKGROUND", (0,2), (0,2), BG_SOFT),
        ("BACKGROUND", (1,2), (1,2), BG_SOFT),
        ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("INNERGRID", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    return t

story = []

# ---------- COVER ----------
story.append(Spacer(1, 4*cm))
story.append(Paragraph("A table !", COVER_TITLE))
story.append(Paragraph("Etude de marche &amp; positionnement concurrentiel", COVER_SUB))
story.append(Spacer(1, 1*cm))
story.append(Paragraph("Version 1.0 &nbsp;&middot;&nbsp; Avril 2026", COVER_SUB))
story.append(Spacer(1, 4*cm))
story.append(Paragraph(
    "<i>SaaS de commande et paiement par QR code en salle. "
    "Le client scanne, commande, paie depuis son telephone &mdash; sans application, sans compte.</i>",
    ParagraphStyle("coverq", parent=BODY, alignment=TA_CENTER, fontSize=11, textColor=SLATE_LIGHT)))
story.append(PageBreak())

# ---------- 1. SYNTHESE ----------
story.append(Paragraph("1. Synthese executive", H1))
story.append(Paragraph(
    "Le marche francais de la restauration commerciale represente pres de <b>57 Md&euro; de chiffre d'affaires annuel</b> "
    "pour plus de <b>175 000 etablissements</b>. Dans un contexte de tension structurelle sur le recrutement en salle "
    "(~150 000 postes non pourvus) et de pression sur les marges, la digitalisation du parcours client devient "
    "une necessite operationnelle, plus seulement un avantage concurrentiel.",
    BODY))
story.append(Paragraph(
    "<b>A table !</b> se positionne sur le segment <b>commande + paiement a la table par QR code</b>, avec "
    "une proposition de valeur centree sur trois ruptures : (1) <b>zero friction client</b> &mdash; ni app, ni compte, "
    "ni caissier ; (2) <b>deploiement en cinq minutes</b> &mdash; aucun materiel proprietaire, juste un QR colle sur la "
    "table ; (3) <b>tarification transparente</b> &mdash; abonnement SaaS plus commission faible, contre des commissions "
    "elevees chez les agregateurs.",
    BODY))
story.append(Paragraph(
    "Face a <b>Sunday</b> (paiement QR, leve >100 M$), aux modules de commande des editeurs de caisse "
    "(<b>Zelty, Lightspeed, Tiller</b>) et aux agregateurs (<b>Uber Eats In-Store</b>), A table ! combine "
    "les trois couches &mdash; menu, commande, paiement &mdash; dans une experience unique, temps reel et <i>mobile-first</i>.",
    BODY))

# ---------- 2. MARCHE ----------
story.append(Paragraph("2. Contexte de marche", H1))

story.append(Paragraph("2.1 Dimensions du marche francais", H2))
story.append(kv_table([
    ["CA restauration commerciale FR", "~ 57 Md&euro; (2024)"],
    ["Nombre d'etablissements", "~ 175 000 (restaurants, brasseries, bars)"],
    ["Postes non pourvus en salle", "~ 150 000 (source UMIH / INSEE)"],
    ["Taux de penetration du QR order+pay", "estime 4-7 % en 2025, vs 25 %+ au Royaume-Uni"],
    ["Cible prioritaire A table !", "Independants + petites chaines 1-10 couverts x 1-5 etablissements"],
]))

story.append(Paragraph("2.2 Tendances structurantes", H2))
story.append(bullet("<b>Penurie de main d'&oelig;uvre</b> : la digitalisation du passage de commande liberte 20 a 30 % du temps serveur."))
story.append(bullet("<b>Adoption du QR-menu</b> post-COVID : la barriere culturelle est tombee, les clients scannent sans apprentissage."))
story.append(bullet("<b>Pression sur les marges</b> : les commissions de livraison (>15 %) poussent les restaurateurs a rechercher des outils <i>on-premise</i>."))
story.append(bullet("<b>Paiement mobile</b> : Apple Pay et Google Pay representent >35 % des paiements en ligne FR en 2025."))
story.append(bullet("<b>Reglementation caisse</b> : obligation de certification des systemes de caisse (art. 88 LFR 2015) &mdash; opportunite d'offrir un POS conforme."))

# ---------- 3. CONCURRENTS ----------
story.append(PageBreak())
story.append(Paragraph("3. Cartographie concurrentielle", H1))
story.append(Paragraph(
    "Le marche se segmente en quatre familles d'acteurs, dont aucune ne couvre pleinement le triptyque "
    "<i>menu + commande + paiement</i> avec l'exigence de zero friction et zero materiel que porte A table !.",
    BODY))
story.append(Spacer(1, 6))
story.append(comp_table())
story.append(Spacer(1, 10))

story.append(Paragraph("3.1 Analyse detaillee par concurrent", H2))

story.append(Paragraph("Sunday", H3))
story.append(Paragraph(
    "Leader du paiement QR en France, ~6 000 restaurants equipes, leve cumulee >100 M$. Forte notoriete, "
    "integration avec les principales caisses. <b>Limite</b> : le scope se restreint au paiement &mdash; le client "
    "commande toujours aupres d'un serveur. Pas d'effet sur la productivite salle en amont du service.",
    BODY))

story.append(Paragraph("Uber Eats In-Store / Deliveroo", H3))
story.append(Paragraph(
    "Module de commande a table adosse a la plateforme de livraison. Force : trafic de la marque et paiement fiabilise. "
    "<b>Limite</b> : commissions de l'ordre de 10 a 15 %, cannibalisation de la relation client, dependance a un acteur "
    "ne dont l'interet diverge de celui du restaurateur.",
    BODY))

story.append(Paragraph("Zelty, Tiller, Lightspeed, Hiboutik", H3))
story.append(Paragraph(
    "Editeurs de caisse historiques qui ajoutent progressivement un module QR order+pay. Force : integration native "
    "caisse, stocks, fiscalite. <b>Limite</b> : cout total de possession eleve (licence + tablette + formation), "
    "deploiement en semaines, inadaptation aux independants.",
    BODY))

story.append(Paragraph("LaFourchette Pay, Pongo, Yavin", H3))
story.append(Paragraph(
    "Acteurs de niche centres sur le paiement ou la fidelite. Complementaires plus que concurrents directs : "
    "opportunite d'integration via API ouverte.",
    BODY))

story.append(Paragraph("QR-menus simples (Menukard, GloriaFood, MenuApp)", H3))
story.append(Paragraph(
    "Affichage statique du menu par QR, sans commande ni paiement. Freemium, tres repandus mais a faible valeur ajoutee. "
    "Constituent un tremplin naturel vers A table !.",
    BODY))

# ---------- 4. POSITIONNEMENT ----------
story.append(PageBreak())
story.append(Paragraph("4. Positionnement de A table !", H1))

story.append(Paragraph("4.1 Proposition de valeur", H2))
story.append(Paragraph(
    "<b>\u00ab Vos clients commandent en 15 secondes. Vous les encaissez sans bouger de la cuisine. \u00bb</b>",
    ParagraphStyle("quote", parent=BODY, fontSize=11.5, leading=16, textColor=BRAND_DARK,
                   leftIndent=12, rightIndent=12, spaceAfter=10, spaceBefore=6)))
story.append(Paragraph(
    "Trois ruptures simultanees, chacune validee par une fonctionnalite produit livree en v1.0 :",
    BODY))
story.append(bullet("<b>Zero friction client</b> &rarr; page <i>/order/[tableUuid]</i>, session JWT par table, panier persistant <i>localStorage</i>."))
story.append(bullet("<b>Zero materiel restaurateur</b> &rarr; <i>/dashboard/print</i>, planche PDF A4 de QR codes generee en un clic (jsPDF)."))
story.append(bullet("<b>Zero latence cuisine</b> &rarr; dashboard temps reel Socket.io, Kanban PENDING / COOKING / SERVED."))
story.append(bullet("<b>Paiement flexible</b> &rarr; Carte (Stripe Checkout), Caisse, Especes &mdash; l'addition peut etre demandee puis encaissee cote dashboard."))
story.append(bullet("<b>Isolation stricte par table</b> &rarr; UUID par table, le token de la table 3 ne peut pas acceder a la commande de la table 7."))

story.append(Paragraph("4.2 Matrice de positionnement", H2))
story.append(Paragraph(
    "Sur les deux axes structurants du marche &mdash; <i>couverture fonctionnelle</i> "
    "(menu / commande / paiement) et <i>cout d'adoption</i> (materiel, formation, contrat) &mdash; "
    "A table ! occupe un quadrant aujourd'hui inoccupe : couverture complete + adoption legere.",
    BODY))
pos = [
    ["", "Adoption legere", "Adoption lourde"],
    ["Couverture partielle", "QR-menus (Menukard), Sunday", "LaFourchette Pay"],
    ["Couverture complete", "<b>A table !</b>", "Zelty, Lightspeed, Tiller"],
]
pos_rows = [[Paragraph(c, BODY) for c in row] for row in pos]
pos_t = Table(pos_rows, colWidths=[4.5*cm, 5.5*cm, 5.5*cm])
pos_t.setStyle(TableStyle([
    ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#E2E8F0")),
    ("BACKGROUND", (0,0), (-1,0), BG_SOFT),
    ("BACKGROUND", (0,0), (0,-1), BG_SOFT),
    ("BACKGROUND", (1,2), (1,2), BRAND),
    ("TEXTCOLOR", (1,2), (1,2), colors.white),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("TOPPADDING", (0,0), (-1,-1), 10),
    ("BOTTOMPADDING", (0,0), (-1,-1), 10),
]))
story.append(pos_t)
story.append(Spacer(1, 10))

story.append(Paragraph("4.3 Avantages differentiants defensibles", H2))
story.append(bullet("<b>Architecture stateless cross-domain</b> : JWT Bearer + localStorage, pas de cookie tiers &mdash; fonctionne en 4G/5G partage sans configuration IP."))
story.append(bullet("<b>Modele de session par table</b> : elegant pour le client (pas de compte), verrouille cote API (isolation stricte), re-ouvrable apres paiement."))
story.append(bullet("<b>Encaissement multi-mode</b> : Carte / Caisse / Especes sur une meme UI &mdash; couvre les realites de bistrots et brasseries, la ou Sunday se limite a la CB."))
story.append(bullet("<b>Time-to-deploy minutes</b> : un Dockerfile, un <i>railway up</i>, un QR imprime. L'argumentaire commercial tient sur une page."))

# ---------- 5. SWOT ----------
story.append(PageBreak())
story.append(Paragraph("5. Analyse SWOT", H1))
story.append(swot_table())

# ---------- 6. SEGMENTS & GTM ----------
story.append(PageBreak())
story.append(Paragraph("6. Segments cibles &amp; go-to-market", H1))

story.append(Paragraph("6.1 Segments prioritaires", H2))
story.append(bullet("<b>Brasseries et bistrots urbains</b> (30-80 couverts) : volume eleve, rotation rapide, besoin critique de delester le personnel."))
story.append(bullet("<b>Bars et pubs</b> : paiement fragmente, addition partagee, public a l'aise avec le scan QR."))
story.append(bullet("<b>Food-halls et food-courts</b> : multi-stands, un seul QR par table genere la bonne session, mutualisation possible."))
story.append(bullet("<b>Hotellerie room-service</b> : QR en chambre, commande et facturation sur note de chambre (roadmap v1.2)."))
story.append(bullet("<b>Evenementiel &amp; festivals</b> : deploiement ephemere, aucun materiel a prevoir &mdash; cas d'usage parfait pour le modele SaaS."))

story.append(Paragraph("6.2 Strategie de mise sur le marche", H2))
story.append(bullet("<b>Phase 1 &mdash; Q2 2026</b> : pilotes gratuits 30 jours aupres de 20 etablissements parisiens + lyonnais ; objectif de collecte de cas d'usage et de retours UX."))
story.append(bullet("<b>Phase 2 &mdash; Q3 2026</b> : lancement commercial, offre SaaS 29 &euro; / mois / etablissement + commission 0,9 % sur paiement carte."))
story.append(bullet("<b>Phase 3 &mdash; Q4 2026</b> : partenariats editeurs de caisse (integration export Z), programme de parrainage restaurateur."))
story.append(bullet("<b>Phase 4 &mdash; 2027</b> : ouverture internationale (Belgique, Espagne, Italie), multi-devises, TVA par pays."))

story.append(Paragraph("6.3 Hypotheses de tarification", H2))
story.append(kv_table([
    ["Starter", "29 &euro;/mois &middot; 1 etablissement &middot; tables illimitees &middot; 0,9 % commission CB"],
    ["Pro", "59 &euro;/mois &middot; multi-etablissements &middot; 0,6 % commission CB &middot; API"],
    ["Chain", "Sur devis &middot; SLA &middot; SSO &middot; reporting consolide"],
]))
story.append(Paragraph(
    "Benchmark : Sunday &asymp; 1,5 % commission ; Zelty &asymp; 79 &euro;+/mois + licence caisse ; Uber Eats In-Store &asymp; 10-15 %. "
    "Le positionnement prix vise a etre <i>best-in-class</i> sur le rapport valeur / cout total, en assumant une "
    "marge brute ~70 % sur l'abonnement et ~40 % sur la commission (net de frais Stripe).",
    BODY))

# ---------- 7. ROADMAP ----------
story.append(PageBreak())
story.append(Paragraph("7. Roadmap produit consolidee", H1))
story.append(Paragraph(
    "La v1.0 couvre le MVP commande + paiement. Les briques suivantes sont prioritisees pour convertir les "
    "pilotes en clients payants et remporter les appels d'offres face aux editeurs de caisse.",
    BODY))
story.append(kv_table([
    ["v1.0 (livree)", "Menu, commande, paiement Stripe, QR PDF, dashboard temps reel, modes Carte/Caisse/Especes."],
    ["v1.1 (Q2 2026)", "Multi-langues (FR/EN/ES), impression ticket cuisine, pourboires, pre-autorisation CB."],
    ["v1.2 (Q3 2026)", "Integration caisses (Zelty, Tiller, Lightspeed), export Z, rapport journalier."],
    ["v1.3 (Q4 2026)", "Fidelite / NFT-less loyalty, addition partagee, QR dynamique anti-fraude."],
    ["v2.0 (2027)", "Room-service hotelier, multi-devises, marketplace d'add-ons."],
]))

# ---------- 8. CONCLUSION ----------
story.append(Paragraph("8. Conclusion", H1))
story.append(Paragraph(
    "Le marche du QR order+pay en restauration entre dans sa phase de maturation : Sunday a eduque le marche "
    "sur le paiement, les editeurs de caisse ajoutent des modules QR sans reinventer l'experience, les "
    "agregateurs imposent des commissions que les restaurateurs subissent. <b>A table !</b> s'insere precisement "
    "entre ces trois blocs, en offrant la premiere solution qui couvre le triptyque complet <i>menu + commande + paiement</i> "
    "avec un cout d'adoption quasi nul.",
    BODY))
story.append(Paragraph(
    "La v1.0 livree le 19 avril 2026 valide techniquement la these : stack moderne, deploiement cloud natif, "
    "isolation stricte par UUID, encaissement multi-mode. Les 12 prochains mois doivent transformer cet avantage "
    "produit en avantage de distribution : pilotes payants, integrations caisse, reseau de prescripteurs.",
    BODY))
story.append(Spacer(1, 1*cm))
story.append(Paragraph(
    "<i>Document redige en avril 2026 pour l'equipe A table ! &mdash; diffusion interne.</i>",
    SMALL))

# ---------- BUILD ----------
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SLATE_LIGHT)
    canvas.drawString(2*cm, 1.2*cm, "A table ! \u2014 Etude de marche v1.0")
    canvas.drawRightString(A4[0] - 2*cm, 1.2*cm, f"Page {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=1.8*cm, bottomMargin=2*cm,
    title="A table ! - Etude de marche v1.0",
    author="A table !",
)
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"OK -> {OUT}")
