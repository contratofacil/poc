---
title: "EasyLaw — Architecture Technique v1.0"
status: draft
created: 2026-05-26
---

# EasyLaw — Architecture Technique

## 1. Vue d'Ensemble

EasyLaw adopte une **architecture microservices** déployée sur serveurs UE (RGPD), avec une séparation nette entre les domaines fonctionnels. Chaque service est indépendamment scalable et déployable.

## 2. Stack Technique Détaillé

### 2.1 Frontend

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Framework | **Next.js 14** (App Router) | SSR/SSG pour SEO juridique, Vercel-compatible |
| UI Library | **React 18** + TypeScript | Typage fort, écosystème mature |
| Styling | **Tailwind CSS** + **shadcn/ui** | Design system rapide, accessible |
| State | **Zustand** + **React Query** | Léger pour état local, React Query pour cache serveur |
| Forms | **React Hook Form** + **Zod** | Validation robuste, perf optimisée |
| i18n | **next-intl** | PT/FR/EN, lazy loading des traductions |
| PDF Preview | **react-pdf** + **PDF.js** | Rendu contrats en temps réel |
| Chat IA | **Vercel AI SDK** | Streaming réponses Luso-Legal |

### 2.2 Backend — Services

#### Service Auth (Node.js / Express)
```yaml
responsabilité: Authentification, sessions, RBAC
tech: Node.js 20 + Passport.js + JWT
base_de_données: PostgreSQL (users, roles, sessions)
sécurité: OAuth2 + MFA (TOTP), rate limiting
contrat_API: REST + OpenAPI 3.0
```

#### Service Contrats (Node.js / Carbone.io)
```yaml
responsabilité: Génération, versioning, stockage contrats
tech: Node.js 20 + Carbone.io v4
base_de_données: PostgreSQL (clause_versions, contracts, templates)
stockage: S3-compatible (EU) AES-256
template_engine: Carbone.io (ODT → PDF/DOCX)
versioning: table clause_versions (id, content, loi_ref, valid_from, valid_to)
```

#### Service IA / RAG (Python / FastAPI)
```yaml
responsabilité: Luso-Legal chat, embeddings, recherche sémantique
tech: Python 3.12 + FastAPI + LangChain
llm: Claude 3.5 Sonnet (Anthropic) | fallback: GPT-4o (OpenAI)
vector_db: pgvector (PostgreSQL) | fallback: Pinecone
chunking: Recursive text splitter, chunk_size=512, overlap=50
reranker: Cohere Rerank v3
guardrails: Guardrails AI + custom rules juridiques PT
streaming: Server-Sent Events (SSE)
```

#### Service Dossiers NIF (Node.js)
```yaml
responsabilité: Gestion dossiers, workflow cabinet, notifications
tech: Node.js 20 + Bull (queue jobs)
base_de_données: PostgreSQL (dossiers, status, timeline)
notifications: SendGrid (email) + Twilio (SMS)
queue: Redis + Bull (traitement asynchrone)
storage: S3-compatible chiffré pour pièces justificatives
```

#### Service Compliance (Node.js + Cron)
```yaml
responsabilité: Dashboard tri-couleur, alertes, CRON
tech: Node.js 20 + node-cron
base_de_données: PostgreSQL (compliance_items, notifications_log)
cron: Quotidien à 07h00 UTC+1 (heure Lisbonne)
logique:
  ROUGE: due_date < aujourd'hui
  ORANGE: due_date < aujourd'hui + 90j
  VERT: due_date >= aujourd'hui + 90j
```

#### Service Paiement (Node.js)
```yaml
responsabilité: Stripe, MB Way, abonnements, factures
tech: Node.js 20 + Stripe SDK v14
stripe: Webhooks pour événements paiement
mbway: API ifthenpay ou eupago (agrégateurs PT)
abonnements: Stripe Billing (recurring)
factures: Stripe Invoice + PDF auto-généré
```

#### Service Coffre-Fort (Node.js)
```yaml
responsabilité: Stockage sécurisé, RBAC, audit trail, versioning
tech: Node.js 20
chiffrement_repos: AES-256-GCM (clés gérées par AWS KMS ou Vault)
chiffrement_transit: TLS 1.3 (HSTS strict)
audit: PostgreSQL (audit_log : user_id, action, entity, timestamp, ip)
versioning: Historique complet avec hash SHA-256 par version
rgpd: API de portabilité + suppression complète (cascade)
```

### 2.3 Infrastructure

```yaml
cloud: Hetzner Cloud EU (Germany) + CDN Cloudflare
orchestration: Docker Compose (MVP) → Kubernetes (Phase 2)
ci_cd: GitHub Actions → build, test, deploy
monitoring: Grafana + Prometheus + Sentry (erreurs)
logs: Loki + Grafana
backup: Snapshots daily (PostgreSQL) + S3 cross-region EU
dns: Cloudflare (DDoS protection, proxy)
ssl: Let's Encrypt (auto-renew) + Cloudflare SSL
```

### 2.4 Base de Données

```sql
-- Schéma principal (PostgreSQL 16)

users (id, email, name, role, lang, created_at, deleted_at)
contracts (id, user_id, type, status, template_id, data_json, pdf_url, created_at)
clause_versions (id, contract_type, clause_key, content, loi_reference, valid_from, valid_to)
dossiers_nif (id, user_id, status, cabinet_ref, pieces_json, created_at, updated_at)
compliance_items (id, entity_id, type, due_date, status, notified_at, notes)
audit_log (id, user_id, action, entity_type, entity_id, ip_addr, user_agent, timestamp)
payments (id, user_id, stripe_id, amount, currency, status, product, created_at)
conversations_ia (id, user_id, messages_json, context_json, escalated_at, created_at)

-- Extension pgvector pour RAG
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  source TEXT, -- 'DRE', 'DGSI', 'EUR-Lex'...
  content TEXT,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  metadata JSONB,
  indexed_at TIMESTAMP
);
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 3. Architecture RAG (Luso-Legal)

```
[Sources Juridiques PT+EU]
  DRE Série I+II | DGSI | CURIA | EUR-Lex | AT | BdP | CAAD
          ↓ (scraping/API + webhook législatif)
[Ingestion Pipeline]
  Chunking → Nettoyage → Embedding (text-embedding-3-small)
  → Stockage pgvector (PostgreSQL EU)
          ↓
[Query Pipeline]
  Question utilisateur
  → Query embedding
  → Recherche vectorielle (cosine similarity, top-k=5)
  → Reranking (Cohere)
  → Contexte injecté dans prompt Claude 3.5 Sonnet
  → Réponse streamée (SSE) avec sources citées
  → Guardrails check (hors périmètre ? → refus poli)
  → Disclaimer automatique injecté en footer
```

---

## 4. Sécurité Architecture

### 4.1 Couches de Sécurité

```
Couche 1 : Réseau
  │ Cloudflare DDoS + WAF
  │ HSTS Strict, CSP Headers
  │ Rate limiting par IP + par user

Couche 2 : Application  
  │ OAuth2 + MFA obligatoire cabinets
  │ JWT access tokens (15min) + refresh tokens (7j)
  │ RBAC : client | avocat_junior | avocat | admin
  │ CORS strict (domaines EasyLaw uniquement)

Couche 3 : Données
  │ AES-256-GCM au repos (clés AWS KMS)
  │ TLS 1.3 en transit
  │ Ségrégation données par tenant (multitenancy)
  │ Audit trail immuable (append-only)
  │ Backup daily chiffré cross-region EU

Couche 4 : IA
  │ Données client NON envoyées à OpenAI/Anthropic pour training
  │ API calls avec data anonymisée si possible
  │ Guardrails : filtres inject, PII detection
```

### 4.2 RGPD Architecture
- **DPO désigné** avant lancement MVP
- **DPA signé** avec tous les sous-traitants (Anthropic, Stripe, Hetzner, SendGrid)
- **Politique de rétention** : données actives conservées, supprimées à J+30 après demande
- **Privacy by Design** : minimisation des données collectées
- **Logs anonymisés** après 90 jours

---

## 5. Décisions d'Architecture (ADR)

### ADR-001 : Next.js vs SPA pure
**Décision :** Next.js App Router  
**Raison :** SEO critique pour acquisition organique (termes juridiques PT), SSR natif, écosystème Vercel AI SDK pour streaming Luso-Legal

### ADR-002 : PostgreSQL + pgvector vs BD séparée
**Décision :** PostgreSQL avec extension pgvector  
**Raison :** Simplicité opérationnelle (une seule BD), ACID garanti, coût réduit MVP. Migration vers Pinecone si volume > 10M vecteurs.

### ADR-003 : Claude 3.5 Sonnet vs GPT-4o
**Décision :** Claude 3.5 Sonnet (principal) + GPT-4o (fallback)  
**Raison :** Claude excelle sur taches d'analyse juridique longue, meilleure gestion des documents PDF, politique de confidentialité Anthropic plus stricte sur le training.

### ADR-004 : Microservices vs Monolithe MVP
**Décision :** Monolithe modulaire pour MVP, migration microservices Phase 2  
**Raison :** Vélocité de développement, équipe restreinte, séparation par modules bien définie dès le début. Interfaces princi internes = contrats API clairs pour migration future.

### ADR-005 : Hébergement Hetzner Cloud EU
**Décision :** Hetzner Cloud (Allemagne) + CDN Cloudflare  
**Raison :** Serveurs 100% EU (conformité RGPD), coût 70% inférieur à AWS/Azure, SLA 99.9%, support EU, proximté Portugal.

---

## 6. Risques Techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| API AMA (CMD) non disponible | Moyen | Haut | Fallback QES (eIDEasy/Uanataca), négociation AMA précoce |
| Hallucinations LLM droit PT | Haut | Très haut | RAG strict + guardrails + disclaimer + supervision avocat |
| pgvector limite performance | Faible | Moyen | Migration Pinecone si > 10M vecteurs, index IVFFLAT optimisé |
| Carbone.io licensing commercial | Faible | Moyen | Contrat commercial pré-négocié, alternative Docx-Templates |
| Indisponibilité LLM provider | Faible | Haut | Fallback Claude ↔ GPT-4o, timeout 10s avec message gracieux |
| Fuite données RGPD | Très faible | Critique | AES-256 + KMS + Pentest annuel + DPA + DPO |

---

*Généré par BMAD Method v6.8.0 — Skill: bmad-create-architecture (CA)*  
*EasyLaw CDC v2.0 PRO — Contrato Fácil × Oliveira & Carneiro — Porto, Portugal*
