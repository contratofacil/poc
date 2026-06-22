import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cron from 'node-cron';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { initDb, run, get, all, closeDb } from './db';
import { isPrivyConfigured, verifyPrivyToken, resolvePrivyUser } from './privy';
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
import { ensureCollections, deleteFromQdrantByFilter } from './rag-embeddings';
import { standardSearch, deepDiveSearch } from './rag-search';
import { streamResearch } from './rag-llm';
import { runIncrementalIndex } from './rag-crawler';
import { generateResearchPdf, storeResearchPdf } from './rag-pdf';
import {
  callPrompt,
  getPromptConfig,
  invalidatePromptCache,
  PROVIDER_MODELS,
  LLMProvider,
} from './rag-llm-router';
import { createEpic8Router } from './routes/epic8-contracts';
import { createEpic10Router } from './routes/epic10-analysis';
import { createEpic11Router, setupCollaborationSocket } from './routes/epic11-documents';
import { createEpic12Router } from './routes/epic12-ged';
import { createEpic13Router, buildOpenAPISpec } from './routes/epic13-api';
import { createAgentsRouter } from './routes/epic-agents';
import { createKycRouter } from './routes/kyc';
import { createContactRouter } from './routes/contact';

// Load environment variables
dotenv.config();

// ─── Role definitions ─────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN:    'super_admin',
  ADMIN:          'admin',
  CABINET_AVOCAT: 'cabinet_avocat',
  AVOCAT:         'avocat',
  AVOCAT_ASSOCIE: 'avocat_associe',
  JURISTE:        'juriste',
  SALARIE:        'salarie',
  ASSISTANT:      'assistant',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ALL_ROLES: UserRole[] = [
  'super_admin', 'admin', 'cabinet_avocat',
  'avocat', 'avocat_associe', 'juriste',
  'salarie', 'assistant',
];

// Can access admin dashboard & manage cabinet
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'cabinet_avocat'];

// Can change user roles (super admins + admins)
export const ROLE_MANAGER_ROLES: UserRole[] = ['super_admin', 'admin'];

// Can access legal research (RAG)
export const RESEARCH_ROLES_LIST: UserRole[] = [
  'super_admin', 'admin', 'cabinet_avocat',
  'avocat', 'avocat_associe', 'juriste',
];

// Can see all vault documents (not just own)
export const VAULT_PRIVILEGED_ROLES: UserRole[] = [
  'super_admin', 'admin', 'cabinet_avocat', 'avocat',
];
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL ?? '*', methods: ['GET', 'POST', 'PATCH'] },
});

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
    const role = 'salarie';
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

// Résout un Bearer token en utilisateur local : JWT interne d'abord,
// sinon token d'accès Privy (vérifié via JWKS, lié/provisionné par email).
const resolveBearerUser = async (token: string): Promise<{ id: string; email: string; role: string } | null> => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) { throw new Error('JWT_SECRET environment variable is required'); }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    const user = await get<UserRow>(
      'SELECT id, email, role, deleted_at FROM users WHERE id = ?',
      [decoded.id]
    );
    if (user && !user.deleted_at) {
      return { id: user.id, email: user.email, role: user.role };
    }
    return null;
  } catch {
    // Pas un JWT interne — on tente Privy.
  }

  if (!isPrivyConfigured()) return null;
  const did = await verifyPrivyToken(token);
  if (!did) return null;
  const user = await resolvePrivyUser(did);
  return user ? { id: user.id, email: user.email, role: user.role } : null;
};

// Authentication Middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const user = await resolveBearerUser(token);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Auth optionnelle — décode le token s'il est présent, sinon continue en anonyme.
// Utilisé par le funnel NIF public : /api/nif/apply accepte déjà les anonymes,
// l'upload des pièces doit suivre la même règle (user_id null en POC).
export const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await resolveBearerUser(token);
      if (user) {
        (req as any).user = user;
      }
    }
  } catch {
    // Token invalide → traité comme anonyme, pas comme une erreur
  }
  next();
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
  role: z.enum(['super_admin', 'admin', 'cabinet_avocat', 'avocat', 'avocat_associe', 'juriste', 'salarie', 'assistant'])
});

// Invite collaborator endpoint
app.post('/api/auth/invite', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
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

// GET /api/nif/template/procuration — generate procuration .docx on the fly
app.get('/api/nif/template/procuration', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = await import('docx');
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'PROCURATION', bold: true, size: 32 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Je soussigné(e), [NOM COMPLET], né(e) le [DATE DE NAISSANCE], de nationalité [NATIONALITÉ], demeurant au [ADRESSE COMPLÈTE], titulaire du passeport / document d\'identité n° [NUMÉRO DE DOCUMENT],', size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'donne par la présente PROCURATION à :', bold: true, size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Cabinet Oliveira & Carneiro, Advogados, inscrit au barreau de Lisbonne, sis au [ADRESSE DU CABINET],', size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'AFIN DE :', bold: true, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: '- Représenter le mandant auprès de l\'Autoridade Tributária e Aduaneira (Finanças) du Portugal.', size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: '- Déposer et suivre toutes démarches relatives à l\'obtention d\'un Numéro d\'Identification Fiscale (NIF).', size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: '- Signer tous documents nécessaires à cet effet.', size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'La présente procuration est donnée pour une durée de douze (12) mois à compter de la date de signature.', size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Fait à [VILLE], le [DATE]', size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Signature du mandant : ___________________________', size: 24 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: '(Précédée de la mention manuscrite « Lu et approuvé »)', italics: true, size: 20 })] }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [new TextRun({ text: 'Légalisation notariale ou apostille requise.', italics: true, size: 20 })] }),
        ],
      }],
    });
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="procuration_nif.docx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating procuration template:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
});

// Payment endpoint (POST /api/nif/payment)
app.post('/api/nif/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, dossier_id, method, amount, currency, product } = req.body;

    if (!user_id && !dossier_id) {
      res.status(400).json({ success: false, message: 'user_id or dossier_id is required' });
      return;
    }
    if (!method || !['stripe', 'mbway'].includes(method)) {
      res.status(400).json({ success: false, message: 'Invalid or missing payment method' });
      return;
    }

    // Resolve user_id from dossier when anonymous
    let resolvedUserId = user_id;
    if (!resolvedUserId && dossier_id) {
      const dossier = await get<{ user_id: string | null }>('SELECT user_id FROM dossiers_nif WHERE id = ?', [dossier_id]);
      resolvedUserId = dossier?.user_id ?? dossier_id; // fallback: use dossier_id as surrogate key
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
        [paymentId, resolvedUserId, stripeId, payAmount, payCurrency, 'pending', payProduct]
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
        [paymentId, resolvedUserId, null, payAmount, payCurrency, 'pending', payProduct]
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

const _nifUploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

// POST /api/nif/upload — proxy upload: receive file, encrypt, store to R2 vault.
// Direct browser→R2 presigned PUT was blocked by R2 CORS; proxying via backend
// avoids CORS entirely and keeps AES-256 encryption server-side.
// Auth optionnelle : le funnel NIF est public (cohérent avec /api/nif/apply).
app.post('/api/nif/upload', optionalAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  _nifUploadMulter(req, res, next);
}, async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }
    const userId: string = (req as any).user?.id ?? 'anonymous';
    const entityId: string | null = req.body?.entity_id ?? null;

    const result = await putDocument({
      buffer: file.buffer,
      mime_type: file.mimetype || 'application/octet-stream',
      entity_type: 'nif_piece',
      entity_id: entityId,
      user_id: userId,
    });

    await logAudit(userId, 'UPLOAD_DOCUMENT_COMPLETE', 'vault_document', result.id, req);

    res.status(200).json({
      success: true,
      filepath: result.r2_key,
      documentId: result.id,
      r2_key: result.r2_key,
    });
  } catch (error: any) {
    console.error('Error uploading vault document:', error?.message || error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
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
// Contract text builders — shared by /generate, /preview, and /vault fallback.
// ---------------------------------------------------------------------------
interface ClauseVersion {
  clause_key: string;
  content: string;
  loi_reference: string;
}

// Static {key} substitution — used as the reliable fallback.
function buildContractTextStatic(clauses: ClauseVersion[], data: Record<string, any>, contractType: string): string {
  let text = `CONTRAT DE ${String(contractType).toUpperCase()}\n\n`;
  if (clauses.length > 0) {
    clauses.forEach((clause) => {
      let t = clause.content;
      const matches = t.match(/\{[a-zA-Z0-9_]+\}/g);
      if (matches) {
        matches.forEach((m) => {
          const key = m.slice(1, -1);
          t = t.replace(m, data[key] !== undefined ? String(data[key]) : `[${key}]`);
        });
      }
      text += `${t} (Ref: ${clause.loi_reference})\n\n`;
    });
  } else {
    text += `Données du contrat :\n` + JSON.stringify(data, null, 2);
  }
  return text;
}

// AI-enhanced text builder with static fallback on timeout or failure.
// Tries LLM (contract_clause_generation) with optional RAG context for NDA,
// falls back to static substitution transparently.
async function buildContractText(contract: any): Promise<string> {
  const clauses = await all<ClauseVersion>(
    'SELECT clause_key, content, loi_reference FROM clause_versions WHERE contract_type = ?',
    [contract.type],
  );
  const data = JSON.parse(contract.data_json);
  const userLang: string = data._lang || 'FR';

  if (clauses.length > 0) {
    try {
      let ragContext = 'Aucun contexte juridique supplémentaire disponible.';
      if (contract.type === 'nda') {
        try {
          const ragResults = await Promise.race([
            standardSearch(`accord de confidentialite NDA ${data.objet || ''} droit portugais`, 3),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('rag_timeout')), 4000)),
          ]);
          const chunks = (ragResults as any[]).map((r) => r.chunk_text || '').filter(Boolean);
          if (chunks.length > 0) ragContext = chunks.join('\n\n');
        } catch {
          // RAG unavailable — proceed without it
        }
      }

      const aiText = await Promise.race([
        callPrompt('contract_clause_generation', {
          contract_type: contract.type,
          clauses_json: JSON.stringify(clauses.map((c) => ({
            clause_key: c.clause_key,
            content_template: c.content,
            loi_reference: c.loi_reference,
          }))),
          data_json: JSON.stringify(data),
          lang: userLang,
          rag_context: ragContext,
          jurisdiction: String(data.jurisdiction || 'Portugal'),
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('llm_timeout')), 90000)),
      ]);

      if (aiText && aiText.length >= 100) return aiText;
    } catch (aiErr: any) {
      console.warn('[buildContractText] AI generation skipped, using static fallback:', aiErr?.message);
    }
  }

  return buildContractTextStatic(clauses, data, contract.type);
}

// Word-wrap a line to fit within maxChars (prevents text overflow on the right margin).
function wrapTextLine(line: string, maxChars = 95): string[] {
  if (line.length <= maxChars) return [line];
  const words = line.split(' ');
  const wrapped: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) wrapped.push(current);
      // Force-split single words that exceed the limit
      if (word.length > maxChars) {
        let w = word;
        while (w.length > maxChars) { wrapped.push(w.slice(0, maxChars)); w = w.slice(maxChars); }
        current = w;
      } else {
        current = word;
      }
    }
  }
  if (current) wrapped.push(current);
  return wrapped;
}

// Windows-1252 positions for Unicode chars that are outside Latin-1 (U+0080–U+009F range
// in the codepage but map to useful glyphs). Needed for —, –, curly quotes, etc.
const WIN1252: Record<number, number> = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

// Encode a JS string to Windows-1252 bytes for a PDF text stream with WinAnsiEncoding.
function toPdfBytes(str: string): string {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const cp = str.charCodeAt(i);
    if (cp <= 0xFF) out += String.fromCharCode(cp);
    else if (WIN1252[cp] !== undefined) out += String.fromCharCode(WIN1252[cp]);
    else out += '?';
  }
  return out;
}

// Strip Markdown formatting so AI-generated text renders cleanly in a plain PDF.
// Converts headings to uppercase text, removes bold/italic markers, drops code fences
// and separators, and removes bare snake_case clause-key identifiers the LLM sometimes
// emits as section labels.
function stripMarkdown(text: string): string {
  return text
    .replace(/^```[\s\S]*?^```/gm, '')                    // fenced code blocks
    .replace(/^(?:-{3,}|\*{3,}|_{3,})$/gm, '')           // horizontal rules
    .replace(/^#{1,2}\s+(.+)$/gm, (_, t) => t.toUpperCase()) // h1/h2 → uppercase
    .replace(/^#{3,6}\s+(.+)$/gm, '$1')                  // h3–h6 → plain text
    .replace(/^>\s*/gm, '')                               // blockquote markers > (keeps content)
    .replace(/\*{1,2}([^*\n]+)\*{1,2}/g, '$1')           // **bold** / *italic*
    .replace(/__([^_\n]+)__/g, '$1')                      // __bold__
    .replace(/`([^`]+)`/g, '$1')                          // `inline code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')             // [link](url) → text
    .replace(/^[a-z][a-z0-9_]{2,}[a-z0-9]$/gm, '')      // bare snake_case clause keys
    .replace(/^[A-Z][A-Z0-9_]{2,}[A-Z0-9]$/gm, '')      // bare UPPER_SNAKE_CASE clause keys
    .replace(/\n{3,}/g, '\n\n')                           // collapse excess blank lines
    .replace(/[ \t]+$/gm, '');                            // trailing whitespace per line
}

async function compileContractPdfBuffer(contract: any): Promise<Buffer> {
  const compiledContent = await buildContractText(contract);

  // Strip markdown and wrap each paragraph line to prevent right-edge overflow.
  const textLines = stripMarkdown(compiledContent).split('\n').flatMap((l) => wrapTextLine(l));

  // Build the content stream using WinAnsiEncoding-compatible bytes.
  let streamContent = `BT\n/F1 10 Tf\n14 TL\n50 780 Td\n`;
  textLines.forEach((line) => {
    const bytes = toPdfBytes(line);
    const escaped = bytes.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
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
    // WinAnsiEncoding ensures accented Latin characters (é, è, à, ç…) render correctly.
    `5 0 obj`, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`, `endobj`,
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

// GET /api/contracts/templates — handled by Epic 8 router (mounted below)

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

    // Role check: non-privileged roles can only view their own contracts
    if (!RESEARCH_ROLES_LIST.includes(userRole as UserRole) && contract.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const compiledContent = await buildContractText(contract);

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
//
// Story 6-3: returns the union of `contracts` (legacy) and `vault_documents`
// (new R2-backed uploads). Response shape is preserved for the frontend
// (id, name, type, status, createdAt, url) — `url` is the existing
// `/vault/{contractId}.pdf` for contracts, and `/api/vault/documents/:id/stream`
// for new entries.
app.get('/api/vault/documents', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const isPrivileged = VAULT_PRIVILEGED_ROLES.includes(userRole as UserRole);

    let contracts: any[] = [];
    let vaultRows: VaultDocumentRow[] = [];
    if (isPrivileged) {
      contracts = await all<any>('SELECT * FROM contracts ORDER BY created_at DESC');
      vaultRows = await all<VaultDocumentRow>(
        `SELECT * FROM vault_documents WHERE status != 'deleted' ORDER BY created_at DESC`
      );
    } else {
      contracts = await all<any>('SELECT * FROM contracts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
      vaultRows = await all<VaultDocumentRow>(
        `SELECT * FROM vault_documents WHERE user_id = ? AND status != 'deleted' ORDER BY created_at DESC`,
        [userId]
      );
    }

    const contractDocs = contracts.map((c: any) => ({
      id: c.id,
      name: `${c.type} Contract - ${String(c.id).slice(0, 8)}`,
      type: c.type,
      status: c.status,
      createdAt: c.created_at,
      url: c.pdf_url,
      source: 'contract' as const,
    }));

    // Skip vault rows whose entity is a contract we already listed
    // (to avoid duplicates in the UI).
    const contractIds = new Set(contracts.map((c: any) => c.id));
    const vaultDocs = vaultRows
      .filter(v => !(v.entity_type === 'contract' && v.entity_id && contractIds.has(v.entity_id)))
      .map(v => ({
        id: v.id,
        name: `${v.entity_type} - ${v.id.slice(0, 8)}`,
        type: v.entity_type,
        status: v.status,
        createdAt: v.created_at,
        url: `/api/vault/documents/${v.id}/stream`,
        source: 'vault' as const,
      }));

    const documents = [...contractDocs, ...vaultDocs].sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );

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

// GET /api/vault/documents/:id/stream — authenticated, decrypts & streams the
// document from the vault (R2 or POC store). RBAC: client = own only,
// avocat/admin = all.
app.get('/api/vault/documents/:id/stream', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const documentId = req.params.id as string;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const row = await get<VaultDocumentRow>(
      'SELECT * FROM vault_documents WHERE id = ?',
      [documentId]
    );
    if (!row) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    if (row.status !== 'ready') {
      res.status(409).json({ success: false, message: `Document not ready (status=${row.status})` });
      return;
    }
    const isPrivileged = VAULT_PRIVILEGED_ROLES.includes(userRole as UserRole);
    if (!isPrivileged && row.user_id !== userId) {
      await logAudit(userId, 'FORBIDDEN_VAULT_ACCESS', 'vault_document', documentId, req);
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { buffer } = await getDocumentBuffer(documentId);
    await logAudit(userId, 'DOWNLOAD_VAULT_DOCUMENT', 'vault_document', documentId, req);

    res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${row.id}"`);
    res.status(200).send(buffer);
  } catch (error: any) {
    console.error('Error streaming vault document:', error?.message || error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/vault/documents/:id/download-url
//
// For documents that are NOT envelope-encrypted (encrypted_dek empty), returns
// a short-lived presigned GET URL straight from R2. For encrypted documents
// (the default in production), returns a streamUrl pointing at the auth+decrypt
// streaming endpoint above — the client cannot decrypt without the KEK.
app.get('/api/vault/documents/:id/download-url', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const documentId = req.params.id as string;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const row = await get<VaultDocumentRow>(
      'SELECT * FROM vault_documents WHERE id = ?',
      [documentId]
    );
    if (!row) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    if (row.status !== 'ready') {
      res.status(409).json({ success: false, message: `Document not ready (status=${row.status})` });
      return;
    }
    const isPrivileged = VAULT_PRIVILEGED_ROLES.includes(userRole as UserRole);
    if (!isPrivileged && row.user_id !== userId) {
      await logAudit(userId, 'FORBIDDEN_VAULT_ACCESS', 'vault_document', documentId, req);
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    if (row.encrypted_dek && row.encrypted_dek.length > 0) {
      // Encrypted — client cannot decrypt; use the streaming endpoint.
      res.status(200).json({
        success: true,
        streamUrl: `/api/vault/documents/${row.id}/stream`,
      });
      return;
    }

    // Legacy / POC unencrypted path: presign a GET (60s TTL).
    try {
      const { getR2Client, getR2Bucket } = await import('./storage/r2-client');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const client = getR2Client();
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: getR2Bucket(), Key: row.r2_key }),
        { expiresIn: 60 }
      );
      res.status(200).json({ success: true, downloadUrl: url, expiresIn: 60 });
    } catch (signErr: any) {
      // Local POC driver — fall back to streaming endpoint.
      res.status(200).json({
        success: true,
        streamUrl: `/api/vault/documents/${row.id}/stream`,
        warning: signErr?.message || 'presign unavailable',
      });
    }
  } catch (error: any) {
    console.error('Error issuing vault download URL:', error?.message || error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/vault/audit
app.get('/api/vault/audit', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
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

function getRAGResponse(query: string, lang: string = 'PT'): { response: string; source: string } {
  const lowercase = query.toLowerCase();
  const isFR = lang === 'FR';

  if (lowercase.includes('nif') || lowercase.includes('fiscal') || lowercase.includes('finanças')) {
    return {
      response: isFR
        ? "Pour obtenir le NIF (Numéro d'Identification Fiscale) au Portugal, EasyLaw propose un processus en ligne sous la supervision du cabinet Oliveira & Cameiro. Nous vous aidons à soumettre vos documents (passeport et justificatif de domicile), à obtenir une représentation fiscale pour les non-résidents et à vous enregistrer auprès de l'Autoridade Tributária e Aduaneira (AT)."
        : "Para obter o NIF (Número de Identificação Fiscal) em Portugal, a EasyLaw disponibiliza um processo online sob a supervisão do gabinete Oliveira & Cameiro. Ajudamos a submeter os documentos (passaporte e comprovativo de morada), a obter a representação fiscal para não residentes e a registar-se junto da Autoridade Tributária e Aduaneira (AT).",
      source: "Manual de Acolhimento AT & Portal das Finanças / EasyLaw NIF Starter Pack"
    };
  }

  if (lowercase.includes('arrendamento') || lowercase.includes('bail') || lowercase.includes('lease') || lowercase.includes('rent') || lowercase.includes('loyer')) {
    return {
      response: isFR
        ? "Les contrats de bail urbain résidentiel au Portugal sont régis par le Nouveau Régime du Bail Urbain (NRAU) et par le Code Civil. La loi prévoit des limites et règles pour la révision des loyers (notification préalable par écrit), ainsi que des délais minimaux de résiliation pour les propriétaires et les locataires."
        : "Os contratos de arrendamento urbano habitacional em Portugal são regidos pelo Novo Regime do Arrendamento Urbano (NRAU) e pelo Código Civil. A legislação estipula limites e regras para a atualização da renda (comunicação prévia por escrito com antecedência), prazos mínimos de denúncia e rescisão contratual para senhorios e inquilinos.",
      source: "Lei n.º 6/2006 (NRAU) e Artigo 1040.º do Código Civil Português"
    };
  }

  if (lowercase.includes('trabalho') || lowercase.includes('trabalhador') || lowercase.includes('employment') || lowercase.includes('cdd') || lowercase.includes('cdi') || lowercase.includes('salário') || lowercase.includes('salaire')) {
    return {
      response: isFR
        ? "Les contrats de travail (à durée déterminée CDD ou indéterminée CDI) sont encadrés par le Code du Travail portugais (Lei n.º 7/2009). Cette loi réglemente la période d'essai (généralement 90 à 180 jours), les limites d'heures de travail, les droits aux congés et les procédures légales obligatoires de rupture de contrat."
        : "Os contratos de trabalho (a termo resolutivo CDD ou por tempo indeterminado CDI) estão sob a égide do Código do Trabalho (Lei n.º 7/2009). Esta lei regula matérias como o período experimental (geralmente de 90 a 180 dias), os limites de horário de trabalho, direitos a férias e os procedimentos legais obrigatórios para cessação de contrato.",
      source: "Código do Trabalho (Lei n.º 7/2009) de Portugal"
    };
  }

  if (lowercase.includes('chave móvel') || lowercase.includes('cmd') || lowercase.includes('assinatura') || lowercase.includes('signature')) {
    return {
      response: isFR
        ? "La Chave Móvel Digital (CMD) est le moyen officiel de l'État portugais pour l'authentification et la signature électronique de documents. Elle est entièrement conforme au Règlement Européen eIDAS (niveau Avancé), permettant de signer des contrats avec pleine valeur probatoire, conformément au Décret-Loi n.º 12/2021."
        : "A Chave Móvel Digital (CMD) é o meio oficial do Estado Português para autenticação e assinatura eletrónica de documentos. Está em total conformidade com o Regulamento Europeu eIDAS (nível Avançado), permitindo assinar contratos com força probatória plena, conforme o Decreto-Lei n.º 12/2021.",
      source: "Decreto-Lei n.º 12/2021 e Regulamento eIDAS (UE) n.º 910/2014"
    };
  }

  if (lowercase.includes('oliveira') || lowercase.includes('cameiro') || lowercase.includes('lawyer') || lowercase.includes('avocat') || lowercase.includes('advogado')) {
    return {
      response: isFR
        ? "Le cabinet Oliveira & Cameiro Advogados Associados, basé à Porto, est le partenaire légal exclusif d'EasyLaw. Ses avocats supervisent et valident les bases de connaissances de notre IA et assurent la prestation de conseils juridiques personnalisés dans les cas complexes escaladés via notre plateforme."
        : "O gabinete Oliveira & Cameiro Advogados Associados, com sede no Porto, é o parceiro legal exclusivo da EasyLaw. Os seus advogados supervisionam e validam as bases de conhecimento da nossa IA e assumem a prestação de assessoria jurídica personalizada em casos complexos escalados através da nossa plataforma.",
      source: "Estatuto da Ordem dos Advogados (Lei n.º 145/2015) & EasyLaw Partner Agreement"
    };
  }

  if (lowercase.includes('visto') || lowercase.includes('visa') || lowercase.includes('sef') || lowercase.includes('residência')) {
    return {
      response: isFR
        ? "Le Portugal propose plusieurs types de visas et titres de séjour, notamment le Visa D7 (pour les retraités et titulaires de revenus propres), le Visa D8 (nomades numériques) et des visas de travail/entrepreneuriat. La transition des dossiers se fait avec la collaboration de notre cabinet partenaire pour assurer la conformité auprès de l'AIMA (ancien SEF)."
        : "Portugal disponibiliza vários tipos de vistos e autorizações de residência, incluindo o Visto D7 (para reformados e titulares de rendimentos próprios), o Visto D8 (nómadas digitais) e vistos de trabalho/empreendedorismo. A transição dos processos é feita com a colaboração do nosso gabinete jurídico parceiro para assegurar a conformidade perante a AIMA (antigo SEF).",
      source: "Lei n.º 23/2007 (Lei de Estrangeiros) de Portugal"
    };
  }

  if (lowercase.includes('empresa') || lowercase.includes('société') || lowercase.includes('lda') || lowercase.includes('unipessoal')) {
    return {
      response: isFR
        ? "La constitution de sociétés commerciales au Portugal (Lda., Unipessoal Lda. ou S.A.) est régie par le Code des Sociétés Commerciales. La procédure peut s'effectuer en ligne via le service « Empresa na Hora », nécessitant l'approbation de la dénomination sociale et le dépôt du capital social initial."
        : "A constituição de sociedades comerciais em Portugal (seja Lda., Unipessoal Lda. ou S.A.) é regida pelo Código das Sociedades Comerciais. O processo pode ser realizado online através do serviço 'Empresa na Hora', requerendo a aprovação da firma (admissibilidade de nome) e o depósito do capital social inicial.",
      source: "Código das Sociedades Comerciais (Decreto-Lei n.º 262/86)"
    };
  }

  return {
    response: isFR
      ? "En tant qu'assistant juridique Luso-Legal d'EasyLaw, je peux vous informer que les matières juridiques au Portugal sont soumises au droit national portugais et aux directives/règlements de l'Union Européenne. Pour obtenir des réponses précises sur votre situation spécifique (bail, NIF ou contrats), vous pouvez utiliser nos outils de génération ou demander une escalade directe vers un avocat du cabinet Oliveira & Cameiro."
      : "Como assistente virtual Luso-Legal da EasyLaw, posso esclarecer que as matérias jurídicas em Portugal estão sujeitas ao direito nacional português e às diretivas/regulamentos da União Europeia. Para obter respostas precisas sobre o seu caso específico de arrendamento, NIF ou contratos, pode utilizar as nossas ferramentas de geração ou solicitar a escalada direta para um advogado do gabinete Oliveira & Cameiro.",
    source: "EasyLaw Luso-Legal Knowledge Base (Direito Português e Comunitário)"
  };
}

// POST /api/assistant/chat
app.post('/api/assistant/chat', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, lang = 'PT' } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const userId = (req as any).user.id;
    const inScope = isQueryInScope(message);

    if (!inScope) {
      const outOfScopeMsg = lang === 'FR'
        ? "Je ne peux répondre qu'aux questions relatives au droit portugais, européen ou à des sujets juridiques généraux. Votre demande semble hors périmètre. Comment puis-je vous aider concernant la législation portugaise aujourd'hui ?"
        : "Só posso responder a questões relacionadas com o direito português, europeu ou temas jurídicos gerais. O seu pedido parece estar fora do âmbito. Como posso ajudá-lo com a legislação portuguesa hoje?";
      res.status(200).json({
        success: true,
        inScope: false,
        response: outOfScopeMsg,
        source: 'Scope Guardrail'
      });
      return;
    }

    // Fetch recent conversation history for context (last 6 messages)
    const recentMessages = await all<{ role: string; content: string }>(
      'SELECT role, content FROM assistant_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 6',
      [userId]
    );
    const history = recentMessages.length > 0
      ? recentMessages.reverse().map(m => `${m.role === 'user' ? 'Utilisateur' : 'Luso-Legal'}: ${m.content}`).join('\n') + '\n\n'
      : '';

    // Call configurable LLM prompt (editable in admin panel)
    let response: string;
    let source = 'Luso-Legal AI';
    try {
      response = await callPrompt('assistant_system', { message, lang, history });
    } catch (llmError) {
      console.error('Assistant LLM call failed:', llmError);
      response = lang === 'FR'
        ? "Je rencontre une difficulté technique. Veuillez réessayer dans quelques instants ou escalader vers un avocat si votre question est urgente."
        : "Estou com uma dificuldade técnica. Por favor, tente novamente em alguns instantes ou escale para um advogado se a sua questão for urgente.";
      source = 'Fallback';
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
app.get('/api/admin/settings', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await all<{ key: string; value: string }>('SELECT * FROM system_settings');
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/settings
app.put('/api/admin/settings', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) {
      res.status(400).json({ success: false, message: 'Settings array is required' });
      return;
    }

    for (const item of settings) {
      await run('INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value', [item.key, item.value]);
    }

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/clauses
app.get('/api/admin/clauses', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const clauses = await all('SELECT * FROM clause_versions');
    res.status(200).json({ success: true, clauses });
  } catch (error) {
    console.error('Error fetching clauses:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/clauses
app.post('/api/admin/clauses', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
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
app.put('/api/admin/clauses/:id', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
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
app.delete('/api/admin/clauses/:id', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
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
app.get('/api/admin/users', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await all('SELECT id, email, name, role, lang, created_at FROM users WHERE deleted_at IS NULL');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/role
app.put('/api/admin/users/:id/role', authMiddleware, checkRole(ROLE_MANAGER_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !ALL_ROLES.includes(role as UserRole)) {
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

// GET /api/admin/stats
app.get('/api/admin/stats', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || '30d';

    let cutoff: string | null = null;
    if (period === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      cutoff = d.toISOString();
    } else if (period === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      cutoff = d.toISOString();
    } else if (period === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      cutoff = d.toISOString();
    }
    // 'all' => cutoff stays null

    const whereDate = (col: string) => cutoff ? `AND ${col} >= '${cutoff}'` : '';

    // Users
    const [totalUsersRow, newUsersRow, verifiedRow] = await Promise.all([
      get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'),
      get<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL ${whereDate('created_at')}`),
      get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND is_verified = 1'),
    ]);
    const roleRows = await all<{ role: string; count: number }>(
      'SELECT role, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY role'
    );
    const byRole: Record<string, number> = {};
    roleRows.forEach((r) => { byRole[r.role] = r.count; });

    // NIF
    const nifTotal = await get<{ count: number }>('SELECT COUNT(*) as count FROM dossiers_nif');
    const nifNew = await get<{ count: number }>(`SELECT COUNT(*) as count FROM dossiers_nif WHERE 1=1 ${whereDate('created_at')}`);
    const nifStatusRows = await all<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM dossiers_nif GROUP BY status'
    );
    const nifByStatus: Record<string, number> = {};
    nifStatusRows.forEach((r) => { nifByStatus[r.status] = r.count; });
    const nifObtenu = nifByStatus['NIF obtenu'] || 0;
    const nifTotalCount = nifTotal?.count || 0;
    const conversionRate = nifTotalCount > 0 ? Math.round((nifObtenu / nifTotalCount) * 100) : 0;

    // Payments / Revenue
    const paidRows = await all<{ amount: number; product: string }>(
      `SELECT amount, product FROM payments WHERE status = 'paid' ${whereDate('created_at')}`
    );
    const pendingCount = await get<{ count: number }>(
      `SELECT COUNT(*) as count FROM payments WHERE status = 'pending' ${whereDate('created_at')}`
    );
    const totalRevenue = paidRows.reduce((s, r) => s + (r.amount || 0), 0);
    const byProduct: Record<string, number> = {};
    paidRows.forEach((r) => {
      const k = r.product || 'other';
      byProduct[k] = (byProduct[k] || 0) + (r.amount || 0);
    });

    // Contracts
    const contractTotal = await get<{ count: number }>('SELECT COUNT(*) as count FROM contracts');
    const contractNew = await get<{ count: number }>(`SELECT COUNT(*) as count FROM contracts WHERE 1=1 ${whereDate('created_at')}`);
    const contractTypeRows = await all<{ type: string; count: number }>(
      'SELECT type, COUNT(*) as count FROM contracts GROUP BY type'
    );
    const byType: Record<string, number> = {};
    contractTypeRows.forEach((r) => { byType[r.type] = r.count; });

    // Assistant
    const msgTotal = await get<{ count: number }>(`SELECT COUNT(*) as count FROM assistant_messages WHERE 1=1 ${whereDate('created_at')}`);
    const escalRows = await all<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM lawyer_escalations GROUP BY status'
    );
    const escalByStatus: Record<string, number> = {};
    escalRows.forEach((r) => { escalByStatus[r.status] = r.count; });

    // Compliance
    const orangeDaySetting = await get<{ value: string }>(`SELECT value FROM system_settings WHERE key = 'compliance_orange_days'`);
    const redDaySetting = await get<{ value: string }>(`SELECT value FROM system_settings WHERE key = 'compliance_red_days'`);
    const orangeDays = parseInt(orangeDaySetting?.value || '90', 10);
    const redDays = parseInt(redDaySetting?.value || '30', 10);
    const now = new Date();
    const complianceItems = await all<{ due_date: string; status: string }>('SELECT due_date, status FROM compliance_items');
    let complianceGreen = 0, complianceOrange = 0, complianceRed = 0;
    complianceItems.forEach((item) => {
      if (item.status === 'completed') { complianceGreen++; return; }
      const daysLeft = Math.ceil((new Date(item.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= redDays) complianceRed++;
      else if (daysLeft <= orangeDays) complianceOrange++;
      else complianceGreen++;
    });

    // Vault
    const vaultTotal = await get<{ count: number }>(`SELECT COUNT(*) as count FROM vault_documents WHERE status != 'deleted'`);
    const vaultSize = await get<{ total: number }>(`SELECT COALESCE(SUM(size_bytes), 0) as total FROM vault_documents WHERE status != 'deleted'`);

    // Recent audit actions (last 10)
    interface AuditRow { action: string; entity_type: string; ip_addr: string; timestamp: string; email: string | null }
    const recentActions = await all<AuditRow>(
      `SELECT a.action, a.entity_type, a.ip_addr, a.timestamp, u.email
       FROM audit_log a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.timestamp DESC
       LIMIT 10`
    );

    res.status(200).json({
      success: true,
      period,
      users: {
        total: totalUsersRow?.count || 0,
        new: newUsersRow?.count || 0,
        verified: verifiedRow?.count || 0,
        byRole,
      },
      nif: {
        total: nifTotalCount,
        new: nifNew?.count || 0,
        byStatus: nifByStatus,
        conversionRate,
      },
      payments: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        paidCount: paidRows.length,
        pendingCount: pendingCount?.count || 0,
        byProduct,
      },
      contracts: {
        total: contractTotal?.count || 0,
        new: contractNew?.count || 0,
        byType,
      },
      assistant: {
        totalMessages: msgTotal?.count || 0,
        escalations: {
          pending: escalByStatus['pending'] || 0,
          assigned: escalByStatus['assigned'] || 0,
          closed: escalByStatus['closed'] || 0,
        },
      },
      compliance: {
        green: complianceGreen,
        orange: complianceOrange,
        red: complianceRed,
        total: complianceItems.length,
      },
      vault: {
        totalDocuments: vaultTotal?.count || 0,
        totalSizeBytes: vaultSize?.total || 0,
      },
      recentActions: recentActions.map((a) => ({
        action: a.action,
        entity_type: a.entity_type,
        ip_addr: a.ip_addr,
        timestamp: a.timestamp,
        user_email: a.email || 'Système',
      })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── Epic 9: Module B — Recherche Juridique IA ────────────────────────────────

const RESEARCH_ROLES = RESEARCH_ROLES_LIST;

// POST /api/research/query — SSE streaming, standard mode
app.post('/api/research/query', authMiddleware, checkRole(RESEARCH_ROLES), async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;
  if (!query?.trim()) {
    res.status(400).json({ success: false, message: 'query is required' });
    return;
  }
  const userId = (req as any).user.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const results = await standardSearch(query);
    await streamResearch(query, results, res, 'standard', userId);
  } catch (err: any) {
    res.write('data: ' + JSON.stringify({ type: 'error', message: err?.message ?? 'Internal error' }) + '\n\n');
  }
  res.end();
});

// POST /api/research/deepdive — SSE streaming, DeepDive mode
app.post('/api/research/deepdive', authMiddleware, checkRole(RESEARCH_ROLES), async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;
  if (!query?.trim()) {
    res.status(400).json({ success: false, message: 'query is required' });
    return;
  }
  const userId = (req as any).user.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    res.write('data: ' + JSON.stringify({ type: 'progress', step: 'expanding', pct: 10, label: 'Expansion des requêtes…' }) + '\n\n');
    const { results, subQueries } = await deepDiveSearch(query);
    res.write('data: ' + JSON.stringify({ type: 'progress', step: 'retrieved', pct: 50, label: 'Sources récupérées — synthèse en cours…', subQueries }) + '\n\n');
    await streamResearch(query, results, res, 'deepdive', userId, subQueries);
  } catch (err: any) {
    res.write('data: ' + JSON.stringify({ type: 'error', message: err?.message ?? 'Internal error' }) + '\n\n');
  }
  res.end();
});

// GET /api/research/history
app.get('/api/research/history', authMiddleware, checkRole(RESEARCH_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const searches = await all<{ id: string; query: string; mode: string; summary: string | null; created_at: string }>(
      'SELECT id, query, mode, summary, created_at FROM research_searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId],
    );
    res.json({ success: true, searches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/research/:id
app.get('/api/research/:id', authMiddleware, checkRole(RESEARCH_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const row = await get<any>('SELECT * FROM research_searches WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (!row) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const sources = row.sources_json ? JSON.parse(row.sources_json) : [];
    res.json({ success: true, search: { ...row, sources } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/research/:id/export — generate PDF and store in vault
app.post('/api/research/:id/export', authMiddleware, checkRole(RESEARCH_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRow = await get<{ name: string | null; email: string }>('SELECT name, email FROM users WHERE id = ?', [userId]);
    const searchRow = await get<any>('SELECT * FROM research_searches WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (!searchRow) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (searchRow.pdf_vault_id) {
      res.json({ success: true, vaultId: searchRow.pdf_vault_id, message: 'PDF already generated' });
      return;
    }
    const pdfBuffer = await generateResearchPdf(searchRow, userRow ?? { name: null, email: '' });
    const searchId = req.params.id as string;
    const vaultId = await storeResearchPdf(pdfBuffer, userId, searchId);
    await run('UPDATE research_searches SET pdf_vault_id = ? WHERE id = ?', [vaultId, searchId]);
    await logAudit(userId, 'EXPORT_RESEARCH_PDF', 'research_search', searchId, req);
    res.json({ success: true, vaultId, message: 'PDF generated and stored in vault' });
  } catch (err: any) {
    console.error('Error exporting research PDF:', err);
    res.status(500).json({ success: false, message: err?.message ?? 'Internal server error' });
  }
});

// ─── Admin: LLM Prompts ───────────────────────────────────────────────────────

// GET /api/admin/llm-prompts
app.get('/api/admin/llm-prompts', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const prompts = await all('SELECT * FROM llm_prompts ORDER BY key');
    res.json({ success: true, prompts, providerModels: PROVIDER_MODELS });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/llm-prompts/:id
app.put('/api/admin/llm-prompts/:id', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { system_prompt, user_prompt_template, provider, model, max_tokens, temperature, name, description } = req.body;
    if (!system_prompt?.trim()) { res.status(400).json({ success: false, message: 'system_prompt is required' }); return; }
    const validProviders: LLMProvider[] = ['anthropic', 'openai', 'mistral', 'google'];
    if (provider && !validProviders.includes(provider)) { res.status(400).json({ success: false, message: 'Invalid provider' }); return; }

    const existing = await get<{ key: string }>('SELECT key FROM llm_prompts WHERE id = ?', [req.params.id]);
    if (!existing) { res.status(404).json({ success: false, message: 'Prompt not found' }); return; }

    await run(
      `UPDATE llm_prompts SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        system_prompt = ?,
        user_prompt_template = ?,
        provider = COALESCE(?, provider),
        model = COALESCE(?, model),
        max_tokens = COALESCE(?, max_tokens),
        temperature = COALESCE(?, temperature),
        updated_at = ?,
        updated_by = ?
       WHERE id = ?`,
      [name, description, system_prompt, user_prompt_template ?? null, provider, model,
       max_tokens ?? null, temperature ?? null, new Date().toISOString(), userId, req.params.id],
    );
    invalidatePromptCache(existing.key);
    res.json({ success: true, message: 'Prompt updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/llm-prompts/:id/test — test a prompt with sample variables
app.post('/api/admin/llm-prompts/:id/test', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const row = await get<{ key: string }>('SELECT key FROM llm_prompts WHERE id = ?', [req.params.id]);
    if (!row) { res.status(404).json({ success: false, message: 'Prompt not found' }); return; }
    const variables: Record<string, string> = req.body.variables ?? {};
    const { callPrompt: call } = await import('./rag-llm-router');
    const result = await call(row.key, variables);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? 'Internal server error' });
  }
});

// ─── Admin: Indexing Management ───────────────────────────────────────────────

// GET /api/admin/indexing/status
app.get('/api/admin/indexing/status', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  try {
    const runs = await all('SELECT * FROM indexing_runs ORDER BY started_at DESC LIMIT 20');
    const docCounts = await all<{ source: string; count: number }>(
      'SELECT source, COUNT(*) as count FROM legal_documents GROUP BY source',
    );
    res.json({ success: true, runs, docCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/indexing/trigger
app.post('/api/admin/indexing/trigger', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  const { source } = req.body;
  runIncrementalIndex(source).catch((err) =>
    console.error('[MANUAL TRIGGER] Indexing error:', err?.message),
  );
  res.json({ success: true, message: `Indexing triggered for ${source ?? 'ALL'} sources` });
});

// ─── Admin: Documents privés du cabinet (RAG) ──────────────────────────────

const _privateRagMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
}).array('files', 20);

// POST /api/admin/rag/private/upload
app.post('/api/admin/rag/private/upload', authMiddleware, checkRole(ADMIN_ROLES), (req, res, next) => {
  _privateRagMulter(req, res, next);
}, async (req: Request, res: Response): Promise<void> => {
  try {
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
      return;
    }
    const userId = (req as any).user.id;
    const results: Record<string, unknown>[] = [];

    for (const file of files) {
      let text = '';
      try {
        if (file.mimetype === 'application/pdf') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
          const data = await pdfParse(file.buffer);
          text = data.text ?? '';
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          text = result.value ?? '';
        } else {
          text = file.buffer.toString('utf-8');
        }
      } catch (extractErr: any) {
        console.error(`[PRIVATE RAG] Extraction failed for ${file.originalname}:`, extractErr?.message);
        results.push({ name: file.originalname, success: false, error: 'Extraction du texte impossible' });
        continue;
      }

      const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
      if (wordCount < 50) {
        results.push({ name: file.originalname, success: false, error: `Contenu trop court (${wordCount} mots, minimum 50)` });
        continue;
      }

      const vaultResult = await putDocument({
        buffer: file.buffer,
        mime_type: file.mimetype,
        entity_type: 'other',
        entity_id: null,
        user_id: userId,
      });

      const docId = crypto.randomUUID();
      const rawName = file.originalname.replace(/\.[^.]+$/, '');
      const title = rawName.replace(/[-_]/g, ' ');
      const docType = req.body?.[`doctype_${file.originalname}`] ?? 'private';

      await run(
        `INSERT INTO rag_private_documents
           (id, user_id, vault_id, title, doc_type, original_filename, mime_type, extracted_text, word_count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [docId, userId, vaultResult.id, title, docType, file.originalname, file.mimetype, text, wordCount],
      );

      await logAudit(userId, 'UPLOAD_PRIVATE_RAG', 'rag_private_document', docId, req);
      results.push({ id: docId, name: file.originalname, success: true, wordCount, title });
    }

    res.json({ success: true, results });
  } catch (err: any) {
    console.error('[PRIVATE RAG] Upload error:', err?.message);
    res.status(500).json({ success: false, message: err?.message ?? 'Internal server error' });
  }
});

// GET /api/admin/rag/private/documents
app.get('/api/admin/rag/private/documents', authMiddleware, checkRole(ADMIN_ROLES), async (_req: Request, res: Response): Promise<void> => {
  try {
    const docs = await all(
      `SELECT id, user_id, title, doc_type, original_filename, word_count, mime_type, status, error_message, indexed_at, created_at
       FROM rag_private_documents WHERE status != 'deleted' ORDER BY created_at DESC`,
    );
    res.json({ success: true, documents: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? 'Internal server error' });
  }
});

// POST /api/admin/rag/private/:id/index
app.post('/api/admin/rag/private/:id/index', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const doc = await get<any>('SELECT * FROM rag_private_documents WHERE id = ? AND status != ?', [id, 'deleted']);
    if (!doc) { res.status(404).json({ success: false, message: 'Document introuvable' }); return; }

    await run('UPDATE rag_private_documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['indexing', id]);

    const { chunkText } = await import('./rag-crawler');
    const { embedDocuments, upsertToQdrant } = await import('./rag-embeddings');
    const externalId = `PRIVATE::${id}`;

    (async () => {
      try {
        const chunks = chunkText(doc.extracted_text);
        if (!chunks.length) throw new Error('Texte vide après découpage');

        const vectors = await embedDocuments(chunks);
        const points = chunks.map((chunk: string, i: number) => ({
          id: crypto.randomUUID(),
          vector: vectors[i],
          payload: { source: 'PRIVATE', external_id: externalId, title: doc.title, url: `private://${id}`, date: doc.created_at?.slice(0, 10) ?? null, doc_type: doc.doc_type },
        }));

        await upsertToQdrant('legal_pt', points);

        await run('DELETE FROM legal_documents WHERE source = ? AND external_id = ?', ['PRIVATE', externalId]);
        for (let i = 0; i < points.length; i++) {
          await run(
            `INSERT INTO legal_documents (id, source, external_id, title, url, content_chunk, chunk_index, qdrant_id, date, doc_type)
             VALUES (?, 'PRIVATE', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), externalId, doc.title, `private://${id}`, chunks[i], i, points[i].id, doc.created_at?.slice(0, 10) ?? null, doc.doc_type],
          );
        }

        await run(
          `UPDATE rag_private_documents SET status = 'indexed', indexed_at = CURRENT_TIMESTAMP, error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [id],
        );
        console.log(`[PRIVATE RAG] Indexed "${doc.title}" — ${chunks.length} chunks`);
      } catch (err: any) {
        await run(
          `UPDATE rag_private_documents SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [err?.message ?? 'Indexation échouée', id],
        );
        console.error(`[PRIVATE RAG] Index error for ${id}:`, err?.message);
      }
    })();

    res.json({ success: true, message: 'Indexation lancée en arrière-plan' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? 'Internal server error' });
  }
});

// DELETE /api/admin/rag/private/:id
app.delete('/api/admin/rag/private/:id', authMiddleware, checkRole(ADMIN_ROLES), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const doc = await get<any>('SELECT * FROM rag_private_documents WHERE id = ? AND status != ?', [id, 'deleted']);
    if (!doc) { res.status(404).json({ success: false, message: 'Document introuvable' }); return; }

    if (doc.status === 'indexed') {
      const externalId = `PRIVATE::${id}`;
      try {
        await deleteFromQdrantByFilter('legal_pt', 'PRIVATE', externalId);
        await run('DELETE FROM legal_documents WHERE source = ? AND external_id = ?', ['PRIVATE', externalId]);
      } catch (qErr: any) {
        console.warn('[PRIVATE RAG] Qdrant cleanup warning:', qErr?.message);
      }
    }

    await run('UPDATE rag_private_documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['deleted', id]);
    await logAudit((req as any).user.id, 'DELETE_PRIVATE_RAG', 'rag_private_document', id, req);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? 'Internal server error' });
  }
});

// GET /api/admin/rag/private/checklist.pdf — formulaire de demande de documents au cabinet
app.get('/api/admin/rag/private/checklist.pdf', authMiddleware, checkRole(ADMIN_ROLES), async (_req: Request, res: Response): Promise<void> => {
  try {
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="checklist-documents-cabinet.pdf"');
    doc.pipe(res);

    const brand = '#1A4B8C';
    const gray = '#555';
    const light = '#888';

    doc.fontSize(20).fillColor(brand).text('EasyLaw — Checklist Documents Cabinet', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(light).text('À remettre au cabinet afin d\'enrichir la base de connaissances IA', { align: 'center' });
    doc.moveDown(1.2);

    const section = (title: string) => {
      doc.fontSize(12).fillColor(brand).text(title);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(brand).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    };

    const item = (label: string, detail: string) => {
      doc.fontSize(10).fillColor(gray).text(`☐  ${label}`, { continued: false });
      doc.fontSize(8).fillColor(light).text(`    ${detail}`);
      doc.moveDown(0.3);
    };

    section('1. Base de connaissances interne');
    item('Consultations / avis juridiques (anonymisés)', 'Format PDF ou Word — remplacer noms et NIF par [CLIENT] / [NIF]');
    item('FAQ internes par domaine de pratique', 'Questions fréquentes des clients avec réponses validées par le cabinet');
    item('Fiches pratiques par type de contrat', 'Clauses essentielles, pièges courants, pratiques du marché portugais');
    item('Checklists diligence raisonnable', 'Acquisition immobilière, constitution de société, bail commercial, etc.');

    doc.moveDown(0.5);
    section('2. Modèles de contrats annotés');
    item('Bail d\'habitation / bail commercial', 'Version annotée avec explications des clauses clés');
    item('Contrat de travail (CDI / CDD)', 'Modèles conformes au Código do Trabalho + CCT applicables');
    item('Contrat de prestation de services', 'Pour avocats, consultants, freelances — distinction salarié/indépendant');
    item('Statuts de société (Lda / SA)', 'Modèles usuels avec pacte d\'associés type');
    item('Clauses alternatives', 'Variations locataire/bailleur, employé/employeur selon profil client');

    doc.moveDown(0.5);
    section('3. Jurisprudence commentée');
    item('Arrêts clés avec commentaires du cabinet', 'STJ, STA, Tribunais da Relação — jurisprudence annotée');
    item('Veille jurisprudentielle passée', 'Bulletins ou synthèses sur les évolutions dans vos domaines');
    item('Positions doctrinales retenues par le cabinet', 'Références bibliographiques avec résumé de la position adoptée');

    doc.moveDown(0.5);
    section('4. Procédures et délais');
    item('Calendriers procéduraux par type de contentieux', 'Délais légaux, délais pratiques, points de vigilance');
    item('Guides de procédure internes', 'Tribunal, CAAD, arbitrage — étapes et formulaires types');
    item('Tarifs judiciaires actualisés', 'Taxa de justiça, honorários, emolumentos notariais');

    doc.moveDown(0.5);
    section('5. Domaines spécialisés (selon pratique du cabinet)');
    item('Droit fiscal — circulaires AT commentées', 'Positions CIRS/IRC, TVA, IRS — interprétations retenues');
    item('Droit du travail — CCT sectoriels', 'Conventions collectives applicables aux clients du cabinet');
    item('Droit immobilier — NRAU commenté', 'Règles de copropriété, licences d\'urbanisme, reabilitação urbana');
    item('Droit des sociétés — gouvernance', 'Pactes d\'associés, modèles d\'AG, conventions de vote');
    item('Compliance & RGPD', 'Politiques internes, modèles de consentement, registres de traitement');

    doc.moveDown(1);
    doc.fontSize(9).fillColor(light).text(
      'Instructions de livraison : nommer les fichiers avec un préfixe de domaine (ex: imobiliario_checklist_compra.pdf), '
      + 'dater chaque document et indiquer la date de dernière révision. '
      + 'Anonymiser toutes les données clients avant transmission.',
      { align: 'left' }
    );

    doc.end();
  } catch (err: any) {
    console.error('[CHECKLIST PDF] Error:', err?.message);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Génération PDF échouée' });
  }
});

// ─── Agents juridiques multi-agents ──────────────────────────────────────────
app.use('/api/agents', createAgentsRouter(authMiddleware, checkRole));

// ─── KYC / eIDV — vérification d'identité NIF (Lei 83/2017) ──────────────────
app.use('/api/nif/kyc', createKycRouter());

// ─── Formulaire de contact public ─────────────────────────────────────────────
app.use('/api/contact', createContactRouter(authMiddleware, checkRole, ADMIN_ROLES));

// ─── Epic 8: Extended Contract Templates ─────────────────────────────────────
const epic8Router = createEpic8Router(authMiddleware, checkRole, logAudit);
app.use('/api/contracts', epic8Router);

// ─── Epic 10: Document Analysis ───────────────────────────────────────────────
const epic10Router = createEpic10Router(authMiddleware, checkRole, putDocument, null, logAudit);
app.use('/api/analysis', epic10Router);

// ─── Epic 11: Document Generation & Collaboration ────────────────────────────
const epic11Router = createEpic11Router(authMiddleware, checkRole, putDocument, logAudit, io);
app.use('/api/documents', epic11Router);
setupCollaborationSocket(io, (token: string) => jwt.verify(token, process.env.JWT_SECRET ?? 'easylaw-secret') as any);

// ─── Epic 12: GED Cabinet ─────────────────────────────────────────────────────
const epic12Router = createEpic12Router(authMiddleware, checkRole, putDocument, logAudit);
app.use('/api/ged', epic12Router);

// ─── Epic 13: Partner REST API + OAuth2 ──────────────────────────────────────
const { oauthRouter, v1Router } = createEpic13Router(authMiddleware, checkRole);
app.use('/api/oauth', oauthRouter);
app.use('/api/v1', v1Router);

// Swagger UI
const openApiSpec = buildOpenAPISpec(process.env.API_BASE_URL ?? 'http://localhost:3000');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api/docs/openapi.json', (_req: Request, res: Response) => res.json(openApiSpec));

// Health check endpoint for Railway
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Initializing Server if run directly
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  // Story 6-3 / AC-7: refuse to start in production if R2 + KEK config is incomplete.
  try {
    assertVaultConfig();
  } catch (cfgErr: any) {
    console.error('[AUTH SERVICE] Vault config invalid:', cfgErr?.message || cfgErr);
    process.exit(1);
  }
  initDb()
    .then(() => {
      httpServer.listen(PORT, () => {
        console.log(`[AUTH SERVICE] Server is running on port ${PORT}`);
      });
      // Epic 9: init Qdrant collections (non-fatal if Qdrant not available)
      ensureCollections().catch((err) =>
        console.warn('[RAG] Qdrant collection init skipped:', err?.message),
      );
      // Epic 9: daily incremental index at 04:00 Lisbon time
      cron.schedule(
        '0 4 * * *',
        () => {
          console.log('[CRON] Starting daily legal source index');
          runIncrementalIndex().catch((err) =>
            console.error('[CRON] Daily index failed:', err?.message),
          );
        },
        { timezone: 'Europe/Lisbon' },
      );
      console.log('[CRON] Daily legal index scheduled at 04:00 Europe/Lisbon');
    })
    .catch((err) => {
      console.error('Failed to start server due to database initialization failure:', err);
      process.exit(1);
    });
}

export default app;
export { initDb };

