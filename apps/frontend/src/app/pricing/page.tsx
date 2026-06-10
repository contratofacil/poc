"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getLandingMessages } from "@/lib/landing/i18n";
import { useLanguage } from "@/lib/lang/useLanguage";

const content = {
  en: {
    heroEyebrow: "Pricing",
    heroTitle: "Clear pricing. Zero surprises.",
    heroSubtitle:
      "Choose only what you need. No mandatory subscription, no hidden fees. Every plan is supervised by Oliveira & Carneiro Advogados.",
    popular: "★ Popular",
    plans: [
      {
        id: "nif",
        name: "NIF & Starter Pack",
        price: "€99",
        period: "one-time payment",
        description: "Your Portuguese NIF, without leaving home.",
        features: [
          "NIF obtained in 48 working hours (typically)",
          "Power of attorney generated automatically",
          "Filing with Finanças by the partner firm",
          "Real-time tracking from your dashboard",
          "Email notification upon NIF receipt",
          "Supervised by Oliveira & Carneiro",
        ],
        cta: "Start my NIF",
        href: "/nif",
        highlight: false,
      },
      {
        id: "contracts",
        name: "Contract Generator",
        price: "€49",
        period: "per contract",
        description: "5 templates compliant with Portuguese law.",
        features: [
          "NRAU residential lease",
          "Service agreement",
          "CDD/CDI employment contract",
          "Lda articles of association",
          "Power of attorney (Procuração)",
          "Guided step-by-step questionnaire",
          "Real-time PDF preview",
          "Immediate download",
          "Legal validation by the firm",
        ],
        cta: "Generate a contract",
        href: "/contracts",
        highlight: true,
      },
      {
        id: "compliance",
        name: "Compliance Dashboard",
        price: "€29",
        period: "/month · no commitment",
        description: "Your legal obligations under control.",
        features: [
          "Automatic deadline monitoring",
          "GREEN / ORANGE / RED colour code",
          "Automatic email alerts",
          "Automatic SMS alerts",
          "Add custom obligations",
          "Alert history",
          "Cancel anytime",
        ],
        cta: "Activate Dashboard",
        href: "/register",
        highlight: false,
      },
      {
        id: "ai",
        name: "Luso-Legal AI",
        price: "€19",
        period: "/month · no commitment",
        description: "An AI lawyer, available 24/7.",
        features: [
          "10 legal questions/month included",
          "Available 24/7",
          "Specialized in Portuguese & European law",
          "Trained on DRE/DGSI case law",
          "Conversation history",
          "Escalation to human lawyer within 24h",
          "Cancel anytime",
        ],
        cta: "Access Luso-Legal",
        href: "/register",
        highlight: false,
      },
    ],
    faqTitle: "Pricing FAQ",
    faqs: [
      {
        q: "Can I combine multiple products?",
        a: "Yes. Each product is independent. You can, for example, get your NIF (€99) and subscribe to the Compliance Dashboard (€29/month) simultaneously. The firm's supervision applies to all your cases.",
      },
      {
        q: "Are there any hidden fees?",
        a: "No. The displayed price is the final all-inclusive price. For the NIF, €99 includes everything: power of attorney, filing with Finanças, supervision, and notification. No additional firm fees for standard supervision.",
      },
      {
        q: "How does subscription cancellation work?",
        a: "Subscriptions (Dashboard and Luso-Legal) can be cancelled at any time from your client area, with no notice period. Cancellation takes effect at the end of the current billing period.",
      },
      {
        q: "Is the NIF guaranteed in 48h?",
        a: "48 hours is our usual estimate for complete applications. If there is high volume at Finanças or documents are incomplete, the timeframe may extend. You are informed in real time of progress.",
      },
    ],
    ctaTitle: "Ready to get started?",
    ctaBody: "Create your free account and start your first case.",
    ctaPrimary: "Create my account",
    ctaSecondary: "Watch demo",
  },
  fr: {
    heroEyebrow: "Tarifs",
    heroTitle: "Des prix clairs. Zéro surprise.",
    heroSubtitle:
      "Choisissez uniquement ce dont vous avez besoin. Aucun abonnement obligatoire, aucun frais caché. Chaque formule est supervisée par le cabinet Oliveira & Carneiro Advogados.",
    popular: "★ Populaire",
    plans: [
      {
        id: "nif",
        name: "NIF & Starter Pack",
        price: "99 €",
        period: "paiement unique",
        description: "Votre NIF portugais, sans déplacement.",
        features: [
          "NIF obtenu en 48h ouvrées (habituellement)",
          "Procuration générée automatiquement",
          "Dépôt auprès des Finanças par le cabinet",
          "Suivi en temps réel depuis votre espace",
          "Notification email dès réception du NIF",
          "Supervision par Oliveira & Carneiro",
        ],
        cta: "Commencer mon NIF",
        href: "/nif",
        highlight: false,
      },
      {
        id: "contracts",
        name: "Générateur de contrats",
        price: "49 €",
        period: "par contrat",
        description: "5 modèles conformes au droit portugais.",
        features: [
          "Bail d'habitation NRAU",
          "Contrat de prestation de services",
          "Contrat de travail CDD/CDI",
          "Statuts de société Lda",
          "Procuration (Procuração)",
          "Questionnaire guidé étape par étape",
          "Prévisualisation PDF en temps réel",
          "Téléchargement immédiat",
          "Validation juridique par le cabinet",
        ],
        cta: "Générer un contrat",
        href: "/contracts",
        highlight: true,
      },
      {
        id: "compliance",
        name: "Compliance Dashboard",
        price: "29 €",
        period: "/mois · sans engagement",
        description: "Vos obligations légales sous contrôle.",
        features: [
          "Surveillance automatique des échéances",
          "Code couleur VERT / ORANGE / ROUGE",
          "Alertes email automatiques",
          "Alertes SMS automatiques",
          "Ajout d'obligations personnalisées",
          "Historique des alertes",
          "Résiliable à tout moment",
        ],
        cta: "Activer le Dashboard",
        href: "/register",
        highlight: false,
      },
      {
        id: "ai",
        name: "Luso-Legal IA",
        price: "19 €",
        period: "/mois · sans engagement",
        description: "Un avocat IA, disponible 24h/24.",
        features: [
          "10 questions juridiques/mois incluses",
          "Disponible 24h/24, 7j/7",
          "Spécialisé droit portugais & européen",
          "Formé sur jurisprudence DRE/DGSI",
          "Historique des conversations",
          "Escalade vers avocat humain en 24h",
          "Résiliable à tout moment",
        ],
        cta: "Accéder à Luso-Legal",
        href: "/register",
        highlight: false,
      },
    ],
    faqTitle: "Questions fréquentes sur les tarifs",
    faqs: [
      {
        q: "Puis-je combiner plusieurs produits ?",
        a: "Oui. Chaque produit est indépendant. Vous pouvez par exemple obtenir votre NIF (99 €) et souscrire au Dashboard compliance (29 €/mois) simultanément. La supervision du cabinet s'applique à l'ensemble de vos dossiers.",
      },
      {
        q: "Y a-t-il des frais cachés ?",
        a: "Non. Le prix affiché est le prix final TTC. Pour le NIF, 99 € inclut tout : procuration, dépôt aux Finanças, supervision et notification. Aucun frais de cabinet supplémentaire pour la supervision standard.",
      },
      {
        q: "Comment fonctionne la résiliation des abonnements ?",
        a: "Les abonnements (Dashboard et Luso-Legal) se résilient à tout moment depuis votre espace client, sans préavis. La résiliation prend effet à la fin de la période de facturation en cours.",
      },
      {
        q: "Le NIF est-il garanti en 48h ?",
        a: "Le délai de 48h est notre estimation habituelle pour les dossiers complets. En cas de volume élevé auprès des Finanças ou de documents incomplets, le délai peut s'étendre. Vous êtes informé en temps réel de l'avancement.",
      },
    ],
    ctaTitle: "Prêt à commencer ?",
    ctaBody: "Créez votre compte gratuitement et commencez votre premier dossier.",
    ctaPrimary: "Créer mon compte",
    ctaSecondary: "Voir la démo",
  },
  pt: {
    heroEyebrow: "Preços",
    heroTitle: "Preços claros. Zero surpresas.",
    heroSubtitle:
      "Escolha apenas o que precisa. Sem subscrição obrigatória, sem taxas escondidas. Cada opção é supervisionada pelo escritório Oliveira & Carneiro Advogados.",
    popular: "★ Popular",
    plans: [
      {
        id: "nif",
        name: "NIF & Starter Pack",
        price: "99 €",
        period: "pagamento único",
        description: "O seu NIF português, sem deslocação.",
        features: [
          "NIF obtido em 48h úteis (habitualmente)",
          "Procuração gerada automaticamente",
          "Submissão às Finanças pelo escritório",
          "Acompanhamento em tempo real no seu espaço",
          "Notificação por email ao receber o NIF",
          "Supervisão pela Oliveira & Carneiro",
        ],
        cta: "Começar o meu NIF",
        href: "/nif",
        highlight: false,
      },
      {
        id: "contracts",
        name: "Gerador de contratos",
        price: "49 €",
        period: "por contrato",
        description: "5 modelos conformes com o direito português.",
        features: [
          "Arrendamento habitacional NRAU",
          "Contrato de prestação de serviços",
          "Contrato de trabalho CDD/CDI",
          "Estatutos de sociedade Lda",
          "Procuração",
          "Questionário guiado passo a passo",
          "Pré-visualização PDF em tempo real",
          "Download imediato",
          "Validação jurídica pelo escritório",
        ],
        cta: "Gerar um contrato",
        href: "/contracts",
        highlight: true,
      },
      {
        id: "compliance",
        name: "Compliance Dashboard",
        price: "29 €",
        period: "/mês · sem compromisso",
        description: "As suas obrigações legais sob controlo.",
        features: [
          "Monitorização automática dos prazos",
          "Código de cores VERDE / LARANJA / VERMELHO",
          "Alertas automáticos por email",
          "Alertas automáticos por SMS",
          "Adição de obrigações personalizadas",
          "Histórico de alertas",
          "Cancelável a qualquer momento",
        ],
        cta: "Ativar o Dashboard",
        href: "/register",
        highlight: false,
      },
      {
        id: "ai",
        name: "Luso-Legal IA",
        price: "19 €",
        period: "/mês · sem compromisso",
        description: "Um advogado IA, disponível 24h/24.",
        features: [
          "10 perguntas jurídicas/mês incluídas",
          "Disponível 24h/24, 7 dias/semana",
          "Especializado em direito português & europeu",
          "Treinado na jurisprudência DRE/DGSI",
          "Histórico das conversas",
          "Escalação para advogado humano em 24h",
          "Cancelável a qualquer momento",
        ],
        cta: "Aceder ao Luso-Legal",
        href: "/register",
        highlight: false,
      },
    ],
    faqTitle: "Perguntas frequentes sobre os preços",
    faqs: [
      {
        q: "Posso combinar vários produtos?",
        a: "Sim. Cada produto é independente. Pode, por exemplo, obter o seu NIF (99 €) e subscrever o Dashboard de compliance (29 €/mês) simultaneamente. A supervisão do escritório aplica-se ao conjunto dos seus processos.",
      },
      {
        q: "Existem taxas escondidas?",
        a: "Não. O preço apresentado é o preço final com IVA. Para o NIF, 99 € inclui tudo: procuração, submissão às Finanças, supervisão e notificação. Sem custos adicionais de escritório para a supervisão padrão.",
      },
      {
        q: "Como funciona o cancelamento das subscrições?",
        a: "As subscrições (Dashboard e Luso-Legal) podem ser canceladas a qualquer momento na sua área de cliente, sem aviso prévio. O cancelamento tem efeito no final do período de faturação em curso.",
      },
      {
        q: "O NIF é garantido em 48h?",
        a: "O prazo de 48h é a nossa estimativa habitual para processos completos. Em caso de volume elevado nas Finanças ou documentos incompletos, o prazo pode ser alargado. É informado em tempo real do andamento do processo.",
      },
    ],
    ctaTitle: "Pronto para começar?",
    ctaBody: "Crie a sua conta gratuitamente e comece o seu primeiro processo.",
    ctaPrimary: "Criar a minha conta",
    ctaSecondary: "Ver a demo",
  },
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-[var(--surface-mist)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors"
      >
        <span>{q}</span>
        <ChevronDown
          className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [lang, setLang] = useLanguage();
  const shell = getLandingMessages(lang);
  const t = content[lang] ?? content.pt;

  return (
    <>
      <SiteHeader messages={shell} lang={lang} onLangChange={setLang} />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 lg:py-20 text-center">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              {t.heroEyebrow}
            </p>
            <h1
              className="text-4xl md:text-5xl mb-5"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.heroTitle}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16">
            <ul className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 list-none p-0 items-start">
              {t.plans.map((plan) => (
                <li
                  key={plan.id}
                  className={`rounded-xl border p-6 flex flex-col ${
                    plan.highlight
                      ? "border-[var(--brand-secondary)] shadow-lg"
                      : "border-[var(--surface-mist)] bg-white"
                  }`}
                  style={plan.highlight ? { background: "var(--brand-primary)", color: "var(--surface-page)" } : {}}
                >
                  {plan.highlight && (
                    <span
                      className="self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-4"
                      style={{ background: "var(--brand-secondary)", color: "var(--brand-primary)" }}
                    >
                      {t.popular}
                    </span>
                  )}
                  <h2
                    className="text-lg mb-1"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: plan.highlight ? "var(--surface-page)" : "var(--brand-primary)",
                    }}
                  >
                    {plan.name}
                  </h2>
                  <p
                    className="text-sm mb-4 opacity-80"
                    style={{ color: plan.highlight ? "var(--surface-page)" : "var(--text-secondary)" }}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span
                      className="text-3xl font-bold"
                      style={{
                        fontFamily: "var(--font-serif)",
                        color: plan.highlight ? "var(--brand-secondary)" : "var(--text-primary)",
                      }}
                    >
                      {plan.price}
                    </span>
                    <span
                      className="text-xs opacity-70"
                      style={{ color: plan.highlight ? "var(--surface-page)" : "var(--text-muted)" }}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 flex-shrink-0"
                          style={{ color: "var(--brand-secondary)" }}
                        />
                        <span style={{ color: plan.highlight ? "rgba(255,255,255,0.9)" : "var(--text-secondary)" }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className="block text-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                    style={
                      plan.highlight
                        ? { background: "var(--brand-secondary)", color: "var(--brand-primary)" }
                        : { background: "var(--brand-primary)", color: "var(--surface-page)" }
                    }
                  >
                    {plan.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-[var(--surface-mist)] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14">
            <h2
              className="text-2xl md:text-3xl mb-8"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.faqTitle}
            </h2>
            <div className="max-w-2xl">
              {t.faqs.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 text-center">
            <h2
              className="text-3xl mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">{t.ctaBody}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-lg px-7 py-3.5 text-base font-semibold"
                style={{ background: "var(--brand-secondary)", color: "var(--text-primary)" }}
              >
                {t.ctaPrimary}
              </Link>
              <a
                href="#demo"
                className="rounded-lg border border-[var(--surface-mist-strong)] px-7 py-3.5 text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] transition-colors"
              >
                {t.ctaSecondary}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter messages={shell} />
    </>
  );
}
