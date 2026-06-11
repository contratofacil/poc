/**
 * Integration tests for Story 6-3 vault endpoints.
 *
 * Exercises the full request → vault → response loop with the in-memory
 * 'local' driver. R2 client is never actually called (driver is local), so no
 * network mocks are needed for these tests. R2-specific behaviour (presigned
 * URL format, S3Client commands) is covered by a separate suite that mocks
 * @aws-sdk/client-s3 via aws-sdk-client-mock.
 */
import request from 'supertest';
import crypto from 'crypto';
import app, { initDb } from '../server';
import { closeDb, run, all, get } from '../db';
import { generateKekB64, _resetKekCache } from './envelope';
import { _resetLocalStore } from './vault';

async function registerUser(email: string, role?: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Password123',
      name: 'Test User',
      cguAccepted: true,
      privacyPolicyAccepted: true,
      lang: 'PT',
    });
  const token: string = res.body.token;
  const userId: string = res.body.user.id;
  if (role) {
    await run(`UPDATE users SET role = ? WHERE id = ?`, [role, userId]);
  }
  return { token, userId };
}

let savedKek: string | undefined;

beforeAll(async () => {
  savedKek = process.env.VAULT_KEK_B64;
  process.env.VAULT_KEK_B64 = generateKekB64();
  process.env.VAULT_DRIVER = 'local';
  _resetKekCache();
  _resetLocalStore();
  await initDb();
});

afterAll(async () => {
  if (savedKek === undefined) delete process.env.VAULT_KEK_B64;
  else process.env.VAULT_KEK_B64 = savedKek;
  _resetKekCache();
  await closeDb();
});

beforeEach(async () => {
  await run('DELETE FROM users');
  await run('DELETE FROM contracts');
  await run('DELETE FROM vault_documents');
  await run('DELETE FROM audit_log');
  _resetLocalStore();
});

// ---------------------------------------------------------------------------
// /api/nif/upload + /complete
// ---------------------------------------------------------------------------
describe('Story 6-3 — /api/nif/upload flow', () => {
  test('prepareUpload returns a presigned URL stub and creates a pending row', async () => {
    const { token, userId } = await registerUser('upload-alpha@example.com');
    const res = await request(app)
      .post('/api/nif/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'passport.pdf', mime_type: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.documentId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.uploadUrl.startsWith('local://')).toBe(true); // local driver returns stub
    expect(res.body.r2_key).toMatch(/^nif\//);

    const row = await get<any>(
      'SELECT * FROM vault_documents WHERE id = ?',
      [res.body.documentId]
    );
    expect(row).toBeDefined();
    expect(row.status).toBe('pending');
    expect(row.user_id).toBe(userId);
    expect(row.entity_type).toBe('nif_piece');

    const audits = await all<any>(
      `SELECT action FROM audit_log WHERE user_id = ? ORDER BY timestamp ASC`,
      [userId]
    );
    expect(audits.some(a => a.action === 'PREPARE_VAULT_UPLOAD')).toBe(true);
  });

  test('complete flow: 500 when nothing was uploaded at the presigned key (missing object)', async () => {
    // We don't have a way to inject plaintext into the local driver from the
    // HTTP layer (R2 PUT is what the client would normally call). So we
    // verify the negative path: calling /complete without a prior upload
    // surfaces a clear server error. The positive round-trip is covered by
    // the vault.putDocument direct test below.
    const { token } = await registerUser('upload-beta@example.com');
    const prepRes = await request(app)
      .post('/api/nif/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'doc.pdf', mime_type: 'application/pdf' });

    const completeRes = await request(app)
      .post('/api/nif/upload/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        documentId: prepRes.body.documentId,
        sha256: crypto.createHash('sha256').update('whatever').digest('hex'),
      });
    expect(completeRes.status).toBe(500);
  });

  test('vault.putDocument round-trip: encrypt → store → fetch → decrypt', async () => {
    // Direct vault-module test of the happy path (positive complement to the
    // HTTP-level negative test above).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vault = require('./vault') as typeof import('./vault');
    const { userId } = await registerUser('round-trip@example.com');
    const plaintext = Buffer.from('confidential — round trip!');
    const stored = await vault.putDocument({
      buffer: plaintext,
      mime_type: 'application/pdf',
      entity_type: 'other',
      entity_id: null,
      user_id: userId,
    });
    expect(stored.size_bytes).toBe(plaintext.length);
    expect(stored.sha256).toBe(crypto.createHash('sha256').update(plaintext).digest('hex'));
    const fetched = await vault.getDocumentBuffer(stored.id);
    expect(fetched.buffer.equals(plaintext)).toBe(true);
    expect(fetched.row.status).toBe('ready');
  });

  test('complete rejects cross-user attempts (403 + audit)', async () => {
    const alice = await registerUser('alice@example.com');
    const eve = await registerUser('eve@example.com');

    const prep = await request(app)
      .post('/api/nif/upload')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ filename: 'alice.pdf' });

    const res = await request(app)
      .post('/api/nif/upload/complete')
      .set('Authorization', `Bearer ${eve.token}`)
      .send({
        documentId: prep.body.documentId,
        sha256: 'a'.repeat(64),
      });
    expect(res.status).toBe(403);

    const audits = await all<any>(
      `SELECT action FROM audit_log WHERE user_id = ? AND action = 'FORBIDDEN_VAULT_ACCESS'`,
      [eve.userId]
    );
    expect(audits.length).toBe(1);
  });

  test('complete rejects malformed sha256 (400)', async () => {
    const { token } = await registerUser('bad-hash@example.com');
    const prep = await request(app)
      .post('/api/nif/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'foo.pdf' });
    const res = await request(app)
      .post('/api/nif/upload/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ documentId: prep.body.documentId, sha256: 'not-hex' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('complete returns 404 for unknown documentId', async () => {
    const { token } = await registerUser('missing-doc@example.com');
    const res = await request(app)
      .post('/api/nif/upload/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        documentId: '00000000-0000-0000-0000-000000000000',
        sha256: 'a'.repeat(64),
      });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// /api/contracts/generate → vault round-trip
// ---------------------------------------------------------------------------
describe('Story 6-3 — contract → vault round-trip', () => {
  test('generate populates contracts.r2_key and /vault/:filename streams decrypted PDF', async () => {
    const { token } = await registerUser('contract-rt@example.com');
    const genRes = await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'Bail',
        template_id: 'bail_habitation',
        data: { loyer: '950', duree: '12' },
      });
    expect(genRes.status).toBe(201);
    expect(genRes.body.contractId).toBeDefined();
    expect(genRes.body.r2_key).toBeTruthy(); // r2_key populated by vault.putDocument

    const contractRow = await get<any>(
      'SELECT r2_key FROM contracts WHERE id = ?',
      [genRes.body.contractId]
    );
    expect(contractRow.r2_key).toBe(genRes.body.r2_key);

    // Fetch /vault/{contractId}.pdf — should decrypt and return a PDF
    const dlRes = await request(app).get(`/vault/${genRes.body.contractId}.pdf`);
    expect(dlRes.status).toBe(200);
    expect(dlRes.headers['content-type']).toContain('application/pdf');
    expect(dlRes.body.length).toBeGreaterThan(100); // non-empty PDF
    // PDF magic header
    expect(dlRes.body.slice(0, 4).toString('latin1')).toBe('%PDF');
  });
});

// ---------------------------------------------------------------------------
// vault list fusion + stream RBAC
// ---------------------------------------------------------------------------
describe('Story 6-3 — vault list & stream RBAC', () => {
  test('list dedupes contract-backed vault rows (one row per contract, not two)', async () => {
    const { token, userId } = await registerUser('list-dedupe@example.com');
    await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Bail', template_id: 'bail_habitation', data: { loyer: '700' } });

    const res = await request(app)
      .get('/api/vault/documents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // Exactly one document — the contract — even though both contracts and
    // vault_documents rows exist.
    expect(res.body.documents.length).toBe(1);
    expect(res.body.documents[0].source).toBe('contract');
    // Sanity: vault_documents has the row but it's deduped out.
    const vaultRows = await all<any>(
      `SELECT id FROM vault_documents WHERE user_id = ?`,
      [userId]
    );
    expect(vaultRows.length).toBe(1);
  });

  test('list returns both contracts and standalone vault entries', async () => {
    const { token } = await registerUser('list-mixed@example.com');
    await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Travail', template_id: 'travail_cdi', data: { salaire: '2000' } });
    // Standalone vault upload (pending — won't appear in /documents because
    // status='pending'? No: list filters out 'deleted' only. Pending shows.)
    await request(app)
      .post('/api/nif/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'passport.pdf' });

    const res = await request(app)
      .get('/api/vault/documents')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.documents.length).toBe(2);
    const sources = res.body.documents.map((d: any) => d.source).sort();
    expect(sources).toEqual(['contract', 'vault']);
  });

  test('stream endpoint enforces RBAC (client cannot read another client doc)', async () => {
    const alice = await registerUser('rb-alice@example.com');
    const eve = await registerUser('rb-eve@example.com');

    // Alice generates a contract (which seeds a vault_documents row)
    await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ type: 'Bail', template_id: 'bail_habitation', data: { loyer: '1' } });

    const aliceVault = await get<any>(
      `SELECT id FROM vault_documents WHERE user_id = ?`,
      [alice.userId]
    );
    expect(aliceVault).toBeDefined();

    const res = await request(app)
      .get(`/api/vault/documents/${aliceVault.id}/stream`)
      .set('Authorization', `Bearer ${eve.token}`);
    expect(res.status).toBe(403);

    const audits = await all<any>(
      `SELECT action FROM audit_log WHERE user_id = ? AND action = 'FORBIDDEN_VAULT_ACCESS'`,
      [eve.userId]
    );
    expect(audits.length).toBe(1);
  });

  test('stream endpoint allows admin to read any document', async () => {
    const alice = await registerUser('cross-alice@example.com');
    const admin = await registerUser('cross-admin@example.com', 'cabinet_avocat');

    await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ type: 'Bail', template_id: 'bail_habitation', data: { loyer: '1' } });

    const aliceVault = await get<any>(
      `SELECT id FROM vault_documents WHERE user_id = ?`,
      [alice.userId]
    );
    const res = await request(app)
      .get(`/api/vault/documents/${aliceVault.id}/stream`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  test('stream returns 404 for missing document', async () => {
    const { token } = await registerUser('stream-404@example.com');
    const res = await request(app)
      .get('/api/vault/documents/00000000-0000-0000-0000-000000000000/stream')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('download-url returns streamUrl for encrypted document', async () => {
    const { token, userId } = await registerUser('dl-enc@example.com');
    await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'Bail', template_id: 'bail_habitation', data: { loyer: '1' } });

    const vaultRow = await get<any>(
      `SELECT id FROM vault_documents WHERE user_id = ?`,
      [userId]
    );
    const res = await request(app)
      .get(`/api/vault/documents/${vaultRow.id}/download-url`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.streamUrl).toBe(`/api/vault/documents/${vaultRow.id}/stream`);
  });
});

// ---------------------------------------------------------------------------
// Schema migration idempotency
// ---------------------------------------------------------------------------
describe('Story 6-3 — schema migration', () => {
  test('initDb can be called multiple times without error (CREATE TABLE IF NOT EXISTS)', async () => {
    await expect(initDb()).resolves.not.toThrow();
    await expect(initDb()).resolves.not.toThrow();
    // Insert a row to confirm the table exists and indexes work.
    await run(
      `INSERT INTO vault_documents
         (id, user_id, entity_type, entity_id, r2_key, mime_type, encrypted_dek, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '11111111-1111-1111-1111-111111111111',
        'user-x',
        'other',
        null,
        'misc/test/r2-key-uniq',
        'application/octet-stream',
        '',
        'ready',
        new Date().toISOString(),
      ]
    );
    const row = await get<any>(
      `SELECT * FROM vault_documents WHERE id = ?`,
      ['11111111-1111-1111-1111-111111111111']
    );
    expect(row).toBeDefined();
    expect(row.status).toBe('ready');
  });
});
