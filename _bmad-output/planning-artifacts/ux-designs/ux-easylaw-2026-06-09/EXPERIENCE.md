---
title: "EasyLaw — EXPERIENCE.md"
project: easylaw
status: final
created: 2026-06-09
updated: 2026-06-09
sources:
  - ../../brief/easylaw-brief-2026-05-26/brief.md
  - ../../prd/easylaw-prd-2026-05-26.md
  - ../../ux/easylaw-ux-2026-05-26.md
  - ../../architecture/easylaw-architecture-2026-05-26.md
  - ../../epics/easylaw-epics-stories-2026-05-26.md
design_ref: ./DESIGN.md
---

# EXPERIENCE.md — EasyLaw

> Spine canonique du comportement, de l'IA, des parcours, des états et de l'accessibilité. Gagne sur tout mock ou wireframe en conflit. Les tokens visuels (`{colors.brand.primary}`, etc.) référencent `DESIGN.md`.

## Foundation

- **Form-factor** : mobile-first (smartphone 375px+), responsive jusqu'à desktop 1280px+. Pas d'app native MVP.
- **UI system** : pas de design system parent tiers (shadcn, MUI, Radix). Lib UI custom propre à EasyLaw, bâtie sur Tailwind v4 + design tokens (voir [DESIGN.md](./DESIGN.md)).
- **Framework cible** : Next.js 16 App Router + React 19 (voir `apps/frontend/AGENTS.md` — la version embarque des breaking changes, lire `node_modules/next/dist/docs/` avant tout code).
- **Surfaces produit** :
  1. **Site public / Landing** — `easylaw.{pt,fr,com}` — acquisition, SEO, conversion.
  2. **App client (Grand Public)** — espace authentifié pour NIF, contrats, compliance, Luso-Legal.
  3. **Portail Cabinet** (Phase 2) — Module B : recherche IA, analyse doc, GED, KMS.
- **Auth** : Privy embedded (Email OTP, SMS OTP, Passkey, Google, LinkedIn) — pas d'écran login custom au MVP. CMD/eIDAS différé (Epic 7).
- **i18n** : PT + FR au MVP. EN en Phase 2. ES en Phase 3. Switch 1-clic dans header, persistance cookie.
- **Stakes** : **regulated consumer** — produit juridique destiné au grand public et PME, soumis à RGPD, secret professionnel, transparence des prix, mention obligatoire "non-conseil personnalisé" sur IA.

## Information Architecture

### Carte d'ensemble

```
easylaw (public)
├── /                          Landing publique
├── /comment-ca-marche         Onboarding produit (3 étapes)
├── /tarifs                    Pricing transparent (table)
├── /a-propos                  Partenariat Oliveira & Carneiro + équipe
├── /blog                      Articles SEO juridiques (Phase 2)
├── /contact                   Form contact + adresses
└── /legal                     CGU, Privacy, RGPD, Mentions légales

app.easylaw (authentifié — shell unique)
├── /dashboard                 Tableau de bord rôle-aware
├── /nif
│   ├── /nif/new               Wizard 4 étapes
│   ├── /nif/:id               Suivi dossier (timeline)
│   └── /nif/list              Mes dossiers NIF
├── /contracts
│   ├── /contracts             Catalogue 5 templates
│   ├── /contracts/wizard/:type Wizard Q&A + preview PDF live
│   └── /contracts/:id         Contrat généré (DL, sign, archive)
├── /compliance
│   ├── /compliance            Dashboard tri-couleur
│   ├── /compliance/:obligationId  Détail obligation
│   └── /compliance/settings   Préférences d'alerte
├── /assistant                 Luso-Legal chat + historique
│   └── /assistant/:threadId   Conversation détaillée
├── /vault                     Mes documents (coffre-fort)
│   └── /vault/:docId          Preview + versions + audit
├── /profile                   Compte (info, langue, sécurité)
│   └── /profile/export        RGPD : export données / suppression
└── /admin (cabinet/avocat)    Monitoring : escalades, volumes, dossiers
```

### Règles de structuration

1. **Shell unique authentifié** : sidebar gauche (desktop) / bottom-nav (mobile) avec 5 items max + menu profil. Sections accessibles selon rôle :
   - **client** : Dashboard, NIF, Contracts, Compliance, Assistant, Vault, Profile.
   - **avocat / junior** : ajoute Admin (escalades), Cabinet Tools (Phase 2).
   - **admin_cabinet** : ajoute RBAC, Audit log, Settings cabinet.
2. **Pas de menu profond** — chaque section a max 1 niveau d'imbrication navigable depuis la sidebar.
3. **Breadcrumbs** sur toute page interne (sauf dashboard).
4. **Search global** : `Cmd/Ctrl+K` ouvre une command palette (Phase 2 — backlog).
5. **Closure IA** : chaque besoin du PRD a une surface. Inversement, chaque surface est justifiée par ≥1 user story (US-x.x du doc epics).

### Mapping besoin → surface → US

| Besoin (PRD)                          | Surface                          | User Story |
|---------------------------------------|----------------------------------|------------|
| Obtenir un NIF                        | `/nif/new` → `/nif/:id`          | US-2.1 à US-2.4 |
| Générer un contrat conforme           | `/contracts` → `/contracts/wizard/:type` → `/contracts/:id` | US-3.1 à US-3.4 |
| Suivre obligations de conformité      | `/compliance` → `/compliance/:obligationId` | US-4.1 à US-4.3 |
| Poser une question juridique          | `/assistant`                     | US-5.1, US-5.3 |
| Stocker / consulter ses documents     | `/vault`                         | US-6.1, US-6.2 |
| Gérer son compte / sécurité           | `/profile`                       | US-1.3 |
| Authentification                      | Modal Privy (overlay sur landing/app) | US-1.1, US-1.2 |
| Cabinet : monitoring escalades        | `/admin`                         | (Module Cabinet, story TBD) |

## Voice and Tone

**Identité éditoriale (la voix qui ne change pas) :** *Clair, précis, rassurant, sans jargon non-expliqué.* EasyLaw parle comme **un greffier qui se met à votre niveau** — précis et compétent, mais qui prend le temps de définir les termes techniques avant de les utiliser. Jamais condescendant, jamais familier.

**Modulation tonale (le ton qui s'ajuste) :**

| Contexte                          | Ton                           | Exemple FR                                                                                                  |
|-----------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------|
| Landing / acquisition             | Pédagogue, mesuré             | « Obtenez votre NIF portugais — **habituellement en 48h** (selon délais Finanças), depuis n'importe quel pays. » *(éviter promesses absolues sur des délais hors-contrôle EasyLaw)* |
| Onboarding / instruction          | Pédagogue, progression douce  | « Étape 1 sur 4 : on commence par vos informations personnelles. Comptez 2 minutes. »                       |
| Erreur utilisateur (validation)   | Constructif, jamais accusatoire | « Cette adresse e-mail ne semble pas valide. Vérifiez le format (exemple : nom@domaine.com). »            |
| Erreur système                    | Honnête, action proposée      | « Notre service rencontre une difficulté temporaire. Réessayez dans quelques instants ou contactez-nous. » |
| Confirmation positive             | Sobre, jamais exubérant       | « Dossier transmis au cabinet. Vous recevrez une mise à jour sous 24h. »                                    |
| Échéance proche (compliance)      | Pressant mais factuel         | « Votre certificat d'immatriculation expire dans 30 jours. Renouvellement requis avant le 09/07/2026. »    |
| Réponse IA (Luso-Legal)           | Mesuré, citations sourcées    | « Selon l'article 1083 du Code Civil portugais, le bail peut être résilié pour… [voir source DRE]. »      |
| Disclaimer IA (toujours visible)  | Légalement clair              | « Cette réponse est informative et ne constitue pas un conseil juridique personnalisé. »                    |

**Règles de microcopy :**

- **Pronoms :** FR = « vous » (jamais « tu »). PT = « você » + 3e personne. Formel mais accessible.
- **Verbes :** infinitifs sur les boutons d'action (« Commencer mon dossier », « Télécharger le contrat »). Pas d'impératif sec (« Commence »).
- **Nombres :** chiffres en lettres si <10 en prose. Toujours en chiffres dans les inputs, prix, dates, références.
- **Prix :** affichés TTC, devise EUR explicite, hors-surprises (« 99 € — paiement unique, tout inclus »).
- **Dates :** format long en prose (« le 9 juin 2026 »), format ISO court dans les tableaux (« 2026-06-09 »).
- **Jargon juridique :** premier usage = définition courte en tooltip (`<abbr>` ou `<Tooltip>`). Glossaire intégré accessible depuis footer.
- **Émojis :** interdits dans toute UI persistante. Seules les illustrations vectorielles `lucide-react` portent du sens iconique.
- **Pas de point d'exclamation** sauf confirmation positive (« Dossier transmis ! »).
- **Pas de mention "AI"** au visiteur final — l'assistant s'appelle **Luso-Legal**, pas "ChatGPT" ou "IA".

## Component Patterns

> Specs visuelles dans [DESIGN.md](./DESIGN.md) `{components}`. Les patterns ci-dessous sont **comportementaux**.

### Wizard / Stepper

- Multi-étapes (3 à 5 max). Barre de progression visible en haut **persistante**.
- Étapes nommées (« 1. Vos informations ») pas seulement numérotées.
- **Validation par étape** : on ne quitte pas l'étape tant qu'elle n'est pas valide (mais on peut sauvegarder un brouillon).
- **Retour arrière toujours possible** sans perte de données — sauf après paiement.
- Brouillon auto-sauvegardé toutes les 10s (`PATCH /api/drafts/:id`) ; mention discrète « Brouillon sauvegardé · il y a 3s ».
- À la dernière étape : **récap éditable** avant submit final. Pas de "click and pray".

### FileDrop (upload document)

- Drag-drop + fallback bouton « Choisir un fichier ».
- Formats acceptés explicites : « PDF, JPG, PNG · max 10 Mo » avant clic.
- **Preview thumbnail** après upload (PDF = première page rendue, image = miniature).
- **Indicateur qualité** : si la résolution OCR est insuffisante (texte flou détecté), badge `amber` « Qualité d'image faible — relire à l'œil » sans bloquer.
- **Multi-fichiers** acceptés pour les sections "documents" (passeport + justificatif domicile).
- Suppression = double confirmation (l'upload est lent à refaire).

### ChatBubble (Luso-Legal)

- Bulles utilisateur : alignées droite, fond `surface.page`, texte `text.primary`.
- Bulles IA : alignées gauche, fond `surface.card`, border `surface.mist`, texte `text.primary`.
- **Sources citées** rendues en `mono` font, cliquables, ouvrent un side-panel avec extrait + lien externe DRE/DGSI.
- **Disclaimer footer permanent** sous la zone de saisie (jamais retiré, jamais minimisé).
- **Streaming token-by-token** avec animation de curseur blink pendant génération.
- **Bouton « Parler à un avocat »** toujours visible (Epic 5, US-5.3) à droite du header de la conversation.

### PdfPreviewPane (génération contrat)

- Layout split : 60% form (gauche), 40% PDF preview (droite, sticky scroll).
- **Highlight** sur les fields que le formulaire vient de remplir (fade `brand.secondary` 1.5s puis retour normal).
- Mobile : preview rendu en bottom-sheet (tap « Aperçu » pour ouvrir).
- Téléchargement uniquement après paiement validé.

### Timeline (suivi dossier NIF)

- Étapes : Soumission → Vérification documents → Procuration → Dépôt Finanças → NIF reçu.
- Mobile : timeline verticale, étape actuelle highlight, étapes passées avec checkmark.
- Desktop : timeline horizontale en haut + détail étape active dessous.
- **Updates en temps réel** via Server-Sent Events (ou polling 30s fallback) — pas besoin de refresh manuel.
- **Bouton « Contacter le cabinet »** apparaît si étape bloquée >24h.

### TrustBar

- Bandeau horizontal de 4 icônes/labels : 🔒 TLS · 🛡 RGPD · ⚖ Ordem dos Advogados · ✓ AMA Certified.
- (Pictos rendus par lucide-react, pas d'emoji.)
- Placement : footer des écrans publics, header des écrans transactionnels (paiement, upload sensible).
- Mobile : scroll horizontal silencieux. Desktop : flex-row centré.

### LangSwitcher

- Header (top-right), bouton compact : « FR ▾ » (code ISO + chevron).
- Menu : « 🇫🇷 Français · 🇵🇹 Português · 🇬🇧 English (Phase 2 — coming soon, grisé) ».
- Persistance cookie 1 an. Synchronisation côté serveur sur user connecté.

## State Patterns

### Loading

- **Skeleton screens** sur les listes (dashboards, dossiers, threads chat). Pas de spinner centré.
- **Optimistic UI** sur les actions rapides (toggle préférences, archive thread, supprimer brouillon).
- **Progress bar déterministe** sur les uploads de fichiers et la génération de PDF (>5s).
- **Spinner inline** sur les boutons en cours d'action (`<Button loading />` déjà présent).
- **Timeout** : 30s sur appels backend, après quoi message « Le service prend plus de temps que prévu » + bouton Retry.

### Empty states

| Surface             | État vide                                                                                                          |
|---------------------|--------------------------------------------------------------------------------------------------------------------|
| `/nif/list`         | Illustration discrète + CTA « Démarrer mon premier dossier NIF »                                                   |
| `/vault`            | « Vos documents officiels apparaîtront ici une fois vos dossiers traités. » + CTA secondaire « En savoir plus »   |
| `/compliance`       | « Aucune obligation surveillée. Ajoutez votre entreprise pour activer le tableau de bord conformité. »            |
| `/assistant` (threads) | « Posez votre première question à Luso-Legal — l'assistant IA spécialisé droit portugais. »                     |
| Search no-result    | « Aucun résultat. Vérifiez l'orthographe ou élargissez votre recherche. »                                          |

### Errors

| Type                | Comportement                                                                                                |
|---------------------|-------------------------------------------------------------------------------------------------------------|
| **Validation** (inline) | Message rouge `status.red.fg` sous le champ, icône `alert-circle`, jamais en modal.                       |
| **Paiement échoué** | Modal d'erreur + reroute automatique vers retry après 5s. Email confirmation envoyé.                       |
| **Upload corrompu** | Toast `status.red` + le fichier reste affiché avec badge « Erreur — réessayer ». Pas de suppression auto.  |
| **Réseau perdu**    | Banner sticky en haut `status.amber` : « Connexion perdue — vos modifications seront sauvegardées dès retour ». |
| **Session expirée** | Modal full-screen non-fermable : « Votre session a expiré » + bouton reconnexion (Privy).                  |
| **Erreur serveur 5xx** | Page d'erreur dédiée avec ID de support + bouton « Contacter le support ». Pas de stacktrace exposée.   |
| **IA refuse** (out-of-scope) | Bulle Luso-Legal : « Cette question dépasse mon périmètre — je vous recommande de contacter un avocat. » + CTA escalade. |

### Confirmations & Success

- **Toast** non-bloquant en bottom-right pour actions secondaires (préférence sauvée, document archivé).
- **Modal de confirmation** pour actions irréversibles (supprimer un dossier, supprimer son compte). Double-saisie du nom requise pour suppression compte.
- **Page de succès dédiée** pour les jalons majeurs (paiement validé, NIF reçu) — mémorable, partageable optionnellement (email "votre NIF est arrivé").

### Permissions / Auth states

- **Non-authentifié sur route privée** : reroute `/login` (modal Privy overlay) avec `?redirect=` pour reprise après login.
- **Authentifié mais mauvais rôle** : page 403 « Cet espace est réservé aux avocats du cabinet. »
- **Email non-vérifié** (Privy email OTP) : banner sticky « Vérifiez votre email pour activer toutes les fonctions ».

### Streaming IA (Luso-Legal)

- Token-by-token, vitesse perçue ~40 tok/s. Curseur clignotant sous le dernier token.
- **Interrupt button** apparaît dès que le stream démarre (clic = stop côté serveur + bulle finalisée).
- **Sources** ajoutées en bas de la bulle à la fin du stream — chacune avec extrait au hover.

## Interaction Primitives

| Primitive            | Comportement                                                                                              |
|----------------------|-----------------------------------------------------------------------------------------------------------|
| Click / Tap          | Feedback visuel ≤100ms (state hover/active). Aucune action irréversible sans confirmation.                |
| Long-press (mobile)  | Réservé aux actions secondaires sur cards (menu contextuel : archive, partager, supprimer).                |
| Swipe (mobile)       | Sur liste de dossiers : swipe-left = archive, swipe-right = marquer urgent. Confirmation toast.            |
| Hover (desktop)      | Tooltip après 400ms d'inactivité sur éléments interactifs ; preview card sur liens internes.              |
| Drag                 | Réservé à FileDrop (upload). Pas de drag-to-reorder MVP.                                                  |
| Keyboard nav         | Toute action accessible au clavier. Focus visible (anneau `shadows.focus`). Tab order logique.            |
| Cmd/Ctrl+K           | Phase 2 — Command palette.                                                                                |
| Cmd/Ctrl+S           | Réservé navigateur — ne pas hijacker. Brouillons auto-sauvegardés.                                        |
| Escape               | Ferme modal/sheet/menu. Annule en draft (avec confirmation si modifications non sauvegardées).            |
| Enter dans form      | Soumet le form courant (si dernier champ) ou avance à l'étape suivante (wizard).                          |

## Accessibility Floor

**Niveau plancher : WCAG 2.2 niveau AA** pour le grand public. AAA visé sur les chemins critiques (paiement, signature).

### Exigences non-négociables

- **Contraste texte** : ≥4.5:1 sur ≤18px / ≥3:1 sur ≥18px ou bold (vérifié sur les tokens — voir [DESIGN.md](./DESIGN.md)).
- **Contraste non-textuel** (UI components) : ≥3:1 (WCAG 1.4.11). Borders interactives utilisent `{colors.surface.mistStrong}`, pas `{colors.surface.mist}`.
- **Focus visible** : anneau `{shadows.focus}` (alpha 0.45) sur tout élément interactif. Jamais `outline: none` sans alternative. Sur fond gold : utiliser `{shadows.focusOnGold}`.
- **Labels ARIA** : tout input a un `<label>` associé ou `aria-label`. Inputs custom (FileDrop, Wizard) implémentent les rôles ARIA appropriés.
- **Form semantics** : champs obligatoires marqués `aria-required="true"` ET avec libellé textuel (« obligatoire » visuellement caché si seul `*` visible) ; helper text associé via `aria-describedby` ; erreurs marquées `aria-invalid="true"` avec message lié par `aria-describedby`.
- **Wizard stepper** : `role="progressbar"` + `aria-valuenow` + `aria-valuemax` + `aria-valuetext="Étape 2 sur 4 : Documents"`.
- **Streaming chat** : zone messages `aria-live="polite"` + `aria-busy="true"` pendant stream ; curseur clignotant `aria-hidden="true"`.
- **Gated CTAs** : utiliser `aria-disabled="true"` (focusable, annonce raison) plutôt que `disabled` HTML (non focusable, raison muette).
- **Keyboard nav** : Tab, Shift+Tab, Enter, Espace, Escape, flèches dans les listes. Aucun piège clavier dans modals/menus.
- **Skip-link** : « Aller au contenu principal » en haut de chaque page (visible au focus).
- **Hiérarchie de titres** : un seul `<h1>` par page, hiérarchie h1>h2>h3 sans saut.
- **Liens distinguables** sans couleur seule (sous-ligne au hover ou icône externe).
- **Texte alternatif** sur toutes les images informatives. Decoratives = `alt=""`.
- **Lecteur d'écran** : nav, main, aside, footer landmarks. Pas de div soup.
- **Citations multilingues** (WCAG 3.1.2 AA) : tout passage en portugais dans une page française (et inversement) doit être enveloppé `<span lang="pt">…</span>`. S'applique aux références juridiques (`art. 1098.º Código Civil`), aux noms d'institutions (`Ordem dos Advogados`, `Finanças`, `Portal das Finanças`), et au texte cité par Luso-Legal.
- **Scroll target padding** (WCAG 2.4.11) : `scroll-padding-top` égal à la hauteur du header sticky pour qu'un lien d'ancre ne masque pas la cible derrière le header.
- **Mouvement réduit** (`prefers-reduced-motion: reduce`) : désactiver les animations suivantes :
  - gold-fade highlight sur PDF preview (passage instantané)
  - curseur clignotant Luso-Legal (curseur statique)
  - hover transitions sur cards features (state final immédiat)
  - rotation 3° de la card flottante du hero landing
  - skeleton screens pulsation (afficher état statique)

### À tester systématiquement

- Lecteur d'écran VoiceOver (mobile iOS) + NVDA (desktop Windows) sur les parcours Lucas et Miguel.
- Zoom 200% sans perte de fonctionnalité.
- Daltonisme (deutéranopie / protanopie) : le système tri-couleur compliance ne doit JAMAIS reposer uniquement sur la couleur — toujours doublé d'icône + label.

## Inspiration & Anti-patterns

### Inspirations

- **Stripe Checkout** — clarté radicale du tunnel paiement, transparence des frais.
- **Linear** — sobriété UI, command palette, vitesse perçue.
- **Notion** — slash-commands, sidebar shell, sentiment de "doc vivant".
- **JuristGPT / Doctrine.fr** — citation de sources, autorité juridique.
- **Apple Health** — visualisation tri-couleur lisible mobile.

### Anti-patterns à éviter

- ❌ **LegalZoom** : trop "marketing US", up-sells agressifs au checkout — *EasyLaw doit afficher tous les coûts dès le panier*.
- ❌ **Néobanques fluo** : saturation chromatique, animations excessives — *EasyLaw reste sobre, prestige*.
- ❌ **Agences visa lambda** : opacité tarifaire, "appelez-nous pour devis" — *EasyLaw affiche prix avant tunnel*.
- ❌ **ChatGPT générique** : pas de citations, pas de disclaimer — *Luso-Legal cite et avertit systématiquement*.
- ❌ **Dashboards SaaS surchargés** : 50 widgets, KPIs vides — *Dashboard EasyLaw = 1 message clé par rôle*.

## Responsive & Platform

### Breakpoints

```
sm:  640px   tablet portrait, large mobile landscape
md:  768px   tablet landscape
lg:  1024px  laptop / desktop entry
xl:  1280px  desktop standard
2xl: 1536px  desktop large (rare)
```

### Adaptations par surface

| Surface              | Mobile (≤640px)                                  | Desktop (≥1024px)                              |
|----------------------|--------------------------------------------------|------------------------------------------------|
| Landing              | Hero 1 col, sections empilées, sticky CTA bottom | Hero 2 col, sections alternées, header sticky  |
| Shell authentifié    | Bottom-nav 5 items, sidebar masquée              | Sidebar gauche fixe, top-bar light             |
| Wizard NIF / contrat | Stepper en haut sticky, 1 question par écran     | Stepper horizontal, formulaire + helper side   |
| Compliance dashboard | Cards empilées, filtres en sheet                 | Table dense, filtres barre latérale             |
| PDF preview          | Bottom-sheet à la demande                        | Split 60/40 gauche/droite                       |
| Chat Luso-Legal      | Plein écran, input sticky bottom                  | Layout 2-pane : threads gauche, conversation droite |

### Platform considerations

- **iOS Safari** : prévoir bottom-safe-area sur les éléments fixed bottom (CTA, bottom-nav).
- **PWA-ready** (Phase 2) : manifest + service worker pour expérience "app-like" sans App Store.
- **Mode print** : feuille de style print pour le récap contrat et le rapport compliance (clients PME exportent souvent).

## Key Flows

### Flow 1 — Lucas obtient son NIF (climax : confirmation 48h)

> **Lucas, 34 ans**, français installé à Lisbonne depuis 3 semaines. Il est 22h, il a besoin de son NIF pour signer son bail demain matin. Il a déjà perdu une journée à chercher comment faire sur des forums.

1. **Découverte** — Lucas tape "obtenir NIF Portugal" sur Google. Arrive sur `/` (FR détecté automatiquement). Hero clair : « Obtenez votre NIF portugais en 48h. 99 € tout compris. ». TrustBar visible. CTA principal `gold` : « Commencer mon dossier ».
2. **Bascule app** — Click CTA → modal Privy s'ouvre → Lucas choisit Email OTP. Code reçu, validé en 30s. Redirect `/nif/new`.
3. **Wizard étape 1/4 — Informations personnelles** — Nom, prénom, date naissance, nationalité. Tooltip explique pourquoi chaque champ. Lucas remplit en 90s. Validation inline.
4. **Wizard étape 2/4 — Documents** — Upload passeport (drop le PDF du téléphone), justificatif de domicile français. Preview rendu. Indicateur qualité = vert.
5. **Wizard étape 3/4 — Procuration** — Le système génère une procuration pré-remplie. Lucas la prévisualise (PdfPreviewPane). Signature à l'écran (canvas). Lucas hésite : tooltip « Pourquoi une procuration ? » explique la délégation au cabinet partenaire.
6. **Wizard étape 4/4 — Récap & paiement** — Récap éditable. Total : 99 € TTC, transparent (frais administratifs + cabinet inclus). Choix paiement : Stripe (CB) ou MB Way. Lucas paie par CB.
7. **Climax — Confirmation transmise** — Page dédiée « Votre dossier est entre les mains du cabinet Oliveira & Carneiro. Vous recevrez votre NIF par e-mail sous 48h. » TrustBar Ordem dos Advogados visible. Timeline « Étape 1 sur 5 : Vérification documents » avec ETA. Email + SMS de confirmation envoyés. Bouton « Suivre mon dossier » → `/nif/:id`.
8. **Suivi** — Lucas revient le lendemain. Push notif « Vos documents ont été vérifiés. Dépôt Finanças en cours. » Timeline avance. Lucas est rassuré.
9. **Dénouement** — 36h plus tard, email « Votre NIF est arrivé : `123456789` ». Le NIF s'affiche en `mono` font dans le coffre `/vault`, prêt à être copié pour le bail.

**Surfaces touchées :** `/`, modal Privy, `/nif/new` (wizard 4 étapes), `/nif/:id` (timeline), `/vault`, emails transactionnels.

### Flow 2 — Miguel évite l'amende (climax : alerte orange transformée en obligation traitée)

> **Miguel, 52 ans**, gérant d'une PME import-export à Porto. Il a déjà été surpris deux fois par une amende administrative pour avoir manqué une déclaration. Il consulte EasyLaw depuis 2 mois.

1. **Notification SMS** — 07:15, alerte SMS : « Votre déclaration TVA arrive à échéance dans 30 jours (09/07). Tapez ici pour voir le détail. »
2. **Compliance Dashboard mobile** — Miguel ouvre l'app, atterrit sur `/compliance`. Vue d'ensemble : barre tri-couleur. 1 obligation `red` (TVA), 3 `amber`, 7 `green`. Card prioritaire en haut.
3. **Détail obligation** — Tap sur la card rouge → `/compliance/:obligationId`. Explication claire : quoi déclarer, où (lien direct Portal das Finanças), avant quand, conséquence si retard. Documents requis listés (CTA « Préparer mes documents → /vault »).
4. **Action** — Miguel a déjà ses documents dans `/vault`. Bouton « Marquer comme préparé » → l'obligation passe `amber` → `green-pending`. Sera reconfirmée par check automatique post-deadline.
5. **Climax — Statut sain** — Retour `/compliance`. La barre globale passe de 1 rouge à 0 rouge. Toast non-bloquant : « Une obligation traitée. Votre conformité progresse. » Pas d'exubérance, juste de la confirmation factuelle.
6. **Préventif** — Miguel explore les `amber` à venir. Pour 2 d'entre elles, il active « Rappel 60 jours avant » dans `/compliance/settings`. Le système s'ajuste.

**Surfaces touchées :** SMS, `/compliance`, `/compliance/:obligationId`, `/vault`, `/compliance/settings`.

### Flow 3 — Ana (cabinet, Module B Phase 2) — climax éclair sur jurisprudence

> **Ana, 41 ans**, avocate associée à Porto. Elle prépare une plaidoirie en M&A pour le lendemain. Il est 22h, elle a besoin d'une jurisprudence précise sur l'art. 224 CSC.

*(Hors-périmètre MVP — décrit pour cohérence IA Phase 2.)*

1. Connexion `app.easylaw` avec compte avocat (MFA via Privy).
2. `/cabinet/recherche` (Module B) — input naturel : « Décisions Cour Suprême sur cession parts sociales art. 224 CSC depuis 2024 ».
3. Réponse IA streamée : 3 jurisprudences pertinentes, citations DGSI cliquables, synthèse 200 mots.
4. **🌟 Climax** — Ana ouvre la 2ème décision en side-panel, copie l'extrait clé en 1 clic dans son brouillon Word via add-in EasyLaw. 2 minutes au total au lieu de 45 minutes sur DGSI brut.
5. Retour le matin : sauvegarde du brouillon dans le GED cabinet, partagé avec le junior pour relecture.

**Surfaces touchées :** `/cabinet/*` (Module B Phase 2), Word Add-in, GED.

### Flow 4 — Création contrat de bail (climax : preview qui change en temps réel + paiement)

> **Lucas (de retour)**, doit signer un bail. Son propriétaire lui en a envoyé un, mais Lucas veut le sien, sûr d'être conforme NRAU.

1. **Catalogue** — `/contracts` : 5 templates affichés en cards. « Bail résidentiel NRAU » au top. Description claire, prix : 49 €, exemple en preview muet (1ère page floutée pour teaser).
2. **Wizard Q&A** — Click → `/contracts/wizard/bail-nrau`. 7 questions séquencées : adresse, durée, loyer, caution, modalités. Layout split 60/40 : gauche question, droite PDF live.
3. **Climax — Live preview** — À chaque réponse, le champ correspondant du PDF se remplit et **highlight 1.5s en gold fade**. Lucas voit son contrat se construire sous ses yeux. Sensation de maîtrise.
4. **Récap & checkout** — Récap éditable. CTA `gold` : « Générer mon contrat — 49 € ». Paiement Stripe. Confirmation.
5. **Téléchargement & archive** — Contrat téléchargeable. Stocké automatiquement dans `/vault`. Option « Signer en ligne » (Phase 2 — CMD eIDAS).

**Surfaces touchées :** `/contracts`, `/contracts/wizard/:type`, `/contracts/:id`, `/vault`.

### Flow 5 — Luso-Legal escalade vers avocat

> **Lucas** s'interroge sur une clause inhabituelle de son bail (résiliation anticipée pour mutation pro). Il pose la question à Luso-Legal.

1. **Question** — `/assistant`. Input : « Mon bail prévoit X — est-ce conforme NRAU ? »
2. **Réponse IA** — Luso-Legal stream : 4 paragraphes, citation art. 1098 CC, lien DRE. Disclaimer en footer permanent.
3. **Doute persistant** — Lucas reste incertain car sa situation est spécifique (mutation à l'étranger). Click « Parler à un avocat ».
4. **Climax — Handoff** — Sheet d'escalade : « Pour un avis personnalisé, nos avocats du cabinet Oliveira & Carneiro peuvent vous répondre sous 24h ouvrées (consultation 49 €). » Récap automatique de la conversation préparé. Lucas confirme. Paiement. Confirmation reçue.
5. **Réponse avocat** — 6h plus tard, message dans `/assistant/:threadId` (badge « Réponse avocat — vérifiée »). Avocat répond en plain text + cite la jurisprudence pertinente. Plus de disclaimer IA — réponse engageante du cabinet.

**Surfaces touchées :** `/assistant`, sheet d'escalade, paiement, emails.

---

## Sections inventées (concerns produit-spécifiques)

### Disclaimers & Mentions obligatoires (regulated content)

EasyLaw opère sur un secteur réglementé — voici les mentions obligatoires par contexte :

| Contexte                                  | Mention obligatoire                                                                                  |
|-------------------------------------------|------------------------------------------------------------------------------------------------------|
| Toute réponse Luso-Legal                  | « Information générale — ne constitue pas un conseil juridique personnalisé. »                       |
| Footer de toute page publique             | « EasyLaw est une plateforme technologique. Les actes juridiques sont supervisés par Oliveira & Carneiro Advogados (Ordem dos Advogados, RG nº [TBD]). » |
| Page checkout (paiement contrat)          | « Le modèle généré est juridiquement conforme à la date de génération. Aucune garantie de pertinence pour des situations atypiques sans avis d'avocat. **Droit de rétractation** : en validant ce paiement, vous consentez à l'exécution immédiate et renoncez au délai de 14 jours (art. 16(m) Dir. 2011/83/UE). » |
| Bandeau permanent wizard contrat          | « Modèle juridique généré automatiquement. Conformité validée à la date de génération. Situation atypique ? [Avis d'avocat 49 €]. » |
| Étape KYC du flow NIF                     | « Cette vérification protège votre dossier et respecte la législation portugaise anti-blanchiment (Lei 83/2017). Vos données KYC sont conservées 7 ans. » |
| Banner cookies (première visite)          | « Nous utilisons des cookies nécessaires au fonctionnement du site. Vous pouvez accepter ou refuser les cookies analytiques et marketing à tout moment. [Gérer mes choix] [Accepter] [Refuser] » |
| Page upload de documents sensibles        | « Vos documents sont chiffrés (AES-256 au repos, TLS 1.3 en transit). RGPD : voir nos engagements. » |
| Page export RGPD                          | « Conformément au RGPD, vous pouvez télécharger l'intégralité de vos données ou demander leur suppression. » |
| Email transactionnel (NIF reçu, contrat)  | « Cet email contient des données personnelles. Conservez-le en lieu sûr. »                           |

### Trust signals — orchestration

Présence des signaux de confiance selon contexte :

- **Landing publique** : TrustBar en footer + médaille Ordem dos Advogados en hero.
- **Wizard NIF / contrat** : badge cadenas TLS à côté de chaque CTA "Continuer".
- **Checkout paiement** : TrustBar header + logos Stripe/MB Way (rassure sur le mode de paiement) + récap "Pas de prélèvement caché".
- **Confirmation post-paiement** : badge "Ordem dos Advogados" tamponné en filigrane sur la page de réception.
- **Coffre `/vault`** : indicateur "chiffré" sur chaque document + lien vers politique de sécurité.

### Multi-rôles — adaptation du shell

| Rôle             | Shell visible                                                                            | Sections supplémentaires |
|------------------|------------------------------------------------------------------------------------------|--------------------------|
| Client (default) | Dashboard, NIF, Contracts, Compliance, Assistant, Vault, Profile                         | —                        |
| Avocat junior    | + Admin (escalades à traiter assignées)                                                   | Cabinet inbox (Phase 2)   |
| Avocat associé   | + Admin (toutes escalades cabinet) + Module B (Phase 2)                                  | Module B                  |
| Admin cabinet    | + Audit log + RBAC settings + facturation cabinet                                        | Settings cabinet          |

Le **shell change visuellement** légèrement selon rôle : avocats voient un liseré `gold` discret sur la sidebar, marquant l'élévation de privilège. Aucune fonction client ne disparaît — un avocat reste un humain qui peut consulter `/assistant`.

### Cookie Consent & ePrivacy

Conformité **ePrivacy Directive + RGPD Art. 7** : recueil de consentement explicite pour cookies non-essentiels obligatoire avant toute collecte.

**Banner CMP** (Consent Management Platform) sur première visite + lien permanent dans le footer :

| Catégorie       | Default        | Description                                                                              |
|-----------------|----------------|------------------------------------------------------------------------------------------|
| Nécessaires     | Activé (forcé) | Session, auth Privy, panier, cookie de langue. Aucun consentement requis.               |
| Analytique      | Désactivé      | Analytics produit (PostHog, Mixpanel, etc.) — anonymisation IP, agrégation seule.       |
| Marketing       | Désactivé      | Pixels de remarketing (Meta, Google Ads). Désactivé par défaut, opt-in explicite.       |
| Personnalisation| Désactivé      | A/B testing comportemental, personnalisation contenu. Opt-in.                            |

**Règles UX :**
- Choix « Tout accepter » et « Tout refuser » à équivalence visuelle (pas de dark pattern asymétrique).
- Pas de bouton « Continuer » sans choix actif.
- Décision révisable depuis footer (« Gérer mes cookies »).
- Persistance 12 mois max ; re-consent au-delà.
- Pas de wall (« Acceptez ou partez ») — accès gratuit possible avec refus total.

### AML / KYC — Conformité anti-blanchiment

EasyLaw, en tant que vecteur de services juridiques fournis par un cabinet portugais inscrit à l'Ordem dos Advogados, est soumis au **devoir de vigilance** de la **Lei 83/2017** (LBC/FT — luta contra branqueamento de capitais e financiamento do terrorismo).

**Étapes KYC obligatoires (intégrées au flow Lucas) :**

1. **Étape 2.5 (entre documents et procuration)** : vérification identité automatisée (eIDV) — comparaison passeport ↔ selfie liveness check. Provider : à valider en arch (Onfido, Veriff, Privy KYC).
2. **PEP screening** (Personne Politiquement Exposée) : check automatique contre listes OFAC, EU Sanctions, UN. Si match → escalade humaine cabinet, blocage du flow temporaire.
3. **Origine des fonds** (pour services > 1000 €, ex. création Lda) : question complémentaire sur source revenus.
4. **Conservation 7 ans** des données KYC (Art. 26 Lei 83/2017).
5. **Signalement DCIAP** si soupçon — workflow interne cabinet, pas visible utilisateur.

**UX :** étape KYC présentée comme **« Vérification d'identité »** (vocabulaire neutre, pas anxiogène), avec disclaimer : *« Cette vérification protège votre dossier et respecte la législation portugaise anti-blanchiment. Vos données sont conservées 7 ans (Lei 83/2017). »*

### Contract Liability — Disclaimer renforcé générateur de contrats

Le générateur de contrats expose EasyLaw à un **risque de responsabilité civile** si le modèle généré s'avère inadapté à la situation utilisateur. Mitigation par UX :

1. **Bandeau permanent en haut du wizard** : *« Modèle juridique généré automatiquement à partir de vos réponses. Conformité légale validée à la date de génération. Pour situations atypiques, [demandez un avis d'avocat](#) (49 €). »*
2. **Checkbox obligatoire avant paiement** : *« J'ai vérifié que les informations saisies correspondent à ma situation. Je comprends que ce modèle ne remplace pas un conseil personnalisé pour cas complexes. »*
3. **Email post-téléchargement** : récapitulatif des données utilisées + offre de relecture cabinet 49 €.
4. **Droit de rétractation 14 jours** (Dir. 2011/83/UE Art. 9) : *exception services digitaux téléchargés immédiatement* — checkbox explicite avant paiement : *« Je consens à l'exécution immédiate du service et renonce à mon droit de rétractation de 14 jours, conformément à l'art. 16(m) de la Directive 2011/83/UE. »*

### Notifications & Canaux

Matrice canal × événement :

| Événement                              | In-app | Email | SMS    | Push (Phase 2) |
|----------------------------------------|--------|-------|--------|----------------|
| Dossier NIF — étape franchie           | ✓      | ✓     | —      | ✓              |
| Dossier NIF — bloqué (>24h sans avance)| ✓      | ✓     | ✓      | ✓              |
| NIF reçu                               | ✓      | ✓     | ✓      | ✓              |
| Contrat généré                         | ✓      | ✓     | —      | ✓              |
| Paiement échoué                        | ✓      | ✓     | —      | ✓              |
| Compliance — alerte ORANGE (90j)       | ✓      | ✓     | —      | ✓              |
| Compliance — alerte ROUGE (30j ou +)   | ✓      | ✓     | ✓      | ✓              |
| Escalade Luso-Legal → avocat (réponse) | ✓      | ✓     | —      | ✓              |
| Document partagé / nouvelle version    | ✓      | ✓     | —      | ✓              |
| Sécurité — nouvelle connexion          | ✓      | ✓     | —      | —              |

**Préférences** : utilisateur peut désactiver email/SMS dans `/profile` sauf notifications "Sécurité" et "ROUGE" (rétention forcée pour devoir d'alerte).

---

## Open Questions résiduelles

- **OQ-001 (i18n migration)** — déférer à Architecture review.
- **OQ-002 (réalité du frontend existant)** — passer l'app frontend en revue visuelle pendant la phase mocks pour décider refactor vs poursuite.
- **OQ-003 (Solana / web3)** — clarifier avant de spécifier le pattern "signer un contrat". Si web3-natif, prévoir un onboarding "wallet" minimaliste (Privy gère déjà).
- **OQ-004 (landing séparée ou intégrée)** — recommandation : **landing intégrée à l'app Next.js sur la racine publique**, app authentifiée sur `/app/*`. Évite la maintenance d'un deuxième codebase. À valider.
- **OQ-005 (exposition partenariat O&C)** — recommandation : **visible dès le landing** (rassurance) mais **pas dominant** (le produit reste EasyLaw, pas le cabinet).
- **OQ-006 (`/admin` surface)** — gating Phase 2 (Module B Cabinet) OU une story dédiée admin à créer en MVP. Recommandation : **gating Phase 2** — au MVP, escalades visibles par avocats du cabinet via interface email/Notion existante du cabinet ; pas de UI admin dédiée dans l'app.
- **OQ-007 (provider eIDV pour KYC)** — choisir entre Onfido, Veriff, ou Privy KYC selon coût et intégration avec stack Privy déjà en place.
- **OQ-008 (verifiability claim "500+ dossiers")** — soit on le retire, soit le cabinet O&C confirme et fournit la preuve juridique (rapports d'activité, attestation). À trancher avant launch publique.
