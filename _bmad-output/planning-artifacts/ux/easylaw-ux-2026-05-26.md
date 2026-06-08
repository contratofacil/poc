---
title: "EasyLaw — UX Design Document v1.0"
status: draft
created: 2026-05-26
---

# EasyLaw — UX Design & Parcours Utilisateurs

## 1. Principes de Design

### 1.1 Valeurs UX
- **Confiance avant tout** : interface sobre, professionnelle, signaux de sécurité visibles (cadenas, RGPD, certifications)
- **Simplicité radicale** : un seul appel à l'action par écran, pas de jargon juridique sans explication
- **Transparence** : état du dossier toujours visible, prix affiché avant paiement, pas de surprise
- **Bilingue natif** : PT/FR dès le MVP, switch de langue accessible en 1 clic
- **Mobile-first** : 70%+ des expatriés arrivent via mobile

### 1.2 Palette & Style
- **Couleur primaire** : Bleu profond #1A365D (confiance juridique)
- **Couleur accent** : Or #C9A84C (premium, Portugal)
- **Fond** : Blanc crème #FAFAF8 (documents)
- **Alertes** : Vert #2D7D46 / Orange #E8810A / Rouge #C0392B (compliance)
- **Typographie** : Inter (UI) + Lora (titres juridiques)

---

## 2. Architecture de l'Information

```
EasyLaw
├── Landing Page
├── Accès Grand Public
│   ├── NIF & Starter Pack
│   │   ├── Formulaire NIF
│   │   ├── Upload documents
│   │   ├── Paiement
│   │   └── Suivi dossier
│   ├── Générateur Contrats
│   │   ├── Choix type contrat
│   │   ├── Wizard Q&A
│   │   ├── Prévisualisation PDF
│   │   └── Paiement & Téléchargement
│   ├── Compliance Dashboard
│   │   ├── Vue d'ensemble (tri-couleur)
│   │   ├── Détail obligations
│   │   └── Export rapport PDF
│   └── Luso-Legal Chat
│       ├── Interface chat IA
│       ├── Historique conversations
│       └── Escalade avocat
└── Portail Cabinet (Phase 2)
    ├── Recherche juridique IA
    ├── Analyse documentaire
    ├── Production documents
    └── GED & KMS
```

---

## 3. Parcours Utilisateur 1 — Obtention NIF (Lucas, Expatrié)

### Étape 1 : Découverte
```
[Landing Page]
  - Hero : "Obtenez votre NIF en ligne en 48h"
  - CTA principal : "Commencer mon dossier NIF — 99€"
  - Signaux de confiance : logo AMA, RGPD, 500+ dossiers traités
  - Switch langue PT/FR/EN visible dans le header
```

### Étape 2 : Formulaire NIF (multi-étapes)
```
Étape 1/4 : Informations personnelles
  - Nom complet | Date de naissance | Nationalité
  - Pays de résidence actuel | Adresse (si Portugal)
  - Validation en temps réel à chaque champ
  - Barre de progression : ●○○○

Étape 2/4 : Documents
  - Upload passeport (JPG/PDF, max 10Mo)
  - Upload justificatif domicile
  - Prévisualisation miniature immédiate
  - Indication qualité document (vert/rouge)
  - Barre de progression : ●●○○

Étape 3/4 : Procuration
  - Prévisualisation de la procuration pré-remplie
  - Message : "Oliveira & Carneiro Advogados agira en votre nom"
  - Option : Signature électronique (CMD) [Phase 2] ou Accept coché
  - Barre de progression : ●●●○

Étape 4/4 : Paiement
  - Récapitulatif : NIF Starter Pack — 99€ TTC
  - Stripe (carte) | MB Way (mobile PT) | Virement
  - Garantie : "Si votre NIF n'est pas obtenu, remboursé à 100%"
  - Barre de progression : ●●●●
```

### Étape 3 : Confirmation & Suivi
```
[Page Confirmation]
  - ✓ Dossier n° EL-2026-0847 créé
  - Email de confirmation envoyé à lucas@email.com
  - Délai estimé : 2-5 jours ouvrables
  
[Dashboard Suivi]
  - Timeline : Reçu ✓ | En traitement ○ | NIF obtenu ○ | Notifié ○
  - Bouton "Poser une question à Luso-Legal"
  - Bouton "Créer un contrat de bail maintenant"
  [CTA croisé vers Contrats]
```

---

## 4. Parcours Utilisateur 2 — Génération Bail Résidentiel

### Wizard de génération (7 questions max)

```
Q1 : Qui êtes-vous dans ce contrat ?
  ▷ Propriétaire (bailleur)   ▷ Locataire

Q2 : Durée du bail ?
  ▷ 1 an (renouvelable)   ▷ 2 ans   ▷ 3 ans   ▷ Autre

Q3 : Loyer mensuel ?
  [Champ montant €] + [Indexation IPC : Oui/Non]

Q4 : Dépôt de garantie ?
  ▷ 1 mois   ▷ 2 mois (NRAU max)

Q5 : Clâuses optionnelles ?
  ☑ Animaux autorisés   ☑ Rénovations autorisées   ☑ Sous-location interdite

Q6 : Coordonnées des parties
  [Bailleur] Nom + NIF + Adresse
  [Locataire] Nom + NIF + Adresse

Q7 : Date de début du bail ?
  [Date picker] — minimum : demain

► Générer mon contrat — 19€
```

### Prévisualisation & Paiement
```
[Page Prévisualisation]
  - PDF rendu en temps réel à droite
  - Clauses modifiables à gauche (highlight jaune des zones remplies)
  - Badge : "Conforme NRAU — Mis à jour Mai 2026"
  - CTA : "Payer 19€ et Télécharger"
  - Stripe | MB Way | Apple Pay | Google Pay
  
[Post-paiement]
  - Téléchargement immédiat PDF
  - Stocké dans coffre-fort (AES-256)
  - CTA : "Faire signer électroniquement" [Phase 2 CMD]
  - CTA : "Créer un Compliance Dashboard pour ce bail"
```

---

## 5. Parcours Utilisateur 3 — Luso-Legal Chat

```
[Interface Chat]
  - Header : "Luso-Legal — Assisté par Oliveira & Carneiro"
  - Bulle intro : "Bonjour ! Je suis Luso-Legal, votre assistant
    juridique pour le droit portugais. Je peux répondre à
    vos questions sur les baux, contrats, NIF, sociétés..."
  - Disclaimer visible : "Je fournis des informations juridiques
    générales, pas de conseil personnalisé. Pour votre situation
    spécifique, un avocat du cabinet peut vous répondre en 24h."

[Flux Escalade]
  Dètection : question nécessitant conseil personnalisé
  ↓
  "Cette question mérite l'attention d'un avocat.
   Voulez-vous que je transmette votre question à
   Oliveira & Carneiro ? Réponse garantie en 24h."
  [Oui, transmettre] [Non, continuer]
  ↓
  Déclenchement ticket cabinet + notification avocat
```

---

## 6. Compliance Dashboard — Wireframe

```
┌────────────────────────────────────────────┐
│  CONFORMITÉ — Empresa Exemplo Lda                     │
│  █████ VERT (3)  ███ ORANGE (2)  █ ROUGE (1)         │
├────────────────────────────────────────────┤
│  ✘ ROUGE  Contrat travail Miguel — Expiré il y a 5j  │
│            [Renouveler maintenant]                     │
├────────────────────────────────────────────┤
│  ! ORANGE  Bail commercial — Expire dans 67 jours     │
│            [Voir contrat] [Alerter propriétaire]       │
│  ! ORANGE  Statuts société — Mise à jour due 90j     │
├────────────────────────────────────────────┤
│  ✓ VERT   Assurance RC — Valide jusqu'au 01/03/2027   │
│  ✓ VERT   Contrat prestation Ana — Valide 18 mois     │
│  ✓ VERT   NDA fournisseur — Valide 24 mois            │
├────────────────────────────────────────────┤
│  [Exporter rapport PDF Mai 2026]                       │
└────────────────────────────────────────────┘
```

---

## 7. Design System — Composants Clés

### Boutons
- **Primaire** : Bleu #1A365D, coins arrondis 8px, shadow léger, hover +10% luminosité
- **Secondaire** : Contour bleu, fond transparent
- **Danger/Alerte** : Rouge #C0392B pour actions irréversibles
- **CTA Gold** : Or #C9A84C pour upsells premium

### Cartes (Cards)
- Fond blanc, bordure #E2E8F0 1px, radius 12px, shadow `0 2px 8px rgba(0,0,0,0.08)`
- Hover : shadow renforcée, légère translation Y-2px (micro-animation)

### Formulaires
- Labels flottants (Material Design)
- Validation en temps réel : vert tick / rouge message d'erreur
- Focus ring bleu #1A365D, 2px

### Badges de Conformité
```
[CONFORME NRAU 2024]  — fond vert pâle, texte vert
[MISE À JOUR REQUISE] — fond orange pâle, texte orange
[SIGNÉ CMD eIDAS]    — fond bleu pâle, icône verrou
```

---

## 8. États Vides & Messages d'Erreur

| Écran | État Vide | Message |
|-------|-----------|--------|
| Dashboard Compliance | Aucune échéance | « Tout est en ordre ! Ajoutez vos premiers contrats pour un suivi automatique. » |
| Coffre-Fort | Aucun document | « Votre coffre-fort sécurisé est vide. Générez votre premier contrat ! » |
| Luso-Legal | Premier accès | « Bonjour ! Je suis prêt à répondre à vos questions sur le droit portugais. » |
| Dossiers NIF | Aucun dossier | « Démarrez votre Starter Pack NIF pour commencer votre installation au Portugal. » |

---

## 9. Accessibilité
- Contraste WCAG AA minimum sur tous les textes
- Navigation clavier complète
- Attributs ARIA sur tous les composants interactifs
- Alt text sur toutes les images
- Mode sombre prévu Phase 2

---

*Généré par BMAD Method v6.8.0 — Skill: bmad-ux (CU)*  
*EasyLaw CDC v2.0 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
