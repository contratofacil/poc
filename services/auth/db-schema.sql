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
