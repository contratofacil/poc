import { Router, Request, Response } from 'express';
import { run, get, all } from '../db';
import crypto from 'crypto';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 100 } });

export function createEpic12Router(
  authMiddleware: any,
  checkRole: any,
  putDocument: any,
  logAudit: any,
) {
  const router = Router();
  const GED_ROLES = ['avocat', 'avocat_associe', 'avocat_junior', 'cabinet_avocat', 'admin_cabinet', 'super_admin', 'admin'];
  const ADMIN_ROLES = ['admin_cabinet', 'super_admin', 'admin'];

  function getCabinetId(req: Request): string {
    return (req as any).user?.cabinet_id ?? (req as any).user?.id;
  }

  // ─── US-12.1: GED Import & Indexing ──────────────────────────────────────────

  // POST /api/ged/dossiers — create a dossier
  router.post('/dossiers', authMiddleware, checkRole(GED_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const cabinetId = getCabinetId(req);
      const { name, description } = req.body;
      if (!name?.trim()) { res.status(400).json({ success: false, message: 'name required' }); return; }

      const dossierId = crypto.randomUUID();
      await run(
        `INSERT INTO cabinet_dossiers (id, cabinet_id, name, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [dossierId, cabinetId, name, description ?? null, userId, new Date().toISOString()]
      );
      res.status(201).json({ success: true, dossier: { id: dossierId, name, description } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/ged/dossiers — list dossiers
  router.get('/dossiers', authMiddleware, checkRole(GED_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const cabinetId = getCabinetId(req);
      const dossiers = await all<any>('SELECT * FROM cabinet_dossiers WHERE cabinet_id = ? ORDER BY name', [cabinetId]);
      res.json({ success: true, dossiers });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/ged/import — batch import documents
  router.post('/import', authMiddleware, checkRole(GED_ROLES),
    upload.array('documents', 100),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = (req as any).user.id;
        const cabinetId = getCabinetId(req);
        const { dossier_id } = req.body;

        const files = req.files as Express.Multer.File[];
        if (!files?.length) { res.status(400).json({ success: false, message: 'No files provided' }); return; }

        const imported: any[] = [];

        for (const file of files) {
          const docId = crypto.randomUUID();
          const now = new Date().toISOString();

          let r2Key: string | null = null;
          try {
            const stored = await putDocument(file.buffer, file.mimetype, `ged/${cabinetId}/${docId}`);
            r2Key = stored?.r2Key ?? null;
          } catch { /* dev mode */ }

          // AI categorization
          let aiCategory = 'autre';
          let aiPriority = 'normal';
          let aiSummary = '';
          try {
            const { callPrompt } = await import('../rag-llm-router');
            const catResult = await callPrompt('assistant_system', {
              query: `Catégorisez ce document (nom: "${file.originalname}") en JSON: {"category": "contrat|jugement|correspondance|acte|rapport|autre", "priority": "urgent|important|normal|archivage", "summary": "résumé en 1 phrase"}`,
              context: '',
            });
            const jsonMatch = catResult.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              aiCategory = parsed.category ?? aiCategory;
              aiPriority = parsed.priority ?? aiPriority;
              aiSummary = parsed.summary ?? '';
            }
          } catch { /* LLM optional */ }

          await run(
            `INSERT INTO cabinet_documents (id, cabinet_id, dossier_id, title, doc_type, r2_key, mime_type, size_bytes, ai_category, ai_priority, ai_summary, uploaded_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [docId, cabinetId, dossier_id ?? null, file.originalname, aiCategory, r2Key, file.mimetype,
             file.size, aiCategory, aiPriority, aiSummary, userId, now, now]
          );

          // Add to validation queue
          const valId = crypto.randomUUID();
          await run(
            `INSERT INTO document_validations (id, document_id, cabinet_id, status, created_at) VALUES (?, ?, ?, 'pending', ?)`,
            [valId, docId, cabinetId, now]
          );

          imported.push({ id: docId, name: file.originalname, category: aiCategory, priority: aiPriority, summary: aiSummary });
        }

        res.json({ success: true, imported, count: imported.length });
      } catch (err: any) {
        console.error('[GED IMPORT]', err?.message);
        res.status(500).json({ success: false, message: 'Import failed' });
      }
    }
  );

  // ─── US-12.2: NL Search + Library ────────────────────────────────────────────

  // POST /api/ged/search — NL search over cabinet documents
  router.post('/search', authMiddleware, checkRole(GED_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const cabinetId = getCabinetId(req);
      const { query, limit = 20 } = req.body;
      if (!query?.trim()) { res.status(400).json({ success: false, message: 'query required' }); return; }

      // Full-text search in SQLite (cabinet-isolated)
      const results = await all<any>(
        `SELECT id, title, doc_type, ai_category, ai_summary, ai_priority, dossier_id, created_at, size_bytes
         FROM cabinet_documents
         WHERE cabinet_id = ?
           AND (title LIKE ? OR ai_summary LIKE ? OR doc_type LIKE ?)
         ORDER BY
           CASE ai_priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 ELSE 3 END,
           created_at DESC
         LIMIT ?`,
        [cabinetId, `%${query}%`, `%${query}%`, `%${query}%`, limit]
      );

      // Augment with AI relevance scoring if Qdrant available
      let semanticResults: any[] = [];
      try {
        const { standardSearch } = await import('../rag-search');
        const hits = await standardSearch(query, 5);
        semanticResults = hits.map(h => ({ title: h.title, url: h.url, score: h.score, source: 'rag' }));
      } catch { /* Qdrant optional */ }

      res.json({ success: true, results, semanticResults, total: results.length });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/ged/library — list documents with filters
  router.get('/library', authMiddleware, checkRole(GED_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const cabinetId = getCabinetId(req);
      const { dossier_id, doc_type, uploaded_by, page = '1', limit = '30' } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const conditions: string[] = ['cabinet_id = ?'];
      const params: any[] = [cabinetId];

      if (dossier_id) { conditions.push('dossier_id = ?'); params.push(dossier_id); }
      if (doc_type) { conditions.push('doc_type = ?'); params.push(doc_type); }
      if (uploaded_by) { conditions.push('uploaded_by = ?'); params.push(uploaded_by); }

      params.push(parseInt(limit as string), offset);
      const docs = await all<any>(
        `SELECT cd.*, u.name as uploader_name FROM cabinet_documents cd
         LEFT JOIN users u ON u.id = cd.uploaded_by
         WHERE ${conditions.join(' AND ')}
         ORDER BY cd.created_at DESC LIMIT ? OFFSET ?`,
        params
      );

      res.json({ success: true, documents: docs, page: parseInt(page as string) });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/ged/similar/:id — similar documents
  router.get('/similar/:id', authMiddleware, checkRole(GED_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const cabinetId = getCabinetId(req);
      const doc = await get<any>('SELECT * FROM cabinet_documents WHERE id = ? AND cabinet_id = ?', [req.params.id, cabinetId]);
      if (!doc) { res.status(404).json({ success: false, message: 'Document not found' }); return; }

      const similar = await all<any>(
        `SELECT id, title, doc_type, ai_category, ai_summary FROM cabinet_documents
         WHERE cabinet_id = ? AND id != ? AND (ai_category = ? OR doc_type = ?)
         ORDER BY created_at DESC LIMIT 5`,
        [cabinetId, req.params.id, doc.ai_category, doc.doc_type]
      );
      res.json({ success: true, similar });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // ─── US-12.3: Validation Queue + Reporting ───────────────────────────────────

  // GET /api/ged/validation-queue
  router.get('/validation-queue', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const cabinetId = getCabinetId(req);
      const queue = await all<any>(
        `SELECT dv.*, cd.title, cd.ai_category, cd.ai_priority, cd.ai_summary, cd.mime_type,
                u.name as uploader_name
         FROM document_validations dv
         JOIN cabinet_documents cd ON cd.id = dv.document_id
         LEFT JOIN users u ON u.id = cd.uploaded_by
         WHERE dv.cabinet_id = ? AND dv.status = 'pending'
         ORDER BY
           CASE cd.ai_priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 ELSE 3 END,
           dv.created_at ASC`,
        [cabinetId]
      );
      res.json({ success: true, queue, count: queue.length });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/ged/validate/:id — validate, annotate or request modification
  router.post('/validate/:id', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const cabinetId = getCabinetId(req);
      const { action, notes, client_message } = req.body; // action: 'validate' | 'reject' | 'modify'
      if (!['validate', 'reject', 'modify'].includes(action)) {
        res.status(400).json({ success: false, message: 'action must be validate, reject, or modify' });
        return;
      }

      const statusMap: Record<string, string> = { validate: 'validated', reject: 'rejected', modify: 'modification_requested' };
      await run(
        `UPDATE document_validations SET status = ?, validator_id = ?, notes = ?, client_message = ?, updated_at = ?
         WHERE id = ? AND cabinet_id = ?`,
        [statusMap[action], userId, notes ?? null, client_message ?? null, new Date().toISOString(), req.params.id, cabinetId]
      );
      await logAudit(userId, `document_${action}d`, 'document_validation', req.params.id, req.ip, req.headers['user-agent']);

      res.json({ success: true, status: statusMap[action] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/ged/report — cabinet KPI dashboard
  router.get('/report', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const cabinetId = getCabinetId(req);
      const { period = '30' } = req.query;
      const since = new Date(Date.now() - parseInt(period as string) * 24 * 3600 * 1000).toISOString();

      const [totalDocs, byCategory, byPriority, validationStats, recentActivity] = await Promise.all([
        get<{ count: number }>('SELECT COUNT(*) as count FROM cabinet_documents WHERE cabinet_id = ?', [cabinetId]),
        all<any>('SELECT ai_category, COUNT(*) as count FROM cabinet_documents WHERE cabinet_id = ? GROUP BY ai_category', [cabinetId]),
        all<any>('SELECT ai_priority, COUNT(*) as count FROM cabinet_documents WHERE cabinet_id = ? GROUP BY ai_priority', [cabinetId]),
        get<any>(`SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status='validated' THEN 1 ELSE 0 END) as validated,
            SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
          FROM document_validations WHERE cabinet_id = ?`, [cabinetId]),
        all<any>(`SELECT cd.title, cd.ai_category, cd.created_at, u.name as uploader
          FROM cabinet_documents cd LEFT JOIN users u ON u.id = cd.uploaded_by
          WHERE cd.cabinet_id = ? AND cd.created_at > ? ORDER BY cd.created_at DESC LIMIT 10`,
          [cabinetId, since]),
      ]);

      res.json({
        success: true,
        report: {
          period_days: parseInt(period as string),
          total_documents: totalDocs?.count ?? 0,
          by_category: byCategory,
          by_priority: byPriority,
          validation: validationStats,
          recent_activity: recentActivity,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/ged/report/export — export monthly report as PDF
  router.post('/report/export', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const cabinetId = getCabinetId(req);

      const PDFDocument = (await import('pdfkit')).default;
      const totalDocs = await get<{ count: number }>('SELECT COUNT(*) as count FROM cabinet_documents WHERE cabinet_id = ?', [cabinetId]);
      const byCategory = await all<any>('SELECT ai_category, COUNT(*) as count FROM cabinet_documents WHERE cabinet_id = ? GROUP BY ai_category', [cabinetId]);
      const validationStats = await get<any>(`SELECT COUNT(*) as total, SUM(CASE WHEN status='validated' THEN 1 ELSE 0 END) as validated FROM document_validations WHERE cabinet_id = ?`, [cabinetId]);

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 60, size: 'A4' });
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.font('Helvetica-Bold').fontSize(16).text('Rapport GED Cabinet — EasyLaw', { align: 'center' });
        doc.font('Helvetica').fontSize(10).text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
        doc.moveDown(2);
        doc.font('Helvetica-Bold').fontSize(12).text('Statistiques générales');
        doc.font('Helvetica').fontSize(11).text(`Total documents: ${totalDocs?.count ?? 0}`);
        doc.text(`Validés: ${validationStats?.validated ?? 0} / ${validationStats?.total ?? 0}`);
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Par catégorie:');
        byCategory.forEach((c: any) => doc.font('Helvetica').text(`  ${c.ai_category}: ${c.count}`));
        doc.end();
      });

      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="rapport-ged.pdf"' });
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message ?? 'Export failed' });
    }
  });

  return router;
}
