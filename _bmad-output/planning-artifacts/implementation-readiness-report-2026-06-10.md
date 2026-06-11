---
stepsCompleted: ["step-01-document-discovery", "step-02-prd-analysis", "step-03-epic-coverage-validation", "step-04-ux-alignment", "step-05-epic-quality-review", "step-06-final-assessment"]
filesIncluded:
  prd: "_bmad-output/planning-artifacts/prd/easylaw-prd-2026-05-26.md"
  architecture: "_bmad-output/planning-artifacts/architecture/easylaw-architecture-2026-05-26.md"
  epics: "_bmad-output/planning-artifacts/epics/easylaw-epics-stories-2026-05-26.md"
  ux_original: "_bmad-output/planning-artifacts/ux/easylaw-ux-2026-05-26.md"
  ux_detailed: "_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/"
---

# Implementation Readiness Assessment Report

**Date :** 2026-06-10
**Projet :** EasyLaw / ContratoFácil
**Assesseur :** BMAD Check Implementation Readiness v6.8.0
**Focus demandé :** Fonctionnalités manquantes pour un meilleur UX

---

## 1. Document Inventory

| Type | Fichier | Taille | Date | Statut |
|------|---------|--------|------|--------|
| PRD | `prd/easylaw-prd-2026-05-26.md` | 13.9 KB | 2026-05-26 | ✅ Utilisé |
| Architecture | `architecture/easylaw-architecture-2026-05-26.md` | 9.2 KB | 2026-05-26 | ✅ Utilisé |
| Epics & Stories | `epics/easylaw-epics-stories-2026-05-26.md` | 28.9 KB | 2026-06-08 | ✅ Utilisé |
| UX (ancienne) | `ux/easylaw-ux-2026-05-26.md` | 9.1 KB | 2026-05-26 | ⚠️ Doublon |
| UX (actuelle) | `ux-designs/ux-easylaw-2026-06-09/` | 145 KB | 2026-06-09 | ✅ Utilisé |

> **Doublon UX résolu :** la version shardée de juin 2026 (145 KB, revue complète) prévaut sur l'ancienne version de mai 2026.

---

## 2. PRD Analysis — Exigences extraites

### Exigences Fonctionnelles MVP

| ID | Exigence | Priorité |
|----|----------|----------|
| FR-A01-01 | Formulaire multi-étapes NIF avec validation temps réel | MUST |
| FR-A01-02 | Upload sécurisé pièces justificatives | MUST |
| FR-A01-03 | Génération automatique procuration (Carbone.io) | MUST |
| FR-A01-04 | Paiement en ligne Stripe + MB Way | MUST |
| FR-A01-05 | Notifications email + SMS changement statut dossier | MUST |
| FR-A01-06 | Tableau de bord suivi d'avancement client | MUST |
| FR-A01-07 | Transmission sécurisée au cabinet | MUST |
| FR-A02-01 | Moteur templates Carbone.io + table clause_versions | MUST |
| FR-A02-02 | Bail résidentiel NRAU | MUST |
| FR-A02-03 | Contrat prestation de services | MUST |
| FR-A02-04 | Contrat de travail CDD/CDI | MUST |
| FR-A02-05 | Statuts de société Lda/Unipessoal | MUST |
| FR-A02-06 | Procuration générale/spéciale | MUST |
| FR-A02-07 | Wizard de génération guidé | MUST |
| FR-A02-08 | Prévisualisation PDF avant paiement | MUST |
| FR-A02-09 | Webhook législatif NRAU + Code Travail | MUST |
| FR-A02-10 | Mise à jour automatique templates | MUST |
| FR-A03-01 | Table compliance_items | MUST |
| FR-A03-02 | CRON quotidien 07h00 | MUST |
| FR-A03-03 à 05 | Statuts VERT / ORANGE / ROUGE + escalade | MUST |
| FR-A03-06 | Export PDF rapport conformité mensuel | SHOULD |
| FR-A04-01 | LLM + RAG corpus PT + EU | MUST |
| FR-A04-02 | Dispo 24h/24, réponse < 3s | MUST |
| FR-A04-03 | Guardrails hors-périmètre | MUST |
| FR-A04-04 | Historique conversation relié dossier | MUST |
| FR-A04-05 | Escalade automatique vers avocat | MUST |
| FR-A04-06 | Isolation données RGPD | MUST |
| FR-A04-07 | Interface monitoring cabinet | SHOULD |
| FR-A04-08 | Disclaimer obligatoire | MUST |
| FR-C01 | Chiffrement AES-256 au repos | MUST |
| FR-C02 | TLS 1.3 en transit | MUST |
| FR-C03 | RBAC granulaire (client/avocat/junior/admin) | MUST |
| FR-C04 | Audit trail horodaté | MUST |
| FR-C05 | Versioning documents | MUST |
| FR-C06 | Export données RGPD | MUST |
| FR-C07 | Droit à l'oubli | MUST |

**Total FRs MVP : 38** (33 MUST + 5 SHOULD)

### Exigences Non-Fonctionnelles

| ID | Exigence | Cible |
|----|----------|-------|
| NFR-P01 | Temps réponse API P95 | < 200ms |
| NFR-P02 | Temps réponse Luso-Legal | < 3s |
| NFR-P03 | Uptime mensuel | > 99.9% |
| NFR-P04 | Génération contrat | < 30s |
| NFR-P05 | Upload 10 Mo | < 5s |
| NFR-S01 | RGPD (UE 2016/679) | MVP |
| NFR-S02 | Secret professionnel Ordem Advogados | MVP |
| NFR-S03 | ISO 27001 orientation | MVP |
| NFR-SC01 | Architecture microservices scale indép. | MVP |
| NFR-SC02 | Hébergement EU auto-scaling | MVP |

---

## 3. Epic Coverage Validation

### Matrice de couverture FR ↔ Epics

| FR | Texte | Epic / Story | Statut |
|----|-------|-------------|--------|
| FR-A01-01 | Formulaire multi-étapes NIF | US-2.1 | ✅ Couvert |
| FR-A01-02 | Upload pièces justificatives | US-2.2 | ✅ Couvert |
| **FR-A01-03** | **Génération procuration Carbone.io** | **Aucune story** | **❌ MANQUANT** |
| FR-A01-04 | Paiement Stripe + MB Way | US-2.3 | ✅ Couvert |
| FR-A01-05 | Notifications email + SMS | US-2.4 | ✅ Couvert |
| FR-A01-06 | Tableau de bord suivi | US-2.4 | ✅ Couvert |
| **FR-A01-07** | **Transmission sécurisée cabinet** | **Aucune story** | **⚠️ Implicite seulement** |
| FR-A02-01 | Moteur templates + clause_versions | US-3.x (implicite) | ⚠️ Détail technique absent |
| FR-A02-02 | Bail résidentiel NRAU | US-3.2 | ✅ Couvert |
| **FR-A02-03** | **Contrat prestation de services** | **Aucune story** | **❌ MANQUANT** |
| FR-A02-04 | Contrat travail CDD/CDI | US-3.3 | ✅ Couvert |
| **FR-A02-05** | **Statuts société Lda/Unipessoal** | **Aucune story** | **❌ MANQUANT** |
| **FR-A02-06** | **Procuration générale/spéciale** | **Aucune story** | **❌ MANQUANT** |
| FR-A02-07 | Wizard guidé | US-3.1, 3.2, 3.3 | ✅ Couvert |
| FR-A02-08 | Prévisualisation PDF | US-3.4 | ✅ Couvert |
| FR-A02-09 | Webhook NRAU | US-3.2 (partiel, Code Travail absent) | ⚠️ Partiel |
| FR-A02-10 | Mise à jour automatique templates | US-3.2 (NRAU seulement) | ⚠️ Partiel |
| FR-A03-01 | Table compliance_items | US-4.1 (implicite) | ⚠️ Technique absent |
| FR-A03-02 | CRON quotidien | US-4.3 | ✅ Couvert |
| FR-A03-03 à 05 | Statuts VERT/ORANGE/ROUGE | US-4.2, US-4.3 | ✅ Couvert |
| FR-A03-06 | Export PDF rapport mensuel | US-4.2 | ✅ Couvert |
| **FR-A04-01** | **RAG pipeline DRE/DGSI MVP** | **Aucune story** | **❌ MANQUANT** |
| FR-A04-02 | Dispo 24h/24 < 3s | US-5.1 | ✅ Couvert |
| FR-A04-03 | Guardrails | US-5.2 | ✅ Couvert |
| FR-A04-04 | Historique conversation | US-5.1 | ✅ Couvert |
| FR-A04-05 | Escalade vers avocat | US-5.3 | ✅ Couvert |
| FR-A04-06 | Isolation données RGPD | US-5.2 | ✅ Couvert |
| **FR-A04-07** | **Interface monitoring cabinet** | **Aucune story dédiée** | **⚠️ MANQUANT** |
| FR-A04-08 | Disclaimer obligatoire | US-5.1 | ✅ Couvert |
| FR-C01 | AES-256 | US-2.2, US-6.1 | ✅ Couvert |
| FR-C02 | TLS 1.3 | NFR infrastructurel | ⚠️ Pas de story |
| FR-C03 | RBAC granulaire | US-1.4 | ✅ Couvert |
| FR-C04 | Audit trail | US-6.2 | ✅ Couvert |
| FR-C05 | Versioning | US-6.1 | ✅ Couvert |
| FR-C06 | Export RGPD | US-1.3 | ✅ Couvert |
| FR-C07 | Droit à l'oubli | US-1.3 | ✅ Couvert |

### Statistiques de couverture

- **Total FRs MVP :** 38
- **FRs couverts :** 26 (✅)
- **FRs partiels :** 6 (⚠️)
- **FRs manquants :** 6 (❌)
- **Taux de couverture complète : 68 %** — insuffisant pour démarrer l'implémentation

### FRs manquants critiques

**❌ FR-A01-03 — Génération automatique procuration NIF**
- Impact : Blocant pour le flow Lucas (étape 5 du wizard NIF) — sans procuration générée, le dossier ne peut pas être transmis au cabinet
- Recommandation : Ajouter US-2.5 — Génération et prévisualisation de la procuration pré-remplie dans Epic 2

**❌ FR-A02-03 — Contrat de prestation de services**
- Impact : 1 des 5 contrats MVP promis absent des stories
- Recommandation : Ajouter US-3.5 dans Epic 3

**❌ FR-A02-05 — Statuts de société Lda/Unipessoal**
- Impact : 1 des 5 contrats MVP promis absent des stories
- Recommandation : Ajouter US-3.6 dans Epic 3

**❌ FR-A02-06 — Procuration générale/spéciale (contrat)**
- Impact : 1 des 5 contrats MVP promis absent des stories
- Recommandation : Ajouter US-3.7 dans Epic 3

**❌ FR-A04-01 — Pipeline RAG indexation DRE/DGSI (MVP)**
- Impact : Luso-Legal ne peut pas répondre sans données indexées — infrastructure critique non planifiée
- Recommandation : Ajouter US-5.0 (infra) ou inclure dans US-5.1 avec spécification technique

**⚠️ FR-A04-07 — Interface monitoring cabinet Luso-Legal**
- Impact : Volume questions, thèmes, escalades non consultables par le cabinet
- Note : EXPERIENCE.md OQ-006 recommande Phase 2 — à confirmer avec stakeholders

---

## 4. UX Alignment Assessment

### Statut UX : ✅ RICHE — version 2026-06-09 très complète (145 KB, reviews incluses)

Le dossier `ux-designs/ux-easylaw-2026-06-09/` contient EXPERIENCE.md (42 KB), DESIGN.md (15 KB), reviews accessibilité, contenu réglementé, et synthèse. C'est le document UX le plus complet du projet.

### Gaps UX ↔ Epics (fonctionnalités UX sans story)

#### 🔴 CRITIQUE — Auth : mismatch architectural total

**EXPERIENCE.md** : Privy embedded (Email OTP, SMS OTP, Passkey, Google, LinkedIn) — **pas d'écran login custom au MVP**.
**Epic 1 (US-1.1, US-1.2)** : email + mot de passe + JWT + formulaires custom.

→ **Ces deux specs sont incompatibles.** L'Epic 1 entière doit être réécrite pour Privy auth. Les US-1.1 et US-1.2 ne peuvent pas être implémentées telles quelles.

#### 🔴 CRITIQUE — KYC / eIDV absent des epics

**EXPERIENCE.md §AML/KYC** définit une étape obligatoire entre l'upload (wizard NIF étape 2) et la procuration (étape 3) :
- Vérification identité automatisée eIDV (passeport ↔ selfie liveness)
- PEP screening (OFAC, EU Sanctions, UN)
- Conservation 7 ans (Lei 83/2017)

**Aucune story dans Epic 2 ne couvre ce flow obligatoire.**

→ Recommandation : Ajouter US-2.5 — KYC / eIDV Identity Verification dans Epic 2 (dépend du provider : Onfido / Veriff / Privy KYC — OQ-007 non résolu)

#### 🔴 CRITIQUE — Cookie Consent Banner (CMP) absent

**EXPERIENCE.md §Cookie Consent & ePrivacy** et **review-synthesis.md** (fix #4 critique) : le CMP est obligatoire avant toute collecte. Consent matrix : nécessaires (forcé) / analytique (opt-in) / marketing (opt-in) / personnalisation (opt-in).

**Aucune story ne couvre ce composant légalement requis.**

→ Recommandation : Ajouter US-1.5 — Cookie Consent Banner (CMP) dans Epic 1

#### 🟠 IMPORTANT — Disclaimers et checkboxes légaux au checkout

**EXPERIENCE.md §Contract Liability** : 4 éléments obligatoires avant paiement contrat :
1. Bandeau permanent disclaimer en haut du wizard
2. Checkbox obligatoire avant paiement
3. Email post-téléchargement avec récapitulatif
4. Checkbox droit de rétractation 14 jours (Dir. 2011/83/UE Art. 16(m))

**US-3.4** couvre le paiement mais ne mentionne aucun de ces éléments légaux.

→ Recommandation : Enrichir les ACs de US-3.4 avec les 4 éléments de mitigation de responsabilité

#### 🟠 IMPORTANT — Système de notifications in-app absent

**EXPERIENCE.md §Notifications** définit une matrice canal × événement incluant des notifications in-app (badge, center) pour 10 événements.

**Aucune story ne couvre l'infrastructure de notification in-app** (badge sidebar, notification center, real-time updates).

→ Recommandation : Ajouter US-1.6 — Notification Center & In-App Alerts dans Epic 1 (ou Epic 6)

#### 🟠 IMPORTANT — Real-time Timeline NIF (SSE)

**EXPERIENCE.md §Timeline** : updates en temps réel via Server-Sent Events (polling 30s fallback), bouton « Contacter le cabinet » si étape bloquée >24h.

**US-2.4** ne mentionne ni SSE, ni le timeout de 24h, ni les 5 étapes exactes (la UX en définit 5 : Soumission → Vérification → Procuration → Dépôt Finanças → NIF reçu).

→ Recommandation : Enrichir les ACs de US-2.4

#### 🟡 MINEUR — Interrupt button sur stream Luso-Legal

**EXPERIENCE.md §Streaming IA** : bouton "Interrupt" qui apparaît dès le début du stream, stop côté serveur.

**US-5.1** mentionne le streaming mais pas l'interrupt button.

→ Recommandation : Ajouter AC dans US-5.1

#### 🟡 MINEUR — Mode Print (CSS)

**EXPERIENCE.md §Platform considerations** : feuille de style print pour récap contrat et rapport compliance. Aucune story.

→ Recommandation : Ajouter AC dans US-3.4 et US-4.2

### Gaps UX ↔ Architecture

*Non évalué en détail — architecture doc disponible mais non analysé dans ce run. À faire en priorité avant Phase 2.*

**Point de vigilance identifié :** EXPERIENCE.md référence Next.js 16 App Router + React 19 — vérifier que l'architecture document reflète ces versions.

### Issues identifiées par les reviews UX (review-synthesis.md)

La review du 2026-06-09 a identifié 8 fixes critiques, dont **4 déjà appliqués** aux spines EXPERIENCE.md/DESIGN.md :

| # | Problème | Statut |
|---|----------|--------|
| 1 | `text.muted` #718096 — contraste WCAG AA insuffisant (3.72:1) → #5e6b7e | ✅ Appliqué (DESIGN.md) |
| 2 | fg colors status (green/amber/red) insuffisants sur fonds tintés | ✅ Appliqué (DESIGN.md) |
| 3 | Borders `surface.mist` invisibles (1.17:1) — nouveau token `mistStrong` | ✅ Appliqué (DESIGN.md) |
| 4 | Cookie consent CMP manquant | ✅ Section ajoutée à EXPERIENCE.md |
| 5 | Claims commerciaux trompeurs landing ("48h", "500+ dossiers") | ✅ Corrigé (EXPERIENCE.md §Voice & Tone) |
| 6 | Contract generator — liability vacuum | ✅ Section §Contract Liability ajoutée |
| 7 | AML/KYC absent | ✅ Section §AML/KYC ajoutée à EXPERIENCE.md |
| 8 | ARIA contracts absents (aria-required, aria-live, etc.) | ✅ §Accessibility Floor enrichi |

**Fixes 1-8 appliqués aux specs — mais AUCUNE story epic ne les implémente encore.**

---

## 5. Epic Quality Review

### Epic 1 — Authentification & Gestion de Compte

| Critère | Résultat |
|---------|----------|
| User value | ✅ Oui |
| Indépendance | ✅ Oui |
| Sizing | ✅ Approprié |
| **Alignement architecture** | **🔴 CRITIQUE : US-1.1/1.2 incompatibles avec Privy** |

**🔴 Violation critique :** US-1.1 spécifie "email + mot de passe (min 8 car., 1 maj., 1 chiffre)" et US-1.2 "JWT access token (15 min) + refresh token". EXPERIENCE.md impose **Privy embedded** — pas d'écran login custom, OTP seulement. Ces deux stories sont caduques telles quelles.

**🟠 Violation majeure :** US-1.1 inclut "Support PT + FR + EN" — mais le PRD classe EN en Phase 2. Incohérence portée dans les ACs.

**Manquant dans Epic 1 :**
- US-1.5 — Cookie Consent Banner (CMP) [RGPD/ePrivacy obligatoire]
- US-1.6 — In-App Notification Center

### Epic 2 — NIF & Starter Pack

| Critère | Résultat |
|---------|----------|
| User value | ✅ Oui |
| Indépendance | ✅ Dépend d'Epic 1 (correct) |
| Sizing | ✅ Approprié |
| **Couverture PRD** | **🔴 FR-A01-03 et FR-A01-07 manquants** |

**🔴 Violation critique :** 2 FRs MUST non couverts.
- FR-A01-03 (génération procuration) = bloquant pour la transmission cabinet
- FR-A01-07 (transmission sécurisée) = mécanisme d'intégration absent

**🔴 Story manquante :** US-2.5 — KYC / eIDV (AML légalement requis, Lei 83/2017)

**🟠 ACs de US-2.4 incomplets :** 4 étapes timeline vs 5 définies en UX, SSE absent, timeout 24h absent.

### Epic 3 — Générateur de Contrats

| Critère | Résultat |
|---------|----------|
| User value | ✅ Oui |
| **Couverture PRD** | **🔴 3 contrats MVP sur 5 sans story** |
| **Epic completeness** | **🔴 BLOQUANT** |

**🔴 Violation BLOQUANTE :** Epic 3 ne couvre que 2 des 5 types de contrats MVP requis par le PRD. Le PRD explicitement liste comme MUST : bail résidentiel, prestation de services, travail CDD/CDI, statuts Lda, procuration. Les stories ne couvrent que les 2 premiers.

**Stories manquantes :**
- US-3.5 — Wizard Contrat de Prestation de Services
- US-3.6 — Wizard Statuts Lda / Unipessoal
- US-3.7 — Wizard Procuration générale/spéciale

**🟠 US-3.4 ACs incomplets :** disclaimer légal, checkbox droit rétractation, bandeau responsabilité civile absents.

**🟡 US-3.2 webhook :** mentionne NRAU mais pas Code Travail (FR-A02-09 partiel).

### Epic 4 — Compliance Dashboard

| Critère | Résultat |
|---------|----------|
| User value | ✅ Oui |
| Indépendance | ✅ Peut fonctionner seul |
| ACs | ✅ Bien définis |
| **Couverture** | ✅ Couvre tous les FRs A03 |

**🟡 Mineur :** US-4.2 mentionne l'export PDF mais pas le mode print CSS (EXPERIENCE.md).
**🟡 Mineur :** US-4.3 couvre "quotidien/hebdo" mais UX définit aussi un paramètre par canal (email/SMS séparément).

### Epic 5 — Luso-Legal

| Critère | Résultat |
|---------|----------|
| User value | ✅ Oui |
| **Couverture PRD** | **🔴 FR-A04-01 (RAG pipeline) absent** |
| ACs | ⚠️ Partiels |

**🔴 Violation critique :** FR-A04-01 (LLM + RAG corpus PT+EU) exige une infrastructure d'indexation. Il n'existe aucune story technique couvrant le pipeline RAG pour le MVP. US-5.1 assume que les données sont disponibles sans en spécifier la construction.

**🟡 US-5.1 ACs incomplets :** interrupt button absent, exact token syntax missing.
**🟡 US-5.1 incohérence langue :** "Support PT + FR + EN" — EN Phase 2 selon PRD.

### Epic 6 — Coffre-Fort & Sécurité

| Critère | Résultat |
|---------|----------|
| User value | ✅ Oui |
| Couverture | ✅ FRs C01-C07 globalement couverts |
| **ACs** | ⚠️ TLS 1.3 (FR-C02) absent des stories |

**🟡 Mineur :** FR-C02 (TLS 1.3) est un NFR infrastructurel — acceptable hors story mais doit apparaître dans les critères de déploiement.

### Analyse Brownfield (Codebase existant)

Le projet dispose déjà d'un frontend en cours (`apps/frontend/`). **Les epics n'ont aucune story d'intégration brownfield.** OQ-002 (EXPERIENCE.md) confirme le besoin d'une revue visuelle.

→ Recommandation : Ajouter une story "Audit et alignement codebase existant" en début d'Epic 1 ou Epic 0.

---

## 6. Summary and Recommendations

### Statut Global de Readiness

> ## 🟠 RÉVISÉ (2026-06-11) — Le code a dépassé les plans : focus finalisation, pas réécriture des epics

**Mise à jour du 2026-06-11 après audit du codebase :** l'évaluation initiale (🔴 NOT READY — 18 issues) portait sur les documents Epics & Stories. Or la vérification du code montre que **l'implémentation a largement dépassé la planification** :

- ~28 pages frontend fonctionnelles (auth, NIF, contrats, documents IA, GED, analyse, recherche RAG, assistant, vault, admin, compliance), trilingue FR/PT/EN
- 70+ endpoints backend (Express 5 + TypeScript), RBAC, chiffrement enveloppe AES-256 + R2, routeur multi-LLM, Qdrant
- **87/87 tests backend passent** (6 suites Jest) — vérifié le 2026-06-11
- **Build de production Next.js compile sans erreur** — vérifié le 2026-06-11
- Dockerfiles et `.env.example` présents pour les deux services

Plusieurs « stories manquantes » identifiées dans ce rapport sont en réalité **déjà implémentées dans le code** (auth Privy, contrat de prestation de services, pipeline RAG avec onglet d'indexation admin). Le verdict initial reste valable pour les documents de planification, mais **réécrire les epics serait du travail rétroactif sans valeur pour la finalisation**. Le plan d'action ci-dessous est donc remplacé par un plan de finalisation orienté lancement.

---

### Issues critiques — action immédiate requise

| # | Issue | Epic concernée | Impact |
|---|-------|---------------|--------|
| C-01 | **Epic 1 incompatible avec Privy auth** — US-1.1 et US-1.2 à réécrire complètement | Epic 1 | Bloquant : tout développement auth sera rejeté à code review |
| C-02 | **3 contrats MVP manquants dans Epic 3** (prestation, statuts Lda, procuration) | Epic 3 | Bloquant : MVP ne livrera pas le périmètre PRD |
| C-03 | **KYC/eIDV absent** — obligation légale Lei 83/2017 | Epic 2 | Bloquant légal : mise en service impossible sans conformité AML |
| C-04 | **Cookie Consent CMP absent** — obligation RGPD/ePrivacy | Epic 1 | Bloquant légal : collecte de données non autorisée sans consentement |
| C-05 | **Génération procuration NIF sans story** (FR-A01-03) | Epic 2 | Bloquant fonctionnel : flow Lucas incomplet |
| C-06 | **Pipeline RAG MVP sans story** (FR-A04-01) | Epic 5 | Bloquant : Luso-Legal ne peut pas fonctionner sans indexation corpus |

### Issues majeures — traiter avant Sprint 1

| # | Issue | Action |
|---|-------|--------|
| M-01 | US-1.1 mentionne EN comme langue — corriger en Phase 2 | Corriger ACs US-1.1 |
| M-02 | US-5.1 mentionne EN — même correction | Corriger ACs US-5.1 |
| M-03 | US-3.4 manque disclaimers légaux et checkboxes contrat | Enrichir ACs US-3.4 |
| M-04 | US-2.4 timeline incomplète (4 vs 5 étapes, SSE absent) | Enrichir ACs US-2.4 |
| M-05 | In-app notification center sans story | Ajouter US-1.6 |
| M-06 | Transmission sécurisée cabinet (FR-A01-07) implicite | Clarifier dans US-2.3 ou ajouter US-2.6 |
| M-07 | Brownfield : aucune story d'intégration codebase existant | Ajouter US-0.1 (Epic 0 ou début Epic 1) |
| M-08 | OQ-007 non résolu : provider KYC (Onfido/Veriff/Privy KYC) | Décision architecture requise |

### Issues mineures — traiter avant fin Sprint 2

| # | Issue | Action |
|---|-------|--------|
| m-01 | Mode print CSS absent (contrat + compliance) | Ajouter ACs US-3.4 et US-4.2 |
| m-02 | Interrupt button stream Luso-Legal | Ajouter AC US-5.1 |
| m-03 | Webhook Code Travail absent (FR-A02-09 partiel) | Ajouter AC US-3.3 |
| m-04 | TLS 1.3 non formalisé en story ou critère infra | Ajouter à Definition of Done |
| m-05 | Bar association RG number [TBD] dans footer | Décision produit avant launch |

---

### Plan d'action de finalisation (mis à jour 2026-06-11 — basé sur l'audit du codebase)

> Le plan initial (réécriture des epics, 10 stories à créer) est **remplacé**. Objectif : lancement en ~2 semaines. Les epics seront mis à jour rétroactivement après lancement, pour documentation uniquement.

**Jour 1 — Sauvegarde et décisions :**

1. **Commiter le travail en cours** — 18 fichiers modifiés + 4 dossiers non versionnés (`apps/frontend/src/app/analysis/`, `documents/`, `ged/`, `services/auth/routes/`) — risque de perte de travail
2. **Décision OQ-007** — choisir le provider KYC (Onfido / Veriff / Privy KYC)
3. **Obtenir les clés live** Stripe et SendGrid

**Jours 2-5 — Bloquants légaux + intégrations réelles (P0) :**

4. **Cookie Consent Banner (CMP)** — absent du code, obligatoire RGPD/ePrivacy avant toute collecte (~1 j) — consent matrix déjà spécifiée dans EXPERIENCE.md
5. **KYC / eIDV dans le wizard NIF** — obligation AML Lei 83/2017 (2-4 j selon provider)
6. **Disclaimers + checkbox rétractation 14 j au checkout contrat** — spec EXPERIENCE.md §Contract Liability (~0,5 j)
7. **Stripe en mode réel** — le paiement NIF est actuellement simulé ; activer clés live + tester le webhook (~1 j)
8. **Email réel** — `services/auth/email.ts` est un mock console ; câbler SendGrid (~0,5 j)

**Jours 6-9 — Mise en production (P1) :**

9. **Infra prod** — migration PostgreSQL (`DATABASE_URL` déjà prévu), R2 en mode réel, secrets (KEK vault en secret manager), hébergement EU
10. **CI/CD** — aucun `.github/workflows` ; pipeline build + tests + deploy (~1 j)
11. **Formulaire contact** — créer `POST /api/contact` (le frontend capture mais ne persiste pas) + remplacer les liens footer `#` (~0,5 j)

**Jours 10-12 — Recette et lancement :**

12. **Tests E2E des parcours payants** — étendre les 4 specs actuelles (auth/NIF) aux contrats et au checkout
13. **Recette complète + lancement**

**Post-lancement (P2) :**

14. **OCR réel** — stub actuel dans `routes/epic10-analysis.ts` ; intégrer Tesseract ou service tiers (ou assumer « PDF uniquement » au lancement)
15. **Webhook NRAU réel** — stub dans `routes/epic8-contracts.ts` ; les templates restent statiques au lancement
16. **Contrats manquants** — Statuts Lda/Unipessoal (FR-A02-05) et Procuration (FR-A02-06) absents des 5 templates en base ; génération procuration NIF (FR-A01-03) à vérifier
17. **Notification center in-app**, mode print CSS, interrupt button Luso-Legal
18. **Mise à jour documentaire des epics** — aligner les stories sur le code livré

---

### État des « stories manquantes » vs codebase (audit 2026-06-11)

| Story identifiée | Priorité initiale | État réel dans le code |
|-------|----------|-----------|
| US-1.1 / US-1.2 (réécriture Privy) | 🔴 Critique | ✅ **Déjà implémenté** — login JWT + Privy fonctionnels |
| US-1.5 — Cookie Consent CMP | 🔴 Critique | ❌ **À faire** — bloquant légal lancement |
| US-1.6 — In-App Notification Center | 🟠 Important | ❌ À faire — post-lancement acceptable |
| US-2.5 — KYC / eIDV | 🔴 Critique | ❌ **À faire** — bloquant légal lancement (OQ-007 à résoudre d'abord) |
| US-2.6 — Génération procuration NIF | 🔴 Critique | ⚠️ À vérifier — flow NIF complet mais génération procuration non confirmée |
| US-3.5 — Wizard Prestation de services | 🔴 Critique | ✅ **Déjà implémenté** — template `prestation_services` en base |
| US-3.6 — Wizard Statuts Lda | 🔴 Critique | ❌ À faire — post-lancement possible si périmètre commercial ajusté |
| US-3.7 — Wizard Procuration | 🔴 Critique | ❌ À faire — post-lancement possible si périmètre commercial ajusté |
| US-5.0 — Pipeline RAG indexation MVP | 🔴 Critique | ✅ **Déjà implémenté** — Qdrant + onglet RAG indexing dans l'admin |

**Bilan : 3 des 10 stories « critiques » sont déjà codées et testées.** Restent 2 bloquants légaux (CMP, KYC), 1 vérification (procuration NIF), et 3 éléments différables post-lancement.

---

### Note finale (révisée 2026-06-11)

L'évaluation initiale a identifié **18 issues** sur les documents de planification — mais l'audit du codebase du 2026-06-11 montre que l'écart réel se situe entre **le code et la production**, pas entre les specs et le code. Le projet est à ~85-90 % d'un produit lançable : 87/87 tests backend verts, build production OK.

Les vrais bloquants de lancement sont au nombre de trois : **CMP cookies** (RGPD/ePrivacy), **KYC/eIDV** (Lei 83/2017) et **disclaimers checkout** (Dir. 2011/83/UE) — auxquels s'ajoutent le passage de Stripe et SendGrid en mode réel et l'infrastructure de production. Estimation : **~2 semaines jusqu'au lancement.**

La mise à jour des Epics & Stories pour refléter le code livré est reléguée en tâche documentaire post-lancement.

---

*Rapport généré par BMAD Check Implementation Readiness v6.8.0 — EasyLaw × ContratoFácil — Porto, Portugal*
*Focus : Fonctionnalités manquantes pour un meilleur UX — 2026-06-10*
*Plan d'action révisé le 2026-06-11 après audit du codebase (tests + build vérifiés)*
