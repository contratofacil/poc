import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales — EasyLaw",
  description: "Mentions légales de la plateforme EasyLaw : éditeur, hébergeur, propriété intellectuelle.",
};

export default function MentionsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface-page)" }}>
      <header className="border-b border-[var(--surface-mist)] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
          >
            EasyLaw
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1
          className="text-4xl mb-10"
          style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
        >
          Mentions légales
        </h1>

        <div className="space-y-10 text-[var(--text-secondary)] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              Éditeur du site
            </h2>
            <p><strong>EasyLaw</strong></p>
            <p>Plateforme technologique juridique</p>
            <p>Email : <a href="mailto:support@easylaw.pt" className="underline" style={{ color: "var(--brand-primary)" }}>support@easylaw.pt</a></p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              EasyLaw est une plateforme technologique et non un cabinet d&rsquo;avocats. Les actes juridiques réalisés sur la plateforme sont supervisés par le cabinet partenaire Oliveira & Carneiro Advogados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              Cabinet partenaire
            </h2>
            <p><strong>Oliveira & Carneiro Advogados</strong></p>
            <p>Inscrit à l&rsquo;Ordem dos Advogados (Portugal)</p>
            <p>Responsable : Manuel Carneiro, Avocat associé</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Cédula Profissional disponible sur demande à <a href="mailto:support@easylaw.pt" className="underline" style={{ color: "var(--brand-primary)" }}>support@easylaw.pt</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              Hébergement
            </h2>
            <p><strong>Railway Corporation</strong></p>
            <p>548 Market St PMB 72878, San Francisco, California 94104, États-Unis</p>
            <p>Site : <span className="font-mono text-sm">railway.app</span></p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Les données des utilisateurs de l&rsquo;Union Européenne sont stockées dans des centres de données conformes au RGPD. Voir notre{" "}
              <Link href="/legal/privacy" className="underline" style={{ color: "var(--brand-primary)" }}>
                Politique de confidentialité
              </Link>{" "}
              pour les détails sur les transferts de données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              Propriété intellectuelle
            </h2>
            <p>
              L&rsquo;ensemble des éléments constituant la plateforme EasyLaw (textes, graphiques, logiciels, modèles de contrats, algorithmes, interfaces) est protégé par le droit de la propriété intellectuelle et reste la propriété exclusive d&rsquo;EasyLaw ou de ses partenaires.
            </p>
            <p className="mt-2">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de la plateforme, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable d&rsquo;EasyLaw.
            </p>
            <p className="mt-2">
              Les documents générés par l&rsquo;Utilisateur via la Plateforme lui appartiennent pleinement dès leur téléchargement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              Limitation de responsabilité
            </h2>
            <p>
              EasyLaw ne saurait être tenu responsable des dommages directs ou indirects résultant de l&rsquo;utilisation de la plateforme ou de l&rsquo;impossibilité d&rsquo;y accéder. EasyLaw se réserve le droit de modifier le contenu de la plateforme sans préavis.
            </p>
            <p className="mt-2">
              Les informations fournies par l&rsquo;assistant Luso-Legal IA ont un caractère général et informatif. Elles ne constituent pas des conseils juridiques personnalisés. Pour toute situation spécifique, consultez un avocat qualifié.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              Droit applicable
            </h2>
            <p>
              Les présentes mentions légales sont soumises au droit portugais. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux de Lisbonne (Portugal).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              Contact
            </h2>
            <p>
              Pour toute question : <a href="mailto:support@easylaw.pt" className="underline" style={{ color: "var(--brand-primary)" }}>support@easylaw.pt</a> ou via notre{" "}
              <Link href="/contact" className="underline" style={{ color: "var(--brand-primary)" }}>
                formulaire de contact
              </Link>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[var(--surface-mist)] flex flex-wrap gap-4">
          <Link href="/legal/terms" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>CGU</Link>
          <Link href="/legal/privacy" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>Confidentialité</Link>
          <Link href="/legal/cookies" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>Cookies</Link>
        </div>
      </main>
    </div>
  );
}
