CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'client',
    lang TEXT DEFAULT 'PT',
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS dossiers_nif (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT,
    fullname TEXT,
    birthdate TEXT,
    nationality TEXT,
    current_residence TEXT,
    passport_path TEXT,
    proof_of_address_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    stripe_id TEXT,
    amount REAL,
    currency TEXT,
    status TEXT,
    product TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    category TEXT NOT NULL,
    user_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_alert_logs (
    id TEXT PRIMARY KEY,
    compliance_item_id TEXT,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    FOREIGN KEY(compliance_item_id) REFERENCES compliance_items(id)
);

CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    status TEXT,
    template_id TEXT,
    data_json TEXT,
    pdf_url TEXT,
    r2_key TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    r2_key TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER,
    sha256 TEXT,
    encrypted_dek TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_vault_user_status
    ON vault_documents (user_id, status);
CREATE INDEX IF NOT EXISTS idx_vault_entity
    ON vault_documents (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS clause_versions (
    id TEXT PRIMARY KEY,
    contract_type TEXT,
    clause_key TEXT,
    content TEXT,
    loi_reference TEXT,
    valid_from TEXT,
    valid_to TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    ip_addr TEXT,
    user_agent TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistant_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lawyer_escalations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    conversation_summary TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    assigned_lawyer_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- KYC / eIDV — devoir de vigilance Lei 83/2017 (LBC/FT).
-- retention_until = created_at + 7 ans (Art. 26) ; aucune purge avant cette date.
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    dossier_id TEXT,
    provider TEXT DEFAULT 'mock',
    status TEXT DEFAULT 'pending',
    eidv_result TEXT,
    pep_result TEXT,
    pep_lists_checked TEXT,
    fullname TEXT,
    retention_until TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
);

INSERT INTO clause_versions (id, contract_type, clause_key, content, loi_reference, valid_from, valid_to) VALUES
('1', 'Bail', 'loyer', 'Le loyer mensuel est fixé à {loyer} EUR.', 'Art. 1040 du Code Civil Portugais', '2026-01-01', ''),
('2', 'Bail', 'duree', 'Le bail est conclu pour une durée de {duree} mois.', 'Art. 1042 du Code Civil Portugais', '2026-01-01', ''),
('3', 'Travail', 'salaire', 'Le salarié perçoit un salaire brut mensuel de {salaire} EUR.', 'Art. 273 du Code du Travail', '2026-01-01', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES
('compliance_orange_days', '90'),
('compliance_red_days', '30'),
('assistant_system_prompt', 'Vous êtes Luso-Legal, assistant juridique pour le droit portugais. Répondez uniquement aux questions relatives à la législation portugaise et européenne.')
ON CONFLICT (key) DO NOTHING;

-- Epic 9: Module B — Recherche Juridique IA

CREATE TABLE IF NOT EXISTS legal_documents (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content_chunk TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  qdrant_id TEXT,
  date TEXT,
  doc_type TEXT,
  indexed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source, external_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS research_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  mode TEXT DEFAULT 'standard',
  response_text TEXT,
  sources_json TEXT,
  summary TEXT,
  table_json TEXT,
  pdf_vault_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS indexing_runs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  docs_processed INTEGER DEFAULT 0,
  error TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS llm_prompts (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  provider TEXT DEFAULT 'anthropic',
  model TEXT DEFAULT 'claude-haiku-4-5',
  max_tokens INTEGER DEFAULT 2048,
  temperature REAL DEFAULT 0.3,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);

INSERT INTO llm_prompts (id, key, name, description, system_prompt, user_prompt_template, provider, model, max_tokens, temperature) VALUES
(
  'prompt-research-standard',
  'research_standard_system',
  'Recherche Standard — Synthèse',
  'Synthèse des résultats RAG pour une recherche juridique standard',
  'Vous êtes un expert en droit portugais et européen au sein du cabinet Oliveira & Cameiro Advogados Associados. Votre rôle est de synthétiser des résultats de recherche juridique en réponses précises, sourcées et actionnables. Répondez toujours en français. Citez les sources par leur titre et URL. Ne formulez jamais de conseil juridique personnalisé — présentez les textes et la jurisprudence applicables.',
  'Question juridique : {{query}}\n\nSources indexées disponibles :\n{{context}}\n\nRédigez une synthèse juridique structurée (3-5 paragraphes) avec références aux sources.',
  'anthropic',
  'claude-haiku-4-5',
  2048,
  0.2
),
(
  'prompt-research-deepdive',
  'research_deepdive_system',
  'DeepDive — Synthèse approfondie',
  'Analyse exhaustive multi-sources pour le mode DeepDive',
  'Vous êtes un expert en droit portugais et européen au sein du cabinet Oliveira & Cameiro Advogados Associados. En mode DeepDive, vous rédigez une analyse juridique exhaustive à partir de multiples sources officielles (DRE, DGSI, CURIA, EUR-Lex, CAAD). Votre analyse doit couvrir : (1) le cadre législatif applicable, (2) la jurisprudence pertinente, (3) les positions doctrinales, (4) les implications pratiques. Répondez en français. Structurez avec des titres clairs.',
  'Question juridique (DeepDive) : {{query}}\n\nSous-requêtes analysées : {{sub_queries}}\n\nSources multi-origines :\n{{context}}\n\nRédigez une analyse juridique exhaustive et structurée.',
  'anthropic',
  'claude-sonnet-4-6',
  4096,
  0.2
),
(
  'prompt-query-expand',
  'research_query_expand',
  'DeepDive — Expansion de requête',
  'Génère 3-5 sous-requêtes juridiques à partir d''une question principale',
  'Vous êtes un expert en recherche juridique. À partir d''une question juridique principale, générez exactement 3 à 5 sous-requêtes distinctes qui couvrent différents angles : (1) textes législatifs applicables, (2) jurisprudence nationale, (3) droit européen, (4) doctrine et commentaires, (5) cas pratiques similaires. Répondez UNIQUEMENT avec un tableau JSON de chaînes de caractères, sans autre texte.',
  'Question principale : {{query}}\n\nGénérez les sous-requêtes en JSON : ["sous-requête 1", "sous-requête 2", ...]',
  'anthropic',
  'claude-haiku-4-5',
  512,
  0.5
),
(
  'prompt-recap-table',
  'research_recap_table',
  'DeepDive — Tableau récapitulatif',
  'Génère un tableau HTML récapitulatif des résultats DeepDive',
  'Vous êtes un expert en présentation juridique. À partir des sources et de la question, générez un tableau HTML récapitulatif avec les colonnes : Source | Titre | Date | Point clé. Le HTML doit être propre, sans balises html/body, juste la table avec classe "recap-table".',
  'Question : {{query}}\n\nSources :\n{{sources_text}}\n\nGénérez le tableau HTML récapitulatif.',
  'anthropic',
  'claude-haiku-4-5',
  1024,
  0.1
),
(
  'prompt-assistant-system',
  'assistant_system',
  'Luso-Legal — Chatbot public',
  'Prompt système pour l''assistant Luso-Legal (Module A, grand public)',
  'Vous êtes Luso-Legal, assistant juridique pour le droit portugais. Répondez uniquement aux questions relatives à la législation portugaise et européenne. Soyez pédagogue, précis, et orientez vers les textes officiels quand possible. Ne formulez pas de conseil juridique personnalisé — suggérez de consulter un avocat pour les situations complexes.',
  NULL,
  'anthropic',
  'claude-haiku-4-5',
  1024,
  0.3
)
ON CONFLICT (key) DO NOTHING;

-- ─── Epic 8: New Contract Types ──────────────────────────────────────────────

INSERT INTO clause_versions (id, contract_type, clause_key, content, loi_reference, valid_from, valid_to) VALUES
('4', 'bail_commercial', 'loyer_commercial', 'Le loyer annuel est fixé à {loyer} EUR, payable mensuellement par douzièmes de {loyer_mensuel} EUR.', 'Art. 1038 do Código Civil + NRAU DL 321-B/90', '2026-01-01', ''),
('5', 'bail_commercial', 'duree_commerciale', 'Le bail commercial est conclu pour une durée initiale de {duree} ans, à compter du {date_debut}.', 'Art. 1110 do Código Civil + Art. 100 NRAU', '2026-01-01', ''),
('6', 'bail_commercial', 'activite', 'Les locaux sont destinés exclusivement à l''exercice de l''activité commerciale suivante : {activite}.', 'Art. 1109 do Código Civil', '2026-01-01', ''),
('7', 'bail_commercial', 'depot_garantie', 'Le preneur verse un dépôt de garantie de {depot} EUR, restitué en fin de bail déduction faite des éventuels dommages.', 'Art. 1076 do Código Civil', '2026-01-01', ''),
('8', 'nda', 'parties_nda', 'Le présent accord de confidentialité est conclu entre {divulgateur} (ci-après « Partie Divulgatrice ») et {recepteur} (ci-après « Partie Réceptrice »).', 'Art. 227 do Código Civil', '2026-01-01', ''),
('9', 'nda', 'duree_nda', 'Les obligations de confidentialité s''appliquent pendant une durée de {duree_mois} mois à compter de la date de signature.', 'Art. 406 do Código Civil', '2026-01-01', ''),
('10', 'nda', 'perimetre_confidentialite', 'Sont considérées comme confidentielles toutes les informations relatives à : {perimetre}. Sont exclues les informations déjà publiques ou communiquées par un tiers autorisé.', 'Art. 195 do Código Comercial', '2026-01-01', ''),
('11', 'nda', 'sanctions_violation', 'Toute violation de la présente clause de confidentialité pourra donner lieu à une indemnisation de {penalite} EUR ainsi qu''à toutes autres mesures conservatoires ou définitives prévues par le droit portugais.', 'Art. 562 do Código Civil', '2026-01-01', '')
ON CONFLICT (id) DO NOTHING;

-- ─── Epic 10: Document Analysis ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analysis_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cabinet_id TEXT,
  name TEXT,
  status TEXT DEFAULT 'uploading',
  doc_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  result_json TEXT,
  error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS analysis_documents (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  page_count INTEGER DEFAULT 0,
  ocr_done INTEGER DEFAULT 0,
  r2_key TEXT,
  text_extracted TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES analysis_sessions(id)
);

-- ─── Epic 11: Document Generation & Collaboration ────────────────────────────

CREATE TABLE IF NOT EXISTS generated_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cabinet_id TEXT,
  dossier_id TEXT,
  title TEXT,
  doc_type TEXT,
  instruction_nl TEXT,
  content_docx_r2_key TEXT,
  content_pdf_r2_key TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content_r2_key TEXT,
  created_by TEXT NOT NULL,
  change_summary TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_comments (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  anchor_text TEXT,
  mentions TEXT DEFAULT '[]',
  resolved INTEGER DEFAULT 0,
  parent_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS document_suggestions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  original_text TEXT,
  suggested_text TEXT,
  author_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ─── Epic 12: GED Cabinet ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cabinet_dossiers (
  id TEXT PRIMARY KEY,
  cabinet_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cabinet_documents (
  id TEXT PRIMARY KEY,
  cabinet_id TEXT NOT NULL,
  dossier_id TEXT,
  title TEXT NOT NULL,
  doc_type TEXT,
  tags TEXT DEFAULT '[]',
  r2_key TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  ai_category TEXT,
  ai_priority TEXT,
  ai_summary TEXT,
  indexed_qdrant INTEGER DEFAULT 0,
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS document_validations (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  cabinet_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  validator_id TEXT,
  notes TEXT,
  client_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- ─── Epic 13: Partner API + OAuth2 ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_api_keys (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  scopes TEXT DEFAULT 'contracts:read nif:read compliance:read',
  is_sandbox INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_tokens (
  token_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  scopes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_webhooks (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
