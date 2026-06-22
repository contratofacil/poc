# EasyLaw — ContratoFacil POC

> Preuve de concept (POC) de **EasyLaw**, la plateforme LegalTech intelligente pour le Portugal.
> Édité par **Contrato Fácil, Unipessoal Lda** & **Oliveira & Cameiro Advogados Associados** (Porto, Portugal).

EasyLaw combine deux segments complémentaires :

1. **Grand public** (expatriés, entrepreneurs, PME) — démarches administratives, génération de contrats conformes, assistant juridique 24h/24.
2. **Professionnels du droit** (avocats, cabinets) — recherche IA, analyse documentaire, production de documents.

Ce dépôt contient le POC du **MVP (Phase 1)** : NIF Starter Pack, générateur de contrats, GED, compliance dashboard, assistant Luso-Legal, coffre-fort chiffré, RAG juridique et authentification Privy.io.

> 📄 Le cahier des charges complet est dans [`docs/`](docs/) (`EasyLaw CDC v2.0 PRO.pdf`).

---

## Architecture

Monorepo géré avec **npm workspaces**.

```
contratofacil/
├── apps/
│   ├── frontend/        # Application web Next.js 16 / React 19 / Tailwind 4
│   └── word-addin/      # Add-in Microsoft Word (Vite + Office.js)
├── services/
│   └── auth/            # API backend Express 5 / TypeScript / SQLite→PostgreSQL
│                        # (auth, NIF/KYC, contrats, vault R2, assistant, RAG,
│                        #  compliance, GED, admin, contact)
├── docs/                # Cahier des charges (CDC v2.0 PRO) et extraits
└── _bmad-output/        # Artefacts BMAD (PRD, architecture, stories, UX)
```

### Stack technique

| Composant       | Technologie                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| Frontend        | Next.js 16 (standalone), React 19, Tailwind CSS 4, shadcn/ui, react-hook-form, zod |
| Backend API     | Node.js, Express 5, TypeScript                                              |
| Auth            | Privy.io (email + wallets) + JWT fallback · sync via `EasyLawUserContext`  |
| Base de données | SQLite (dev/POC) → PostgreSQL (prod) — syntaxe SQL portable                 |
| RAG             | HuggingFace Inference (embeddings), Cohere (reranking), LLM Anthropic/OpenAI/Mistral |
| Stockage vault  | Cloudflare R2 (UE) + AES-256-GCM envelope encryption (DEK/KEK)             |
| i18n            | Trilingue EN / FR / PT via `LanguageContext` partagé                        |
| Tests           | Jest + supertest (unit/intégration), Playwright (E2E)                      |
| Déploiement     | Railway + Docker (Dockerfile par service), nixpacks                         |

---

## Prérequis

- Node.js ≥ 24
- npm ≥ 10

---

## Installation

```bash
# À la racine du monorepo
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` est requis à cause d'un conflit de peer deps openai/zod.

---

## Démarrage

### 1. Backend — API & services

```bash
cd services/auth
cp .env.example .env      # première fois — éditer les variables (voir section Variables)
npm run build
npm start                 # port 3001 par défaut (configurable via PORT)
```

**En mode dev (ts-node, hot reload) :**

```bash
npm run dev
```

> ⚠️ Le frontend Next.js utilise le port 3000 par défaut. Lancez l'API sur le port 3001
> (valeur par défaut du `.env.example` frontend : `NEXT_PUBLIC_API_URL=http://localhost:3001`).

### 2. Frontend — application web

```bash
cd apps/frontend
cp .env.example .env.local   # première fois — remplir NEXT_PUBLIC_PRIVY_APP_ID etc.
npm run dev                  # http://localhost:3000
```

### 3. Word Add-in (optionnel)

```bash
cd apps/word-addin
npm run dev    # serveur de développement Office Add-in
```

---

## Variables d'environnement

### `services/auth/.env`

| Variable              | Obligatoire | Description                                              |
| --------------------- | ----------- | -------------------------------------------------------- |
| `PORT`                | non         | Port Express (défaut : 3001)                             |
| `JWT_SECRET`          | oui         | Secret de signature JWT                                  |
| `PRIVY_APP_ID`        | oui         | ID application Privy.io                                  |
| `PRIVY_APP_SECRET`    | oui         | Secret Privy.io (validation tokens)                      |
| `DATABASE_URL`        | non         | URL PostgreSQL (si absent → SQLite local)                |
| `SENDGRID_API_KEY`    | non         | Alertes email compliance                                 |
| `COHERE_API_KEY`      | non         | Embeddings + reranking RAG                               |
| `ANTHROPIC_API_KEY`   | non         | LLM assistant (défaut)                                   |
| `OPENAI_API_KEY`      | non         | LLM alternatif                                           |
| `MISTRAL_API_KEY`     | non         | LLM alternatif                                           |
| `GOOGLE_AI_API_KEY`   | non         | LLM alternatif                                           |
| `QDRANT_URL`          | non         | Base vectorielle Qdrant (défaut : localhost:6333)        |
| `VAULT_DRIVER`        | non         | `local` (dev) ou `r2` (prod)                             |
| `R2_ACCOUNT_ID`       | prod        | Cloudflare R2                                            |
| `R2_ACCESS_KEY_ID`    | prod        | Cloudflare R2                                            |
| `R2_SECRET_ACCESS_KEY`| prod        | Cloudflare R2                                            |
| `R2_BUCKET`           | prod        | Nom du bucket R2 (juridiction UE)                        |
| `VAULT_KEK_B64`       | prod        | Clé maître AES-256 (base64, 32 bytes)                    |

### `apps/frontend/.env.local`

| Variable                   | Description                            |
| -------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | ID application Privy.io                |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Client ID Privy.io                  |
| `PRIVY_APP_SECRET`         | Secret Privy.io (côté serveur Next.js) |
| `NEXT_PUBLIC_API_URL`      | URL du service auth (ex. http://localhost:3001) |
| `NEXT_PUBLIC_ENV`          | `development` ou `production`          |

---

## Coffre-fort documents (Vault)

Le service `auth` stocke les PDF de contrats et les pièces NIF dans **Cloudflare R2**
(juridiction UE) avec chiffrement applicatif **AES-256-GCM** (envelope encryption :
DEK par fichier, wrappée par une KEK maître).

- **Mode dev / POC** : `VAULT_DRIVER=local` — fichiers en mémoire dans le process Node,
  pratiques pour les tests, perdus au redémarrage.
- **Mode prod** : `VAULT_DRIVER=r2` — le serveur refuse de démarrer si `R2_*` ou
  `VAULT_KEK_B64` sont absents ou mal formés.

Générer une KEK :

```bash
openssl rand -base64 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> ⚠️ **La KEK doit être sauvegardée hors-bande (secret manager).** Sa perte rend tous
> les documents chiffrés irrécupérables.

---

## Tests

```bash
# Tests Jest (unit + intégration) — service auth
cd services/auth
npm test

# Tests E2E Playwright — frontend
cd apps/frontend
npx playwright test
```

Les tests E2E couvrent : auth flows, RBAC, wizard NIF, login, profil, home.
Un mode test auth (`AUTH_TEST_MODE=true`) permet de bypasser Privy en CI.

---

## Principales routes frontend

| Route              | Description                                        |
| ------------------ | -------------------------------------------------- |
| `/`                | Landing page (trilingue)                           |
| `/login`           | Connexion Privy.io                                 |
| `/register`        | Inscription (FR/PT)                                |
| `/nif`             | Wizard NIF 4 étapes (KYC, upload, paiement)        |
| `/contracts`       | Générateur de contrats (Bail commercial, NDA, …)   |
| `/contracts/wizard`| Wizard de génération de contrat                    |
| `/ged`             | Gestion électronique de documents                  |
| `/documents`       | Liste et édition de documents                      |
| `/analysis`        | Analyse de documents via RAG                       |
| `/research`        | Recherche juridique RAG                            |
| `/vault`           | Coffre-fort chiffré (R2)                           |
| `/compliance`      | Compliance dashboard (CRUD, alertes)               |
| `/assistant`       | Assistant Luso-Legal (chat IA)                     |
| `/admin`           | Dashboard administrateur (alias `/dashboard`)      |
| `/profile`         | Profil utilisateur                                 |
| `/contact`         | Formulaire de contact                              |
| `/pricing`         | Tarification                                       |
| `/legal`           | Mentions légales / CGU                             |

---

## Principaux endpoints API

Base URL : `http://localhost:3001` (ou valeur de `NEXT_PUBLIC_API_URL`).

| Domaine      | Endpoints                                                                          |
| ------------ | ---------------------------------------------------------------------------------- |
| Auth         | `POST /api/auth/register` · `POST /api/auth/login` · `GET/PUT/DELETE /api/auth/profile` |
| NIF / KYC    | `POST /api/nif/apply` · `POST /api/nif/payment` · `GET /api/nif/status` · `POST /api/kyc/verify` |
| Contrats     | `GET /api/contracts/templates` · `POST /api/contracts/generate`                   |
| GED          | `GET /api/documents` · `POST /api/documents/generate` · `GET /api/documents/:id`  |
| Vault        | `GET /api/vault/documents` · `POST /api/vault/upload` · `GET /api/vault/audit`    |
| Assistant    | `POST /api/assistant/chat` · `GET /api/assistant/history`                          |
| RAG          | `POST /api/rag/search` · `GET /api/rag/crawl` · `GET /api/rag/embed`              |
| Compliance   | `GET/POST /api/compliance` · `PUT/DELETE /api/compliance/:id`                      |
| Admin        | `GET/PUT /api/admin/settings` · `GET /api/admin/users` · `GET /api/admin/clauses`  |
| Contact      | `POST /api/contact`                                                                |

---

## Roadmap

| Phase | Périmètre | Cible |
| ----- | --------- | ----- |
| **Phase 1 — MVP** *(POC actuel)* | 5 templates contrats, NIF Starter Pack, Compliance Dashboard, Luso-Legal v1, Stripe + MB Way, coffre-fort AES-256, RAG juridique, Word Add-in | T3 2026 |
| **Phase 2 — Consolidation** | Signature CMD (eIDAS), KMS full, recherche IA 100 docs, API REST publique | T4 2026 |
| **Phase 3 — Expansion** | Golden Visa / D7, i18n complet PT/EN/FR, Luso-Legal supervisé, facturation | S1 2027 |
| **Phase 4 — Scale** | Ouverture multi-cabinets, expansion Espagne + Brésil, marketplace | 2027+ |

---

## Statut

🚧 **POC / Draft** — document de travail interne, ne pas diffuser.

---

© Contrato Fácil, Unipessoal Lda (NIPC : 519142756) & Oliveira & Cameiro Advogados Associados — Porto, Portugal.
