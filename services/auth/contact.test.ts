import request from 'supertest';
import app, { initDb } from './server';
import { closeDb, run, get } from './db';

describe('Formulaire de contact — POST /api/contact', () => {
  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await run('DELETE FROM contact_messages');
  });

  const validPayload = {
    name: 'Jean Dupont',
    email: 'Jean@Exemple.com',
    subject: 'Mon dossier NIF',
    message: 'Bonjour, où en est mon dossier ?',
  };

  it('persiste un message valide et renvoie 201', async () => {
    const res = await request(app).post('/api/contact').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();

    const row = await get<{ name: string; email: string; subject: string; message: string; status: string }>(
      'SELECT name, email, subject, message, status FROM contact_messages WHERE id = ?',
      [res.body.id]
    );
    expect(row).toBeDefined();
    expect(row!.name).toBe('Jean Dupont');
    expect(row!.email).toBe('jean@exemple.com'); // normalisé en minuscules
    expect(row!.subject).toBe('Mon dossier NIF');
    expect(row!.status).toBe('new');
  });

  it.each([
    ['name manquant', { ...validPayload, name: '' }],
    ['email invalide', { ...validPayload, email: 'pas-un-email' }],
    ['subject manquant', { ...validPayload, subject: '   ' }],
    ['message manquant', { ...validPayload, message: '' }],
    ['message trop long', { ...validPayload, message: 'x'.repeat(5001) }],
  ])('rejette en 400 : %s', async (_label, payload) => {
    const res = await request(app).post('/api/contact').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('refuse la liste des messages sans authentification admin', async () => {
    const res = await request(app).get('/api/contact');
    expect(res.status).toBe(401);
  });

  it('refuse le PATCH sans authentification admin', async () => {
    const res = await request(app).patch('/api/contact/some-id');
    expect(res.status).toBe(401);
  });
});
