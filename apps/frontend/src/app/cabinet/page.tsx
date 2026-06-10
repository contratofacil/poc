"use client";

import * as React from "react";
import Link from "next/link";
import { Award, Check, Scale, FileText, Building2, Briefcase } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getLandingMessages } from "@/lib/landing/i18n";
import { useLanguage } from "@/lib/lang/useLanguage";

const content = {
  en: {
    heroEyebrow: "Legal partner",
    heroTitle: "Oliveira & Carneiro Advogados",
    heroSubtitle:
      "A certified Portuguese law firm, registered with the Ordem dos Advogados for 15 years. Every EasyLaw case is supervised by a qualified lawyer — no decision is left to an algorithm alone.",
    introTitle: "A real firm behind every case.",
    introBody:
      "EasyLaw is not a simple document generator. The technology platform automates repetitive steps, but Oliveira & Carneiro oversees every NIF case, every generated contract, and every compliance alert sent. Professional confidentiality applies to all data processed.",
    expertiseTitle: "Areas of expertise",
    exp1Title: "Migration law",
    exp1Body: "NIF, powers of attorney, residence visas (D7, D8), residence permits, family reunification. Assistance to European and non-European expatriates.",
    exp2Title: "Commercial law",
    exp2Body: "Lda company formation, articles of association, commercial contracts, service agreements, legal representation of foreign companies in Portugal.",
    exp3Title: "Tax law",
    exp3Body: "NHR (Non-Habitual Resident), non-resident taxation, tax returns, legal optimization for expatriates and investors.",
    exp4Title: "Labour law",
    exp4Body: "Fixed-term and open-ended employment contracts compliant with the Portuguese Labour Code, dismissals, collective negotiations, employer/employee representation.",
    supervisionTitle: "How supervision works",
    sup1: "Every NIF case is verified by a legal professional before submission to Finanças",
    sup2: "Every generated contract is validated against current Portuguese legislation",
    sup3: "Compliance alerts are configured according to actual legal obligations",
    sup4: "Luso-Legal escalations are handled by a human lawyer within 24 hours",
    sup5: "Professional confidentiality covers all exchanges and documents",
    credTitle: "Accreditations & transparency",
    cred1: "Registered with the Ordem dos Advogados (Professional Card available on request)",
    cred2: "15 years of experience in Portuguese law",
    cred3: "Specialization in migration and commercial law",
    cred4: "Professional liability insurance",
    quoteText: "EasyLaw allows us to serve hundreds of clients we would never have reached through a traditional firm — and each one receives the same legal quality.",
    quoteAuthor: "Manuel Carneiro",
    quoteRole: "Associate Lawyer, Oliveira & Carneiro",
    ctaTitle: "Need personalized assistance?",
    ctaBody: "For complex cases, our team puts you in direct contact with a lawyer from the firm.",
    ctaPrimary: "Contact the firm",
    ctaSecondary: "Start with EasyLaw",
  },
  fr: {
    heroEyebrow: "Partenaire juridique",
    heroTitle: "Oliveira & Carneiro Advogados",
    heroSubtitle:
      "Un cabinet d'avocats portugais agréé, inscrit à l'Ordem dos Advogados depuis 15 ans. Chaque dossier EasyLaw est supervisé par un avocat qualifié — aucune décision n'est laissée à un algorithme seul.",
    introTitle: "Un vrai cabinet derrière chaque dossier.",
    introBody:
      "EasyLaw n'est pas un simple générateur de documents. La plateforme technologique automatise les étapes répétitives, mais c'est le cabinet Oliveira & Carneiro qui supervise juridiquement chaque dossier NIF, chaque contrat généré, et chaque alerte de conformité envoyée. Le secret professionnel s'applique à l'intégralité des données traitées.",
    expertiseTitle: "Domaines d'expertise",
    exp1Title: "Droit migratoire",
    exp1Body: "NIF, procurations, visas de résidence (D7, D8), autorisation de séjour, regroupement familial. Assistance aux expatriés européens et extra-européens.",
    exp2Title: "Droit commercial",
    exp2Body: "Création de sociétés Lda, statuts, contrats commerciaux, prestation de services, représentation légale d'entreprises étrangères au Portugal.",
    exp3Title: "Droit fiscal",
    exp3Body: "NHR (Non-Habitual Resident), fiscalité des non-résidents, déclarations fiscales, optimisation légale pour expatriés et investisseurs.",
    exp4Title: "Droit du travail",
    exp4Body: "Contrats CDD et CDI conformes au Code du Travail portugais, licenciements, négociations collectives, représentation employeur/salarié.",
    supervisionTitle: "Comment fonctionne la supervision",
    sup1: "Chaque dossier NIF est vérifié par un juriste avant dépôt aux Finanças",
    sup2: "Chaque contrat généré est validé selon la législation portugaise en vigueur",
    sup3: "Les alertes compliance sont configurées selon les obligations légales réelles",
    sup4: "Les escalades Luso-Legal sont traitées par un avocat humain sous 24h",
    sup5: "Le secret professionnel couvre l'intégralité des échanges et documents",
    credTitle: "Accréditations & transparence",
    cred1: "Inscrit à l'Ordem dos Advogados (Cédula Profissional disponible sur demande)",
    cred2: "15 ans d'expérience en droit portugais",
    cred3: "Spécialisation en droit migratoire et commercial",
    cred4: "Assurance responsabilité civile professionnelle",
    quoteText: "EasyLaw nous permet de servir des centaines de clients que nous n'aurions jamais touchés en cabinet traditionnel — et chacun reçoit la même qualité juridique.",
    quoteAuthor: "Manuel Carneiro",
    quoteRole: "Avocat associé, Oliveira & Carneiro",
    ctaTitle: "Besoin d'un accompagnement personnalisé ?",
    ctaBody: "Pour les dossiers complexes, notre équipe vous met en contact directement avec un avocat du cabinet.",
    ctaPrimary: "Contacter le cabinet",
    ctaSecondary: "Commencer avec EasyLaw",
  },
  pt: {
    heroEyebrow: "Parceiro jurídico",
    heroTitle: "Oliveira & Carneiro Advogados",
    heroSubtitle:
      "Um escritório de advogados português certificado, inscrito na Ordem dos Advogados há 15 anos. Cada processo da EasyLaw é supervisionado por um advogado qualificado — nenhuma decisão é deixada apenas a um algoritmo.",
    introTitle: "Um verdadeiro escritório por trás de cada processo.",
    introBody:
      "A EasyLaw não é um simples gerador de documentos. A plataforma tecnológica automatiza as etapas repetitivas, mas é o escritório Oliveira & Carneiro que supervisiona juridicamente cada processo NIF, cada contrato gerado, e cada alerta de conformidade enviado. O sigilo profissional aplica-se à totalidade dos dados tratados.",
    expertiseTitle: "Áreas de especialização",
    exp1Title: "Direito migratório",
    exp1Body: "NIF, procurações, vistos de residência (D7, D8), autorização de residência, reagrupamento familiar. Assistência a expatriados europeus e extraeuropeus.",
    exp2Title: "Direito comercial",
    exp2Body: "Constituição de sociedades Lda, estatutos, contratos comerciais, prestação de serviços, representação legal de empresas estrangeiras em Portugal.",
    exp3Title: "Direito fiscal",
    exp3Body: "NHR (Residente Não Habitual), fiscalidade de não residentes, declarações fiscais, otimização legal para expatriados e investidores.",
    exp4Title: "Direito do trabalho",
    exp4Body: "Contratos CDD e CDI conformes com o Código do Trabalho português, despedimentos, negociações coletivas, representação empregador/trabalhador.",
    supervisionTitle: "Como funciona a supervisão",
    sup1: "Cada processo NIF é verificado por um jurista antes da submissão às Finanças",
    sup2: "Cada contrato gerado é validado segundo a legislação portuguesa em vigor",
    sup3: "Os alertas de compliance são configurados segundo as obrigações legais reais",
    sup4: "As escalações do Luso-Legal são tratadas por um advogado humano em 24h",
    sup5: "O sigilo profissional cobre a totalidade das trocas e documentos",
    credTitle: "Acreditações & transparência",
    cred1: "Inscrito na Ordem dos Advogados (Cédula Profissional disponível mediante pedido)",
    cred2: "15 anos de experiência em direito português",
    cred3: "Especialização em direito migratório e comercial",
    cred4: "Seguro de responsabilidade civil profissional",
    quoteText: "A EasyLaw permite-nos servir centenas de clientes que nunca teríamos tocado num escritório tradicional — e cada um recebe a mesma qualidade jurídica.",
    quoteAuthor: "Manuel Carneiro",
    quoteRole: "Advogado associado, Oliveira & Carneiro",
    ctaTitle: "Precisa de acompanhamento personalizado?",
    ctaBody: "Para processos complexos, a nossa equipa coloca-o em contacto direto com um advogado do escritório.",
    ctaPrimary: "Contactar o escritório",
    ctaSecondary: "Começar com a EasyLaw",
  },
};

export default function CabinetPage() {
  const [lang, setLang] = useLanguage();
  const shell = getLandingMessages(lang);
  const t = content[lang] ?? content.pt;

  const expertise = [
    { icon: <Scale className="h-5 w-5 text-white" />, title: t.exp1Title, body: t.exp1Body },
    { icon: <Building2 className="h-5 w-5 text-white" />, title: t.exp2Title, body: t.exp2Body },
    { icon: <FileText className="h-5 w-5 text-white" />, title: t.exp3Title, body: t.exp3Body },
    { icon: <Briefcase className="h-5 w-5 text-white" />, title: t.exp4Title, body: t.exp4Body },
  ];

  const supervision = [t.sup1, t.sup2, t.sup3, t.sup4, t.sup5];
  const creds = [t.cred1, t.cred2, t.cred3, t.cred4];

  return (
    <>
      <SiteHeader messages={shell} lang={lang} onLangChange={setLang} />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-4">
              {t.heroEyebrow}
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6 max-w-3xl"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.heroTitle}
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="border-b border-[var(--surface-mist)] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2
                className="text-3xl mb-5"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.introTitle}
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-lg">{t.introBody}</p>
            </div>
            <blockquote
              className="rounded-2xl p-8"
              style={{ background: "var(--brand-primary)", color: "var(--surface-page)" }}
            >
              <p
                className="text-xl leading-relaxed italic"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                « {t.quoteText} »
              </p>
              <footer className="mt-6 flex items-center gap-3 not-italic">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-secondary)" }}
                >
                  <Award className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.quoteAuthor}</p>
                  <p className="text-xs opacity-70">{t.quoteRole}</p>
                </div>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* Expertise */}
        <section className="border-b border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <h2
              className="text-3xl mb-10"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.expertiseTitle}
            </h2>
            <ul className="grid md:grid-cols-2 gap-6 list-none p-0">
              {expertise.map((e) => (
                <li key={e.title} className="rounded-xl border border-[var(--surface-mist)] p-7 bg-white">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                    style={{ background: "var(--brand-primary)" }}
                  >
                    {e.icon}
                  </div>
                  <h3
                    className="text-lg mb-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    {e.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{e.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Supervision + Credentials */}
        <section className="border-b border-[var(--surface-mist)] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-2 gap-12">
            <div>
              <h2
                className="text-2xl mb-6"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.supervisionTitle}
              </h2>
              <ul className="space-y-3">
                {supervision.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <Check
                      className="mt-1 h-4 w-4 flex-shrink-0"
                      style={{ color: "var(--brand-secondary)" }}
                    />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2
                className="text-2xl mb-6"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.credTitle}
              </h2>
              <ul className="space-y-3">
                {creds.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <Check
                      className="mt-1 h-4 w-4 flex-shrink-0"
                      style={{ color: "var(--brand-secondary)" }}
                    />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2
              className="text-3xl mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.ctaTitle}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">{t.ctaBody}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-base font-semibold"
                style={{ background: "var(--brand-secondary)", color: "var(--text-primary)" }}
              >
                {t.ctaPrimary}
              </Link>
              <Link
                href="/register"
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
