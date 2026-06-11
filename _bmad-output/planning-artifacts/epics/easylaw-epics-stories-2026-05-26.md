---
title: "EasyLaw — Epics & User Stories MVP v1.1"
status: draft
created: 2026-05-26
updated: 2026-06-10
changelog:
  - "2026-06-10: Ajout US-1.5 (CMP), US-1.6 (notifications), US-2.5 (KYC), US-2.6 (procuration NIF), US-3.5–3.7 (3 contrats manquants), US-5.0 (RAG pipeline) — réécriture US-1.1/1.2 (Privy) — enrichissement ACs US-2.4, US-3.4, US-5.1, US-3.3"
---

# EasyLaw — Epics & User Stories (MVP)

## Épic 1 : Authentification & Gestion de Compte

**Objectif :** Permettre aux utilisateurs de s'inscrire, se connecter et gérer leur profil de manière sécurisée via Privy embedded.

### US-1.1 — Inscription & Connexion (Privy Embedded Auth)

> ⚠️ **Réécriture v1.1** — US-1.1 et US-1.2 fusionnées. Privy embedded remplace le formulaire email+mot de passe custom. Pas d'écran login custom au MVP (EXPERIENCE.md §Foundation §Auth).

- **En tant que** visiteur ou utilisateur existant
- **Je veux** m'authentifier via Privy embedded (Email OTP, SMS OTP, Passkey, Google, LinkedIn)
- **Afin de** créer mon compte ou accéder à mon espace EasyLaw sans gérer un mot de passe
- **Critères d'acceptation :**
  - [x] Privy SDK initialisé (`<PrivyProvider>` en root layout) avec `appId` configuré en env
  - [x] Méthodes activées : Email OTP, SMS OTP, Passkey, Google OAuth, LinkedIn OAuth
  - [x] Aucun formulaire email+password custom — Privy modal s'ouvre sur CTA login/register
  - [x] Choix de la langue (PT / FR) au premier accès — persisté en cookie 1 an
  - [x] Accord CGU + Politique de confidentialité obligatoire (checkbox avant première action payante)
  - [x] Redirect `?redirect=` préservé après login pour reprendre le flow interrompu
  - [x] Email non-vérifié → banner sticky "Vérifiez votre email pour activer toutes les fonctions"
  - [x] Route privée non-authentifiée → redirect vers modal Privy overlay (pas de page /login dédiée)
  - [x] Réponse Privy SDK < 500ms sur auth OTP
- **Estimation :** 5 points
- **Dépendances :** Privy `appId` configuré (env), décision OQ-007 non bloquante ici

### US-1.2 — Session & Tokens Privy

- **En tant que** utilisateur authentifié
- **Je veux** que ma session soit maintenue de façon sécurisée entre les visites
- **Afin de** ne pas me reconnecter à chaque visite sur le même device
- **Critères d'acceptation :**
  - [x] Access token Privy signé JWT — validé côté serveur sur chaque requête API protégée
  - [x] Refresh automatique du token avant expiration (Privy SDK gère nativement)
  - [x] Option "Se souvenir de moi" → session persistante 30 jours (Privy `sessionLength`)
  - [x] Session expirée → modal Privy non-fermable "Votre session a expiré" + bouton reconnexion
  - [x] Nouvelle connexion sur device inconnu → email de notification de sécurité
  - [x] Blocage après 5 tentatives OTP invalides (cooldown 15 min, géré par Privy)
  - [x] Déconnexion = `privy.logout()` + invalidation token côté API + redirect landing
- **Estimation :** 3 points
- **Dépendances :** US-1.1

### US-1.3 — Profil Utilisateur

- **En tant que** utilisateur connecté
- **Je veux** modifier mes informations personnelles
- **Afin de** maintenir mes données à jour
- **Critères d'acceptation :**
  - [x] Modification nom, téléphone, langue préférée
  - [x] Changement email avec re-vérification via Privy OTP
  - [x] Export données personnelles (RGPD) → archive ZIP téléchargeable sous 24h
  - [x] Demande de suppression de compte → double-saisie du nom requise avant confirmation
- **Estimation :** 2 points
- **Dépendances :** US-1.1

### US-1.4 — RBAC Cabinet

- **En tant qu'** administrateur cabinet
- **Je veux** inviter des collaborateurs avec des rôles spécifiques
- **Afin de** contrôler les accès aux dossiers
- **Critères d'acceptation :**
  - [x] Rôles : `admin_cabinet`, `avocat`, `avocat_junior`, `client`
  - [x] Invitation par email avec lien d'accès (expire 48h)
  - [x] Matrice de permissions : qui voit quoi
  - [x] Log de toutes les actions par rôle (audit trail)
  - [x] Shell sidebar change visuellement pour avocats (liseré `gold` discret)
  - [x] Page 403 dédiée si rôle insuffisant pour une route
- **Estimation :** 5 points
- **Dépendances :** US-1.1, US-1.2

### US-1.5 — Cookie Consent Banner (CMP)

- **En tant que** visiteur sur le site EasyLaw
- **Je veux** être informé des cookies utilisés et pouvoir choisir librement
- **Afin de** contrôler ma vie privée conformément au RGPD et à la Directive ePrivacy
- **Critères d'acceptation :**
  - [x] Banner CMP visible dès la première visite, avant tout cookie non-essentiel
  - [x] 4 catégories : Nécessaires (forcé actif) / Analytique (off par défaut) / Marketing (off par défaut) / Personnalisation (off par défaut)
  - [x] Boutons "Tout accepter" et "Tout refuser" à équivalence visuelle — pas de dark pattern asymétrique
  - [x] Pas de "cookie wall" — accès au site possible avec refus total
  - [x] Choix persisté 12 mois max ; re-consent requis au-delà
  - [x] Lien "Gérer mes cookies" permanent dans le footer (revisiter choix à tout moment)
  - [x] Aucun script analytique ou marketing ne se charge avant consentement
  - [x] Pas de bouton "Continuer" sans choix actif
  - [x] Respect de `prefers-do-not-track` : pas d'analytics si DNT activé
- **Estimation :** 3 points
- **Dépendances :** Aucune (story indépendante — peut être livrée en Sprint 0)

### US-1.6 — In-App Notification Center

- **En tant que** utilisateur connecté
- **Je veux** consulter mes notifications produit en temps réel depuis n'importe quelle page
- **Afin de** ne manquer aucun événement important (statut dossier, compliance, escalade avocat)
- **Critères d'acceptation :**
  - [x] Icône cloche dans le header avec badge numérique (non-lus) — mise à jour temps réel
  - [x] Panneau slide-over : liste des notifications triées par date (les plus récentes en haut)
  - [x] Événements notifiés in-app : étape NIF franchie, NIF bloqué >24h, NIF reçu, contrat généré, paiement échoué, compliance ORANGE, compliance ROUGE, réponse avocat, document partagé, sécurité nouvelle connexion
  - [x] Chaque notification : icône type + texte bref + date relative + lien deep-link vers la surface concernée
  - [x] Marquer comme lu : clic sur notification ou bouton "Tout marquer lu"
  - [x] Archiver / supprimer une notification individuelle
  - [x] Notifications de sécurité et ROUGE non-supprimables (retention forcée 30 jours)
  - [x] Badge disparaît quand toutes les notifications sont lues
  - [x] Transport : SSE (`/api/notifications/stream`) pour le temps réel ; polling 60s fallback si SSE indisponible
- **Estimation :** 5 points
- **Dépendances :** US-1.1, US-1.2

---

## Épic 2 : NIF & Starter Pack

**Objectif :** Permettre aux expatriés et non-résidents d'obtenir leur NIF portugais via un tunnel digital complet, conforme AML (Lei 83/2017).

### US-2.1 — Formulaire de Demande NIF

- **En tant que** expatrié non-résident
- **Je veux** remplir un formulaire en ligne pour demander mon NIF
- **Afin de** lancer ma demande sans me déplacer au Portugal
- **Critères d'acceptation :**
  - [x] Formulaire multi-étapes (4 étapes) avec barre de progression sticky (`role="progressbar"` + `aria-valuenow`)
  - [x] Étapes nommées : "1. Vos informations" / "2. Documents" / "2.5 Vérification identité" / "3. Procuration" / "4. Paiement"
  - [x] Validation en temps réel à chaque champ (format, obligatoire)
  - [x] Support PT + FR (EN en Phase 2)
  - [x] Sauvegarde automatique brouillon toutes les 10s (`PATCH /api/drafts/:id`) avec mention discrète "Brouillon sauvegardé · il y a Xs"
  - [x] Retour arrière possible à tout moment sans perte de données (sauf après paiement)
  - [x] Récap éditable avant submit final
  - [x] Indications claires sur les documents requis
  - [x] Disclaimer KYC visible à l'étape 2.5 : "Cette vérification protège votre dossier et respecte la législation portugaise anti-blanchiment (Lei 83/2017). Vos données KYC sont conservées 7 ans."
- **Estimation :** 8 points

### US-2.2 — Upload de Documents

- **En tant que** demandeur NIF
- **Je veux** télécharger mes pièces justificatives
- **Afin de** compléter mon dossier en ligne
- **Critères d'acceptation :**
  - [x] Formats acceptés : JPG, PNG, PDF (max 10 Mo par fichier)
  - [x] Drag-drop + bouton fallback "Choisir un fichier"
  - [x] Prévisualisation thumbnail immédiate après upload (PDF = page 1, image = miniature)
  - [x] Indicateur qualité lisibilité (vert/orange/rouge) — badge amber si résolution OCR insuffisante sans bloquer
  - [x] Suppression = double confirmation
  - [x] Chiffrement AES-256 immédiat lors du stockage
  - [x] Maximum 5 fichiers par dossier
  - [x] Message sécurité visible : "Vos documents sont chiffrés (AES-256 au repos, TLS 1.3 en transit)."
- **Estimation :** 5 points

### US-2.3 — Paiement Starter Pack

- **En tant que** demandeur NIF
- **Je veux** payer le Starter Pack (99 €) en ligne
- **Afin de** valider mon dossier et lancer le traitement
- **Critères d'acceptation :**
  - [x] Paiement Stripe (carte bancaire)
  - [x] Paiement MB Way (référence générée, expire 24h)
  - [x] TrustBar visible au checkout : TLS + RGPD + Ordem dos Advogados + Stripe/MB Way logos
  - [x] Récap "Pas de prélèvement caché — 99 € TTC, paiement unique, tout inclus"
  - [x] Confirmation email immédiate après paiement
  - [x] Facture PDF envoyée automatiquement (NIF entreprise sur facture)
  - [x] Garantie remboursement si NIF non obtenu
  - [x] Paiement échoué → modal d'erreur + retry automatique après 5s + email confirmation
- **Estimation :** 5 points

### US-2.4 — Suivi de Dossier (Timeline Temps Réel)

- **En tant que** demandeur NIF
- **Je veux** suivre l'état d'avancement de mon dossier en temps réel
- **Afin de** savoir où j'en suis sans contacter le cabinet
- **Critères d'acceptation :**
  - [x] Timeline **5 étapes** : Soumission → Vérification documents → Procuration → Dépôt Finanças → NIF reçu
  - [x] Mobile : timeline verticale, étape actuelle highlightée, étapes passées avec checkmark
  - [x] Desktop : timeline horizontale en haut + détail étape active dessous
  - [x] Updates temps réel via **Server-Sent Events** (`/api/nif/:id/events`) — polling 30s fallback
  - [x] Pas de refresh manuel requis — le statut se met à jour automatiquement
  - [x] Notifications email + SMS à chaque changement de statut
  - [x] Délai estimé affiché par étape
  - [x] Bouton "Contacter le cabinet" apparaît si une étape est bloquée **>24h** sans avancement
  - [x] Page dédiée de succès quand NIF reçu — NIF affiché en `mono` font, copiable en 1 clic
- **Estimation :** 5 points

### US-2.5 — Vérification d'Identité KYC / eIDV

- **En tant que** demandeur NIF ayant uploadé ses documents
- **Je veux** passer une vérification d'identité automatisée avant la génération de ma procuration
- **Afin de** satisfaire aux obligations AML (Lei 83/2017) du cabinet partenaire et protéger mon dossier
- **Critères d'acceptation :**
  - [x] Étape 2.5 insérée entre "Upload documents" (étape 2) et "Procuration" (étape 3) dans le wizard NIF
  - [x] Interface eIDV : instructions claires pour le selfie liveness check (provider à confirmer : Onfido / Veriff / Privy KYC — OQ-007)
  - [x] Comparaison automatique passeport ↔ selfie liveness check
  - [x] PEP screening automatique contre listes OFAC, EU Sanctions, UN
  - [x] Si match PEP → blocage temporaire du flow + escalade humaine cabinet (notification admin_cabinet)
  - [x] Si eIDV réussi → badge "Identité vérifiée" visible sur le dossier
  - [x] Données KYC conservées 7 ans (Art. 26 Lei 83/2017) — séparées des données produit
  - [x] Vocabulaire neutre dans l'UI : "Vérification d'identité" (pas "KYC", pas "anti-blanchiment")
  - [x] Disclaimer affiché : "Cette vérification protège votre dossier et respecte la législation portugaise anti-blanchiment. Vos données sont conservées 7 ans (Lei 83/2017)."
  - [x] Temps maximum eIDV : 3 minutes ; si timeout → message d'erreur + possibilité de relancer
  - [x] En cas d'échec répété (3 tentatives) → escalade manuelle cabinet avec notification
- **Estimation :** 8 points
- **Dépendances :** US-2.2, décision OQ-007 (provider eIDV)
- **Risque :** Délai d'intégration provider eIDV — prévoir spike technique en Sprint 0

### US-2.6 — Génération et Signature de la Procuration NIF

- **En tant que** demandeur NIF ayant passé la vérification d'identité
- **Je veux** que ma procuration soit générée automatiquement et que je puisse la signer
- **Afin de** déléguer au cabinet Oliveira & Carneiro le dépôt de ma demande NIF aux Finanças
- **Critères d'acceptation :**
  - [x] Système génère automatiquement une procuration pré-remplie (Carbone.io) avec les données du wizard
  - [x] PdfPreviewPane : prévisualisation procuration (layout 60/40, mobile = bottom-sheet)
  - [x] Zones pré-remplies highlightées en `brand.secondary` fade 1.5s
  - [x] Tooltip "Pourquoi une procuration ?" explique la délégation au cabinet partenaire
  - [x] Signature à l'écran via canvas (`<canvas>` tactile/souris) — MVP (eIDAS CMD en Phase 2)
  - [x] Bouton "Modifier mes informations" → retour wizard étape 1 sans perte signature
  - [x] Procuration signée stockée chiffrée AES-256 dans le coffre-fort automatiquement
  - [x] Transmission sécurisée (webhook sécurisé HTTPS + signature HMAC) au cabinet Oliveira & Carneiro après paiement validé (US-2.3)
  - [x] Email cabinet : notification nouveau dossier avec lien sécurisé vers la pièce
  - [x] Délai transmission < 15 minutes après paiement (critère AC-MVP-02)
- **Estimation :** 5 points
- **Dépendances :** US-2.5, US-2.3

---

## Épic 3 : Générateur de Contrats

**Objectif :** Permettre de générer les 5 types de contrats juridiquement conformes du MVP via un wizard guidé.

### US-3.1 — Choix du Type de Contrat

- **En tant que** utilisateur connecté
- **Je veux** choisir le type de contrat que je veux générer
- **Afin de** démarrer le bon wizard
- **Critères d'acceptation :**
  - [x] Catalogue de **5 contrats MVP** avec description claire : Bail résidentiel, Prestation de services, Travail CDD/CDI, Statuts Lda, Procuration
  - [x] Badge "Conforme [Loi] — Mis à jour [Date]" sur chaque contrat
  - [x] Indication du prix avant sélection
  - [x] Exemple de clauses en prévisualisation (1ère page floutée pour teaser)
  - [x] Bandeau permanent en haut du wizard : "Modèle généré automatiquement. Conformité validée à la date de génération. Situation atypique ? [Avis d'avocat 49 €]."
- **Estimation :** 2 points

### US-3.2 — Wizard Bail Résidentiel (NRAU)

- **En tant que** propriétaire ou locataire
- **Je veux** générer un bail résidentiel conforme NRAU
- **Afin d'** avoir un contrat légalement validé
- **Critères d'acceptation :**
  - [x] 7 questions maximum dans le wizard
  - [x] Chaque question avec aide contextuelle (tooltip)
  - [x] Clause d'indexation IPC optionnelle
  - [x] Clauses NRAU (préavis, résiliation, augmentation) auto-injectées
  - [x] Webhook NRAU : notification automatique si la loi NRAU change → template auto-mis à jour
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
  - [x] **Webhook Code Travail** : notification automatique si Lei 7/2009 amendée → template auto-mis à jour (même mécanisme que webhook NRAU — US-3.2)
- **Estimation :** 8 points

### US-3.4 — Prévisualisation, Disclaimers Légaux & Téléchargement PDF

- **En tant que** utilisateur ayant complété le wizard
- **Je veux** visualiser le contrat, valider les mentions légales et le payer
- **Afin de** vérifier le contenu et obtenir un document téléchargeable
- **Critères d'acceptation :**
  - [x] Layout split 60/40 : form gauche, PDF preview droite (sticky scroll) — mobile : bottom-sheet
  - [x] Zones remplies highlightées en `brand.secondary` fade 1.5s
  - [x] Bouton "Modifier une réponse" → retour wizard étape concernée
  - [x] **Bandeau responsabilité permanente** visible en haut du wizard et de la preview : "Modèle juridique généré automatiquement à partir de vos réponses. Conformité légale validée à la date de génération. Pour situations atypiques, [demandez un avis d'avocat](#) (49 €)."
  - [x] **Checkbox obligatoire avant paiement** : "J'ai vérifié que les informations saisies correspondent à ma situation. Je comprends que ce modèle ne remplace pas un conseil personnalisé pour cas complexes."
  - [x] **Checkbox droit de rétractation obligatoire** : "Je consens à l'exécution immédiate du service et renonce à mon droit de rétractation de 14 jours, conformément à l'art. 16(m) de la Directive 2011/83/UE."
  - [x] Paiement avant téléchargement (Stripe + MB Way)
  - [x] **Email post-téléchargement** : récapitulatif des données utilisées + offre relecture cabinet 49 €
  - [x] Stockage automatique dans le coffre-fort après paiement
  - [x] **Mode print CSS** : feuille de style print dédiée pour le récap contrat (PME exportent souvent)
  - [x] Génération contrat < 30 secondes (critère AC-MVP-01)
- **Estimation :** 5 points

### US-3.5 — Wizard Contrat de Prestation de Services

- **En tant que** prestataire ou donneur d'ordre
- **Je veux** générer un contrat de prestation de services conforme au Code Civil portugais
- **Afin d'** encadrer légalement ma mission ou celle d'un freelance
- **Critères d'acceptation :**
  - [x] Wizard max 7 questions (réutiliser pattern US-3.2) : parties, objet de la mission, durée, rémunération, conditions paiement, clause résiliation, juridiction compétente
  - [x] Clauses obligatoires Code Civil (Art. 1154 et suivants) auto-injectées
  - [x] Choix : prestation ponctuelle ou récurrente (mensuel / par livrable)
  - [x] Opt. clause de propriété intellectuelle (cession ou licence)
  - [x] Opt. clause de confidentialité simplifiée
  - [x] Template Carbone.io validé par Oliveira & Carneiro
  - [x] Webhook : notification si législation Code Civil prestation de services amendée
  - [x] Preview PDF live + paiement avant téléchargement (pattern US-3.4 — ACs disclaimers inclus)
- **Estimation :** 5 points
- **Dépendances :** US-3.1, US-3.4 (pattern réutilisé)

### US-3.6 — Wizard Statuts de Société Lda / Unipessoal

- **En tant que** entrepreneur souhaitant créer une société au Portugal
- **Je veux** générer des statuts de société Lda ou Unipessoal conformes au Code des Sociétés Commerciales (CSC)
- **Afin d'** avoir les documents nécessaires à l'immatriculation sans passer par un notaire
- **Critères d'acceptation :**
  - [x] Choix initial : Lda (associés multiples) vs Unipessoal Lda (associé unique)
  - [x] Wizard max 8 questions : dénomination sociale, siège social, capital social (min 1 €), objet social, associés et parts, gérant(s) désigné(s), exercice social, pacte d'associés optionnel
  - [x] Validation capital social minimum (1 € pour Lda/Unipessoal depuis 2011)
  - [x] Clauses obligatoires CSC (Art. 197 et suivants) auto-injectées
  - [x] Opt. clause de right of first refusal sur cession de parts
  - [x] Opt. clause de non-concurrence gérant
  - [x] Template validé par Oliveira & Carneiro et conforme au modèle RNPC
  - [x] Disclaimer renforcé : "La constitution effective de la société requiert dépôt au registre commercial (RNPC). Ces statuts sont un document préparatoire. Oliveira & Carneiro peuvent accompagner le dépôt."
  - [x] CTA post-téléchargement : "Besoin d'assistance pour le dépôt RNPC ? [Contacter le cabinet — devis gratuit]"
  - [x] **Note AML** : si capital > 1000 € ou objet social à risque → question complémentaire origine des fonds (conformité Lei 83/2017 Art. 3)
  - [x] Preview PDF live + disclaimers + paiement (pattern US-3.4)
- **Estimation :** 8 points
- **Dépendances :** US-3.1, US-3.4

### US-3.7 — Wizard Procuration Générale / Spéciale

- **En tant que** mandant souhaitant déléguer des pouvoirs juridiques
- **Je veux** générer une procuration générale ou spéciale conforme au droit civil portugais
- **Afin de** permettre à un tiers d'agir en mon nom pour des actes déterminés
- **Critères d'acceptation :**
  - [x] Choix : Procuration générale (tous pouvoirs) vs Procuration spéciale (actes délimités)
  - [x] Wizard max 6 questions : mandant (identité complète), mandataire (identité complète), pouvoirs accordés (liste ou texte libre), durée de validité, possibilité de substitution, format (authentique requis ou sous seing privé suffisant)
  - [x] Aide contextuelle par type de pouvoir : "Vendre un bien immobilier → authentique requis (notaire)" / "Représenter en administration → sous seing privé suffisant"
  - [x] Clauses droit civil (Art. 262 et suivants CC) auto-injectées
  - [x] Opt. clause de révocation à tout moment
  - [x] Disclaimer important : "Une procuration authentique (actes immobiliers, RNPC, certains actes bancaires) requiert intervention notariale — ce document est sous seing privé."
  - [x] Template validé par Oliveira & Carneiro
  - [x] Preview PDF live + disclaimers + paiement (pattern US-3.4)
- **Estimation :** 5 points
- **Dépendances :** US-3.1, US-3.4

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
  - [x] Barre de statut globale (VERT / ORANGE / ROUGE) — jamais basé sur couleur seule : toujours doublé d'icône + label textuel (accessibilité daltonisme)
  - [x] Liste détaillée avec délai restant par échéance
  - [x] Actions rapides : renouveler, alerter, archiver
  - [x] Export rapport PDF mensuel
  - [x] **Mode print CSS** : feuille de style print dédiée pour le rapport compliance (clients PME exportent souvent)
  - [x] Swipe-left mobile sur une obligation = archive ; swipe-right = marquer urgent (avec confirmation toast)
- **Estimation :** 5 points

### US-4.3 — Alertes Automatiques

- **En tant que** utilisateur PME
- **Je veux** recevoir des alertes automatiques avant mes échéances
- **Afin de** ne jamais rater une obligation légale
- **Critères d'acceptation :**
  - [x] CRON quotidien à 07h00 Lisbonne (Europe/Lisbon)
  - [x] Email + SMS pour ORANGE (90 jours avant)
  - [x] Email + SMS + escalade cabinet pour ROUGE (< 30 jours ou dépassée)
  - [x] Paramétrage fréquence par utilisateur (quotidien/hebdo) **et par canal** (email activable/désactivable séparément du SMS) depuis `/compliance/settings`
  - [x] Notifications SMS et ROUGE non-désactivables (rétention forcée — devoir d'alerte)
- **Estimation :** 5 points

---

## Épic 5 : Luso-Legal (Assistant IA)

**Objectif :** Fournir une assistance juridique intelligente 24h/24 sur le droit portugais, alimentée par un corpus RAG indexé.

### US-5.0 — Pipeline RAG : Indexation Corpus Juridique MVP

- **En tant que** système Luso-Legal
- **Je veux** disposer d'un corpus juridique PT + EU indexé et à jour
- **Afin de** fournir des réponses sourcées et factuellement exactes sur le droit portugais
- **Critères d'acceptation :**
  - [x] Sources MVP indexées : DRE Série I (législation), DRE Série II (actes administratifs pertinents), EUR-Lex (directives EU applicables au PT)
  - [x] Pipeline d'ingestion : crawl → extraction texte → chunking sémantique → embeddings → stockage vectoriel
  - [x] Modèle d'embeddings : à confirmer en arch (OpenAI text-embedding-3-large ou équivalent)
  - [x] Store vectoriel : à confirmer en arch (pgvector sur PostgreSQL existant ou Qdrant)
  - [x] Mise à jour incrémentale quotidienne (CRON 03h00 Lisbonne) — seuls les nouveaux documents sont réindexés
  - [x] Isolation stricte : aucune donnée client n'est mélangée au corpus juridique
  - [x] Validation du corpus par Oliveira & Carneiro avant mise en production (sample test de 50 questions-réponses)
  - [x] Métriques de santé pipeline : nombre de documents indexés, dernière mise à jour, couverture par source — visible dans `/admin`
  - [x] Si crawl DRE échoue → alerte technique (Slack/email dev) sans interruption du service (corpus précédent maintenu)
  - [x] RGPD : aucune donnée personnelle dans le corpus (scraping sources publiques uniquement)
- **Estimation :** 8 points
- **Dépendances :** Décisions architecture (vector store, modèle embeddings) — spike technique recommandé en Sprint 0
- **Risque :** Conditions d'utilisation DRE (scraping à valider) — prévoir fallback API officielle ou accord partenariat

### US-5.1 — Chat IA Juridique

- **En tant que** utilisateur
- **Je veux** poser des questions juridiques en langage naturel
- **Afin d'** obtenir des réponses rapides et sourcées sur le droit portugais
- **Critères d'acceptation :**
  - [x] Interface chat propre — layout 2-pane desktop (threads gauche, conversation droite), plein écran mobile
  - [x] Réponse **streamée token-by-token** (~40 tok/s perçu), curseur clignotant sous le dernier token
  - [x] **Bouton "Interrompre"** visible dès le début du stream — clic = stop côté serveur + bulle finalisée à l'état courant
  - [x] Temps de première réponse (TTFT) < 3 secondes
  - [x] Sources citées (DRE, DGSI) rendues en `mono` font, cliquables, ouvrant un side-panel avec extrait + lien externe
  - [x] Sources ajoutées en bas de la bulle à la fin du stream — chacune avec extrait au hover
  - [x] **Disclaimer footer permanent** sous la zone de saisie (jamais retiré, jamais minimisé) : "Information générale — ne constitue pas un conseil juridique personnalisé."
  - [x] Zone messages `aria-live="polite"` + `aria-busy="true"` pendant stream ; curseur clignotant `aria-hidden="true"`
  - [x] **`prefers-reduced-motion`** : curseur statique (pas de blink), transitions désactivées
  - [x] Historique de conversation sauvegardé et relié au dossier client
  - [x] Support PT + FR dans la même conversation (EN en Phase 2)
  - [x] Skeleton screens sur la liste des threads (pas de spinner centré)
  - [x] Timeout 30s sur appel LLM → message "Le service prend plus de temps que prévu" + bouton Retry
- **Estimation :** 13 points
- **Dépendances :** US-5.0 (corpus RAG opérationnel)

### US-5.2 — Guardrails & Hors-Périmètre

- **En tant que** système
- **Je veux** refuser les questions hors périmètre du droit portugais
- **Afin d'** éviter les réponses hallucinatoires ou irresponsables
- **Critères d'acceptation :**
  - [x] Détection questions hors périmètre (droit fiscal complexe, contentieux, droit étranger)
  - [x] Réponse polie de refus avec redirection vers avocat : "Cette question dépasse mon périmètre — je vous recommande de contacter un avocat."
  - [x] CTA escalade visible dans la bulle de refus
  - [x] Aucune donnée client envoyée pour training LLM
  - [x] Log de toutes les questions refusées (monitoring cabinet — métriques US-5.0)
- **Estimation :** 8 points
- **Dépendances :** US-5.0, US-5.1

### US-5.3 — Escalade Avocat

- **En tant que** utilisateur ayant une question complexe
- **Je veux** être mis en relation avec un avocat du cabinet
- **Afin d'** obtenir un conseil personnalisé
- **Critères d'acceptation :**
  - [x] Bouton "Parler à un avocat" toujours visible à droite du header de la conversation (US-5.1)
  - [x] Déclenchement automatique si Luso-Legal détecte cas complexe → proposition escalade
  - [x] Sheet d'escalade : "Pour un avis personnalisé, nos avocats d'Oliveira & Carneiro peuvent vous répondre sous 24h ouvrées (consultation 49 €)." Récap automatique de la conversation préparé.
  - [x] Paiement consultatoin 49 € (Stripe + MB Way) — même infrastructure Epic 2
  - [x] Ticket transmis au cabinet avec historique de la conversation
  - [x] Confirmation "Réponse garantie en 24h ouvrables"
  - [x] Notification avocat (email + notification app cabinet)
  - [x] Réponse avocat dans `/assistant/:threadId` avec badge "Réponse avocat — vérifiée" et sans disclaimer IA
- **Estimation :** 5 points
- **Dépendances :** US-5.1

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
  - [x] Badge "Signé" / "Brouillon" / "Expiré"
  - [x] Historique des versions de chaque document
  - [x] Indicateur "chiffré" visible sur chaque document + lien politique de sécurité
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

## Récapitulatif Sprint MVP — v1.1

| Épic | User Stories | Points totaux | Priorité |
|------|-------------|--------------|----------|
| 1 — Auth | US-1.1 à 1.6 | **18 pts** (+6 vs v1.0) | MUST |
| 2 — NIF Starter Pack | US-2.1 à 2.6 | **36 pts** (+15 vs v1.0) | MUST |
| 3 — Générateur Contrats | US-3.1 à 3.7 | **41 pts** (+18 vs v1.0) | MUST |
| 4 — Compliance Dashboard | US-4.1 à 4.3 | 13 pts | MUST |
| 5 — Luso-Legal | US-5.0 à 5.3 | **34 pts** (+8 vs v1.0) | MUST |
| 6 — Coffre-Fort | US-6.1 à 6.2 | 10 pts | MUST |
| **TOTAL MVP** | **28 user stories** (+10 vs v1.0) | **152 points** (+47 vs v1.0) | |

**Vitesse d'équipe estimée :** 25-30 pts/sprint (2 semaines)
**Durée estimée MVP révisée :** 5-6 sprints ≈ 10-12 semaines → **T3 2026 atteignable si Sprint 0 démarré immédiatement**

> ⚠️ **Attention calendrier :** L'ajout de 47 points (KYC, Privy auth, 3 contrats, RAG pipeline, CMP) repousse le MVP de ~2 sprints vs estimation v1.0. À arbitrer avec les stakeholders si T3 2026 est une contrainte ferme.

### Stories critiques à traiter en Sprint 0 (avant implémentation)

| Story | Raison |
|-------|--------|
| US-5.0 — RAG pipeline | Spike technique : choix vector store + validation DRE scraping |
| US-2.5 — KYC/eIDV | Décision provider (OQ-007) + évaluation coût/intégration Privy KYC |
| US-1.1 — Auth Privy | Configuration `appId` Privy + validation sandbox |
| US-1.5 — CMP | Choix solution CMP (Axeptio, Cookiebot, custom) |

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
  - [ ] Bouton "Signer avec CMD" visible sur tout document en statut Draft
  - [ ] Document envoyé à l'API AMA pour signature (hash SHA-256)
  - [ ] Document signé retourné et stocké dans vault (badge "Signé")
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
  - [ ] Template Carbone.io validé par Oliveira & Carneiro
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
  - [ ] Validation corpus par Oliveira & Carneiro avant prod
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
- **Afin d'** être accompagné par Oliveira & Carneiro dans mes démarches
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
  - [ ] Validation traductions juridiques par Oliveira & Carneiro
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

---

*Mis à jour 2026-06-10 — EasyLaw CDC v2.1 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
*v1.1 : +10 stories MVP, réécriture auth Privy, enrichissement 6 stories existantes (readiness assessment 2026-06-10)*
