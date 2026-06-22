---
title: 'Moteur d''orchestration multi-agents juridique'
type: 'feature'
created: '2026-06-22'
status: 'done'
context:
  - services/auth/rag-llm-router.ts
  - services/auth/rag-search.ts
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problème :** EasyLaw n'a pas de couche d'orchestration multi-agents. Les workflows juridiques complexes (« Prépare l'assignation du dossier X ») nécessitent aujourd'hui des appels LLM séquentiels manuels ; il n'existe pas de superviseur capable de décomposer une instruction en tâches parallèles, ni de dispatcher des agents spécialisés.

**Approche :** Ajouter un `AgentSupervisor` TypeScript natif qui reçoit une instruction en langage naturel, génère un plan d'exécution (liste ordonnée de tâches JSON), dispatche des workers spécialisés (Research via RAG existant, Analysis via pipeline epic10 existant) en parallèle via `Promise.allSettled`, et diffuse l'état de chaque agent en temps réel au client via SSE — sans nouvelle dépendance LLM ni réécriture du RAG.

## Boundaries & Constraints

**Always:**
- Réutiliser `callPrompt()` / `streamPrompt()` de `rag-llm-router.ts` — aucun nouveau client LLM
- Réutiliser `searchLegal()` de `rag-search.ts` — aucune réécriture RAG
- État partagé en mémoire (Map + EventEmitter) en V1 — pas de Redis
- SSE avec le même format `data: JSON\n\n` déjà établi dans `rag-llm.ts`
- Toutes les routes sous le préfixe `/api/agents/`

**Ask First:**
- Si le supervisor génère un DAG > 8 nœuds pour une instruction donnée (risque de latence)
- Si l'utilisateur veut persister les sessions d'agents en base (implique migration SQL)

**Never:**
- Pas de LangGraph, AutoGen, ou autre framework d'orchestration externe en V1
- Pas de changements frontend dans cette spec
- Pas de nouveaux champs dans le schéma SQL (llm_prompts seul autorisé via INSERT)
- Pas de réécriture de `rag-embeddings.ts` ou `rag-crawler.ts`

## I/O & Edge-Case Matrix

| Scénario | Input / État | Sortie / Comportement | Gestion d'erreur |
|----------|-------------|----------------------|-----------------|
| Happy path | `POST /api/agents/run { instruction: "Rechercher jurisprudence art. 1231-1 CC" }` | SSE : `supervisor:plan` → `worker:start` × N → `worker:result` × N → `redacteur:draft` | N/A |
| Instruction vide | `{ instruction: "" }` | 400 `{ error: "instruction required" }` | N/A — rejeté avant dispatch |
| Provider LLM down | Supervisor appelle Anthropic, timeout | SSE `{ type: "error", agentId: "supervisor", message: "..." }`, stream se ferme proprement | Autres workers déjà lancés émettent leurs résultats partiels |
| Worker Research échoue | Qdrant inaccessible | SSE `{ type: "error", agentId: "research-1", message: "..." }`, les autres workers continuent | `Promise.allSettled` garantit que l'échec partiel n'annule pas les workers restants |
| Instruction trop longue | instruction > 2000 chars | 400 `{ error: "instruction too long" }` | N/A |

</frozen-after-approval>

## Code Map

- `services/auth/rag-llm-router.ts` -- routeur LLM multi-provider + `callPrompt()` / `streamPrompt()` / `resolveTemplate()` — le supervisor en aura besoin pour les appels dynamiques
- `services/auth/rag-search.ts` -- `searchLegal()` — sera wrappé par agent-worker-research sans modification
- `services/auth/routes/epic10-analysis.ts` -- logique d'extraction documentaire — sera wrappé par agent-worker-analysis
- `services/auth/server.ts` -- point d'enregistrement des routes Express
- `services/auth/db.ts` -- `run()` / `get()` / `all()` — pour INSERT du prompt supervisor

## Tasks & Acceptance

**Execution:**
- [ ] `services/auth/rag-llm-router.ts` -- EXPORT `callLLMRaw(systemPrompt: string, userContent: string, provider: LLMProvider, model: string, maxTokens: number): Promise<string>` — le supervisor en a besoin pour des prompts construits dynamiquement sans passer par la table `llm_prompts`
- [ ] `services/auth/agent-state.ts` -- CRÉER : classe `AgentRunState` avec `Map<string, AgentStatus>` et `EventEmitter` ; exporter `AgentStatus` type `{ agentId: string; type: string; status: 'pending'|'running'|'done'|'error'; result?: string; error?: string }`
- [ ] `services/auth/agent-worker-research.ts` -- CRÉER : fonction `runResearchWorker(state: AgentRunState, agentId: string, query: string): Promise<void>` qui appelle `searchLegal(query, 5)` puis émet `worker:result` sur `state`
- [ ] `services/auth/agent-worker-analysis.ts` -- CRÉER : fonction `runAnalysisWorker(state: AgentRunState, agentId: string, context: string): Promise<void>` qui appelle `callLLMRaw()` avec un prompt d'extraction de faits, puis émet `worker:result`
- [ ] `services/auth/agent-supervisor.ts` -- CRÉER : classe `AgentSupervisor` avec méthode `run(instruction: string, state: AgentRunState): Promise<void>` qui (1) appelle `callLLMRaw()` pour générer un plan JSON `Array<{id, type, input}>`, (2) émet `supervisor:plan`, (3) dispatche workers en parallèle via `Promise.allSettled`, (4) agrège résultats et génère un draft final via `callLLMRaw()`
- [ ] `services/auth/routes/epic-agents.ts` -- CRÉER : route `POST /api/agents/run` qui valide l'instruction, crée un `AgentRunState`, configure les headers SSE, instancie `AgentSupervisor`, `state.on('event', ...)` forwarde au client, démarre le supervisor, ferme le stream à la fin
- [ ] `services/auth/server.ts` -- MODIFIER : importer et enregistrer `epicAgentsRouter` sous `/api/agents`
- [ ] SQL inline dans `epic-agents.ts` (init) -- INSERT OR IGNORE INTO llm_prompts le prompt `agent_supervisor_plan` (provider: anthropic, model: claude-haiku-4-5, system: rôle superviseur juridique, user_prompt_template avec `{{instruction}}`)

**Acceptance Criteria:**
- Given une instruction non vide, when `POST /api/agents/run`, then la réponse est `text/event-stream` et le premier événement SSE `supervisor:plan` arrive en moins de 15 secondes
- Given un événement `supervisor:plan`, when parsé, then il contient un tableau JSON avec au minimum 2 tâches dont au moins une de type `research`
- Given N workers lancés en parallèle, when tous terminés, then un événement `redacteur:draft` est émis contenant un texte non vide
- Given un worker Research, when il se termine avec succès, then l'événement SSE `worker:result` pour ce worker inclut un champ `result` avec au moins un extrait de source juridique
- Given une instruction vide `""`, when la requête arrive, then la réponse est `400` avec `{ error: "instruction required" }` avant tout SSE
- Given un provider LLM en erreur sur le supervisor, when l'erreur se produit, then un événement SSE `{ type: "error", agentId: "supervisor" }` est émis et la connexion SSE se ferme proprement (pas de crash du processus)

## Design Notes

**Format des événements SSE** — même convention que `rag-llm.ts` :
```
data: {"type":"supervisor:plan","plan":[{"id":"r1","type":"research","input":"art. 1231-1 CC"}]}\n\n
data: {"type":"worker:start","agentId":"r1"}\n\n
data: {"type":"worker:result","agentId":"r1","result":"Cass. com. 12 juin 2024..."}\n\n
data: {"type":"redacteur:draft","content":"Sur le fondement de l'article 1231-1..."}\n\n
data: {"type":"done"}\n\n
```

**Prompt supervisor** — le prompt `agent_supervisor_plan` doit exiger une réponse JSON valide (array) et contraindre le modèle à ne pas halluciner de types de workers non supportés (`research`, `analysis`, `redaction` seulement).

## Verification

**Commands:**
- `cd services/auth && npx tsc --noEmit` -- expected: 0 erreurs TypeScript
- `curl -N -X POST http://localhost:3001/api/agents/run -H "Content-Type: application/json" -d "{\"instruction\":\"Rechercher jurisprudence article 1231-1 du Code civil\"}" 2>/dev/null` -- expected: flux SSE avec `supervisor:plan` puis `worker:result` puis `done`

**Manual checks:**
- Vérifier que les events `worker:start` arrivent bien en parallèle (timestamps très proches) pour les workers Research et Analysis
- Vérifier que la connexion SSE se ferme proprement (pas de `data:` infini) après `{"type":"done"}`
- Vérifier que `GET /api/research` existant (epic RAG) fonctionne toujours après le déploiement (non-régression)

## Suggested Review Order

**Entrée — design de l'orchestration**

- Point d'entrée : supervisor reçoit l'instruction, génère le plan, dispatche les workers
  [`agent-supervisor.ts:53`](../services/auth/agent-supervisor.ts#L53)

- Validation stricte du plan LLM (types, unicité IDs, ≥2 tâches, ≥1 research)
  [`agent-supervisor.ts:32`](../services/auth/agent-supervisor.ts#L32)

**État partagé entre agents**

- EventEmitter central : workers publient ici, route SSE écoute
  [`agent-state.ts:14`](../services/auth/agent-state.ts#L14)

**Route SSE — surface publique**

- Validation entrée, headers SSE, guard `writableEnded`, AbortController 60 s, cleanup disconnect
  [`epic-agents.ts:13`](../services/auth/routes/epic-agents.ts#L13)

**Workers spécialisés**

- Research : wrapping `standardSearch()` RAG existant, aucune réécriture
  [`agent-worker-research.ts:5`](../services/auth/agent-worker-research.ts#L5)

- Analysis : extraction de faits, troncature 3000 chars, AbortSignal propagé
  [`agent-worker-analysis.ts:9`](../services/auth/agent-worker-analysis.ts#L9)

**Client LLM — nouveau export**

- `callLLMRaw()` : multi-provider sans table `llm_prompts`, supporte `AbortSignal`
  [`rag-llm-router.ts:98`](../services/auth/rag-llm-router.ts#L98)

**Périphérie**

- Enregistrement de la route dans le serveur Express
  [`server.ts:2810`](../services/auth/server.ts#L2810)

## Spec Change Log
