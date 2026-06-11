import request from 'supertest';
import app, { initDb } from './server';
import { closeDb, run, get } from './db';

describe('KYC / eIDV — vérification identité NIF (Lei 83/2017)', () => {
  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await run('DELETE FROM kyc_verifications');
    await run('DELETE FROM lawyer_escalations');
  });

  describe('POST /api/nif/kyc/start', () => {
    it('crée une session KYC avec rétention 7 ans', async () => {
      const res = await request(app)
        .post('/api/nif/kyc/start')
        .send({ fullname: 'Marie Curie' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.kycId).toBeDefined();
      expect(res.body.status).toBe('pending');
      expect(res.body.retentionYears).toBe(7);

      const row = await get<{ retention_until: string; created_at: string; fullname: string }>(
        'SELECT retention_until, created_at, fullname FROM kyc_verifications WHERE id = ?',
        [res.body.kycId]
      );
      expect(row).toBeDefined();
      expect(row!.fullname).toBe('Marie Curie');
      const created = new Date(row!.created_at);
      const retention = new Date(row!.retention_until);
      expect(retention.getFullYear() - created.getFullYear()).toBe(7);
    });

    it('rejette une requête sans fullname', async () => {
      const res = await request(app).post('/api/nif/kyc/start').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/nif/kyc/:id/submit', () => {
    async function startSession(fullname: string): Promise<string> {
      const res = await request(app).post('/api/nif/kyc/start').send({ fullname });
      return res.body.kycId;
    }

    it('approuve une identité standard (eIDV ok + PEP clear)', async () => {
      const kycId = await startSession('Jean Dupont');
      const res = await request(app).post(`/api/nif/kyc/${kycId}/submit`).send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.userFacingStatus).toBe('verified');

      const row = await get<{ eidv_result: string; pep_result: string; pep_lists_checked: string }>(
        'SELECT eidv_result, pep_result, pep_lists_checked FROM kyc_verifications WHERE id = ?',
        [kycId]
      );
      expect(row!.eidv_result).toBe('approved');
      expect(row!.pep_result).toBe('clear');
      expect(row!.pep_lists_checked).toBe('OFAC,EU_SANCTIONS,UN');
    });

    it('rejette une identité non vérifiable (hook de test REJECT)', async () => {
      const kycId = await startSession('REJECT Test User');
      const res = await request(app).post(`/api/nif/kyc/${kycId}/submit`).send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
      expect(res.body.userFacingStatus).toBe('failed');
    });

    it('escalade vers le cabinet sur match PEP avec statut neutre côté client (anti tipping-off)', async () => {
      const kycId = await startSession('Joao Politico Exposto');
      const res = await request(app).post(`/api/nif/kyc/${kycId}/submit`).send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('escalated');
      // L'utilisateur ne doit jamais voir "PEP match" — statut neutre obligatoire
      expect(res.body.userFacingStatus).toBe('under_review');

      const escalation = await get<{ conversation_summary: string; status: string }>(
        "SELECT conversation_summary, status FROM lawyer_escalations WHERE conversation_summary LIKE '%KYC/AML%'"
      );
      expect(escalation).toBeDefined();
      expect(escalation!.status).toBe('pending');
      expect(escalation!.conversation_summary).toContain(kycId);
    });

    it('refuse une double soumission (409)', async () => {
      const kycId = await startSession('Jean Dupont');
      await request(app).post(`/api/nif/kyc/${kycId}/submit`).send({});
      const res = await request(app).post(`/api/nif/kyc/${kycId}/submit`).send({});
      expect(res.status).toBe(409);
    });

    it('renvoie 404 pour une session inconnue', async () => {
      const res = await request(app).post('/api/nif/kyc/unknown-id/submit').send({});
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/nif/kyc/:id', () => {
    it('expose le statut neutre pour une session escaladée', async () => {
      const start = await request(app).post('/api/nif/kyc/start').send({ fullname: 'PEP Demo' });
      const kycId = start.body.kycId;
      await request(app).post(`/api/nif/kyc/${kycId}/submit`).send({});

      const res = await request(app).get(`/api/nif/kyc/${kycId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('escalated');
      expect(res.body.userFacingStatus).toBe('under_review');
      expect(res.body.completed_at).toBeTruthy();
    });
  });
});
