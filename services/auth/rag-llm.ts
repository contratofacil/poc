import { Response } from 'express';
import { run as dbRun } from './db';
import { streamPrompt, callPrompt } from './rag-llm-router';
import { SearchResult, buildContext } from './rag-search';
import crypto from 'crypto';

export interface StreamResearchResult {
  searchId: string;
  responseText: string;
  summary: string;
  tableHtml: string;
}

export async function streamResearch(
  query: string,
  results: SearchResult[],
  res: Response,
  mode: 'standard' | 'deepdive',
  userId: string,
  subQueries?: string[],
): Promise<StreamResearchResult> {
  const promptKey = mode === 'deepdive' ? 'research_deepdive_system' : 'research_standard_system';
  const context = buildContext(results);

  const variables: Record<string, string> = {
    query,
    context,
    sub_queries: subQueries ? subQueries.join(', ') : '',
  };

  // Stream the main response
  const responseText = await streamPrompt(promptKey, variables, res);

  // Generate summary (non-streaming, fire after main text)
  let summary = '';
  try {
    summary = await callPrompt('research_standard_system', {
      query,
      context: responseText.slice(0, 1500),
    });
    summary = summary.slice(0, 500); // Keep summary brief
  } catch {
    summary = responseText.slice(0, 300);
  }

  // Generate recap table for DeepDive
  let tableHtml = '';
  if (mode === 'deepdive' && results.length > 0) {
    try {
      const sourcesText = results
        .slice(0, 10)
        .map((r) => `${r.title} (${r.source}, ${r.date ?? ''}) — ${r.url}`)
        .join('\n');
      tableHtml = await callPrompt('research_recap_table', { query, sources_text: sourcesText });
    } catch {
      tableHtml = '';
    }
    if (tableHtml) {
      res.write('data: ' + JSON.stringify({ type: 'table', content: tableHtml }) + '\n\n');
    }
  }

  // Persist search record
  const searchId = crypto.randomUUID();
  try {
    await dbRun(
      `INSERT INTO research_searches (id, user_id, query, mode, response_text, sources_json, summary, table_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        searchId,
        userId,
        query,
        mode,
        responseText,
        JSON.stringify(results),
        summary,
        tableHtml || null,
      ],
    );
  } catch (err) {
    console.error('[RAG] Failed to persist research search:', err);
  }

  // Emit done event with metadata
  res.write(
    'data: ' +
      JSON.stringify({
        type: 'done',
        searchId,
        sources: results,
        summary,
      }) +
      '\n\n',
  );

  return { searchId, responseText, summary, tableHtml };
}
