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

*Généré par BMAD Method v6.8.0 — Skill: bmad-create-epics-and-stories (CE)*  
*EasyLaw CDC v2.0 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
