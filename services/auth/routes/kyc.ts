import { Router, Request, Response } from 'express';
import { run, get } from '../db';
import crypto from 'crypto';

/**
 * KYC / eIDV — vérification d'identité du wizard NIF (étape 2.5).
 *
 * Devoir de vigilance Lei 83/2017 (LBC/FT) :
 *  - eIDV : comparaison passeport ↔ selfie liveness
 *  - PEP screening : OFAC, EU Sanctions, UN → match = blocage + escalade cabinet
 *  - Conservation 7 ans des données KYC (Art. 26)
 *
 * Driver via env KYC_DRIVER :
 *  - 'mock' (défaut POC) : décision simulée, déterministe pour les tests —
 *    un fullname contenant "REJECT" → eIDV rejetée ; un fullname présent dans
 *    la liste PEP simulée (ou contenant "PEP") → match → escalade.
 *  - 'veriff' : non implémenté — renvoie 501 tant que l'intégration prod
 *    n'est pas câblée (décision OQ-007 : Veriff retenu pour la production).
 */

const KYC_DRIVER = process.env.KYC_DRIVER || 'mock';
const PEP_LISTS = 'OFAC,EU_SANCTIONS,UN';
const RETENTION_YEARS = 7;

// Liste PEP simulée pour les démos POC (personnes fictives).
const MOCK_PEP_LIST = ['joao politico exposto', 'maria sancionada teste'];

function mockEidvDecision(fullname: string): 'approved' | 'rejected' {
  return /reject/i.test(fullname) ? 'rejected' : 'approved';
}

function mockPepScreening(fullname: string): 'clear' | 'match' {
  const normalized = fullname.trim().toLowerCase();
  if (/(^|\s)pep(\s|$|-)/i.test(fullname)) return 'match';
  return MOCK_PEP_LIST.includes(normalized) ? 'match' : 'clear';
}

function retentionUntil(from: Date): string {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + RETENTION_YEARS);
  return d.toISOString();
}

export function createKycRouter() {
  const router = Router();

  // POST /api/nif/kyc/start — ouvre une session de vérification
  router.post('/start', async (req: Request, res: Response): Promise<void> => {
    try {
      if (KYC_DRIVER !== 'mock') {
        res.status(501).json({ success: false, message: `KYC driver '${KYC_DRIVER}' not implemented yet` });
        return;
      }

      const { user_id, dossier_id, fullname } = req.body;
      if (!fullname || typeof fullname !== 'string') {
        res.status(400).json({ success: false, message: 'fullname is required' });
        return;
      }

      const kycId = crypto.randomUUID();
      const now = new Date();
      await run(
        `INSERT INTO kyc_verifications (id, user_id, dossier_id, provider, status, fullname, retention_until, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [kycId, user_id || null, dossier_id || null, KYC_DRIVER, 'pending', fullname, retentionUntil(now), now.toISOString()]
      );

      res.status(201).json({
        success: true,
        kycId,
        provider: KYC_DRIVER,
        status: 'pending',
        retentionYears: RETENTION_YEARS,
      });
    } catch (error) {
      console.error('Error starting KYC session:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/nif/kyc/:id/submit — simule eIDV (passeport ↔ selfie) + screening PEP
  router.post('/:id/submit', async (req: Request, res: Response): Promise<void> => {
    try {
      const kyc = await get<{ id: string; user_id: string | null; fullname: string; status: string }>(
        'SELECT id, user_id, fullname, status FROM kyc_verifications WHERE id = ?',
        [req.params.id]
      );
      if (!kyc) {
        res.status(404).json({ success: false, message: 'KYC session not found' });
        return;
      }
      if (kyc.status !== 'pending') {
        res.status(409).json({ success: false, message: `KYC session already ${kyc.status}` });
        return;
      }

      const eidvResult = mockEidvDecision(kyc.fullname);
      const pepResult = eidvResult === 'approved' ? mockPepScreening(kyc.fullname) : null;

      let status: 'approved' | 'rejected' | 'escalated';
      if (eidvResult === 'rejected') status = 'rejected';
      else if (pepResult === 'match') status = 'escalated';
      else status = 'approved';

      await run(
        `UPDATE kyc_verifications
         SET status = ?, eidv_result = ?, pep_result = ?, pep_lists_checked = ?, completed_at = ?
         WHERE id = ?`,
        [status, eidvResult, pepResult, PEP_LISTS, new Date().toISOString(), kyc.id]
      );

      // Match PEP → blocage du flow + escalade humaine cabinet (workflow interne,
      // jamais exposé à l'utilisateur — il voit seulement "vérification en cours").
      if (status === 'escalated') {
        await run(
          `INSERT INTO lawyer_escalations (id, user_id, conversation_summary, status)
           VALUES (?, ?, ?, 'pending')`,
          [crypto.randomUUID(), kyc.user_id, `[KYC/AML] Match PEP screening (${PEP_LISTS}) — dossier NIF bloqué, vigilance renforcée requise (Lei 83/2017). KYC id: ${kyc.id}`]
        );
      }

      res.status(200).json({
        success: true,
        kycId: kyc.id,
        status,
        // Le détail PEP n'est pas exposé côté client : l'utilisateur voit un statut
        // neutre "en cours d'examen" (anti tipping-off, Art. 54 Lei 83/2017).
        userFacingStatus: status === 'approved' ? 'verified' : status === 'rejected' ? 'failed' : 'under_review',
      });
    } catch (error) {
      console.error('Error submitting KYC verification:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/nif/kyc/:id — statut de la session
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const kyc = await get<{ id: string; status: string; provider: string; created_at: string; completed_at: string | null }>(
        'SELECT id, status, provider, created_at, completed_at FROM kyc_verifications WHERE id = ?',
        [req.params.id]
      );
      if (!kyc) {
        res.status(404).json({ success: false, message: 'KYC session not found' });
        return;
      }
      res.status(200).json({
        success: true,
        kycId: kyc.id,
        provider: kyc.provider,
        status: kyc.status,
        userFacingStatus: kyc.status === 'approved' ? 'verified' : kyc.status === 'rejected' ? 'failed' : kyc.status === 'escalated' ? 'under_review' : 'pending',
        created_at: kyc.created_at,
        completed_at: kyc.completed_at,
      });
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  return router;
}
