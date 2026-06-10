"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Shield, Lock, Star, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getLandingMessages } from "@/lib/landing/i18n";
import { useLanguage } from "@/lib/lang/useLanguage";

const content = {
  en: {
    heroEyebrow: "Our mission",
    heroTitle: "Making Portuguese law accessible to everyone.",
    heroSubtitle:
      "EasyLaw was born from a simple observation: too many people give up on moving to Portugal, starting a business, or securing their contracts due to lack of access to affordable legal help. We changed that.",
    storyTitle: "Why EasyLaw?",
    storyBody:
      "Every year, thousands of expatriates, freelancers, and SMEs hit the same wall: Portuguese law is complex, the tax authority is hard to access, and lawyer fees are out of reach for most. EasyLaw was founded to bridge this gap — combining the power of technology with the oversight of a real, accredited law firm.",
    storyBody2:
      "Our platform handles the repetitive, standardized tasks (document generation, case tracking, compliance alerts) while Oliveira & Carneiro Advogados provides legal oversight of every case. The result: the quality of a law firm at the price of a SaaS tool.",
    valuesTitle: "Our values",
    val1Title: "Full transparency",
    val1Body: "Prices shown before any commitment. No hidden quotes, no surprises along the way. What you see is what you pay.",
    val2Title: "Real accessibility",
    val2Body: "Portuguese law shouldn't be reserved for those who can afford €200/h fees. Our pricing is designed for individuals and SMEs.",
    val3Title: "Guaranteed quality",
    val3Body: "Every case is supervised by a lawyer registered with the Ordem dos Advogados. Not an algorithm alone — a qualified human validates each step.",
    val4Title: "Maximum security",
    val4Body: "TLS 1.3 in transit, AES-256 at rest, GDPR and CNPD compliance. Your legal data is among the most sensitive — we treat it accordingly.",
    partnerTitle: "A technology + law alliance",
    partnerBody:
      "EasyLaw is not a law firm. It's a technology platform that partners with accredited lawyers to offer the best of both worlds. Oliveira & Carneiro Advogados, with 15 years of experience in Portuguese migration, tax, and commercial law, oversees every case processed on our platform.",
    ctaTitle: "Join hundreds of expatriates, freelancers, and SMEs",
    ctaBody: "Start with your NIF — the first step toward your life in Portugal.",
    ctaPrimary: "Start my NIF application — €99",
    ctaSecondary: "View pricing",
  },
  fr: {
    heroEyebrow: "Notre mission",
    heroTitle: "Rendre le droit portugais accessible à tous.",
    heroSubtitle:
      "EasyLaw est né d'un constat simple : trop de personnes renoncent à s'installer au Portugal, à créer une entreprise ou à sécuriser leurs contrats faute d'accès à une aide juridique abordable. Nous avons changé ça.",
    storyTitle: "Pourquoi EasyLaw ?",
    storyBody:
      "Chaque année, des milliers d'expatriés, de freelances et de PME se heurtent au même mur : le droit portugais est complexe, l'administration fiscale peu accessible, et les honoraires d'avocat hors de portée pour la plupart. EasyLaw a été fondé pour combler ce fossé — en combinant la puissance de la technologie avec la supervision d'un véritable cabinet d'avocats agréé.",
    storyBody2:
      "Notre plateforme gère les tâches répétitives et standardisées (génération de documents, suivi de dossiers, alertes de conformité) pendant que le cabinet Oliveira & Carneiro Advogados assure la supervision juridique de chaque dossier. Résultat : la qualité d'un cabinet d'avocats, au prix d'un outil SaaS.",
    valuesTitle: "Nos valeurs",
    val1Title: "Transparence totale",
    val1Body: "Prix affichés avant tout engagement. Aucun devis caché, aucune surprise en cours de route. Ce que vous voyez est ce que vous payez.",
    val2Title: "Accessibilité réelle",
    val2Body: "Le droit portugais ne devrait pas être réservé à ceux qui peuvent se payer 200 €/h d'honoraires. Nos tarifs sont conçus pour les individus et les PME.",
    val3Title: "Qualité garantie",
    val3Body: "Chaque dossier est supervisé par un avocat inscrit à l'Ordem dos Advogados. Pas d'algorithme seul — un humain qualifié valide chaque étape.",
    val4Title: "Sécurité maximale",
    val4Body: "TLS 1.3 en transit, AES-256 au repos, conformité RGPD et CNPD. Vos données juridiques sont parmi les plus sensibles — nous les traitons en conséquence.",
    partnerTitle: "Une alliance technologie + droit",
    partnerBody:
      "EasyLaw n'est pas un cabinet d'avocats. C'est une plateforme technologique qui s'associe avec des avocats agréés pour offrir le meilleur des deux mondes. Le cabinet Oliveira & Carneiro Advogados, avec 15 ans d'expérience en droit migratoire, fiscal et commercial portugais, supervise chaque dossier traité sur notre plateforme.",
    ctaTitle: "Rejoignez des centaines d'expatriés, freelances et PME",
    ctaBody: "Commencez avec votre NIF — le premier pas vers votre vie au Portugal.",
    ctaPrimary: "Commencer mon dossier NIF — 99 €",
    ctaSecondary: "Voir nos tarifs",
  },
  pt: {
    heroEyebrow: "A nossa missão",
    heroTitle: "Tornar o direito português acessível a todos.",
    heroSubtitle:
      "A EasyLaw nasceu de uma constatação simples: demasiadas pessoas desistem de se instalar em Portugal, criar uma empresa ou garantir os seus contratos por falta de acesso a apoio jurídico acessível. Mudámos isso.",
    storyTitle: "Porquê a EasyLaw?",
    storyBody:
      "Todos os anos, milhares de expatriados, freelancers e PMEs enfrentam o mesmo obstáculo: o direito português é complexo, a administração fiscal pouco acessível, e os honorários de advogado estão fora do alcance da maioria. A EasyLaw foi fundada para colmatar este fosso — combinando o poder da tecnologia com a supervisão de um verdadeiro escritório de advogados certificado.",
    storyBody2:
      "A nossa plataforma trata das tarefas repetitivas e padronizadas (geração de documentos, acompanhamento de processos, alertas de conformidade) enquanto o escritório Oliveira & Carneiro Advogados assegura a supervisão jurídica de cada processo. Resultado: a qualidade de um escritório de advogados, ao preço de uma ferramenta SaaS.",
    valuesTitle: "Os nossos valores",
    val1Title: "Transparência total",
    val1Body: "Preços visíveis antes de qualquer compromisso. Sem orçamentos escondidos, sem surpresas. O que vê é o que paga.",
    val2Title: "Acessibilidade real",
    val2Body: "O direito português não deve ser reservado a quem pode pagar 200 €/h de honorários. Os nossos preços são pensados para particulares e PMEs.",
    val3Title: "Qualidade garantida",
    val3Body: "Cada processo é supervisionado por um advogado inscrito na Ordem dos Advogados. Não apenas um algoritmo — um profissional qualificado valida cada etapa.",
    val4Title: "Segurança máxima",
    val4Body: "TLS 1.3 em trânsito, AES-256 em repouso, conformidade RGPD e CNPD. Os seus dados jurídicos são dos mais sensíveis — tratamo-los como tal.",
    partnerTitle: "Uma aliança tecnologia + direito",
    partnerBody:
      "A EasyLaw não é um escritório de advogados. É uma plataforma tecnológica que se associa a advogados certificados para oferecer o melhor dos dois mundos. O escritório Oliveira & Carneiro Advogados, com 15 anos de experiência em direito migratório, fiscal e comercial português, supervisiona cada processo tratado na nossa plataforma.",
    ctaTitle: "Junte-se a centenas de expatriados, freelancers e PMEs",
    ctaBody: "Comece com o seu NIF — o primeiro passo para a sua vida em Portugal.",
    ctaPrimary: "Começar o meu processo NIF — 99 €",
    ctaSecondary: "Ver os nossos preços",
  },
};

export default function AboutPage() {
  const [lang, setLang] = useLanguage();
  const shell = getLandingMessages(lang);
  const t = content[lang] ?? content.pt;

  const values = [
    { icon: <Star className="h-5 w-5 text-white" />, title: t.val1Title, body: t.val1Body },
    { icon: <Users className="h-5 w-5 text-white" />, title: t.val2Title, body: t.val2Body },
    { icon: <Check className="h-5 w-5 text-white" />, title: t.val3Title, body: t.val3Body },
    { icon: <Lock className="h-5 w-5 text-white" />, title: t.val4Title, body: t.val4Body },
  ];

  return (
    <>
      <SiteHeader messages={shell} lang={lang} onLangChange={setLang} />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24 max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              {t.heroEyebrow}
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.heroTitle}
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="border-b border-[var(--surface-mist)] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl md:text-4xl mb-6"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.storyTitle}
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">{t.storyBody}</p>
              <p className="text-[var(--text-secondary)] leading-relaxed">{t.storyBody2}</p>
            </div>
            <dl className="grid grid-cols-2 gap-6">
              {[
                [shell.stat1Value, shell.stat1Label],
                [shell.stat2Value, shell.stat2Label],
                [shell.stat3Value, shell.stat3Label],
                [shell.stat4Value, shell.stat4Label],
              ].map(([v, l]) => (
                <div
                  key={v}
                  className="rounded-xl border border-[var(--surface-mist)] p-6 text-center"
                >
                  <dt
                    className="text-3xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-secondary)" }}
                  >
                    {v}
                  </dt>
                  <dd className="text-xs text-[var(--text-muted)] leading-snug">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Values */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <h2
              className="text-3xl md:text-4xl mb-12"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.valuesTitle}
            </h2>
            <ul className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0">
              {values.map((v) => (
                <li key={v.title} className="rounded-xl border border-[var(--surface-mist)] p-7 bg-white">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                    style={{ background: "var(--brand-primary)" }}
                  >
                    {v.icon}
                  </div>
                  <h3
                    className="text-lg mb-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{v.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Partner */}
        <section className="border-b border-[var(--surface-mist)] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "var(--brand-primary)" }}
              >
                <Shield className="h-5 w-5" style={{ color: "var(--brand-secondary)" }} />
              </div>
              <h2
                className="text-2xl md:text-3xl"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.partnerTitle}
              </h2>
            </div>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-8">
              {t.partnerBody}
            </p>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {[shell.cabinetBullet1, shell.cabinetBullet2, shell.cabinetBullet3].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check
                    className="mt-1 h-4 w-4 flex-shrink-0"
                    style={{ color: "var(--brand-secondary)" }}
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">{t.ctaBody}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-base font-semibold"
                style={{ background: "var(--brand-secondary)", color: "var(--text-primary)" }}
              >
                {t.ctaPrimary}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--surface-mist-strong)] bg-transparent px-7 py-3.5 text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] transition-colors"
              >
                {t.ctaSecondary}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter messages={shell} />
    </>
  );
}
