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

  // Testimonials
  testimonialsEyebrow: string;
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonial1Quote: string;
  testimonial1Author: string;
  testimonial1Role: string;
  testimonial2Quote: string;
  testimonial2Author: string;
  testimonial2Role: string;
  testimonial3Quote: string;
  testimonial3Author: string;
  testimonial3Role: string;

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

  // Cabinet partnership / differentiation
  cabinetEyebrow: string;
  cabinetTitle: string;
  cabinetIntro: string;
  cabinetBullet1: string;
  cabinetBullet2: string;
  cabinetBullet3: string;
  cabinetQuote: string;
  cabinetQuoteAuthor: string;
  cabinetQuoteRole: string;

  // FAQ (kept for future /faq page — not rendered on homepage)
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

  heroBadge: "For lawyers who choose clarity",
  heroTitleLine1: "Law, without the labyrinth.",
  heroTitleAccent: "Every clause, exactly where it belongs.",
  heroSubtitle:
    "Draft contracts in minutes. Never face the blank page again.",
  heroCtaPrimary: "See how it works",
  heroCtaSecondary: "Talk to the team",
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

  testimonialsEyebrow: "Voices from the bar",
  testimonialsTitle: "Lawyers who got their time back",
  testimonialsSubtitle:
    "Because legal excellence shouldn't cost hours of formatting.",
  testimonial1Quote:
    "I used to spend two hours on every contract. Now I review in twenty minutes and the client leaves with the document before the end of the meeting.",
  testimonial1Author: "Ana Sousa",
  testimonial1Role: "Family Law Lawyer, Lisbon",
  testimonial2Quote:
    "The Word integration is what convinced me. I work exactly as I always have, just ten times faster.",
  testimonial2Author: "Ricardo Mendes",
  testimonial2Role: "Commercial Lawyer, Porto",
  testimonial3Quote:
    "Client confidentiality is non-negotiable for me. It was the first thing I checked. EasyLaw passes that test.",
  testimonial3Author: "Catarina Ferreira",
  testimonial3Role: "Litigation Lawyer, Coimbra",

  featuresEyebrow: "Built for those who practice law",
  featuresTitle: "Everything you need, nothing you don't",
  featuresIntro:
    "Designed for Portuguese law practitioners. Each tool adapts to how lawyers actually work — from the first draft to the signed archive.",
  feat1Title: "Contracts in minutes",
  feat1Body:
    "Templates validated by lawyers. Precise legal language, compliant with current Portuguese law. No starting from scratch.",
  feat1Price: "€49",
  feat1PriceNote: "per contract — unlimited template access",
  feat2Title: "Compliance without surprises",
  feat2Body:
    "Every document checked against current legislation. Your client signs, you sleep well.",
  feat2Price: "€29",
  feat2PriceNote: "/month — no commitment",
  feat3Title: "The answer before the question",
  feat3Body:
    "Integrated legal search. Articles, precedents, clauses — without leaving the platform.",
  feat3Price: "€19",
  feat3PriceNote: "/month — 10 queries included",
  feat4Title: "Client files, always in order",
  feat4Body:
    "Documents organised, signed and archived in one place. Integrated DMS, instant access.",
  feat4Price: "€29",
  feat4PriceNote: "/month · with Compliance",

  statsEyebrow: "EasyLaw by the numbers",
  statsTitle: "Concrete results, real supervision.",
  stat1Value: "3,200+",
  stat1Label: "lawyers trust EasyLaw",
  stat2Value: "87%",
  stat2Label: "reduce drafting time by more than half",
  stat3Value: "15 yrs",
  stat3Label: "of legal expertise behind the platform",
  stat4Value: "24/7",
  stat4Label: "legal assistant available",

  howEyebrow: "How it works",
  howTitle: "Three steps. Zero surprises.",
  step1Title: "Describe the contract in plain language",
  step1Body:
    "Tell EasyLaw what you need. No rigid forms — just describe the case in your own words.",
  step2Title: "AI drafts. You review and adjust.",
  step2Body:
    "A complete draft appears instantly, grounded in current Portuguese law. Edit every clause before sending.",
  step3Title: "Client signs. Document is archived.",
  step3Body:
    "Send directly for signature. The signed document is automatically archived in the client's file.",

  cabinetEyebrow: "Our identity",
  cabinetTitle: "We're not a multinational. We're built for Portuguese law.",
  cabinetIntro:
    "Every template, every clause, every update reflects the specifics of the Portuguese Civil Code and real court practice.",
  cabinetBullet1:
    "Registered with the Ordem dos Advogados (Professional Card available on request)",
  cabinetBullet2:
    "Professional confidentiality guaranteed — strict data segregation per client file",
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
  faq4Q: "Do the generated contracts have legal standing in Portugal?",
  faq4A:
    "Yes. All templates are drafted by lawyers specialised in Portuguese law and updated in line with legislative changes. The lawyer always retains responsibility for final review — EasyLaw amplifies your work, it doesn't replace it.",
  faq5Q: "How is client confidentiality protected?",
  faq5A:
    "Data is stored on European servers with end-to-end encryption. EasyLaw never accesses your document content for training or analysis purposes. Full compliance with GDPR and bar association deontological requirements.",
  faq6Q: "Can I integrate EasyLaw into my existing workflow?",
  faq6A:
    "Yes. EasyLaw works directly in Microsoft Word via our Add-in, and provides an API for integration with practice management software. No forced migration — start using it where you already work.",
  faq7Q: "Is my data protected?",
  faq7A:
    "Yes. EasyLaw applies TLS 1.3 encryption in transit and AES-256 at rest, complies with GDPR and the Portuguese CNPD, and guarantees strict data segregation per case. No personal data is shared with third parties without your explicit consent.",
  faq8Q: "How much does EasyLaw cost?",
  faq8A:
    "EasyLaw offers four transparent options: Contract Generator (€49 per contract), Compliance Dashboard (€29/month no commitment), Luso-Legal AI (€19/month with 10 queries included), and NIF & Starter Pack (€99 one-time). No hidden fees.",

  finalTitle: "Your next contract, in minutes.",
  finalSubtitle:
    "Join 3,000+ lawyers who already work differently.",
  finalCtaPrimary: "Get started",
  finalCtaSecondary: "Talk to the team",

  footerTagline: "Portuguese law. Simplicity by design.",
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

  heroBadge: "Pour les avocats qui choisissent la clarté",
  heroTitleLine1: "Le droit, sans labyrinthe.",
  heroTitleAccent: "Chaque clause, à sa juste place.",
  heroSubtitle:
    "Rédigez des contrats en quelques minutes. Dites adieu à la page blanche.",
  heroCtaPrimary: "Voir comment ça marche",
  heroCtaSecondary: "Parler à l'équipe",
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

  testimonialsEyebrow: "Voix du barreau",
  testimonialsTitle: "Des avocats qui ont retrouvé leur temps",
  testimonialsSubtitle:
    "Parce que l'excellence juridique ne devrait pas coûter des heures de mise en forme.",
  testimonial1Quote:
    "Avant, je passais deux heures par contrat. Aujourd'hui, je relis en vingt minutes et le client repart avec le document avant la fin du rendez-vous.",
  testimonial1Author: "Ana Sousa",
  testimonial1Role: "Avocate — Droit de la famille, Lisbonne",
  testimonial2Quote:
    "L'intégration avec Word m'a convaincu. Je travaille comme j'ai toujours travaillé, juste dix fois plus vite.",
  testimonial2Author: "Ricardo Mendes",
  testimonial2Role: "Avocat — Droit commercial, Porto",
  testimonial3Quote:
    "La confidentialité de mes clients est non négociable. C'était le premier point que j'ai vérifié. EasyLaw passe ce test.",
  testimonial3Author: "Catarina Ferreira",
  testimonial3Role: "Avocate — Contentieux, Coimbra",

  featuresEyebrow: "Conçu pour ceux qui pratiquent le droit",
  featuresTitle: "Tout ce dont vous avez besoin, rien de superflu",
  featuresIntro:
    "Conçu pour les praticiens du droit portugais. Chaque outil s'adapte à la façon dont les avocats travaillent réellement — du premier brouillon à l'archive signée.",
  feat1Title: "Contrats en quelques minutes",
  feat1Body:
    "Modèles validés par des juristes. Langage juridique précis, conforme au droit portugais en vigueur. Sans repartir de zéro.",
  feat1Price: "49 €",
  feat1PriceNote: "par contrat — accès illimité aux modèles",
  feat2Title: "Conformité sans surprises",
  feat2Body:
    "Chaque document vérifié contre la législation en vigueur. Votre client signe, vous dormez tranquille.",
  feat2Price: "29 €",
  feat2PriceNote: "/mois — sans engagement",
  feat3Title: "La réponse avant la question",
  feat3Body:
    "Recherche juridique intégrée. Articles, précédents, clauses — sans quitter la plateforme.",
  feat3Price: "19 €",
  feat3PriceNote: "/mois — 10 requêtes incluses",
  feat4Title: "Le dossier client, toujours en ordre",
  feat4Body:
    "Documents organisés, signés et archivés en un seul endroit. GED intégré, accès instantané.",
  feat4Price: "29 €",
  feat4PriceNote: "/mois · inclus dans Compliance",

  statsEyebrow: "EasyLaw en chiffres",
  statsTitle: "Des résultats concrets, une supervision réelle.",
  stat1Value: "+3 200",
  stat1Label: "avocats font confiance à EasyLaw",
  stat2Value: "87 %",
  stat2Label: "réduisent leur temps de rédaction de plus de moitié",
  stat3Value: "15 ans",
  stat3Label: "d'expertise juridique derrière la plateforme",
  stat4Value: "24/7",
  stat4Label: "assistant juridique disponible",

  howEyebrow: "Comment ça marche",
  howTitle: "Trois étapes. Zéro surprise.",
  step1Title: "Décrivez le contrat en langage courant",
  step1Body:
    "Dites à EasyLaw ce dont vous avez besoin. Pas de formulaires rigides — parlez comme à un confrère.",
  step2Title: "L'IA rédige. Vous relisez et ajustez.",
  step2Body:
    "Un brouillon complet apparaît en quelques secondes, ancré dans le droit portugais en vigueur. Modifiez chaque clause avant d'envoyer.",
  step3Title: "Le client signe. Le document est archivé.",
  step3Body:
    "Envoyez directement pour signature. Le document signé est automatiquement archivé dans le dossier client.",

  cabinetEyebrow: "Notre identité",
  cabinetTitle: "Nous ne sommes pas une multinationale. Nous sommes faits pour le droit portugais.",
  cabinetIntro:
    "Chaque modèle, chaque clause, chaque mise à jour reflète la spécificité du Code civil portugais et la pratique réelle des tribunaux.",
  cabinetBullet1:
    "Inscrit à l'Ordem dos Advogados (Cédula Profissional disponible sur demande)",
  cabinetBullet2:
    "Secret professionnel garanti — ségrégation stricte des données par dossier client",
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
  faq3Q: "Les contrats générés ont-ils une valeur juridique au Portugal ?",
  faq3A:
    "Oui. Tous les modèles sont élaborés par des juristes spécialisés en droit portugais et mis à jour selon les évolutions législatives. L'avocat conserve toujours la responsabilité de la révision finale — EasyLaw amplifie votre travail, il ne le remplace pas.",
  faq4Q: "Comment le secret professionnel des données de mes clients est-il garanti ?",
  faq4A:
    "Les données sont stockées sur des serveurs européens avec chiffrement de bout en bout. EasyLaw n'accède jamais au contenu de vos documents à des fins d'entraînement ou d'analyse. Conformité totale avec le RGPD et les exigences déontologiques du barreau.",
  faq5Q: "Puis-je intégrer EasyLaw dans mon flux de travail actuel ?",
  faq5A:
    "Oui. EasyLaw fonctionne directement dans Microsoft Word via notre Add-in, et propose une API pour l'intégration avec les logiciels de gestion de cabinet. Sans migration forcée — commencez à l'utiliser là où vous travaillez déjà.",
  faq6Q: "EasyLaw est-il supervisé par de vrais avocats ?",
  faq6A:
    "Oui. Chaque dossier EasyLaw est supervisé par le cabinet Oliveira & Carneiro Advogados, inscrit à l'Ordem dos Advogados depuis 15 ans. La Cédula Profissional est disponible sur demande. Le secret professionnel s'applique à l'ensemble des dossiers traités.",
  faq7Q: "Mes données sont-elles protégées ?",
  faq7A:
    "Oui. EasyLaw applique le chiffrement TLS 1.3 en transit et AES-256 au repos, respecte le RGPD et la CNPD portugaise, et garantit la ségrégation stricte des données par dossier. Aucune donnée personnelle n'est partagée sans votre consentement explicite.",
  faq8Q: "Combien coûte EasyLaw ?",
  faq8A:
    "EasyLaw propose quatre formules transparentes : Générateur de contrats (49 €/contrat), Compliance Dashboard (29 €/mois sans engagement), Luso-Legal IA (19 €/mois avec 10 requêtes) et NIF & Starter Pack (99 € unique). Aucun frais caché.",

  finalTitle: "Votre prochain contrat, en quelques minutes.",
  finalSubtitle:
    "Rejoignez plus de 3 000 avocats qui travaillent déjà différemment.",
  finalCtaPrimary: "Commencer maintenant",
  finalCtaSecondary: "Parler à l'équipe",

  footerTagline: "Droit portugais. Simplicité par design.",
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

  heroBadge: "Para advogados que escolhem clareza",
  heroTitleLine1: "A lei, sem labirinto.",
  heroTitleAccent: "Cada cláusula, no seu lugar.",
  heroSubtitle:
    "Redigir contratos em minutos. Nunca mais a folha em branco.",
  heroCtaPrimary: "Ver como funciona",
  heroCtaSecondary: "Falar com a equipa",
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

  testimonialsEyebrow: "Vozes da advocacia",
  testimonialsTitle: "Advogados que recuperaram o seu tempo",
  testimonialsSubtitle:
    "Porque a excelência jurídica não deveria custar horas de formatação.",
  testimonial1Quote:
    "Antes passava duas horas por contrato. Hoje revejo em vinte minutos e o cliente leva o documento antes de sair do escritório.",
  testimonial1Author: "Ana Sousa",
  testimonial1Role: "Advogada — Direito de família, Lisboa",
  testimonial2Quote:
    "A integração com o Word foi o que me convenceu. Trabalho como sempre trabalhei, mas dez vezes mais depressa.",
  testimonial2Author: "Ricardo Mendes",
  testimonial2Role: "Advogado — Direito comercial, Porto",
  testimonial3Quote:
    "O sigilo dos meus clientes é inegociável. Foi o primeiro ponto que verifiquei. EasyLaw passa nesse teste.",
  testimonial3Author: "Catarina Ferreira",
  testimonial3Role: "Advogada — Contencioso, Coimbra",

  featuresEyebrow: "Feito para quem pratica direito",
  featuresTitle: "Tudo o que precisa, sem o que não precisa",
  featuresIntro:
    "Concebido para os praticantes do direito português. Cada ferramenta adapta-se à forma como os advogados realmente trabalham — do primeiro rascunho ao arquivo assinado.",
  feat1Title: "Contratos em minutos",
  feat1Body:
    "Modelos validados por juristas. Linguagem jurídica precisa, conforme com o direito português em vigor. Sem partir do zero.",
  feat1Price: "49 €",
  feat1PriceNote: "por contrato — acesso ilimitado aos modelos",
  feat2Title: "Conformidade sem surpresas",
  feat2Body:
    "Cada documento verificado contra a legislação em vigor. O seu cliente assina, você dorme tranquilo.",
  feat2Price: "29 €",
  feat2PriceNote: "/mês — sem compromisso",
  feat3Title: "A resposta antes da pergunta",
  feat3Body:
    "Pesquisa jurídica integrada. Artigos, precedentes, cláusulas — sem sair da plataforma.",
  feat3Price: "19 €",
  feat3PriceNote: "/mês — 10 consultas incluídas",
  feat4Title: "O dossier do cliente, sempre em ordem",
  feat4Body:
    "Documentos organizados, assinados e arquivados num único lugar. GED integrado, acesso instantâneo.",
  feat4Price: "29 €",
  feat4PriceNote: "/mês · incluído no Compliance",

  statsEyebrow: "EasyLaw em números",
  statsTitle: "Resultados concretos, supervisão real.",
  stat1Value: "+3.200",
  stat1Label: "advogados confiam no EasyLaw",
  stat2Value: "87%",
  stat2Label: "reduzem o tempo de redação em mais de metade",
  stat3Value: "15 anos",
  stat3Label: "de experiência jurídica por detrás da plataforma",
  stat4Value: "24/7",
  stat4Label: "assistente jurídico disponível",

  howEyebrow: "Como funciona",
  howTitle: "Três passos. Zero surpresas.",
  step1Title: "Descreve o contrato em linguagem comum",
  step1Body:
    "Diga ao EasyLaw o que precisa. Sem formulários rígidos — descreva o contrato com as suas próprias palavras.",
  step2Title: "A IA redige. Tu revês e ajustas.",
  step2Body:
    "Um rascunho completo surge em segundos, ancorado no direito português em vigor. Edite cada cláusula antes de enviar.",
  step3Title: "O cliente assina. O documento fica guardado.",
  step3Body:
    "Envie diretamente para assinatura. O documento assinado é automaticamente arquivado no dossier do cliente.",

  cabinetEyebrow: "A nossa identidade",
  cabinetTitle: "Não somos uma multinacional. Somos feitos para o direito português.",
  cabinetIntro:
    "Cada modelo, cada cláusula, cada atualização reflecte a especificidade do Código Civil português e da prática real dos tribunais.",
  cabinetBullet1:
    "Inscrito na Ordem dos Advogados (Cédula Profissional disponível mediante pedido)",
  cabinetBullet2:
    "Sigilo profissional garantido — segregação estrita dos dados por dossier cliente",
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
  faq2Q: "Os contratos gerados têm valor jurídico em Portugal?",
  faq2A:
    "Sim. Todos os modelos são elaborados por juristas especializados em direito português e atualizados em função das alterações legislativas. O advogado mantém sempre a responsabilidade de revisão final — o EasyLaw amplifica o seu trabalho, não o substitui.",
  faq3Q: "Como é garantido o sigilo profissional dos dados dos meus clientes?",
  faq3A:
    "Os dados são armazenados em servidores europeus com encriptação de ponta-a-ponta. O EasyLaw nunca acede ao conteúdo dos seus documentos para fins de treino ou análise. Conformidade total com o RGPD e com as exigências deontológicas da Ordem dos Advogados.",
  faq4Q: "Posso integrar o EasyLaw no meu fluxo de trabalho atual?",
  faq4A:
    "Sim. O EasyLaw funciona diretamente no Microsoft Word através do nosso Add-in, e disponibiliza uma API para integração com sistemas de gestão de escritório. Sem migrações forçadas — começa a usar onde já trabalha.",
  faq5Q: "Como funciona o Compliance Dashboard?",
  faq5A:
    "O Compliance Dashboard monitoriza automaticamente as suas obrigações legais com código de cores: VERDE (em dia), LARANJA (prazo em 90 dias), VERMELHO (prazo em 30 dias ou em atraso). Alertas automáticos por email e SMS. Subscrição a 29 €/mês, cancelável a qualquer momento.",
  faq6Q: "O Luso-Legal pode substituir um advogado?",
  faq6A:
    "Não. O Luso-Legal fornece informação jurídica geral sobre direito português, não conselhos personalizados. Em casos complexos, escala automaticamente para um advogado humano. Disponível 24h/24 a 19 €/mês com 10 consultas incluídas.",
  faq7Q: "Os meus dados estão protegidos?",
  faq7A:
    "Sim. A EasyLaw aplica ciframento TLS 1.3 em trânsito e AES-256 em repouso, cumpre o RGPD e a CNPD portuguesa, e garante a segregação estrita dos dados por processo. Nenhum dado pessoal é partilhado sem o seu consentimento explícito.",
  faq8Q: "Quanto custa a EasyLaw?",
  faq8A:
    "A EasyLaw propõe quatro opções transparentes: Gerador de contratos (49 €/contrato), Compliance Dashboard (29 €/mês sem compromisso), Luso-Legal IA (19 €/mês com 10 consultas) e NIF & Starter Pack (99 € único). Sem taxas escondidas.",

  finalTitle: "O seu próximo contrato, em minutos.",
  finalSubtitle:
    "Junte-se a mais de 3.000 advogados que já trabalham de forma diferente.",
  finalCtaPrimary: "Começar agora",
  finalCtaSecondary: "Falar com a equipa",

  footerTagline: "Direito português. Simplicidade por design.",
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
