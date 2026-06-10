/**
 * Landing page i18n — EN + FR + PT
 *
 * Pattern manuel inline en attendant migration `next-intl` (OQ-001).
 * Language stored in localStorage via useLanguage hook.
 * Server-render = PT par défaut (marché principal, html.lang="pt").
 */

export type LandingLang = "fr" | "pt" | "en";

export interface LandingMessages {
  // Header
  navProducts: string;
  navHowItWorks: string;
  navPricing: string;
  navCabinet: string;
  signIn: string;
  startCta: string;

  // Hero
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroTrustTls: string;
  heroTrustRgpd: string;
  heroTrustOrdem: string;
  heroTrustVerifiedCabinet: string;

  // Hero NIF tracking card
  nifCardLabel: string;
  nifCardStatus: string;
  nifCardName: string;
  nifCardSubmitted: string;
  nifCardStepDocs: string;
  nifCardStepDocsTime: string;
  nifCardStepPower: string;
  nifCardStepPowerTime: string;
  nifCardStepFinancas: string;
  nifCardStepFinancasEta: string;
  nifCardStepReceived: string;
  nifCardStepReceivedEta: string;
  nifCardPartner: string;

  // Features
  featuresEyebrow: string;
  featuresTitle: string;
  featuresIntro: string;
  feat1Title: string;
  feat1Body: string;
  feat1Price: string;
  feat1PriceNote: string;
  feat2Title: string;
  feat2Body: string;
  feat2Price: string;
  feat2PriceNote: string;
  feat3Title: string;
  feat3Body: string;
  feat3Price: string;
  feat3PriceNote: string;
  feat4Title: string;
  feat4Body: string;
  feat4Price: string;
  feat4PriceNote: string;

  // Stats
  statsEyebrow: string;
  statsTitle: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;

  // How it works
  howEyebrow: string;
  howTitle: string;
  step1Title: string;
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step3Title: string;
  step3Body: string;

  // Cabinet partnership
  cabinetEyebrow: string;
  cabinetTitle: string;
  cabinetIntro: string;
  cabinetBullet1: string;
  cabinetBullet2: string;
  cabinetBullet3: string;
  cabinetQuote: string;
  cabinetQuoteAuthor: string;
  cabinetQuoteRole: string;

  // FAQ
  faqEyebrow: string;
  faqTitle: string;
  faqSubtitle: string;
  faq1Q: string; faq1A: string;
  faq2Q: string; faq2A: string;
  faq3Q: string; faq3A: string;
  faq4Q: string; faq4A: string;
  faq5Q: string; faq5A: string;
  faq6Q: string; faq6A: string;
  faq7Q: string; faq7A: string;
  faq8Q: string; faq8A: string;

  // Final CTA
  finalTitle: string;
  finalSubtitle: string;
  finalCtaPrimary: string;
  finalCtaSecondary: string;

  // Footer
  footerTagline: string;
  footerColProducts: string;
  footerColCompany: string;
  footerColLegal: string;
  footerProd1: string;
  footerProd2: string;
  footerProd3: string;
  footerProd4: string;
  footerCo1: string;
  footerCo2: string;
  footerCo3: string;
  footerCo4: string;
  footerLegal1: string;
  footerLegal2: string;
  footerLegal3: string;
  footerLegal4: string;
  footerCopyright: string;
  footerSupervision: string;
}

/* ─── English ─────────────────────────────────────────────────────────────── */

const en: LandingMessages = {
  navProducts: "Products",
  navHowItWorks: "How it works",
  navPricing: "Pricing",
  navCabinet: "The Firm",
  signIn: "Sign in",
  startCta: "Get started",

  heroBadge: "In partnership with Oliveira & Carneiro Advogados",
  heroTitleLine1: "Portuguese law,",
  heroTitleAccent: "democratized.",
  heroSubtitle:
    "Get your Portuguese NIF in 48 hours, generate NRAU-compliant contracts in minutes, and manage your legal obligations — all supervised by Oliveira & Carneiro Advogados, members of the Ordem dos Advogados for 15 years.",
  heroCtaPrimary: "Start my NIF application — €99",
  heroCtaSecondary: "Watch demo (2 min)",
  heroTrustTls: "TLS 1.3 encrypted",
  heroTrustRgpd: "GDPR compliant",
  heroTrustOrdem: "Ordem dos Advogados",
  heroTrustVerifiedCabinet: "Verified partner firm",

  nifCardLabel: "NIF Application",
  nifCardStatus: "In progress",
  nifCardName: "Lucas Martin",
  nifCardSubmitted: "Submitted on 7 Jun 2026 · 14:23",
  nifCardStepDocs: "Documents verified",
  nifCardStepDocsTime: "7 Jun · 16:08",
  nifCardStepPower: "Power of attorney signed",
  nifCardStepPowerTime: "7 Jun · 18:42",
  nifCardStepFinancas: "Finanças submission in progress",
  nifCardStepFinancasEta: "Estimated: 9 Jun · morning",
  nifCardStepReceived: "NIF received",
  nifCardStepReceivedEta: "Coming soon",
  nifCardPartner: "Partner firm",

  featuresEyebrow: "Our services",
  featuresTitle: "Four tools, a firm behind each one.",
  featuresIntro:
    "Everything expatriates, freelancers, and SMEs need to navigate Portuguese law — without paying inaccessible fees. Every case is supervised by a lawyer registered with the Ordem dos Advogados.",
  feat1Title: "NIF & Starter Pack",
  feat1Body:
    "Get your Portuguese NIF in 48 working hours typically. Power of attorney generated automatically, Finanças submission handled by our partner firm. No travel required. Bank account optional.",
  feat1Price: "€99",
  feat1PriceNote: "one-time payment — no subscription",
  feat2Title: "Contract Generator",
  feat2Body:
    "5 templates compliant with Portuguese law: NRAU residential lease, service agreement, CDD/CDI employment contract, Lda articles of association, power of attorney. Guided questionnaire, real-time PDF preview, instant download.",
  feat2Price: "€49",
  feat2PriceNote: "per contract — unlimited template access",
  feat3Title: "Compliance Dashboard",
  feat3Body:
    "Your SME legal deadlines monitored automatically: GREEN (up to date), ORANGE (90 days), RED (30 days or overdue). Automatic email + SMS alerts when a deadline approaches. Cancel anytime.",
  feat3Price: "€29",
  feat3PriceNote: "/month — no commitment",
  feat4Title: "Luso-Legal — AI Legal Assistant",
  feat4Body:
    "24/7 assistant specialized in Portuguese law, trained on DRE and DGSI case law. 10 questions/month included. Escalation to a human lawyer for complex cases. Does not replace personalized legal advice.",
  feat4Price: "€19",
  feat4PriceNote: "/month — 10 questions included",

  statsEyebrow: "EasyLaw by the numbers",
  statsTitle: "Concrete results, real supervision.",
  stat1Value: "48h",
  stat1Label: "typical time to get your NIF",
  stat2Value: "€99",
  stat2Label: "all-in for your Portuguese NIF",
  stat3Value: "15 yrs",
  stat3Label: "expertise at Oliveira & Carneiro",
  stat4Value: "24/7",
  stat4Label: "AI legal assistant available",

  howEyebrow: "How it works",
  howTitle: "Three steps. Zero surprises.",
  step1Title: "You choose",
  step1Body:
    "NIF, contract, compliance, AI advice. Pricing shown upfront — no hidden quotes, no surprise fees.",
  step2Title: "We handle it",
  step2Body:
    "Oliveira & Carneiro oversees every case. Documents encrypted AES-256. GDPR compliant. Track progress in real time from your dashboard.",
  step3Title: "You receive",
  step3Body:
    "NIF by email within 48h, contracts downloadable immediately, timely compliance alerts by email and SMS.",

  cabinetEyebrow: "Strategic partnership",
  cabinetTitle: "Oliveira & Carneiro Advogados — a real firm behind every case.",
  cabinetIntro:
    "EasyLaw is not a PDF generator. Every case is supervised by a lawyer registered with the Ordem dos Advogados, ensuring legal compliance and professional confidentiality. No decision is made by an algorithm alone.",
  cabinetBullet1:
    "Registered with the Ordem dos Advogados (Professional Card available on request)",
  cabinetBullet2:
    "Professional confidentiality guaranteed — strict data segregation per case",
  cabinetBullet3:
    "15 years of experience in Portuguese migration, tax, and commercial law",
  cabinetQuote:
    "EasyLaw allows us to serve hundreds of clients we would never have reached through a traditional firm — and each one receives the same legal quality.",
  cabinetQuoteAuthor: "Manuel Carneiro",
  cabinetQuoteRole: "Associate Lawyer, Oliveira & Carneiro",

  faqEyebrow: "Frequently asked questions",
  faqTitle: "Everything you need to know.",
  faqSubtitle: "Can't find the answer? Our team responds within 24 hours.",
  faq1Q: "What is the Portuguese NIF?",
  faq1A:
    "The NIF (Número de Identificação Fiscal) is the Portuguese tax identification number, required to open a bank account, sign a lease, register a company, or complete any legal transaction in Portugal. EasyLaw obtains it in 48 hours through Oliveira & Carneiro Advogados, with no travel required.",
  faq2Q: "How long does it take to get a NIF with EasyLaw?",
  faq2A:
    "EasyLaw typically obtains your Portuguese NIF in 48 working hours. The process includes automatic power of attorney generation, document verification, and filing with Finanças by our partner firm. The NIF is sent to you by email upon receipt.",
  faq3Q: "Is EasyLaw supervised by real lawyers?",
  faq3A:
    "Yes. Every EasyLaw case is supervised by Oliveira & Carneiro Advogados, registered with the Ordem dos Advogados for 15 years. The Professional Card is available on request. Professional confidentiality applies to all cases handled.",
  faq4Q: "What types of contracts can I generate?",
  faq4A:
    "EasyLaw offers 5 contract templates compliant with Portuguese law: NRAU residential lease, service agreement, CDD/CDI employment contract, Lda articles of association, and power of attorney. Each contract is generated in real time with PDF preview and updated per current legislation.",
  faq5Q: "How does the Compliance Dashboard work?",
  faq5A:
    "The Compliance Dashboard automatically monitors your legal obligations with a colour code: GREEN (up to date), ORANGE (due in 90 days), RED (due in 30 days or overdue). You receive automatic email and SMS alerts. Subscription at €29/month, cancellable at any time.",
  faq6Q: "Can Luso-Legal replace a lawyer?",
  faq6A:
    "No. Luso-Legal provides general legal information about Portuguese law, not personalized advice. For complex cases, it automatically escalates to a human lawyer from Oliveira & Carneiro. Available 24/7 at €19/month with 10 questions included.",
  faq7Q: "Is my data protected?",
  faq7A:
    "Yes. EasyLaw applies TLS 1.3 encryption in transit and AES-256 at rest, complies with GDPR and the Portuguese CNPD, and guarantees strict data segregation per case. No personal data is shared with third parties without your explicit consent.",
  faq8Q: "How much does EasyLaw cost?",
  faq8A:
    "EasyLaw offers four transparent options: NIF & Starter Pack (€99 one-time), Contract Generator (€49 per contract), Compliance Dashboard (€29/month no commitment), and Luso-Legal AI (€19/month with 10 questions included). No hidden fees, no forced subscriptions.",

  finalTitle: "Ready to simplify your relationship with Portuguese law?",
  finalSubtitle:
    "Start with your NIF at €99, or explore our tools for free. No commitment.",
  finalCtaPrimary: "Start my NIF application",
  finalCtaSecondary: "Talk to an advisor",

  footerTagline: "Legal platform for Portugal. Supervised by Oliveira & Carneiro Advogados.",
  footerColProducts: "Products",
  footerColCompany: "Company",
  footerColLegal: "Legal",
  footerProd1: "NIF & Starter Pack",
  footerProd2: "Contract Generator",
  footerProd3: "Compliance Dashboard",
  footerProd4: "Luso-Legal AI",
  footerCo1: "About",
  footerCo2: "The Firm",
  footerCo3: "Contact",
  footerCo4: "Blog",
  footerLegal1: "Terms of Service",
  footerLegal2: "Privacy Policy",
  footerLegal3: "Cookie Policy",
  footerLegal4: "Legal Notice",
  footerCopyright: "© 2026 EasyLaw. All rights reserved.",
  footerSupervision:
    "EasyLaw is a technology platform. Legal acts are supervised by Oliveira & Carneiro Advogados (Ordem dos Advogados).",
};

/* ─── French ──────────────────────────────────────────────────────────────── */

const fr: LandingMessages = {
  navProducts: "Produits",
  navHowItWorks: "Comment ça marche",
  navPricing: "Tarifs",
  navCabinet: "Le Cabinet",
  signIn: "Se connecter",
  startCta: "Commencer",

  heroBadge: "En partenariat avec Oliveira & Carneiro Advogados",
  heroTitleLine1: "Le droit portugais,",
  heroTitleAccent: "démocratisé.",
  heroSubtitle:
    "Obtenez votre NIF portugais en 48h, générez des contrats conformes NRAU en quelques clics, et pilotez vos obligations légales — le tout supervisé par Oliveira & Carneiro Advogados, inscrits à l'Ordem dos Advogados depuis 15 ans.",
  heroCtaPrimary: "Commencer mon dossier NIF — 99 €",
  heroCtaSecondary: "Voir la démo (2 min)",
  heroTrustTls: "TLS 1.3 chiffré",
  heroTrustRgpd: "Conforme RGPD",
  heroTrustOrdem: "Ordem dos Advogados",
  heroTrustVerifiedCabinet: "Cabinet partenaire vérifié",

  nifCardLabel: "Dossier NIF",
  nifCardStatus: "En cours",
  nifCardName: "Lucas Martin",
  nifCardSubmitted: "Soumis le 7 juin 2026 · 14:23",
  nifCardStepDocs: "Documents vérifiés",
  nifCardStepDocsTime: "7 juin · 16:08",
  nifCardStepPower: "Procuration signée",
  nifCardStepPowerTime: "7 juin · 18:42",
  nifCardStepFinancas: "Dépôt Finanças en cours",
  nifCardStepFinancasEta: "Estimation : 9 juin · matinée",
  nifCardStepReceived: "NIF reçu",
  nifCardStepReceivedEta: "À venir",
  nifCardPartner: "Cabinet partenaire",

  featuresEyebrow: "Notre offre grand public",
  featuresTitle: "Quatre outils, un cabinet derrière chacun.",
  featuresIntro:
    "Tout ce dont les expatriés, freelances et PME ont besoin pour naviguer le droit portugais — sans payer des honoraires inaccessibles. Chaque dossier est supervisé par un avocat inscrit à l'Ordem dos Advogados.",
  feat1Title: "NIF & Starter Pack",
  feat1Body:
    "Obtenez votre NIF portugais habituellement en 48 heures ouvrées. Procuration générée automatiquement, dépôt auprès des Finanças assuré par notre cabinet partenaire. Aucun déplacement requis. Compte bancaire en option.",
  feat1Price: "99 €",
  feat1PriceNote: "paiement unique — sans abonnement",
  feat2Title: "Générateur de contrats",
  feat2Body:
    "5 modèles conformes au droit portugais : bail NRAU, prestation de services, CDD/CDI, statuts Lda, procuration. Questionnaire guidé, prévisualisation PDF en temps réel, téléchargement immédiat après paiement.",
  feat2Price: "49 €",
  feat2PriceNote: "par contrat — accès illimité aux modèles",
  feat3Title: "Compliance Dashboard",
  feat3Body:
    "Vos échéances légales PME surveillées automatiquement : VERT (à jour), ORANGE (90 jours), ROUGE (30 jours ou en retard). Alertes email + SMS automatiques. Résiliable à tout moment.",
  feat3Price: "29 €",
  feat3PriceNote: "/mois — sans engagement",
  feat4Title: "Luso-Legal — IA juridique",
  feat4Body:
    "Assistant 24h/24 spécialisé droit portugais, formé sur la jurisprudence DRE et DGSI. 10 questions/mois incluses. Escalade vers un avocat humain pour les cas complexes. Ne remplace pas un conseil personnalisé.",
  feat4Price: "19 €",
  feat4PriceNote: "/mois — 10 questions incluses",

  statsEyebrow: "EasyLaw en chiffres",
  statsTitle: "Des résultats concrets, une supervision réelle.",
  stat1Value: "48h",
  stat1Label: "délai habituel pour obtenir votre NIF",
  stat2Value: "99 €",
  stat2Label: "tout compris pour votre NIF portugais",
  stat3Value: "15 ans",
  stat3Label: "d'expertise du cabinet Oliveira & Carneiro",
  stat4Value: "24/7",
  stat4Label: "assistant IA juridique disponible",

  howEyebrow: "Comment ça marche",
  howTitle: "Trois étapes. Zéro surprise.",
  step1Title: "Vous choisissez",
  step1Body:
    "NIF, contrat, compliance, conseil IA. Pricing affiché avant de commencer — jamais de devis caché, jamais de frais supplémentaires.",
  step2Title: "Nous traitons",
  step2Body:
    "Le cabinet Oliveira & Carneiro supervise chaque dossier. Documents chiffrés AES-256. RGPD respecté. Suivi en temps réel depuis votre espace.",
  step3Title: "Vous recevez",
  step3Body:
    "NIF par email sous 48h, contrats téléchargeables immédiatement, alertes compliance par email et SMS.",

  cabinetEyebrow: "Partenariat stratégique",
  cabinetTitle: "Oliveira & Carneiro Advogados — un vrai cabinet derrière chaque dossier.",
  cabinetIntro:
    "EasyLaw n'est pas un agrégateur de PDF. Chaque dossier est supervisé par un avocat inscrit à l'Ordem dos Advogados, garantissant la conformité juridique et le secret professionnel. Aucune décision n'est prise par un algorithme seul.",
  cabinetBullet1:
    "Inscrit Ordem dos Advogados (Cédula Profissional disponible sur demande)",
  cabinetBullet2:
    "Secret professionnel garanti — ségrégation stricte des données par dossier",
  cabinetBullet3:
    "15 ans d'expérience en droit migratoire, fiscal et commercial portugais",
  cabinetQuote:
    "EasyLaw nous permet de servir des centaines de clients que nous n'aurions jamais touchés en cabinet traditionnel — et chacun reçoit la même qualité juridique.",
  cabinetQuoteAuthor: "Manuel Carneiro",
  cabinetQuoteRole: "Avocat associé, Oliveira & Carneiro",

  faqEyebrow: "Questions fréquentes",
  faqTitle: "Tout ce que vous devez savoir.",
  faqSubtitle: "Vous ne trouvez pas la réponse ? Notre équipe répond en moins de 24h.",
  faq1Q: "Qu'est-ce que le NIF portugais ?",
  faq1A:
    "Le NIF (Número de Identificação Fiscal) est le numéro d'identification fiscale portugais, obligatoire pour ouvrir un compte bancaire, signer un bail, créer une entreprise ou réaliser tout acte juridique au Portugal. EasyLaw l'obtient en 48h grâce au cabinet Oliveira & Carneiro Advogados, sans déplacement.",
  faq2Q: "Combien de temps faut-il pour obtenir un NIF avec EasyLaw ?",
  faq2A:
    "EasyLaw obtient votre NIF portugais habituellement en 48 heures ouvrées. Le processus inclut la génération automatique d'une procuration, la vérification de vos documents et le dépôt auprès des Finanças par notre cabinet partenaire. Le NIF vous est transmis par email dès réception.",
  faq3Q: "EasyLaw est-il supervisé par de vrais avocats ?",
  faq3A:
    "Oui. Chaque dossier EasyLaw est supervisé par le cabinet Oliveira & Carneiro Advogados, inscrit à l'Ordem dos Advogados depuis 15 ans. La Cédula Profissional est disponible sur demande. Le secret professionnel s'applique à l'ensemble des dossiers traités.",
  faq4Q: "Quels types de contrats puis-je générer ?",
  faq4A:
    "EasyLaw propose 5 modèles de contrats conformes au droit portugais : bail d'habitation NRAU, contrat de prestation de services, CDD/CDI, statuts de société Lda, et procuration. Chaque contrat est généré en temps réel avec prévisualisation PDF et mis à jour selon la législation en vigueur.",
  faq5Q: "Comment fonctionne le Compliance Dashboard ?",
  faq5A:
    "Le Compliance Dashboard surveille automatiquement vos obligations légales avec un code couleur : VERT (à jour), ORANGE (échéance dans 90 jours), ROUGE (dans 30 jours ou dépassée). Alertes email et SMS automatiques. Abonnement à 29 €/mois, résiliable à tout moment.",
  faq6Q: "Luso-Legal peut-il remplacer un avocat ?",
  faq6A:
    "Non. Luso-Legal fournit des informations juridiques générales sur le droit portugais, pas des conseils personnalisés. Pour les cas complexes, il escalade automatiquement vers un avocat humain. Disponible 24h/24 à 19 €/mois avec 10 questions incluses.",
  faq7Q: "Mes données sont-elles protégées ?",
  faq7A:
    "Oui. EasyLaw applique le chiffrement TLS 1.3 en transit et AES-256 au repos, respecte le RGPD et la CNPD portugaise, et garantit la ségrégation stricte des données par dossier. Aucune donnée personnelle n'est partagée sans votre consentement explicite.",
  faq8Q: "Combien coûte EasyLaw ?",
  faq8A:
    "EasyLaw propose quatre formules transparentes : NIF & Starter Pack (99 € unique), Générateur de contrats (49 € par contrat), Compliance Dashboard (29 €/mois sans engagement) et Luso-Legal IA (19 €/mois avec 10 questions incluses). Aucun frais caché.",

  finalTitle: "Prêt à simplifier votre relation au droit portugais ?",
  finalSubtitle:
    "Commencez avec votre NIF à 99 €, ou explorez gratuitement nos outils. Aucun engagement.",
  finalCtaPrimary: "Commencer mon dossier NIF",
  finalCtaSecondary: "Parler à un conseiller",

  footerTagline: "Plateforme juridique pour le Portugal. Supervisée par Oliveira & Carneiro Advogados.",
  footerColProducts: "Produits",
  footerColCompany: "Société",
  footerColLegal: "Légal",
  footerProd1: "NIF & Starter Pack",
  footerProd2: "Générateur de contrats",
  footerProd3: "Compliance Dashboard",
  footerProd4: "Luso-Legal IA",
  footerCo1: "À propos",
  footerCo2: "Le Cabinet",
  footerCo3: "Contact",
  footerCo4: "Blog",
  footerLegal1: "CGU",
  footerLegal2: "Politique de confidentialité",
  footerLegal3: "Politique cookies",
  footerLegal4: "Mentions légales",
  footerCopyright: "© 2026 EasyLaw. Tous droits réservés.",
  footerSupervision:
    "EasyLaw est une plateforme technologique. Les actes juridiques sont supervisés par Oliveira & Carneiro Advogados (Ordem dos Advogados).",
};

/* ─── Portuguese ──────────────────────────────────────────────────────────── */

const pt: LandingMessages = {
  navProducts: "Produtos",
  navHowItWorks: "Como funciona",
  navPricing: "Preços",
  navCabinet: "O Escritório",
  signIn: "Iniciar sessão",
  startCta: "Começar",

  heroBadge: "Em parceria com Oliveira & Carneiro Advogados",
  heroTitleLine1: "O direito português,",
  heroTitleAccent: "democratizado.",
  heroSubtitle:
    "Obtenha o seu NIF português em 48h, gere contratos conformes NRAU em poucos cliques, e gira as suas obrigações legais — tudo supervisionado pela Oliveira & Carneiro Advogados, inscritos na Ordem dos Advogados há 15 anos.",
  heroCtaPrimary: "Começar o meu processo NIF — 99 €",
  heroCtaSecondary: "Ver a demo (2 min)",
  heroTrustTls: "TLS 1.3 cifrado",
  heroTrustRgpd: "Conforme RGPD",
  heroTrustOrdem: "Ordem dos Advogados",
  heroTrustVerifiedCabinet: "Escritório parceiro verificado",

  nifCardLabel: "Processo NIF",
  nifCardStatus: "Em curso",
  nifCardName: "Lucas Martin",
  nifCardSubmitted: "Submetido em 7 jun. 2026 · 14:23",
  nifCardStepDocs: "Documentos verificados",
  nifCardStepDocsTime: "7 jun. · 16:08",
  nifCardStepPower: "Procuração assinada",
  nifCardStepPowerTime: "7 jun. · 18:42",
  nifCardStepFinancas: "Submissão Finanças em curso",
  nifCardStepFinancasEta: "Estimativa: 9 jun. · manhã",
  nifCardStepReceived: "NIF recebido",
  nifCardStepReceivedEta: "Em breve",
  nifCardPartner: "Escritório parceiro",

  featuresEyebrow: "A nossa oferta para particulares",
  featuresTitle: "Quatro ferramentas, um escritório por trás de cada uma.",
  featuresIntro:
    "Tudo o que expatriados, freelancers e PMEs precisam para navegar o direito português — sem pagar honorários inacessíveis. Cada processo é supervisionado por um advogado inscrito na Ordem dos Advogados.",
  feat1Title: "NIF & Starter Pack",
  feat1Body:
    "Obtenha o seu NIF português habitualmente em 48 horas úteis. Procuração gerada automaticamente, submissão às Finanças assegurada pelo escritório parceiro. Sem necessidade de deslocação. Conta bancária opcional.",
  feat1Price: "99 €",
  feat1PriceNote: "pagamento único — sem subscrição",
  feat2Title: "Gerador de contratos",
  feat2Body:
    "5 modelos conformes com o direito português: arrendamento NRAU, prestação de serviços, CDD/CDI, estatutos Lda, procuração. Questionário guiado, pré-visualização PDF em tempo real, download imediato após pagamento.",
  feat2Price: "49 €",
  feat2PriceNote: "por contrato — acesso ilimitado aos modelos",
  feat3Title: "Compliance Dashboard",
  feat3Body:
    "As suas obrigações legais PME monitorizadas automaticamente: VERDE (em dia), LARANJA (90 dias), VERMELHO (30 dias ou em atraso). Alertas email + SMS automáticos. Cancelável a qualquer momento.",
  feat3Price: "29 €",
  feat3PriceNote: "/mês — sem compromisso",
  feat4Title: "Luso-Legal — IA jurídica",
  feat4Body:
    "Assistente 24h/24 especializado em direito português, treinado na jurisprudência DRE e DGSI. 10 perguntas/mês incluídas. Escalação para advogado humano em casos complexos. Não substitui conselho personalizado.",
  feat4Price: "19 €",
  feat4PriceNote: "/mês — 10 perguntas incluídas",

  statsEyebrow: "EasyLaw em números",
  statsTitle: "Resultados concretos, supervisão real.",
  stat1Value: "48h",
  stat1Label: "prazo habitual para obter o seu NIF",
  stat2Value: "99 €",
  stat2Label: "tudo incluído para o seu NIF português",
  stat3Value: "15 anos",
  stat3Label: "de expertise do escritório Oliveira & Carneiro",
  stat4Value: "24/7",
  stat4Label: "assistente IA jurídico disponível",

  howEyebrow: "Como funciona",
  howTitle: "Três passos. Zero surpresas.",
  step1Title: "Escolhe",
  step1Body:
    "NIF, contrato, compliance, conselho IA. Preço afixado antes de começar — nunca orçamentos escondidos, nunca taxas não anunciadas.",
  step2Title: "Nós tratamos",
  step2Body:
    "O escritório Oliveira & Carneiro supervisiona cada processo. Documentos cifrados AES-256. RGPD respeitado. Acompanha o estado em tempo real.",
  step3Title: "Você recebe",
  step3Body:
    "NIF por email em 48h, contratos descarregáveis imediatamente, alertas de compliance por email e SMS.",

  cabinetEyebrow: "Parceria estratégica",
  cabinetTitle: "Oliveira & Carneiro Advogados — um verdadeiro escritório por trás de cada processo.",
  cabinetIntro:
    "A EasyLaw não é um agregador de PDFs. Cada processo é supervisionado por um advogado inscrito na Ordem dos Advogados, garantindo a conformidade jurídica e o sigilo profissional. Nenhuma decisão é tomada apenas por um algoritmo.",
  cabinetBullet1:
    "Inscrito na Ordem dos Advogados (Cédula Profissional disponível mediante pedido)",
  cabinetBullet2:
    "Sigilo profissional garantido — segregação estrita dos dados por processo",
  cabinetBullet3:
    "15 anos de experiência em direito migratório, fiscal e comercial português",
  cabinetQuote:
    "A EasyLaw permite-nos servir centenas de clientes que nunca teríamos tocado num escritório tradicional — e cada um recebe a mesma qualidade jurídica.",
  cabinetQuoteAuthor: "Manuel Carneiro",
  cabinetQuoteRole: "Advogado associado, Oliveira & Carneiro",

  faqEyebrow: "Perguntas frequentes",
  faqTitle: "Tudo o que precisa de saber.",
  faqSubtitle: "Não encontra a resposta? A nossa equipa responde em menos de 24 horas.",
  faq1Q: "O que é o NIF português?",
  faq1A:
    "O NIF (Número de Identificação Fiscal) é o número de identificação fiscal obrigatório para abrir conta bancária, assinar um contrato de arrendamento, criar uma empresa ou realizar qualquer ato jurídico em Portugal. A EasyLaw obtém-no em 48h através do escritório parceiro Oliveira & Carneiro Advogados, sem necessidade de deslocação.",
  faq2Q: "Quanto tempo demora a obter o NIF com a EasyLaw?",
  faq2A:
    "A EasyLaw obtém o seu NIF português habitualmente em 48 horas úteis. O processo inclui a geração automática de procuração, a verificação dos seus documentos e a submissão às Finanças pelo escritório parceiro. O NIF é-lhe enviado por email assim que recebido.",
  faq3Q: "A EasyLaw é supervisionada por advogados reais?",
  faq3A:
    "Sim. Cada processo da EasyLaw é supervisionado pelo escritório Oliveira & Carneiro Advogados, inscrito na Ordem dos Advogados há 15 anos. A Cédula Profissional está disponível mediante pedido. O sigilo profissional aplica-se a todos os processos tratados.",
  faq4Q: "Que tipos de contratos posso gerar?",
  faq4A:
    "A EasyLaw oferece 5 modelos de contratos conformes com o direito português: arrendamento habitacional NRAU, contrato de prestação de serviços, CDD/CDI, estatutos de sociedade Lda e procuração. Cada contrato é gerado em tempo real com pré-visualização PDF e atualizado conforme a legislação em vigor.",
  faq5Q: "Como funciona o Compliance Dashboard?",
  faq5A:
    "O Compliance Dashboard monitoriza automaticamente as suas obrigações legais com código de cores: VERDE (em dia), LARANJA (prazo em 90 dias), VERMELHO (prazo em 30 dias ou em atraso). Alertas automáticos por email e SMS. Subscrição a 29 €/mês, cancelável a qualquer momento.",
  faq6Q: "O Luso-Legal pode substituir um advogado?",
  faq6A:
    "Não. O Luso-Legal fornece informação jurídica geral sobre direito português, não conselhos personalizados. Em casos complexos, escala automaticamente para um advogado humano. Disponível 24h/24 a 19 €/mês com 10 perguntas incluídas.",
  faq7Q: "Os meus dados estão protegidos?",
  faq7A:
    "Sim. A EasyLaw aplica ciframento TLS 1.3 em trânsito e AES-256 em repouso, cumpre o RGPD e a CNPD portuguesa, e garante a segregação estrita dos dados por processo. Nenhum dado pessoal é partilhado sem o seu consentimento explícito.",
  faq8Q: "Quanto custa a EasyLaw?",
  faq8A:
    "A EasyLaw propõe quatro opções transparentes: NIF & Starter Pack (99 € único), Gerador de contratos (49 € por contrato), Compliance Dashboard (29 €/mês sem compromisso) e Luso-Legal IA (19 €/mês com 10 perguntas incluídas). Sem taxas escondidas.",

  finalTitle: "Pronto para simplificar a sua relação com o direito português?",
  finalSubtitle:
    "Comece com o seu NIF a 99 €, ou explore as nossas ferramentas gratuitamente. Sem compromisso.",
  finalCtaPrimary: "Começar o meu processo NIF",
  finalCtaSecondary: "Falar com um consultor",

  footerTagline: "Plataforma jurídica para Portugal. Supervisionada pela Oliveira & Carneiro Advogados.",
  footerColProducts: "Produtos",
  footerColCompany: "Empresa",
  footerColLegal: "Legal",
  footerProd1: "NIF & Starter Pack",
  footerProd2: "Gerador de contratos",
  footerProd3: "Compliance Dashboard",
  footerProd4: "Luso-Legal IA",
  footerCo1: "Sobre",
  footerCo2: "O Escritório",
  footerCo3: "Contacto",
  footerCo4: "Blog",
  footerLegal1: "Termos de utilização",
  footerLegal2: "Política de privacidade",
  footerLegal3: "Política de cookies",
  footerLegal4: "Menções legais",
  footerCopyright: "© 2026 EasyLaw. Todos os direitos reservados.",
  footerSupervision:
    "A EasyLaw é uma plataforma tecnológica. Os atos jurídicos são supervisionados pela Oliveira & Carneiro Advogados (Ordem dos Advogados).",
};

/* ─── Registry ────────────────────────────────────────────────────────────── */

const all: Record<LandingLang, LandingMessages> = { en, fr, pt };

export function getLandingMessages(lang: string | undefined): LandingMessages {
  const code = (lang ?? "").toLowerCase().slice(0, 2) as LandingLang;
  return all[code] ?? all.pt;
}
