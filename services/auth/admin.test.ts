import request from 'supertest';
import app, { initDb } from './server';
import { closeDb, run, get } from './db';

describe('Epic 7: Admin Backoffice Paramétrage Endpoints', () => {
  let adminToken: string;
  let clientToken: string;
  let testClientId: string;

  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await run('DELETE FROM users');
    await run('DELETE FROM clause_versions');
    await run('DELETE FROM system_settings');

    // Register a client
    const regClient = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'client@example.com',
        password: 'Password123',
        name: 'Client User',
        cguAccepted: true,
        privacyPolicyAccepted: true,
        lang: 'PT'
      });
    clientToken = regClient.body.token;
    testClientId = regClient.body.user.id;

    // Register an admin
    const regAdmin = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'Password123',
        name: 'Admin User',
        cguAccepted: true,
        privacyPolicyAccepted: true,
        lang: 'PT'
      });
    adminToken = regAdmin.body.token;
    await run("UPDATE users SET role = 'admin_cabinet' WHERE id = ?", [regAdmin.body.user.id]);

    // Insert default settings
    await run("INSERT INTO system_settings (key, value) VALUES ('compliance_orange_days', '90')");
    await run("INSERT INTO system_settings (key, value) VALUES ('compliance_red_days', '30')");
    await run("INSERT INTO system_settings (key, value) VALUES ('assistant_system_prompt', 'System Prompt Test')");
  });

  test('GET /api/admin/settings - should allow admin and reject client', async () => {
    // 1. Client fails
    const forbidden = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(forbidden.status).toBe(403);

    // 2. Admin succeeds
    const success = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(success.status).toBe(200);
    expect(success.body.settings.length).toBe(3);
  });

  test('PUT /api/admin/settings - should update global settings successfully', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        settings: [
          { key: 'compliance_orange_days', value: '45' },
          { key: 'compliance_red_days', value: '15' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['compliance_orange_days']);
    expect(check?.value).toBe('45');
  });

  test('GET & POST & PUT & DELETE /api/admin/clauses - CRUD clauses', async () => {
    // 1. List initially empty (or only default seed if populated, we cleared it in beforeEach)
    const listRes = await request(app)
      .get('/api/admin/clauses')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.clauses.length).toBe(0);

    // 2. Create clause
    const createRes = await request(app)
      .post('/api/admin/clauses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        contract_type: 'Bail',
        clause_key: 'custom_clause',
        content: 'This is a custom clause content.',
        loi_reference: 'Civil Code 1'
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.clauseId).toBeDefined();
    const clauseId = createRes.body.clauseId;

    // 3. Update clause
    const updateRes = await request(app)
      .put(`/api/admin/clauses/${clauseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        content: 'Updated content.',
        loi_reference: 'Civil Code 2'
      });
    expect(updateRes.status).toBe(200);

    const check = await get<{ content: string }>('SELECT content FROM clause_versions WHERE id = ?', [clauseId]);
    expect(check?.content).toBe('Updated content.');

    // 4. Delete clause
    const deleteRes = await request(app)
      .delete(`/api/admin/clauses/${clauseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);

    const checkDel = await get('SELECT id FROM clause_versions WHERE id = ?', [clauseId]);
    expect(checkDel).toBeUndefined();
  });

  test('GET /api/admin/users & PUT /api/admin/users/:id/role - Role updates', async () => {
    // 1. List users
    const listRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.users.length).toBe(2);

    // 2. Update role
    const updateRoleRes = await request(app)
      .put(`/api/admin/users/${testClientId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'avocat' });
    
    expect(updateRoleRes.status).toBe(200);

    const user = await get<{ role: string }>('SELECT role FROM users WHERE id = ?', [testClientId]);
    expect(user?.role).toBe('avocat');
  });
});
