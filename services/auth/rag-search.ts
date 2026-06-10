import { CohereClient } from 'cohere-ai';
import { all } from './db';
import {
  embedQuery,
  embedDocuments,
  searchQdrant,
  getCohereClient,
  QDRANT_COLLECTIONS,
  SOURCE_TO_COLLECTION,
} from './rag-embeddings';
import { callPrompt } from './rag-llm-router';

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

  // Parallel search across all collections
  const rawResults = (
    await Promise.all(QDRANT_COLLECTIONS.map((col) => searchQdrant(col, vector, topK)))
  ).flat();

  if (rawResults.length === 0) return [];

  // Sort by score and take top topK
  rawResults.sort((a, b) => b.score - a.score);
  const top = rawResults.slice(0, topK);

  // Fetch chunk text from DB by qdrant_id
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

  // Cohere reranking
  try {
    const cohere = getCohereClient();
    const reranked = await cohere.v2.rerank({
      model: 'rerank-multilingual-v3.0',
      query,
      documents: candidates.map((c) => c.chunk_text),
      topN: rerankTo,
    });
    return reranked.results.map((r) => ({
      ...candidates[r.index],
      score: r.relevanceScore,
    }));
  } catch {
    // Fallback: return top candidates without reranking
    return candidates.slice(0, rerankTo);
  }
}

export async function deepDiveSearch(
  query: string,
): Promise<{ results: SearchResult[]; subQueries: string[] }> {
  // Expand query into sub-queries
  let subQueries: string[] = [];
  try {
    const raw = await callPrompt('research_query_expand', { query });
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) subQueries = JSON.parse(match[0]);
  } catch {
    subQueries = [query];
  }
  if (!subQueries.length) subQueries = [query];

  // Parallel standard search for each sub-query
  const allResults = (
    await Promise.all(subQueries.map((sq) => standardSearch(sq, 15, 8)))
  ).flat();

  // Deduplicate by url+chunk
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  for (const r of allResults) {
    const key = `${r.url}::${r.qdrant_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  // Final rerank on merged set
  if (deduped.length === 0) return { results: [], subQueries };

  try {
    const cohere = getCohereClient();
    const reranked = await cohere.v2.rerank({
      model: 'rerank-multilingual-v3.0',
      query,
      documents: deduped.map((d) => d.chunk_text),
      topN: Math.min(15, deduped.length),
    });
    const results = reranked.results.map((r) => ({
      ...deduped[r.index],
      score: r.relevanceScore,
    }));
    return { results, subQueries };
  } catch {
    return { results: deduped.slice(0, 15), subQueries };
  }
}

export function buildContext(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nSource: ${r.source} | Date: ${r.date ?? 'N/A'} | URL: ${r.url}\n${r.chunk_text}`,
    )
    .join('\n\n---\n\n');
}
