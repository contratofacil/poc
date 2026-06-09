# EasyLaw — ContratoFacil POC

> Preuve de concept (POC) de **EasyLaw**, la plateforme juridique intelligente pour le Portugal.
> Édité par **Contrato Fácil, Unipessoal Lda** & **Oliveira & Cameiro Advogados Associados** (Porto, Portugal).

EasyLaw combine deux segments complémentaires :

1. **Grand public** (expatriés, entrepreneurs, PME) — démarches administratives, génération de contrats conformes, assistant juridique 24h/24.
2. **Professionnels du droit** (avocats, cabinets) — recherche IA, analyse documentaire, production de documents.

Ce dépôt contient le POC du **MVP (Phase 1)** : NIF Starter Pack, générateur de contrats, compliance dashboard, assistant Luso-Legal, coffre-fort et authentification.

> 📄 Le cahier des charges complet est dans [`docs/`](docs/) (`EasyLaw CDC v2.0 PRO.pdf`).

## Architecture

Monorepo géré avec **npm workspaces**.

```
contratofacil/
├── apps/
│   └── frontend/        # Application web Next.js 16 / React 19 / Tailwind 4
├── services/
│   └── auth/            # API backend Express 5 / TypeScript / SQLite (auth, NIF,
│                        # contrats, vault, assistant, compliance, admin)
├── docs/                # Cahier des charges (CDC) et extraits
└── _bmad* / .claude/    # Outillage de développement (non versionné pour .claude)
```

### Stack technique

| Composant      | Technologie                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | Next.js 16, React 19, Tailwind CSS 4, react-hook-form, zod |
| Backend API    | Node.js, Express 5, TypeScript                           |
| Base de données| SQLite (POC) — PostgreSQL prévu en production            |
| Auth           | JWT (jsonwebtoken) + bcryptjs                            |
| Tests          | Jest, ts-jest, supertest                                |

## Prérequis

- Node.js ≥ 20
- npm ≥ 10

## Installation

```bash
# À la racine du monorepo
npm install
```

## Démarrage

### Backend — service d'authentification & API

```bash
cd services/auth
cp .env.example .env # première fois — éditer JWT_SECRET, DATABASE_URL, etc.
npm start            # ts-node server.ts (port 3000 par défaut, configurable via PORT)
```

> ⚠️ Le frontend Next.js utilise aussi le port 3000 par défaut. Lancez l'API sur un autre
> port pour éviter la collision, par ex. : `PORT=4000 npm start`.

#### Coffre-fort documents (story 6-3)

Le service `auth` stocke les PDF de contrats et les pièces NIF dans **Cloudflare R2**
(juridiction UE) avec chiffrement applicatif **AES-256-GCM (envelope encryption :
DEK par fichier wrappée par une KEK maître)**.

- **Mode dev / POC** : `VAULT_DRIVER=local` (défaut hors production). Les fichiers
  vivent en mémoire dans le process Node — pratiques pour les tests, perdus au redémarrage.
- **Mode prod** : `VAULT_DRIVER=r2`. Le serveur refuse de démarrer si une des variables
  R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`) ou
  la `VAULT_KEK_B64` est absente / mal formée.

Pour générer une KEK :

```bash
openssl rand -base64 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

⚠️ **La KEK doit être sauvegardée hors-bande (secret manager).** Sa perte rend
tous les documents chiffrés irrécupérables. Voir `services/auth/.env.example` pour le détail.

### Frontend — application web

```bash
cd apps/frontend
npm run dev          # http://localhost:3000
```

## Tests

```bash
# Service auth (suite Jest avec supertest)
cd services/auth
npm test
```

## Principaux endpoints de l'API

Tous préfixés par l'URL du service auth (ex. `http://localhost:4000`).

| Domaine     | Endpoints (extrait)                                                  |
| ----------- | ------------------------------------------------------------------- |
| Auth        | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT/DELETE /api/auth/profile` |
| NIF         | `POST /api/nif/apply`, `POST /api/nif/payment`, `GET /api/nif/status` |
| Contrats    | `GET /api/contracts/templates`, `POST /api/contracts/generate`      |
| Coffre-fort | `GET /api/vault/documents`, `GET /api/vault/audit`                  |
| Assistant   | `POST /api/assistant/chat`, `GET /api/assistant/history`            |
| Compliance  | `GET/POST /api/compliance`, `PUT/DELETE /api/compliance/:id`        |
| Admin       | `GET/PUT /api/admin/settings`, `GET /api/admin/clauses`             |

## Roadmap

- **Phase 1 — MVP (T3 2026)** : 5 templates de contrats, NIF Starter Pack, Compliance Dashboard, Luso-Legal v1, Stripe + MB Way, coffre-fort AES-256. *(POC actuel)*
- **Phase 2 — Consolidation (T4 2026)** : signature CMD (eIDAS), Add-in Word, GED + KMS, recherche IA juridique, analyse 100 docs, API REST publique.
- **Phase 3 — Expansion (S1 2027)** : Golden Visa / D7, i18n PT/EN/FR, Luso-Legal supervisé, facturation.
- **Phase 4 — Scale (2027+)** : ouverture à d'autres cabinets, expansion Espagne + Brésil, marketplace.

## Statut

🚧 **POC / Draft** — document de travail interne, ne pas diffuser.

---

© Contrato Fácil, Unipessoal Lda (NIPC : 519142756) & Oliveira & Cameiro Advogados Associados — Porto, Portugal.
