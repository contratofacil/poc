"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Check,
  Clock,
  Edit2,
  FileText,
  MessageSquare,
  Play,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TrustBar } from "@/components/ui/TrustBar";
import { getLandingMessages, type LandingLang } from "@/lib/landing/i18n";

/**
 * Landing publique `/` (P2).
 *
 * Client component pour i18n FR + PT inline. Server-render PT par défaut
 * (html.lang="pt") puis substitue FR si lang === "fr" post-mount.
 * Pas de CLS notable — le layout est identique entre langues, seul le texte change.
 */
export default function Home() {
  const [lang, setLang] = React.useState<LandingLang>("pt");

  React.useEffect(() => {
    const detected = (document.documentElement.lang || "pt").toLowerCase().slice(0, 2);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture d'état DOM read-only au mount (pattern aligné avec ConsentBanner P4)
    if (detected === "fr") setLang("fr");
  }, []);

  const t = getLandingMessages(lang);

  return (
    <>
      <SiteHeader messages={t} langCode={lang} />

      <main id="main" className="flex-1">
        {/* ─── HERO ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--text-secondary)] bg-white border border-[var(--surface-mist)] rounded-full px-3 py-1 mb-6">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--brand-secondary)" }}
                  aria-hidden="true"
                />
                {t.heroBadge}
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--brand-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {t.heroTitleLine1}
                <br />
                <span className="italic" style={{ color: "var(--brand-secondary)" }}>
                  {t.heroTitleAccent}
                </span>
              </h1>
              <p className="text-lg text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]"
                  style={{
                    background: "var(--brand-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {t.heroCtaPrimary}
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--surface-mist-strong)] bg-transparent px-6 py-3 text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {t.heroCtaSecondary}
                </a>
              </div>

              <TrustBar
                labels={{
                  tls: t.heroTrustTls,
                  rgpd: t.heroTrustRgpd,
                  ordem: t.heroTrustOrdem,
                  verified: t.heroTrustVerifiedCabinet,
                }}
              />
            </div>

            {/* Hero NIF tracking card */}
            <div className="lg:col-span-5">
              <HeroNifCard t={t} />
            </div>
          </div>
        </section>

        {/* ─── FEATURES ──────────────────────────────────────────────── */}
        <section
          id="features"
          className="border-t border-[var(--surface-mist)] bg-white"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="max-w-2xl mb-14">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
                {t.featuresEyebrow}
              </p>
              <h2
                id="features-heading"
                className="text-3xl md:text-4xl mb-4"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.featuresTitle}
              </h2>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                {t.featuresIntro}
              </p>
            </div>

            <ul className="grid md:grid-cols-2 gap-6 list-none p-0">
              <FeatureCard
                icon={<FileText className="h-5 w-5 text-white" aria-hidden="true" />}
                title={t.feat1Title}
                body={t.feat1Body}
                price={t.feat1Price}
                priceNote={t.feat1PriceNote}
              />
              <FeatureCard
                icon={<Edit2 className="h-5 w-5 text-white" aria-hidden="true" />}
                title={t.feat2Title}
                body={t.feat2Body}
                price={t.feat2Price}
                priceNote={t.feat2PriceNote}
              />
              <FeatureCard
                icon={<Clock className="h-5 w-5 text-white" aria-hidden="true" />}
                title={t.feat3Title}
                body={t.feat3Body}
                price={t.feat3Price}
                priceNote={t.feat3PriceNote}
              />
              <FeatureCard
                icon={<MessageSquare className="h-5 w-5 text-white" aria-hidden="true" />}
                title={t.feat4Title}
                body={t.feat4Body}
                price={t.feat4Price}
                priceNote={t.feat4PriceNote}
              />
            </ul>
          </div>
        </section>

        {/* ─── HOW IT WORKS ──────────────────────────────────────────── */}
        <section
          id="how"
          className="border-t border-[var(--surface-mist)]"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
                {t.howEyebrow}
              </p>
              <h2
                id="how-heading"
                className="text-3xl md:text-4xl"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.howTitle}
              </h2>
            </div>
            <ol className="grid md:grid-cols-3 gap-8 list-none p-0">
              <Step n="01" title={t.step1Title} body={t.step1Body} />
              <Step n="02" title={t.step2Title} body={t.step2Body} />
              <Step n="03" title={t.step3Title} body={t.step3Body} />
            </ol>
          </div>
        </section>

        {/* ─── CABINET PARTNERSHIP ───────────────────────────────────── */}
        <section
          id="cabinet"
          className="border-t border-[var(--surface-mist)] bg-white"
          aria-labelledby="cabinet-heading"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
                {t.cabinetEyebrow}
              </p>
              <h2
                id="cabinet-heading"
                className="text-3xl md:text-4xl mb-5"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.cabinetTitle}
              </h2>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
                {t.cabinetIntro}
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                {[t.cabinetBullet1, t.cabinetBullet2, t.cabinetBullet3].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check
                      className="mt-1 h-4 w-4 flex-shrink-0"
                      style={{ color: "var(--brand-secondary)" }}
                      aria-hidden="true"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <blockquote
              className="rounded-2xl p-10 lg:p-12"
              style={{
                background: "var(--brand-primary)",
                color: "var(--surface-page)",
              }}
            >
              <p
                className="text-xl lg:text-2xl leading-relaxed font-light italic"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                « {t.cabinetQuote} »
              </p>
              <footer className="mt-6 flex items-center gap-3 not-italic">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-secondary)" }}
                  aria-hidden="true"
                >
                  <Award className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.cabinetQuoteAuthor}</p>
                  <p className="text-xs opacity-70">{t.cabinetQuoteRole}</p>
                </div>
              </footer>
            </blockquote>
          </div>
        </section>

        {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
        <section className="border-t border-[var(--surface-mist)]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2
              className="text-3xl md:text-5xl mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.finalTitle}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
              {t.finalSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]"
                style={{
                  background: "var(--brand-secondary)",
                  color: "var(--text-primary)",
                }}
              >
                {t.finalCtaPrimary}
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--surface-mist-strong)] bg-transparent px-7 py-3.5 text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              >
                {t.finalCtaSecondary}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter messages={t} />
    </>
  );
}

/* ───── sub-components ───── */

function FeatureCard({
  icon,
  title,
  body,
  price,
  priceNote,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  price: string;
  priceNote?: string;
}) {
  return (
    <li className="rounded-xl border border-[var(--surface-mist)] p-7 hover:shadow-[var(--shadow-card)] transition-shadow bg-white">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
        style={{ background: "var(--brand-primary)" }}
      >
        {icon}
      </div>
      <h3
        className="text-xl mb-2"
        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
      >
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{body}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-[var(--text-primary)]">{price}</span>
        {priceNote && <span className="text-xs text-[var(--text-muted)]">{priceNote}</span>}
      </div>
    </li>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex flex-col">
      <span
        className="text-xs text-[var(--text-muted)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {n}
      </span>
      <h3
        className="text-xl mt-2 mb-3 inline-block gold-fade w-fit"
        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
      >
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
    </li>
  );
}

function HeroNifCard({ t }: { t: ReturnType<typeof getLandingMessages> }) {
  return (
    <div className="relative">
      {/* Floating compliance preview card behind (rotated, gated par prefers-reduced-motion) */}
      <div
        className="absolute -top-6 -right-4 w-72 h-32 rounded-xl border border-[var(--surface-mist)] bg-white shadow-[var(--shadow-card)] p-4 hidden lg:block opacity-90 motion-safe:rotate-[3deg]"
        aria-hidden="true"
      >
        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
          Compliance
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="flex-1 h-2 rounded" style={{ background: "var(--status-green-bg)" }} />
          <span className="flex-1 h-2 rounded" style={{ background: "var(--status-green-bg)" }} />
          <span className="flex-1 h-2 rounded" style={{ background: "var(--status-amber-bg)" }} />
          <span className="flex-1 h-2 rounded" style={{ background: "var(--status-red-bg)" }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)]">11</span>
          <span className="font-medium" style={{ color: "var(--status-red)" }}>
            1
          </span>
        </div>
      </div>

      {/* Main NIF tracking card */}
      <div className="relative bg-white rounded-2xl border border-[var(--surface-mist)] shadow-[var(--shadow-card)] p-6 lg:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
              {t.nifCardLabel}
            </p>
            <p className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              NIF-2026-001234
            </p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: "var(--status-green-bg)",
              color: "var(--status-green)",
              border: "1px solid var(--status-green-border)",
            }}
          >
            {t.nifCardStatus}
          </span>
        </div>

        <h3
          className="text-xl mb-1"
          style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
        >
          {t.nifCardName}
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-6">{t.nifCardSubmitted}</p>

        <ol className="relative space-y-5 pl-7 border-l-2 border-[var(--surface-mist)] list-none">
          <TimelineStep
            done
            label={t.nifCardStepDocs}
            time={t.nifCardStepDocsTime}
          />
          <TimelineStep
            done
            label={t.nifCardStepPower}
            time={t.nifCardStepPowerTime}
          />
          <TimelineStep
            current
            label={t.nifCardStepFinancas}
            time={t.nifCardStepFinancasEta}
          />
          <TimelineStep
            pending
            label={t.nifCardStepReceived}
            time={t.nifCardStepReceivedEta}
          />
        </ol>

        <div className="mt-6 pt-5 border-t border-[var(--surface-mist)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">{t.nifCardPartner}</span>
          <span className="text-xs font-medium" lang="pt">
            Oliveira &amp; Carneiro
          </span>
        </div>
      </div>
    </div>
  );
}

function TimelineStep({
  label,
  time,
  done,
  current,
  pending,
}: {
  label: string;
  time: string;
  done?: boolean;
  current?: boolean;
  pending?: boolean;
}) {
  return (
    <li className="relative">
      <span
        className="absolute -left-[34px] top-0 w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: done
            ? "var(--brand-primary)"
            : pending
              ? "var(--surface-card)"
              : "var(--surface-card)",
          border: current
            ? "2px solid var(--brand-secondary)"
            : pending
              ? "2px solid var(--surface-mist-strong)"
              : "none",
        }}
        aria-hidden="true"
      >
        {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
        {current && (
          <span
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--brand-secondary)" }}
          />
        )}
      </span>
      <p
        className={[
          "text-sm",
          done || current ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]",
        ].join(" ")}
      >
        {label}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{time}</p>
    </li>
  );
}

