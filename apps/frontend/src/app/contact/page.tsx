"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getLandingMessages } from "@/lib/landing/i18n";
import { useLanguage } from "@/lib/lang/useLanguage";
import { apiFetch } from "@/lib/api";

const content = {
  en: {
    heroEyebrow: "Support & contact",
    heroTitle: "We're here to help.",
    heroSubtitle:
      "A question about your NIF case, a contract to generate, or need legal advice? Our team responds within 24 hours.",
    formTitle: "Send us a message",
    labelName: "Full name",
    placeholderName: "Jane Smith",
    labelEmail: "Email address",
    placeholderEmail: "jane@example.com",
    labelSubject: "Subject",
    subjects: [
      "My NIF application",
      "Contract generator",
      "Compliance Dashboard",
      "Luso-Legal AI",
      "General legal question",
      "Billing",
      "Other",
    ],
    labelMessage: "Message",
    placeholderMessage: "Describe your question or situation...",
    submitBtn: "Send message",
    submittedTitle: "Message sent!",
    submittedBody: "We will reply within 24 working hours to the address provided.",
    submitError: "Your message could not be sent. Please try again or email us directly.",
    infoTitle: "Other ways to reach us",
    emailLabel: "Email",
    emailValue: "support@easylaw.pt",
    responseLabel: "Response time",
    responseValue: "< 24 working hours",
    hoursLabel: "Availability",
    hoursValue: "Mon – Fri, 9am – 6pm (Lisbon)",
    faqTitle: "Browse our FAQ",
    faqBody: "Find instant answers to the most common questions.",
    faqLink: "View FAQ",
    legalNote:
      "For urgent legal questions, use the Luso-Legal assistant (available 24/7) or request escalation to a lawyer at Oliveira & Carneiro.",
  },
  fr: {
    heroEyebrow: "Support & contact",
    heroTitle: "Nous sommes là pour vous aider.",
    heroSubtitle:
      "Une question sur votre dossier NIF, un contrat à générer, ou besoin d'un conseil juridique ? Notre équipe répond sous 24h.",
    formTitle: "Envoyez-nous un message",
    labelName: "Nom complet",
    placeholderName: "Jean Dupont",
    labelEmail: "Adresse email",
    placeholderEmail: "jean@exemple.com",
    labelSubject: "Sujet",
    subjects: [
      "Mon dossier NIF",
      "Générateur de contrats",
      "Compliance Dashboard",
      "Luso-Legal IA",
      "Question juridique générale",
      "Facturation",
      "Autre",
    ],
    labelMessage: "Message",
    placeholderMessage: "Décrivez votre question ou votre situation...",
    submitBtn: "Envoyer le message",
    submittedTitle: "Message envoyé !",
    submittedBody: "Nous vous répondrons dans les 24 heures ouvrées à l'adresse indiquée.",
    submitError: "Votre message n'a pas pu être envoyé. Réessayez ou écrivez-nous directement par email.",
    infoTitle: "Autres façons de nous contacter",
    emailLabel: "Email",
    emailValue: "support@easylaw.pt",
    responseLabel: "Délai de réponse",
    responseValue: "< 24h ouvrées",
    hoursLabel: "Disponibilité",
    hoursValue: "Lun – Ven, 9h – 18h (Lisbonne)",
    faqTitle: "Consultez notre FAQ",
    faqBody: "Trouvez des réponses immédiates aux questions les plus fréquentes.",
    faqLink: "Voir la FAQ",
    legalNote:
      "Pour les questions juridiques urgentes, utilisez l'assistant Luso-Legal (disponible 24h/24) ou demandez une escalade vers un avocat du cabinet Oliveira & Carneiro.",
  },
  pt: {
    heroEyebrow: "Suporte & contacto",
    heroTitle: "Estamos aqui para o ajudar.",
    heroSubtitle:
      "Uma questão sobre o seu processo NIF, um contrato a gerar, ou precisa de um conselho jurídico? A nossa equipa responde em 24h.",
    formTitle: "Envie-nos uma mensagem",
    labelName: "Nome completo",
    placeholderName: "João Silva",
    labelEmail: "Endereço de email",
    placeholderEmail: "joao@exemplo.pt",
    labelSubject: "Assunto",
    subjects: [
      "O meu processo NIF",
      "Gerador de contratos",
      "Compliance Dashboard",
      "Luso-Legal IA",
      "Questão jurídica geral",
      "Faturação",
      "Outro",
    ],
    labelMessage: "Mensagem",
    placeholderMessage: "Descreva a sua questão ou situação...",
    submitBtn: "Enviar mensagem",
    submittedTitle: "Mensagem enviada!",
    submittedBody: "Responderemos nas 24 horas úteis seguintes para o endereço indicado.",
    submitError: "Não foi possível enviar a sua mensagem. Tente novamente ou escreva-nos diretamente por email.",
    infoTitle: "Outras formas de nos contactar",
    emailLabel: "Email",
    emailValue: "support@easylaw.pt",
    responseLabel: "Prazo de resposta",
    responseValue: "< 24h úteis",
    hoursLabel: "Disponibilidade",
    hoursValue: "Seg – Sex, 9h – 18h (Lisboa)",
    faqTitle: "Consulte as nossas FAQ",
    faqBody: "Encontre respostas imediatas às perguntas mais frequentes.",
    faqLink: "Ver as FAQ",
    legalNote:
      "Para questões jurídicas urgentes, utilize o assistente Luso-Legal (disponível 24h/24) ou solicite uma escalação para um advogado do escritório Oliveira & Carneiro.",
  },
};

export default function ContactPage() {
  const [lang, setLang] = useLanguage();
  const shell = getLandingMessages(lang);
  const t = content[lang] ?? content.pt;

  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(false);
    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--surface-mist-strong)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)] focus:border-transparent transition";

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
              className="text-4xl md:text-5xl mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              {t.heroTitle}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl">{t.heroSubtitle}</p>
          </div>
        </section>

        {/* Form + Info */}
        <section className="border-b border-[var(--surface-mist)] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <h2
                className="text-2xl mb-7"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.formTitle}
              </h2>
              {submitted ? (
                <div className="rounded-xl border border-[var(--surface-mist)] p-8 text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "var(--status-green-bg)" }}
                  >
                    <MessageSquare className="h-5 w-5" style={{ color: "var(--status-green)" }} />
                  </div>
                  <h3
                    className="text-xl mb-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    {t.submittedTitle}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">{t.submittedBody}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                        {t.labelName}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.placeholderName}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                        {t.labelEmail}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={t.placeholderEmail}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      {t.labelSubject}
                    </label>
                    <select
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className={inputClass}
                    >
                      <option value="" disabled>—</option>
                      {t.subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      {t.labelMessage}
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder={t.placeholderMessage}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  {error && (
                    <p role="alert" className="text-sm" style={{ color: "var(--status-red)" }}>
                      {t.submitError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-lg px-6 py-3 text-sm font-semibold disabled:opacity-60"
                    style={{ background: "var(--brand-secondary)", color: "var(--text-primary)" }}
                  >
                    {sending ? "…" : t.submitBtn}
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <aside className="lg:col-span-2 space-y-6">
              <h2
                className="text-xl"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.infoTitle}
              </h2>
              <div className="space-y-4">
                {[
                  { icon: <Mail className="h-4 w-4" />, label: t.emailLabel, value: t.emailValue },
                  { icon: <Clock className="h-4 w-4" />, label: t.responseLabel, value: t.responseValue },
                  { icon: <Clock className="h-4 w-4" />, label: t.hoursLabel, value: t.hoursValue },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--surface-page)", color: "var(--brand-primary)" }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[var(--surface-mist)] p-5">
                <h3
                  className="text-base mb-1"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                >
                  {t.faqTitle}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{t.faqBody}</p>
                <Link
                  href="/#faq"
                  className="inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {t.faqLink}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--surface-mist)] pt-4">
                {t.legalNote}
              </p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter messages={shell} />
    </>
  );
}
