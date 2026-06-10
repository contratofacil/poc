import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — EasyLaw",
  description:
    "Politique de confidentialité EasyLaw : données collectées, base légale, droits RGPD, conservation et contact du délégué à la protection des données.",
};

const LAST_UPDATED = "1er juin 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface-page)" }}>
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
          Politique de confidentialité
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Dernière mise à jour : {LAST_UPDATED}</p>

        <div className="space-y-10 text-[var(--text-secondary)] leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              1. Responsable du traitement
            </h2>
            <p>
              Le responsable du traitement des données à caractère personnel collectées via la plateforme EasyLaw est <strong>EasyLaw</strong>, joignable à l&rsquo;adresse <a href="mailto:privacy@easylaw.pt" className="underline" style={{ color: "var(--brand-primary)" }}>privacy@easylaw.pt</a>.
            </p>
            <p className="mt-2">
              Le Cabinet partenaire <strong>Oliveira & Carneiro Advogados</strong> est responsable de traitement indépendant pour les données traitées dans le cadre de la supervision juridique des dossiers, soumises au secret professionnel de l&rsquo;avocat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              2. Données collectées
            </h2>
            <p>EasyLaw collecte les catégories de données suivantes :</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Données d&rsquo;identification</strong> : nom, prénom, date de naissance, nationalité, adresse de résidence, adresse email.
              </li>
              <li>
                <strong>Documents d&rsquo;identité</strong> : passeport, titre de séjour, justificatif de domicile (collectés uniquement pour les Services NIF et Contrats).
              </li>
              <li>
                <strong>Données de compte</strong> : identifiant, historique de connexion, préférences de langue.
              </li>
              <li>
                <strong>Données de paiement</strong> : les transactions sont gérées par notre prestataire de paiement. EasyLaw ne stocke aucune donnée bancaire.
              </li>
              <li>
                <strong>Données de navigation</strong> : adresse IP, type de navigateur, pages visitées, cookies analytiques (avec consentement).
              </li>
              <li>
                <strong>Données de communication</strong> : messages envoyés via le formulaire de contact ou l&rsquo;assistant Luso-Legal.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              3. Finalités et base légale
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ background: "var(--surface-page)" }}>
                    <th className="text-left p-3 border border-[var(--surface-mist)] font-medium" style={{ color: "var(--brand-primary)" }}>Finalité</th>
                    <th className="text-left p-3 border border-[var(--surface-mist)] font-medium" style={{ color: "var(--brand-primary)" }}>Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Création et gestion de compte", "Exécution du contrat (art. 6.1.b RGPD)"],
                    ["Traitement des dossiers NIF et contrats", "Exécution du contrat"],
                    ["Facturation et paiement", "Obligation légale"],
                    ["Alertes compliance et notifications", "Exécution du contrat"],
                    ["Assistance via Luso-Legal IA", "Exécution du contrat"],
                    ["Amélioration des Services", "Intérêt légitime"],
                    ["Cookies analytiques", "Consentement (art. 6.1.a RGPD)"],
                    ["Envoi d'emails marketing", "Consentement"],
                  ].map(([f, b], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "white" : "var(--surface-page)" }}>
                      <td className="p-3 border border-[var(--surface-mist)]">{f}</td>
                      <td className="p-3 border border-[var(--surface-mist)]">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              4. Durée de conservation
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Données de compte actif : durée de la relation contractuelle + 3 ans.</li>
              <li>Documents de dossier (NIF, contrats) : 5 ans à compter de la clôture du dossier (obligation légale comptable).</li>
              <li>Logs de connexion : 12 mois.</li>
              <li>Données de cookies analytiques : 13 mois maximum.</li>
              <li>Données marketing : jusqu&rsquo;au retrait du consentement ou 3 ans après le dernier contact.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              5. Destinataires des données
            </h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>Oliveira & Carneiro Advogados</strong> : uniquement les données nécessaires à la supervision juridique des dossiers, sous secret professionnel.</li>
              <li><strong>Prestataires techniques</strong> : hébergement (Railway), traitement de paiement, envoi d&rsquo;emails et SMS — uniquement sur instruction d&rsquo;EasyLaw et sous accord de confidentialité.</li>
              <li><strong>Autorités administratives portugaises</strong> : Finanças, dans le cadre des dossiers NIF, conformément à l&rsquo;obligation légale.</li>
            </ul>
            <p className="mt-2">
              Aucune donnée n&rsquo;est vendue à des tiers. Aucun transfert hors UE/EEE sans garanties appropriées (clauses contractuelles types de la Commission européenne).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              6. Sécurité des données
            </h2>
            <p>
              EasyLaw applique des mesures techniques et organisationnelles appropriées : chiffrement TLS 1.3 en transit, chiffrement AES-256 au repos, ségrégation des données par dossier, contrôles d&rsquo;accès stricts, journalisation des accès.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              7. Vos droits RGPD
            </h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li><strong>Droit d&rsquo;accès</strong> : obtenir une copie de vos données.</li>
              <li><strong>Droit de rectification</strong> : corriger des données inexactes.</li>
              <li><strong>Droit à l&rsquo;effacement</strong> : demander la suppression, sous réserve des obligations légales de conservation.</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré.</li>
              <li><strong>Droit d&rsquo;opposition</strong> : s&rsquo;opposer au traitement basé sur l&rsquo;intérêt légitime.</li>
              <li><strong>Droit à la limitation</strong> : demander la suspension du traitement.</li>
              <li><strong>Retrait du consentement</strong> : à tout moment, pour les traitements basés sur le consentement.</li>
            </ul>
            <p className="mt-3">
              Pour exercer vos droits : <a href="mailto:privacy@easylaw.pt" className="underline" style={{ color: "var(--brand-primary)" }}>privacy@easylaw.pt</a> ou depuis votre espace client (Paramètres → Exporter mes données / Supprimer mon compte).
            </p>
            <p className="mt-2">
              En cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la <strong>CNPD</strong> (Comissão Nacional de Proteção de Dados, Portugal) ou de l&rsquo;autorité de contrôle de votre État membre.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              8. Cookies
            </h2>
            <p>
              Pour les détails sur notre utilisation des cookies, consultez notre{" "}
              <Link href="/legal/cookies" className="underline" style={{ color: "var(--brand-primary)" }}>
                Politique cookies
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
              9. Contact
            </h2>
            <p>
              Pour toute question relative à la présente politique ou à l&rsquo;exercice de vos droits :{" "}
              <a href="mailto:privacy@easylaw.pt" className="underline" style={{ color: "var(--brand-primary)" }}>
                privacy@easylaw.pt
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--surface-mist)] flex flex-wrap gap-4">
          <Link href="/legal/terms" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>CGU</Link>
          <Link href="/legal/cookies" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>Politique cookies</Link>
          <Link href="/legal/mentions" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>Mentions légales</Link>
        </div>
      </main>
    </div>
  );
}
