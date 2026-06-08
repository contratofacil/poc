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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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


INSERT OR IGNORE INTO clause_versions (id, contract_type, clause_key, content, loi_reference, valid_from, valid_to) VALUES 
('1', 'Bail', 'loyer', 'Le loyer mensuel est fixé à {loyer} EUR.', 'Art. 1040 du Code Civil Portugais', '2026-01-01', ''),
('2', 'Bail', 'duree', 'Le bail est conclu pour une durée de {duree} mois.', 'Art. 1042 du Code Civil Portugais', '2026-01-01', ''),
('3', 'Travail', 'salaire', 'Le salarié perçoit un salaire brut mensuel de {salaire} EUR.', 'Art. 273 du Code du Travail', '2026-01-01', '');

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO system_settings (key, value) VALUES 
('compliance_orange_days', '90'),
('compliance_red_days', '30'),
('assistant_system_prompt', 'Vous êtes Luso-Legal, assistant juridique pour le droit portugais. Répondez uniquement aux questions relatives à la législation portugaise et européenne.');
