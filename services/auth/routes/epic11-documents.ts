import { Router, Request, Response } from 'express';
import { run, get, all } from '../db';
import crypto from 'crypto';
import { Server as SocketIOServer } from 'socket.io';

export function createEpic11Router(
  authMiddleware: any,
  checkRole: any,
  putDocument: any,
  logAudit: any,
  io: SocketIOServer,
) {
  const router = Router();
  const DOC_ROLES = ['avocat', 'avocat_associe', 'avocat_junior', 'cabinet_avocat', 'admin_cabinet', 'super_admin', 'admin'];

  // ─── US-11.1: NL Document Generation ────────────────────────────────────────

  // POST /api/documents/generate — generate document from natural language
  router.post('/generate', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { instruction, doc_type, dossier_id, title } = req.body;
      if (!instruction?.trim()) {
        res.status(400).json({ success: false, message: 'instruction is required' });
        return;
      }

      const { callPrompt } = await import('../rag-llm-router');
      const { standardSearch } = await import('../rag-search');

      // RAG context for legal grounding
      let ragContext = '';
      try {
        const results = await standardSearch(instruction, 3);
        ragContext = results.map(r => `${r.title}: ${r.chunk_text.slice(0, 500)}`).join('\n\n');
      } catch { /* Qdrant may not be configured */ }

      const systemPrompt = `Vous êtes un rédacteur juridique expert en droit portugais. Rédigez un document juridique complet, professionnel et conforme à la législation portugaise en vigueur.
Type de document demandé: ${doc_type ?? 'document juridique'}
${ragContext ? `\nSources juridiques de référence:\n${ragContext}` : ''}

Répondez avec le texte complet du document, sans explications supplémentaires. Structurez le document avec des titres clairs (ARTICLE I, ARTICLE II...).`;

      const content = await callPrompt('research_deepdive_system', {
        query: instruction,
        context: ragContext || 'Utilisez vos connaissances du droit portugais',
        sub_queries: `Rédiger: ${doc_type ?? 'document juridique'}`,
      });

      // Generate PDF
      const PDFDocument = (await import('pdfkit')).default;
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 60, size: 'A4' });
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.font('Helvetica-Bold').fontSize(14).text(title ?? doc_type ?? 'Document juridique', { align: 'center' });
        doc.moveDown();
        doc.font('Helvetica').fontSize(11).text(content, { align: 'justify', lineGap: 4 });
        doc.end();
      });

      const docId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Store PDF in vault
      let pdfR2Key: string | null = null;
      try {
        const stored = await putDocument(pdfBuffer, 'application/pdf', `documents/${userId}/${docId}.pdf`);
        pdfR2Key = stored?.r2Key ?? null;
      } catch { /* dev mode */ }

      // Generate DOCX
      let docxR2Key: string | null = null;
      try {
        const { Document, Paragraph, TextRun, HeadingLevel, Packer } = await import('docx');
        const lines = content.split('\n');
        const docxChildren = lines.map(line => {
          if (line.match(/^ARTICLE\s+[IVX]+/i) || line.match(/^#{1,3}\s/)) {
            return new Paragraph({ text: line.replace(/^#+\s*/, ''), heading: HeadingLevel.HEADING_2 });
          }
          return new Paragraph({ children: [new TextRun({ text: line, size: 22 })] });
        });
        const wordDoc = new Document({ sections: [{ children: docxChildren }] });
        const docxBuffer = await Packer.toBuffer(wordDoc);
        const storedDocx = await putDocument(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `documents/${userId}/${docId}.docx`);
        docxR2Key = storedDocx?.r2Key ?? null;
      } catch { /* docx optional */ }

      await run(
        `INSERT INTO generated_documents (id, user_id, dossier_id, title, doc_type, instruction_nl, content_pdf_r2_key, content_docx_r2_key, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
        [docId, userId, dossier_id ?? null, title ?? doc_type ?? 'Document', doc_type ?? null, instruction, pdfR2Key, docxR2Key, now, now]
      );
      await logAudit(userId, 'document_generated', 'generated_document', docId, req.ip, req.headers['user-agent']);

      // Also insert first version
      await run(
        `INSERT INTO document_versions (id, document_id, version_number, created_by, change_summary, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), docId, 1, userId, 'Version initiale générée par IA', now]
      );

      res.json({ success: true, document: { id: docId, title: title ?? doc_type, content, pdfR2Key, docxR2Key } });
    } catch (err: any) {
      console.error('[DOC GENERATE]', err?.message);
      res.status(500).json({ success: false, message: err?.message ?? 'Generation failed' });
    }
  });

  // GET /api/documents — list user's generated documents
  router.get('/', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const docs = await all<any>(
        'SELECT id, title, doc_type, status, created_at FROM generated_documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      res.json({ success: true, documents: docs });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/documents/:id — get single document
  router.get('/:id', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const doc = await get<any>('SELECT * FROM generated_documents WHERE id = ? AND user_id = ?', [req.params.id, userId]);
      if (!doc) { res.status(404).json({ success: false, message: 'Document not found' }); return; }
      const versions = await all<any>('SELECT id, version_number, change_summary, created_by, created_at FROM document_versions WHERE document_id = ? ORDER BY version_number DESC', [req.params.id]);
      const comments = await all<any>('SELECT * FROM document_comments WHERE document_id = ? AND resolved = 0 ORDER BY created_at DESC', [req.params.id]);
      const suggestions = await all<any>('SELECT * FROM document_suggestions WHERE document_id = ? AND status = \'pending\' ORDER BY created_at DESC', [req.params.id]);
      res.json({ success: true, document: doc, versions, comments, suggestions });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // ─── US-11.3: Anonymisation + Traduction ─────────────────────────────────────

  // POST /api/documents/anonymize — anonymize document text
  router.post('/anonymize', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { content, document_id } = req.body;
      if (!content?.trim()) { res.status(400).json({ success: false, message: 'content required' }); return; }

      const { callPrompt } = await import('../rag-llm-router');
      const prompt = `Anonymisez le document juridique suivant en remplaçant:
- Noms de personnes physiques → [PARTIE_A], [PARTIE_B], etc. (séquentiellement)
- Adresses → [ADRESSE_1], [ADRESSE_2], etc.
- Numéros NIF/NIPC → [NIF_1], [NIF_2], etc.
- Numéros de compte → [COMPTE_1], etc.
- Dates précises → [DATE_1], [DATE_2], etc. (conservez seulement l'année si pertinent)
- Entreprises → [SOCIÉTÉ_A], [SOCIÉTÉ_B], etc.

Document à anonymiser:
${content}

Répondez UNIQUEMENT avec le texte anonymisé, sans explication.`;

      const anonymized = await callPrompt('assistant_system', { query: prompt, context: '' });

      // Build diff: find replacements
      const diff: Array<{ original: string; replaced: string }> = [];
      const patterns = [/\[PARTIE_[A-Z]\]/g, /\[ADRESSE_\d+\]/g, /\[NIF_\d+\]/g, /\[SOCIÉTÉ_[A-Z]\]/g];
      for (const pattern of patterns) {
        const matches = anonymized.match(pattern) ?? [];
        matches.forEach(m => diff.push({ original: '(identifié)', replaced: m }));
      }

      // Store anonymized version in vault if document_id given
      if (document_id) {
        const anonId = crypto.randomUUID();
        await run(
          `INSERT INTO generated_documents (id, user_id, title, doc_type, instruction_nl, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'anonymized', ?, ?)`,
          [anonId, userId, `[Anonymisé] Document ${document_id}`, 'anonymized', `Anonymisation de ${document_id}`, new Date().toISOString(), new Date().toISOString()]
        );
      }

      res.json({ success: true, anonymized, diff, count: diff.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message ?? 'Anonymization failed' });
    }
  });

  // POST /api/documents/translate — translate legal document
  router.post('/translate', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, source_lang, target_lang, document_id } = req.body;
      if (!content?.trim() || !target_lang) {
        res.status(400).json({ success: false, message: 'content and target_lang required' });
        return;
      }

      const supportedLangs: Record<string, string> = { PT: 'portugais', FR: 'français', EN: 'anglais', ES: 'espagnol' };
      const targetLabel = supportedLangs[target_lang.toUpperCase()] ?? target_lang;
      const sourceLabel = supportedLangs[(source_lang ?? 'PT').toUpperCase()] ?? source_lang ?? 'portugais';

      const { callPrompt } = await import('../rag-llm-router');
      const prompt = `Traduisez le document juridique suivant du ${sourceLabel} vers le ${targetLabel}.
IMPORTANT: Préservez la terminologie juridique exacte, la structure du document, la numérotation des articles et les références légales. Ne paraphrasez pas — traduisez fidèlement.

Document:
${content}

Répondez UNIQUEMENT avec la traduction complète.`;

      const translated = await callPrompt('research_deepdive_system', {
        query: prompt,
        context: `Traduction juridique ${sourceLabel} → ${targetLabel}`,
        sub_queries: 'terminologie juridique, fidélité au texte original',
      });

      res.json({ success: true, translated, source_lang: source_lang ?? 'PT', target_lang });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message ?? 'Translation failed' });
    }
  });

  // ─── US-11.4: Collaborative Editing ──────────────────────────────────────────

  // POST /api/documents/:id/suggestions — create a suggestion
  router.post('/:id/suggestions', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { original_text, suggested_text } = req.body;
      if (!suggested_text) { res.status(400).json({ success: false, message: 'suggested_text required' }); return; }

      const suggId = crypto.randomUUID();
      await run(
        `INSERT INTO document_suggestions (id, document_id, original_text, suggested_text, author_id, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        [suggId, req.params.id, original_text ?? null, suggested_text, userId, new Date().toISOString()]
      );

      const userRow = await get<{ name: string | null }>('SELECT name FROM users WHERE id = ?', [userId]);
      io.to(`doc:${req.params.id}`).emit('suggestion:new', {
        id: suggId, document_id: req.params.id, original_text, suggested_text,
        author_id: userId, author_name: userRow?.name, status: 'pending',
      });

      res.json({ success: true, suggestion_id: suggId });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // PATCH /api/documents/:id/suggestions/:sid — accept or reject
  router.patch('/:id/suggestions/:sid', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { action } = req.body; // 'accept' | 'reject'
      if (!['accept', 'reject'].includes(action)) { res.status(400).json({ success: false, message: 'action must be accept or reject' }); return; }

      const status = action === 'accept' ? 'accepted' : 'rejected';
      await run(`UPDATE document_suggestions SET status = ? WHERE id = ? AND document_id = ?`, [status, req.params.sid, req.params.id]);

      io.to(`doc:${req.params.id}`).emit('suggestion:updated', { id: req.params.sid, status, updated_by: userId });
      res.json({ success: true, status });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/documents/:id/comments — add a comment
  router.post('/:id/comments', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { content, anchor_text, mentions, parent_id } = req.body;
      if (!content?.trim()) { res.status(400).json({ success: false, message: 'content required' }); return; }

      const commentId = crypto.randomUUID();
      const now = new Date().toISOString();
      await run(
        `INSERT INTO document_comments (id, document_id, content, author_id, anchor_text, mentions, parent_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [commentId, req.params.id, content, userId, anchor_text ?? null,
         JSON.stringify(mentions ?? []), parent_id ?? null, now, now]
      );

      const userRow = await get<{ name: string | null }>('SELECT name FROM users WHERE id = ?', [userId]);

      // Notify mentioned users
      if (mentions?.length) {
        for (const mentionedId of mentions) {
          io.to(`user:${mentionedId}`).emit('notification:mention', {
            document_id: req.params.id, comment_id: commentId,
            from: userRow?.name ?? userId, content: content.slice(0, 100),
          });
        }
      }

      io.to(`doc:${req.params.id}`).emit('comment:new', {
        id: commentId, document_id: req.params.id, content, author_id: userId,
        author_name: userRow?.name, anchor_text, parent_id, created_at: now,
      });

      res.json({ success: true, comment_id: commentId });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // PATCH /api/documents/:id/comments/:cid/resolve
  router.patch('/:id/comments/:cid/resolve', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      await run(`UPDATE document_comments SET resolved = 1, updated_at = ? WHERE id = ? AND document_id = ?`,
        [new Date().toISOString(), req.params.cid, req.params.id]);
      io.to(`doc:${req.params.id}`).emit('comment:resolved', { id: req.params.cid });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/documents/:id/versions — save a new version
  router.post('/:id/versions', authMiddleware, checkRole(DOC_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { change_summary, content } = req.body;

      const lastVersion = await get<{ version_number: number }>(
        'SELECT MAX(version_number) as version_number FROM document_versions WHERE document_id = ?', [req.params.id]
      );
      const nextVersion = (lastVersion?.version_number ?? 0) + 1;

      let r2Key: string | null = null;
      if (content) {
        try {
          const stored = await putDocument(Buffer.from(content, 'utf-8'), 'text/plain', `documents/${req.params.id}/v${nextVersion}.txt`);
          r2Key = stored?.r2Key ?? null;
        } catch { /* dev mode */ }
      }

      const versionId = crypto.randomUUID();
      await run(
        `INSERT INTO document_versions (id, document_id, version_number, content_r2_key, created_by, change_summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [versionId, req.params.id, nextVersion, r2Key, userId, change_summary ?? `Version ${nextVersion}`, new Date().toISOString()]
      );

      io.to(`doc:${req.params.id}`).emit('version:saved', { id: versionId, version_number: nextVersion, change_summary, created_by: userId });
      res.json({ success: true, version: { id: versionId, version_number: nextVersion } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return router;
}

// Socket.io setup for document collaboration
export function setupCollaborationSocket(io: SocketIOServer, verifyToken: (token: string) => any) {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    let userId: string | null = null;
    try {
      const decoded = verifyToken(token);
      userId = decoded?.id ?? decoded?.userId ?? null;
    } catch {
      socket.disconnect(true);
      return;
    }

    if (!userId) { socket.disconnect(true); return; }

    // User personal room for notifications
    socket.join(`user:${userId}`);

    socket.on('document:join', (documentId: string) => {
      socket.join(`doc:${documentId}`);
      socket.to(`doc:${documentId}`).emit('user:joined', { userId, socketId: socket.id });
    });

    socket.on('document:leave', (documentId: string) => {
      socket.leave(`doc:${documentId}`);
      socket.to(`doc:${documentId}`).emit('user:left', { userId, socketId: socket.id });
    });

    socket.on('document:cursor', (data: { documentId: string; position: number }) => {
      socket.to(`doc:${data.documentId}`).emit('cursor:update', { userId, position: data.position });
    });

    socket.on('disconnect', () => {
      console.log(`[COLLAB] User ${userId} disconnected`);
    });
  });
}
