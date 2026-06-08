# EasyLaw — Session de Brainstorming Stratégique
**Date :** 26 Mai 2026  
**Projet :** EasyLaw — Plateforme Juridique Intelligente pour le Portugal  
**Partenaires :** Contrato Fácil, Unipessoal Lda × Oliveira & Carneiro Advogados Associados  
**Technique :** SCAMPER + Jobs-To-Be-Done + Blue Ocean + Anti-Problem

---

## 1. Angles non explorés dans le CDC v2.0

### 1.1 — Opportunité « Procuration Digitale » pour NIF à distance
Le CDC mentionne le NIF Starter Pack mais ne creuse pas le problème fondamental : **des milliers de non-résidents ont besoin du NIF sans pouvoir se déplacer physiquement au Portugal**. La procuration numérique signée par CMD pourrait être le flux le plus rentable du MVP — frais d'intermédiaire = 100-150€/dossier, volume estimé > 10 000 demandes/an d'après les données AIMA 2025 (9 322 dossiers Visa D8 seul).

**Angle inexploré :** Créer un tunnel 100% asynchrone : formulaire → paiement → procuration pré-remplie → signature CMD → transmission automatique aux Finanças. Zéro interaction humaine pour les cas standards.

### 1.2 — Le « Notaire numérique » comme différenciateur MVP
Le marché portugais n'a pas encore de solution de notariat électronique grand public. EasyLaw pourrait devenir le premier intermédiaire entre le client final et le système CMD pour des actes à valeur légale incontestable, sans cabinet physique. **Angle :** Partenariat avec une TSP certifiée pour offrir des QES (Qualified Electronic Signatures) en fallback automatique.

### 1.3 — Moteur de « Compliance Prédictif » pour PME
Le Compliance Dashboard du CDC est réactif (alertes d'expiration). L'angle inexploré est **prédictif** : en analysant la base de données NRAU et le Code du Travail, EasyLaw pourrait anticiper les obligations légales 6 mois en avance. Exemple : si une PME a un CDD signé le 01/03/2026, alerter automatiquement le 01/09/2026 qu'une décision de renouvellement ou résiliation doit être prise avant le 01/12/2026.

### 1.4 — Communauté « Luso-Expat Network »
Angle non traité dans le CDC : créer une communauté de confiance entre expatriés qui ont déjà utilisé EasyLaw. Chaque client satisfait peut devenir ambassadeur et référencer d'autres expats. **Modèle :** Parrainage = 20€ de crédit. Coût d'acquisition client réduit drastiquement pour une cible qui se trouve principalement dans des groupes Facebook/WhatsApp d'expatriés (100k+ membres actifs).

### 1.5 — API B2B pour Agences Immobilières
Le marché immobilier portugais est en ébullition (Golden Visa, D7, D8). Les agences immobilières ont besoin de générer des baux résidentiels conformes NRAU rapidement. **Angle :** API white-label pour les 5 000+ agences immobilières portugaises. Prix : 50€/mois/agence. Potentiel : 250 000€/mois récurrent.

### 1.6 — « Luso-Legal Junior » — Version Freemium
Le CDC propose un assistant IA premium. L'angle inexploré : une version freemium avec 3 questions juridiques gratuites/mois pour capturer la masse et convertir vers les abonnements payants. **Effet réseau :** chaque réponse gratuite doit inclure un CTA vers le contrat ou dossier correspondant.

### 1.7 — Intégration Contador (Comptable)
Dans le droit portugais, le contabilista certificado (TOC/CC) est obligatoire pour les sociétés. EasyLaw pourrait devenir la plateforme qui connecte PME, avocats ET comptables — un triangle de confiance inexistant actuellement sur le marché digital portugais.

### 1.8 — Module « Divorce & Séparation » simplifié
Les procédures de divorce par consentement mutuel au Portugal sont relativement simples mais mal digitalisées. Angle : wizard guidé avec checklist NRAU pour partage de biens immobiliers, garde alternée, pension alimentaire — tout en automatisant la rédaction des actes. Potentiel : 20 000+ divorces/an au Portugal.

---

## 2. Technique SCAMPER appliquée à EasyLaw

| Lettre | Action | Application EasyLaw |
|--------|--------|---------------------|
| **S** — Substitute | Remplacer quoi ? | Remplacer le rendez-vous cabinet physique par un tunnel digital 100% asynchrone |
| **C** — Combine | Combiner quoi ? | Combiner recherche juridique IA + génération contrat + signature CMD en 1 workflow unifié |
| **A** — Adapt | Adapter quoi ? | Adapter le modèle Haiku (FR) au droit portugais + NRAU + eIDAS portugais |
| **M** — Modify | Modifier quoi ? | Modifier la relation avocat-client : de billable hours → abonnement mensuel récurrent |
| **P** — Put to other uses | Autre usage ? | Utiliser le corpus juridique EasyLaw pour former des avocats juniors — module LMS |
| **E** — Eliminate | Éliminer quoi ? | Éliminer le papier dans les actes notariaux courants — 100% digital |
| **R** — Reverse | Inverser quoi ? | Au lieu que le client cherche un avocat, l'IA identifie le besoin et dispatche vers le bon spécialiste |

---

## 3. Jobs-To-Be-Done (JTBD)

### Segment Grand Public / Expatriés
| Job | Situation | Motivation | Obstacle actuel |
|-----|-----------|------------|-----------------|
| Obtenir mon NIF | Je viens d'arriver au Portugal | Ouvrir un compte bancaire, louer un appartement | Ne sais pas comment, peur de faire des erreurs, barrière langue |
| Signer un bail conforme | Je veux louer un appartement | Être protégé légalement | Les modèles en ligne ne sont pas à jour avec le NRAU 2024 |
| Créer ma société | Je veux lancer mon business au Portugal | Minimiser le risque fiscal et juridique | Procédure opaque, besoin de notaire, frais élevés |
| Comprendre mes droits | Je reçois une lettre juridique | Ne pas me faire arnaquer | Textes en portugais juridique incompréhensible |

### Segment Professionnels / Cabinets
| Job | Situation | Motivation | Obstacle actuel |
|-----|-----------|------------|-----------------|
| Rechercher une jurisprudence | Je prépare un dossier | Gagner le cas, bien servir le client | La recherche manuelle sur DGSI prend des heures |
| Analyser 50 contrats | Due diligence M&A | Ne pas rater une clause risquée | Impossible en temps raisonnable manuellement |
| Mettre à jour mes templates | Une loi vient de changer | Rester conforme, éviter la faute prof. | Aucun outil ne surveille les changements légaux PT |
| Former les juniors | Nouveau collaborateur | Transmettre l'expertise efficacement | Le KMS du cabinet est inexistant ou fragmenté |

---

## 4. Analyse Blue Ocean — Courbe de Valeur

### Facteurs à ÉLIMINER (présents chez concurrents, sans valeur pour client)
- Rendez-vous physique obligatoire pour NIF et actes courants
- Interface complexe réservée aux juristes (langage technique)
- Frais de dossier opaques et variables

### Facteurs à RÉDUIRE
- Temps d'attente pour validation d'un contrat (cible < 24h vs 1-2 semaines)
- Nombre d'intermédiaires dans la chaîne NIF→Signature→Dépôt
- Coût d'accès à un premier conseil juridique

### Facteurs à AUGMENTER
- Couverture sources juridiques PT+EU (temps réel vs bases statiques)
- Vitesse de génération de contrats (secondes vs heures)
- Transparence du processus (tracking en temps réel)

### Facteurs à CRÉER (inexistants sur le marché portugais)
- Compliance prédictif automatique pour PME
- Luso-Legal : assistant IA 24h/24 en PT/FR/EN sur le droit portugais
- Connexion directe CMD eIDAS Avancé intégrée dans le workflow contrat
- Effet réseau avocat↔client↔comptable sur une plateforme unique

---

## 5. Anti-Problem — Ce qu'EasyLaw ne doit PAS faire

- ❌ **Ne pas donner de conseil juridique personnalisé** sans supervision avocat → risque déontologique + réglementaire Ordem dos Advogados
- ❌ **Ne pas stocker de données biométriques** liées à la CMD en dehors de l'infrastructure AMA → responsabilité RGPD
- ❌ **Ne pas prétendre remplacer un avocat** pour les affaires contentieuses → rester dans le périmètre de l'automatisation préventive
- ❌ **Ne pas lancer le module professionnel trop tôt** sans avoir validé l'expérience grand public → risque de dilution de la proposition de valeur
- ❌ **Ne pas sur-promettre sur l'IA** → guardrails obligatoires + disclaimers juridiques clairs sur chaque réponse Luso-Legal

---

## 6. Idées de Monétisation Complémentaires

| Modèle | Description | Revenu Estimé |
|--------|-------------|---------------|
| Freemium → Premium | 3 questions gratuites/mois → 29€/mois grand public | Base large |
| NIF Starter Pack | 99€ tout inclus (NIF + compte bancaire + Finanças) | 100-200 dossiers/mois = 10-20k€ |
| Abonnement Cabinet | 299-999€/mois selon taille | MRR stable |
| API White-label | Agences immo, notaires, comptables | 50€/mois/client B2B |
| Marketplace avocats | Commission 10-15% sur mise en relation | Variable |
| Formation LMS | Modules e-learning droit portugais pour expats | 49€/module |

---

## 7. Risques Identifiés & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Ordem dos Advogados bloque la plateforme | Moyen | Très haut | Partenariat structurant avec cabinet avocat dès le départ (Oliveira & Carneiro) |
| CMD API non accessible en temps voulu | Moyen | Haut | Fallback QES via TSP tiers (eIDEasy, Uanataca) |
| Adoption lente marché professionnel | Haut | Moyen | Commencer par grand public + early adopters avocats |
| Fuite données RGPD | Faible | Très haut | AES-256 + DPA + DPO + Pentest annuel |
| Hallucinations IA sur droit portugais | Haut | Haut | RAG strict sur sources officielles + supervision avocat + disclaimers |

---

*Généré par BMAD Method v6.8.0 — Skill: bmad-brainstorming (BP)*  
*EasyLaw CDC v2.0 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
