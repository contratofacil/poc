import { callLLMRaw } from './rag-llm-router';
import { AgentRunState } from './agent-state';

const SYSTEM = `Tu es un expert juridique chargé d'extraire les faits clés d'un contexte ou d'un dossier.
Retourne une liste structurée : parties impliquées, dates clés, fondements juridiques invoqués, pièces mentionnées.
Sois concis et précis. Réponds en français.`;

export async function runAnalysisWorker(
  state: AgentRunState,
  agentId: string,
  context: string,
  signal?: AbortSignal,
): Promise<void> {
  state.start(agentId);
  try {
    const result = await callLLMRaw(SYSTEM, `Analyse ce contexte juridique :\n\n${context.slice(0, 3000)}`, 'anthropic', 'claude-haiku-4-5', 2048, signal);
    state.complete(agentId, result);
  } catch (err) {
    state.fail(agentId, (err as Error).message);
  }
}
