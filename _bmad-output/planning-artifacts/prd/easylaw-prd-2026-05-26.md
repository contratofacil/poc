---
title: "EasyLaw — Product Requirements Document (PRD) v1.0"
status: draft
version: 1.0
created: 2026-05-26
updated: 2026-05-26
owner: Contrato Fácil, Unipessoal Lda
partner: Oliveira & Carneiro Advogados Associados
---

# EasyLaw — Product Requirements Document (PRD)

## 1. Vue d'Ensemble

### 1.1 Vision Produit

EasyLaw est la première plateforme juridique tout-en-un pour le Portugal : démocratisée pour le grand public, professionnalisée pour les avocats et cabinets, et structurée autour d'une sécurité de niveau bancaire.

### 1.2 Objectifs Business MVP (T3 2026)

| Objectif | Métrique | Cible |
|----------|----------|-------|
| Adoption | Contrats générés/mois | > 500 |
| Conversion | Taux visiteur → client payant | > 60% |
| Satisfaction | NPS grand public | > 50 |
| Vélocité | Délai validation cabinet | < 24h |
| Expatriés | Dossiers NIF/mois | > 100 |
| Performance | Temps réponse assistant IA | < 3 secondes |
| Fiabilité | Uptime mensuel | > 99.9% |

### 1.3 Périmètre MVP

**Inclus :**
- Module A (Grand Public) : NIF Starter Pack, 5 types de contrats, Compliance Dashboard, Luso-Legal v1
- Paiement Stripe + MB Way
- Coffre-fort AES-256
- Interface PT + FR (EN en Phase 2)

**Exclus du MVP :**
- Signature CMD eIDAS (Phase 2)
- Add-in Word (Phase 2)
- Recherche IA juridique complète (Phase 2)
- GED cabinet (Phase 2)
- Module Golden Visa / D7 (Phase 3)

---

## 2. Utilisateurs & Personas

### PERSONA-01 — Lucas (Expatrié Grand Public)
- **Profil :** Français, 34 ans, installé à Lisbonne via Visa D7
- **Objectif :** Obtenir NIF, signer un bail, créer une Lda
- **Frustration :** Procédures opaques, barrière de la langue, coûts opaques
- **Valeur attendue :** Tunnel digital clair, prix fixe, tout en français

### PERSONA-02 — Ana (Avocate - Module Pro)
- **Profil :** Avocate associée à Porto, 41 ans, 15 ans d'expérience
- **Objectif :** Recherche jurisprudence rapide, analyse dossiers
- **Frustration :** 2h+ par recherche manuelle DGSI, aucun outil IA PT
- **Valeur attendue :** Recherche en langage naturel, résultats situés et cités, export PDF

### PERSONA-03 — Miguel (Gérant PME)
- **Profil :** Gérant PME import-export, 52 ans, Porto
- **Objectif :** Rester conforme sans chercher l'info
- **Frustration :** Découvre les problèmes après les délais
- **Valeur attendue :** Alertes automatiques, tableau de bord simple

---

## 3. Exigences Fonctionnelles

### 3.1 MODULE A — Grand Public

#### FR-A01 — NIF & Starter Pack

| ID | Exigence | Priorité | Phase |
|----|----------|----------|-------|
| FR-A01-01 | Formulaire multi-étapes de demande NIF avec validation temps réel des champs | MUST | MVP |
| FR-A01-02 | Upload sécurisé des pièces justificatives (passeport, justificatif domicile) | MUST | MVP |
| FR-A01-03 | Génération automatique de la procuration (modèle Carbone.io) | MUST | MVP |
| FR-A01-04 | Paiement en ligne (Stripe + MB Way) avant transmission au cabinet | MUST | MVP |
| FR-A01-05 | Notifications email + SMS à chaque changement de statut dossier | MUST | MVP |
| FR-A01-06 | Tableau de bord de suivi d'avancement client | MUST | MVP |
| FR-A01-07 | Transmission sécurisée au cabinet Oliveira & Carneiro | MUST | MVP |
| FR-A01-08 | Signature CMD de la procuration (eIDAS Avancé) | SHOULD | Phase 2 |

#### FR-A02 — Générateur de Contrats

| ID | Exigence | Priorité | Phase |
|----|----------|----------|-------|
| FR-A02-01 | Moteur de templates Carbone.io avec table `clause_versions` | MUST | MVP |
| FR-A02-02 | Bail résidentiel (Arrendamento) conforme NRAU — avec clauses augmentation loyer, préavis, résiliation | MUST | MVP |
| FR-A02-03 | Contrat de prestation de services (Code Civil + obligations contractuelles) | MUST | MVP |
| FR-A02-04 | Contrat de travail CDD/CDI (Código do Trabalho — Lei n.º 7/2009) | MUST | MVP |
| FR-A02-05 | Statuts de société Lda/Unipessoal (Code des Sociétés Commerciales) | MUST | MVP |
| FR-A02-06 | Procuration générale/spéciale (Droit civil) | MUST | MVP |
| FR-A02-07 | Wizard de génération guidé (questions → contrat) | MUST | MVP |
| FR-A02-08 | Prévisualisation PDF avant signature/téléchargement | MUST | MVP |
| FR-A02-09 | Webhook législatif : notification automatique changements NRAU + Code Travail | MUST | MVP |
| FR-A02-10 | Mise à jour automatique templates lors changements législatifs | MUST | MVP |
| FR-A02-11 | Bail commercial (NRAU régime commercial) | SHOULD | Phase 2 |
| FR-A02-12 | NDA / Confidentialité | SHOULD | Phase 2 |

#### FR-A03 — Compliance Dashboard

| ID | Exigence | Priorité | Phase |
|----|----------|----------|-------|
| FR-A03-01 | Table `compliance_items` : entity_id, type, due_date, status, notified_at | MUST | MVP |
| FR-A03-02 | Tâche CRON de vérification quotidienne à 07h00 | MUST | MVP |
| FR-A03-03 | Statut VERT : toutes échéances respectées | MUST | MVP |
| FR-A03-04 | Statut ORANGE : expiration dans 90 jours — notification email + SMS | MUST | MVP |
| FR-A03-05 | Statut ROUGE : expiration < 30 jours ou dépassée — alerte immédiate + escalade cabinet | MUST | MVP |
| FR-A03-06 | Export PDF rapport de conformité mensuel | SHOULD | MVP |

#### FR-A04 — Assistant IA Luso-Legal

| ID | Exigence | Priorité | Phase |
|----|----------|----------|-------|
| FR-A04-01 | LLM avec RAG sur corpus juridique PT + EU (DRE, DGSI, EUR-Lex) | MUST | MVP |
| FR-A04-02 | Disponibilité 24h/24, réponse < 3 secondes | MUST | MVP |
| FR-A04-03 | Guardrails automatisés : refus réponses hors périmètre | MUST | MVP |
| FR-A04-04 | Historique de conversation relié au dossier client | MUST | MVP |
| FR-A04-05 | Escalade automatique vers avocat du cabinet pour conseil personnalisé | MUST | MVP |
| FR-A04-06 | Isolation données client du modèle d'entraînement (RGPD) | MUST | MVP |
| FR-A04-07 | Interface de monitoring cabinet (volume questions, thèmes, escalades) | SHOULD | MVP |
| FR-A04-08 | Disclaimer obligatoire sur chaque réponse Luso-Legal | MUST | MVP |

---

### 3.2 MODULE B — Professionnels (Phase 2)

#### FR-B01 — Recherche Juridique IA

| ID | Exigence | Priorité | Phase |
|----|----------|----------|-------|
| FR-B01-01 | Interrogation langage naturel sur sources PT+EU (DRE, DGSI, CURIA, EUR-Lex, AT, BdP, CAAD) | MUST | Phase 2 |
| FR-B01-02 | Réponses toujours situées avec lien direct vers source | MUST | Phase 2 |
| FR-B01-03 | Mode DeepDive : recherche approfondie multi-sources | SHOULD | Phase 2 |
| FR-B01-04 | Génération automatique de synthèses et tableaux | SHOULD | Phase 2 |
| FR-B01-05 | Export PDF avec liens directs vers chaque article/décision | MUST | Phase 2 |
| FR-B01-06 | Génération fiches d'arrêt à partir d'une décision jurisprudence | SHOULD | Phase 2 |

#### FR-B02 — Analyse Documentaire IA

| ID | Exigence | Priorité | Phase |
|----|----------|----------|-------|
| FR-B02-01 | Volume : jusqu'à 100 documents / 1 500 pages simultanément | MUST | Phase 2 |
| FR-B02-02 | Formats : Word, PDF, Excel, scannés, manuscrits, images | MUST | Phase 2 |
| FR-B02-03 | Confrontation aux sources PT/EU en temps réel | MUST | Phase 2 |
| FR-B02-04 | Analyse des risques : clauses sensibles, déséquilibres contractuels, non-conformités | MUST | Phase 2 |
| FR-B02-05 | Reconstitution chronologique automatique des faits | SHOULD | Phase 2 |
| FR-B02-06 | Identification des parties et rôles dans les documents | SHOULD | Phase 2 |
| FR-B02-07 | Export PDF avec citations + tableaux + fiches d'arrêt | MUST | Phase 2 |
| FR-B02-08 | Versioning historique des analyses, retour arrière en un clic | SHOULD | Phase 2 |

---

### 3.3 MODULE C — Coffre-Fort & Sécurité

| ID | Exigence | Priorité | Phase |
|----|----------|----------|-------|
| FR-C01 | Chiffrement AES-256 au repos pour tous les documents stockés | MUST | MVP |
| FR-C02 | TLS 1.3 pour tous les échanges en transit | MUST | MVP |
| FR-C03 | RBAC granulaire : rôles client, avocat, junior, admin | MUST | MVP |
| FR-C04 | Audit trail horodaté de toutes les actions critiques | MUST | MVP |
| FR-C05 | Versioning complet de chaque document avec retour arrière | MUST | MVP |
| FR-C06 | Portabilité des données RGPD : export structuré sur demande | MUST | MVP |
| FR-C07 | Droit à l'oubli : suppression complète sur demande | MUST | MVP |

---

## 4. Exigences Non-Fonctionnelles

### 4.1 Performance

| Exigence | Métrique | Cible |
|----------|----------|-------|
| Temps de réponse API | P95 | < 200ms |
| Temps de réponse Luso-Legal | Première réponse | < 3 secondes |
| Disponibilité | Uptime mensuel | > 99.9% |
| Génération contrat | Temps total | < 30 secondes |
| Upload document | 10 Mo | < 5 secondes |

### 4.2 Sécurité & Conformité

| Standard | Statut | Échéance |
|----------|--------|----------|
| RGPD (UE 2016/679) | Obligatoire | MVP |
| eIDAS Avancé (CMD) | Obligatoire | Phase 2 |
| Secret Professionnel (Ordem Advogados) | Obligatoire | MVP |
| ISO 27001 | Cible | MVP (certification Phase 2) |
| SOC 2 Type II | Planifié | Phase 2 |
| Penetration Tests indépendants | Annuels | Avant chaque release majeure |

### 4.3 Scalabilité
- Architecture microservices : chaque module scale indépendamment
- Hébergement EU : serveurs conformes RGPD, auto-scaling
- Capacité d'analyse simultanée : 100 docs / 1 500 pages
- Sources IA indexées (RAG) : millions de sources PT + EU en temps réel

---

## 5. Intégrations Externes

| Intégration | Usage | Phase | Criticité |
|-------------|-------|-------|-----------|
| **Stripe** | Paiement carte bancaire internationale | MVP | MUST |
| **MB Way** | Paiement mobile portugais | MVP | MUST |
| **AMA / CMD API** | Signature électronique eIDAS Avancé | Phase 2 | MUST |
| **DRE (Webscraping/API)** | Législation officielle PT temps réel | MVP (RAG) | MUST |
| **DGSI** | Jurisprudence tribunaux portugais | Phase 2 | MUST |
| **EUR-Lex** | Droit européen | Phase 2 | MUST |
| **Carbone.io** | Moteur de templates contrats | MVP | MUST |
| **Microsoft Word Add-in SDK** | Intégration Word | Phase 2 | SHOULD |
| **SendGrid / Twilio** | Notifications email + SMS | MVP | MUST |
| **SharePoint / Google Drive / Dropbox** | GED connecteurs | Phase 2 | SHOULD |

---

## 6. Architecture Système (Haute Niveau)

```
┌────────────────────┐  ┌────────────────────┐
│   FRONT-OFFICE      │  │   BACK-OFFICE       │
│   (Grand Public)    │  │   (Cabinet/Pro)     │
│   Next.js / React   │  │   Next.js / React   │
└───────┐───────────┘  └───────┐───────────┘
        │                         │
        └───────┬───────────┘
               │
    ┌───────┴───────┐
    │   API Gateway   │
    │ (Node.js/FastAPI)│
    └───┬──────┬───┘
       │          │
  ┌───┴──┐   ┌┴──────┐
  │ PostgreSQL│   │ LLM + RAG │
  │ + MongoDB  │   │ (Claude/   │
  └─────────┘   │ GPT-4)    │
                  └─────────┘
```

---

## 7. Contraintes & Dépendances

### Contraintes Légales
- Toutes les réponses IA juridiques doivent porter un disclaimer déontologique clair
- La supervision du cabinet Oliveira & Carneiro est obligatoire pour les conseils personnalisés
- Ségrégation stricte des données clients (Estatuto da Ordem dos Advogados)
- Hébergement obligatoire sur serveurs UE (RGPD)

### Dépendances Critiques
1. **AMA API (CMD)** : accord formel requis — délai inconnu (risque Phase 2)
2. **Carbone.io** : moteur de templates — licensing à confirmer pour usage commercial
3. **LLM Provider** : Claude (Anthropic) ou GPT-4 (OpenAI) — dépendance fournisseur IA à monitorer
4. **DRE Série I & II** : accès API/webscraping pour RAG — conditions d'utilisation à valider

---

## 8. Critères d'Acceptation MVP

### AC-MVP-01 : Génération Contrat
- **Étant donné** un utilisateur connecté
- **Quand** il complète le wizard de bail résidentiel
- **Alors** un PDF conforme NRAU est généré en moins de 30 secondes et disponible au téléchargement

### AC-MVP-02 : Dossier NIF
- **Étant donné** un utilisateur ayant payé le Starter Pack
- **Quand** il upload ses pièces et signe la procuration
- **Alors** le dossier est transmis au cabinet dans les 15 minutes et le client reçoit confirmation par email + SMS

### AC-MVP-03 : Luso-Legal
- **Étant donné** un utilisateur posant une question juridique
- **Quand** la question est dans le périmètre du droit portugais
- **Alors** une réponse située (source citée) est fournie en < 3 secondes avec disclaimer visible

### AC-MVP-04 : Compliance Dashboard
- **Étant donné** une PME avec des échéances configurées
- **Quand** une échéance est à < 90 jours
- **Alors** une notification ORANGE est envoyée par email + SMS et le dashboard affiche le statut en temps réel

### AC-MVP-05 : Paiement
- **Étant donné** un utilisateur au checkout
- **Quand** il choisit MB Way
- **Alors** le paiement est finalisé via MB Way sans redirection externe et le service est activé immédiatement

---

## 9. Glossaire

| Terme | Définition |
|-------|-----------|
| CMD | Chave Móvel Digital — système d'authentification et signature officielle portugaise |
| NRAU | Novo Regime do Arrendamento Urbano — régime juridique des baux urbains |
| NIF | Número de Identificação Fiscal — identifiant fiscal portugais |
| RAG | Retrieval-Augmented Generation — technique IA combinant base documentaire et LLM |
| eIDAS | Règlement européen sur la signature électronique (UE n° 910/2014) |
| GED | Gestion Électronique des Documents |
| KMS | Knowledge Management System — système de gestion des connaissances |
| RBAC | Role-Based Access Control |
| DPO | Data Protection Officer (RGPD) |

---

*Généré par BMAD Method v6.8.0 — Skill: bmad-prd (PRD)*  
*EasyLaw CDC v2.0 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
