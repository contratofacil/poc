import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { initDb, run, get, all, closeDb } from './db';
import { sendVerificationEmail } from './email';
import { assertVaultConfig } from './storage/r2-client';
import {
  prepareUpload,
  completeUpload,
  putDocument,
  getDocumentBuffer,
  getDocumentByR2Key,
  VaultDocumentRow,
} from './storage/vault';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Performance/Response Time Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} completed in ${duration.toFixed(2)}ms`);
    // Ensure response header can be written if needed, though on finish it's already sent
  });
  next();
});

// Zod Schema for Registration
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Password must contain at least one digit",
    }),
  name: z.string().optional(),
  cguAccepted: z.literal(true, {
    message: "You must accept the Terms of Use (CGU)",
  }),
  privacyPolicyAccepted: z.literal(true, {
    message: "You must accept the Privacy Policy",
  }),
  lang: z.string().optional().default('PT')
});

// Register Endpoint
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  const startTime = performance.now();
  
  try {
    // 1. Validation
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    const { email, password, name, lang } = parsed.data;

    // 2. Check if user already exists
    const existingUser = await get<{ id: string }>('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
      return;
    }

    // 3. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Generate metadata
    const userId = crypto.randomUUID();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const role = 'client';
    const createdAt = new Date().toISOString();

    // 5. Save to database
    await run(
      `INSERT INTO users (id, email, name, password_hash, role, lang, is_verified, verification_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, name || null, passwordHash, role, lang, 0, verificationToken, createdAt]
    );

    // 6. Mock SendGrid Email Dispatch
    // Run this asynchronously or await it - our mock is very fast anyway
    await sendVerificationEmail(email, verificationToken);

    // 7. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) { throw new Error('JWT_SECRET environment variable is required'); }
    const token = jwt.sign(
      { id: userId, email, role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    res.setHeader('X-Response-Time-Ms', totalTimeMs.toFixed(2));

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: userId,
        email,
        name: name || null,
        role,
        lang,
        is_verified: 0,
        created_at: createdAt
      },
      token
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.'
    });
  }
});

// Zod Schema for Login
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" })
});

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  role: string;
  lang: string;
  is_verified: number;
  created_at: string;
  deleted_at?: string | null;
}

// Authentication Middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) { throw new Error('JWT_SECRET environment variable is required'); }
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string; role: string };
    
    // Verify user exists and is not deleted
    const user = await get<UserRow>(
      'SELECT id, email, role, deleted_at FROM users WHERE id = ?', 
      [decoded.id]
    );
    if (!user || user.deleted_at) {
      res.status(401).json({ success: false, message: 'User not found or account deleted' });
      return;
    }
    
    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// RBAC Middleware
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }
    next();
  };
};

// Login Endpoint
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const startTime = performance.now();

  try {
    // 1. Validation
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    const { email, password } = parsed.data;

    // 2. Check if user exists and is not deleted
    const user = await get<UserRow>('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // 3. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // 4. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) { throw new Error('JWT_SECRET environment variable is required'); }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    res.setHeader('X-Response-Time-Ms', totalTimeMs.toFixed(2));

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lang: user.lang,
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.'
    });
  }
});

// Profile endpoints
const updateProfileSchema = z.object({
  name: z.string().optional(),
  lang: z.enum(['PT', 'FR']).optional()
});

app.get('/api/auth/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await get<UserRow>(
      'SELECT id, email, name, role, lang, is_verified, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

app.put('/api/auth/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    const userId = (req as any).user.id;
    const { name, lang } = parsed.data;

    const user = await get<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const newName = name !== undefined ? name : user.name;
    const newLang = lang !== undefined ? lang : user.lang;

    await run('UPDATE users SET name = ?, lang = ? WHERE id = ?', [newName, newLang, userId]);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: userId,
        email: user.email,
        name: newName,
        role: user.role,
        lang: newLang,
        is_verified: user.is_verified,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

app.delete('/api/auth/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const deletedAt = new Date().toISOString();
    await run('UPDATE users SET deleted_at = ? WHERE id = ?', [deletedAt, userId]);
    res.status(200).json({
      success: true,
      message: 'Account marked for deletion.'
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

app.post('/api/auth/profile/export', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await get<UserRow>('SELECT id, email, name, role, lang, created_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    // Mock querying dossiers and payments
    const dossiers = await get<any[]>('SELECT * FROM dossiers_nif WHERE user_id = ?', [userId]).catch(() => []);
    const payments = await get<any[]>('SELECT * FROM payments WHERE user_id = ?', [userId]).catch(() => []);

    res.status(200).json({
      success: true,
      exportData: {
        user,
        dossiers: dossiers || [],
        payments: payments || [],
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error exporting profile:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// Zod Schema for Invite
const inviteSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(['admin_cabinet', 'avocat', 'avocat_junior', 'client'])
});

// Invite collaborator endpoint
app.post('/api/auth/invite', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    const { email, role } = parsed.data;
    
    const existingUser = await get<{ id: string }>('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
      return;
    }

    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await run(
      `INSERT INTO users (id, email, name, password_hash, role, lang, is_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, `Invited ${role}`, 'INVITED_MOCK_HASH', role, 'PT', 0, createdAt]
    );

    res.status(201).json({
      success: true,
      message: `Invitation successfully sent to ${email} with role ${role}.`,
      invitation: {
        id: userId,
        email,
        role,
        status: 'invited',
        created_at: createdAt
      }
    });
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});


// Zod Schema for NIF Application
const nifApplySchema = z.object({
  user_id: z.string().optional().nullable(),
  fullname: z.string().min(1, { message: "Full name is required" }),
  birthdate: z.string().min(1, { message: "Birth date is required" }),
  nationality: z.string().min(1, { message: "Nationality is required" }),
  current_residence: z.string().min(1, { message: "Current residence is required" }),
  passport_path: z.string().min(1, { message: "Passport path is required" }),
  proof_of_address_path: z.string().min(1, { message: "Proof of address path is required" }),
});

// NIF Application Endpoint
app.post('/api/nif/apply', async (req: Request, res: Response): Promise<void> => {
  const startTime = performance.now();
  try {
    const parsed = nifApplySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    const { user_id, fullname, birthdate, nationality, current_residence, passport_path, proof_of_address_path } = parsed.data;

    const dossierId = crypto.randomUUID();
    const status = 'pending';
    const createdAt = new Date().toISOString();

    await run(
      `INSERT INTO dossiers_nif (id, user_id, status, fullname, birthdate, nationality, current_residence, passport_path, proof_of_address_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dossierId, user_id || null, status, fullname, birthdate, nationality, current_residence, passport_path, proof_of_address_path, createdAt]
    );

    const endTime = performance.now();
    res.setHeader('X-Response-Time-Ms', (endTime - startTime).toFixed(2));

    res.status(201).json({
      success: true,
      message: 'NIF application submitted successfully.',
      dossierId,
      dossier: {
        id: dossierId,
        user_id: user_id || null,
        status,
        fullname,
        birthdate,
        nationality,
        current_residence,
        passport_path,
        proof_of_address_path,
        created_at: createdAt
      }
    });
  } catch (error) {
    console.error('Error in NIF application:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred.'
    });
  }
});

// Payment endpoint (POST /api/nif/payment)
app.post('/api/nif/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, method, amount, currency, product } = req.body;
    
    if (!user_id) {
      res.status(400).json({ success: false, message: 'user_id is required' });
      return;
    }
    if (!method || !['stripe', 'mbway'].includes(method)) {
      res.status(400).json({ success: false, message: 'Invalid or missing payment method' });
      return;
    }

    const paymentId = crypto.randomUUID();
    const payAmount = amount || 99.00;
    const payCurrency = currency || 'EUR';
    const payProduct = product || 'NIF Application';

    if (method === 'stripe') {
      const stripeId = `cs_test_${crypto.randomUUID()}`;
      await run(
        `INSERT INTO payments (id, user_id, stripe_id, amount, currency, status, product)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, user_id, stripeId, payAmount, payCurrency, 'pending', payProduct]
      );
      res.status(200).json({
        success: true,
        method: 'stripe',
        stripeSessionId: stripeId,
        checkoutUrl: `https://checkout.stripe.com/pay/${stripeId}`,
        paymentId
      });
    } else {
      // MB Way
      await run(
        `INSERT INTO payments (id, user_id, stripe_id, amount, currency, status, product)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, user_id, null, payAmount, payCurrency, 'pending', payProduct]
      );
      res.status(200).json({
        success: true,
        method: 'mbway',
        reference: '999999999',
        phoneNumber: req.body.phoneNumber || '912345678',
        paymentId
      });
    }
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Webhook simulation endpoint (POST /api/nif/payment/webhook)
app.post('/api/nif/payment/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stripe_id, payment_id, user_id } = req.body;
    
    let payment: any = null;
    if (stripe_id) {
      payment = await get('SELECT * FROM payments WHERE stripe_id = ?', [stripe_id]);
    } else if (payment_id) {
      payment = await get('SELECT * FROM payments WHERE id = ?', [payment_id]);
    } else if (user_id) {
      payment = await get('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [user_id]);
    }

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    // Update payment status to paid
    await run('UPDATE payments SET status = ? WHERE id = ?', ['paid', payment.id]);

    // Transition NIF dossier status to 'En traitement'
    await run('UPDATE dossiers_nif SET status = ? WHERE user_id = ?', ['En traitement', payment.user_id]);

    res.status(200).json({
      success: true,
      message: 'Payment received and status updated to En traitement'
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/nif/status
app.get('/api/nif/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.user_id as string;
    if (!userId) {
      res.status(400).json({ success: false, message: 'user_id is required' });
      return;
    }

    const dossier = await get<{ id: string; status: string; created_at: string }>(
      'SELECT id, status, created_at FROM dossiers_nif WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const payment = await get<{ status: string }>(
      'SELECT status FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (!dossier) {
      res.status(404).json({ success: false, message: 'No dossier found for this user' });
      return;
    }

    // Determine current status step
    const currentStatus = dossier.status; // e.g. 'pending', 'En traitement', 'NIF obtenu', 'Notifié'
    
    // Status mapping to timeline steps (Reçu -> En traitement -> NIF obtenu -> Notifié)
    const steps = ['Reçu', 'En traitement', 'NIF obtenu', 'Notifié'];
    
    let activeIndex = 0; // default 'Reçu'
    if (currentStatus === 'En traitement') {
      activeIndex = 1;
    } else if (currentStatus === 'NIF obtenu') {
      activeIndex = 2;
    } else if (currentStatus === 'Notifié') {
      activeIndex = 3;
    }

    const timeline = steps.map((stepName, index) => {
      let stepStatus = 'upcoming';
      if (index < activeIndex) {
        stepStatus = 'completed';
      } else if (index === activeIndex) {
        stepStatus = 'current';
      }
      
      return {
        step: stepName,
        status: stepStatus,
        date: index <= activeIndex ? dossier.created_at : null
      };
    });

    res.status(200).json({
      success: true,
      status: currentStatus,
      paymentStatus: payment ? payment.status : null,
      timeline
    });
  } catch (error) {
    console.error('Error fetching NIF status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Story 6-3 — Vault uploads via R2 + envelope encryption
// ---------------------------------------------------------------------------

const nifUploadSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  mime_type: z.string().min(1).max(255).optional().default('application/pdf'),
  entity_id: z.string().nullable().optional(),
});

// POST /api/nif/upload — create a vault_documents row and return a presigned PUT URL
app.post('/api/nif/upload', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = nifUploadSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }
    const { filename, mime_type, entity_id } = parsed.data;
    const userId = (req as any).user.id;

    const result = await prepareUpload({
      user_id: userId,
      entity_type: 'nif_piece',
      entity_id: entity_id ?? null,
      filename: filename || 'document.pdf',
      mime_type,
    });

    await logAudit(userId, 'PREPARE_VAULT_UPLOAD', 'vault_document', result.documentId, req);

    // Backwards-compat: `filepath` mirrors `r2_key` so legacy callers don't break entirely.
    res.status(200).json({
      success: true,
      filepath: result.r2_key,
      documentId: result.documentId,
      uploadUrl: result.uploadUrl,
      r2_key: result.r2_key,
      expiresIn: result.expiresIn,
    });
  } catch (error: any) {
    console.error('Error preparing vault upload:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to prepare document upload'
    });
  }
});

const nifUploadCompleteSchema = z.object({
  documentId: z.string().uuid({ message: 'documentId must be a UUID' }),
  sha256: z.string().regex(/^[0-9a-fA-F]{64}$/, { message: 'sha256 must be a 64-char hex string' }),
});

// POST /api/nif/upload/complete — verify presence, encrypt server-side, mark ready
app.post('/api/nif/upload/complete', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = nifUploadCompleteSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
      return;
    }
    const { documentId, sha256 } = parsed.data;
    const userId = (req as any).user.id;

    // RBAC: enforce ownership before doing R2 work.
    const row = await get<VaultDocumentRow>(
      'SELECT * FROM vault_documents WHERE id = ?',
      [documentId]
    );
    if (!row) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    if (row.user_id !== userId) {
      await logAudit(userId, 'FORBIDDEN_VAULT_ACCESS', 'vault_document', documentId, req);
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const updated = await completeUpload(documentId, sha256);
    await logAudit(userId, 'UPLOAD_DOCUMENT_COMPLETE', 'vault_document', documentId, req);

    res.status(200).json({
      success: true,
      documentId: updated.id,
      status: updated.status,
      size_bytes: updated.size_bytes,
      sha256: updated.sha256,
    });
  } catch (error: any) {
    const msg = error?.message || 'Internal error';
    // Hash mismatch is a 400 (client-controlled input)
    if (/SHA-256 mismatch/.test(msg)) {
      res.status(400).json({ success: false, message: msg });
      return;
    }
    console.error('Error completing vault upload:', msg);
    res.status(500).json({
      success: false,
      message: 'Failed to complete document upload'
    });
  }
});

// Audit logging helper
async function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  req: Request
): Promise<void> {
  const ipAddr = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
  const userAgent = (req.headers['user-agent'] || 'unknown') as string;
  const logId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await run(
    `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_addr, user_agent, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [logId, userId, action, entityType, entityId, ipAddr, userAgent, timestamp]
  );
}

// ---------------------------------------------------------------------------
// PDF compilation helper — used by /api/contracts/generate (story 6-3) and
// the legacy fallback path in /vault/:filename for contracts predating R2.
// ---------------------------------------------------------------------------
interface ClauseVersion {
  clause_key: string;
  content: string;
  loi_reference: string;
}

async function compileContractPdfBuffer(contract: any): Promise<Buffer> {
  const clauses = await all<ClauseVersion>(
    'SELECT clause_key, content, loi_reference FROM clause_versions WHERE contract_type = ?',
    [contract.type]
  );
  const data = JSON.parse(contract.data_json);
  let compiledContent = `CONTRAT DE ${String(contract.type).toUpperCase()}\n\n`;
  if (clauses.length > 0) {
    clauses.forEach((clause) => {
      let text = clause.content;
      const matches = text.match(/\{[a-zA-Z0-9_]+\}/g);
      if (matches) {
        matches.forEach((m) => {
          const key = m.slice(1, -1);
          const replacement = data[key] !== undefined ? data[key] : `[${key}]`;
          text = text.replace(m, replacement);
        });
      }
      compiledContent += `${text} (Ref: ${clause.loi_reference})\n\n`;
    });
  } else {
    compiledContent += `Donnees du contrat :\n` + JSON.stringify(data, null, 2);
  }

  const textLines = compiledContent.split('\n');
  let streamContent = `BT\n/F1 10 Tf\n14 TL\n50 780 Td\n`;
  textLines.forEach(line => {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    streamContent += `(${escaped}) Tj T*\n`;
  });
  streamContent += `ET`;
  const streamLength = Buffer.byteLength(streamContent, 'latin1');
  const pdfParts = [
    `%PDF-1.4`,
    `1 0 obj`, `<< /Type /Catalog /Pages 2 0 R >>`, `endobj`,
    `2 0 obj`, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`, `endobj`,
    `3 0 obj`, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`, `endobj`,
    `4 0 obj`, `<< /Length ${streamLength} >>`, `stream`, streamContent, `endstream`, `endobj`,
    `5 0 obj`, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`, `endobj`,
    `xref`, `0 6`, `0000000000 65535 f `,
    `trailer`, `<< /Size 6 /Root 1 0 R >>`,
    `%%EOF`
  ];
  return Buffer.from(pdfParts.join('\n'), 'latin1');
}

// Zod validation for contract generation
const generateContractSchema = z.object({
  type: z.string().min(1, { message: "Contract type is required" }),
  template_id: z.string().min(1, { message: "Template ID is required" }),
  data: z.record(z.string(), z.any())
});

// GET /api/contracts/templates
app.get('/api/contracts/templates', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = [
      { id: "bail_habitation", name: "Contrat de bail d'habitation", type: "Bail", description: "Contrat de location standard pour logement." },
      { id: "travail_cdi", name: "Contrat de travail CDI", type: "Travail", description: "Contrat de travail à durée indéterminée de droit portugais." },
      { id: "prestation_services", name: "Contrat de prestation de services", type: "Prestation", description: "Contrat de services pour freelances et entreprises." }
    ];
    res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/contracts/generate
app.post('/api/contracts/generate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = generateContractSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    const { type, template_id, data } = parsed.data;
    const userId = (req as any).user.id;
    const contractId = crypto.randomUUID();
    const pdfUrl = `/vault/${contractId}.pdf`;
    const createdAt = new Date().toISOString();

    // Insert contracts row first so compileContractPdfBuffer sees the data.
    await run(
      `INSERT INTO contracts (id, user_id, type, status, template_id, data_json, pdf_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [contractId, userId, type, 'generated', template_id, JSON.stringify(data), pdfUrl, createdAt]
    );

    // Story 6-3: compile PDF buffer and push to vault (R2 + envelope encryption
    // when KEK is set, in-memory fallback otherwise). Failures are non-fatal
    // for the POC path — the legacy /vault/:filename handler will recompile
    // on-the-fly if r2_key is missing.
    let r2Key: string | null = null;
    try {
      const contractRow = { type, data_json: JSON.stringify(data) };
      const pdfBuffer = await compileContractPdfBuffer(contractRow);
      const stored = await putDocument({
        buffer: pdfBuffer,
        mime_type: 'application/pdf',
        entity_type: 'contract',
        entity_id: contractId,
        user_id: userId,
      });
      r2Key = stored.r2_key;
      await run(`UPDATE contracts SET r2_key = ? WHERE id = ?`, [r2Key, contractId]);
    } catch (storageErr: any) {
      // Don't 500 the user — log and fall back to on-the-fly serve.
      console.warn('Vault upload skipped for contract', contractId, ':', storageErr?.message || storageErr);
    }

    // Audit log
    await logAudit(userId, 'CREATE_CONTRACT', 'contract', contractId, req);

    res.status(201).json({
      success: true,
      message: 'Contract generated successfully.',
      contractId,
      pdfUrl,
      r2_key: r2Key,
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/contracts/:id/preview
app.get('/api/contracts/:id/preview', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const contract = await get<any>('SELECT * FROM contracts WHERE id = ?', [id]);
    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' });
      return;
    }

    // Role check: client can only view their own contracts
    if (userRole === 'client' && contract.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    // Fetch clauses of this type to compile preview
    interface ClauseVersion {
      clause_key: string;
      content: string;
      loi_reference: string;
    }
    const clauses = await all<ClauseVersion>(
      'SELECT clause_key, content, loi_reference FROM clause_versions WHERE contract_type = ?',
      [contract.type]
    );

    const data = JSON.parse(contract.data_json);
    let compiledContent = `CONTRAT DE ${contract.type.toUpperCase()}\n\n`;

    if (clauses.length > 0) {
      clauses.forEach((clause) => {
        let text = clause.content;
        // Basic template replacement {var}
        const matches = text.match(/\{[a-zA-Z0-9_]+\}/g);
        if (matches) {
          matches.forEach((m) => {
            const key = m.slice(1, -1);
            const replacement = data[key] !== undefined ? data[key] : `[${key}]`;
            text = text.replace(m, replacement);
          });
        }
        compiledContent += `${text} (Ref: ${clause.loi_reference})\n\n`;
      });
    } else {
      compiledContent += `Données du contrat :\n` + JSON.stringify(data, null, 2);
    }

    // Audit log preview action
    await logAudit(userId, 'PREVIEW_CONTRACT', 'contract', id as string, req);

    res.status(200).json({
      success: true,
      contract,
      compiledContent
    });
  } catch (error) {
    console.error('Error previewing contract:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /vault/:filename — serve a contract PDF.
//
// Story 6-3 behaviour:
//  1. Lookup contracts row by id (filename = `{contractId}.pdf`).
//  2. If `contracts.r2_key` is set → fetch the encrypted blob from the vault
//     (R2 or local POC store), decrypt it via envelope encryption, stream.
//  3. Fallback (legacy contracts pre-R2) → compile the PDF on the fly from
//     clause_versions and stream that.
//
// Audit: every successful download is logged (DOWNLOAD_VAULT_DOCUMENT).
app.get('/vault/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename as string;
    const contractId = filename.replace('.pdf', '');

    const contract = await get<any>('SELECT * FROM contracts WHERE id = ?', [contractId]);
    if (!contract) {
      res.status(404).send('Document not found');
      return;
    }

    let pdfBuffer: Buffer;
    if (contract.r2_key) {
      try {
        // vault_documents row for the same r2_key has the encrypted_dek.
        const row = await get<{ encrypted_dek: string }>(
          'SELECT encrypted_dek FROM vault_documents WHERE r2_key = ?',
          [contract.r2_key]
        );
        pdfBuffer = await getDocumentByR2Key(contract.r2_key, row?.encrypted_dek || '');
      } catch (vaultErr: any) {
        // Vault read failed — fall back to on-the-fly compilation so the user
        // can still retrieve their contract.
        console.warn('Vault read failed for', contract.r2_key, ':', vaultErr?.message || vaultErr);
        pdfBuffer = await compileContractPdfBuffer(contract);
      }
    } else {
      pdfBuffer = await compileContractPdfBuffer(contract);
    }

    // Best-effort audit log. We don't know which user is downloading
    // (this endpoint is unauthenticated for now to keep the legacy <a href>
    // flow working) so we record under the contract owner.
    try {
      await logAudit(contract.user_id || null, 'DOWNLOAD_VAULT_DOCUMENT', 'contract', contractId, req);
    } catch { /* never fail the download because of audit issues */ }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /api/vault/documents
app.get('/api/vault/documents', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    let contracts: any[] = [];
    if (userRole === 'admin_cabinet' || userRole === 'avocat') {
      contracts = await all<any>('SELECT * FROM contracts ORDER BY created_at DESC');
    } else {
      contracts = await all<any>('SELECT * FROM contracts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    }

    const documents = contracts.map(c => ({
      id: c.id,
      name: `${c.type} Contract - ${c.id.slice(0, 8)}`,
      type: c.type,
      status: c.status,
      createdAt: c.created_at,
      url: c.pdf_url
    }));

    // Audit log
    await logAudit(userId, 'LIST_VAULT_DOCUMENTS', 'vault', userId, req);

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching vault documents:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/vault/audit
app.get('/api/vault/audit', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const auditLogs = await all<any>('SELECT * FROM audit_log ORDER BY timestamp DESC');

    res.status(200).json({
      success: true,
      auditLogs
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Assistant RAG and Guardrail implementation
const legalKeywords = [
  'law', 'loi', 'direito', 'legal', 'arrendamento', 'contrato', 'contract', 'lease', 'tribunal', 
  'nif', 'finanças', 'tax', 'imposto', 'fiscal', 'segurança social', 'visto', 'visa', 'sef', 
  'advogado', 'lawyer', 'avocat', 'nrau', 'trabalho', 'código', 'decreto', 'portugal', 'eu', 'ue',
  'european', 'cabinet', 'oliveira', 'cameiro'
];

const generalBanter = [
  'hello', 'hi', 'bonjour', 'olá', 'ola', 'hey', 'how are you', 'ça va', 'como vai', 'bom dia', 'boa tarde', 'boa noite'
];

function isQueryInScope(query: string): boolean {
  const lowercase = query.toLowerCase();
  
  // Check if it's general conversational banter
  const isBanter = generalBanter.some(banter => lowercase.includes(banter));
  if (isBanter && lowercase.length < 20) {
    return true;
  }

  // Tokenize query into words
  const words = lowercase.split(/[^a-z0-9áéíóúâêîôûàèìòùçãõ]/);

  // Check if it contains legal keywords with proper word matching
  const hasLegalKeyword = legalKeywords.some(keyword => {
    if (keyword.length <= 3) {
      return words.includes(keyword);
    }
    return words.some(w => w.includes(keyword));
  });
  
  return hasLegalKeyword;
}

function getRAGResponse(query: string): { response: string; source: string } {
  const lowercase = query.toLowerCase();

  if (lowercase.includes('nif') || lowercase.includes('fiscal') || lowercase.includes('finanças')) {
    return {
      response: "Para obter o NIF (Número de Identificação Fiscal) em Portugal, a EasyLaw disponibiliza um processo online sob a supervisão do gabinete Oliveira & Cameiro. Ajudamos a submeter os documentos (passaporte e comprovativo de morada), a obter a representação fiscal para não residentes e a registar-se junto da Autoridade Tributária e Aduaneira (AT).",
      source: "Manual de Acolhimento AT & Portal das Finanças / EasyLaw NIF Starter Pack"
    };
  }

  if (lowercase.includes('arrendamento') || lowercase.includes('bail') || lowercase.includes('lease') || lowercase.includes('rent') || lowercase.includes('loyer')) {
    return {
      response: "Os contratos de arrendamento urbano habitacional em Portugal são regidos pelo Novo Regime do Arrendamento Urbano (NRAU) e pelo Código Civil. A legislação estipula limites e regras para a atualização da renda (comunicação prévia por escrito com antecedência), prazos mínimos de denúncia e rescisão contratual para senhorios e inquilinos.",
      source: "Lei n.º 6/2006 (NRAU) e Artigo 1040.º do Código Civil Português"
    };
  }

  if (lowercase.includes('trabalho') || lowercase.includes('trabalhador') || lowercase.includes('employment') || lowercase.includes('cdd') || lowercase.includes('cdi') || lowercase.includes('salário') || lowercase.includes('salaire')) {
    return {
      response: "Os contratos de trabalho (a termo resolutivo CDD ou por tempo indeterminado CDI) estão sob a égide do Código do Trabalho (Lei n.º 7/2009). Esta lei regula matérias como o período experimental (geralmente de 90 a 180 dias), os limites de horário de trabalho, direitos a férias e os procedimentos legais obrigatórios para cessação de contrato.",
      source: "Código do Trabalho (Lei n.º 7/2009) de Portugal"
    };
  }

  if (lowercase.includes('chave móvel') || lowercase.includes('cmd') || lowercase.includes('assinatura') || lowercase.includes('signature')) {
    return {
      response: "A Chave Móvel Digital (CMD) é o meio oficial do Estado Português para autenticação e assinatura eletrónica de documentos. Está em total conformidade com o Regulamento Europeu eIDAS (nível Avançado), permitindo assinar contratos com força probatória plena, conforme o Decreto-Lei n.º 12/2021.",
      source: "Decreto-Lei n.º 12/2021 e Regulamento eIDAS (UE) n.º 910/2014"
    };
  }

  if (lowercase.includes('oliveira') || lowercase.includes('cameiro') || lowercase.includes('lawyer') || lowercase.includes('avocat') || lowercase.includes('advogado')) {
    return {
      response: "O gabinete Oliveira & Cameiro Advogados Associados, com sede no Porto, é o parceiro legal exclusivo da EasyLaw. Os seus advogados supervisionam e validam as bases de conhecimento da nossa IA e assumem a prestação de assessoria jurídica personalizada em casos complexos escalados através da nossa plataforma.",
      source: "Estatuto da Ordem dos Advogados (Lei n.º 145/2015) & EasyLaw Partner Agreement"
    };
  }

  if (lowercase.includes('visto') || lowercase.includes('visa') || lowercase.includes('sef') || lowercase.includes('residência')) {
    return {
      response: "Portugal disponibiliza vários tipos de vistos e autorizações de residência, incluindo o Visto D7 (para reformados e titulares de rendimentos próprios), o Visto D8 (nómadas digitais) e vistos de trabalho/empreendedorismo. A transição dos processos é feita com a colaboração do nosso gabinete jurídico parceiro para assegurar a conformidade perante a AIMA (antigo SEF).",
      source: "Lei n.º 23/2007 (Lei de Estrangeiros) de Portugal"
    };
  }

  if (lowercase.includes('empresa') || lowercase.includes('société') || lowercase.includes('lda') || lowercase.includes('unipessoal')) {
    return {
      response: "A constituição de sociedades comerciais em Portugal (seja Lda., Unipessoal Lda. ou S.A.) é regida pelo Código das Sociedades Comerciais. O processo pode ser realizado online através do serviço 'Empresa na Hora', requerendo a aprovação da firma (admissibilidade de nome) e o depósito do capital social inicial.",
      source: "Código das Sociedades Comerciais (Decreto-Lei n.º 262/86)"
    };
  }

  return {
    response: "Como assistente virtual Luso-Legal da EasyLaw, posso esclarecer que as matérias jurídicas em Portugal estão sujeitas ao direito nacional português e às diretivas/regulamentos da União Europeia. Para obter respostas precisas sobre o seu caso específico de arrendamento, NIF ou contratos, pode utilizar as nossas ferramentas de geração ou solicitar a escalada direta para um advogado do gabinete Oliveira & Cameiro.",
    source: "EasyLaw Luso-Legal Knowledge Base (Direito Português e Comunitário)"
  };
}

// POST /api/assistant/chat
app.post('/api/assistant/chat', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const userId = (req as any).user.id;
    const inScope = isQueryInScope(message);

    if (!inScope) {
      res.status(200).json({
        success: true,
        inScope: false,
        response: 'Je ne peux répondre qu\'aux questions relatives au droit portugais, européen ou à des sujets juridiques généraux. Votre demande semble hors périmètre. Comment puis-je vous aider concernant la législation portugaise aujourd\'hui ?',
        source: 'Scope Guardrail'
      });
      return;
    }

    const systemPromptRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['assistant_system_prompt']);
    const systemPrompt = systemPromptRow ? systemPromptRow.value : 'Vous êtes Luso-Legal, assistant juridique...';

    let { response, source } = getRAGResponse(message);
    const lowercaseQuery = message.toLowerCase();
    if (lowercaseQuery.includes('system prompt') || lowercaseQuery.includes('instructions') || lowercaseQuery.includes('consignes') || lowercaseQuery.includes('qui es-tu') || lowercaseQuery.includes('quem és')) {
      response = `[Luso-Legal] Mes consignes système actives : "${systemPrompt}"`;
      source = "Configuration Système";
    }
    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Store user message
    await run(
      `INSERT INTO assistant_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      [userMsgId, userId, 'user', message, now]
    );

    // Store assistant response
    await run(
      `INSERT INTO assistant_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      [assistantMsgId, userId, 'assistant', response, now]
    );

    res.status(200).json({
      success: true,
      inScope: true,
      response,
      source
    });
  } catch (error) {
    console.error('Error in assistant chat:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/assistant/history
app.get('/api/assistant/history', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const messages = await all<any>(
      'SELECT id, role, content, created_at FROM assistant_messages WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching assistant history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/assistant/escalate
app.post('/api/assistant/escalate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversation_summary } = req.body;
    if (!conversation_summary || typeof conversation_summary !== 'string' || conversation_summary.trim() === '') {
      res.status(400).json({ success: false, message: 'Conversation summary is required' });
      return;
    }

    const userId = (req as any).user.id;
    const escalationId = crypto.randomUUID();
    const now = new Date().toISOString();

    await run(
      `INSERT INTO lawyer_escalations (id, user_id, conversation_summary, status, created_at) VALUES (?, ?, ?, ?, ?)`,
      [escalationId, userId, conversation_summary, 'pending', now]
    );

    res.status(201).json({
      success: true,
      escalationId,
      message: 'Votre demande a été escaladée avec succès à un avocat de Oliveira & Cameiro. Un membre de l\'équipe vous contactera sous 24h.'
    });
  } catch (error) {
    console.error('Error in assistant escalation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ==========================================
// Epic 4: Compliance Tracking & Alerts
// ==========================================

const complianceSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Due date must be in YYYY-MM-DD format" }),
  category: z.string().min(1, { message: "Category is required" }),
  user_id: z.string().optional().nullable(),
});

function getDaysLeft(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getComplianceColor(status: string, dueDateStr: string, orangeThreshold: number = 90, redThreshold: number = 30): 'red' | 'orange' | 'green' {
  if (status === 'completed') {
    return 'green';
  }
  const daysLeft = getDaysLeft(dueDateStr);
  if (daysLeft < redThreshold) {
    return 'red';
  }
  if (daysLeft <= orangeThreshold) {
    return 'orange';
  }
  return 'green';
}

// GET /api/compliance
app.get('/api/compliance', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.user_id as string;
    let query = 'SELECT * FROM compliance_items';
    let params: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = ? OR user_id IS NULL';
      params.push(userId);
    }
    
    query += ' ORDER BY due_date ASC';
    const items = await all<{ id: string; title: string; description: string | null; due_date: string; status: string; category: string; user_id: string | null; created_at: string }>(query, params);
    
    // Fetch thresholds
    const orangeThresholdRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_orange_days']);
    const redThresholdRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_red_days']);
    const orangeDays = orangeThresholdRow ? parseInt(orangeThresholdRow.value, 10) : 7;
    const redDays = redThresholdRow ? parseInt(redThresholdRow.value, 10) : 0;

    const enriched = items.map(item => {
      const daysLeft = getDaysLeft(item.due_date);
      const color = getComplianceColor(item.status, item.due_date, orangeDays, redDays);
      return {
        ...item,
        days_left: daysLeft,
        color
      };
    });
    
    res.status(200).json({
      success: true,
      items: enriched
    });
  } catch (error) {
    console.error('Error fetching compliance items:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/compliance
app.post('/api/compliance', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = complianceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        errors: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    
    const { title, description, due_date, category, user_id } = parsed.data;
    const id = crypto.randomUUID();
    const status = 'pending';
    const createdAt = new Date().toISOString();
    
    await run(
      `INSERT INTO compliance_items (id, title, description, due_date, status, category, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description || null, due_date, status, category, user_id || null, createdAt]
    );
    
    const orangeThresholdRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_orange_days']);
    const redThresholdRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_red_days']);
    const orangeDays = orangeThresholdRow ? parseInt(orangeThresholdRow.value, 10) : 7;
    const redDays = redThresholdRow ? parseInt(redThresholdRow.value, 10) : 0;

    const daysLeft = getDaysLeft(due_date);
    const color = getComplianceColor(status, due_date, orangeDays, redDays);
    
    res.status(201).json({
      success: true,
      item: {
        id,
        title,
        description: description || null,
        due_date,
        status,
        category,
        user_id: user_id || null,
        created_at: createdAt,
        days_left: daysLeft,
        color
      }
    });
  } catch (error) {
    console.error('Error creating compliance item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/compliance/:id
app.put('/api/compliance/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, title, description, due_date, category } = req.body;
    
    const item = await get<{ id: string; status: string; due_date: string }>(
      'SELECT * FROM compliance_items WHERE id = ?',
      [id]
    );
    
    if (!item) {
      res.status(404).json({ success: false, message: 'Compliance item not found' });
      return;
    }
    
    const newStatus = status !== undefined ? status : item.status;
    let updateFields = ['status = ?'];
    let params: any[] = [newStatus];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (due_date !== undefined) {
      updateFields.push('due_date = ?');
      params.push(due_date);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      params.push(category);
    }
    
    params.push(id);
    
    await run(
      `UPDATE compliance_items SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    const updated = await get<{ id: string; title: string; description: string | null; due_date: string; status: string; category: string; user_id: string | null; created_at: string }>(
      'SELECT * FROM compliance_items WHERE id = ?',
      [id]
    );
    
    if (!updated) {
      res.status(500).json({ success: false, message: 'Failed to retrieve updated item' });
      return;
    }
    
    const orangeThresholdRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_orange_days']);
    const redThresholdRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_red_days']);
    const orangeDays = orangeThresholdRow ? parseInt(orangeThresholdRow.value, 10) : 7;
    const redDays = redThresholdRow ? parseInt(redThresholdRow.value, 10) : 0;

    const daysLeft = getDaysLeft(updated.due_date);
    const color = getComplianceColor(updated.status, updated.due_date, orangeDays, redDays);
    
    res.status(200).json({
      success: true,
      item: {
        ...updated,
        days_left: daysLeft,
        color
      }
    });
  } catch (error) {
    console.error('Error updating compliance item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/compliance/alert-logs
app.get('/api/compliance/alert-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await all('SELECT * FROM compliance_alert_logs ORDER BY sent_at DESC');
    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error fetching compliance alert logs:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/compliance/simulate-alerts
app.post('/api/compliance/simulate-alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await all<{ id: string; title: string; due_date: string; status: string; category: string; user_id: string | null }>(
      `SELECT * FROM compliance_items WHERE status != 'completed'`
    );

    let logsGenerated = 0;
    const generatedLogs = [];

    const orangeThresholdRow = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_orange_days']);
    const orangeDays = orangeThresholdRow ? parseInt(orangeThresholdRow.value, 10) : 7;

    for (const item of items) {
      const daysLeft = getDaysLeft(item.due_date);
      // Alert if overdue or due within configured orange threshold days
      if (daysLeft <= orangeDays) {
        let email = 'alert@easylaw.pt';
        if (item.user_id) {
          const user = await get<{ email: string }>('SELECT email FROM users WHERE id = ?', [item.user_id]);
          if (user) {
            email = user.email;
          }
        }

        const logId = crypto.randomUUID();
        const subject = `[EasyLaw Compliance Alert] "${item.title}" is ${daysLeft < 0 ? 'OVERDUE' : 'due soon'}`;
        const body = `Hello,

This is a compliance reminder. The obligation "${item.title}" (${item.category}) is ${daysLeft < 0 ? 'OVERDUE by ' + Math.abs(daysLeft) + ' day(s)' : 'due in ' + daysLeft + ' day(s)'} on ${item.due_date}.

Please update your dashboard once this is resolved.

Best regards,
EasyLaw Compliance Team`;

        const sentAt = new Date().toISOString();

        await run(
          `INSERT INTO compliance_alert_logs (id, compliance_item_id, recipient_email, subject, body, sent_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [logId, item.id, email, subject, body, sentAt]
        );

        console.log(`[MOCK EMAIL ALERT] Sent to ${email} regarding compliance item ${item.id}: "${subject}"`);

        generatedLogs.push({
          id: logId,
          compliance_item_id: item.id,
          recipient_email: email,
          subject,
          body,
          sent_at: sentAt
        });
        logsGenerated++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Simulated daily 07:00 cron compliance check. Processed ${items.length} items and generated ${logsGenerated} alerts.`,
      logsGenerated,
      logs: generatedLogs
    });
  } catch (error) {
    console.error('Error during alerts simulation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/compliance/:id
app.delete('/api/compliance/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await get('SELECT id FROM compliance_items WHERE id = ?', [id]);
    if (!item) {
      res.status(404).json({ success: false, message: 'Compliance item not found' });
      return;
    }
    await run('DELETE FROM compliance_alert_logs WHERE compliance_item_id = ?', [id]);
    await run('DELETE FROM compliance_items WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Compliance item deleted successfully' });
  } catch (error) {
    console.error('Error deleting compliance item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- ADMIN SETTINGS & MANAGEMENT ROUTES ---

// GET /api/admin/settings
app.get('/api/admin/settings', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await all<{ key: string; value: string }>('SELECT * FROM system_settings');
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/settings
app.put('/api/admin/settings', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) {
      res.status(400).json({ success: false, message: 'Settings array is required' });
      return;
    }

    for (const item of settings) {
      await run('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', [item.key, item.value]);
    }

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/clauses
app.get('/api/admin/clauses', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const clauses = await all('SELECT * FROM clause_versions');
    res.status(200).json({ success: true, clauses });
  } catch (error) {
    console.error('Error fetching clauses:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/clauses
app.post('/api/admin/clauses', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { contract_type, clause_key, content, loi_reference } = req.body;
    if (!contract_type || !clause_key || !content) {
      res.status(400).json({ success: false, message: 'contract_type, clause_key, and content are required' });
      return;
    }

    const id = crypto.randomUUID();
    const validFrom = new Date().toISOString().split('T')[0];

    await run(
      `INSERT INTO clause_versions (id, contract_type, clause_key, content, loi_reference, valid_from, valid_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, contract_type, clause_key, content, loi_reference || '', validFrom, '']
    );

    res.status(201).json({ success: true, message: 'Clause version created successfully', clauseId: id });
  } catch (error) {
    console.error('Error creating clause:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/clauses/:id
app.put('/api/admin/clauses/:id', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, loi_reference } = req.body;

    const clause = await get('SELECT id FROM clause_versions WHERE id = ?', [id]);
    if (!clause) {
      res.status(404).json({ success: false, message: 'Clause not found' });
      return;
    }

    await run(
      'UPDATE clause_versions SET content = ?, loi_reference = ? WHERE id = ?',
      [content, loi_reference || '', id]
    );

    res.status(200).json({ success: true, message: 'Clause updated successfully' });
  } catch (error) {
    console.error('Error updating clause:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/clauses/:id
app.delete('/api/admin/clauses/:id', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clause = await get('SELECT id FROM clause_versions WHERE id = ?', [id]);
    if (!clause) {
      res.status(404).json({ success: false, message: 'Clause not found' });
      return;
    }

    await run('DELETE FROM clause_versions WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Clause deleted successfully' });
  } catch (error) {
    console.error('Error deleting clause:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/users
app.get('/api/admin/users', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await all('SELECT id, email, name, role, lang, created_at FROM users WHERE deleted_at IS NULL');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/role
app.put('/api/admin/users/:id/role', authMiddleware, checkRole(['admin_cabinet']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin_cabinet', 'avocat', 'avocat_junior', 'client'].includes(role)) {
      res.status(400).json({ success: false, message: 'Valid role is required' });
      return;
    }

    const user = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.status(200).json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Health check endpoint for Railway
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Initializing Server if run directly
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[AUTH SERVICE] Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server due to database initialization failure:', err);
      process.exit(1);
    });
}

export default app;
export { initDb };

