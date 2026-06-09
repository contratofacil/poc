---
title: "EasyLaw — DESIGN.md"
project: easylaw
status: final
created: 2026-06-09
updated: 2026-06-09
sources:
  - ../../brief/easylaw-brief-2026-05-26/brief.md
  - ../../prd/easylaw-prd-2026-05-26.md
  - ../../ux/easylaw-ux-2026-05-26.md
  - ../../../../apps/frontend/src/styles/tokens.ts
  - ../../../../apps/frontend/src/app/globals.css

colors:
  brand:
    primary:           "#1a3a5c"   # Judiciary Blue
    primaryHover:      "#12293f"
    primaryActive:     "#0d1f2e"
    secondary:         "#d4a017"   # Prestige Gold
    secondaryHover:    "#b8891a"
  surface:
    page:              "#f8f6f1"   # Warm White (parchemin)
    card:              "#ffffff"
    mist:              "#e8e4dd"   # Subtle dividers (low-contrast — non-essential separations only)
    mistStrong:        "#92897a"   # Component boundaries — 3.20:1 vs surface.page, passes 1.4.11
    sidebar:           "#1a3a5c"
  text:
    primary:           "#1a202c"
    secondary:         "#4a5568"
    muted:             "#5e6b7e"   # AA-compliant (4.55:1 on surface.page) — was #718096, failed at 3.72:1
    inverse:           "#f8f6f1"
  status:
    # AA-compliant fg colors on tinted backgrounds (small text 12-14px)
    green:   { fg: "#15803d", bg: "#dcfce7", border: "#86efac" }   # 4.55:1
    amber:   { fg: "#b45309", bg: "#fef3c7", border: "#fcd34d" }   # 4.66:1
    red:     { fg: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" }   # 5.07:1
  danger:    "#dc2626"
  dangerHover: "#b91c1c"

typography:
  fonts:
    serif:  "Playfair Display"   # Titres — autorité éditoriale
    sans:   "Inter"              # Corps — clarté UI
    mono:   "JetBrains Mono"     # Refs juridiques, n° dossier, IDs
  scale:
    display:    { size: "48px", lineHeight: "1.1",  weight: 700, font: "serif" }
    h1:         { size: "36px", lineHeight: "1.15", weight: 700, font: "serif" }
    h2:         { size: "28px", lineHeight: "1.2",  weight: 600, font: "serif" }
    h3:         { size: "22px", lineHeight: "1.3",  weight: 600, font: "serif" }
    body-lg:    { size: "18px", lineHeight: "1.6",  weight: 400, font: "sans"  }
    body:       { size: "16px", lineHeight: "1.55", weight: 400, font: "sans"  }
    body-sm:    { size: "14px", lineHeight: "1.5",  weight: 400, font: "sans"  }
    caption:    { size: "12px", lineHeight: "1.4",  weight: 500, font: "sans"  }
    mono-ref:   { size: "13px", lineHeight: "1.4",  weight: 500, font: "mono"  }
  letterSpacing:
    display: "-0.02em"
    h1: "-0.015em"
    body: "0"
    caption: "0.02em"

rounded:
  sm:   "4px"     # Badges, tag, micro-pill
  md:   "8px"     # Inputs, boutons, chips
  lg:   "12px"    # Cards, panels
  xl:   "16px"    # Modals, large containers
  full: "9999px"  # Avatars, pills

spacing:
  unit: "4px"
  scale:
    0: 0
    1: "4px"
    2: "8px"
    3: "12px"
    4: "16px"
    5: "20px"
    6: "24px"
    8: "32px"
    10: "40px"
    12: "48px"
    16: "64px"
    20: "80px"
    24: "96px"
  container:
    sm:  "640px"
    md:  "768px"
    lg:  "1024px"
    xl:  "1280px"
    content: "720px"   # Width max pour texte juridique (lisibilité)
  layout:
    page-padding-mobile:  "16px"
    page-padding-desktop: "32px"
    section-gap:          "64px"

components:
  button:
    base: "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-{colors.brand.primary} focus-visible:ring-offset-2 disabled:opacity-50"
    variants:
      primary:  { bg: "{colors.brand.primary}",  fg: "{colors.text.inverse}", hover: "{colors.brand.primaryHover}" }
      gold:     { bg: "{colors.brand.secondary}", fg: "{colors.text.primary}", hover: "{colors.brand.secondaryHover}", weight: 600 }
      outline:  { bg: "transparent", fg: "{colors.text.secondary}", border: "{colors.surface.mist}", hover-bg: "{colors.surface.page}" }
      ghost:    { bg: "transparent", fg: "{colors.text.secondary}", hover-bg: "{colors.surface.page}" }
      danger:   { bg: "{colors.danger}", fg: "#ffffff", hover: "{colors.dangerHover}" }
    sizes:
      sm: { padding: "6px 12px", font: "body-sm" }
      md: { padding: "8px 16px", font: "body-sm" }
      lg: { padding: "12px 24px", font: "body" }
  card:
    bg:       "{colors.surface.card}"
    border:   "1px solid {colors.surface.mist}"
    radius:   "{rounded.lg}"
    shadow:   "card"
    padding:  "{spacing.6}"
  input:
    bg:       "{colors.surface.card}"
    border:   "1px solid {colors.surface.mist}"
    border-focus: "1px solid {colors.brand.primary}"
    radius:   "{rounded.md}"
    padding:  "10px 14px"
    font:     "body"
    placeholder: "{colors.text.muted}"
  badge:
    radius:   "{rounded.full}"
    padding:  "2px 10px"
    font:     "caption"
    weight:   600
  trustbar:
    bg:       "{colors.surface.card}"
    border:   "1px solid {colors.surface.mist}"
    icons:    ["lock-tls", "rgpd", "ordem-advogados", "ama"]
    layout:   "horizontal-scroll-mobile, flex-row-desktop"
  complianceBadge:
    green: { text: "{colors.status.green.fg}", bg: "{colors.status.green.bg}", border: "{colors.status.green.border}" }
    amber: { text: "{colors.status.amber.fg}", bg: "{colors.status.amber.bg}", border: "{colors.status.amber.border}" }
    red:   { text: "{colors.status.red.fg}",   bg: "{colors.status.red.bg}",   border: "{colors.status.red.border}" }

shadows:
  card:  "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)"
  modal: "0 10px 40px -8px rgb(26 58 92 / 0.18)"
  focus:       "0 0 0 3px rgb(26 58 92 / 0.45)"     # AA-visible focus ring (was 0.20, invisible on cream)
  focusOnGold: "0 0 0 3px rgb(26 58 92 / 0.65)"     # Reinforced ring on gold backgrounds

motion:
  duration:
    fast:    "100ms"
    base:    "150ms"
    slow:    "250ms"
    panel:   "350ms"
  easing:
    standard: "cubic-bezier(0.4, 0, 0.2, 1)"
    enter:    "cubic-bezier(0, 0, 0.2, 1)"
    exit:     "cubic-bezier(0.4, 0, 1, 1)"
---

# DESIGN.md — EasyLaw Visual Identity

> Spine canonique de l'identité visuelle. Gagne sur tout mock, wireframe ou import en conflit.

## Brand & Style

**EasyLaw** se positionne sur l'axe **"Prestige juridique accessible"** — la croisée du cabinet d'avocat classique (autorité, sérieux, tradition) et de la plateforme digitale moderne (clarté, vitesse, transparence). Le langage visuel doit toujours :

1. **Rassurer avant d'éblouir** — sobriété sur saturation. Le client juridique cherche la confiance, pas le wow.
2. **Évoquer la matière éditoriale** — typographie serif pour les titres, fond crème "parchemin", micro-détails dorés. La page doit avoir l'autorité d'un document officiel.
3. **Démocratiser sans infantiliser** — l'accessibilité du langage et l'inclusivité de l'UI ne s'achètent pas par des illustrations cartoon ou un ton décontracté. Sobre, clair, formel.
4. **Signaler la confiance avec parcimonie mais visibilité** — RGPD, Ordem dos Advogados, AMA : présents mais jamais clinquants.

**Inspirations conscientes :** Stripe (clarté technique), JuristGPT (autorité), Linear (sobriété UI), L.L.Bean catalog (éditorial chaleureux). **Anti-références :** LegalZoom (US, trop "marketing"), agences visa lambda (opacité), néobanques fluo (saturation chromatique).

**Tonalité chromatique :** majoritairement **bleu nuit + crème + or ponctuel**. L'or n'est jamais dominant — il accente un CTA premium, un signal de réussite, une médaille de confiance. Jamais d'or sur toute une zone.

## Colors

Voir frontmatter `{colors}`. Règles d'usage :

- `brand.primary` (#1a3a5c) = couleur d'autorité. Headers, sidebars, titres, CTA principaux, focus rings.
- `brand.secondary` (#d4a017) = couleur d'élévation. CTA premium (paiement, contrat signé), badges "vérifié", médailles. **Max 5% de la surface visible** sur un écran donné.
- `surface.page` (#f8f6f1) = fond global "parchemin". Effet éditorial chaleureux vs blanc clinique.
- `surface.card` (#ffffff) = blanc pur réservé aux blocs de contenu (cards, modals, inputs) pour le contraste.
- `surface.mist` (#e8e4dd) = séparateurs **non-essentiels** (dividers internes faiblement contrastés). À ne PAS utiliser pour la délimitation de composants interactifs (boutons outline, inputs, FileDrop, cards stand-alone).
- `surface.mistStrong` (#92897a) = **borders de composants interactifs**. 3.20:1 vs `surface.page` — conforme WCAG 1.4.11 Non-text Contrast.
- `text.primary` (#1a202c) = corps de texte. Ratio 16:1 sur `surface.page` — bien au-delà de WCAG AA.
- `text.muted` (#5e6b7e) = métadonnées, captions, placeholders. Ratio **4.55:1 sur `surface.page`** (AA conforme). À ne PAS utiliser pour information critique (préférer `text.secondary` dans ce cas).
- `status.{green,amber,red}` = système tri-couleur de compliance. **Sémantique partagée** : ces couleurs ne sont JAMAIS utilisées hors statut.

**Mode sombre :** non au MVP. Inscrit en backlog Phase 3 — variables CSS prévues via `:root` mais sans surcharge.

## Typography

**Triptyque** : Playfair Display (serif éditorial) · Inter (sans UI) · JetBrains Mono (références juridiques).

- **Playfair Display** — H1/H2/H3, hero copy, citations clés. Donne le poids éditorial.
- **Inter** — tout le reste (corps, labels, boutons, navigation). Optimal pour densité d'info et lisibilité écran.
- **JetBrains Mono** — exclusivement pour les références d'articles de loi (`art. 1123.º CC`), n° de dossier (`NIF-2026-001234`), IDs techniques. Donne un repère visuel "donnée citée" vs "prose".

**Échelle modulaire** définie en `typography.scale`. Règles :

- Titres serif **toujours** en `brand.primary` (#1a3a5c). Jamais noir, jamais coloré gold.
- Corps en `text.primary`. Marge max `spacing.content` (720px) pour la lisibilité.
- Numérique tabulaire (`font-variant-numeric: tabular-nums`) sur les tableaux de prix, dates, montants.

**Italique** réservé : citations de loi, noms d'entités étrangères, emphase rare. Pas d'italique décoratif.

## Layout & Spacing

Grille basée sur **4px unit**. Échelle dans `spacing.scale`.

- **Mobile (≤640px)** — padding latéral 16px, sections empilées, max 1 colonne contenu.
- **Tablet (640–1024px)** — padding 24px, dashboards 2 colonnes possible.
- **Desktop (≥1024px)** — padding 32px, layouts 3 colonnes max. Contenu textuel reste max 720px (lisibilité).

**Aire de respiration :** entre sections majeures = `spacing.section-gap` (64px). Entre blocs apparentés = 24–32px. Entre éléments d'une liste = 12px.

**Container width :**
- `container.content` (720px) — articles, formulaires longs, contenu textuel.
- `container.xl` (1280px) — dashboards, listes denses.
- Pleine largeur — hero landing, footer, bandeaux trust.

## Elevation & Depth

Le système d'élévation est **discret** — l'autorité visuelle vient de la typographie et de la couleur, pas du drop shadow.

- `shadows.card` — ombre minimale (deux couches très douces) pour décoller les cards du fond crème.
- `shadows.modal` — ombre plus marquée et teintée bleu (`rgb(26 58 92 / 0.18)`) pour les surfaces flottantes.
- `shadows.focus` — anneau bleu accessible (3px) pour navigation clavier. Toujours visible, jamais retiré au profit d'un `outline: none` non remplacé.

Pas de "neumorphism", pas de "glassmorphism". L'ombre porte une fonction (hiérarchie), pas un effet.

## Shapes

**Coins arrondis modérés** : 4–16px selon l'élément (`rounded.{sm,md,lg,xl}`). Jamais d'angles vifs (anguleux = froid juridique caricatural), jamais de full-round généralisé (sauf badges, pills, avatars).

- Boutons : `rounded.md` (8px) — `lg` pour CTA `lg`.
- Cards : `rounded.lg` (12px).
- Modals, sheets : `rounded.xl` (16px).
- Badges, pills, avatars : `rounded.full`.

**Diviseurs** : ligne 1px `surface.mist` (#e8e4dd). Pas de hairline foncée.

## Components

Voir frontmatter `{components}` pour les specs visuelles complètes. Sommaire :

| Composant            | Statut         | Notes |
|----------------------|----------------|-------|
| `Button`             | Implémenté     | 5 variants (primary, gold, outline, ghost, danger), 3 sizes |
| `Card`               | Implémenté     | Padding 24px, border mist, shadow card |
| `Badge`              | Implémenté     | Full-rounded, caption font |
| `Input`              | Implémenté     | Border mist, focus brand primary |
| `ComplianceBadge`    | À extraire     | Helper class déjà présent dans `tokens.ts` — promouvoir en composant React |
| `TrustBar`           | À créer        | Horizontal bar avec icônes (lock, RGPD, Ordem, AMA) — voir D-007 |
| `Wizard / Stepper`   | À créer        | Multi-étapes form (NIF, contrats) — barre progression sobre, étape active en `brand.primary` |
| `FileDrop`           | À créer        | Drag-drop zone, preview thumbnail, validation visuelle (taille, format) |
| `ChatBubble`         | À créer        | Bulles utilisateur (alignées droite, surface page) vs IA (alignées gauche, surface card avec border mist) + sources clickables |
| `PdfPreviewPane`     | À créer        | Right-pane fixed avec PDF rendu + highlight des fields modifiés |
| `Timeline`           | À créer        | Suivi dossier NIF (verticale mobile, horizontale desktop) |
| `StatusPill`         | À créer        | Pill compact pour statuts dossier (en cours, validé, urgent) |
| `LangSwitcher`       | À créer        | Header — FR/PT (drapeau + ISO code), 1-clic, persistance cookie |

## Do's and Don'ts

### Do

- **Do** utiliser `brand.secondary` (or) uniquement pour amplifier un moment positif (CTA paiement, dossier accepté, badge premium). Maximum 1 zone par écran.
- **Do** afficher au moins un signal de confiance (`TrustBar`) sur tout écran transactionnel (paiement, signature, upload sensible).
- **Do** préférer la sobriété : si l'écran tient en 1 colonne `container.content`, ne pas le forcer en 2 colonnes pour "remplir" le viewport.
- **Do** annoter les références juridiques avec `mono` font + lien vers la source DRE/DGSI si dispo.
- **Do** localiser **toutes** les chaînes UI — PT et FR au MVP. Aucune string hardcodée non-traduite.
- **Do** garder un contraste minimum 4.5:1 sur tout texte ≥ 14px ; 3:1 sur texte ≥ 18px ou bold.

### Don't

- **Don't** utiliser le rouge `status.red` ou variants en dehors du système de statut compliance/erreur. Pas de "rouge décoratif".
- **Don't** combiner gold + couleurs status sur le même CTA (le doré "absorbe" la sémantique de statut).
- **Don't** ajouter de drop-shadow décorative sur les images, illustrations ou typographies. L'ombre porte une fonction de hiérarchie, pas un effet.
- **Don't** utiliser d'emoji dans la UI (ni microcopy ni notifications). Les pictogrammes lucide-react portent le sens.
- **Don't** introduire de polices supplémentaires sans les justifier au log (alourdissement bundle + dilution identité).
- **Don't** mélanger `serif` et `sans` dans un même paragraphe. Le serif reste réservé aux titres et citations.
- **Don't** afficher de mention "Made with [X]" / "Powered by Privy" en page publique — le branding partenaire est limité au footer si présent.
- **Don't** infantiliser : pas de mascotte, pas de "Hey 👋", pas de copy familière. Le ton reste formel-accessible (voir EXPERIENCE.md §Voice and Tone).
