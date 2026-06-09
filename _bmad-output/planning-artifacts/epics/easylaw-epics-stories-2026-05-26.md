---
title: "EasyLaw — Epics & User Stories MVP v1.0"
status: draft
created: 2026-05-26
---

# EasyLaw — Epics & User Stories (MVP)

## Épic 1 : Authentification & Gestion de Compte

**Objectif :** Permettre aux utilisateurs de s'inscrire, se connecter et gérer leur profil de manière sécurisée.

### US-1.1 — Inscription
- **En tant que** visiteur
- **Je veux** m'inscrire avec mon email et un mot de passe
- **Afin de** créer mon compte EasyLaw
- **Critères d'acceptation :**
  - [x] Formulaire avec email + mot de passe (min 8 car., 1 maj., 1 chiffre)
  - [x] Vérification email obligatoire avant accès
  - [x] Choix de la langue (PT / FR) à l'inscription
  - [x] Accord CGU + Politique de confidentialité obligatoire
  - [x] Réponse API < 500ms
- **Estimation :** 3 points

### US-1.2 — Connexion
- **En tant que** utilisateur inscrit
- **Je veux** me connecter avec mon email et mot de passe
- **Afin d'** accéder à mes services EasyLaw
- **Critères d'acceptation :**
  - [x] JWT access token (15 min) + refresh token (7j)
  - [x] Blocage après 5 tentatives échouées (cooldown 15 min)
  - [x] Option « Se souvenir de moi »
  - [x] Bouton « Mot de passe oublié » avec lien email sécurisé (expire 1h)
- **Estimation :** 2 points

### US-1.3 — Profil Utilisateur
- **En tant que** utilisateur connecté
- **Je veux** modifier mes informations personnelles
- **Afin de** maintenir mes données à jour
- **Critères d'acceptation :**
  - [x] Modification nom, téléphone, langue préférée
  - [x] Changement email avec re-vérification
  - [x] Export données personnelles (RGPD)
  - [x] Demande de suppression de compte
- **Estimation :** 2 points

### US-1.4 — RBAC Cabinet
- **En tant qu'** administrateur cabinet
- **Je veux** inviter des collaborateurs avec des rôles spécifiques
- **Afin de** contrôler les accès aux dossiers
- **Critères d'acceptation :**
  - [x] Rôles : admin_cabinet, avocat, avocat_junior, client
  - [x] Invitation par email avec lien d'accès (expire 48h)
  - [x] Matrice de permissions : qui voit quoi
  - [x] Log de toutes les actions par rôle (audit trail)
- **Estimation :** 5 points

---

## Épic 2 : NIF & Starter Pack

**Objectif :** Permettre aux expatriés et non-résidents d'obtenir leur NIF portugais via un tunnel digital complet.

### US-2.1 — Formulaire de Demande NIF
- **En tant que** expatrié non-résident
- **Je veux** remplir un formulaire en ligne pour demander mon NIF
- **Afin de** lancer ma demande sans me déplacer au Portugal
- **Critères d'acceptation :**
  - [x] Formulaire multi-étapes (4 étapes) avec barre de progression
  - [x] Validation en temps réel à chaque champ (format, obligatoire)
  - [x] Support PT + FR + EN
  - [x] Sauvegarde automatique du brouillon (ne pas perdre les données)
  - [x] Indications claires sur les documents requis
- **Estimation :** 8 points

### US-2.2 — Upload de Documents
- **En tant que** demandeur NIF
- **Je veux** télécharger mes pièces justificatives
- **Afin de** compléter mon dossier en ligne
- **Critères d'acceptation :**
  - [x] Formats acceptés : JPG, PNG, PDF (max 10 Mo par fichier)
  - [x] Prévisualisation miniature immédiate après upload
  - [x] Indicateur qualité lisibilité (vert/orange/rouge)
  - [x] Chiffrement AES-256 immédiat lors du stockage
  - [x] Maximum 5 fichiers par dossier
- **Estimation :** 5 points

### US-2.3 — Paiement Starter Pack
- **En tant que** demandeur NIF
- **Je veux** payer le Starter Pack (99€) en ligne
- **Afin de** valider mon dossier et lancer le traitement
- **Critères d'acceptation :**
  - [x] Paiement Stripe (carte bancaire)
  - [x] Paiement MB Way (référence générée, expire 24h)
  - [x] Confirmation email immédiate après paiement
  - [x] Facture PDF envoyée automatiquement
  - [x] Garantie remboursé si NIF non obtenu
- **Estimation :** 5 points

### US-2.4 — Suivi de Dossier
- **En tant que** demandeur NIF
- **Je veux** suivre l'état d'avancement de mon dossier
- **Afin de** savoir où j'en suis sans contacter le cabinet
- **Critères d'acceptation :**
  - [x] Timeline visuelle : Reçu > En cours > NIF obtenu > Notifié
  - [x] Notifications email + SMS à chaque changement de statut
  - [x] Délai estimé affiché
  - [x] Bouton contact cabinet si problème
- **Estimation :** 3 points

---

## Épic 3 : Générateur de Contrats

**Objectif :** Permettre de générer des contrats juridiquement conformes via un wizard guidé.

### US-3.1 — Choix du Type de Contrat
- **En tant que** utilisateur connecté
- **Je veux** choisir le type de contrat que je veux générer
- **Afin de** démarrer le bon wizard
- **Critères d'acceptation :**
  - [x] Catalogue de 5 contrats MVP avec description claire
  - [x] Badge « Conforme [Loi] - Mis à jour [Date] » sur chaque contrat
  - [x] Indication du prix avant sélection
  - [x] Exemples de clauses présentés en prévisualisation
- **Estimation :** 2 points

### US-3.2 — Wizard Bail Résidentiel (NRAU)
- **En tant que** propriétaire ou locataire
- **Je veux** générer un bail résidentiel conforme NRAU
- **Afin d'** avoir un contrat légalement validé
- **Critères d'acceptation :**
  - [x] 7 questions maximum dans le wizard
  - [x] Chaque question avec aide contextuelle (info-bulle)
  - [x] Clause d'indexation IPC optionnelle
  - [x] Clauses NRAU (préavis, résiliation, augmentation) auto-injectées
  - [x] Webhook notification si loi NRAU change (template auto-mis à jour)
- **Estimation :** 8 points

### US-3.3 — Wizard Contrat de Travail (CDD/CDI)
- **En tant que** employeur ou employé
- **Je veux** générer un contrat de travail conforme au Código do Trabalho
- **Afin d'** être en règle avec le droit portugais du travail
- **Critères d'acceptation :**
  - [x] Distinction CDD (durée définie) vs CDI (indéterminé)
  - [x] Clauses obligatoires Lei n.º 7/2009 auto-injectées
  - [x] Calcul automatique période d'essai (CDD : 30j, CDI : 90/180j)
  - [x] Opt. clause non-concurrence (durée max 2 ans)
- **Estimation :** 8 points

### US-3.4 — Prévisualisation & Téléchargement PDF
- **En tant que** utilisateur ayant complété le wizard
- **Je veux** visualiser le contrat avant de le payer
- **Afin de** vérifier le contenu avant achat
- **Critères d'acceptation :**
  - [x] PDF rendu en temps réel côté droit de l'écran
  - [x] Zones remplies highlightées en jaune
  - [x] Bouton modifier une réponse (retour wizard)
  - [x] Paiement avant téléchargement (Stripe + MB Way)
  - [x] Stockage automatique dans le coffre-fort après paiement
- **Estimation :** 5 points

---

## Épic 4 : Compliance Dashboard

**Objectif :** Aider les PME à rester conformes avec leurs obligations contractuelles et légales.

### US-4.1 — Ajout d'Obligation
- **En tant que** gérant PME
- **Je veux** ajouter des échéances légales manuellement ou depuis mes contrats
- **Afin de** être alerté avant expiration
- **Critères d'acceptation :**
  - [x] Ajout manuel (type, date, description, entité)
  - [x] Import automatique depuis contrat EasyLaw (détection date)
  - [x] Catégories : Bail, Contrat travail, Statuts, Assurance, Fiscal
- **Estimation :** 3 points

### US-4.2 — Vue Tri-Couleur
- **En tant que** utilisateur PME
- **Je veux** voir en un coup d'œil l'état de ma conformité
- **Afin de** prioriser mes actions
- **Critères d'acceptation :**
  - [x] Barre de statut globale (VERT / ORANGE / ROUGE)
  - [x] Liste détaillée avec délai restant par échéance
  - [x] Actions rapides : renouveler, alerter, archiver
  - [x] Export rapport PDF mensuel
- **Estimation :** 5 points

### US-4.3 — Alertes Automatiques
- **En tant que** utilisateur PME
- **Je veux** recevoir des alertes automatiques avant mes échéances
- **Afin de** ne jamais rater une obligation légale
- **Critères d'acceptation :**
  - [x] CRON quotidien à 07h00 Lisbonne
  - [x] Email + SMS pour ORANGE (90 jours)
  - [x] Email + SMS + escalade cabinet pour ROUGE (< 30 jours)
  - [x] Paramétrage fréquence par utilisateur (quotidien/hebdo)
- **Estimation :** 5 points

---

## Épic 5 : Luso-Legal (Assistant IA)

**Objectif :** Fournir une assistance juridique intelligente 24h/24 sur le droit portugais.

### US-5.1 — Chat IA Juridique
- **En tant que** utilisateur
- **Je veux** poser des questions juridiques en langage naturel
- **Afin d'** obtenir des réponses rapides sur le droit portugais
- **Critères d'acceptation :**
  - [x] Interface chat propre, réponse streamée (pas d'attente)
  - [x] Temps de première réponse < 3 secondes
  - [x] Sources citées (DRE, DGSI) à côté de chaque réponse
  - [x] Disclaimer juridique visible sous chaque réponse
  - [x] Historique de conversation sauvegardé
  - [x] Support PT + FR + EN dans la même conversation
- **Estimation :** 13 points

### US-5.2 — Guardrails & Hors-Périmètre
- **En tant que** système
- **Je veux** refuser les questions hors périmètre du droit portugais
- **Afin d'** éviter les réponses hallucinatoires ou irresponsables
- **Critères d'acceptation :**
  - [x] Détection questions hors périmètre (droit fiscal complexe, contentieux, droit étranger)
  - [x] Réponse polie de refus avec redirection vers avocat
  - [x] Aucune donnée client envoyée pour training LLM
  - [x] Log de toutes les questions refusées (monitoring cabinet)
- **Estimation :** 8 points

### US-5.3 — Escalade Avocat
- **En tant que** utilisateur ayant une question complexe
- **Je veux** être mis en relation avec un avocat du cabinet
- **Afin d'** obtenir un conseil personnalisé
- **Critères d'acceptation :**
  - [x] Bouton « Parler à un avocat » dans l'interface chat
  - [x] Déclenchement automatique si Luso-Legal détecte cas complexe
  - [x] Ticket transmis au cabinet avec historique de la conversation
  - [x] Confirmation « Réponse garantie en 24h ouvrables »
  - [x] Notification avocat (email + notification app cabinet)
- **Estimation :** 5 points

---

## Épic 6 : Coffre-Fort & Sécurité

### US-6.1 — Stockage Documents
- **En tant que** utilisateur
- **Je veux** accéder à tous mes documents depuis mon coffre-fort
- **Afin de** les retrouver facilement et sécurisément
- **Critères d'acceptation :**
  - [x] Liste des documents triés par date, type, statut
  - [x] Prévisualisation en ligne (sans télécharger)
  - [x] Téléchargement individuel ou en archive ZIP
  - [x] Badge « Signé » / « Brouillon » / « Expiré »
  - [x] Historique des versions de chaque document
- **Estimation :** 5 points

### US-6.2 — Audit Trail
- **En tant qu'** administrateur ou avocat
- **Je veux** consulter l'historique complet des actions sur un dossier
- **Afin de** garantir la traçabilité légale
- **Critères d'acceptation :**
  - [x] Chaque action logged : qui, quoi, quand, depuis quelle IP
  - [x] Log immuable (append-only, pas de suppression possible)
  - [x] Export CSV/PDF pour éventuelles procédures
  - [x] Rétention 10 ans (obligations légales portugaises)
- **Estimation :** 5 points

---

## Récapitulatif Sprint MVP

| Épic | User Stories | Points totaux | Priorité |
|------|-------------|--------------|----------|
| 1 — Auth | US-1.1 à 1.4 | 12 pts | MUST |
| 2 — NIF Starter Pack | US-2.1 à 2.4 | 21 pts | MUST |
| 3 — Générateur Contrats | US-3.1 à 3.4 | 23 pts | MUST |
| 4 — Compliance Dashboard | US-4.1 à 4.3 | 13 pts | MUST |
| 5 — Luso-Legal | US-5.1 à 5.3 | 26 pts | MUST |
| 6 — Coffre-Fort | US-6.1 à 6.2 | 10 pts | MUST |
| **TOTAL MVP** | **18 user stories** | **105 points** | |

**Vitesse d'équipe estimée :** 25-30 pts/sprint (2 semaines)  
**Durée estimée MVP :** 4 sprints ≈ 8 semaines → **T3 2026 atteignable**

---

## PHASE 2 — Consolidation (T4 2026)

---

## Épic 7 : Signature CMD (eIDAS Advanced)

**Objectif :** Permettre la signature électronique incontestable via Chave Móvel Digital (AMA).

### US-7.1 — Intégration API AMA
- **En tant que** utilisateur ayant généré un contrat
- **Je veux** signer via ma Chave Móvel Digital
- **Afin d'** obtenir une signature eIDAS Advanced incontestable
- **Critères d'acceptation :**
  - [ ] Connexion sandbox AMA opérationnelle (OAuth2 AMA)
  - [ ] Flux d'authentification CMD : envoi OTP SMS + validation
  - [ ] Gestion des erreurs AMA (timeout, OTP invalide, compte bloqué)
  - [ ] Logs d'audit : chaque tentative d'auth tracée avec IP + timestamp
- **Estimation :** 5 points

### US-7.2 — Signature de contrat via CMD
- **En tant que** client ayant payé son contrat
- **Je veux** déclencher la signature CMD depuis le vault
- **Afin d'** avoir un document signé avec valeur légale eIDAS Advanced
- **Critères d'acceptation :**
  - [ ] Bouton « Signer avec CMD » visible sur tout document en statut Draft
  - [ ] Document envoyé à l'API AMA pour signature (hash SHA-256)
  - [ ] Document signé retourné et stocké dans vault (badge « Signé »)
  - [ ] Email de confirmation avec lien de téléchargement
  - [ ] Audit trail : événement signature avec certificat AMA
- **Estimation :** 5 points

### US-7.3 — Fallback QES + Audit Trail Signature
- **En tant que** utilisateur dont la CMD échoue
- **Je veux** basculer vers un TSP QES alternatif
- **Afin de** pouvoir signer même sans CMD active
- **Critères d'acceptation :**
  - [ ] Détection automatique d'échec CMD → proposition QES
  - [ ] Intégration TSP provider (ex. MULTICERT) pour QES
  - [ ] Audit trail unifié CMD + QES dans la table signature_events
  - [ ] Export PDF de preuve de signature (pour usage juridique)
- **Estimation :** 3 points

---

## Épic 8 : Modèles de Contrats Phase 2

**Objectif :** Ajouter Bail Commercial et NDA au générateur de contrats.

### US-8.1 — Wizard Bail Commercial (NRAU régime commercial)
- **En tant que** entrepreneur
- **Je veux** générer un contrat de bail commercial conforme au NRAU
- **Afin d'** avoir un document légalement sécurisé pour mon local
- **Critères d'acceptation :**
  - [ ] Wizard max 8 questions (réutiliser pattern Epic 3)
  - [ ] Clauses obligatoires NRAU commercial auto-injectées
  - [ ] Webhook NRAU pour mise à jour automatique si législation change
  - [ ] Prévisualisation PDF + paiement Stripe/MB Way avant téléchargement
- **Estimation :** 5 points

### US-8.2 — Wizard NDA / Confidentialité
- **En tant qu'** entrepreneur
- **Je veux** générer un NDA conforme au droit des affaires portugais
- **Afin de** protéger mes informations confidentielles
- **Critères d'acceptation :**
  - [ ] Choix : NDA unilatéral / bilatéral / multilatéral
  - [ ] Durée confidentialité, périmètre, sanctions — configurables
  - [ ] Template Carbone.io validé par Oliveira & Cameiro
  - [ ] Export PDF + stockage vault
- **Estimation :** 3 points

---

## Épic 9 : Recherche Juridique IA (Module B)

**Objectif :** Recherche juridique en langage naturel sur sources PT + EU pour avocats.

### US-9.1 — Interface de Recherche
- **En tant qu'** avocat
- **Je veux** poser une question juridique en langage naturel
- **Afin d'** obtenir une réponse sourcée sur les textes officiels PT + EU
- **Critères d'acceptation :**
  - [ ] Interface dédiée Module B (accès RBAC avocat/admin_cabinet)
  - [ ] Réponse streamée < 3 secondes premier token
  - [ ] Sources citées avec lien direct (DRE, DGSI, CURIA, EUR-Lex)
  - [ ] Génération automatique de résumé et tableau récapitulatif
- **Estimation :** 5 points

### US-9.2 — Indexation RAG Sources Officielles
- **En tant que** système
- **Je veux** indexer en temps réel DRE, DGSI, CURIA, EUR-Lex, CAAD
- **Afin de** fournir des réponses à jour sur la jurisprudence et législation
- **Critères d'acceptation :**
  - [ ] Pipeline d'indexation DRE Série I & II (crawl + embeddings)
  - [ ] Indexation DGSI + CURIA + EUR-Lex (API ou scraping autorisé)
  - [ ] Reranking Cohere v3 (infrastructure déjà présente Epic 5)
  - [ ] Mise à jour incrémentale quotidienne (CRON)
  - [ ] Validation corpus par Oliveira & Cameiro avant prod
- **Estimation :** 8 points

### US-9.3 — Mode DeepDive
- **En tant qu'** avocat
- **Je veux** lancer une recherche approfondie multi-sources
- **Afin d'** obtenir une analyse exhaustive d'une question juridique complexe
- **Critères d'acceptation :**
  - [ ] Mode DeepDive déclenché explicitement (bouton distinct)
  - [ ] Recherche parallèle sur toutes les sources indexées
  - [ ] Génération de fiche de jurisprudence complète
  - [ ] Temps de traitement affiché (indicateur de progression)
- **Estimation :** 5 points

### US-9.4 — Export PDF Recherche
- **En tant qu'** avocat
- **Je veux** exporter ma recherche en PDF professionnel
- **Afin de** l'inclure dans un dossier ou le partager
- **Critères d'acceptation :**
  - [ ] PDF avec entête EasyLaw + mentions légales
  - [ ] Liens cliquables vers chaque source citée
  - [ ] Tableaux et résumés inclus
  - [ ] Stockage automatique dans vault du cabinet
- **Estimation :** 3 points

---

## Épic 10 : Analyse de Documents IA (Module B)

**Objectif :** Analyser jusqu'à 100 documents / 1 500 pages simultanément.

### US-10.1 — Upload Batch Documents
- **En tant qu'** avocat
- **Je veux** uploader jusqu'à 100 documents en une session
- **Afin de** les soumettre à l'analyse IA groupée
- **Critères d'acceptation :**
  - [ ] Formats acceptés : Word, PDF, Excel, images (JPG/PNG), scans
  - [ ] OCR automatique pour documents scannés et images
  - [ ] Limite : 100 docs / 1 500 pages par session
  - [ ] Barre de progression upload + indicateur OCR
  - [ ] Réutiliser pattern upload US-2.2 (drag & drop, qualité visuelle)
- **Estimation :** 5 points

### US-10.2 — Analyse Structurée IA
- **En tant qu'** avocat
- **Je veux** obtenir une analyse structurée du corpus uploadé
- **Afin d'** identifier risques, clauses sensibles et chronologie
- **Critères d'acceptation :**
  - [ ] Résumé structuré (enjeux, parties, rôles, points clés)
  - [ ] Identification clauses sensibles et déséquilibres contractuels
  - [ ] Reconstruction chronologique automatique des faits
  - [ ] Confrontation avec sources PT/EU en temps réel
  - [ ] Conforme RGPD : données isolées du modèle LLM
- **Estimation :** 8 points

### US-10.3 — Export Résultats + Historique
- **En tant qu'** avocat
- **Je veux** exporter les résultats et consulter l'historique des analyses
- **Afin de** constituer la documentation du dossier
- **Critères d'acceptation :**
  - [ ] Export PDF avec citations + liens sources
  - [ ] Export tableaux récapitulatifs (Excel compatible)
  - [ ] Historique des sessions d'analyse dans vault
  - [ ] Rollback one-click vers version précédente d'une analyse
- **Estimation :** 3 points

---

## Épic 11 : Production de Documents IA + Word Add-in (Module B)

**Objectif :** Générer et corriger des documents juridiques depuis Word ou le web.

### US-11.1 — Génération Document depuis NL
- **En tant qu'** avocat
- **Je veux** générer un document juridique depuis une instruction en langage naturel
- **Afin de** produire rapidement des actes de qualité
- **Critères d'acceptation :**
  - [ ] Zone de saisie NL + sélection type de document
  - [ ] Génération basée sur RAG (Epic 9) + templates internes cabinet
  - [ ] Complétion automatique depuis pièces du dossier
  - [ ] Export Word (.docx) et PDF
- **Estimation :** 5 points

### US-11.2 — Microsoft Word Add-in
- **En tant qu'** avocat
- **Je veux** utiliser EasyLaw IA directement dans Microsoft Word
- **Afin de** rédiger et corriger sans quitter mon environnement habituel
- **Critères d'acceptation :**
  - [ ] Add-in Office (manifeste XML + React task pane)
  - [ ] Fonctions : rédiger, corriger, adopter style de référence
  - [ ] Déploiement via manifeste interne (AppSource phase ultérieure)
  - [ ] Auth SSO EasyLaw depuis Word
- **Estimation :** 8 points

### US-11.3 — Anonymisation + Traduction Juridique
- **En tant qu'** avocat
- **Je veux** anonymiser et/ou traduire un document en un clic
- **Afin de** partager des pièces sans exposer les données personnelles
- **Critères d'acceptation :**
  - [ ] Anonymisation : noms, adresses, numéros → [PARTIE A], [ADRESSE]…
  - [ ] Traduction PT / EN / FR / ES avec préservation terminologie juridique
  - [ ] Aperçu des modifications avant application
  - [ ] Stockage original + version anonymisée/traduite dans vault
- **Estimation :** 5 points

### US-11.4 — Système Collaboratif
- **En tant qu'** équipe cabinet
- **Je veux** travailler en temps réel sur un document
- **Afin de** valider et commenter sans aller-retours email
- **Critères d'acceptation :**
  - [ ] Suggestions inline (accepter / refuser) style Google Docs
  - [ ] Système de commentaires avec mentions @avocat
  - [ ] Historique complet des versions avec rollback one-click
  - [ ] Notifications en temps réel (WebSocket)
- **Estimation :** 5 points

---

## Épic 12 : GED & Knowledge Management (Module B)

**Objectif :** Centraliser la base documentaire du cabinet avec organisation IA.

### US-12.1 — Connexion GED Cabinet
- **En tant qu'** admin cabinet
- **Je veux** connecter la base documentaire du cabinet à EasyLaw
- **Afin d'** indexer dossiers, contrats et emails pour recherche IA
- **Critères d'acceptation :**
  - [ ] Import manuel (upload batch) ou connecteur (SharePoint/Drive optionnel)
  - [ ] Indexation automatique IA : catégorisation, tags, priorités, dossiers
  - [ ] Isolation stricte par cabinet (RBAC)
  - [ ] Conforme secret professionnel (Estatuto da Ordem dos Advogados)
- **Estimation :** 5 points

### US-12.2 — Recherche NL Interne + Bibliothèque
- **En tant qu'** avocat
- **Je veux** rechercher dans tous les documents internes du cabinet en langage naturel
- **Afin de** valoriser immédiatement des années d'expertise
- **Critères d'acceptation :**
  - [ ] Interface recherche dédiée (séparée des sources officielles Epic 9)
  - [ ] Résultats avec extraits pertinents et score de pertinence
  - [ ] Bibliothèque centralisée : vue par dossier, type, date, avocat
  - [ ] Suggestions de documents similaires
- **Estimation :** 5 points

### US-12.3 — File de Validation + Reporting Cabinet
- **En tant qu'** admin cabinet
- **Je veux** valider les documents produits par l'IA et suivre les KPIs
- **Afin de** maintenir la qualité et mesurer la productivité
- **Critères d'acceptation :**
  - [ ] File d'attente : documents IA à valider par un avocat
  - [ ] Actions : valider, annoter, demande de modification client
  - [ ] Dashboard reporting : volume dossiers, délais traitement, productivité équipe
  - [ ] Export rapport mensuel PDF
- **Estimation :** 3 points

---

## Épic 13 : API REST Publique

**Objectif :** API pour intégrations tierces (cabinets partenaires, ERP, CRM).

### US-13.1 — Design API + Auth OAuth2 Partenaires
- **En tant que** développeur partenaire
- **Je veux** m'authentifier à l'API EasyLaw avec OAuth2
- **Afin d'** intégrer les services EasyLaw dans mon application
- **Critères d'acceptation :**
  - [ ] Endpoints `/api/v1/` versionnés
  - [ ] Auth OAuth2 client credentials pour partenaires
  - [ ] Rate limiting par partenaire (configurable)
  - [ ] Sandbox environnement pour tests partenaires
- **Estimation :** 3 points

### US-13.2 — Endpoints Contrats / NIF / Compliance + OpenAPI
- **En tant que** développeur partenaire
- **Je veux** accéder aux ressources EasyLaw via REST
- **Afin d'** automatiser les flux dans mon ERP/CRM
- **Critères d'acceptation :**
  - [ ] Endpoints : POST /contracts, GET /nif-files, GET /compliance-items, GET /documents
  - [ ] Documentation OpenAPI 3.0 auto-générée (Swagger UI)
  - [ ] Webhooks : événements contrat signé, statut NIF changé, alerte compliance
  - [ ] SDK JS/TS généré depuis spec OpenAPI
- **Estimation :** 5 points

---

## PHASE 3 — Expansion (S1 2027)

---

## Épic 14 : Module Golden Visa / D7 / Digital Nomads

**Objectif :** Accompagnement résidence et visa PT pour expatriés.

### US-14.1 — Formulaire Golden Visa
- **En tant qu'** expatrié investisseur
- **Je veux** initier ma demande Golden Visa sur EasyLaw
- **Afin d'** être accompagné par Oliveira & Cameiro dans mes démarches
- **Critères d'acceptation :**
  - [ ] Formulaire multi-step (réutiliser pattern US-2.1)
  - [ ] Critères d'éligibilité : investissement immobilier / fonds / transfert capital
  - [ ] Upload documents requis (passeport, justificatifs investissement)
  - [ ] Suivi dossier avec timeline visuelle (pattern US-2.4)
- **Estimation :** 5 points

### US-14.2 — Formulaire D7 / Digital Nomad Visa
- **En tant qu'** expatrié à revenus passifs ou travailleur à distance
- **Je veux** initier ma demande D7 ou Digital Nomad Visa
- **Afin d'** obtenir ma résidence portugaise
- **Critères d'acceptation :**
  - [ ] Vérification revenus minimaux requis (D7 vs DNV)
  - [ ] Checklist documents AIMA (ex-SEF)
  - [ ] Connexion au cabinet pour validation et dépôt dossier
  - [ ] Notifications statut par email + SMS
- **Estimation :** 5 points

### US-14.3 — Paiement Frais Dossier + Notifications
- **En tant qu'** utilisateur du module visa
- **Je veux** payer les frais de service EasyLaw en ligne
- **Afin de** finaliser ma commande sans déplacement
- **Critères d'acceptation :**
  - [ ] Paiement Stripe + MB Way (réutiliser infrastructure Epic 2)
  - [ ] Facture PDF générée automatiquement
  - [ ] Notifications à chaque étape du dossier AIMA
- **Estimation :** 3 points

---

## Épic 15 : i18n Complet PT / EN / FR / ES

**Objectif :** Internationalisation complète (PT et FR déjà livrés en MVP).

### US-15.1 — Extension i18n EN + ES
- **En tant qu'** utilisateur anglophone ou hispanophone
- **Je veux** naviguer sur EasyLaw dans ma langue
- **Afin d'** utiliser la plateforme sans barrière linguistique
- **Critères d'acceptation :**
  - [ ] Ajout locales `en` et `es` dans next-intl (base PT/FR existante)
  - [ ] Traduction 100% de toutes les clés UI existantes
  - [ ] Sélecteur de langue mis à jour (4 options)
  - [ ] Tests i18n : aucune clé manquante en EN + ES
- **Estimation :** 3 points

### US-15.2 — Traduction Templates Contrats (4 langues)
- **En tant qu'** utilisateur non-lusophone
- **Je veux** générer mes contrats dans ma langue préférée
- **Afin d'** en comprendre le contenu avant signature
- **Critères d'acceptation :**
  - [ ] Templates Carbone.io traduits EN + ES (PT + FR déjà existants)
  - [ ] Validation traductions juridiques par Oliveira & Cameiro
  - [ ] Contrat généré dans la langue du profil utilisateur
  - [ ] PDF bilingue optionnel (langue choisie + PT)
- **Estimation :** 5 points

---

## Épic 16 : Module Facturation & Abonnements

**Objectif :** Gérer abonnements récurrents et plans Pro cabinet.

### US-16.1 — Plans d'Abonnement
- **En tant qu'** utilisateur
- **Je veux** choisir un plan adapté à mes besoins
- **Afin d'** accéder aux fonctionnalités correspondantes
- **Critères d'acceptation :**
  - [ ] Plans : Public (pay-per-use), Pro (mensuel), Cabinet (annuel)
  - [ ] Tableau comparatif des plans visible sans connexion
  - [ ] Upgrade / downgrade depuis le tableau de bord
  - [ ] Accès fonctionnalités conditionné par plan (RBAC étendu)
- **Estimation :** 5 points

### US-16.2 — Facturation Récurrente
- **En tant qu'** abonné Pro ou Cabinet
- **Je veux** être facturé automatiquement chaque mois / an
- **Afin de** ne pas interrompre mon accès
- **Critères d'acceptation :**
  - [ ] Stripe Subscriptions + MB Way récurrent (via ifthenpay)
  - [ ] Facture PDF générée et envoyée par email à chaque renouvellement
  - [ ] Gestion échec de paiement : 3 relances + suspension gracieuse
  - [ ] Conformité TVA PT (NIF entreprise sur facture)
- **Estimation :** 5 points

### US-16.3 — Dashboard Facturation Client
- **En tant qu'** abonné
- **Je veux** consulter mon historique de facturation et gérer mon abonnement
- **Afin d'** avoir une vue complète de mes dépenses EasyLaw
- **Critères d'acceptation :**
  - [ ] Historique paiements avec téléchargement PDF par facture
  - [ ] Gestion moyen de paiement (changer carte / MB Way)
  - [ ] Date prochain renouvellement + montant affiché
  - [ ] Bouton annulation abonnement (avec période de grâce 30j)
- **Estimation :** 3 points

---

## Récapitulatif Phase 2 & 3

| Épic | User Stories | Points | Phase | Priorité |
|------|-------------|--------|-------|----------|
| 7 — CMD Signature | US-7.1 à 7.3 | 13 pts | P2 T4 2026 | MUST |
| 8 — Contrats P2 | US-8.1 à 8.2 | 8 pts | P2 T4 2026 | MUST |
| 9 — Recherche IA | US-9.1 à 9.4 | 21 pts | P2 T4 2026 | MUST |
| 10 — Analyse Docs | US-10.1 à 10.3 | 16 pts | P2 T4 2026 | MUST |
| 11 — Production + Word | US-11.1 à 11.4 | 23 pts | P2 T4 2026 | MUST |
| 12 — GED & KMS | US-12.1 à 12.3 | 13 pts | P2 T4 2026 | MUST |
| 13 — API REST | US-13.1 à 13.2 | 8 pts | P2 T4 2026 | SHOULD |
| 14 — Visa Module | US-14.1 à 14.3 | 13 pts | P3 S1 2027 | MUST |
| 15 — i18n complet | US-15.1 à 15.2 | 8 pts | P3 S1 2027 | SHOULD |
| 16 — Facturation | US-16.1 à 16.3 | 13 pts | P3 S1 2027 | MUST |
| **TOTAL P2+P3** | **26 user stories** | **136 points** | | |

**Vitesse estimée :** 25-30 pts/sprint → **Phase 2 : ~4 sprints (T4 2026) / Phase 3 : ~2 sprints (S1 2027)**

---

*Mis à jour 2026-06-08 — EasyLaw CDC v2.0 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
