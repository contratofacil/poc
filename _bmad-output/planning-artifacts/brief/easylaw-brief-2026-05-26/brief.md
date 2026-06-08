---
title: "EasyLaw — Product Brief v1.0"
status: draft
created: 2026-05-26
updated: 2026-05-26
source: CDC v2.0 PRO + Brainstorming BMAD
---

# EasyLaw — Product Brief

## Le Problème

Le Portugal est l'un des pays européens les plus attractifs pour les expatriés, entrepreneurs et nomades digitaux — mais son système juridico-administratif reste opaque, fragmenté et inaccessible en dehors des cabinets d'avocats traditionnels. Simultanément, les avocats et juristes portugais travaillent encore avec des outils du passé : recherche manuelle sur DGSI, templates Word non maintenus, aucune IA juridique adaptée au droit local.

**Deux problèmes distincts, un écosystème commun :**
1. Le grand public et les PME ne peuvent pas accéder simplement à des contrats conformes, des démarches NIF, ou comprendre leurs obligations légales sans payer des honoraires d'avocat inaccessibles.
2. Les avocats et cabinets n'ont pas d'outils IA adaptés au corpus juridique portugais pour faire de la recherche rapide, analyser des volumes de documents ou maintenir leur knowledge base.

## La Solution

**EasyLaw** est la première plateforme juridique tout-en-un pour le Portugal, conçue en partenariat stratégique entre **Contrato Fácil** (tech) et **Oliveira & Carneiro Advogados** (juridique). Elle couvre les deux segments en créant un effet réseau naturel : chaque client grand public devient un prospect qualifié pour le cabinet partenaire.

### Segment Grand Public — « Accès au Droit Démocratisé »
- **NIF & Starter Pack** : obtention du NIF en ligne, assistance compte bancaire, enregistrement Finanças — tunnel 100% digital avec procuration CMD
- **Générateur de contrats** : 5 types dès le MVP (bail résidentiel NRAU, prestation de services, CDD/CDI, statuts Lda, procuration) — conformes, à jour, signés en ligne
- **Compliance Dashboard** : système d'alertes tri-couleur (VERT/ORANGE/ROUGE) anticipant les échéances légales des PME
- **Luso-Legal** : assistant IA 24h/24 formé sur le droit portugais, avec escalade avocat pour les cas complexes

### Segment Professionnel — « IA Juridique Grade Cabinet »
- **Recherche juridique IA** : millions de sources PT+EU (DRE, DGSI, CURIA, EUR-Lex, AT, BdP) en temps réel, mode DeepDive multi-sources
- **Analyse documentaire** : jusqu'à 100 documents / 1 500 pages simultanément — synthèse, risques, chronologie, acteurs
- **Production IA + Add-in Word** : génération depuis une phrase, style adaptatif, anonymisation, traduction PT/EN/FR/ES
- **GED + KMS** : base de connaissances du cabinet, organisation IA, file de validation avocat

## Qui est le Client

### Persona 1 — Lucas, 34 ans, Français installé à Lisbonne (Visa D7)
> « J'ai passé 3 semaines à chercher comment obtenir mon NIF. J'ai fini par payer 150€ à une agence dont je ne savais pas si elle était sérieuse. Puis mon propriétaire m'a envoyé un bail qui ne méritait pas ce nom. »

- **Douleur principale** : opacité administrative + barrière linguistique
- **JTBD** : obtenir son NIF, signer un bail conforme NRAU, créer une société Lda
- **Prix acceptable** : 49-99€ one-shot ou 19-29€/mois

### Persona 2 — Ana, 41 ans, avocate associée à Porto
> « Je passe encore 2h par recherche sur DGSI. J'ai vu Haiku en France — si quelqu'un faisait ça pour le droit portugais, je signerais immédiatement. »

- **Douleur principale** : temps perdu en recherche + pas d'outil IA adapté au droit PT
- **JTBD** : recherche rapide jurisprudence, analyse dossiers M&A, production documentaire assistée
- **Prix acceptable** : 299-599€/mois/avocat

### Persona 3 — Miguel, 52 ans, gérant de PME à Porto (import-export)
> « Je sais que j'ai des obligations légales à respecter mais je découvre les problèmes quand il est trop tard, toujours après la date limite. »

- **Douleur principale** : conformité réactive vs préventive
- **JTBD** : être alerté avant l'expiration de ses obligations, avoir ses contrats à jour
- **Prix acceptable** : 49-99€/mois PME

## Avantage Décisif

EasyLaw est la **seule plateforme** au Portugal qui :
1. Couvre simultanément grand public ET professionnels (aucun concurrent ne le fait)
2. Intègre CMD eIDAS Avancé nativement dans le workflow contrat (pas de redirect externe)
3. Supporte MB Way (paiement mobile portugais incontournable, absent chez tous les concurrents tech)
4. Opère sous supervision juridique permanente d'un cabinet d'avocats partenaire
5. Dispose d'un webhook législatif (NRAU + Code du Travail) pour la mise à jour automatique des templates

## Marché & Opportunité

- **Legaltech Portugal** : marché naissant (~30 acteurs identifiés), aucun leader etabli, ouverts aux solutions intégral
- **Expatriés** : 9 322 dossiers Visa D8 seul en 2025, + Visa D7, Golden Visa — chaque dossier = besoin NIF + contrats
- **PME portugaises** : 1,2M d'entreprises au Portugal, majorité sans outil de gestion légale digitale
- **Avocats au Portugal** : ~28 000 avocats inscrits à l'Ordem, sous-équipés en outils IA

## Modèle Économique

| Segment | Produit | Prix | Revenu Cible MVP |
|---------|---------|------|------------------|
| Grand public | NIF Starter Pack | 99€ one-shot | 150/mois = 14,8k€ |
| Grand public | Abonnement Essentiel | 19€/mois | 500 abonnés = 9,5k€ |
| PME | Abonnement Business | 79€/mois | 200 PME = 15,8k€ |
| Cabinets | Abonnement Pro | 399€/mois | 50 cabinets = 19,9k€ |
| **Total MRR MVP** | | | **~60k€/mois** |

## Ce que ce Brief N'est Pas

- Ce n'est pas une plateforme ODR (résolution de litiges) — hors périmètre Ordem dos Advogados
- Ce n'est pas un remplacement d'avocat pour les affaires contentieuses
- Ce n'est pas une solution générique multi-pays — ancrée exclusivement dans le droit portugais + EU

## Questions Ouvertes

- [ ] Accord formel AMA pour accès API CMD en pré-production — délai ?
- [ ] Modèle de revenus du cabinet Oliveira & Carneiro (référals ? partage SaaS ?)
- [ ] Stratégie go-to-market Lisbonne vs Porto vs Digital ?
- [ ] LLM propriétaire vs Claude/GPT-4 — dépendance fournisseur IA
- [ ] Roadmap ISO 27001 : délais et coûts pour certification MVP

## Roadmap Haute Priorité

**Phase 1 — MVP T3 2026 (En cours)**
- 5 templates contrats conformes NRAU + Code du Travail
- NIF Starter Pack digital
- Compliance Dashboard
- Luso-Legal v1 (RAG + guardrails)
- Paiement Stripe + MB Way
- Coffre-fort AES-256

**Phase 2 — T4 2026**
- Signature CMD eIDAS Avancé
- Add-in Word
- GED + KMS cabinet
- Recherche IA juridique (sources PT+EU temps réel)
- API REST publique

**Phase 3 — S1 2027**
- Golden Visa / D7 / Nomades digitaux
- i18n PT/EN/FR
- Luso-Legal supervisé (production)
- Module facturation

---

*Généré par BMAD Method v6.8.0 — Skill: bmad-product-brief (CB)*  
*EasyLaw CDC v2.0 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
