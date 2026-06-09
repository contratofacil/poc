/**
 * High-level vault facade — Story 6-3 / AC-1, AC-2, AC-3, AC-4.
 *
 * Orchestrates:
 *  - R2 client (storage/r2-client.ts)
 *  - envelope encryption (storage/envelope.ts)
 *  - vault_documents DB rows (services/auth/db.ts)
 *
 * Drivers:
 *  - 'r2'    : Cloudflare R2 + envelope encryption. Production target.
 *  - 'local' : in-memory map. POC fallback when R2 creds are absent.
 *
 * The driver is selected at module load via `VAULT_DRIVER` env (defaults to
 * 'r2' in production, 'local' otherwise). Tests override it freely.
 */
import crypto from 'crypto';
import {
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { getR2Client, getR2Bucket } from './r2-client';
import { encryptFile, decryptFile } from './envelope';
import { run, get } from '../db';

export type VaultDriver = 'r2' | 'local';

export type EntityType = 'contract' | 'nif_piece' | 'other';
export type VaultStatus = 'pending' | 'ready' | 'failed' | 'deleted';

export interface VaultDocumentRow {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string | null;
  r2_key: string;
  mime_type: string;
  size_bytes: number | null;
  sha256: string | null;
  encrypted_dek: string;
  status: VaultStatus;
  created_at: string;
  updated_at: string | null;
}

export interface PutDocumentInput {
  buffer: Buffer;
  mime_type: string;
  entity_type: EntityType;
  entity_id?: string | null;
  user_id: string;
  /** Optional id; generated if absent. */
  id?: string;
  /** Optional r2_key; generated if absent. */
  r2_key?: string;
}

export interface PutDocumentResult {
  id: string;
  r2_key: string;
  sha256: string;
  size_bytes: number;
}

// ---------------------------------------------------------------------------
// In-memory store for local/test driver
// ---------------------------------------------------------------------------
const localStore: Map<string, Buffer> = new Map();

function currentDriver(): VaultDriver {
  const envDriver = process.env.VAULT_DRIVER;
  if (envDriver === 'r2' || envDriver === 'local') return envDriver;
  return process.env.NODE_ENV === 'production' ? 'r2' : 'local';
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildR2Key(entityType: EntityType, userId: string, id: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/'); // 2026/06/09
  const prefix = entityType === 'contract' ? 'contracts' : entityType === 'nif_piece' ? 'nif' : 'misc';
  return `${prefix}/${userId}/${date}/${id}.bin.enc`;
}

async function bufferFromBody(body: any): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body && typeof body.transformToByteArray === 'function') {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body as any) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  if (typeof body === 'string') return Buffer.from(body);
  throw new Error('Unsupported R2 GetObject body type');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store a buffer in the vault: encrypt it, push to R2 (or memory), persist a
 * vault_documents row with status='ready'.
 */
export async function putDocument(input: PutDocumentInput): Promise<PutDocumentResult> {
  const id = input.id || crypto.randomUUID();
  const r2_key = input.r2_key || buildR2Key(input.entity_type, input.user_id, id);
  const sha256 = crypto.createHash('sha256').update(input.buffer).digest('hex');
  const driver = currentDriver();

  let cipherToStore: Buffer;
  let encryptedDek: string;

  if (driver === 'r2') {
    const enc = encryptFile(input.buffer);
    cipherToStore = enc.ciphertext;
    encryptedDek = enc.encryptedDek;
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: r2_key,
        Body: cipherToStore,
        ContentType: 'application/octet-stream',
      }),
    );
  } else {
    // local driver: still encrypt if KEK is set (covers POC tests of round-trip)
    if (process.env.VAULT_KEK_B64) {
      const enc = encryptFile(input.buffer);
      cipherToStore = enc.ciphertext;
      encryptedDek = enc.encryptedDek;
    } else {
      cipherToStore = input.buffer;
      encryptedDek = '';
    }
    localStore.set(r2_key, cipherToStore);
  }

  const now = nowIso();
  await run(
    `INSERT INTO vault_documents
       (id, user_id, entity_type, entity_id, r2_key, mime_type, size_bytes,
        sha256, encrypted_dek, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.user_id,
      input.entity_type,
      input.entity_id ?? null,
      r2_key,
      input.mime_type,
      input.buffer.length,
      sha256,
      encryptedDek,
      'ready',
      now,
      now,
    ],
  );

  return { id, r2_key, sha256, size_bytes: input.buffer.length };
}

/**
 * Retrieve and decrypt a document. Returns the plaintext buffer.
 *
 * @throws Error if document not found, not ready, or decryption fails.
 */
export async function getDocumentBuffer(documentId: string): Promise<{
  buffer: Buffer;
  row: VaultDocumentRow;
}> {
  const row = await get<VaultDocumentRow>(
    'SELECT * FROM vault_documents WHERE id = ?',
    [documentId],
  );
  if (!row) throw new Error(`Vault document not found: ${documentId}`);
  if (row.status !== 'ready') {
    throw new Error(`Vault document ${documentId} is not ready (status=${row.status})`);
  }
  return { buffer: await getDocumentByR2Key(row.r2_key, row.encrypted_dek), row };
}

/** Lower-level: fetch + decrypt by R2 key (used when DB row already loaded). */
export async function getDocumentByR2Key(r2_key: string, encryptedDek: string): Promise<Buffer> {
  const driver = currentDriver();
  let cipherBuf: Buffer;
  if (driver === 'r2') {
    const client = getR2Client();
    const out = await client.send(
      new GetObjectCommand({ Bucket: getR2Bucket(), Key: r2_key }),
    );
    cipherBuf = await bufferFromBody(out.Body);
  } else {
    const stored = localStore.get(r2_key);
    if (!stored) throw new Error(`Local vault key not found: ${r2_key}`);
    cipherBuf = stored;
  }
  if (encryptedDek && encryptedDek.length > 0) {
    return decryptFile(cipherBuf, encryptedDek);
  }
  // Local/POC: no encryption was applied (no KEK in env).
  return cipherBuf;
}

/**
 * Generate a presigned PUT URL for direct browser upload to R2. Used by
 * `/api/nif/upload` (AC-3). TTL capped at 600s per security rules.
 *
 * @throws Error in `local` driver (presigning needs R2).
 */
export async function presignPut(
  r2_key: string,
  contentType: string,
  ttlSeconds = 600,
): Promise<string> {
  const ttl = Math.min(Math.max(ttlSeconds, 1), 600);
  const driver = currentDriver();
  if (driver !== 'r2') {
    // Local mode returns a stub URL useable by integration tests that mock the upload step.
    return `local://${r2_key}?ttl=${ttl}&contentType=${encodeURIComponent(contentType)}`;
  }
  const client = getR2Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: r2_key,
      ContentType: contentType,
    }),
    { expiresIn: ttl },
  );
}

/**
 * Confirm an upload completed and was stored at the expected key, then run
 * server-side envelope encryption (overwriting the plaintext blob), and mark
 * the row ready. Used by `/api/nif/upload/complete`.
 *
 * @param documentId DB id created by the prior presignPut call
 * @param sha256Client SHA-256 the client computed on the plaintext, hex
 * @returns updated row
 * @throws Error if R2 HEAD fails, hash mismatch, or any step errors
 */
export async function completeUpload(
  documentId: string,
  sha256Client: string,
): Promise<VaultDocumentRow> {
  const row = await get<VaultDocumentRow>(
    'SELECT * FROM vault_documents WHERE id = ?',
    [documentId],
  );
  if (!row) throw new Error(`Vault document not found: ${documentId}`);
  if (row.status !== 'pending') {
    throw new Error(`Vault document ${documentId} is not pending (status=${row.status})`);
  }
  const driver = currentDriver();

  // 1. Confirm presence + fetch plaintext.
  let plaintext: Buffer;
  if (driver === 'r2') {
    const client = getR2Client();
    await client.send(new HeadObjectCommand({ Bucket: getR2Bucket(), Key: row.r2_key }));
    const out = await client.send(
      new GetObjectCommand({ Bucket: getR2Bucket(), Key: row.r2_key }),
    );
    plaintext = await bufferFromBody(out.Body);
  } else {
    const stored = localStore.get(row.r2_key);
    if (!stored) throw new Error(`Local vault key not found: ${row.r2_key}`);
    plaintext = stored;
  }

  // 2. Verify hash.
  const serverHash = crypto.createHash('sha256').update(plaintext).digest('hex');
  if (serverHash !== sha256Client.toLowerCase()) {
    throw new Error(
      `SHA-256 mismatch: client=${sha256Client.toLowerCase().slice(0, 16)}… server=${serverHash.slice(0, 16)}…`,
    );
  }

  // 3. Encrypt + overwrite blob.
  const { ciphertext, encryptedDek } = encryptFile(plaintext);
  if (driver === 'r2') {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: row.r2_key,
        Body: ciphertext,
        ContentType: 'application/octet-stream',
      }),
    );
  } else {
    localStore.set(row.r2_key, ciphertext);
  }

  // 4. Update row.
  const now = nowIso();
  await run(
    `UPDATE vault_documents
        SET status = ?, size_bytes = ?, sha256 = ?, encrypted_dek = ?, updated_at = ?
      WHERE id = ?`,
    ['ready', plaintext.length, serverHash, encryptedDek, now, documentId],
  );

  return {
    ...row,
    status: 'ready',
    size_bytes: plaintext.length,
    sha256: serverHash,
    encrypted_dek: encryptedDek,
    updated_at: now,
  };
}

/**
 * Create a `vault_documents` row in `status='pending'` and return a presigned
 * PUT URL for the client to upload the plaintext directly to R2.
 */
export async function prepareUpload(input: {
  user_id: string;
  entity_type: EntityType;
  entity_id?: string | null;
  filename: string;
  mime_type: string;
  ttlSeconds?: number;
}): Promise<{ documentId: string; uploadUrl: string; r2_key: string; expiresIn: number }> {
  const documentId = crypto.randomUUID();
  const r2_key = buildR2Key(input.entity_type, input.user_id, documentId);
  const ttl = Math.min(Math.max(input.ttlSeconds ?? 600, 1), 600);
  const now = nowIso();

  await run(
    `INSERT INTO vault_documents
       (id, user_id, entity_type, entity_id, r2_key, mime_type, size_bytes,
        sha256, encrypted_dek, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      documentId,
      input.user_id,
      input.entity_type,
      input.entity_id ?? null,
      r2_key,
      input.mime_type,
      null,
      null,
      '', // empty until /complete
      'pending',
      now,
      now,
    ],
  );

  const uploadUrl = await presignPut(r2_key, input.mime_type, ttl);
  return { documentId, uploadUrl, r2_key, expiresIn: ttl };
}

/** Soft-delete a document (status='deleted'). Keeps row for audit trail. */
export async function deleteDocument(documentId: string): Promise<void> {
  const row = await get<VaultDocumentRow>(
    'SELECT r2_key FROM vault_documents WHERE id = ?',
    [documentId],
  );
  if (!row) return;
  const driver = currentDriver();
  if (driver === 'r2') {
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: row.r2_key }));
  } else {
    localStore.delete(row.r2_key);
  }
  const now = nowIso();
  await run(
    `UPDATE vault_documents SET status = ?, updated_at = ? WHERE id = ?`,
    ['deleted', now, documentId],
  );
}

/** Test-only helper to clear the in-memory store between tests. */
export function _resetLocalStore(): void {
  localStore.clear();
}
