import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/* ── Article database ─────────────────────────────────────────────────────── */

interface Article {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: number;
  author: string;
  authorRole: string;
  content: string;
}

const articles: Article[] = [
  {
    slug: "comment-obtenir-nif-portugais-2026",
    category: "NIF & Fiscalité",
    title: "Comment obtenir son NIF portugais depuis l'étranger en 2026",
    excerpt:
      "Le NIF (Número de Identificação Fiscal) est obligatoire pour toute vie administrative au Portugal. Ce guide complet explique les étapes, les documents requis, les délais et comment EasyLaw simplifie la procédure.",
    date: "3 juin 2026",
    readTime: 8,
    author: "Équipe EasyLaw",
    authorRole: "Supervisé par Oliveira & Carneiro Advogados",
    content: `
## Qu'est-ce que le NIF portugais ?

Le NIF (Número de Identificação Fiscal) est le numéro d'identification fiscale portugais. Il est équivalent au numéro fiscal français (SIREN/SIRET pour les entreprises, ou numéro fiscal personnel). Sans NIF, vous ne pouvez pas :

- Ouvrir un compte bancaire au Portugal
- Signer un contrat de bail
- Acheter ou louer un bien immobilier
- Créer une entreprise
- Être employé légalement
- Accéder à de nombreux services administratifs

**En résumé : le NIF est indispensable pour toute démarche administrative ou économique au Portugal.**

## Qui peut obtenir un NIF ?

Toute personne physique peut obtenir un NIF portugais, qu'elle soit :

- **Ressortissant de l'UE** : simplification des démarches
- **Non-ressortissant de l'UE** : procédure avec représentant légal obligatoire
- **Résident ou non-résident** : le NIF est accessible aux deux

Les personnes morales (sociétés) obtiennent un NIF différent lors de leur immatriculation commerciale (NIPC — Número de Identificação de Pessoa Coletiva).

## Documents requis

Pour un ressortissant UE :
- Passeport ou carte d'identité valide
- Justificatif de domicile (quittance de loyer, facture d'électricité, relevé bancaire — moins de 3 mois)
- Procuration si vous passez par un mandataire (comme EasyLaw)

Pour un ressortissant non-UE :
- Passeport valide
- Justificatif de domicile dans le pays de résidence
- Un représentant légal fiscal résidant au Portugal (obligatoire)
- Procuration notariée en faveur du représentant

## Comment obtenir son NIF : les différentes options

### Option 1 : Se rendre en personne aux Finanças

Vous pouvez vous présenter directement à un bureau des Finanças (administration fiscale portugaise) avec vos documents. Cette option requiert :
- Un déplacement physique au Portugal
- Une maîtrise du portugais ou un interprète
- Un rendez-vous préalable (souvent plusieurs semaines d'attente)

**Délai : 1 à 4 semaines selon les bureaux.**

### Option 2 : Via un avocat ou mandataire

Vous délivrez une procuration à un avocat ou mandataire portugais qui effectue les démarches à votre place. C'est la procédure obligatoire pour les non-ressortissants UE, et recommandée pour tous les non-résidents.

**Délai : 1 à 2 semaines selon le mandataire.**

### Option 3 : Via EasyLaw

EasyLaw gère l'intégralité de la procédure à distance, supervisée par le cabinet Oliveira & Carneiro Advogados :

1. Vous remplissez le formulaire en ligne (5 minutes)
2. Vous uploadez vos documents
3. EasyLaw génère automatiquement votre procuration
4. Le cabinet dépose votre dossier aux Finanças
5. Vous recevez votre NIF par email

**Délai habituel : 48 heures ouvrées.**
**Tarif : 99 € tout compris.**

## Étapes détaillées avec EasyLaw

### Étape 1 : Remplir le formulaire

Accédez à la page NIF et renseignez vos informations personnelles :
- Nom complet (tel qu'il apparaît sur votre passeport)
- Date de naissance
- Nationalité
- Adresse de résidence actuelle

### Étape 2 : Uploader vos documents

Deux documents sont requis :
- Passeport ou carte d'identité (toutes les pages avec photo)
- Justificatif de domicile récent (moins de 3 mois)

Tous les documents sont chiffrés AES-256 lors de l'upload.

### Étape 3 : Procuration automatique

EasyLaw génère automatiquement une procuration (Procuração) en bonne et due forme. Vous la signez électroniquement ou la téléchargez pour signature manuscrite.

La procuration mandate le cabinet Oliveira & Carneiro Advogados pour agir en votre nom auprès des Finanças.

### Étape 4 : Paiement

Paiement sécurisé de 99 € par carte bancaire. Votre dossier est immédiatement transmis au cabinet.

### Étape 5 : Suivi en temps réel

Depuis votre espace EasyLaw, vous suivez l'avancement en temps réel :
- ✅ Documents vérifiés
- ✅ Procuration signée
- 🔄 Dépôt aux Finanças en cours
- ⏳ NIF reçu (vous seriez informé)

### Étape 6 : Réception du NIF

Dès réception du NIF, vous êtes notifié par email. Le numéro est disponible dans votre espace client.

## FAQ sur le NIF portugais

**Mon NIF est-il valable à vie ?**
Oui. Le NIF est un identifiant permanent qui ne change pas, même si vous quittez le Portugal.

**Puis-je ouvrir un compte bancaire avec mon NIF ?**
Oui. Le NIF est l'un des documents clés pour ouvrir un compte dans une banque portugaise. EasyLaw propose également une option d'ouverture de compte bancaire.

**Le NIF est-il public ?**
Non. Le NIF est confidentiel. Vous ne devez le communiquer qu'aux entités qui en ont besoin légalement (banque, employeur, administration).

**J'ai besoin d'un NIF urgent (achat immobilier imminent) — que faire ?**
Contactez notre équipe via le formulaire de contact ou l'assistant Luso-Legal. Nous pouvons prioriser les dossiers urgents.

---

*Article rédigé par l'équipe EasyLaw et supervisé par Oliveira & Carneiro Advogados. Dernière mise à jour : juin 2026. Les informations fournies sont à titre informatif général et ne constituent pas des conseils juridiques personnalisés.*
    `,
  },
  {
    slug: "5-erreurs-bail-nrau",
    category: "Contrats",
    title: "Les 5 erreurs à éviter dans un bail NRAU",
    excerpt:
      "Le bail d'habitation portugais (NRAU) a ses spécificités. Durée minimale, clauses obligatoires, index de révision — voici les pièges les plus fréquents.",
    date: "28 mai 2026",
    readTime: 6,
    author: "Équipe EasyLaw",
    authorRole: "Supervisé par Oliveira & Carneiro Advogados",
    content: `
## Le NRAU : cadre légal du bail d'habitation au Portugal

Le NRAU (Novo Regime do Arrendamento Urbano) est le régime légal qui encadre les baux d'habitation au Portugal depuis 2012, avec plusieurs révisions notables. Tout propriétaire ou locataire doit en connaître les règles fondamentales pour éviter des litiges coûteux.

## Erreur n°1 : Ne pas respecter la durée minimale

Le NRAU impose une durée minimale de bail. Un bail de moins d'1 an est automatiquement requalifié en bail d'1 an par la loi, même si les deux parties ont signé une durée plus courte.

**À savoir :** Les baux de courte durée (saisonniers, logements meublés temporaires) suivent un régime spécifique et doivent être clairement qualifiés comme tels.

## Erreur n°2 : Omettre les mentions obligatoires

Un bail NRAU valide doit impérativement mentionner :

- L'identification précise du bien (adresse, fraction, étage)
- La durée initiale et les conditions de renouvellement
- Le montant du loyer et les modalités de paiement
- La valeur de la caution (máximo : 2 mois de loyer)
- La date d'entrée en jouissance
- L'identification des parties (NIF inclus)

L'absence de l'une de ces mentions peut rendre le bail nul ou difficilement exécutable.

## Erreur n°3 : Ne pas indexer le loyer correctement

Le NRAU prévoit une révision annuelle du loyer selon le coefficient fixé par le gouvernement (basé sur l'inflation). Le propriétaire doit notifier le locataire **au moins 30 jours avant** l'application de la révision.

Beaucoup de bailleurs oublient cette notification ou appliquent un taux arbitraire — ce qui constitue une violation du contrat.

## Erreur n°4 : Mal rédiger la clause de résiliation

Les conditions de résiliation diffèrent selon l'initiative :

- **Résiliation par le locataire** : préavis de 2 mois minimum (bail d'1 an ou plus)
- **Résiliation par le propriétaire** : procédure strictement encadrée, motifs légaux obligatoires, préavis long (jusqu'à 3 ans dans certains cas)

Une clause de résiliation mal rédigée ou trop restrictive peut être invalidée par le tribunal.

## Erreur n°5 : Ne pas faire un état des lieux détaillé

L'absence d'état des lieux (vistoria) rend pratiquement impossible le recours en cas de dégradation. La loi portugaise présume que le bien a été remis en bon état si aucun état des lieux n'a été dressé à l'entrée.

**Notre recommandation :** Photos datées, vidéo, et état des lieux signé par les deux parties avant la remise des clés.

---

Le générateur de contrats EasyLaw inclut tous ces éléments obligatoires, validés par le cabinet Oliveira & Carneiro Advogados.

*Article rédigé par l'équipe EasyLaw et supervisé par Oliveira & Carneiro Advogados. Les informations fournies sont à titre informatif général.*
    `,
  },
];

/* ── Static params ─────────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return { title: "Article — EasyLaw" };
  return {
    title: `${article.title} — EasyLaw`,
    description: article.excerpt,
  };
}

/* ── Markdown-lite renderer ────────────────────────────────────────────────── */

function renderContent(md: string) {
  const lines = md.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="text-2xl mt-10 mb-4"
          style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-6 mb-2" style={{ color: "var(--brand-primary)" }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc pl-5 my-3 space-y-1 text-[var(--text-secondary)]">
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          ))}
        </ul>
      );
      continue;
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="my-8 border-[var(--surface-mist)]" />);
    } else if (line.trim() === "") {
      // skip
    } else {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      elements.push(
        <p key={i} className="text-[var(--text-secondary)] leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: html }} />
      );
    }
    i++;
  }

  return elements;
}

/* ── Page component ────────────────────────────────────────────────────────── */

import React from "react";

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find((a) => a.slug === params.slug);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--surface-page)" }}>
        <p className="text-[var(--text-muted)]">Article introuvable.</p>
        <Link href="/blog" className="text-sm underline" style={{ color: "var(--brand-primary)" }}>
          ← Retour au blog
        </Link>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    "NIF & Fiscalité": "#1A6FC4",
    Contrats: "#7C3AED",
    Compliance: "#059669",
    Expats: "#D97706",
    Entreprises: "#DC2626",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-page)" }}>
      <header className="border-b border-[var(--surface-mist)] bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
          >
            EasyLaw
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <span
          className="inline-block text-xs font-medium px-2.5 py-1 rounded-full text-white mb-6"
          style={{ background: categoryColors[article.category] ?? "var(--brand-primary)" }}
        >
          {article.category}
        </span>

        <h1
          className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] mb-6"
          style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
        >
          {article.title}
        </h1>

        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[var(--surface-mist)]">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "var(--brand-primary)" }}
            aria-hidden="true"
          >
            {article.author.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{article.author}</p>
            <p className="text-xs text-[var(--text-muted)]">{article.authorRole}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-[var(--text-muted)]">{article.date}</p>
            <p className="text-xs text-[var(--text-muted)]">{article.readTime} min de lecture</p>
          </div>
        </div>

        <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 italic border-l-2 pl-4" style={{ borderColor: "var(--brand-secondary)" }}>
          {article.excerpt}
        </p>

        <article>{renderContent(article.content)}</article>

        <div className="mt-12 p-6 rounded-xl border border-[var(--surface-mist)] bg-white">
          <p className="text-sm font-medium mb-2" style={{ color: "var(--brand-primary)" }}>
            Prêt à commencer votre démarche ?
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            EasyLaw simplifie les démarches juridiques au Portugal — NIF, contrats, compliance.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ background: "var(--brand-secondary)", color: "var(--text-primary)" }}
          >
            Commencer gratuitement
          </Link>
        </div>
      </main>
    </div>
  );
}
