import { Router, Request, Response, NextFunction } from 'express';
import { run, get, all } from '../db';
import crypto from 'crypto';

/**
 * Formulaire de contact public (`/contact` côté frontend).
 *
 *  - POST /api/contact         : public — persiste le message (table contact_messages)
 *  - GET  /api/contact         : admin — liste les messages reçus
 *  - PATCH /api/contact/:id    : admin — marque un message traité
 *
 * L'envoi de la notification email au support est mocké (console) tant que
 * SendGrid n'est pas câblé en réel — voir email.ts.
 */

const MAX_NAME = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type CheckRole = (roles: string[]) => Middleware;

export function createContactRouter(
  authMiddleware: Middleware,
  checkRole: CheckRole,
  adminRoles: string[]
) {
  const router = Router();

  // POST /api/contact — public, pas d'auth requise
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, subject, message } = req.body ?? {};

      const errors: string[] = [];
      if (!name || typeof name !== 'string' || !name.trim() || name.length > MAX_NAME) {
        errors.push('name is required (max 200 chars)');
      }
      if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
        errors.push('a valid email is required');
      }
      if (!subject || typeof subject !== 'string' || !subject.trim() || subject.length > MAX_SUBJECT) {
        errors.push('subject is required (max 200 chars)');
      }
      if (!message || typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE) {
        errors.push('message is required (max 5000 chars)');
      }
      if (errors.length > 0) {
        res.status(400).json({ success: false, errors });
        return;
      }

      const id = crypto.randomUUID();
      await run(
        `INSERT INTO contact_messages (id, name, email, subject, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim(), new Date().toISOString()]
      );

      console.log(`[MOCK SENDGRID] Contact form notification → support@easylaw.pt (message ${id}, sujet: ${subject.trim()})`);

      res.status(201).json({ success: true, id });
    } catch (error) {
      console.error('Error saving contact message:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/contact — liste admin (messages les plus récents d'abord)
  router.get('/', authMiddleware, checkRole(adminRoles), async (_req: Request, res: Response): Promise<void> => {
    try {
      const messages = await all(
        `SELECT id, name, email, subject, message, status, created_at, handled_at
         FROM contact_messages ORDER BY created_at DESC LIMIT 200`
      );
      res.json({ success: true, messages });
    } catch (error) {
      console.error('Error listing contact messages:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // PATCH /api/contact/:id — marque traité
  router.patch('/:id', authMiddleware, checkRole(adminRoles), async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await get<{ id: string }>(
        'SELECT id FROM contact_messages WHERE id = ?',
        [req.params.id]
      );
      if (!existing) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }
      await run(
        `UPDATE contact_messages SET status = 'handled', handled_at = ? WHERE id = ?`,
        [new Date().toISOString(), req.params.id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating contact message:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return router;
}
