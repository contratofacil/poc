import request from 'supertest';
import app, { initDb } from './server';
import { closeDb, run, get } from './db';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

beforeEach(async () => {
  // Clean tables before each test
  await run('DELETE FROM users');
  await run('DELETE FROM dossiers_nif');
  await run('DELETE FROM payments');
  await run('DELETE FROM compliance_alert_logs');
  await run('DELETE FROM compliance_items');
  await run('DELETE FROM contracts');
  await run('DELETE FROM audit_log');
  await run('DELETE FROM system_settings');
  await run('DELETE FROM vault_documents');
});

describe('POST /api/nif/apply & POST /api/nif/upload', () => {
  const validNifPayload = {
    fullname: 'Jane Doe',
    birthdate: '1990-01-01',
    nationality: 'Portuguese',
    current_residence: 'Rua Augusta, Lisbon',
    passport_path: '/uploads/mock-passport.pdf',
    proof_of_address_path: '/uploads/mock-address.pdf',
    user_id: 'some-user-id'
  };

  test('should prepare a vault upload and return a presigned URL + documentId', async () => {
    // Story 6-3: endpoint now authenticated and creates a vault_documents row.
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'upload-test@example.com',
        password: 'Password123',
        cguAccepted: true,
        privacyPolicyAccepted: true,
        lang: 'PT',
      });
    const token = reg.body.token;

    const res = await request(app)
      .post('/api/nif/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'passport.pdf', mime_type: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.documentId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.r2_key).toContain('nif/');
    expect(res.body.r2_key).toContain('.bin.enc');
    expect(typeof res.body.uploadUrl).toBe('string');
    expect(res.body.expiresIn).toBeGreaterThan(0);
    // Backwards-compat: filepath still present and contains r2_key.
    expect(res.body.filepath).toBe(res.body.r2_key);
  });

  // Funnel NIF public (POC) : l'upload accepte les anonymes comme /api/nif/apply.
  // À re-durcir avant prod si le wizard NIF passe derrière l'auth Privy.
  test('should accept anonymous /api/nif/upload (public NIF funnel)', async () => {
    const res = await request(app).post('/api/nif/upload').send({ filename: 'p.pdf' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.r2_key).toContain('anonymous');
  });

  test('should successfully submit a NIF application', async () => {
    const res = await request(app)
      .post('/api/nif/apply')
      .send(validNifPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.dossierId).toBeDefined();
    expect(res.body.dossier.fullname).toBe(validNifPayload.fullname);
    expect(res.body.dossier.status).toBe('pending');
  });

  test('should fail if required fields are missing', async () => {
    const invalidPayload = {
      fullname: 'Jane Doe'
      // missing other fields
    };

    const res = await request(app)
      .post('/api/nif/apply')
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/register', () => {
  const validPayload = {
    email: 'user@example.com',
    password: 'Password123',
    name: 'John Doe',
    cguAccepted: true,
    privacyPolicyAccepted: true,
    lang: 'PT'
  };

  test('should successfully register a user and return a JWT token', async () => {
    const start = performance.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send(validPayload);
    const end = performance.now();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(validPayload.email);
    expect(res.body.user.name).toBe(validPayload.name);
    expect(res.body.user.role).toBe('salarie');
    expect(res.body.user.is_verified).toBe(0);
    expect(res.body.token).toBeDefined();
    
    // Performance check
    const responseTime = end - start;
    expect(responseTime).toBeLessThan(500);
  });

  test('should fail if email is invalid', async () => {
    const payload = { ...validPayload, email: 'invalid-email' };
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'email', message: 'Invalid email address' })
    );
  });

  test('should fail if password has less than 8 characters', async () => {
    const payload = { ...validPayload, password: 'Pass1' };
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'password', message: 'Password must be at least 8 characters long' })
    );
  });

  test('should fail if password has no uppercase character', async () => {
    const payload = { ...validPayload, password: 'password123' };
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'password', message: 'Password must contain at least one uppercase letter' })
    );
  });

  test('should fail if password has no digit', async () => {
    const payload = { ...validPayload, password: 'Password' };
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'password', message: 'Password must contain at least one digit' })
    );
  });

  test('should fail if CGU is not accepted', async () => {
    const payload = { ...validPayload, cguAccepted: false };
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'cguAccepted', message: 'You must accept the Terms of Use (CGU)' })
    );
  });

  test('should fail if Privacy Policy is not accepted', async () => {
    const payload = { ...validPayload, privacyPolicyAccepted: false };
    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'privacyPolicyAccepted', message: 'You must accept the Privacy Policy' })
    );
  });

  test('should fail if user email already exists', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send(validPayload);

    // Second registration with the same email
    const res = await request(app)
      .post('/api/auth/register')
      .send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });
});

describe('POST /api/auth/login', () => {
  const registerPayload = {
    email: 'testlogin@example.com',
    password: 'Password123',
    name: 'Login User',
    cguAccepted: true,
    privacyPolicyAccepted: true,
    lang: 'PT'
  };

  beforeEach(async () => {
    // Register the user before each test to test login
    await request(app)
      .post('/api/auth/register')
      .send(registerPayload);
  });

  test('should successfully login and return a JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testlogin@example.com',
        password: 'Password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful.');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(registerPayload.email);
    expect(res.body.user.name).toBe(registerPayload.name);
    expect(res.body.token).toBeDefined();
  });

  test('should fail login with invalid password (invalid credentials)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testlogin@example.com',
        password: 'WrongPassword123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid credentials.');
    expect(res.body.token).toBeUndefined();
  });

  test('should fail login with non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid credentials.');
    expect(res.body.token).toBeUndefined();
  });

  test('should fail validation with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'notanemail',
        password: 'Password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContainEqual(
      expect.objectContaining({ field: 'email', message: 'Invalid email address' })
    );
  });
});

describe('NIF Payment and Dossier Status Tracking', () => {
  const userId = 'user-test-123';
  const validNifPayload = {
    fullname: 'John Smith',
    birthdate: '1985-05-15',
    nationality: 'American',
    current_residence: '123 Main St, New York',
    passport_path: '/uploads/passport.pdf',
    proof_of_address_path: '/uploads/address.pdf',
    user_id: userId
  };

  beforeEach(async () => {
    // Create a dossier for the user
    await request(app)
      .post('/api/nif/apply')
      .send(validNifPayload);
  });

  test('should successfully initiate stripe checkout session', async () => {
    const res = await request(app)
      .post('/api/nif/payment')
      .send({
        user_id: userId,
        method: 'stripe',
        amount: 99.00,
        currency: 'EUR',
        product: 'NIF Application'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.method).toBe('stripe');
    expect(res.body.stripeSessionId).toBeDefined();
    expect(res.body.checkoutUrl).toContain('https://checkout.stripe.com/pay/');
  });

  test('should successfully initiate mbway payment reference', async () => {
    const res = await request(app)
      .post('/api/nif/payment')
      .send({
        user_id: userId,
        method: 'mbway',
        amount: 99.00,
        currency: 'EUR',
        phoneNumber: '912345678'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.method).toBe('mbway');
    expect(res.body.reference).toBe('999999999');
    expect(res.body.phoneNumber).toBe('912345678');
  });

  test('should fail payment initiation if user_id or method is missing', async () => {
    const res = await request(app)
      .post('/api/nif/payment')
      .send({
        method: 'stripe'
      });
    expect(res.status).toBe(400);

    const res2 = await request(app)
      .post('/api/nif/payment')
      .send({
        user_id: userId
      });
    expect(res2.status).toBe(400);
  });

  test('should handle stripe webhook, update payment to paid, and transition NIF status to En traitement', async () => {
    // 1. Create a stripe payment
    const paymentRes = await request(app)
      .post('/api/nif/payment')
      .send({
        user_id: userId,
        method: 'stripe',
        amount: 99.00,
        currency: 'EUR'
      });

    const stripeId = paymentRes.body.stripeSessionId;

    // 2. Trigger webhook
    const webhookRes = await request(app)
      .post('/api/nif/payment/webhook')
      .send({ stripe_id: stripeId });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);

    // 3. Check current status history
    const statusRes = await request(app)
      .get(`/api/nif/status?user_id=${userId}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.status).toBe('En traitement');
    expect(statusRes.body.paymentStatus).toBe('paid');
    
    const timeline = statusRes.body.timeline;
    expect(timeline).toHaveLength(4);
    expect(timeline[0].step).toBe('Reçu');
    expect(timeline[0].status).toBe('completed');
    expect(timeline[1].step).toBe('En traitement');
    expect(timeline[1].status).toBe('current');
  });
});

describe('Profile & RBAC & Collaborator Invitation Tests', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    // Register user first
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'profile-user@example.com',
        password: 'Password123',
        name: 'Profile User',
        cguAccepted: true,
        privacyPolicyAccepted: true,
        lang: 'PT'
      });
    token = regRes.body.token;
    userId = regRes.body.user.id;
  });

  test('GET /api/auth/profile - should successfully retrieve profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('profile-user@example.com');
    expect(res.body.user.name).toBe('Profile User');
  });

  test('PUT /api/auth/profile - should successfully update name and language', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        lang: 'FR'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Updated Name');
    expect(res.body.user.lang).toBe('FR');
  });

  test('POST /api/auth/profile/export - should successfully export data', async () => {
    const res = await request(app)
      .post('/api/auth/profile/export')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exportData).toBeDefined();
    expect(res.body.exportData.user.email).toBe('profile-user@example.com');
  });

  test('DELETE /api/auth/profile - should mark account as deleted and prevent login', async () => {
    const delRes = await request(app)
      .delete('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Try logging in with the deleted user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'profile-user@example.com',
        password: 'Password123'
      });
    expect(loginRes.status).toBe(401);
  });

  test('POST /api/auth/invite - should forbid non-admin users', async () => {
    const res = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'collaborator@example.com',
        role: 'avocat'
      });
    expect(res.status).toBe(403);
  });

  test('POST /api/auth/invite - should allow admin to invite collaborator', async () => {
    // Promote user to admin role
    await run("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);

    const res = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'collaborator@example.com',
        role: 'avocat'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.invitation.email).toBe('collaborator@example.com');
    expect(res.body.invitation.role).toBe('avocat');
  });
});

describe('Contract Generator & Vault Epic Tests', () => {
  let clientToken: string;
  let clientUserId: string;
  let adminToken: string;
  let adminUserId: string;

  beforeEach(async () => {
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
    clientUserId = regClient.body.user.id;

    // Register an admin
    const regAdmin = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'Password123',
        name: 'Cabinet Admin',
        cguAccepted: true,
        privacyPolicyAccepted: true,
        lang: 'PT'
      });
    adminToken = regAdmin.body.token;
    adminUserId = regAdmin.body.user.id;
    // Set to cabinet_avocat role
    await run("UPDATE users SET role = 'cabinet_avocat' WHERE id = ?", [adminUserId]);
  });

  test('GET /api/contracts/templates - should list contract templates', async () => {
    const res = await request(app)
      .get('/api/contracts/templates')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.templates).toBeDefined();
    expect(res.body.templates.length).toBeGreaterThan(0);
    expect(res.body.templates[0].id).toBe('bail_habitation');
  });

  test('POST /api/contracts/generate - should generate a contract and create audit log', async () => {
    const data = { loyer: '950', duree: '12' };
    const res = await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        type: 'Bail',
        template_id: 'bail_habitation',
        data
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.contractId).toBeDefined();
    expect(res.body.pdfUrl).toContain(res.body.contractId);

    // Verify it is saved in database
    const contract = await get<any>('SELECT * FROM contracts WHERE id = ?', [res.body.contractId]);
    expect(contract).toBeDefined();
    expect(contract.user_id).toBe(clientUserId);
    expect(contract.status).toBe('generated');
    expect(JSON.parse(contract.data_json)).toEqual(data);

    // Verify audit log entry was created
    const logs = await get<any>('SELECT * FROM audit_log WHERE entity_id = ?', [res.body.contractId]);
    expect(logs).toBeDefined();
    expect(logs.user_id).toBe(clientUserId);
    expect(logs.action).toBe('CREATE_CONTRACT');
  });

  test('GET /api/contracts/:id/preview - should compile clauses with substitution', async () => {
    // 1. Generate contract
    const data = { loyer: '950', duree: '12' };
    const genRes = await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        type: 'Bail',
        template_id: 'bail_habitation',
        data
      });
    const contractId = genRes.body.contractId;

    // 2. Get preview
    const res = await request(app)
      .get(`/api/contracts/${contractId}/preview`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.compiledContent).toContain('Le loyer mensuel est fixé à 950 EUR.');
    expect(res.body.compiledContent).toContain('Le bail est conclu pour une durée de 12 mois.');

    // 3. Verify client cannot preview another user's contract
    const anotherClient = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'other@example.com',
        password: 'Password123',
        name: 'Other Client',
        cguAccepted: true,
        privacyPolicyAccepted: true
      });
    const otherToken = anotherClient.body.token;

    const forbiddenRes = await request(app)
      .get(`/api/contracts/${contractId}/preview`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(forbiddenRes.status).toBe(403);

    // 4. Verify admin CAN preview client's contract
    const adminPreviewRes = await request(app)
      .get(`/api/contracts/${contractId}/preview`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminPreviewRes.status).toBe(200);
  });

  test('GET /api/vault/documents - should retrieve documents for the user', async () => {
    // Generate contract for client
    await request(app)
      .post('/api/contracts/generate')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        type: 'Bail',
        template_id: 'bail_habitation',
        data: { loyer: '900' }
      });

    // Get documents list for client
    const res = await request(app)
      .get('/api/vault/documents')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.documents.length).toBe(1);
    expect(res.body.documents[0].type).toBe('Bail');

    // Admin lists documents - sees all
    const adminRes = await request(app)
      .get('/api/vault/documents')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.documents.length).toBe(1);
  });

  test('GET /api/vault/audit - should allow admin and block clients', async () => {
    // Client try
    const forbiddenRes = await request(app)
      .get('/api/vault/audit')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(forbiddenRes.status).toBe(403);

    // Admin try
    const res = await request(app)
      .get('/api/vault/audit')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.auditLogs).toBeDefined();
  });
});

describe('Epic 4: Compliance Tracking & Alerts', () => {
  const testUserId = 'compliance-test-user';
  
  test('should successfully create a compliance item', async () => {
    const res = await request(app)
      .post('/api/compliance')
      .send({
        title: 'Tax Declaration',
        description: 'Annual corporate tax return filing',
        due_date: '2026-06-30',
        category: 'Fiscal',
        user_id: testUserId
      });
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.item).toBeDefined();
    expect(res.body.item.title).toBe('Tax Declaration');
    expect(res.body.item.status).toBe('pending');
    expect(res.body.item.color).toBeDefined();
    expect(res.body.item.days_left).toBeDefined();
  });

  test('should reject invalid compliance item creation', async () => {
    const res = await request(app)
      .post('/api/compliance')
      .send({
        title: '', // empty
        due_date: 'invalid-date-format',
        category: 'Fiscal'
      });
      
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('should list compliance items with correct colors and timelines', async () => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const pastDate = fmt(new Date(today.getTime() - 10 * 86400000));       // 10 days ago → red
    const nearDate = fmt(new Date(today.getTime() + 4 * 86400000));        // 4 days ahead → orange
    const completedDate = fmt(new Date(today.getTime() - 5 * 86400000));   // past, will be marked completed → green

    // 1. Overdue item (Red)
    await request(app)
      .post('/api/compliance')
      .send({
        title: 'Overdue Task',
        due_date: pastDate,
        category: 'Legal',
        user_id: testUserId
      });

    // 2. Near due item (Orange)
    await request(app)
      .post('/api/compliance')
      .send({
        title: 'Near Due Task',
        due_date: nearDate,
        category: 'Regulatory',
        user_id: testUserId
      });

    // 3. Completed item (Green)
    const completedRes = await request(app)
      .post('/api/compliance')
      .send({
        title: 'Completed Task',
        due_date: completedDate,
        category: 'Audit',
        user_id: testUserId
      });

    const completedId = completedRes.body.item.id;
    await request(app)
      .put(`/api/compliance/${completedId}`)
      .send({ status: 'completed' });

    // Query list
    const res = await request(app)
      .get(`/api/compliance?user_id=${testUserId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.items).toHaveLength(3);

    const overdue = res.body.items.find((item: any) => item.title === 'Overdue Task');
    expect(overdue.color).toBe('red');

    const nearDue = res.body.items.find((item: any) => item.title === 'Near Due Task');
    expect(nearDue.color).toBe('orange');

    const completed = res.body.items.find((item: any) => item.title === 'Completed Task');
    expect(completed.color).toBe('green');
    expect(completed.status).toBe('completed');
  });

  test('should run alerts simulation and log mock emails', async () => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const nearDate = fmt(new Date(today.getTime() + 4 * 86400000));   // 4 days ahead → triggers alert
    const farDate = fmt(new Date(today.getTime() + 120 * 86400000));  // 120 days ahead → no alert

    // Create near due item (Orange)
    await request(app)
      .post('/api/compliance')
      .send({
        title: 'Impôts Trimestriels',
        due_date: nearDate,
        category: 'Fiscal',
        user_id: testUserId
      });

    // Create a far due item (Safe, no alert)
    await request(app)
      .post('/api/compliance')
      .send({
        title: 'Renouvellement Licences',
        due_date: farDate,
        category: 'Administrative',
        user_id: testUserId
      });

    // Run simulation
    const simRes = await request(app)
      .post('/api/compliance/simulate-alerts');

    expect(simRes.status).toBe(200);
    expect(simRes.body.success).toBe(true);
    expect(simRes.body.logsGenerated).toBeGreaterThanOrEqual(1);

    // Fetch logs
    const logsRes = await request(app)
      .get('/api/compliance/alert-logs');

    expect(logsRes.status).toBe(200);
    expect(logsRes.body.success).toBe(true);
    expect(logsRes.body.logs.length).toBeGreaterThanOrEqual(1);
    expect(logsRes.body.logs[0].recipient_email).toBe('alert@easylaw.pt');
    expect(logsRes.body.logs[0].subject).toContain('Impôts Trimestriels');
  });

  test('should successfully delete a compliance item', async () => {
    const createRes = await request(app)
      .post('/api/compliance')
      .send({
        title: 'Temporary Obligation',
        due_date: '2026-12-31',
        category: 'Legal'
      });

    const itemId = createRes.body.item.id;
    const deleteRes = await request(app)
      .delete(`/api/compliance/${itemId}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const getRes = await request(app)
      .get('/api/compliance');
    
    const found = getRes.body.items.find((item: any) => item.id === itemId);
    expect(found).toBeUndefined();
  });
});



