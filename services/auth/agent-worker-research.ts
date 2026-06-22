import { standardSearch } from './rag-search';
import { AgentRunState } from './agent-state';

export async function runResearchWorker(
  state: AgentRunState,
  agentId: string,
  query: string,
): Promise<void> {
  state.start(agentId);
  try {
    const results = await standardSearch(query, 10, 3);
    if (results.length === 0) {
      state.complete(agentId, 'Aucune jurisprudence trouvée pour cette requête.');
      return;
    }
    const summary = results
      .map((r) => `[${r.source}] ${r.title}\n${r.chunk_text.slice(0, 400)}`)
      .join('\n\n---\n\n');
    state.complete(agentId, summary);
  } catch (err) {
    state.fail(agentId, (err as Error).message);
  }
}
