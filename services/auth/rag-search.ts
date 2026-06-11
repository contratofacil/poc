import { all } from './db';
import {
  embedQuery,
  searchQdrant,
  getCohereClient,
  QDRANT_COLLECTIONS,
} from './rag-embeddings';
import { callPrompt } from './rag-llm-router';

// ---------------------------------------------------------------------------
// Reranking providers
// RERANK_PROVIDER = cohere (défaut si COHERE_API_KEY présent) | jina | none
//
// jina  → JINA_API_KEY requis (gratuit sur jina.ai, 1M tokens/mois)
//         modèle : jina-reranker-v2-base-multilingual
// none  → tri par score vectoriel uniquement
// ---------------------------------------------------------------------------

type RerankProvider = 'cohere' | 'jina' | 'none';

function getRerankProvider(): RerankProvider {
  const p = (process.env.RERANK_PROVIDER || '').toLowerCase();
  if (p === 'jina') return 'jina';
  if (p === 'none') return 'none';
  // Auto-détection : Cohere si clé présente, sinon none
  if (!p) return process.env.COHERE_API_KEY ? 'cohere' : 'none';
  return 'cohere';
}

interface RerankResult {
  index: number;
  relevanceScore: number;
}

async function rerankWithCohere(query: string, documents: string[], topN: number): Promise<RerankResult[]> {
  const cohere = getCohereClient();
  const res = await cohere.v2.rerank({
    model: 'rerank-multilingual-v3.0',
    query,
    documents,
    topN,
  });
  return res.results.map((r) => ({ index: r.index, relevanceScore: r.relevanceScore }));
}

async function rerankWithJina(query: string, documents: string[], topN: number): Promise<RerankResult[]> {
  if (!process.env.JINA_API_KEY) throw new Error('JINA_API_KEY not configured');
  const res = await fetch('https://api.jina.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'jina-reranker-v2-base-multilingual',
      query,
      documents,
      top_n: topN,
    }),
  });
  if (!res.ok) throw new Error(`Jina rerank error: ${res.status}`);
  const data = await res.json() as { results: Array<{ index: number; relevance_score: number }> };
  return data.results.map((r) => ({ index: r.index, relevanceScore: r.relevance_score }));
}

async function rerank(query: string, documents: string[], topN: number): Promise<RerankResult[] | null> {
  const provider = getRerankProvider();
  try {
    if (provider === 'cohere') return await rerankWithCohere(query, documents, topN);
    if (provider === 'jina') return await rerankWithJina(query, documents, topN);
    return null; // 'none' → pas de reranking
  } catch (err) {
    console.warn('[RAG] Reranking failed, falling back to vector scores:', (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------

export interface SearchResult {
  qdrant_id: string;
  chunk_text: string;
  title: string;
  url: string;
  source: string;
  date: string | null;
  doc_type: string | null;
  score: number;
}

export async function standardSearch(
  query: string,
  topK = 20,
  rerankTo = 5,
): Promise<SearchResult[]> {
  const vector = await embedQuery(query);

  const rawResults = (
    await Promise.all(QDRANT_COLLECTIONS.map((col) => searchQdrant(col, vector, topK)))
  ).flat();

  if (rawResults.length === 0) return [];

  rawResults.sort((a, b) => b.score - a.score);
  const top = rawResults.slice(0, topK);

  const qdrantIds = top.map((r) => r.id);
  const placeholders = qdrantIds.map(() => '?').join(',');
  const rows = await all<{
    id: string;
    qdrant_id: string;
    content_chunk: string;
    title: string;
    url: string;
    source: string;
    date: string | null;
    doc_type: string | null;
  }>(
    `SELECT id, qdrant_id, content_chunk, title, url, source, date, doc_type
     FROM legal_documents WHERE qdrant_id IN (${placeholders})`,
    qdrantIds,
  );

  const rowByQId = new Map(rows.map((r) => [r.qdrant_id, r]));
  const candidates: SearchResult[] = top
    .map((r) => {
      const row = rowByQId.get(r.id);
      if (!row) return null;
      return {
        qdrant_id: r.id,
        chunk_text: row.content_chunk,
        title: row.title,
        url: row.url,
        source: row.source,
        date: row.date,
        doc_type: row.doc_type,
        score: r.score,
      } satisfies SearchResult;
    })
    .filter((r): r is SearchResult => r !== null);

  if (candidates.length === 0) return [];

  const reranked = await rerank(query, candidates.map((c) => c.chunk_text), rerankTo);
  if (reranked) {
    return reranked.map((r) => ({ ...candidates[r.index], score: r.relevanceScore }));
  }
  return candidates.slice(0, rerankTo);
}

export async function deepDiveSearch(
  query: string,
): Promise<{ results: SearchResult[]; subQueries: string[] }> {
  let subQueries: string[] = [];
  try {
    const raw = await callPrompt('research_query_expand', { query });
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) subQueries = JSON.parse(match[0]);
  } catch {
    subQueries = [query];
  }
  if (!subQueries.length) subQueries = [query];

  const allResults = (
    await Promise.all(subQueries.map((sq) => standardSearch(sq, 15, 8)))
  ).flat();

  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of allResults) {
    const key = `${r.url}::${r.qdrant_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  if (deduped.length === 0) return { results: [], subQueries };

  const reranked = await rerank(query, deduped.map((d) => d.chunk_text), Math.min(15, deduped.length));
  if (reranked) {
    return { results: reranked.map((r) => ({ ...deduped[r.index], score: r.relevanceScore })), subQueries };
  }
  return { results: deduped.slice(0, 15), subQueries };
}

export function buildContext(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nSource: ${r.source} | Date: ${r.date ?? 'N/A'} | URL: ${r.url}\n${r.chunk_text}`,
    )
    .join('\n\n---\n\n');
}
