import { Router, Request, Response } from 'express';
import { run } from '../db';
import crypto from 'crypto';
import { callPrompt } from '../rag-llm-router';

// ─── Single source of truth for all contract templates ────────────────────────
// Referenced by GET /templates, /extract-fields, /suggest-field, /compliance-review

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  optional?: boolean;
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  badge?: string;
  fields: TemplateField[];
}

export const TEMPLATES: ContractTemplate[] = [
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
      { key: 'jurisdiction', label: 'Quelle juridiction régit cet accord ?', type: 'text' },
      { key: 'type_nda', label: 'Cet accord est-il mutuel ou unilatéral ?', type: 'select', options: ['Mutuel (bilatéral)', 'Unilatéral (une seule partie divulgue)', 'Multilatéral'] },
      { key: 'divulgateur', label: "Partie divulgatrice — nom complet et type d'entité", type: 'text' },
      { key: 'recepteur', label: "Partie réceptrice — nom complet et type d'entité", type: 'text' },
      { key: 'objet', label: 'Finalité principale de la divulgation', type: 'text' },
      { key: 'perimetre', label: 'Quel type d\'informations confidentielles sera protégé ?', type: 'textarea' },
      { key: 'duree', label: 'Durée de la confidentialité (ex : 2 ans, 18 mois)', type: 'text' },
      { key: 'penalite', label: 'Pénalité contractuelle en cas de violation (EUR)', type: 'number', optional: true },
      { key: 'carve_outs', label: 'Exclusions ou exceptions spécifiques ?', type: 'textarea', optional: true },
    ],
  },
];

// ─── Router factory ────────────────────────────────────────────────────────────

export function createEpic8Router(authMiddleware: any, _checkRole: any, logAudit: any) {
  const router = Router();

  // GET /api/contracts/templates
  router.get('/templates', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({ success: true, templates: TEMPLATES });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // POST /api/contracts/extract-fields
  // LLM extracts structured field values from a free-text user description.
  router.post('/extract-fields', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId, description, lang = 'FR' } = req.body;
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (!template || !description) {
        res.status(400).json({ success: false, message: 'templateId et description sont requis.' });
        return;
      }

      let raw: string;
      try {
        raw = await callPrompt('contract_extract_fields', {
          template_fields_json: JSON.stringify(
            template.fields.map((f) => ({ key: f.key, label: f.label, type: f.type, options: f.options })),
          ),
          description,
          lang,
        });
      } catch (llmErr: any) {
        console.warn('[extract-fields] LLM error:', llmErr?.message);
        res.json({ success: false, message: "Impossible d'extraire les informations. Répondez aux questions manuellement." });
        return;
      }

      // Strip potential markdown fences (```json ... ```)
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      } catch {
        console.warn('[extract-fields] JSON parse failed. Raw:', raw.slice(0, 200));
        res.json({ success: false, message: "Impossible d'extraire les informations. Répondez aux questions manuellement." });
        return;
      }

      // Filter to known field keys; validate select values against options
      const data: Record<string, string> = {};
      for (const field of template.fields) {
        const val = parsed[field.key];
        if (val === undefined || val === null) continue;
        const str = String(val).trim();
        if (!str) continue;
        if (field.type === 'select' && field.options && !field.options.includes(str)) continue;
        data[field.key] = str;
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error('[extract-fields] error:', error);
      res.json({ success: false, message: "Erreur inattendue. Répondez aux questions manuellement." });
    }
  });

  // POST /api/contracts/suggest-field
  // LLM suggests a value for the current form field based on context.
  router.post('/suggest-field', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId, fieldKey, lang = 'FR', answers = {} } = req.body;
      const template = TEMPLATES.find((t) => t.id === templateId);
      const field = template?.fields.find((f) => f.key === fieldKey);
      if (!field) {
        res.status(400).json({ success: false, message: 'Template ou champ introuvable.' });
        return;
      }

      let suggestion: string;
      try {
        suggestion = await callPrompt('contract_field_suggestion', {
          field_label: field.label,
          field_key: fieldKey,
          contract_type: templateId,
          other_answers_json: JSON.stringify(answers),
          lang,
        });
      } catch (llmErr: any) {
        console.warn('[suggest-field] LLM error:', llmErr?.message);
        res.json({ success: false, message: 'Suggestion indisponible pour le moment.' });
        return;
      }

      res.json({ success: true, suggestion: suggestion.trim() });
    } catch (error) {
      console.error('[suggest-field] error:', error);
      res.json({ success: false, message: 'Suggestion indisponible pour le moment.' });
    }
  });

  // POST /api/contracts/compliance-review
  // LLM reviews user answers and returns a list of risks / inconsistencies.
  router.post('/compliance-review', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
      const { templateId, data, lang = 'FR' } = req.body;
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (!template) {
        res.status(400).json({ success: false, findings: [] });
        return;
      }

      let raw: string;
      try {
        raw = await callPrompt('contract_compliance_review', {
          contract_type: templateId,
          fields_json: JSON.stringify(template.fields.map((f) => ({ key: f.key, label: f.label, type: f.type }))),
          data_json: JSON.stringify(data),
          lang,
        });
      } catch (llmErr: any) {
        console.warn('[compliance-review] LLM error:', llmErr?.message);
        res.json({ success: false, findings: [] });
        return;
      }

      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      let parsed: { findings?: unknown[] };
      try {
        parsed = JSON.parse(cleaned);
        if (typeof parsed !== 'object' || !Array.isArray(parsed.findings)) throw new Error('bad shape');
      } catch {
        console.warn('[compliance-review] JSON parse failed. Raw:', raw.slice(0, 200));
        res.json({ success: false, findings: [] });
        return;
      }

      const findings = (parsed.findings as any[])
        .filter(
          (f) =>
            typeof f === 'object' &&
            typeof f.message === 'string' &&
            ['warning', 'info'].includes(f.severity),
        )
        .slice(0, 6)
        .map((f) => ({
          field: typeof f.field === 'string' ? f.field : undefined,
          severity: f.severity as 'warning' | 'info',
          message: f.message as string,
        }));

      res.json({ success: true, findings });
    } catch (error) {
      console.error('[compliance-review] error:', error);
      res.json({ success: false, findings: [] });
    }
  });

  // POST /api/contracts/nrau-webhook — NRAU update webhook stub
  router.post('/nrau-webhook', async (req: Request, res: Response): Promise<void> => {
    const { contract_type, update_source, updated_clauses } = req.body;
    if (!contract_type) {
      res.status(400).json({ success: false, message: 'contract_type required' });
      return;
    }
    const logId = crypto.randomUUID();
    await run(
      `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, ip_addr, user_agent, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, 'system', 'nrau_webhook_received', 'contract_type', contract_type,
       req.ip ?? '', req.headers['user-agent'] ?? '', new Date().toISOString()],
    );
    console.log(`[NRAU WEBHOOK] Received update for ${contract_type}:`, { update_source, updated_clauses });
    res.json({ success: true, message: 'NRAU webhook received and logged' });
  });

  return router;
}
