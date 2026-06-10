import { CohereClient } from 'cohere-ai';
import { QdrantClient } from '@qdrant/js-client-rest';

let cohereClient: CohereClient | null = null;
let qdrantClient: QdrantClient | null = null;

export function getCohereClient(): CohereClient {
  if (!cohereClient) {
    if (!process.env.COHERE_API_KEY) throw new Error('COHERE_API_KEY not configured');
    cohereClient = new CohereClient({ token: process.env.COHERE_API_KEY });
  }
  return cohereClient;
}

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;
    qdrantClient = new QdrantClient({ url, apiKey: apiKey || undefined });
  }
  return qdrantClient;
}

export const QDRANT_COLLECTIONS = ['legal_pt', 'legal_eu', 'legal_jurisprudence', 'legal_caad'] as const;
export type QdrantCollection = typeof QDRANT_COLLECTIONS[number];

export const SOURCE_TO_COLLECTION: Record<string, QdrantCollection> = {
  DRE_I: 'legal_pt',
  DRE_II: 'legal_pt',
  DGSI: 'legal_jurisprudence',
  CURIA: 'legal_jurisprudence',
  EURLEX: 'legal_eu',
  CAAD: 'legal_caad',
};

export async function ensureCollections(): Promise<void> {
  const client = getQdrantClient();
  const existing = await client.getCollections();
  const existingNames = new Set(existing.collections.map((c) => c.name));

  for (const name of QDRANT_COLLECTIONS) {
    if (!existingNames.has(name)) {
      await client.createCollection(name, {
        vectors: { size: 1024, distance: 'Cosine' },
      });
      console.log(`[RAG] Created Qdrant collection: ${name}`);
    }
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  const cohere = getCohereClient();
  const response = await cohere.v2.embed({
    texts: [text],
    model: 'embed-multilingual-v3.0',
    inputType: 'search_query',
    embeddingTypes: ['float'],
  });
  const embeds = (response.embeddings as any)?.float as number[][];
  return embeds[0];
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const cohere = getCohereClient();
  const BATCH = 96;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const response = await cohere.v2.embed({
      texts: batch,
      model: 'embed-multilingual-v3.0',
      inputType: 'search_document',
      embeddingTypes: ['float'],
    });
    const embeds = (response.embeddings as any)?.float as number[][];
    results.push(...embeds);
  }
  return results;
}

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export async function upsertToQdrant(collection: QdrantCollection, points: QdrantPoint[]): Promise<void> {
  const client = getQdrantClient();
  await client.upsert(collection, { points, wait: true });
}

export async function searchQdrant(
  collection: QdrantCollection,
  vector: number[],
  topK: number,
): Promise<Array<{ id: string; score: number; payload: Record<string, unknown> }>> {
  const client = getQdrantClient();
  const results = await client.search(collection, {
    vector,
    limit: topK,
    with_payload: true,
  });
  return results.map((r) => ({
    id: r.id as string,
    score: r.score,
    payload: (r.payload || {}) as Record<string, unknown>,
  }));
}
