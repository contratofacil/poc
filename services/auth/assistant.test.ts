import request from 'supertest';
import app, { initDb } from './server';
import { db, run } from './db';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();
});

afterAll((done) => {
  db.close((err) => {
    if (err) {
      console.error('Error closing test database:', err);
    }
    done();
  });
});

describe('Luso-Legal AI Assistant Endpoint Integration Tests', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Register a test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'assistant-test@example.com',
        password: 'Password123',
        name: 'Assistant Test User',
        cguAccepted: true,
        privacyPolicyAccepted: true,
        lang: 'PT'
      });
    token = res.body.token;
    userId = res.body.user.id;
  });

  beforeEach(async () => {
    // Clear assistant messages and lawyer escalations before each test
    await run('DELETE FROM assistant_messages');
    await run('DELETE FROM lawyer_escalations');
  });

  test('POST /api/assistant/chat - should successfully respond to Portuguese law query (NIF)', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Como posso obter um NIF em Portugal?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.inScope).toBe(true);
    expect(res.body.response).toContain('NIF');
    expect(res.body.response).toContain('Oliveira & Cameiro');
    expect(res.body.source).toBeDefined();
  });

  test('POST /api/assistant/chat - should reject out-of-scope queries (guardrail)', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Quelle est la recette du gâteau au chocolat?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.inScope).toBe(false);
    expect(res.body.response).toContain('hors périmètre');
  });

  test('GET /api/assistant/history - should retrieve chat history', async () => {
    // 1. Send in-scope message
    await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Quels sont les termes de contrat de travail en Portugal?' });

    // 2. Fetch history
    const res = await request(app)
      .get('/api/assistant/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Should have 2 messages (1 user, 1 assistant)
    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[0].role).toBe('user');
    expect(res.body.messages[0].content).toContain('contrat de travail');
    expect(res.body.messages[1].role).toBe('assistant');
  });

  test('POST /api/assistant/escalate - should successfully create escalation ticket', async () => {
    const res = await request(app)
      .post('/api/assistant/escalate')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversation_summary: 'Question complexe sur la résiliation de bail commercial après 2 ans.' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.escalationId).toBeDefined();
    expect(res.body.message).toContain('escaladée avec succès');

    // Verify it is in the database
    const escalation = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM lawyer_escalations WHERE id = ?', [res.body.escalationId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    expect(escalation).toBeDefined();
    expect(escalation.user_id).toBe(userId);
    expect(escalation.conversation_summary).toContain('résiliation de bail commercial');
    expect(escalation.status).toBe('pending');
  });
});
