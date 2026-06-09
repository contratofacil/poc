# Regulated Content Review

**Reviewer:** Regulated-content specialist (EU consumer law + Portuguese legal tech)
**Date:** 2026-06-09
**Scope:** `DESIGN.md`, `EXPERIENCE.md`, mocks 01–05
**Jurisdictions in scope:** Portugal (primary), France (cross-border to FR users), EU consumer protection

---

## Verdict: PASS WITH NOTES

The spines demonstrate a solid baseline regulatory posture — particularly the §Disclaimers matrix, the explicit "regulated consumer" framing in §Foundation/Stakes, the Luso-Legal escalation flow (Flow 5), the persistent IA disclaimer in mock 05, and the supervised-by-cabinet messaging in the footer. The Ordem dos Advogados partnership is properly surfaced and the streaming IA carries a non-dismissable disclaimer.

However, there are **several gaps that must be closed before the MVP can be launched in production**, principally around: (a) **misleading commercial claims** in the landing page that are not currently hedged ("48h", "500+ dossiers traités", "tout inclus"), (b) **the absence of any cookie/consent banner spec** required by ePrivacy + RGPD, (c) **incomplete RGPD lawful-basis and cross-border transfer documentation**, (d) **liability framing on the contract generator** being too soft, and (e) **AML/KYC obligations** absent from the NIF and contract flows despite the cabinet being the regulated entity transmitting acts.

None of these are existential — they are addressable with spine additions and microcopy changes before development. None require a redesign of the IA architecture or the visual identity.

---

## Critical compliance gaps

These must be resolved before any production launch.

### CG-1 — No cookie / consent management spec (ePrivacy + RGPD Art. 7)
`EXPERIENCE.md` mentions a "persistance cookie 1 an" for the LangSwitcher and a `redirect` cookie on auth flow, but there is **zero cookie consent banner specification**, no §Cookies section, and no consent management UI in any mock. For an EU-targeted product, an opt-in banner is mandatory before any non-strictly-necessary cookie/tracker fires (analytics, marketing pixels, Privy session beyond strict necessity is borderline, Stripe/MB Way fingerprinting). The French CNIL has issued multi-million-euro fines (Google, Amazon, Microsoft) for exactly this omission. Portuguese CNPD enforces aligned doctrine.

### CG-2 — Misleading commercial practices on the landing page (Directive 2005/29/EC)
Three claims in `01-landing.html` create UCPD exposure:
- **"NIF en 48h"** — repeated as a hard promise ("Obtenez votre NIF portugais en 48h"). Portuguese Finanças turnaround is not guaranteed by EasyLaw; it depends on a third party (the State). A promise that the platform cannot itself control = misleading per UCPD Annex I §5 ("bait advertising") if regularly missed. EXPERIENCE.md mentions "48h" in Voice/Tone but never hedges with "en moyenne", "généralement", or "objectif de service".
- **"500+ dossiers traités"** — unverifiable trust signal. If the cabinet/platform has not actually processed 500 dossiers at launch, this is a falsifiable representation under UCPD Art. 6.
- **"99 € — tout inclus"** / **"Zéro surprise"** — currently no mention of VAT inclusion, IBAN transfer fees, optional bank account add-on pricing, or refund/withdrawal policy. Consumer Rights Directive 2011/83/EU Art. 6 requires total price, tax-inclusive, before order placement.

### CG-3 — Contract generator liability framing is dangerously soft
`EXPERIENCE.md` §Disclaimers contains: *"Le modèle généré est juridiquement conforme à la date de génération. Aucune garantie de pertinence pour des situations atypiques sans avis d'avocat."* This is **insufficient**. The current landing page says contracts are "Conformes, à jour" without any qualifier. The contract wizard mock (`04-contract-wizard.html`) has **no visible disclaimer** at all — no liability clause, no "consultez un avocat", no notice that the contract is a template and not legal advice. Combined with the line *"conforme NRAU"* in Flow 4, this risks being read as guarantee of legal effectiveness. Under Portuguese Bar Association rules (EOA — Estatuto da Ordem dos Advogados, Lei 145/2015, art. 1.º), only registered avocats can provide acto próprio. A platform issuing a contract claimed to be "conforme" without disclaimer can be construed as exercício ilegal da advocacia by non-lawyers.

---

## Major risks

### MR-1 — RGPD: lawful basis and cross-border transfer not documented in the spine
`EXPERIENCE.md` lists `/profile/export` for "RGPD : export données / suppression" — good — but the spine has **no §Privacy / §Data Protection section** stating: lawful basis per processing purpose (contract execution vs. consent vs. legitimate interest); data retention periods; sub-processors and their locations (Privy is US-based — needs SCCs / DPF; Stripe Ireland is EU but processes globally; OpenAI / Anthropic for Luso-Legal is US-based and a **major** Article 44–49 transfer concern); DPO contact. The footer mentions "Politique de confidentialité" but the spine has no content commitment for it. The "AES-256 au repos + TLS 1.3 en transit" trust line is good but **encryption is not consent and is not lawful basis**.

### MR-2 — Luso-Legal IA: cross-border data transfer to LLM provider invisible
The chat mock (`05-luso-legal-chat.html`) and Flow 5 do not surface that user prompts (which may contain sensitive personal data — health, finance, names, addresses, NIF) are transmitted to an LLM provider that is almost certainly outside the EU. This is a Schrems II / Article 28+44 compliance issue. The disclaimer is purely about "not personalized legal advice" — it says nothing about data flow. CNPD has begun scrutinizing exactly this pattern in 2025.

### MR-3 — AML/KYC absent from NIF and Lda statutes flows (Lei 83/2017)
Portuguese AML law (Lei 83/2017, transpondo AMLD5) **requires** identity verification when a regulated entity (the avocat) acts on behalf of a client for: opening corporate vehicles, NIF for non-residents acting on behalf of beneficial owners, signing procurações for fiscal representation. The NIF wizard (mock 02) collects passport and proof of address — good baseline — but the spine never declares this as a **KYC step under Lei 83/2017**, never mentions PEP screening, never mentions enhanced due diligence for high-risk third countries, and never explains the requirement to the user. The cabinet (Oliveira & Carneiro) is the obliged entity here; EasyLaw acts as data collector for the cabinet. Without an explicit AML/KYC clause and step in the spec, the cabinet is exposed and the platform may be construed as helping circumvent.

### MR-4 — French cross-border services: déontologie risk (RIN, art. 10)
EasyLaw markets in French to French expats. The Règlement Intérieur National of the Conseil National des Barreaux (CNB) — particularly art. 10 (publicité) and art. 15 (libre prestation de services) — restricts how legal services can be marketed in France, even by non-French lawyers. The marketing of "legal services in Portugal to French residents" can attract CNB scrutiny if it crosses into FR-law advice or fails to clearly identify the Portuguese Bar as the supervising authority. The current landing page identifies Oliveira & Carneiro in good faith, but **no mention of "services prestés uniquement sous droit portugais"** and no mention that French law questions are out of scope. Flow 5 sells a 49 € consultation by an Oliveira & Carneiro avocat — if a French user asks a French-law question and gets advice, that is potentially exercice illégal in France.

### MR-5 — European Accessibility Act 2025 (EAA) not declared in scope
`EXPERIENCE.md` §Accessibility Floor commits to WCAG 2.2 AA, which is excellent. However, the EAA (Directive 2019/882) became enforceable 28 June 2025 and applies to **e-commerce services to consumers** in B2C context — which EasyLaw squarely is (NIF sale, contract sale, subscription compliance). The spine should explicitly invoke EAA compliance, not just WCAG, and reference the Portuguese transposition (DL 82/2022). WCAG 2.2 AA covers most but not all EAA obligations (e.g., accessibility statement requirement, complaint mechanism, periodic review).

### MR-6 — Withdrawal right (droit de rétractation) for digital services
Consumer Rights Directive 2011/83/EU grants a **14-day withdrawal right** for distance contracts with consumers. Digital services and "personalized" digital content allow a waiver if the consumer expressly consents to immediate execution and acknowledges loss of withdrawal. The contract generator (49 €) and NIF service (99 €) are precisely the case where the platform wants to start service immediately — but the spine has **no withdrawal disclosure, no consent checkbox, no explicit waiver microcopy**. This is mandatory pre-contractual information.

### MR-7 — "Conforme NRAU" / "Conformes, à jour" — overpromise
The landing claims contracts are "Conformes" without qualifier. Flow 4 says Lucas wants to be "sûr d'être conforme NRAU" and the product delivers. The Luso-Legal answer in mock 05 explicitly cites that "résiliation sans préavis serait nulle" — IA explicitly providing what reads like legal advice on a specific contract clause. Even with the disclaimer footer, this is *exactement* the type of output that the Ordem dos Advogados or Conseil National des Barreaux would flag as advocacy. The IA must be tuned to answer in **general information mode** (e.g., "le NRAU prévoit en général un préavis de…") rather than analyzing the user's specific clause and concluding "n'est pas pleinement conforme".

---

## Minor improvements

- **MI-1** — Trust bar uses "Ordem dos Advogados" as a trust signal but Cédula Profissional is only "available on request" (per landing copy). For O&C to use the Ordem mark this way, the cabinet must have explicit authorization; in the FR market the equivalent requires CNB transparency. Reference the registration number directly in the footer.
- **MI-2** — `EXPERIENCE.md` §Voice and Tone forbids "Hey 👋" but the Luso-Legal AI response in mock 05 uses 👉 emoji ("👉 En pratique…"). Inconsistent with the §Don'ts rule that emojis are forbidden in UI. Worse: this is the exact informal register the spine warns against in a regulated context.
- **MI-3** — Empty state for `/assistant` reads "Posez votre première question à Luso-Legal — l'assistant IA spécialisé droit portugais." No disclaimer adjacent to the empty state. Add a one-liner.
- **MI-4** — `OQ-005` ("exposition partenariat O&C") should be resolved before launch and not left as an Open Question — the partner branding is part of the legal compliance posture, not a design preference.
- **MI-5** — `/profile/export` exists but no spec for **rectification** (Art. 16 RGPD) or **portability** (Art. 20) as separate flows.
- **MI-6** — TrustBar shows "✓ AMA Certified" — what does AMA certification mean here? Agência para a Modernização Administrativa certifications exist (e.g., chave móvel digital integration) but the spine never explains which certification applies. If unverifiable, this is misleading.
- **MI-7** — `EXPERIENCE.md` §Notifications: "rétention forcée pour devoir d'alerte" on Security and ROUGE notifications. RGPD recital 47 / GDPR Art. 21 allows opt-out of even legitimate-interest processing except where overriding compelling grounds. "Devoir d'alerte" is plausible for ROUGE compliance deadlines but should be documented as the lawful basis.
- **MI-8** — Mock 02 (NIF Wizard) shows "Qualité OCR validée" badge — beware: declaring that the platform has validated identity quality may transfer liability if the document is in fact fraudulent. Use "OCR readable" rather than "validée".
- **MI-9** — No mention of **secret professionnel** scope in the spine. When does cabinet-client privilege attach vs. when is EasyLaw a mere SaaS provider? Critical for civil/criminal investigations.

---

## Specific text/microcopy revisions recommended

| Location | Current | Suggested |
|---|---|---|
| `01-landing.html` hero subtitle | "Obtenez votre NIF portugais en 48h. 99 € tout compris." | "Obtenez votre NIF portugais en moyenne sous 48h ouvrées. 99 € TTC, supervision cabinet incluse. (Délai indicatif, sujet aux délais des Finanças portugaises.)" |
| `01-landing.html` trust pill | "500+ dossiers traités" | Remove until verifiable, or replace with "Supervisé par un cabinet membre de l'Ordem dos Advogados". |
| `01-landing.html` feature card "Générateur de contrats" | "5 modèles MVP : … Conformes, à jour" | "5 modèles juridiques portugais à jour à la date de génération. Modèles types — pour les situations atypiques, consultez un avocat." |
| `01-landing.html` "Comment ça marche" §02 | "Le cabinet Oliveira & Carneiro supervise chaque dossier." | "Les actes juridiques (procurations, dépôts Finanças) sont effectués par le cabinet Oliveira & Carneiro Advogados, inscrit à l'Ordem dos Advogados (Cédula nº [XXX])." |
| `01-landing.html` footer disclaimer | "EasyLaw est une plateforme technologique. Les actes juridiques sont supervisés par Oliveira & Carneiro Advogados (Ordem dos Advogados)." | Add: "EasyLaw n'est pas un cabinet d'avocats et ne fournit pas de conseil juridique. Les services juridiques sont fournis exclusivement sous droit portugais par le cabinet partenaire Oliveira & Carneiro Advogados (Ordem dos Advogados, Cédula Profissional nº [XXX]). Les questions de droit français ou autre juridiction ne sont pas dans le périmètre." |
| `02-nif-wizard.html` upload section (just below trust bar) | (no AML/KYC mention) | Add: "Vérification d'identité (KYC) — requise au titre de la Lei 83/2017 contre le blanchiment de capitaux. Vos documents sont consultés par le cabinet partenaire dans ce cadre légal." |
| `02-nif-wizard.html` "Qualité OCR validée" badge | "Qualité OCR validée" | "Document lisible — vérification finale par le cabinet" |
| `04-contract-wizard.html` (entire mock) | (no disclaimer present) | Add a persistent footer band: "Modèle juridique généré automatiquement. Conforme au droit portugais à la date du [DATE]. Ne se substitue pas à un conseil juridique personnalisé pour les situations atypiques. Téléchargement après paiement vaut acceptation et renonciation au droit de rétractation de 14 jours (CE 2011/83 art. 16.m)." |
| `04-contract-wizard.html` final paiement step (to add) | (no withdrawal disclosure) | Add checkbox required to submit: "☐ Je demande l'exécution immédiate de la prestation et reconnais perdre mon droit de rétractation de 14 jours (Code de la consommation art. L221-28 / Decreto-Lei 24/2014 art. 17)." |
| `05-luso-legal-chat.html` IA response paragraph | "La clause que vous décrivez **n'est pas pleinement conforme au régime du NRAU**." | "Le NRAU prévoit en règle générale un préavis minimum d'un mois (art. 1098.º CC). Une clause qui prévoirait une résiliation sans préavis pourrait, selon le contexte et la jurisprudence applicable, être interprétée comme une cláusula abusiva. **Information générale — pour une analyse de votre clause précise, sollicitez un avocat.**" |
| `05-luso-legal-chat.html` IA response with 👉 emoji | "👉 En pratique, vous devriez pouvoir négocier…" | "En pratique, ce type de clause se négocie souvent…" (no emoji, no second-person direct recommendation) |
| `05-luso-legal-chat.html` disclaimer footer | "Information générale — ne constitue pas un conseil juridique personnalisé. Pour un avis sur votre situation, contactez un avocat." | "Information générale — ne constitue pas un conseil juridique personnalisé au sens de l'art. 1.º EOA. Vos questions sont traitées par une IA. Pour un avis sur votre situation, contactez un avocat (CTA Parler à un avocat). Vos messages peuvent être traités par un prestataire technique hors UE — voir politique de confidentialité." |
| `05-luso-legal-chat.html` empty/new conversation state (to add) | (no disclaimer at conversation start) | Add a system-bubble at top of every new thread: "Bonjour. Je suis Luso-Legal, assistant IA spécialisé en droit portugais. Mes réponses sont des informations générales sourcées DRE/DGSI — elles ne constituent pas un conseil juridique. Pour un avis personnalisé, demandez « Parler à un avocat »." |
| `EXPERIENCE.md` §Disclaimers row "Toute réponse Luso-Legal" | "Information générale — ne constitue pas un conseil juridique personnalisé." | Same + "Vos données peuvent être traitées par un prestataire d'IA hors UE (voir politique de confidentialité)." |
| `EXPERIENCE.md` Flow 1 step 1 | "Obtenez votre NIF portugais en 48h. 99 € tout compris." | "Obtenez votre NIF portugais en moyenne sous 48h ouvrées. 99 € TTC supervision cabinet incluse." (consistency with landing fix) |

---

## Spine additions recommended

The following sections / clauses should be added to bring the spine to launch-readiness. They are listed in priority order.

### Add to `EXPERIENCE.md` (new top-level sections)

1. **§Cookie consent & ePrivacy** — specify the consent banner: surfaces (all public + first authenticated visit), categories (strictly necessary / functional / analytics / marketing), default state (all non-essential **off** until user acts), persistence (13 months max per CNIL/CNPD), revocation surface (footer link "Gérer mes cookies"), and behavior of analytics/Privy/Stripe/LLM-provider scripts before consent. **No tracker fires before "Accept" or "Save preferences"**. Document the link to the data flow inventory.

2. **§Data Protection (RGPD)** — for each surface that collects/processes personal data: (a) finalité, (b) base légale (Art. 6 RGPD), (c) catégorie de données, (d) durée de conservation, (e) destinataires (cabinet, Privy, Stripe, LLM provider, etc.), (f) transferts hors UE et garanties (SCC / DPF / dérogation Art. 49), (g) droits (accès, rectif, portabilité, opposition, effacement, plainte CNPD/CNIL). Add the DPO contact channel and the §rectification / §portability flows (not just suppression).

3. **§AML/KYC (Lei 83/2017)** — declare which flows trigger CDD (Customer Due Diligence) and EDD (Enhanced DD): NIF for non-residents, Lda statutes, procurations fiscales. Specify documents collected, retention (10 years per Lei 83/2017), PEP screening procedure, escalation to compliance officer at the cabinet, and the user-facing explanation.

4. **§Cross-border services scope** — state explicitly: "EasyLaw fournit des services informatiques. Les actes juridiques fournis par le cabinet Oliveira & Carneiro Advogados portent **exclusivement sur le droit portugais**. Les questions relatives au droit français, espagnol, ou de toute autre juridiction sont hors périmètre et seront systématiquement réorientées." Apply this to: Luso-Legal IA system prompt scoping, escalade-à-un-avocat scoping, marketing copy in FR market.

5. **§Withdrawal right / Droit de rétractation** — for each paid service (NIF 99 €, contracts 49 €, AI subscription 19 €/mo, Compliance 29 €/mo, advocat consultation 49 €): is it a "service" or "digital content"? Default = 14-day withdrawal applies. To start service immediately, require explicit consent + acknowledgment of loss of withdrawal — UI checkbox spec. For subscriptions, also document cancellation and prorata refund per EU Directive (EU) 2019/2161.

6. **§AI Disclaimers & Scope (Luso-Legal)** — extend the existing §Disclaimers row into a dedicated section: (a) system prompt guardrails ("respond as general information, never advise on a specific clause, never conclude on the user's situation"), (b) refusal categories (out-of-scope, French law, criminal advice, advice with high stakes), (c) handoff triggers (auto-suggest "Parler à un avocat" when user mentions stakes, situation-specific facts), (d) data flow disclosure (LLM provider, retention), (e) opt-out of training (default: prompts not used to train).

7. **§Accessibility / EAA compliance** — extend §Accessibility Floor to invoke EAA 2019/882 (DL 82/2022 PT transposition), commit to publication of an **accessibility statement** (footer link), specify the **complaint / feedback mechanism** (mandatory under EAA), and the periodic review cadence.

8. **§Cookie consent for the LangSwitcher** — currently states "persistance cookie 1 an" — this is a functional cookie, technically allowed without consent if strictly for user-set preference. Document it explicitly in the cookie inventory as "fonctionnel sans consentement requis".

### Add to `DESIGN.md`

9. **§Cookie consent banner component** — visual spec: bottom-sticky on first visit, 3 buttons (Tout refuser / Personnaliser / Tout accepter — equal visual weight per CNIL 2022 guidelines, never larger "Accept" button), microcopy in PT/FR, color tokens reusing `surface.card` + `brand.primary` borders.

10. **§AccessibilityStatement footer link** — required EAA element.

11. **§AMLNotice component** — inline notice block (variant of the existing `aside` info block) shown on KYC-relevant flows.

### Add to all 5 mocks (operational)

12. **Cookie banner overlay** on the landing mock.
13. **AML/KYC notice block** on `02-nif-wizard.html`.
14. **Persistent contract disclaimer** on `04-contract-wizard.html`.
15. **Withdrawal-right checkbox** on the final payment step (specified in the wizard mocks once those are produced — currently only the form steps are mocked).
16. **System welcome bubble with disclaimer** at the start of every Luso-Legal thread in `05-luso-legal-chat.html`.

### Add to landing page (mock 01) — copy and structure

17. **Cabinet Cédula Profissional number** visible in footer (currently "[TBD]"). Resolve before launch.
18. Remove "500+ dossiers" until verifiable, or rephrase to a verifiable claim ("Cabinet partenaire avec 15 ans d'expérience").
19. Hedge the "48h" everywhere it appears.
20. State on `/tarifs` and the checkout: total prix TTC, withdrawal-right disclosure, link to CGU.

---

## Summary of regulatory exposure rating

| Dimension | Status | Risk | Notes |
|---|---|---|---|
| 1. AI disclaimers (general) | PASS WITH NOTES | Low | Permanent footer disclaimer present in mock 05 and §Disclaimers. IA tone too situation-specific in places — see CG-3 / MR-7. |
| 2. Bar association (Ordem / CNB) | PASS WITH NOTES | Medium | O&C partnership properly surfaced. Missing Cédula. FR cross-border not scoped. IA borderline on giving personalized analysis. |
| 3. RGPD / GDPR | FAIL (gap) | High | No cookie banner, no §Privacy section, no cross-border transfer disclosure, no DPO contact, no rectification/portability flows. |
| 4. Pricing transparency (Dir. 2011/83) | PASS WITH NOTES | Medium | Prices shown TTC in PRD intent but landing claims "tout inclus" without listing inclusions/exclusions. No withdrawal disclosure. |
| 5. Misleading practices (UCPD) | FAIL (gap) | High | "48h", "500+ dossiers", "tout inclus", "Conformes" all need hedging or removal. |
| 6. Contract template liability | FAIL (gap) | High | Wizard mock has zero disclaimer. Spine line is too soft. |
| 7. Cross-border (FR) | PASS WITH NOTES | Medium | French market targeted, but FR-law scope exclusion not declared. |
| 8. AML/KYC (Lei 83/2017) | FAIL (gap) | High | Not mentioned in spine. Cabinet exposure. |
| 9. Cookie consent | FAIL (gap) | High | Not specified anywhere. |
| 10. Accessibility (EAA 2025) | PASS WITH NOTES | Low | WCAG 2.2 AA committed, but EAA-specific accessibility statement + complaint mechanism not specified. |

---

*End of regulated content review.*
