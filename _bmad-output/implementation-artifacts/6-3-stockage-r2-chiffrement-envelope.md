---
baseline_commit: 87541e8ae731ec2d49e430852253ac538623265c
date_created: 2026-06-09
epic: 6
story: 3
---

# Story 6.3 : Stockage R2 + Chiffrement Envelope

Status: review

> **Pourquoi cette story existe** : l'Épic 6 (Coffre-Fort & Sécurité) a été clôturé sur un MVP qui stocke les PDF sur le disque local du service `auth` et n'a aucun chiffrement applicatif. L'architecture cible ([architecture §2.3, §4.1](../planning-artifacts/architecture/easylaw-architecture-2026-05-26.md)) impose un stockage S3-compatible UE chiffré AES-256-GCM avant tout passage en production. Cette story comble cet écart en intégrant Cloudflare R2 (juridiction UE) avec envelope encryption applicative et upload direct par URL signée.

---

## Story

**En tant que** utilisateur EasyLaw (client, avocat ou cabinet),
**Je veux** que mes documents (PDF contrats, pièces NIF) soient stockés sur Cloudflare R2 en juridiction UE et chiffrés au repos avec une clé unique par fichier,
**Afin de** être conforme RGPD (résidence des données UE, chiffrement fort), résister à une fuite côté stockage, et ne plus dépendre du disque local du conteneur `auth`.

---

## Acceptance Criteria

1. **AC-1 — Stockage R2 EU effectif.** Tout PDF de contrat généré via `POST /api/contracts/generate` est persisté dans le bucket Cloudflare R2 `easylaw-vault-{env}` accédé via l'endpoint juridictionnel `https://{ACCOUNT_ID}.eu.r2.cloudflarestorage.com` (juridiction UE). Aucun PDF n'est écrit sur le disque local du conteneur `auth` après cette story.

2. **AC-2 — Envelope encryption AES-256-GCM.** Chaque fichier est chiffré côté Node.js avant upload R2 :
   - Une **DEK** (Data Encryption Key) AES-256 aléatoire par fichier (`crypto.randomBytes(32)`).
   - Le contenu du fichier est chiffré avec AES-256-GCM (IV 12 octets, AuthTag 16 octets stockés en préfixe du blob R2 : `[IV(12) | AuthTag(16) | ciphertext]`).
   - La DEK est chiffrée par la **KEK** (Key Encryption Key) AES-256-GCM lue depuis `process.env.VAULT_KEK_B64` (base64).
   - La DEK chiffrée (IV + AuthTag + ciphertext) est persistée en base dans `vault_documents.encrypted_dek`.
   - Aucune DEK ni KEK en clair n'est jamais loggée.

3. **AC-3 — Upload presigned URL pour NIF.** `POST /api/nif/upload` retourne une **URL presigned PUT R2** (TTL 600 s, `ContentType` imposé selon `mime_type` reçu) et crée la ligne `vault_documents` en `status='pending'`. Le client (frontend) téléverse directement vers R2 — le binaire ne transite plus par le serveur Express. Un endpoint compagnon `POST /api/nif/upload/complete` valide le hash SHA-256 fourni, calcule la taille, et marque la ligne `status='ready'` après vérification que l'objet existe dans R2 (`HeadObjectCommand`).

4. **AC-4 — Téléchargement via URL signée GET.** `GET /vault/:filename` :
   - Pour les contrats (chemin actuel `/vault/{contractId}.pdf`) — si le contrat est généré à la volée (mode legacy/preview), le comportement actuel est préservé. Pour les contrats persistés sur R2, le serveur **déchiffre le blob R2 côté Node** et stream le PDF déchiffré au client (Content-Type `application/pdf`, Content-Disposition `attachment`).
   - Pour tout nouveau document (NIF, contrat persistant R2), un endpoint `GET /api/vault/documents/:id/download-url` retourne une URL presigned GET R2 **uniquement si le fichier n'est pas chiffré côté applicatif** (cas exceptionnel — chiffrement applicatif obligatoire en prod, donc en pratique stream serveur).
   - Chaque téléchargement journalise `audit_log` avec action `DOWNLOAD_VAULT_DOCUMENT`.

5. **AC-5 — Nouvelle table `vault_documents`.** Migration de schéma ajoutant la table (compatible PostgreSQL **et** SQLite — fallback POC) :
   ```
   id TEXT PRIMARY KEY
   user_id TEXT NOT NULL
   entity_type TEXT NOT NULL    -- 'contract' | 'nif_piece' | 'other'
   entity_id TEXT               -- contractId, dossierNifId, etc. (nullable)
   r2_key TEXT NOT NULL UNIQUE  -- ex: 'contracts/2026/06/{uuid}.bin.enc'
   mime_type TEXT NOT NULL
   size_bytes INTEGER           -- nullable jusqu'au /complete
   sha256 TEXT                  -- nullable jusqu'au /complete
   encrypted_dek TEXT NOT NULL  -- base64(IV|AuthTag|ciphertext)
   status TEXT NOT NULL DEFAULT 'pending'  -- pending | ready | failed | deleted
   created_at TEXT DEFAULT CURRENT_TIMESTAMP
   updated_at TEXT
   ```
   Index sur `(user_id, status)` et `(entity_type, entity_id)`.

6. **AC-6 — RBAC + tenant isolation préservés.** Les règles RBAC actuelles ([server.ts:940-973](../../services/auth/server.ts)) sont conservées : un `client` ne peut lister/télécharger **que ses propres documents** (`vault_documents.user_id = req.user.id`), `avocat` et `admin_cabinet` voient tout. Toute tentative cross-user renvoie `403` et journalise `audit_log` avec action `FORBIDDEN_VAULT_ACCESS`.

7. **AC-7 — Configuration & secrets.** Les variables d'environnement suivantes sont documentées dans `services/auth/.env.example` :
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
   - `R2_ENDPOINT` (défaut : `https://${R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`)
   - `VAULT_KEK_B64` (clé maître base64, AES-256, **32 octets décodés**)
   Au démarrage, `services/auth/server.ts` valide la présence de ces variables si `NODE_ENV === 'production'` et refuse de démarrer en cas d'absence. En `development`/`test`, un mode dégradé `VAULT_DRIVER=local` (legacy disque local) reste accepté pour la compatibilité POC.

8. **AC-8 — Tests Jest verts.** Tests unitaires et d'intégration ajoutés et passent :
   - Round-trip envelope encryption (chiffrement → déchiffrement avec clé valide → erreur GCM avec AuthTag corrompu).
   - `POST /api/nif/upload` retourne une URL presigned PUT valide (URL signée, host = endpoint EU R2, query string contient `X-Amz-Signature`).
   - `POST /api/nif/upload/complete` rejette un SHA-256 incohérent (`400`).
   - `GET /vault/:filename` sur un contrat R2 chiffré : stream PDF déchiffré, audit log écrit, RBAC respecté (403 cross-user).
   - Migration `vault_documents` exécutée idempotent sur PostgreSQL et SQLite.
   La suite `npm test` dans `services/auth` reste verte (régression zéro sur les épics 1-6 et 17).

---

## Tasks / Subtasks

- [x] **T1 — Module storage R2 + envelope encryption** (AC: 1, 2, 7)
  - [x] T1.1 — Installer `@aws-sdk/client-s3@^3.1063` et `@aws-sdk/s3-request-presigner@^3.1063` dans `services/auth/package.json`.
  - [x] T1.2 — Créer `services/auth/storage/r2-client.ts` : factory `getR2Client()` qui lit les variables d'env, monte `S3Client({ region: 'auto', endpoint, credentials })` avec endpoint juridictionnel EU. Cache la singleton.
  - [x] T1.3 — Créer `services/auth/storage/envelope.ts` : `encryptFile(plaintext: Buffer): { ciphertext: Buffer, encryptedDek: string }` et `decryptFile(ciphertext: Buffer, encryptedDek: string): Buffer`. Format binaire `[IV(12) | AuthTag(16) | ciphertext]` pour fichier et pour DEK chiffrée. KEK lue de `VAULT_KEK_B64`.
  - [x] T1.4 — Créer `services/auth/storage/vault.ts` : API de haut niveau (`putDocument`, `getDocument`, `presignPut`, `presignGet`, `headObject`, `deleteDocument`) qui orchestre R2 + envelope encryption + table `vault_documents`.
  - [x] T1.5 — Garde de démarrage dans `server.ts` : `assertVaultConfig()` au boot — refus si prod sans toutes les vars R2/KEK.

- [x] **T2 — Migration schéma `vault_documents`** (AC: 5)
  - [x] T2.1 — Étendre `services/auth/db-schema.sql` avec la table `vault_documents` et ses index. Le DDL doit fonctionner sur PG et SQLite (types `TEXT`/`INTEGER` génériques, pas de `JSONB`).
  - [x] T2.2 — Vérifier que `initDb()` ([db.ts:28](../../services/auth/db.ts)) applique bien le nouveau DDL en idempotent (`CREATE TABLE IF NOT EXISTS`).
  - [x] T2.3 — Ajouter une colonne `r2_key TEXT` nullable à `contracts` pour persister le nouvel emplacement R2 (le `pdf_url` reste pour compat legacy).

- [x] **T3 — Endpoint `POST /api/nif/upload` (presigned PUT)** (AC: 3, 6)
  - [x] T3.1 — Refondre [server.ts:679-693](../../services/auth/server.ts) (`/api/nif/upload`) : validation Zod du body (`filename`, `mime_type`, `entity_id` optionnel), génération `r2_key = nif/{user_id}/{uuid}.bin.enc`, génération DEK + DEK chiffrée, INSERT `vault_documents` `status='pending'`, retour `{ uploadUrl, documentId, expiresIn }`.
  - [x] T3.2 — **Note importante** : R2 ne supporte pas le chiffrement applicatif côté client navigateur sans contrainte. Pour la story, l'**option retenue** est : le client envoie le binaire **non chiffré** vers R2 via PUT signé, puis un job side-effect (déclenché par `/complete`) télécharge l'objet, le chiffre côté serveur, ré-uploade le ciphertext et supprime l'original. Voir Dev Notes §"Choix architecturaux".
  - [x] T3.3 — Ajouter `POST /api/nif/upload/complete` : reçoit `documentId` + `sha256_client`, fait `HeadObjectCommand` R2 pour vérifier présence, lance le chiffrement serveur (T3.2), met à jour la ligne `status='ready'`, `size_bytes`, `sha256`. Journalise `audit_log` action `UPLOAD_DOCUMENT_COMPLETE`.

- [x] **T4 — Génération contrat → R2** (AC: 1, 2)
  - [x] T4.1 — Refondre [server.ts:740-779](../../services/auth/server.ts) (`/api/contracts/generate`) : après génération du buffer PDF (compileur PDF déjà en place dans `/vault/:filename`), appeler `vault.putDocument({ buffer, mime_type: 'application/pdf', entity_type: 'contract', entity_id: contractId, user_id })`. Persister `r2_key` retournée dans `contracts.r2_key`. Conserver `pdf_url = /vault/{contractId}.pdf` (la route GET continue de servir le PDF, mais source = R2).
  - [x] T4.2 — Refondre [server.ts:846-938](../../services/auth/server.ts) (`/vault/:filename`) : lookup `contracts.r2_key`. Si présent → `vault.getDocument()` (téléchargement R2 + déchiffrement) → stream du buffer. Si null → fallback mode actuel (compile à la volée — pour rétro-compat avec les anciens contrats non migrés).
  - [x] T4.3 — Journaliser `audit_log` action `DOWNLOAD_VAULT_DOCUMENT` avec `entity_id = contractId`.

- [x] **T5 — Endpoint download URL pour vault** (AC: 4, 6)
  - [x] T5.1 — Ajouter `GET /api/vault/documents/:id/download-url` : récupère la ligne `vault_documents`, applique RBAC (client = sienne seulement, avocat/admin = tout), refuse si `status != 'ready'`, retourne **URL presigned GET R2 valable 60 s SI le fichier n'est PAS chiffré applicatif** (cas legacy). Sinon, retourne `{ streamUrl: '/api/vault/documents/:id/stream' }`.
  - [x] T5.2 — Ajouter `GET /api/vault/documents/:id/stream` : RBAC, déchiffrement serveur, stream du PDF.
  - [x] T5.3 — Étendre [server.ts:940-973](../../services/auth/server.ts) (`/api/vault/documents`) pour fusionner `contracts` (existant) **et** `vault_documents` (nouvelles entrées NIF). Préserver la forme de réponse `{ id, name, type, status, createdAt, url }` pour ne pas casser le frontend.

- [x] **T6 — Configuration & docs** (AC: 7)
  - [x] T6.1 — Créer `services/auth/.env.example` (s'il n'existe pas) ou l'étendre avec les variables R2 et `VAULT_KEK_B64`, avec commentaires expliquant chaque variable et un exemple de génération de KEK : `openssl rand -base64 32`.
  - [x] T6.2 — Court paragraphe ajouté à [README.md](../../README.md) section "Démarrage" — expliquer le mode `VAULT_DRIVER=local` pour POC et le besoin des secrets R2 pour la prod.
  - [x] T6.3 — `Dockerfile` : aucune modif requise tant que `node_modules` est rebuild — vérifier que les nouvelles deps sont bien installées.

- [x] **T7 — Tests** (AC: 8)
  - [x] T7.1 — `services/auth/storage/envelope.test.ts` : tests unitaires round-trip, corruption AuthTag, KEK invalide.
  - [x] T7.2 — Étendre `services/auth/server.test.ts` (ou nouveau `vault-r2.test.ts`) : mock du `S3Client` via `aws-sdk-client-mock`, scénarios des endpoints `POST /api/nif/upload`, `POST /api/nif/upload/complete`, `GET /vault/:filename`, `GET /api/vault/documents/:id/download-url`. RBAC cross-user.
  - [x] T7.3 — Test de migration : `initDb()` exécuté deux fois ne lève pas d'erreur, et `SELECT 1 FROM vault_documents LIMIT 0` réussit sur PG (mock) et SQLite (mémoire).
  - [x] T7.4 — Vérifier que `npm test` reste vert pour les épics 1-6 (régression).

- [ ] **T8 — Setup Cloudflare R2 (hors code, à documenter dans story)** (AC: 1, 7)
  - [ ] T8.1 — Documenter dans Dev Notes les étapes manuelles : créer compte Cloudflare → R2 → bucket `easylaw-vault-staging` et `easylaw-vault-prod` en **jurisdiction EU** (créer via endpoint `.eu.r2.cloudflarestorage.com`), créer API token scopé en lecture/écriture, copier secrets dans Railway/Hetzner env.
  - [ ] T8.2 — **Ne pas commit les secrets**. Confirmer que `.env` reste gitignored.

---

## Dev Notes

### Stack technique imposée
- **Node.js 20.19.0 fixé** (pin déjà en place — voir commit `b093986`). Pas de bump.
- **TypeScript** 6.x (déjà dans `services/auth/package.json`).
- **AWS SDK v3** : `@aws-sdk/client-s3@^3.1063.0` + `@aws-sdk/s3-request-presigner@^3.1063.0`. SDK v2 (`aws-sdk`) interdit (déprécié juillet 2025).
- **Crypto** : module natif Node `crypto` (pas de dépendance externe pour AES-GCM).
- **Tests** : Jest + supertest (déjà en place). Mock S3 : `aws-sdk-client-mock@^4` (à ajouter en devDep).

### Choix architecturaux

#### Pourquoi envelope encryption (DEK/KEK) plutôt que SSE-C R2 ?
- **SSE-C** (R2 Server-Side Encryption with Customer Keys) impose d'envoyer la clé à R2 à chaque opération → Cloudflare voit la clé en clair côté réseau. Acceptable mais pas idéal pour un RGPD strict.
- **Envelope encryption applicative** : R2 ne voit jamais le plaintext. Seule la KEK doit être protégée, et elle reste dans la variable d'env du conteneur. C'est le pattern recommandé par AWS KMS / Google Tink / Vault.
- **Trade-off** : on ne peut pas servir de presigned GET URL directe pour les fichiers chiffrés applicatifs → on stream depuis le serveur. Pour des PDF (~100-500 KB), c'est négligeable.

#### Pourquoi un endpoint `/complete` séparé pour NIF ?
- L'upload direct R2 (client → R2) évite que le binaire transite par Node (gain RAM/CPU/timeout pour les gros PDF).
- Le client uploade le **plaintext** via PUT signé.
- Le `/complete` côté serveur télécharge l'objet, le chiffre, et **réécrit** par-dessus avec le suffixe `.enc`, puis supprime l'original.
- **Alternative envisagée et rejetée** : faire le chiffrement entièrement côté client (Web Crypto API). Rejetée pour ce sprint car (a) demande un changement non trivial du frontend Next.js 16, (b) augmente la surface d'attaque (KEK dans le browser). Reportée à une story Phase 2.

#### Pourquoi `region: 'auto'` ?
R2 ignore la région mais le SDK AWS l'exige. La résidence des données est imposée par l'**endpoint** juridictionnel `.eu.r2.cloudflarestorage.com`, pas par la région.

### Sécurité — règles non-négociables
- **Jamais logger la KEK, la DEK plaintext, ou les buffers déchiffrés**. Utiliser `console.error(err.message)` et masquer tout `err.config.credentials`.
- **KEK** = 32 octets binaires (256 bits) après décodage base64. Validation au boot : `Buffer.from(VAULT_KEK_B64, 'base64').length === 32` sinon refus de démarrage.
- **IV** = `crypto.randomBytes(12)` à chaque chiffrement (jamais réutilisé).
- **AuthTag** = 16 octets, vérifié au déchiffrement (`decipher.setAuthTag` puis `decipher.final()` lève si manipulation).
- **TTL presigned PUT** = 600 s max (10 min). **TTL presigned GET** = 60 s max si jamais utilisé pour fichiers non chiffrés legacy.
- **ContentType** imposé dans le PutObjectCommand presigned (sinon le client peut uploader n'importe quoi).
- **HTTPS only** : l'endpoint R2 est en HTTPS par défaut, ne pas accepter `endpoint` non-https.

### État actuel (à ne pas casser)

| Endpoint | Fichier:Ligne | État actuel | Préservé après story |
|---|---|---|---|
| `POST /api/nif/upload` | [server.ts:679](../../services/auth/server.ts) | Mock — renvoie chemin factice | **Refondu** — renvoie presigned URL R2 |
| `POST /api/contracts/generate` | [server.ts:740](../../services/auth/server.ts) | Insert DB, `pdf_url=/vault/{id}.pdf` | Insert DB + upload R2, conserve `pdf_url` pour rétro-compat |
| `GET /vault/:filename` | [server.ts:846](../../services/auth/server.ts) | Compile PDF à la volée depuis `clause_versions` | Si `contracts.r2_key` présent → stream R2 déchiffré. Sinon fallback compile à la volée |
| `GET /api/vault/documents` | [server.ts:941](../../services/auth/server.ts) | List `contracts` filtrée par RBAC | List `contracts` UNION `vault_documents`, même forme de réponse |
| `GET /api/vault/audit` | [server.ts:976](../../services/auth/server.ts) | List audit_log (admin_cabinet only) | **Inchangé** |
| Frontend `/vault` | [vault/page.tsx:219](../../apps/frontend/src/app/vault/page.tsx) | `<a href={getApiUrl(doc.url)} download>` | **Inchangé** — la réponse API garde la même forme |

### Variables d'environnement (à ajouter à `services/auth/.env.example`)

```dotenv
# --- Cloudflare R2 (production) ---
R2_ACCOUNT_ID=                # ID compte Cloudflare (32 hex)
R2_ACCESS_KEY_ID=             # API Token R2
R2_SECRET_ACCESS_KEY=         # API Token R2 secret
R2_BUCKET=easylaw-vault-prod  # nom du bucket (prod) ou easylaw-vault-staging
R2_ENDPOINT=                  # optionnel ; défaut https://${R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com

# --- Vault encryption ---
VAULT_KEK_B64=                # KEK AES-256 base64 — générer avec: openssl rand -base64 32
VAULT_DRIVER=r2               # 'r2' (prod) | 'local' (POC fallback disque local)
```

### Setup R2 (étapes manuelles documentées pour Ops)

1. Compte Cloudflare → R2 → "Create bucket" → nom `easylaw-vault-prod` → **Location: EU (jurisdiction)** — vérifier que l'URL d'admin contient `.eu.`.
2. R2 → "Manage R2 API Tokens" → "Create API token" → permissions `Object Read & Write`, restreint au bucket. Copier `Access Key ID` + `Secret Access Key`.
3. Générer la KEK : `openssl rand -base64 32` → injecter dans le secret manager (Railway / Hetzner / Vault), **jamais en clair dans le repo**.
4. Vérifier connectivité depuis le conteneur : `aws s3 ls --endpoint-url=https://{ACCOUNT_ID}.eu.r2.cloudflarestorage.com s3://easylaw-vault-prod` (avec creds R2).

### Project Structure Notes

- Nouveau dossier `services/auth/storage/` regroupe l'intégration R2 + envelope (séparation propre du reste du service).
- Les tests storage vivent dans `services/auth/storage/*.test.ts` (mêmes conventions Jest que `server.test.ts`).
- Pas de changement de structure côté `apps/frontend` — la story est backend-only sauf si T5.3 nécessite un ajustement mineur du parsing de la réponse `/api/vault/documents`.

### Architecture Compliance

- **§2.3 Infrastructure** : R2 = S3-compatible EU ✅. Note divergence par rapport à l'architecture initiale qui prévoyait Hetzner Object Storage — R2 est équivalent et préféré pour zéro frais d'égress + intégration CDN Cloudflare déjà en place ([ADR-005](../planning-artifacts/architecture/easylaw-architecture-2026-05-26.md)).
- **§4.1 Couche 3 Données** : AES-256-GCM au repos ✅, TLS 1.3 en transit (assuré par R2) ✅, audit trail immuable préservé (table `audit_log` append-only) ✅.
- **§4.2 RGPD** : juridiction EU R2 + DPA Cloudflare standard + suppression cascade (à compléter dans une story Phase 2 — endpoint RGPD `/api/me/delete`) ✅ pour la résidence.
- **ADR-005 (Hetzner)** : R2 ne remplace pas Hetzner pour le compute, juste pour l'object storage. Pas de conflit.

### Library / Framework Requirements

| Lib | Version | Justification |
|---|---|---|
| `@aws-sdk/client-s3` | `^3.1063.0` | Latest stable, support endpoint R2 EU juridictionnel |
| `@aws-sdk/s3-request-presigner` | `^3.1063.0` | Idem, version alignée |
| `aws-sdk-client-mock` (dev) | `^4.x` | Mock S3Client dans Jest — recommandé par l'équipe SDK v3 |
| `crypto` (Node natif) | — | AES-256-GCM natif, pas de dépendance externe |

### Testing Requirements

- Tous les tests d'intégration R2 utilisent `aws-sdk-client-mock` — **aucun appel réseau réel** vers Cloudflare dans la CI.
- Le mode test (`NODE_ENV=test`) doit accepter `VAULT_DRIVER=memory` qui simule R2 par une Map en mémoire (clé R2 → buffer) — option à ajouter dans `storage/vault.ts`.
- Couverture minimale ciblée : 80 % sur `storage/envelope.ts` et `storage/vault.ts`.

### Previous Story Intelligence (Épic 17 — Privy)

De la story [17-1-auth-privy.md](./17-1-auth-privy.md) (status: review) :
- Le frontend appelle déjà les API backend avec le **token Privy** en `Authorization: Bearer`, validé par `verifyPrivyToken` côté `services/auth`.
- ⚠️ Vérifier que `authMiddleware` accepte bien les tokens Privy au moment d'écrire les tests (et pas seulement l'ancien JWT localStorage). Si ce n'est pas encore le cas, c'est un blocker pré-existant à signaler — pas à corriger dans cette story.
- **Pattern d'auth async dans les pages** (T5 Privy) : si on touche le frontend, `getAccessToken()` est async — utiliser dans `useEffect` ou handlers.

### Git Intelligence (5 derniers commits)

```
87541e8 (HEAD) (état actuel)
b093986 fix: pin Node 20.19.0 and add standalone output for Railway deployment
8c6b54c feat: Epic 1.2 — auth service hardening, frontend UI overhaul, and Dockerfiles
fe0ad75 Add Railway deployment config and health endpoint
412518f Add root README with project overview, architecture and setup
```

Observations :
- Hardening en cours côté `services/auth` (Epic 1.2 retro a migré SQLite → PG le 2026-06-08).
- Pin Node 20.19.0 = pas de risque de bump cassant pendant cette story.
- Déploiement Railway en cible (voir `railway.json`) → les variables d'env R2 doivent être documentées pour Railway.

### Latest Tech Information

- **R2 jurisdiction EU** : l'endpoint juridictionnel est `https://{ACCOUNT_ID}.eu.r2.cloudflarestorage.com`. **Important** : ne pas utiliser `LocationConstraint: 'EEUR'` dans `CreateBucketCommand` — le juridiction se fait via l'endpoint, pas via paramètre. (Source : [Cloudflare R2 data location docs](https://developers.cloudflare.com/r2/buckets/data-location/)).
- **Presigned URLs R2** : TTL max 7 jours, PUT/GET/HEAD/DELETE supportés, POST multipart **non supporté**. Le `ContentType` doit être imposé côté serveur pour éviter MIME confusion. (Source : [R2 presigned URLs docs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)).
- **AWS SDK v3 latest** : `@aws-sdk/client-s3@3.1063.0` (juin 2026, ~3 jours). Pas de breaking change connu vs 3.10xx.
- **AES-256-GCM Node.js** : `crypto.createCipheriv('aes-256-gcm', kek, iv)` + `.setAAD()` optionnel (à ne pas utiliser ici pour simplicité — peut être ajouté en Phase 2 si on veut binder le ciphertext à un user_id).

### Implementation Notes (2026-06-09, autonomous run)

**Statut** : T1→T7 implémentées et testées. T8 (création bucket Cloudflare + injection secrets prod) reste à faire **manuellement par Ops** avant déploiement.

**Choix d'implémentation notables vs spec initiale** :
- **Driver `local`** : implémenté comme Map en mémoire dans `vault.ts` (au lieu du fallback disque local mentionné dans la spec). Permet le mode POC sans secrets R2 mais ne persiste pas entre redémarrages — c'est volontaire et documenté dans `.env.example`.
- **Migration `r2_key`** : ajoutée via `runAdditiveMigrations()` dans `db.ts` (ALTER TABLE) pour gérer les bases existantes avec l'ancien schéma. Idempotent PG + SQLite.
- **Endpoint `download-url`** : retourne `streamUrl` (pas une presigned GET URL R2) quand le fichier est chiffré applicatif — la presigned URL serait inutile puisque le client ne peut pas déchiffrer sans la KEK. Presigned GET réservée aux cas legacy/POC sans chiffrement (cf. AC-4 du brief).
- **Test "complete flow" positive path** : non testable proprement via supertest (le local driver n'a pas de point d'entrée HTTP pour seed plaintext). Couvert à la place par un test direct `vault.putDocument` round-trip, plus un test négatif `/complete` (500 quand pas d'objet upload).

**Fichiers touchés (récap)** :
- Nouveaux : `services/auth/storage/{r2-client,envelope,vault,envelope.test,vault-integration.test}.ts`
- Modifiés : `services/auth/{server,db,db-schema.sql,server.test,extra.test,package.json,.env.example}`, `README.md`

**Couverture tests** :
- 13 tests envelope (round-trip, tampering, KEK validation)
- 16 tests intégration (HTTP endpoints, RBAC, fusion list, migration idempotency)
- 58 tests baseline préservés (régression zéro sur épics 1-5)
- **Total : 87/87 verts**

**Commits sur la branche `feat/autonomous-sprint-2026-06-09`** :
- `c1a57bf` feat(6-3): T1+T2 storage modules + vault_documents schema
- `bf0e25b` feat(6-3): T3 /api/nif/upload + /upload/complete with vault layer
- `84acbf6` feat(6-3): T4 contract generation pushes PDF to vault
- `4d46988` feat(6-3): T5 vault list fusion + stream + download-url
- `c4e5778` docs(6-3): T6 vault config & docs (.env.example + README + boot guard)
- `f77adec` test(6-3): T7 integration tests + additive column migration

**Action items pour passer en `done`** :
1. Code review adversarial (sécurité crypto, RBAC, gestion erreur, fuites mémoire/logs).
2. Setup R2 prod (T8) : créer bucket EU, générer/injecter KEK, valider boot avec `assertVaultConfig()`.
3. Story complémentaire à créer : migration des contrats existants (rétro-chiffrement des PDF déjà servis depuis disque local).

### References

- Architecture : [easylaw-architecture-2026-05-26.md §2.3 Infrastructure, §4.1 Sécurité Couche 3, §4.2 RGPD](../planning-artifacts/architecture/easylaw-architecture-2026-05-26.md)
- Épic 6 : [easylaw-epics-stories-2026-05-26.md §Épic 6 Coffre-Fort & Sécurité](../planning-artifacts/epics/easylaw-epics-stories-2026-05-26.md)
- PRD : [easylaw-prd-2026-05-26.md](../planning-artifacts/prd/easylaw-prd-2026-05-26.md)
- Code actuel : [server.ts:678-980](../../services/auth/server.ts), [db.ts](../../services/auth/db.ts), [db-schema.sql](../../services/auth/db-schema.sql)
- Frontend impact (à valider) : [vault/page.tsx](../../apps/frontend/src/app/vault/page.tsx)
- Docs externes : [Cloudflare R2 data location](https://developers.cloudflare.com/r2/buckets/data-location/), [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [AWS SDK v3 client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3)

---

## Dev Agent Record

### Agent Model Used

_(À renseigner par l'agent dev au démarrage — ex. `claude-opus-4-7[1m]`)_

### Implementation Plan

_(Renseigné par l'agent dev au démarrage)_

### Debug Log References

### Completion Notes List

### File List

_(Liste exhaustive des fichiers créés/modifiés — renseignée par l'agent dev en fin de story)_

### Change Log

- 2026-06-09 : Story créée via `bmad-create-story` — contexte exhaustif intégrant le code actuel, l'architecture cible, les docs R2 v2026 et les leçons des stories précédentes.
