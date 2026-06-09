/**
 * Landing page i18n — FR + PT (P2)
 *
 * Pattern manuel inline en attendant migration `next-intl` (OQ-001).
 * Lecture du `lang` côté client via `document.documentElement.lang` (cf. ConsentBanner).
 * Server-render = PT par défaut (marché principal, html.lang="pt").
 */

export type LandingLang = "fr" | "pt";

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
    "NIF habituellement en 48h, contrats conformes en quelques clics, conformité PME pilotée — supervisé par un véritable cabinet d'avocats portugais.",
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
    "Tout ce dont les expatriés, freelances et PME ont besoin pour naviguer le droit portugais — sans payer des honoraires inaccessibles.",
  feat1Title: "NIF & Starter Pack",
  feat1Body:
    "Obtenez votre NIF portugais — habituellement en 48h. Procuration générée automatiquement, dépôt Finanças par notre cabinet partenaire. Compte bancaire optionnel.",
  feat1Price: "99 €",
  feat1PriceNote: "paiement unique",
  feat2Title: "Générateur de contrats",
  feat2Body:
    "5 modèles MVP : bail NRAU, prestation de services, CDD/CDI, statuts Lda, procuration. Conformes, à jour, prévisualisation PDF en temps réel.",
  feat2Price: "49 €",
  feat2PriceNote: "par contrat",
  feat3Title: "Compliance Dashboard",
  feat3Body:
    "Vos échéances légales en un coup d'œil : VERT (à jour), ORANGE (90 jours), ROUGE (30 jours ou retard). Alertes email + SMS automatiques.",
  feat3Price: "29 €",
  feat3PriceNote: "/mois",
  feat4Title: "Luso-Legal — IA juridique",
  feat4Body:
    "Assistant 24h/24 spécialisé droit portugais, formé sur la jurisprudence DRE/DGSI. Escalade vers un avocat humain pour les cas complexes.",
  feat4Price: "19 €",
  feat4PriceNote: "/mois — 10 questions/mois inclus",

  howEyebrow: "Comment ça marche",
  howTitle: "Trois étapes. Zéro surprise.",
  step1Title: "Vous choisissez",
  step1Body:
    "NIF, contrat, compliance, conseil IA. Pricing affiché avant de commencer, jamais de devis caché.",
  step2Title: "Nous traitons",
  step2Body:
    "Le cabinet Oliveira & Carneiro supervise chaque dossier. Documents chiffrés AES-256. RGPD respecté.",
  step3Title: "Vous recevez",
  step3Body:
    "NIF par email, contrats téléchargeables immédiatement, alertes compliance ponctuelles.",

  cabinetEyebrow: "Partenariat stratégique",
  cabinetTitle:
    "Oliveira & Carneiro Advogados — un vrai cabinet derrière chaque dossier.",
  cabinetIntro:
    "EasyLaw n'est pas un agrégateur de PDF. Chaque dossier est supervisé par un avocat inscrit à l'Ordem dos Advogados, garantissant la conformité juridique et le secret professionnel.",
  cabinetBullet1:
    "Inscrit Ordem dos Advogados (Cédula Profissional disponible sur demande)",
  cabinetBullet2:
    "Secret professionnel garanti — ségrégation stricte des données",
  cabinetBullet3:
    "15 ans d'expérience en droit migratoire et commercial portugais",
  cabinetQuote:
    "EasyLaw nous permet de servir des centaines de clients que nous n'aurions jamais touchés en cabinet traditionnel — et chacun reçoit la même qualité juridique.",
  cabinetQuoteAuthor: "Manuel Carneiro",
  cabinetQuoteRole: "Avocat associé, Oliveira & Carneiro",

  finalTitle: "Prêt à simplifier votre relation au droit portugais ?",
  finalSubtitle:
    "Commencez avec votre NIF, ou explorez gratuitement nos outils.",
  finalCtaPrimary: "Commencer mon dossier NIF",
  finalCtaSecondary: "Parler à un conseiller",

  footerTagline:
    "Plateforme juridique pour le Portugal. Supervisée par Oliveira & Carneiro Advogados.",
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
  footerLegal3: "RGPD",
  footerLegal4: "Mentions légales",
  footerCopyright: "© 2026 EasyLaw. Tous droits réservés.",
  footerSupervision:
    "EasyLaw est une plateforme technologique. Les actes juridiques sont supervisés par Oliveira & Carneiro Advogados (Ordem dos Advogados).",
};

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
    "NIF habitualmente em 48h, contratos conformes em poucos cliques, compliance PME pilotada — supervisionado por um verdadeiro escritório de advogados português.",
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
    "Tudo o que expatriados, freelancers e PMEs precisam para navegar o direito português — sem pagar honorários inacessíveis.",
  feat1Title: "NIF & Starter Pack",
  feat1Body:
    "Obtenha o seu NIF português — habitualmente em 48h. Procuração gerada automaticamente, submissão às Finanças pelo nosso escritório parceiro. Conta bancária opcional.",
  feat1Price: "99 €",
  feat1PriceNote: "pagamento único",
  feat2Title: "Gerador de contratos",
  feat2Body:
    "5 modelos MVP: arrendamento NRAU, prestação de serviços, CDD/CDI, estatutos Lda, procuração. Conformes, atualizados, pré-visualização PDF em tempo real.",
  feat2Price: "49 €",
  feat2PriceNote: "por contrato",
  feat3Title: "Compliance Dashboard",
  feat3Body:
    "As suas obrigações legais num relance: VERDE (em dia), LARANJA (90 dias), VERMELHO (30 dias ou em atraso). Alertas email + SMS automáticos.",
  feat3Price: "29 €",
  feat3PriceNote: "/mês",
  feat4Title: "Luso-Legal — IA jurídica",
  feat4Body:
    "Assistente 24h/24 especializado em direito português, treinado na jurisprudência DRE/DGSI. Escalação para advogado humano em casos complexos.",
  feat4Price: "19 €",
  feat4PriceNote: "/mês — 10 perguntas/mês incluídas",

  howEyebrow: "Como funciona",
  howTitle: "Três passos. Zero surpresas.",
  step1Title: "Escolhe",
  step1Body:
    "NIF, contrato, compliance, conselho IA. Preço afixado antes de começar, nunca orçamentos escondidos.",
  step2Title: "Nós tratamos",
  step2Body:
    "O escritório Oliveira & Carneiro supervisiona cada processo. Documentos cifrados AES-256. RGPD respeitado.",
  step3Title: "Você recebe",
  step3Body:
    "NIF por email, contratos descarregáveis imediatamente, alertas de compliance pontuais.",

  cabinetEyebrow: "Parceria estratégica",
  cabinetTitle:
    "Oliveira & Carneiro Advogados — um verdadeiro escritório por trás de cada processo.",
  cabinetIntro:
    "A EasyLaw não é um agregador de PDFs. Cada processo é supervisionado por um advogado inscrito na Ordem dos Advogados, garantindo a conformidade jurídica e o sigilo profissional.",
  cabinetBullet1:
    "Inscrito na Ordem dos Advogados (Cédula Profissional disponível mediante pedido)",
  cabinetBullet2:
    "Sigilo profissional garantido — segregação estrita dos dados",
  cabinetBullet3:
    "15 anos de experiência em direito migratório e comercial português",
  cabinetQuote:
    "A EasyLaw permite-nos servir centenas de clientes que nunca teríamos tocado num escritório tradicional — e cada um recebe a mesma qualidade jurídica.",
  cabinetQuoteAuthor: "Manuel Carneiro",
  cabinetQuoteRole: "Advogado associado, Oliveira & Carneiro",

  finalTitle: "Pronto para simplificar a sua relação com o direito português?",
  finalSubtitle:
    "Comece com o seu NIF, ou explore as nossas ferramentas gratuitamente.",
  finalCtaPrimary: "Começar o meu processo NIF",
  finalCtaSecondary: "Falar com um consultor",

  footerTagline:
    "Plataforma jurídica para Portugal. Supervisionada pela Oliveira & Carneiro Advogados.",
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
  footerLegal3: "RGPD",
  footerLegal4: "Menções legais",
  footerCopyright: "© 2026 EasyLaw. Todos os direitos reservados.",
  footerSupervision:
    "A EasyLaw é uma plataforma tecnológica. Os atos jurídicos são supervisionados pela Oliveira & Carneiro Advogados (Ordem dos Advogados).",
};

const all: Record<LandingLang, LandingMessages> = { fr, pt };

export function getLandingMessages(lang: string | undefined): LandingMessages {
  const normalized = (lang ?? "").toLowerCase().slice(0, 2);
  if (normalized === "fr") return all.fr;
  return all.pt;
}
