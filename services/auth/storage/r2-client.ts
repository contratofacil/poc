/**
 * Cloudflare R2 client factory — Story 6-3 / AC-1, AC-7.
 *
 * Uses AWS SDK v3 against R2's S3-compatible API.
 *
 * IMPORTANT: data residency is enforced by the EU JURISDICTION ENDPOINT,
 *   https://{ACCOUNT_ID}.eu.r2.cloudflarestorage.com
 * NOT by `LocationConstraint` or `region`. Region is mandatory in the SDK but
 * ignored by R2 — we pass 'auto'.
 *
 * Required env (validated by assertVaultConfig in server boot):
 *  - R2_ACCOUNT_ID
 *  - R2_ACCESS_KEY_ID
 *  - R2_SECRET_ACCESS_KEY
 *  - R2_BUCKET
 *  - R2_ENDPOINT (optional — defaults to EU jurisdiction)
 */
import { S3Client } from '@aws-sdk/client-s3';

let cachedClient: S3Client | null = null;
let cachedBucket: string | null = null;

function defaultEndpoint(accountId: string): string {
  return `https://${accountId}.eu.r2.cloudflarestorage.com`;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
}

/**
 * Resolve R2 config from environment. Throws an Error with the exact missing
 * variable name(s) if anything is absent. Pure: no caching, no side effect.
 */
export function resolveR2Config(): R2Config {
  const missing: string[] = [];
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId) missing.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!bucket) missing.push('R2_BUCKET');
  if (missing.length > 0) {
    throw new Error(`Missing R2 env variables: ${missing.join(', ')}`);
  }
  const endpoint = process.env.R2_ENDPOINT || defaultEndpoint(accountId!);
  if (!endpoint.startsWith('https://')) {
    throw new Error(`R2_ENDPOINT must use HTTPS (got: ${endpoint})`);
  }
  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    endpoint,
  };
}

/**
 * Return a singleton S3Client configured for R2. First call resolves config
 * from env; subsequent calls return the cached instance.
 */
export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const cfg = resolveR2Config();
  cachedClient = new S3Client({
    region: 'auto', // mandatory but ignored by R2
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: false, // R2 supports virtual-host style
  });
  cachedBucket = cfg.bucket;
  return cachedClient;
}

/** Return the configured bucket name (must be called after getR2Client). */
export function getR2Bucket(): string {
  if (!cachedBucket) {
    // Resolve eagerly so the caller doesn't have to call getR2Client first.
    getR2Client();
  }
  return cachedBucket!;
}

/** Test-only: reset cached client/bucket (use between tests that mock env). */
export function _resetR2Cache(): void {
  cachedClient = null;
  cachedBucket = null;
}

/**
 * Boot-time assertion: in production (`NODE_ENV === 'production'`), ALL R2
 * vars + VAULT_KEK_B64 must be present and valid. In dev/test, fall back is
 * allowed (driver = 'local' or 'memory') and this function is a no-op.
 *
 * Called from server.ts at startup.
 */
export function assertVaultConfig(): void {
  const driver = process.env.VAULT_DRIVER || (process.env.NODE_ENV === 'production' ? 'r2' : 'local');
  if (driver === 'r2') {
    // Throws on missing vars or invalid KEK length.
    resolveR2Config();
    const kek = process.env.VAULT_KEK_B64;
    if (!kek) {
      throw new Error('VAULT_KEK_B64 is required when VAULT_DRIVER=r2');
    }
    if (Buffer.from(kek, 'base64').length !== 32) {
      throw new Error('VAULT_KEK_B64 must decode to 32 bytes (AES-256)');
    }
  }
}
