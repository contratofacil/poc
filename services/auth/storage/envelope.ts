/**
 * Envelope encryption module — Story 6-3.
 *
 * Pattern: per-file DEK (Data Encryption Key, AES-256) wrapped by a master KEK
 * (Key Encryption Key, AES-256-GCM) sourced from `VAULT_KEK_B64` env var.
 *
 * Binary blob format (both for file ciphertext AND for the wrapped DEK):
 *   [ IV(12 bytes) | AuthTag(16 bytes) | ciphertext(N bytes) ]
 *
 * The wrapped DEK is stored as base64 in `vault_documents.encrypted_dek`.
 *
 * Security rules (AC-2, Dev Notes §Sécurité):
 *  - IV is generated fresh per encryption via crypto.randomBytes(12).
 *  - DEK is fresh per file via crypto.randomBytes(32).
 *  - KEK is loaded once and validated at module load: 32 bytes after base64 decode.
 *  - On decryption, GCM AuthTag mismatch (tampering) causes a thrown error.
 *  - Plaintexts and keys are never logged.
 */
import crypto from 'crypto';

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

let cachedKek: Buffer | null = null;

/**
 * Resolve the master KEK from the environment.
 * Throws if `VAULT_KEK_B64` is missing or not exactly 32 bytes after decode.
 * Cached after first successful load.
 */
export function getKek(): Buffer {
  if (cachedKek) return cachedKek;
  const b64 = process.env.VAULT_KEK_B64;
  if (!b64) {
    throw new Error('VAULT_KEK_B64 environment variable is required');
  }
  const kek = Buffer.from(b64, 'base64');
  if (kek.length !== KEY_LENGTH) {
    throw new Error(
      `VAULT_KEK_B64 must decode to ${KEY_LENGTH} bytes (got ${kek.length})`,
    );
  }
  cachedKek = kek;
  return kek;
}

/** Test-only helper: reset the cached KEK (e.g. when env changes between tests). */
export function _resetKekCache(): void {
  cachedKek = null;
}

/**
 * Internal: AES-256-GCM encrypt + concatenate [IV | AuthTag | ciphertext].
 */
function gcmEncrypt(key: Buffer, plaintext: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

/**
 * Internal: split [IV | AuthTag | ciphertext] and AES-256-GCM decrypt.
 * Throws if AuthTag mismatch (tampering) or any length is invalid.
 */
function gcmDecrypt(key: Buffer, blob: Buffer): Buffer {
  if (blob.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Encrypted blob is shorter than IV+AuthTag header');
  }
  const iv = blob.subarray(0, IV_LENGTH);
  const authTag = blob.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export interface EncryptedFile {
  /** The on-the-wire blob to upload to R2: [IV|AuthTag|ciphertext]. */
  ciphertext: Buffer;
  /** Base64 of the wrapped DEK ([IV|AuthTag|encryptedDek]) for DB persistence. */
  encryptedDek: string;
}

/**
 * Generate a fresh DEK, encrypt the file with it, and wrap the DEK with the KEK.
 *
 * @param plaintext raw file bytes
 * @returns ciphertext blob + base64 wrapped DEK to persist
 */
export function encryptFile(plaintext: Buffer): EncryptedFile {
  if (!Buffer.isBuffer(plaintext)) {
    throw new TypeError('encryptFile expects a Buffer');
  }
  const kek = getKek();
  const dek = crypto.randomBytes(KEY_LENGTH);
  const ciphertext = gcmEncrypt(dek, plaintext);
  const wrappedDek = gcmEncrypt(kek, dek);
  return {
    ciphertext,
    encryptedDek: wrappedDek.toString('base64'),
  };
}

/**
 * Reverse of encryptFile: unwrap the DEK with the KEK, then decrypt the ciphertext.
 *
 * @param ciphertext blob retrieved from R2: [IV|AuthTag|ciphertext]
 * @param encryptedDek base64 wrapped DEK from `vault_documents.encrypted_dek`
 * @returns original plaintext bytes
 * @throws Error if AuthTag mismatch (tampering), or if encryptedDek is malformed
 */
export function decryptFile(ciphertext: Buffer, encryptedDek: string): Buffer {
  if (!Buffer.isBuffer(ciphertext)) {
    throw new TypeError('decryptFile expects a Buffer for ciphertext');
  }
  if (typeof encryptedDek !== 'string' || encryptedDek.length === 0) {
    throw new TypeError('decryptFile expects a non-empty base64 string for encryptedDek');
  }
  const kek = getKek();
  const wrappedDek = Buffer.from(encryptedDek, 'base64');
  const dek = gcmDecrypt(kek, wrappedDek);
  try {
    return gcmDecrypt(dek, ciphertext);
  } finally {
    // Best-effort: zero out the DEK after use (Node Buffer is not securely erased,
    // but this reduces accidental retention in memory dumps).
    dek.fill(0);
  }
}

/** Generate a random AES-256 KEK as base64 — utility for ops scripts. */
export function generateKekB64(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
