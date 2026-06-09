/**
 * Cookie Consent — i18n FR + PT (P4 / D-012)
 *
 * EN différé Phase 2. Traductions inline pour rester cohérent avec le pattern
 * actuel du projet (next-intl = OQ-001, différée).
 */

export type ConsentLang = "fr" | "pt";

export interface ConsentMessages {
  bannerTitle: string;
  bannerBody: string;
  legalNote: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  policyLink: string;

  modalTitle: string;
  modalIntro: string;
  catNecessary: string;
  catNecessaryDesc: string;
  catNecessaryLocked: string;
  catAnalytics: string;
  catAnalyticsDesc: string;
  catMarketing: string;
  catMarketingDesc: string;
  catPersonalization: string;
  catPersonalizationDesc: string;
  save: string;
  cancel: string;

  footerManage: string;
  ariaToggle: string;
}

const fr: ConsentMessages = {
  bannerTitle: "Vos préférences cookies",
  bannerBody:
    "Nous utilisons des cookies nécessaires au fonctionnement du site. Vous pouvez accepter ou refuser les cookies analytiques, marketing et de personnalisation à tout moment.",
  legalNote:
    "Conformément à l'ePrivacy Directive et au RGPD (Art. 7), votre choix est révocable à tout moment depuis le footer.",
  acceptAll: "Tout accepter",
  rejectAll: "Tout refuser",
  customize: "Personnaliser",
  policyLink: "Politique cookies",

  modalTitle: "Personnaliser vos cookies",
  modalIntro:
    "Choisissez les catégories que vous souhaitez activer. Vos choix sont enregistrés pour 12 mois.",
  catNecessary: "Nécessaires",
  catNecessaryDesc:
    "Indispensables au fonctionnement : session, authentification, langue, mémorisation du consentement lui-même.",
  catNecessaryLocked: "Toujours actif",
  catAnalytics: "Analytique",
  catAnalyticsDesc:
    "Mesure d'audience anonymisée pour améliorer le produit (IP anonymisée, pas de profilage individuel).",
  catMarketing: "Marketing",
  catMarketingDesc:
    "Pixels publicitaires et remarketing (Meta, Google Ads). Désactivé par défaut.",
  catPersonalization: "Personnalisation",
  catPersonalizationDesc:
    "Tests A/B et adaptation du contenu à votre comportement. Désactivé par défaut.",
  save: "Enregistrer mes choix",
  cancel: "Annuler",

  footerManage: "Gérer mes cookies",
  ariaToggle: "Activer ou désactiver",
};

const pt: ConsentMessages = {
  bannerTitle: "As suas preferências de cookies",
  bannerBody:
    "Utilizamos cookies necessários para o funcionamento do site. Pode aceitar ou recusar os cookies analíticos, de marketing e de personalização a qualquer momento.",
  legalNote:
    "Em conformidade com a Diretiva ePrivacy e o RGPD (Art. 7.º), a sua escolha é revogável a qualquer momento a partir do rodapé.",
  acceptAll: "Aceitar tudo",
  rejectAll: "Recusar tudo",
  customize: "Personalizar",
  policyLink: "Política de cookies",

  modalTitle: "Personalizar os seus cookies",
  modalIntro:
    "Escolha as categorias que pretende ativar. As suas escolhas ficam registadas por 12 meses.",
  catNecessary: "Necessários",
  catNecessaryDesc:
    "Indispensáveis ao funcionamento: sessão, autenticação, idioma, memorização do próprio consentimento.",
  catNecessaryLocked: "Sempre ativo",
  catAnalytics: "Analítica",
  catAnalyticsDesc:
    "Medição de audiência anonimizada para melhorar o produto (IP anonimizado, sem perfis individuais).",
  catMarketing: "Marketing",
  catMarketingDesc:
    "Pixels publicitários e remarketing (Meta, Google Ads). Desativado por defeito.",
  catPersonalization: "Personalização",
  catPersonalizationDesc:
    "Testes A/B e adaptação do conteúdo ao seu comportamento. Desativado por defeito.",
  save: "Guardar as minhas escolhas",
  cancel: "Cancelar",

  footerManage: "Gerir os meus cookies",
  ariaToggle: "Ativar ou desativar",
};

const translations: Record<ConsentLang, ConsentMessages> = { fr, pt };

/**
 * Récupère les chaînes pour une langue. Fallback PT (marché principal) si la langue
 * passée n'est pas reconnue ou si on est en SSR (lang non-déterminée).
 */
export function getConsentMessages(lang: string | undefined): ConsentMessages {
  const normalized = (lang ?? "").toLowerCase().slice(0, 2);
  if (normalized === "fr") return translations.fr;
  return translations.pt;
}
