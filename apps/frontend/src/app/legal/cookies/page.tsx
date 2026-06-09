/**
 * Politique cookies — page placeholder (P4 / D-012)
 *
 * Le banner de consentement renvoie ici via son lien "Politique cookies".
 * Contenu MVP minimal — à étoffer avec le service juridique avant launch publique.
 */

import Link from "next/link";

export const metadata = {
  title: "Politique cookies — EasyLaw",
  description:
    "Comment EasyLaw utilise les cookies — catégories, durées de conservation, droits RGPD.",
};

export default function CookiesPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
        Information légale
      </p>
      <h1 className="mb-6">Politique cookies</h1>

      <div className="prose-easylaw space-y-6 text-[var(--text-primary)] leading-relaxed">
        <p>
          Cette page décrit les cookies utilisés par EasyLaw. Vous pouvez à tout
          moment revoir vos choix depuis le lien{" "}
          <span className="text-[var(--text-muted)] italic">« Gérer mes cookies »</span>{" "}
          présent dans le footer du site.
        </p>

        <section>
          <h2 className="text-xl mb-2">Cookies nécessaires <span className="text-xs font-normal text-[var(--text-muted)]">— toujours actifs</span></h2>
          <p className="text-sm">
            Indispensables au fonctionnement du site. Ils gèrent votre session,
            votre authentification, le choix de langue, et la mémorisation de
            votre consentement aux cookies lui-même. Ils ne peuvent pas être
            désactivés sans rendre le site inopérant.
          </p>
        </section>

        <section>
          <h2 className="text-xl mb-2">Cookies analytiques <span className="text-xs font-normal text-[var(--text-muted)]">— opt-in</span></h2>
          <p className="text-sm">
            Mesure d'audience anonymisée pour comprendre comment vous utilisez
            le service et l'améliorer. IP anonymisée. Pas de profilage individuel.
            Activable depuis vos préférences.
          </p>
        </section>

        <section>
          <h2 className="text-xl mb-2">Cookies marketing <span className="text-xs font-normal text-[var(--text-muted)]">— opt-in</span></h2>
          <p className="text-sm">
            Pixels publicitaires et remarketing (Meta, Google Ads). Désactivés
            par défaut. Vous devez explicitement les activer pour autoriser
            cette catégorie.
          </p>
        </section>

        <section>
          <h2 className="text-xl mb-2">Cookies de personnalisation <span className="text-xs font-normal text-[var(--text-muted)]">— opt-in</span></h2>
          <p className="text-sm">
            Tests A/B et adaptation du contenu à votre comportement. Désactivés
            par défaut. Activables depuis vos préférences.
          </p>
        </section>

        <section>
          <h2 className="text-xl mb-2">Durée de conservation</h2>
          <p className="text-sm">
            Votre choix est mémorisé pour 12 mois maximum, conformément aux
            recommandations CNPD / CNIL. Au-delà, un nouveau consentement
            vous sera demandé.
          </p>
        </section>

        <section>
          <h2 className="text-xl mb-2">Vos droits</h2>
          <p className="text-sm">
            Conformément à la <em>Directive ePrivacy</em> et au <em>RGPD (Art. 7)</em>,
            vous pouvez à tout moment retirer votre consentement sans
            justification, depuis le lien dans le footer du site.
          </p>
        </section>

        <p className="text-sm text-[var(--text-muted)] pt-4 border-t border-[var(--surface-mist)]">
          Cette politique sera complétée par le cabinet partenaire avant la
          mise en ligne publique. Pour toute question, contactez{" "}
          <Link href="/contact" className="underline">notre support</Link>.
        </p>
      </div>
    </main>
  );
}
