import { Router, Request, Response } from 'express';
import { run, get, all } from '../db';
import crypto from 'crypto';

export function createEpic8Router(authMiddleware: any, checkRole: any, logAudit: any) {
  const router = Router();

  // GET /api/contracts/templates — extended with bail_commercial + nda
  // (replaces the existing inline handler — mounted BEFORE the old one, so old one becomes unreachable)
  router.get('/templates', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = [
        {
          id: 'bail_habitation',
          name: "Contrat de bail d'habitation",
          type: 'Bail',
          description: 'Contrat de location standard pour logement résidentiel (NRAU).',
          fields: [
            { key: 'bailleur', label: 'Bailleur (nom complet)', type: 'text' },
            { key: 'preneur', label: 'Preneur (nom complet)', type: 'text' },
            { key: 'adresse', label: 'Adresse du bien', type: 'text' },
            { key: 'loyer', label: 'Loyer mensuel (EUR)', type: 'number' },
            { key: 'duree', label: 'Durée (mois)', type: 'number' },
            { key: 'date_debut', label: 'Date de début', type: 'date' },
          ],
        },
        {
          id: 'travail_cdi',
          name: 'Contrat de travail CDI',
          type: 'Travail',
          description: "Contrat de travail à durée indéterminée de droit portugais (Code du Travail).",
          fields: [
            { key: 'employeur', label: 'Employeur (raison sociale)', type: 'text' },
            { key: 'salarie', label: 'Salarié (nom complet)', type: 'text' },
            { key: 'poste', label: 'Poste / Fonction', type: 'text' },
            { key: 'salaire', label: 'Salaire brut mensuel (EUR)', type: 'number' },
            { key: 'date_debut', label: 'Date de début', type: 'date' },
          ],
        },
        {
          id: 'prestation_services',
          name: 'Contrat de prestation de services',
          type: 'Prestation',
          description: 'Contrat de services pour freelances et entreprises (Code Civil).',
          fields: [
            { key: 'prestataire', label: 'Prestataire', type: 'text' },
            { key: 'client', label: 'Client', type: 'text' },
            { key: 'objet', label: "Objet de la prestation", type: 'text' },
            { key: 'honoraires', label: 'Honoraires (EUR)', type: 'number' },
            { key: 'duree', label: 'Durée (mois)', type: 'number' },
          ],
        },
        {
          id: 'bail_commercial',
          name: 'Bail commercial (NRAU régime commercial)',
          type: 'bail_commercial',
          description: 'Contrat de bail commercial conforme au NRAU — locaux destinés à une activité commerciale ou industrielle.',
          badge: 'NRAU Commercial',
          fields: [
            { key: 'bailleur', label: 'Bailleur (propriétaire)', type: 'text' },
            { key: 'preneur', label: 'Preneur (locataire commercial)', type: 'text' },
            { key: 'adresse', label: 'Adresse des locaux', type: 'text' },
            { key: 'activite', label: 'Activité commerciale exercée', type: 'text' },
            { key: 'loyer', label: 'Loyer annuel (EUR)', type: 'number' },
            { key: 'loyer_mensuel', label: 'Loyer mensuel (EUR)', type: 'number' },
            { key: 'duree', label: 'Durée initiale (années)', type: 'number' },
            { key: 'date_debut', label: 'Date de début', type: 'date' },
            { key: 'depot', label: 'Dépôt de garantie (EUR)', type: 'number' },
          ],
        },
        {
          id: 'nda',
          name: 'Accord de Confidentialité (NDA)',
          type: 'nda',
          description: 'NDA unilatéral, bilatéral ou multilatéral conforme au droit des affaires portugais.',
          badge: 'Droit des affaires',
          fields: [
            { key: 'type_nda', label: 'Type', type: 'select', options: ['Unilatéral', 'Bilatéral', 'Multilatéral'] },
            { key: 'divulgateur', label: 'Partie divulgatrice', type: 'text' },
            { key: 'recepteur', label: 'Partie réceptrice', type: 'text' },
            { key: 'perimetre', label: 'Périmètre des informations confidentielles', type: 'textarea' },
            { key: 'duree_mois', label: 'Durée de confidentialité (mois)', type: 'number' },
            { key: 'penalite', label: 'Pénalité en cas de violation (EUR)', type: 'number' },
          ],
        },
      ];
      res.status(200).json({ success: true, templates });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // GET /api/contracts/nrau-webhook — stub for NRAU update webhook receiver
  router.post('/nrau-webhook', async (req: Request, res: Response): Promise<void> => {
    const { contract_type, update_source, updated_clauses } = req.body;
    if (!contract_type) {
      res.status(400).json({ success: false, message: 'contract_type required' });
      return;
    }
    // Log the webhook event for manual review
    const logId = crypto.randomUUID();
    await run(
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_addr, user_agent, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, 'system', 'nrau_webhook_received', 'contract_type', contract_type,
       req.ip ?? '', req.headers['user-agent'] ?? '', new Date().toISOString()]
    );
    console.log(`[NRAU WEBHOOK] Received update for ${contract_type}:`, { update_source, updated_clauses });
    res.json({ success: true, message: 'NRAU webhook received and logged' });
  });

  return router;
}
