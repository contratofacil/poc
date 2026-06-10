"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getLandingMessages } from "@/lib/landing/i18n";
import { useLanguage } from "@/lib/lang/useLanguage";

const content = {
  en: {
    heroEyebrow: "The EasyLaw blog",
    heroTitle: "Portuguese law, explained simply.",
    heroSubtitle:
      "Practical guides, legal analysis, and news written by our team and supervised by Oliveira & Carneiro Advogados.",
    categories: ["All", "NIF & Tax", "Contracts", "Compliance", "Expats", "Business"],
    readMore: "Read article",
    minuteRead: "min read",
    featuredLabel: "Featured article",
    posts: [
      {
        slug: "comment-obtenir-nif-portugais-2026",
        category: "NIF & Tax",
        title: "How to get your Portuguese NIF from abroad in 2026",
        excerpt:
          "The NIF (Número de Identificação Fiscal) is mandatory for all administrative life in Portugal. This complete guide explains the steps, required documents, timelines, and how EasyLaw simplifies the process.",
        date: "3 Jun 2026",
        readTime: 8,
        featured: true,
      },
      {
        slug: "5-erreurs-bail-nrau",
        category: "Contracts",
        title: "5 mistakes to avoid in a NRAU lease",
        excerpt:
          "The Portuguese residential lease (NRAU) has its own specificities. Minimum duration, mandatory clauses, revision index — here are the most common pitfalls and how to avoid them.",
        date: "28 May 2026",
        readTime: 6,
        featured: false,
      },
      {
        slug: "nhr-regime-fiscal-non-residents",
        category: "NIF & Tax",
        title: "NHR: the non-habitual resident tax regime explained",
        excerpt:
          "The NHR (Non-Habitual Resident) status offers significant tax advantages to new Portuguese residents. Who qualifies, how to apply, and what changed in 2024.",
        date: "20 May 2026",
        readTime: 10,
        featured: false,
      },
      {
        slug: "creer-societe-lda-portugal",
        category: "Business",
        title: "Setting up a Lda company in Portugal: complete guide 2026",
        excerpt:
          "The Lda (Sociedade por Quotas) is the most used legal structure by foreign entrepreneurs in Portugal. Minimum capital, articles of association, registration — all steps explained.",
        date: "14 May 2026",
        readTime: 12,
        featured: false,
      },
      {
        slug: "rgpd-pme-portugaises-2026",
        category: "Compliance",
        title: "GDPR for Portuguese SMEs: your obligations in 2026",
        excerpt:
          "Processing register, DPO, cookie policy, data breaches — what every SME based in Portugal must implement to comply with GDPR.",
        date: "7 May 2026",
        readTime: 9,
        featured: false,
      },
      {
        slug: "freelance-portugal-quel-statut",
        category: "Expats",
        title: "Freelancing in Portugal: which status to choose in 2026?",
        excerpt:
          "Self-employed, single-member Lda, or foreign company? Comparison of structures for expatriate freelancers in Portugal, with tax and social analysis.",
        date: "30 Apr 2026",
        readTime: 11,
        featured: false,
      },
    ],
    newsletterTitle: "Stay informed",
    newsletterBody: "Receive our Portuguese legal guides directly in your inbox. Once a month, no spam.",
    newsletterPlaceholder: "your@email.com",
    newsletterCta: "Subscribe",
    newsletterNote: "Unsubscribe with one click at any time.",
  },
  fr: {
    heroEyebrow: "Le blog EasyLaw",
    heroTitle: "Droit portugais, expliqué simplement.",
    heroSubtitle:
      "Guides pratiques, analyses juridiques et actualités rédigées par notre équipe et supervisées par le cabinet Oliveira & Carneiro Advogados.",
    categories: ["Tous", "NIF & Fiscalité", "Contrats", "Compliance", "Expats", "Entreprises"],
    readMore: "Lire l'article",
    minuteRead: "min de lecture",
    featuredLabel: "Article à la une",
    posts: [
      {
        slug: "comment-obtenir-nif-portugais-2026",
        category: "NIF & Fiscalité",
        title: "Comment obtenir son NIF portugais depuis l'étranger en 2026",
        excerpt:
          "Le NIF (Número de Identificação Fiscal) est obligatoire pour toute vie administrative au Portugal. Ce guide complet explique les étapes, les documents requis, les délais et comment EasyLaw simplifie la procédure.",
        date: "3 juin 2026",
        readTime: 8,
        featured: true,
      },
      {
        slug: "5-erreurs-bail-nrau",
        category: "Contrats",
        title: "Les 5 erreurs à éviter dans un bail NRAU",
        excerpt:
          "Le bail d'habitation portugais (NRAU) a ses spécificités. Durée minimale, clauses obligatoires, index de révision — voici les pièges les plus fréquents et comment les éviter.",
        date: "28 mai 2026",
        readTime: 6,
        featured: false,
      },
      {
        slug: "nhr-regime-fiscal-non-residents",
        category: "NIF & Fiscalité",
        title: "NHR : le régime fiscal des non-résidents habituels expliqué",
        excerpt:
          "Le statut NHR (Non-Habitual Resident) offre des avantages fiscaux significatifs aux nouveaux résidents portugais. Qui peut en bénéficier, comment l'obtenir, et ce qui a changé en 2024.",
        date: "20 mai 2026",
        readTime: 10,
        featured: false,
      },
      {
        slug: "creer-societe-lda-portugal",
        category: "Entreprises",
        title: "Créer une société Lda au Portugal : guide complet 2026",
        excerpt:
          "La Lda (Sociedade por Quotas) est la structure juridique la plus utilisée par les entrepreneurs étrangers au Portugal. Capital minimum, statuts, immatriculation — toutes les étapes expliquées.",
        date: "14 mai 2026",
        readTime: 12,
        featured: false,
      },
      {
        slug: "rgpd-pme-portugaises-2026",
        category: "Compliance",
        title: "RGPD pour les PME portugaises : vos obligations en 2026",
        excerpt:
          "Registre des traitements, DPO, politique de cookies, violations de données — ce que chaque PME installée au Portugal doit mettre en place pour être conforme au RGPD.",
        date: "7 mai 2026",
        readTime: 9,
        featured: false,
      },
      {
        slug: "freelance-portugal-quel-statut",
        category: "Expats",
        title: "Freelance au Portugal : quel statut choisir en 2026 ?",
        excerpt:
          "Travailleur indépendant, Lda unipersonnelle, ou société étrangère ? Comparatif des statuts pour freelances expatriés au Portugal, avec analyse fiscale et sociale.",
        date: "30 avril 2026",
        readTime: 11,
        featured: false,
      },
    ],
    newsletterTitle: "Restez informé",
    newsletterBody: "Recevez nos guides juridiques portugais directement dans votre boîte mail. Une fois par mois, sans spam.",
    newsletterPlaceholder: "votre@email.com",
    newsletterCta: "S'abonner",
    newsletterNote: "Désabonnement en un clic à tout moment.",
  },
  pt: {
    heroEyebrow: "O blog da EasyLaw",
    heroTitle: "Direito português, explicado de forma simples.",
    heroSubtitle:
      "Guias práticos, análises jurídicas e notícias redigidas pela nossa equipa e supervisionadas pelo escritório Oliveira & Carneiro Advogados.",
    categories: ["Todos", "NIF & Fiscalidade", "Contratos", "Compliance", "Expatriados", "Empresas"],
    readMore: "Ler o artigo",
    minuteRead: "min de leitura",
    featuredLabel: "Artigo em destaque",
    posts: [
      {
        slug: "como-obter-nif-portugues-2026",
        category: "NIF & Fiscalidade",
        title: "Como obter o NIF português a partir do estrangeiro em 2026",
        excerpt:
          "O NIF (Número de Identificação Fiscal) é obrigatório para toda a vida administrativa em Portugal. Este guia completo explica as etapas, os documentos necessários, os prazos e como a EasyLaw simplifica o processo.",
        date: "3 jun. 2026",
        readTime: 8,
        featured: true,
      },
      {
        slug: "5-erros-contrato-arrendamento-nrau",
        category: "Contratos",
        title: "Os 5 erros a evitar num contrato de arrendamento NRAU",
        excerpt:
          "O contrato de arrendamento habitacional português (NRAU) tem as suas especificidades. Duração mínima, cláusulas obrigatórias, índice de atualização — eis as armadilhas mais frequentes e como evitá-las.",
        date: "28 mai. 2026",
        readTime: 6,
        featured: false,
      },
      {
        slug: "rnh-regime-fiscal-nao-residentes",
        category: "NIF & Fiscalidade",
        title: "RNH: o regime fiscal dos residentes não habituais explicado",
        excerpt:
          "O estatuto RNH (Residente Não Habitual) oferece vantagens fiscais significativas aos novos residentes portugueses. Quem pode beneficiar, como obtê-lo e o que mudou em 2024.",
        date: "20 mai. 2026",
        readTime: 10,
        featured: false,
      },
      {
        slug: "criar-sociedade-lda-portugal",
        category: "Empresas",
        title: "Criar uma sociedade Lda em Portugal: guia completo 2026",
        excerpt:
          "A Lda (Sociedade por Quotas) é a estrutura jurídica mais utilizada pelos empreendedores estrangeiros em Portugal. Capital mínimo, estatutos, registo — todas as etapas explicadas.",
        date: "14 mai. 2026",
        readTime: 12,
        featured: false,
      },
      {
        slug: "rgpd-pmes-portuguesas-2026",
        category: "Compliance",
        title: "RGPD para PMEs portuguesas: as suas obrigações em 2026",
        excerpt:
          "Registo de tratamentos, DPO, política de cookies, violações de dados — o que cada PME instalada em Portugal deve implementar para estar em conformidade com o RGPD.",
        date: "7 mai. 2026",
        readTime: 9,
        featured: false,
      },
      {
        slug: "freelancer-portugal-que-estatuto",
        category: "Expatriados",
        title: "Freelancer em Portugal: que estatuto escolher em 2026?",
        excerpt:
          "Trabalhador independente, Lda unipessoal, ou sociedade estrangeira? Comparativo dos estatutos para freelancers expatriados em Portugal, com análise fiscal e social.",
        date: "30 abr. 2026",
        readTime: 11,
        featured: false,
      },
    ],
    newsletterTitle: "Mantenha-se informado",
    newsletterBody: "Receba os nossos guias jurídicos portugueses diretamente na sua caixa de email. Uma vez por mês, sem spam.",
    newsletterPlaceholder: "o-seu@email.com",
    newsletterCta: "Subscrever",
    newsletterNote: "Cancelamento com um clique a qualquer momento.",
  },
};

const categoryColors: Record<string, string> = {
  "NIF & Tax": "#1A6FC4",
  "NIF & Fiscalité": "#1A6FC4",
  "NIF & Fiscalidade": "#1A6FC4",
  Contracts: "#7C3AED",
  Contrats: "#7C3AED",
  Contratos: "#7C3AED",
  Compliance: "#059669",
  Expats: "#D97706",
  Expatriados: "#D97706",
  Business: "#DC2626",
  Entreprises: "#DC2626",
  Empresas: "#DC2626",
};

export default function BlogPage() {
  const [lang, setLang] = useLanguage();
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const shell = getLandingMessages(lang);
  const t = content[lang] ?? content.pt;
  const allLabel = t.categories[0];

  React.useEffect(() => {
    setActiveCategory(allLabel);
  }, [allLabel]);

  const currentCategory = activeCategory ?? allLabel;

  const filtered =
    currentCategory === allLabel
      ? t.posts
      : t.posts.filter((p) => p.category === currentCategory);

  const featured = t.posts.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <>
      <SiteHeader messages={shell} lang={lang} onLangChange={setLang} />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              {t.heroEyebrow}
            </p>
            <h1
              className="text-4xl md:text-5xl mb-5 max-w-2xl"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.heroTitle}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl">{t.heroSubtitle}</p>
          </div>
        </section>

        {/* Categories */}
        <div className="border-b border-[var(--surface-mist)] bg-white sticky top-16 z-10">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto">
            {t.categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
                style={
                  currentCategory === cat
                    ? { background: "var(--brand-primary)", color: "var(--surface-page)" }
                    : { background: "var(--surface-page)", color: "var(--text-secondary)", border: "1px solid var(--surface-mist-strong)" }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        {featured && (currentCategory === allLabel) && (
          <section className="border-b border-[var(--surface-mist)]">
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
                {t.featuredLabel}
              </p>
              <div className="grid lg:grid-cols-5 gap-8 rounded-2xl border border-[var(--surface-mist)] bg-white p-8">
                <div className="lg:col-span-3">
                  <span
                    className="inline-block text-xs font-medium px-2.5 py-1 rounded-full text-white mb-4"
                    style={{ background: categoryColors[featured.category] ?? "var(--brand-primary)" }}
                  >
                    {featured.category}
                  </span>
                  <h2
                    className="text-2xl md:text-3xl mb-4"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium"
                      style={{ color: "var(--brand-primary)" }}
                    >
                      {t.readMore} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="text-xs text-[var(--text-muted)]">
                      {featured.date} · {featured.readTime} {t.minuteRead}
                    </span>
                  </div>
                </div>
                <div
                  className="lg:col-span-2 rounded-xl min-h-[200px] flex items-center justify-center"
                  style={{ background: "var(--surface-page)" }}
                  aria-hidden="true"
                >
                  <span className="text-5xl opacity-20">📄</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Articles grid */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0">
              {rest.map((post) => (
                <li
                  key={post.slug}
                  className="rounded-xl border border-[var(--surface-mist)] bg-white p-6 hover:shadow-[var(--shadow-card)] transition-shadow flex flex-col"
                >
                  <span
                    className="self-start text-xs font-medium px-2.5 py-1 rounded-full text-white mb-4"
                    style={{ background: categoryColors[post.category] ?? "var(--brand-primary)" }}
                  >
                    {post.category}
                  </span>
                  <h3
                    className="text-lg mb-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      {post.date} · {post.readTime} {t.minuteRead}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: "var(--brand-primary)" }}
                    >
                      {t.readMore} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Newsletter */}
        <section>
          <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-14 text-center">
            <h2
              className="text-2xl mb-3"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.newsletterTitle}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">{t.newsletterBody}</p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2 max-w-sm mx-auto"
            >
              <input
                type="email"
                required
                placeholder={t.newsletterPlaceholder}
                className="flex-1 rounded-lg border border-[var(--surface-mist-strong)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)]"
              />
              <button
                type="submit"
                className="rounded-lg px-5 py-2.5 text-sm font-semibold flex-shrink-0"
                style={{ background: "var(--brand-secondary)", color: "var(--text-primary)" }}
              >
                {t.newsletterCta}
              </button>
            </form>
            <p className="text-xs text-[var(--text-muted)] mt-3">{t.newsletterNote}</p>
          </div>
        </section>
      </main>
      <SiteFooter messages={shell} />
    </>
  );
}
