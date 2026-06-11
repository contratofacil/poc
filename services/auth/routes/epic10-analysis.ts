import { Router, Request, Response } from 'express';
import { run, get, all } from '../db';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 100 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.tiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

async function extractTextFromBuffer(buffer: Buffer, mimetype: string, filename: string): Promise<{ text: string; pageCount: number }> {
  try {
    if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
      const data = await pdfParse(buffer);
      return { text: data.text, pageCount: data.numpages };
    }
    // For images and other formats, return filename as placeholder (OCR would go here)
    return { text: `[Document: ${filename}]\n[Texte à extraire via OCR]`, pageCount: 1 };
  } catch {
    return { text: `[Erreur extraction: ${filename}]`, pageCount: 1 };
  }
}

export function createEpic10Router(
  authMiddleware: any,
  checkRole: any,
  putDocument: any,
  callPrompt: any,
  logAudit: any,
) {
  const router = Router();
  const ANALYSIS_ROLES = ['avocat', 'avocat_associe', 'avocat_junior', 'cabinet_avocat', 'admin_cabinet', 'super_admin', 'admin'];

  // POST /api/analysis/sessions — create analysis session
  router.post('/sessions', authMiddleware, checkRole(ANALYSIS_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { name } = req.body;
      const sessionId = crypto.randomUUID();
      await run(
        `INSERT INTO analysis_sessions (id, user_id, name, status, created_at) VALUES (?, ?, ?, 'uploading', ?)`,
        [sessionId, userId, name ?? `Analyse ${new Date().toLocaleDateString('fr-FR')}`, new Date().toISOString()]
      );
      res.json({ success: true, session: { id: sessionId, name, status: 'uploading' } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/analysis/sessions/:id/upload — batch upload documents
  router.post('/sessions/:id/upload', authMiddleware, checkRole(ANALYSIS_ROLES),
    upload.array('documents', 100),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = (req as any).user.id;
        const session = await get<any>('SELECT * FROM analysis_sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

        const files = req.files as Express.Multer.File[];
        if (!files?.length) { res.status(400).json({ success: false, message: 'No files provided' }); return; }

        // Check page limit
        let totalPages = session.page_count || 0;
        const docs: any[] = [];

        for (const file of files) {
          const { text, pageCount } = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);
          totalPages += pageCount;
          if (totalPages > 1500) {
            res.status(400).json({ success: false, message: 'Limite de 1500 pages dépassée' });
            return;
          }

          const docId = crypto.randomUUID();
          let r2Key: string | null = null;
          try {
            const stored = await putDocument(file.buffer, file.mimetype, `analysis/${req.params.id}/${docId}`);
            r2Key = stored?.r2Key ?? null;
          } catch { /* vault optional in dev */ }

          await run(
            `INSERT INTO analysis_documents (id, session_id, original_name, mime_type, page_count, ocr_done, r2_key, text_extracted, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [docId, req.params.id, file.originalname, file.mimetype, pageCount, 1, r2Key, text, new Date().toISOString()]
          );
          docs.push({ id: docId, name: file.originalname, pageCount });
        }

        await run(
          `UPDATE analysis_sessions SET doc_count = doc_count + ?, page_count = ?, status = 'ready', updated_at = ? WHERE id = ?`,
          [files.length, totalPages, new Date().toISOString(), req.params.id]
        );

        res.json({ success: true, uploaded: docs, totalPages });
      } catch (err: any) {
        console.error('[ANALYSIS UPLOAD]', err?.message);
        res.status(500).json({ success: false, message: 'Upload failed' });
      }
    }
  );

  // POST /api/analysis/sessions/:id/analyze — trigger AI structured analysis
  router.post('/sessions/:id/analyze', authMiddleware, checkRole(ANALYSIS_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const session = await get<any>('SELECT * FROM analysis_sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
      if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }

      await run(`UPDATE analysis_sessions SET status = 'processing', updated_at = ? WHERE id = ?`,
        [new Date().toISOString(), req.params.id]);

      const docs = await all<any>('SELECT original_name, text_extracted, page_count FROM analysis_documents WHERE session_id = ?', [req.params.id]);
      if (!docs.length) { res.status(400).json({ success: false, message: 'Aucun document dans cette session' }); return; }

      // Build corpus text (truncated for LLM context)
      const corpus = docs.map((d, i) =>
        `=== Document ${i + 1}: ${d.original_name} (${d.page_count} pages) ===\n${(d.text_extracted ?? '').slice(0, 3000)}`
      ).join('\n\n');

      const systemPrompt = `Vous êtes un avocat expert en droit portugais et européen. Analysez le corpus de documents juridiques fourni et produisez une analyse structurée complète en JSON avec les champs suivants:
{
  "resume": { "enjeux": "...", "parties": [], "roles": {}, "points_cles": [] },
  "clauses_sensibles": [{ "document": "...", "clause": "...", "risque": "...", "niveau": "faible|moyen|elevé" }],
  "chronologie": [{ "date": "...", "evenement": "...", "document_source": "..." }],
  "confrontation_sources": [{ "point": "...", "reference_pt_eu": "...", "commentaire": "..." }],
  "recommandations": []
}
Répondez UNIQUEMENT avec le JSON valide, sans markdown, sans texte avant ou après.`;

      let analysisResult: any = null;
      try {
        const { callPrompt: call } = await import('../rag-llm-router');
        const rawResult = await call('research_deepdive_system', {
          query: `Analyse juridique du corpus: ${session.name}`,
          context: corpus.slice(0, 8000),
          sub_queries: 'analyse structurée, clauses sensibles, chronologie, confrontation sources',
        });
        // Try to parse JSON from response
        const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          analysisResult = { resume: { enjeux: rawResult, parties: [], roles: {}, points_cles: [] }, clauses_sensibles: [], chronologie: [], confrontation_sources: [], recommandations: [] };
        }
      } catch (llmErr: any) {
        analysisResult = { error: llmErr?.message, resume: { enjeux: 'Erreur lors de l\'analyse IA', parties: [], roles: {}, points_cles: [] }, clauses_sensibles: [], chronologie: [], confrontation_sources: [], recommandations: [] };
      }

      await run(
        `UPDATE analysis_sessions SET status = 'done', result_json = ?, updated_at = ? WHERE id = ?`,
        [JSON.stringify(analysisResult), new Date().toISOString(), req.params.id]
      );
      await logAudit(userId, 'analysis_complete', 'analysis_session', req.params.id, req.ip, req.headers['user-agent']);

      res.json({ success: true, result: analysisResult });
    } catch (err: any) {
      await run(`UPDATE analysis_sessions SET status = 'error', error = ?, updated_at = ? WHERE id = ?`,
        [err?.message ?? 'Unknown error', new Date().toISOString(), req.params.id]);
      res.status(500).json({ success: false, message: 'Analysis failed' });
    }
  });

  // GET /api/analysis/sessions — history
  router.get('/sessions', authMiddleware, checkRole(ANALYSIS_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const sessions = await all<any>(
        'SELECT id, name, status, doc_count, page_count, created_at FROM analysis_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      res.json({ success: true, sessions });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/analysis/sessions/:id — get session with results
  router.get('/sessions/:id', authMiddleware, checkRole(ANALYSIS_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const session = await get<any>('SELECT * FROM analysis_sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
      if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
      const docs = await all<any>('SELECT id, original_name, mime_type, page_count, ocr_done FROM analysis_documents WHERE session_id = ?', [req.params.id]);
      const result = session.result_json ? JSON.parse(session.result_json) : null;
      res.json({ success: true, session: { ...session, result_json: undefined }, result, documents: docs });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/analysis/sessions/:id/export/pdf — export analysis as PDF
  router.post('/sessions/:id/export/pdf', authMiddleware, checkRole(ANALYSIS_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const session = await get<any>('SELECT * FROM analysis_sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
      if (!session || !session.result_json) { res.status(404).json({ success: false, message: 'Session ou résultats introuvables' }); return; }

      const { generateResearchPdf, storeResearchPdf } = await import('../rag-pdf');
      const result = JSON.parse(session.result_json);
      const summaryText = result.resume?.enjeux ?? 'Analyse non disponible';

      const userRow = await get<{ name: string | null; email: string }>('SELECT name, email FROM users WHERE id = ?', [userId]);

      const pdfBuffer = await generateResearchPdf(
        {
          id: req.params.id as string,
          query: `Analyse: ${session.name}`,
          mode: 'analysis',
          response_text: JSON.stringify(result, null, 2),
          summary: summaryText,
          sources_json: null,
          table_json: null,
        },
        { name: userRow?.name ?? null, email: userRow?.email ?? '' },
      );

      const vaultId = await storeResearchPdf(pdfBuffer, userId, req.params.id as string);

      res.json({ success: true, vaultDocumentId: vaultId, message: 'PDF exporté et stocké dans le vault' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message ?? 'Export failed' });
    }
  });

  // POST /api/analysis/sessions/:id/export/excel — export analysis as Excel
  router.post('/sessions/:id/export/excel', authMiddleware, checkRole(ANALYSIS_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const session = await get<any>('SELECT * FROM analysis_sessions WHERE id = ? AND user_id = ?', [req.params.id, userId]);
      if (!session || !session.result_json) { res.status(404).json({ success: false, message: 'Session ou résultats introuvables' }); return; }

      const XLSX = await import('xlsx');
      const result = JSON.parse(session.result_json);

      const wb = XLSX.utils.book_new();

      // Sheet 1: Clauses sensibles
      if (result.clauses_sensibles?.length) {
        const ws = XLSX.utils.json_to_sheet(result.clauses_sensibles);
        XLSX.utils.book_append_sheet(wb, ws, 'Clauses sensibles');
      }

      // Sheet 2: Chronologie
      if (result.chronologie?.length) {
        const ws2 = XLSX.utils.json_to_sheet(result.chronologie);
        XLSX.utils.book_append_sheet(wb, ws2, 'Chronologie');
      }

      // Sheet 3: Résumé
      const resumeSheet = XLSX.utils.json_to_sheet([
        { Champ: 'Enjeux', Valeur: result.resume?.enjeux ?? '' },
        { Champ: 'Parties', Valeur: (result.resume?.parties ?? []).join(', ') },
        { Champ: 'Points clés', Valeur: (result.resume?.points_cles ?? []).join('\n') },
      ]);
      XLSX.utils.book_append_sheet(wb, resumeSheet, 'Résumé');

      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="analyse-${req.params.id}.xlsx"`,
      });
      res.send(excelBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message ?? 'Export Excel failed' });
    }
  });

  return router;
}
