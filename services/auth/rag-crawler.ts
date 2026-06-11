import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { run as dbRun, get as dbGet, all as dbAll } from './db';
import { embedDocuments, upsertToQdrant, SOURCE_TO_COLLECTION, QdrantCollection } from './rag-embeddings';

export interface CrawledDocument {
  source: 'DRE_I' | 'DRE_II' | 'DGSI' | 'CURIA' | 'EURLEX' | 'CAAD';
  external_id: string;
  title: string;
  url: string;
  full_text: string;
  date: string | null;
  doc_type: string;
}

export function chunkText(text: string, chunkSize = 512, overlap = 50): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

// ── DRE (Diário da República Electrónico) ────────────────────────────────────

export async function crawlDRE(serie: 'I' | 'II', since?: string): Promise<CrawledDocument[]> {
  const source = serie === 'I' ? 'DRE_I' : 'DRE_II';
  const rssUrl = `https://dre.pt/rss/rss.aspx?type=${serie === 'I' ? '1' : '2'}`;
  try {
    const res = await axios.get(rssUrl, { timeout: 15_000 });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const docs: CrawledDocument[] = [];
    $('item').each((_, el) => {
      const title = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const desc = $(el).find('description').text().replace(/<[^>]+>/g, ' ').trim();
      const pubDate = $(el).find('pubDate').text().trim();
      const date = pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null;
      if (!link) return;
      if (since && date && date < since) return;
      const external_id = `${source}::${Buffer.from(link).toString('base64').slice(0, 32)}`;
      docs.push({
        source,
        external_id,
        title: title || 'DRE Document',
        url: link,
        full_text: `${title}\n\n${desc}`,
        date,
        doc_type: 'legislation',
      });
    });
    console.log(`[CRAWLER] DRE ${serie}: ${docs.length} documents`);
    return docs;
  } catch (err: any) {
    console.error(`[CRAWLER] DRE ${serie} failed:`, err?.message);
    return [];
  }
}

// ── DGSI (jurisprudência nacional) ───────────────────────────────────────────

export async function crawlDGSI(since?: string): Promise<CrawledDocument[]> {
  try {
    const url = 'https://www.dgsi.pt/jdtj.nsf/0/SupremoTribunaldeJustiça?OpenView&Count=50';
    const res = await axios.get(url, { timeout: 15_000, headers: { 'User-Agent': 'EasyLaw-Indexer/1.0' } });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('a[href*="jdtj.nsf"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (!href || !text || text.length < 10) return;
      const fullUrl = href.startsWith('http') ? href : `https://www.dgsi.pt${href}`;
      const external_id = `DGSI::${Buffer.from(fullUrl).toString('base64').slice(0, 32)}`;
      docs.push({
        source: 'DGSI',
        external_id,
        title: text.slice(0, 200),
        url: fullUrl,
        full_text: text,
        date: null,
        doc_type: 'jurisprudence',
      });
    });
    console.log(`[CRAWLER] DGSI: ${docs.length} documents`);
    return docs.slice(0, 50);
  } catch (err: any) {
    console.error('[CRAWLER] DGSI failed:', err?.message);
    return [];
  }
}

// ── CURIA (Tribunal de Justiça da UE) ────────────────────────────────────────

export async function crawlCURIA(since?: string): Promise<CrawledDocument[]> {
  try {
    const year = since ? since.slice(0, 4) : new Date().getFullYear().toString();
    const url = `https://curia.europa.eu/juris/documents.jsf?language=pt&critere=YEAR&annee=${year}&domaine=ALL&nature=TJ,TA&type=T&menu=jurisprudence`;
    const res = await axios.get(url, { timeout: 20_000, headers: { 'User-Agent': 'EasyLaw-Indexer/1.0' } });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('a.title').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title) return;
      const fullUrl = href.startsWith('http') ? href : `https://curia.europa.eu${href}`;
      const external_id = `CURIA::${Buffer.from(fullUrl).toString('base64').slice(0, 32)}`;
      docs.push({
        source: 'CURIA',
        external_id,
        title,
        url: fullUrl,
        full_text: title,
        date: null,
        doc_type: 'jurisprudence',
      });
    });
    console.log(`[CRAWLER] CURIA: ${docs.length} documents`);
    return docs.slice(0, 50);
  } catch (err: any) {
    console.error('[CRAWLER] CURIA failed:', err?.message);
    return [];
  }
}

// ── EUR-Lex ───────────────────────────────────────────────────────────────────

export async function crawlEURLex(since?: string): Promise<CrawledDocument[]> {
  try {
    const dateParam = since ? `&DD_AFTER_YEAR=${since.slice(0, 4)}` : '';
    const url = `https://eur-lex.europa.eu/search.html?qid=1&text=Portugal&scope=EURLEX&type=advanced&lang=pt&locale=pt${dateParam}&DT_DOCUMENT_DATE_ACTION=after`;
    const res = await axios.get(url, { timeout: 20_000, headers: { 'User-Agent': 'EasyLaw-Indexer/1.0' } });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('a.title').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title) return;
      const fullUrl = href.startsWith('http') ? href : `https://eur-lex.europa.eu${href}`;
      const external_id = `EURLEX::${Buffer.from(fullUrl).toString('base64').slice(0, 32)}`;
      docs.push({
        source: 'EURLEX',
        external_id,
        title,
        url: fullUrl,
        full_text: title,
        date: null,
        doc_type: 'legislation',
      });
    });
    console.log(`[CRAWLER] EUR-Lex: ${docs.length} documents`);
    return docs.slice(0, 50);
  } catch (err: any) {
    console.error('[CRAWLER] EUR-Lex failed:', err?.message);
    return [];
  }
}

// ── CAAD (arbitragem fiscal/administrativa) ───────────────────────────────────

export async function crawlCAAD(since?: string): Promise<CrawledDocument[]> {
  try {
    const url = 'https://caad.org.pt/fiscalidade/jurisprudencia/decisoes/';
    const res = await axios.get(url, { timeout: 15_000, headers: { 'User-Agent': 'EasyLaw-Indexer/1.0' } });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('article a, .decisao a, h2 a, h3 a').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title || title.length < 5) return;
      const fullUrl = href.startsWith('http') ? href : `https://caad.org.pt${href}`;
      const external_id = `CAAD::${Buffer.from(fullUrl).toString('base64').slice(0, 32)}`;
      docs.push({
        source: 'CAAD',
        external_id,
        title,
        url: fullUrl,
        full_text: title,
        date: null,
        doc_type: 'jurisprudence',
      });
    });
    console.log(`[CRAWLER] CAAD: ${docs.length} documents`);
    return docs.slice(0, 50);
  } catch (err: any) {
    console.error('[CRAWLER] CAAD failed:', err?.message);
    return [];
  }
}

// ── Indexing pipeline ─────────────────────────────────────────────────────────

export async function indexDocuments(docs: CrawledDocument[], runId: string): Promise<void> {
  let processed = 0;
  for (const doc of docs) {
    try {
      const chunks = chunkText(doc.full_text);
      if (!chunks.length) continue;

      const vectors = await embedDocuments(chunks);
      const collection = SOURCE_TO_COLLECTION[doc.source] as QdrantCollection;

      const points = chunks.map((chunk, i) => {
        const qdrantId = crypto.randomUUID();
        return { chunk, vector: vectors[i], qdrantId };
      });

      // Upsert to Qdrant
      await upsertToQdrant(
        collection,
        points.map((p) => ({
          id: p.qdrantId,
          vector: p.vector,
          payload: {
            source: doc.source,
            external_id: doc.external_id,
            title: doc.title,
            url: doc.url,
            date: doc.date,
            doc_type: doc.doc_type,
          },
        })),
      );

      // Upsert to SQLite
      for (let i = 0; i < points.length; i++) {
        const id = crypto.randomUUID();
        await dbRun(
          `INSERT INTO legal_documents
             (id, source, external_id, title, url, content_chunk, chunk_index, qdrant_id, date, doc_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (source, external_id, chunk_index) DO UPDATE SET
             title = excluded.title,
             url = excluded.url,
             content_chunk = excluded.content_chunk,
             qdrant_id = excluded.qdrant_id,
             date = excluded.date,
             doc_type = excluded.doc_type,
             indexed_at = CURRENT_TIMESTAMP`,
          [
            id,
            doc.source,
            doc.external_id,
            doc.title,
            doc.url,
            points[i].chunk,
            i,
            points[i].qdrantId,
            doc.date,
            doc.doc_type,
          ],
        );
      }

      processed++;
      if (processed % 10 === 0) {
        await dbRun('UPDATE indexing_runs SET docs_processed = ? WHERE id = ?', [processed, runId]);
      }
    } catch (err: any) {
      console.error(`[INDEXER] Failed to index ${doc.external_id}:`, err?.message);
    }
  }
  await dbRun('UPDATE indexing_runs SET docs_processed = ? WHERE id = ?', [processed, runId]);
}

// ── Full incremental indexing ─────────────────────────────────────────────────

export async function runIncrementalIndex(source?: string): Promise<void> {
  // Find last successful run cutoff
  const lastRun = await dbGet<{ completed_at: string }>(
    `SELECT completed_at FROM indexing_runs
     WHERE status = 'completed' ${source ? `AND source = '${source}'` : ''}
     ORDER BY completed_at DESC LIMIT 1`,
  );
  const since = lastRun?.completed_at?.slice(0, 10);

  const runId = crypto.randomUUID();
  const sourceName = source ?? 'ALL';
  await dbRun(
    `INSERT INTO indexing_runs (id, source, status) VALUES (?, ?, 'running')`,
    [runId, sourceName],
  );
  console.log(`[INDEXER] Starting incremental index [${runId}] since ${since ?? 'beginning'}`);

  try {
    const allDocs: CrawledDocument[] = [];

    if (!source || source === 'DRE_I') allDocs.push(...(await crawlDRE('I', since)));
    if (!source || source === 'DRE_II') allDocs.push(...(await crawlDRE('II', since)));
    if (!source || source === 'DGSI') allDocs.push(...(await crawlDGSI(since)));
    if (!source || source === 'CURIA') allDocs.push(...(await crawlCURIA(since)));
    if (!source || source === 'EURLEX') allDocs.push(...(await crawlEURLex(since)));
    if (!source || source === 'CAAD') allDocs.push(...(await crawlCAAD(since)));

    await indexDocuments(allDocs, runId);

    await dbRun(
      `UPDATE indexing_runs SET status = 'completed', completed_at = ? WHERE id = ?`,
      [new Date().toISOString(), runId],
    );
    console.log(`[INDEXER] Completed [${runId}]: ${allDocs.length} documents indexed`);
  } catch (err: any) {
    await dbRun(
      `UPDATE indexing_runs SET status = 'failed', error = ?, completed_at = ? WHERE id = ?`,
      [err?.message ?? 'Unknown error', new Date().toISOString(), runId],
    );
    console.error(`[INDEXER] Failed [${runId}]:`, err?.message);
    throw err;
  }
}
