import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — EasyLaw",
  description:
    "Conditions Générales d'Utilisation de la plateforme EasyLaw. Services, paiement, responsabilité, données personnelles et droit applicable.",
};

const LAST_UPDATED = "1er juin 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface-page)" }}>
      {/* Simple top bar */}
      <header className="border-b border-[var(--surface-mist)] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
          >
            EasyLaw
          </Link>
          <span className="text-xs text-[var(--text-muted)]">Mise à jour : {LAST_UPDATED}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1
          className="text-4xl mb-3"
          style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
        >
          Conditions Générales d&rsquo;Utilisation
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Dernière mise à jour : {LAST_UPDATED}</p>

        <div className="prose prose-sm max-w-none space-y-10 text-[var(--text-secondary)] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              1. Préambule et définitions
            </h2>
            <p>
              Les présentes Conditions Générales d&rsquo;Utilisation (« CGU ») régissent l&rsquo;accès et l&rsquo;utilisation de la plateforme <strong>EasyLaw</strong> (ci-après « la Plateforme »), éditée par EasyLaw (ci-après « EasyLaw », « nous »).
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li><strong>Utilisateur</strong> : toute personne physique ou morale accédant à la Plateforme.</li>
              <li><strong>Services</strong> : ensemble des fonctionnalités proposées (NIF & Starter Pack, Générateur de contrats, Compliance Dashboard, Luso-Legal IA).</li>
              <li><strong>Cabinet partenaire</strong> : Oliveira & Carneiro Advogados, cabinet d&rsquo;avocats inscrit à l&rsquo;Ordem dos Advogados.</li>
              <li><strong>Contenu Utilisateur</strong> : tout document, information ou donnée soumis par l&rsquo;Utilisateur dans le cadre de l&rsquo;utilisation des Services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              2. Acceptation des CGU
            </h2>
            <p>
              L&rsquo;accès à la Plateforme implique l&rsquo;acceptation pleine et entière des présentes CGU. L&rsquo;Utilisateur reconnaît avoir pris connaissance des CGU avant toute utilisation. En cas de refus, l&rsquo;Utilisateur doit s&rsquo;abstenir d&rsquo;utiliser la Plateforme.
            </p>
            <p className="mt-2">
              EasyLaw se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication. L&rsquo;Utilisateur sera informé par email en cas de modification substantielle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              3. Description des services
            </h2>
            <p>EasyLaw propose les services suivants :</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>NIF & Starter Pack (99 € TTC, paiement unique)</strong> : obtention du Número de Identificação Fiscal (NIF) portugais par le Cabinet partenaire, incluant la génération d&rsquo;une procuration et le dépôt auprès des Finanças.
              </li>
              <li>
                <strong>Générateur de contrats (49 € TTC par contrat)</strong> : génération de contrats juridiques conformes au droit portugais à partir de modèles validés. Les contrats générés sont supervisés par le Cabinet partenaire.
              </li>
              <li>
                <strong>Compliance Dashboard (29 € TTC/mois)</strong> : surveillance des obligations légales de l&rsquo;Utilisateur, avec alertes automatiques email et SMS.
              </li>
              <li>
                <strong>Luso-Legal IA (19 € TTC/mois)</strong> : assistant juridique basé sur l&rsquo;intelligence artificielle, spécialisé en droit portugais. Ne constitue pas un conseil juridique personnalisé.
              </li>
            </ul>
            <p className="mt-3">
              EasyLaw est une plateforme technologique et non un cabinet d&rsquo;avocats. La supervision juridique est assurée par le Cabinet partenaire Oliveira & Carneiro Advogados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              4. Compte Utilisateur
            </h2>
            <p>
              L&rsquo;accès à la plupart des Services nécessite la création d&rsquo;un compte. L&rsquo;Utilisateur s&rsquo;engage à fournir des informations exactes et à les maintenir à jour. Tout accès frauduleux est interdit et pourra faire l&rsquo;objet de poursuites.
            </p>
            <p className="mt-2">
              L&rsquo;Utilisateur est responsable de la confidentialité de ses identifiants. EasyLaw ne peut être tenu responsable des conséquences d&rsquo;une utilisation non autorisée du compte par un tiers résultant d&rsquo;une négligence de l&rsquo;Utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              5. Tarifs et paiement
            </h2>
            <p>
              Les tarifs applicables sont ceux affichés sur la Plateforme au moment de la commande, toutes taxes comprises. EasyLaw se réserve le droit de modifier ses tarifs à tout moment, les nouvelles tarifications s&rsquo;appliquant aux nouvelles commandes uniquement.
            </p>
            <p className="mt-2">
              Le paiement s&rsquo;effectue en ligne par carte bancaire (Visa, Mastercard), via un prestataire de paiement sécurisé. Les données bancaires ne sont pas stockées par EasyLaw.
            </p>
            <p className="mt-2">
              Les abonnements mensuels (Compliance Dashboard, Luso-Legal IA) sont prélevés mensuellement et résiliables à tout moment depuis l&rsquo;espace client, sans frais ni préavis, avec effet à la fin de la période en cours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              6. Obligations de l&rsquo;Utilisateur
            </h2>
            <p>L&rsquo;Utilisateur s&rsquo;engage à :</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Utiliser la Plateforme conformément à sa destination et aux lois applicables.</li>
              <li>Ne pas fournir de documents falsifiés ou d&rsquo;informations erronées.</li>
              <li>Ne pas tenter de contourner les mesures de sécurité de la Plateforme.</li>
              <li>Ne pas utiliser la Plateforme à des fins illicites ou contraires aux présentes CGU.</li>
              <li>Conserver confidentiels ses identifiants de connexion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              7. Limitation de responsabilité
            </h2>
            <p>
              EasyLaw met tout en œuvre pour assurer la disponibilité et la fiabilité de la Plateforme mais ne garantit pas un accès ininterrompu ou sans erreur.
            </p>
            <p className="mt-2">
              L&rsquo;assistant Luso-Legal IA fournit des informations juridiques générales et ne constitue en aucun cas un conseil juridique personnalisé. EasyLaw décline toute responsabilité pour les décisions prises sur la base des informations fournies par l&rsquo;IA.
            </p>
            <p className="mt-2">
              La responsabilité d&rsquo;EasyLaw ne pourra excéder, en tout état de cause, le montant payé par l&rsquo;Utilisateur pour le Service concerné au cours des 12 derniers mois.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              8. Propriété intellectuelle
            </h2>
            <p>
              L&rsquo;ensemble du contenu de la Plateforme (textes, logiciels, algorithmes, interfaces, modèles de contrats) est protégé par le droit de la propriété intellectuelle. Toute reproduction, modification ou exploitation sans autorisation est interdite.
            </p>
            <p className="mt-2">
              Les contrats générés par l&rsquo;Utilisateur via la Plateforme lui appartiennent pleinement une fois téléchargés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              9. Données personnelles
            </h2>
            <p>
              Le traitement des données personnelles est régi par notre{" "}
              <Link href="/legal/privacy" className="underline" style={{ color: "var(--brand-primary)" }}>
                Politique de confidentialité
              </Link>
              , conforme au RGPD et à la législation portugaise (CNPD).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              10. Résiliation
            </h2>
            <p>
              L&rsquo;Utilisateur peut clôturer son compte à tout moment depuis les paramètres de son espace client. EasyLaw se réserve le droit de suspendre ou résilier tout compte en cas de violation des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              11. Droit applicable et juridiction
            </h2>
            <p>
              Les présentes CGU sont soumises au droit portugais. En cas de litige, les parties s&rsquo;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux de Lisbonne seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              12. Contact
            </h2>
            <p>
              Pour toute question relative aux présentes CGU :{" "}
              <a href="mailto:support@easylaw.pt" className="underline" style={{ color: "var(--brand-primary)" }}>
                support@easylaw.pt
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--surface-mist)] flex flex-wrap gap-4">
          <Link href="/legal/privacy" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>
            Politique de confidentialité
          </Link>
          <Link href="/legal/cookies" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>
            Politique cookies
          </Link>
          <Link href="/legal/mentions" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>
            Mentions légales
          </Link>
          <Link href="/contact" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>
            Contact
          </Link>
        </div>
      </main>
    </div>
  );
}
