import request from 'supertest';
import app, { initDb } from './server';
import { closeDb, run } from './db';

// Helper: register a user and return token + id
async function registerUser(email: string, role?: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Password123',
      name: 'Test User',
      cguAccepted: true,
      privacyPolicyAccepted: true,
      lang: 'PT'
    });
  const token: string = res.body.token;
  const userId: string = res.body.user.id;
  if (role) {
    await run(`UPDATE users SET role = '${role}' WHERE id = ?`, [userId]);
  }
  return { token, userId };
}

beforeAll(async () => {
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

beforeEach(async () => {
  await run('DELETE FROM users');
  await run('DELETE FROM contracts');
  await run('DELETE FROM compliance_items');
  await run('DELETE FROM compliance_alert_logs');
  await run('DELETE FROM dossiers_nif');
  await run('DELETE FROM payments');
  await run('DELETE FROM audit_log');
  await run('DELETE FROM system_settings');
  await run('DELETE FROM vault_documents');
});

// ---------------------------------------------------------------------------
// Auth middleware edge cases
// ---------------------------------------------------------------------------
describe('Auth Middleware Edge Cases', () => {
  test('GET /api/auth/profile - should return 401 with no token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/profile - should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/profile - should return 401 with malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Token abc123');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// NIF status edge cases
// ---------------------------------------------------------------------------
describe('GET /api/nif/status - Edge Cases', () => {
  test('should return 400 when user_id is missing', async () => {
    const res = await request(app).get('/api/nif/status');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('user_id');
  });

  test('should return 404 when no dossier exists for the user', async () => {
    const res = await request(app).get('/api/nif/status?user_id=ghost-user-999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('should return pending status right after applying', async () => {
    await request(app).post('/api/nif/apply').send({
      fullname: 'Alice Test',
      birthdate: '1990-01-01',
      nationality: 'French',
      current_residence: 'Paris',
      passport_path: '/uploads/passport.pdf',
      proof_of_address_path: '/uploads/address.pdf',
      user_id: 'alice-001'
    });

    const res = await request(app).get('/api/nif/status?user_id=alice-001');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(res.body.timeline[0].status).toBe('current'); // Reçu is current
    expect(res.body.timeline[1].status).toBe('upcoming');
  });
});

// ---------------------------------------------------------------------------
// PDF vault download
// ---------------------------------------------------------------------------
describe('GET /vault/:filename - PDF Download', () => {
  test('should return 404 for non-existent contract PDF', async () => {
    const res = await request(app).get('/vault/non-existent-contract.pdf');
    expect(res.status).toBe(404);
  });

  test('should serve a valid PDF after contract generation', async () => {
    const { token } = await registerUser('pdfuser@example.com');

    const genRes = await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'Bail',
        template_id: 'bail_habitation',
        data: { loyer: '800', duree: '6' }
      });

    expect(genRes.status).toBe(201);
    const contractId: string = genRes.body.contractId;

    const pdfRes = await request(app).get(`/vault/${contractId}.pdf`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
  });
});

// ---------------------------------------------------------------------------
// Compliance PUT (update) — dedicated tests
// ---------------------------------------------------------------------------
describe('PUT /api/compliance/:id - Update Compliance Item', () => {
  test('should return 404 for unknown compliance item', async () => {
    const res = await request(app)
      .put('/api/compliance/unknown-id-99')
      .send({ status: 'completed' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('should update status, title, and category of an existing item', async () => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + 60 * 86400000).toISOString().split('T')[0];

    const createRes = await request(app).post('/api/compliance').send({
      title: 'Initial Title',
      due_date: futureDate,
      category: 'Fiscal',
      user_id: 'update-test-user'
    });

    const itemId: string = createRes.body.item.id;

    const updateRes = await request(app)
      .put(`/api/compliance/${itemId}`)
      .send({ status: 'completed', title: 'Updated Title', category: 'Legal' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.item.status).toBe('completed');
    expect(updateRes.body.item.title).toBe('Updated Title');
    expect(updateRes.body.item.category).toBe('Legal');
    expect(updateRes.body.item.color).toBe('green');
  });
});

// ---------------------------------------------------------------------------
// Contracts — edge cases
// ---------------------------------------------------------------------------
describe('Contracts Edge Cases', () => {
  test('GET /api/contracts/:id/preview - should return 404 for unknown contract', async () => {
    const { token } = await registerUser('preview404@example.com');
    const res = await request(app)
      .get('/api/contracts/non-existent-contract-id/preview')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('POST /api/contracts/generate - should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/contracts/generate')
      .send({ type: 'Bail', template_id: 'bail_habitation', data: {} });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// NIF upload edge cases
// ---------------------------------------------------------------------------
describe('POST /api/nif/upload - Edge Cases', () => {
  test('should still issue a presigned URL when filename is omitted', async () => {
    const { token } = await registerUser('edge-upload@example.com');
    const res = await request(app)
      .post('/api/nif/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // r2_key now includes the userId + a uuid; the legacy /uploads/ prefix is gone.
    expect(res.body.r2_key).toMatch(/^nif\//);
    expect(res.body.documentId).toBeDefined();
  });

  // Funnel NIF public (POC) : pas d'auth requise, mais le payload reste validé.
  test('should validate payload on anonymous /api/nif/upload', async () => {
    const res = await request(app).post('/api/nif/upload').send({ filename: 123 });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Vault audit RBAC
// ---------------------------------------------------------------------------
describe('GET /api/vault/audit - RBAC', () => {
  test('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/vault/audit');
    expect(res.status).toBe(401);
  });

  test('should return 403 for non-admin user', async () => {
    const { token } = await registerUser('nonadmin@example.com');
    const res = await request(app)
      .get('/api/vault/audit')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
