import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { run as dbRun, get as dbGet } from './db';
import { embedDocuments, upsertToQdrant, SOURCE_TO_COLLECTION, QdrantCollection } from './rag-embeddings';

export type SourceId =
  // Législation nationale PT
  | 'DRE_I' | 'DRE_II' | 'ACT' | 'BTE'
  // Droit européen
  | 'EURLEX' | 'CURIA'
  // Jurisprudence
  | 'DGSI' | 'TC' | 'TCONTAS' | 'CAAD'
  // Autorités de régulation
  | 'AT' | 'BDP' | 'CMVM' | 'ASF' | 'ADC';

export interface CrawledDocument {
  source: SourceId;
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

const HEADERS = { 'User-Agent': 'EasyLaw-Indexer/1.0', 'Accept-Language': 'pt-PT,pt;q=0.9' };

function hash(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
}

function makeDoc(
  source: SourceId,
  url: string,
  title: string,
  full_text: string,
  date: string | null = null,
  doc_type = 'legislation',
): CrawledDocument {
  return { source, external_id: `${source}::${hash(url)}`, title, url, full_text, date, doc_type };
}

// ── DRE (Diário da República Eletrónico) ────────────────────────────────────
// dre.pt → diariodarepublica.pt (2023). REST API (serie=1/2), then RSS fallback.

export async function crawlDRE(serie: 'I' | 'II', since?: string): Promise<CrawledDocument[]> {
  const source: SourceId = serie === 'I' ? 'DRE_I' : 'DRE_II';
  const serieNum = serie === 'I' ? '1' : '2';

  // 1. Try REST JSON API — DRE uses numeric serie parameter (1 or 2)
  const apiCandidates = [
    `https://diariodarepublica.pt/dr/api/publicacao/pesquisa?tipoPesquisa=GLOBAL&valor=&serie=${serieNum}&pageSize=50`,
    `https://diariodarepublica.pt/dr/api/publicacao/pesquisa?serie=${serieNum}&pageSize=50`,
    `https://diariodarepublica.pt/dr/api/publicacao/pesquisa?tipoPesquisa=GLOBAL&valor=&serie=${serie}&pageSize=50`,
  ];
  for (const apiUrl of apiCandidates) {
    try {
      const res = await axios.get(apiUrl, { timeout: 20_000, headers: { ...HEADERS, Accept: 'application/json' } });
      if (res.status !== 200) continue;
      const data = res.data;
      const items: any[] = Array.isArray(data) ? data : (data?.items ?? data?.results ?? data?.publicacoes ?? data?.data ?? []);
      if (!items.length) { console.log(`[CRAWLER] DRE ${serie} API (${apiUrl.split('?')[0]}): 200 OK but empty array`); continue; }
      const docs = items
        .filter((item: any) => {
          const date = item.data ?? item.date ?? null;
          return !(since && date && date < since);
        })
        .map((item: any) => {
          const title = item.titulo ?? item.title ?? item.sumario ?? 'DRE Document';
          const url = item.url ?? item.link ?? `https://diariodarepublica.pt/dr/detalhe/${item.id ?? ''}`;
          const text = [item.titulo, item.sumario, item.descricao, item.texto].filter(Boolean).join('\n\n');
          return makeDoc(source, url, title, text || title, item.data ?? item.date ?? null);
        });
      console.log(`[CRAWLER] DRE ${serie}: ${docs.length} documents (API)`);
      return docs;
    } catch (err: any) {
      const status = err?.response?.status ?? 'ERR';
      console.warn(`[CRAWLER] DRE ${serie} API failed (HTTP ${status}):`, err?.message?.slice(0, 120));
    }
  }

  // 2. RSS fallback — current diariodarepublica.pt RSS paths
  const rssCandidates = [
    `https://diariodarepublica.pt/dr/pt/rss?serie=${serieNum}`,
    `https://diariodarepublica.pt/dr/rss/serie${serieNum}`,
    `https://diariodarepublica.pt/rss/rss.aspx?serie=${serieNum}`,
    `https://diariodarepublica.pt/rss/rss.aspx?serie=${serie}`,
    'https://diariodarepublica.pt/rss/rss.aspx',
  ];
  for (const rssUrl of rssCandidates) {
    try {
      const res = await axios.get(rssUrl, { timeout: 20_000, headers: HEADERS });
      if (res.status !== 200) continue;
      const $ = cheerio.load(res.data, { xmlMode: true });
      const items = $('item');
      if (!items.length) { console.log(`[CRAWLER] DRE ${serie} RSS (${rssUrl}): 200 OK but 0 items`); continue; }
      const docs: CrawledDocument[] = [];
      items.each((_, el) => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim() || $(el).find('guid').text().trim();
        const desc = $(el).find('description').text().replace(/<[^>]+>/g, ' ').trim();
        const pubDate = $(el).find('pubDate').text().trim();
        const date = pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null;
        if (!link) return;
        if (since && date && date < since) return;
        // Filter by serie only when using the generic feed (no serie param)
        if (!rssUrl.includes(`serie=${serieNum}`) && !rssUrl.includes(`serie=${serie}`)) {
          const isSerie2 = /s[eé]rie\s*ii/i.test(title + link);
          if (serie === 'I' && isSerie2) return;
          if (serie === 'II' && !isSerie2) return;
        }
        docs.push(makeDoc(source, link, title || 'DRE Document', `${title}\n\n${desc}`, date));
      });
      console.log(`[CRAWLER] DRE ${serie}: ${docs.length} documents (RSS ${rssUrl})`);
      return docs;
    } catch (err: any) {
      const status = err?.response?.status ?? 'ERR';
      console.warn(`[CRAWLER] DRE ${serie} RSS failed (HTTP ${status}, ${rssUrl}):`, err?.message?.slice(0, 120));
    }
  }
  console.warn(`[CRAWLER] DRE ${serie}: 0 documents — all API/RSS attempts failed (check Railway IP allowlist)`);
  return [];
}

// ── DGSI (jurisprudência nacional) ───────────────────────────────────────────
// 6 bases : STJ, STA, JTCA (Sul), JTCN (Norte), JTRP (Porto), JTRL (Lisboa)

const DGSI_DATABASES = [
  { path: '/jstj.nsf?OpenDatabase', label: 'STJ' },
  { path: '/jsta.nsf?OpenDatabase', label: 'STA' },
  { path: '/jtca.nsf?OpenDatabase', label: 'TCA-Sul' },
  { path: '/jtcn.nsf?OpenDatabase', label: 'TCA-Norte' },
  { path: '/jtrp.nsf?OpenDatabase', label: 'TRP' },
  { path: '/jtrl.nsf?OpenDatabase', label: 'TRL' },
];

async function crawlDGSIDatabase(dbPath: string, since?: string): Promise<CrawledDocument[]> {
  const url = `https://www.dgsi.pt${dbPath}`;
  const res = await axios.get(url, { timeout: 15_000, headers: HEADERS });
  const $ = cheerio.load(res.data);
  const docs: CrawledDocument[] = [];
  $('a[href*="OpenDocument"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (!href) return;
    const fullUrl = href.startsWith('http') ? href : `https://www.dgsi.pt${href}`;
    const caseNum = $(el).text().trim();
    const row = $(el).closest('tr');
    const dateCell = row.find('td').eq(0).text().trim();
    const descriptor = row.find('td').last().text().trim();
    const title = caseNum || descriptor.slice(0, 100) || 'Acórdão';
    const fullText = [caseNum, dateCell, descriptor].filter(Boolean).join(' — ');
    if (fullText.length < 5) return;
    let date: string | null = null;
    const dm = dateCell.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dm) date = `${dm[3]}-${dm[2]}-${dm[1]}`;
    if (since && date && date < since) return;
    docs.push(makeDoc('DGSI', fullUrl, title, fullText, date, 'jurisprudence'));
  });
  return docs;
}

export async function crawlDGSI(since?: string): Promise<CrawledDocument[]> {
  try {
    const results = await Promise.allSettled(
      DGSI_DATABASES.map(({ path, label }) =>
        crawlDGSIDatabase(path, since).catch((e) => {
          console.warn(`[CRAWLER] DGSI/${label} failed:`, e?.message);
          return [] as CrawledDocument[];
        }),
      ),
    );
    const docs = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    console.log(`[CRAWLER] DGSI: ${docs.length} documents (${DGSI_DATABASES.length} bases)`);
    return docs.slice(0, 200);
  } catch (err: any) {
    console.error('[CRAWLER] DGSI failed:', err?.message);
    return [];
  }
}

// ── CURIA (Cour de Justice de l'UE) ──────────────────────────────────────────
// Redirected to infocuria.curia.europa.eu (JS-heavy). Multiple selectors tried.

export async function crawlCURIA(since?: string): Promise<CrawledDocument[]> {
  try {
    const year = since ? since.slice(0, 4) : new Date().getFullYear().toString();
    const dateFrom = encodeURIComponent(`01/01/${year}`);
    const dateTo = encodeURIComponent(`31/12/${year}`);
    const url = `https://curia.europa.eu/juris/liste.jsf?language=pt&jur=C,T&dates=on&dateDebut=${dateFrom}&dateFin=${dateTo}&nomusuel=&domaine=&mots=&resmax=100`;
    const res = await axios.get(url, { timeout: 20_000, headers: HEADERS, maxRedirects: 5 });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    const selectors = ['a.title', 'td.table_document_nom a', 'a[href*="document.jsf"]', '.resultats a'];
    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const title = $(el).text().trim();
        if (!href || !title || title.length < 5) return;
        const fullUrl = href.startsWith('http') ? href : `https://curia.europa.eu${href}`;
        docs.push(makeDoc('CURIA', fullUrl, title, title, null, 'jurisprudence'));
      });
      if (docs.length > 0) break;
    }
    console.log(`[CRAWLER] CURIA: ${docs.length} documents`);
    return docs.slice(0, 100);
  } catch (err: any) {
    console.error('[CRAWLER] CURIA failed:', err?.message);
    return [];
  }
}

// ── EUR-Lex (Directives & Règlements UE) ────────────────────────────────────

export async function crawlEURLex(since?: string): Promise<CrawledDocument[]> {
  try {
    const yearParam = since ? `&DD_AFTER_YEAR=${since.slice(0, 4)}` : '';
    const url = `https://eur-lex.europa.eu/search.html?text=direito+Portugal&scope=EURLEX&type=quick&lang=pt${yearParam}`;
    const res = await axios.get(url, { timeout: 20_000, headers: HEADERS });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('a[href*="legal-content/AUTO"], a[href*="CELEX"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title || title.length < 5) return;
      const fullUrl = href.startsWith('http') ? href : `https://eur-lex.europa.eu/${href.replace(/^\.\//, '')}`;
      docs.push(makeDoc('EURLEX', fullUrl, title, title, null));
    });
    console.log(`[CRAWLER] EUR-Lex: ${docs.length} documents`);
    return docs.slice(0, 100);
  } catch (err: any) {
    console.error('[CRAWLER] EUR-Lex failed:', err?.message);
    return [];
  }
}

// ── TC — Tribunal Constitucional ─────────────────────────────────────────────

export async function crawlTC(since?: string): Promise<CrawledDocument[]> {
  try {
    const year = since ? since.slice(0, 4) : new Date().getFullYear().toString();
    const url = `http://www.tribunalconstitucional.pt/tc/acordaos/?ano=${year}`;
    const res = await axios.get(url, { timeout: 15_000, headers: HEADERS });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('a[href*="/tc/acordaos/"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title || title.length < 5) return;
      if (!href.match(/acordaos\/\d/)) return;
      const fullUrl = href.startsWith('http') ? href : `http://www.tribunalconstitucional.pt${href}`;
      docs.push(makeDoc('TC', fullUrl, title, title, null, 'jurisprudence'));
    });
    console.log(`[CRAWLER] TC: ${docs.length} documents`);
    return docs.slice(0, 100);
  } catch (err: any) {
    console.error('[CRAWLER] TC failed:', err?.message);
    return [];
  }
}

// ── TCONTAS — Tribunal de Contas ──────────────────────────────────────────────

export async function crawlTCONTAS(since?: string): Promise<CrawledDocument[]> {
  try {
    const url = 'https://www.tcontas.pt/pt-pt/ProdutosTC/Acordaos/AcordaosTC/Paginas/acordaos-tc.aspx';
    const res = await axios.get(url, { timeout: 15_000, headers: HEADERS });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('a[href*="Documents"], a[href*="acordaos"], a[href*=".pdf"], a[href*="Paginas"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title || title.length < 5) return;
      if (href.includes('Paginas/acordaos-tc')) return; // skip self-links
      const fullUrl = href.startsWith('http') ? href : `https://www.tcontas.pt${href}`;
      docs.push(makeDoc('TCONTAS', fullUrl, title, title, null, 'jurisprudence'));
    });
    console.log(`[CRAWLER] TCONTAS: ${docs.length} documents`);
    return docs.slice(0, 100);
  } catch (err: any) {
    console.error('[CRAWLER] TCONTAS failed:', err?.message);
    return [];
  }
}

// ── CAAD — Centre d'Arbitrage Administratif ───────────────────────────────────
// Note: caad.org.pt requires authentication. Stub — returns [] gracefully.

export async function crawlCAAD(since?: string): Promise<CrawledDocument[]> {
  // The CAAD public portal is behind authentication.
  // When a public API or feed becomes available, implement here.
  console.log('[CRAWLER] CAAD: 0 documents (portail derrière authentification)');
  return [];
}

// ── BTE — Boletim do Trabalho e do Emprego ────────────────────────────────────

export async function crawlBTE(since?: string): Promise<CrawledDocument[]> {
  try {
    const url = 'https://bte.gep.mtsss.gov.pt/';
    const res = await axios.get(url, { timeout: 15_000, headers: HEADERS });
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $('a[href*="/completos/"], a[href*="/separatas/"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || title.length < 3) return;
      const fullUrl = href.startsWith('http') ? href : `https://bte.gep.mtsss.gov.pt${href}`;
      // Filter by year if since provided
      if (since) {
        const year = since.slice(0, 4);
        if (!fullUrl.includes(year) && !fullUrl.includes((parseInt(year) - 1).toString())) return;
      }
      const displayTitle = title || `BTE ${href.split('/').pop()}`;
      docs.push(makeDoc('BTE', fullUrl, displayTitle, `Boletim do Trabalho e do Emprego: ${displayTitle}`, null));
    });
    console.log(`[CRAWLER] BTE: ${docs.length} documents`);
    return docs.slice(0, 100);
  } catch (err: any) {
    console.error('[CRAWLER] BTE failed:', err?.message);
    return [];
  }
}

// ── Autorités de régulation (stubs — sites bloquent les scrapers) ─────────────
// AT, BDP, CMVM, ASF, AdC : retournent [] pour l'instant.
// Implémenter dès qu'un endpoint public/API est identifié.

async function crawlRegulator(source: SourceId, url: string, selector: string, base: string): Promise<CrawledDocument[]> {
  try {
    const res = await axios.get(url, { timeout: 20_000, headers: HEADERS });
    if (res.status !== 200) {
      console.warn(`[CRAWLER] ${source}: HTTP ${res.status} — 0 documents`);
      return [];
    }
    const $ = cheerio.load(res.data);
    const docs: CrawledDocument[] = [];
    $(selector).each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title || title.length < 5) return;
      const fullUrl = href.startsWith('http') ? href : `${base}${href}`;
      docs.push(makeDoc(source, fullUrl, title, title, null));
    });
    if (docs.length === 0) {
      console.warn(`[CRAWLER] ${source}: 200 OK but selector "${selector}" matched 0 links — page structure may have changed`);
    } else {
      console.log(`[CRAWLER] ${source}: ${docs.length} documents`);
    }
    return docs.slice(0, 100);
  } catch (err: any) {
    const status = err?.response?.status ?? 'ERR';
    console.warn(`[CRAWLER] ${source}: HTTP ${status} — ${err?.message?.slice(0, 120) ?? 'erreur'} (check if site blocks cloud IPs)`);
    return [];
  }
}

export const crawlAT    = (since?: string) => crawlRegulator('AT',   'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/', 'a[href*="legislacao"]', 'https://info.portaldasfinancas.gov.pt');
export const crawlBDP   = (since?: string) => crawlRegulator('BDP',  'https://www.bportugal.pt/legislacao-e-normas/legislacao', 'a[href*="legislacao"], a[href*="normas"]', 'https://www.bportugal.pt');
export const crawlCMVM  = (since?: string) => crawlRegulator('CMVM', 'https://www.cmvm.pt/pt/Legislacao/Legislacaonacional/Regulamentos/Pages/default.aspx', 'a[href*="Regulamentos"], a[href*="Legislacao"]', 'https://www.cmvm.pt');
export const crawlASF   = (since?: string) => crawlRegulator('ASF',  'https://www.asf.com.pt/NR/exeres/legislacao-e-normas/', 'a[href*="legislacao"], a[href*="normas"]', 'https://www.asf.com.pt');
export const crawlADC   = (since?: string) => crawlRegulator('ADC',  'https://www.concorrencia.pt/pt/decisoes', 'a[href*="decisao"], a[href*="decisoes"]', 'https://www.concorrencia.pt');
export const crawlACT   = (since?: string) => crawlRegulator('ACT',  'https://www.act.gov.pt/(pt-PT)/Legislacao/Paginas/default.aspx', 'a[href*="Legislacao"], a[href*="legislacao"]', 'https://www.act.gov.pt');

// ── Indexing pipeline ─────────────────────────────────────────────────────────

export async function indexDocuments(docs: CrawledDocument[], runId: string): Promise<void> {
  let processed = 0;
  for (const doc of docs) {
    try {
      const chunks = chunkText(doc.full_text);
      if (!chunks.length) {
        console.warn(`[INDEXER] Skipped ${doc.source} — full_text vide. title="${doc.title.slice(0, 80)}"`);
        continue;
      }

      const vectors = await embedDocuments(chunks);
      const collection = SOURCE_TO_COLLECTION[doc.source] as QdrantCollection;

      const points = chunks.map((chunk, i) => ({ chunk, vector: vectors[i], qdrantId: crypto.randomUUID() }));

      await upsertToQdrant(
        collection,
        points.map((p) => ({
          id: p.qdrantId,
          vector: p.vector,
          payload: { source: doc.source, external_id: doc.external_id, title: doc.title, url: doc.url, date: doc.date, doc_type: doc.doc_type },
        })),
      );

      for (let i = 0; i < points.length; i++) {
        await dbRun(
          `INSERT INTO legal_documents (id, source, external_id, title, url, content_chunk, chunk_index, qdrant_id, date, doc_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (source, external_id, chunk_index) DO UPDATE SET
             title = excluded.title, url = excluded.url, content_chunk = excluded.content_chunk,
             qdrant_id = excluded.qdrant_id, date = excluded.date, doc_type = excluded.doc_type,
             indexed_at = CURRENT_TIMESTAMP`,
          [crypto.randomUUID(), doc.source, doc.external_id, doc.title, doc.url, points[i].chunk, i, points[i].qdrantId, doc.date, doc.doc_type],
        );
      }

      processed++;
      if (processed % 10 === 0) await dbRun('UPDATE indexing_runs SET docs_processed = ? WHERE id = ?', [processed, runId]);
    } catch (err: any) {
      console.error(`[INDEXER] Failed to index ${doc.source}:${doc.external_id.slice(0, 16)}:`, err?.message);
    }
  }
  await dbRun('UPDATE indexing_runs SET docs_processed = ? WHERE id = ?', [processed, runId]);
}

// ── Full incremental indexing ─────────────────────────────────────────────────

export async function runIncrementalIndex(source?: string, force = false): Promise<void> {
  // For ALL runs: only use previous ALL runs as baseline (not single-source runs,
  // which would push `since` to today and filter out all historical content).
  // `force=true` skips the `since` filter entirely (full reindex).
  let since: string | undefined;
  if (!force) {
    const lookupSource = source ?? 'ALL';
    const lastRun = await dbGet<{ completed_at: string }>(
      `SELECT completed_at FROM indexing_runs WHERE status = 'completed' AND source = ? ORDER BY completed_at DESC LIMIT 1`,
      [lookupSource],
    );
    since = lastRun?.completed_at?.slice(0, 10);
  }

  const runId = crypto.randomUUID();
  const sourceName = source ?? 'ALL';
  await dbRun(`INSERT INTO indexing_runs (id, source, status) VALUES (?, ?, 'running')`, [runId, sourceName]);
  console.log(`[INDEXER] Starting incremental index [${runId}] since ${since ?? 'beginning'}`);

  try {
    const allDocs: CrawledDocument[] = [];

    if (!source || source === 'DRE_I')    allDocs.push(...await crawlDRE('I', since));
    if (!source || source === 'DRE_II')   allDocs.push(...await crawlDRE('II', since));
    if (!source || source === 'DGSI')     allDocs.push(...await crawlDGSI(since));
    if (!source || source === 'CURIA')    allDocs.push(...await crawlCURIA(since));
    if (!source || source === 'EURLEX')   allDocs.push(...await crawlEURLex(since));
    if (!source || source === 'TC')       allDocs.push(...await crawlTC(since));
    if (!source || source === 'TCONTAS')  allDocs.push(...await crawlTCONTAS(since));
    if (!source || source === 'CAAD')     allDocs.push(...await crawlCAAD(since));
    if (!source || source === 'BTE')      allDocs.push(...await crawlBTE(since));
    if (!source || source === 'AT')       allDocs.push(...await crawlAT(since));
    if (!source || source === 'BDP')      allDocs.push(...await crawlBDP(since));
    if (!source || source === 'CMVM')     allDocs.push(...await crawlCMVM(since));
    if (!source || source === 'ASF')      allDocs.push(...await crawlASF(since));
    if (!source || source === 'ADC')      allDocs.push(...await crawlADC(since));
    if (!source || source === 'ACT')      allDocs.push(...await crawlACT(since));

    await indexDocuments(allDocs, runId);

    await dbRun(`UPDATE indexing_runs SET status = 'completed', completed_at = ? WHERE id = ?`, [new Date().toISOString(), runId]);
    console.log(`[INDEXER] Completed [${runId}]: ${allDocs.length} documents indexed`);
  } catch (err: any) {
    await dbRun(`UPDATE indexing_runs SET status = 'failed', error = ?, completed_at = ? WHERE id = ?`, [err?.message ?? 'Unknown error', new Date().toISOString(), runId]);
    console.error(`[INDEXER] Failed [${runId}]:`, err?.message);
    throw err;
  }
}
