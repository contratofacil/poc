import { QdrantClient } from '@qdrant/js-client-rest';

// ---------------------------------------------------------------------------
// Qdrant
// ---------------------------------------------------------------------------

let qdrantClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;
    qdrantClient = new QdrantClient({ url, apiKey: apiKey || undefined });
  }
  return qdrantClient;
}

// ---------------------------------------------------------------------------
// Embedding providers
// EMBEDDING_PROVIDER = cohere (défaut) | huggingface | ollama
//
// cohere       → COHERE_API_KEY requis
// huggingface  → HF_API_KEY requis
//               modèle : intfloat/multilingual-e5-large (1024 dims)
//               ou surcharger avec HF_EMBED_MODEL
// ollama       → OLLAMA_URL (défaut http://localhost:11434)
//               modèle : mxbai-embed-large (1024 dims)
//               ou surcharger avec OLLAMA_EMBED_MODEL
// ---------------------------------------------------------------------------

type EmbeddingProvider = 'cohere' | 'huggingface' | 'ollama';

function getEmbeddingProvider(): EmbeddingProvider {
  const p = (process.env.EMBEDDING_PROVIDER || 'cohere').toLowerCase();
  if (p === 'huggingface' || p === 'hf') return 'huggingface';
  if (p === 'ollama') return 'ollama';
  return 'cohere';
}

// --- Cohere ----------------------------------------------------------------
import { CohereClient } from 'cohere-ai';

let cohereClient: CohereClient | null = null;

export function getCohereClient(): CohereClient {
  if (!cohereClient) {
    if (!process.env.COHERE_API_KEY) throw new Error('COHERE_API_KEY not configured');
    cohereClient = new CohereClient({ token: process.env.COHERE_API_KEY });
  }
  return cohereClient;
}

async function embedWithCohere(texts: string[], inputType: 'search_query' | 'search_document'): Promise<number[][]> {
  const cohere = getCohereClient();
  const BATCH = 96;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const response = await cohere.v2.embed({
      texts: batch,
      model: 'embed-multilingual-v3.0',
      inputType,
      embeddingTypes: ['float'],
    });
    const embeds = (response.embeddings as any)?.float as number[][];
    results.push(...embeds);
  }
  return results;
}

// --- HuggingFace -----------------------------------------------------------
// Modèle : intfloat/multilingual-e5-large (1024 dims, multilingue)
// Les modèles E5 nécessitent un préfixe "query: " ou "passage: "

import { HfInference } from '@huggingface/inference';

let hfClient: HfInference | null = null;

function getHfClient(): HfInference {
  if (!hfClient) {
    if (!process.env.HF_API_KEY) throw new Error('HF_API_KEY not configured');
    hfClient = new HfInference(process.env.HF_API_KEY);
  }
  return hfClient;
}

function meanPool(embeddings: number[][] | number[]): number[] {
  // Si la réponse HF est déjà un vecteur 1D (pooling fait côté serveur)
  if (!Array.isArray(embeddings[0])) return embeddings as number[];
  const matrix = embeddings as number[][];
  const dim = matrix[0].length;
  const pooled = new Array<number>(dim).fill(0);
  for (const row of matrix) row.forEach((v, i) => (pooled[i] += v));
  return pooled.map((v) => v / matrix.length);
}

async function embedWithHuggingFace(texts: string[], role: 'query' | 'document'): Promise<number[][]> {
  const hf = getHfClient();
  const model = process.env.HF_EMBED_MODEL || 'intfloat/multilingual-e5-large';
  const prefix = role === 'query' ? 'query: ' : 'passage: ';
  const BATCH = 32;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH).map((t) => prefix + t);
    const response = await hf.featureExtraction({ model, inputs: batch }) as number[][][] | number[][];

    // response peut être [batch][tokens][dim] ou [batch][dim]
    const embeddings: number[][] = (Array.isArray(response[0][0])
      ? (response as number[][][]).map((item) => meanPool(item))
      : (response as number[][]));

    // Normaliser (L2) pour cosine similarity
    results.push(...embeddings.map(normalize));
  }
  return results;
}

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

// --- Ollama ----------------------------------------------------------------
// Modèle : mxbai-embed-large (1024 dims)
// Prérequis : ollama pull mxbai-embed-large

async function embedWithOllama(texts: string[], _role: 'query' | 'document'): Promise<number[][]> {
  const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_EMBED_MODEL || 'mxbai-embed-large';
  const BATCH = 16;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: batch }),
    });
    if (!res.ok) throw new Error(`Ollama embed error: ${res.status} ${await res.text()}`);
    const data = await res.json() as { embeddings: number[][] };
    results.push(...data.embeddings);
  }
  return results;
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

export async function embedQuery(text: string): Promise<number[]> {
  const provider = getEmbeddingProvider();
  if (provider === 'huggingface') return (await embedWithHuggingFace([text], 'query'))[0];
  if (provider === 'ollama') return (await embedWithOllama([text], 'query'))[0];
  return (await embedWithCohere([text], 'search_query'))[0];
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const provider = getEmbeddingProvider();
  if (provider === 'huggingface') return embedWithHuggingFace(texts, 'document');
  if (provider === 'ollama') return embedWithOllama(texts, 'document');
  return embedWithCohere(texts, 'search_document');
}

// ---------------------------------------------------------------------------
// Qdrant collections
// ---------------------------------------------------------------------------

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

// Dimension selon le modèle choisi (Cohere & HF multilingual-e5-large & mxbai-embed-large = 1024)
function getVectorSize(): number {
  const provider = getEmbeddingProvider();
  if (provider === 'ollama') {
    const model = process.env.OLLAMA_EMBED_MODEL || 'mxbai-embed-large';
    if (model.includes('nomic-embed-text')) return 768;
  }
  if (provider === 'huggingface') {
    const model = process.env.HF_EMBED_MODEL || 'intfloat/multilingual-e5-large';
    if (model.includes('mpnet-base') || model.includes('minilm')) return 768;
  }
  return 1024;
}

export async function ensureCollections(): Promise<void> {
  const client = getQdrantClient();
  const existing = await client.getCollections();
  const existingNames = new Set(existing.collections.map((c) => c.name));
  const size = getVectorSize();

  for (const name of QDRANT_COLLECTIONS) {
    if (!existingNames.has(name)) {
      await client.createCollection(name, {
        vectors: { size, distance: 'Cosine' },
      });
      console.log(`[RAG] Created Qdrant collection: ${name} (dim=${size})`);
    }
  }
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
