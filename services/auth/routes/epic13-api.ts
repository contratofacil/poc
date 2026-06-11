import { Router, Request, Response, NextFunction } from 'express';
import { run, get, all } from '../db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface RateLimitEntry { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>();

function partnerRateLimit(req: Request, res: Response, next: NextFunction): void {
  const clientId = (req as any).partner?.client_id;
  if (!clientId) { next(); return; }
  const limitPerHour = (req as any).partner?.rate_limit_per_hour ?? 1000;
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + 3600000 });
  } else {
    if (entry.count >= limitPerHour) {
      res.status(429).json({ success: false, message: 'Rate limit exceeded', retry_after: Math.ceil((entry.resetAt - now) / 1000) });
      return;
    }
    entry.count++;
  }
  next();
}

async function partnerAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Partner Bearer token required' });
    return;
  }
  const token = authHeader.slice(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = await get<any>('SELECT * FROM partner_tokens WHERE token_hash = ?', [tokenHash]);
  if (!row) { res.status(401).json({ success: false, message: 'Invalid or expired token' }); return; }
  if (new Date(row.expires_at) < new Date()) {
    await run('DELETE FROM partner_tokens WHERE token_hash = ?', [tokenHash]);
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }
  const partner = await get<any>('SELECT * FROM partner_api_keys WHERE client_id = ? AND is_active = 1', [row.client_id]);
  if (!partner) { res.status(401).json({ success: false, message: 'Partner account inactive' }); return; }
  (req as any).partner = partner;
  next();
}

// Trigger webhook delivery (fire-and-forget)
export async function triggerWebhooks(eventType: string, payload: any): Promise<void> {
  try {
    const webhooks = await all<any>('SELECT * FROM partner_webhooks WHERE event_type = ? AND is_active = 1', [eventType]);
    for (const wh of webhooks) {
      const body = JSON.stringify({ event: eventType, ...payload, timestamp: new Date().toISOString() });
      const sig = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');
      fetch(wh.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-EasyLaw-Signature': `sha256=${sig}` },
        body,
      }).catch(err => console.error(`[WEBHOOK] Failed to deliver to ${wh.url}:`, err?.message));
    }
  } catch (err) {
    console.error('[WEBHOOK] Error triggering webhooks:', (err as any)?.message);
  }
}

export function createEpic13Router(authMiddleware: any, checkRole: any) {
  const router = Router();
  const JWT_SECRET = process.env.JWT_SECRET ?? 'easylaw-secret';
  const ADMIN_ROLES = ['admin_cabinet', 'super_admin', 'admin'];

  // ─── OAuth2: Token endpoint ───────────────────────────────────────────────────

  // POST /api/oauth/token — client_credentials grant
  router.post('/token', async (req: Request, res: Response): Promise<void> => {
    try {
      const { grant_type, client_id, client_secret } = req.body;
      if (grant_type !== 'client_credentials') {
        res.status(400).json({ error: 'unsupported_grant_type', error_description: 'Only client_credentials is supported' });
        return;
      }
      if (!client_id || !client_secret) {
        res.status(400).json({ error: 'invalid_request', error_description: 'client_id and client_secret are required' });
        return;
      }

      const partner = await get<any>('SELECT * FROM partner_api_keys WHERE client_id = ? AND is_active = 1', [client_id]);
      if (!partner) { res.status(401).json({ error: 'invalid_client', error_description: 'Unknown client_id' }); return; }

      const valid = await bcrypt.compare(client_secret, partner.client_secret_hash);
      if (!valid) { res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client_secret' }); return; }

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
      const isSandbox = partner.is_sandbox === 1;

      await run('DELETE FROM partner_tokens WHERE client_id = ?', [client_id]);
      await run(
        'INSERT INTO partner_tokens (token_hash, client_id, expires_at, scopes, created_at) VALUES (?, ?, ?, ?, ?)',
        [tokenHash, client_id, expiresAt, partner.scopes, new Date().toISOString()]
      );

      res.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: partner.scopes,
        sandbox: isSandbox,
      });
    } catch (err) {
      res.status(500).json({ error: 'server_error', error_description: 'Internal error' });
    }
  });

  // ─── Admin: Manage partner keys ───────────────────────────────────────────────

  // POST /api/admin/partners — create a partner (admin only, mounted separately in server.ts)
  router.post('/admin/partners', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const { partner_name, rate_limit_per_hour = 1000, scopes, is_sandbox = false } = req.body;
      if (!partner_name) { res.status(400).json({ success: false, message: 'partner_name required' }); return; }

      const clientId = `el_${crypto.randomBytes(12).toString('hex')}`;
      const clientSecret = crypto.randomBytes(24).toString('hex');
      const secretHash = await bcrypt.hash(clientSecret, 10);
      const id = crypto.randomUUID();

      await run(
        `INSERT INTO partner_api_keys (id, client_id, client_secret_hash, partner_name, rate_limit_per_hour, scopes, is_sandbox, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [id, clientId, secretHash, partner_name, rate_limit_per_hour,
         scopes ?? 'contracts:read nif:read compliance:read', is_sandbox ? 1 : 0, new Date().toISOString()]
      );

      res.status(201).json({ success: true, client_id: clientId, client_secret: clientSecret, warning: 'Store the client_secret securely — it will not be shown again.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // POST /api/admin/partners/:clientId/webhooks — register a webhook
  router.post('/admin/partners/:clientId/webhooks', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
    try {
      const { event_type, url } = req.body;
      if (!event_type || !url) { res.status(400).json({ success: false, message: 'event_type and url required' }); return; }
      const whId = crypto.randomUUID();
      const secret = crypto.randomBytes(20).toString('hex');
      await run(
        'INSERT INTO partner_webhooks (id, client_id, event_type, url, secret, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [whId, req.params.clientId, event_type, url, secret, new Date().toISOString()]
      );
      res.status(201).json({ success: true, webhook_id: whId, secret, note: 'Use the secret to verify webhook signatures (HMAC-SHA256)' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // ─── REST v1 Endpoints ────────────────────────────────────────────────────────

  const v1 = Router();

  // GET /api/v1/contracts
  v1.get('/contracts', partnerAuth, partnerRateLimit, async (req: Request, res: Response): Promise<void> => {
    try {
      const isSandbox = (req as any).partner?.is_sandbox;
      if (isSandbox) {
        res.json({ success: true, contracts: [{ id: 'sandbox-001', type: 'bail_habitation', status: 'generated', created_at: new Date().toISOString() }], sandbox: true });
        return;
      }
      const contracts = await all<any>(
        'SELECT id, type, status, template_id, created_at FROM contracts ORDER BY created_at DESC LIMIT 100'
      );
      res.json({ success: true, contracts });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/v1/contracts — generate contract via API
  v1.post('/contracts', partnerAuth, partnerRateLimit, async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, template_id, data } = req.body;
      if (!type || !template_id || !data) {
        res.status(400).json({ success: false, message: 'type, template_id, and data are required' });
        return;
      }
      const contractId = crypto.randomUUID();
      const now = new Date().toISOString();
      await run(
        `INSERT INTO contracts (id, user_id, type, status, template_id, data_json, created_at) VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
        [contractId, `partner:${(req as any).partner?.client_id}`, type, template_id, JSON.stringify(data), now]
      );
      await triggerWebhooks('contract.created', { contract_id: contractId, type, status: 'pending' });
      res.status(201).json({ success: true, contract_id: contractId, status: 'pending', message: 'Contract generation queued' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/v1/nif-files
  v1.get('/nif-files', partnerAuth, partnerRateLimit, async (req: Request, res: Response): Promise<void> => {
    try {
      const isSandbox = (req as any).partner?.is_sandbox;
      if (isSandbox) {
        res.json({ success: true, nif_files: [{ id: 'sandbox-nif-001', status: 'processing', created_at: new Date().toISOString() }], sandbox: true });
        return;
      }
      const files = await all<any>('SELECT id, user_id, status, fullname, nationality, created_at FROM dossiers_nif ORDER BY created_at DESC LIMIT 100');
      res.json({ success: true, nif_files: files });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/v1/compliance-items
  v1.get('/compliance-items', partnerAuth, partnerRateLimit, async (req: Request, res: Response): Promise<void> => {
    try {
      const isSandbox = (req as any).partner?.is_sandbox;
      if (isSandbox) {
        res.json({ success: true, items: [{ id: 'sandbox-ci-001', title: 'Test compliance item', status: 'pending', due_date: '2026-12-31' }], sandbox: true });
        return;
      }
      const items = await all<any>('SELECT id, title, status, category, due_date, created_at FROM compliance_items ORDER BY due_date ASC LIMIT 100');
      res.json({ success: true, items });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/v1/documents
  v1.get('/documents', partnerAuth, partnerRateLimit, async (req: Request, res: Response): Promise<void> => {
    try {
      const isSandbox = (req as any).partner?.is_sandbox;
      if (isSandbox) {
        res.json({ success: true, documents: [{ id: 'sandbox-doc-001', entity_type: 'contract', mime_type: 'application/pdf', created_at: new Date().toISOString() }], sandbox: true });
        return;
      }
      const docs = await all<any>('SELECT id, entity_type, entity_id, mime_type, size_bytes, status, created_at FROM vault_documents ORDER BY created_at DESC LIMIT 100');
      res.json({ success: true, documents: docs });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return { oauthRouter: router, v1Router: v1 };
}

// OpenAPI spec builder
export function buildOpenAPISpec(baseUrl: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'EasyLaw API',
      version: '1.0.0',
      description: 'API REST publique EasyLaw — intégrations partenaires, ERP, CRM. Authentification OAuth2 client_credentials.',
      contact: { email: 'api@easylaw.pt' },
      license: { name: 'Proprietary' },
    },
    servers: [
      { url: `${baseUrl}/api/v1`, description: 'Production' },
      { url: `${baseUrl}/api/v1`, description: 'Sandbox (is_sandbox=true partner)' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token OAuth2 obtenu via POST /api/oauth/token' },
      },
    },
    paths: {
      '/contracts': {
        get: { summary: 'Lister les contrats', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Liste des contrats' } } },
        post: { summary: 'Générer un contrat', security: [{ BearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { type: { type: 'string' }, template_id: { type: 'string' }, data: { type: 'object' } }, required: ['type', 'template_id', 'data'] } } } }, responses: { '201': { description: 'Contrat créé' } } },
      },
      '/nif-files': {
        get: { summary: 'Lister les dossiers NIF', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Liste des dossiers NIF' } } },
      },
      '/compliance-items': {
        get: { summary: 'Lister les obligations compliance', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Liste des obligations' } } },
      },
      '/documents': {
        get: { summary: 'Lister les documents vault', security: [{ BearerAuth: [] }], responses: { '200': { description: 'Liste des documents' } } },
      },
    },
  };
}
