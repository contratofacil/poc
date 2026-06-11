import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

import { initDb, run as dbRun } from './db';
import { ensureCollections, getQdrantClient, QDRANT_COLLECTIONS } from './rag-embeddings';
import { runIncrementalIndex } from './rag-crawler';

const SOURCE = process.argv[2]; // optionnel : DRE_I | DRE_II | DGSI | CURIA | EURLEX | TC | TCONTAS | CAAD | BTE | AT | BDP | CMVM | ASF | ADC

async function resetAllRuns(source?: string) {
  // Supprime tous les runs précédents pour forcer un reindex complet depuis le début.
  // Sans ça, le filtre "since" utilise la date du dernier run et ignore l'historique.
  if (source) {
    await dbRun(`DELETE FROM indexing_runs WHERE source = ?`, [source]);
    await dbRun(`DELETE FROM indexing_runs WHERE source = 'ALL'`);
  } else {
    await dbRun(`DELETE FROM indexing_runs`);
  }
}

async function main() {
  console.log('=== EasyLaw RAG Seed ===');
  console.log(`Qdrant  : ${process.env.QDRANT_URL}`);
  console.log(`Embed   : ${process.env.EMBEDDING_PROVIDER ?? 'cohere'}`);
  console.log(`Source  : ${SOURCE ?? 'ALL'}`);
  console.log('');

  console.log('[1/3] Initialisation base de données...');
  await initDb();

  console.log('[2/3] Création des collections Qdrant...');
  await ensureCollections();

  console.log('[2b]  Reset complet (runs + legal_documents + Qdrant)...');
  await resetAllRuns(SOURCE);
  // Vide les docs indexés (external_ids invalides des runs précédents)
  if (SOURCE) {
    await dbRun(`DELETE FROM legal_documents WHERE source = ?`, [SOURCE]);
  } else {
    await dbRun(`DELETE FROM legal_documents`);
  }
  // Recrée les collections Qdrant pour repartir d'un état propre
  const qdrant = getQdrantClient();
  for (const col of QDRANT_COLLECTIONS) {
    try { await qdrant.deleteCollection(col); } catch { /* inexistante, pas grave */ }
  }
  await ensureCollections();

  console.log(`[3/3] Indexation des sources légales (${SOURCE ?? 'toutes'})...`);
  console.log('      Cela peut prendre 5-15 minutes selon la vitesse des sites.\n');

  await runIncrementalIndex(SOURCE);

  console.log('\n=== Indexation terminée ===');
}

main().catch((err) => {
  console.error('\n[ERREUR]', err?.message ?? err);
  process.exit(1);
});
