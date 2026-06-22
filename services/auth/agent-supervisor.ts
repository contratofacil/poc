import { callLLMRaw } from './rag-llm-router';
import { runResearchWorker } from './agent-worker-research';
import { runAnalysisWorker } from './agent-worker-analysis';
import { AgentRunState } from './agent-state';

export interface AgentTask {
  id: string;
  type: 'research' | 'analysis' | 'redaction';
  input: string;
}

const SUPERVISOR_SYSTEM = `Tu es un superviseur juridique IA. Reçois une instruction d'un juriste et décompose-la en sous-tâches spécialisées.

Types de tâches disponibles :
- "research" : recherche jurisprudentielle ou doctrinale (bases de données juridiques)
- "analysis" : extraction de faits depuis un contexte ou un dossier fourni
- "redaction" : rédaction d'un document juridique à partir des résultats précédents

Réponds UNIQUEMENT avec un tableau JSON valide (aucun texte autour) de 2 à 6 tâches.
Format : [{"id":"r1","type":"research","input":"..."},{"id":"a1","type":"analysis","input":"..."}]
Ne propose que des types parmi : research, analysis, redaction.`;

const REDACTEUR_SYSTEM = `Tu es un rédacteur juridique expert. À partir des recherches et analyses fournies,
rédige un document juridique structuré, précis et professionnel en français.
Cite les sources utilisées. Utilise les formules juridiques appropriées.`;

const VALID_TASK_TYPES = new Set(['research', 'analysis', 'redaction']);
const MAX_TASKS = 8;
const MAX_TASK_INPUT = 500;
const MAX_CONTEXT_CHARS = 16_000;

function validatePlan(raw: unknown): AgentTask[] {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > MAX_TASKS) {
    throw new Error(`Plan invalide : doit contenir entre 2 et ${MAX_TASKS} tâches`);
  }
  const ids = new Set<string>();
  const tasks = raw.map((t: unknown, i: number) => {
    if (!t || typeof t !== 'object') throw new Error(`Tâche ${i} malformée`);
    const task = t as Record<string, unknown>;
    if (typeof task.id !== 'string' || !/^[a-zA-Z0-9_-]{1,32}$/.test(task.id)) throw new Error(`Tâche ${i} : id invalide`);
    if (ids.has(task.id)) throw new Error(`Tâche ${i} : id dupliqué "${task.id}"`);
    ids.add(task.id);
    if (!VALID_TASK_TYPES.has(task.type as string)) throw new Error(`Tâche ${i} : type inconnu "${task.type}"`);
    if (typeof task.input !== 'string') throw new Error(`Tâche ${i} : input doit être une chaîne`);
    return { id: task.id, type: task.type as AgentTask['type'], input: task.input.slice(0, MAX_TASK_INPUT) };
  });
  if (!tasks.some((t) => t.type === 'research')) {
    throw new Error('Plan invalide : au moins une tâche de type "research" est requise');
  }
  return tasks;
}

export class AgentSupervisor {
  async run(instruction: string, state: AgentRunState, signal?: AbortSignal): Promise<void> {
    state.register('supervisor', 'supervisor');
    state.start('supervisor');

    // 1. Générer le plan d'exécution
    let plan: AgentTask[];
    try {
      const raw = await callLLMRaw(SUPERVISOR_SYSTEM, instruction, 'anthropic', 'claude-haiku-4-5', 1024, signal);
      // Prendre le dernier tableau JSON de la réponse (évite les exemples en préambule)
      const matches = [...raw.matchAll(/\[[\s\S]*?\]/g)];
      if (matches.length === 0) throw new Error('Plan JSON introuvable dans la réponse');
      const parsed = JSON.parse(matches[matches.length - 1][0]);
      plan = validatePlan(parsed);
    } catch (err) {
      state.fail('supervisor', `Échec de planification : ${(err as Error).message}`);
      return;
    }

    state.complete('supervisor', `Plan généré : ${plan.length} tâches`);
    state.emitRaw({ type: 'supervisor:plan', plan });

    // 2. Enregistrer et dispatcher les workers en parallèle (hors redaction)
    const workerTasks = plan.filter((t) => t.type !== 'redaction');
    for (const task of workerTasks) {
      state.register(task.id, task.type);
    }

    await Promise.allSettled(
      workerTasks.map((task) => {
        if (task.type === 'research') return runResearchWorker(state, task.id, task.input);
        if (task.type === 'analysis') return runAnalysisWorker(state, task.id, task.input, signal);
        return Promise.resolve();
      }),
    );

    // 3. Agréger résultats et rédiger le document final
    const results = state.getResults();
    if (results.length === 0) {
      state.emitRaw({ type: 'redacteur:draft', content: 'Aucun résultat disponible pour la rédaction.' });
      return;
    }

    const rawContext = results
      .map((r) => `=== Agent ${r.agentId} ===\n${r.result.slice(0, 2000)}`)
      .join('\n\n');
    const context = rawContext.slice(0, MAX_CONTEXT_CHARS);

    try {
      const draft = await callLLMRaw(
        REDACTEUR_SYSTEM,
        `Instruction initiale : ${instruction}\n\nRésultats des agents :\n\n${context}`,
        'anthropic',
        'claude-haiku-4-5',
        4096,
        signal,
      );
      state.emitRaw({ type: 'redacteur:draft', content: draft });
    } catch (err) {
      state.emitRaw({ type: 'error', agentId: 'redacteur', message: (err as Error).message });
    }
  }
}
