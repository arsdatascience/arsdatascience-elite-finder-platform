-- NOTE: client_id references clients.id in crossover database (no FK possible across DBs)
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL, -- References clients(id) in crossover DB
    provider VARCHAR(50) NOT NULL, -- 'facebook', 'google', 'linkedin'
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT, -- Encrypted
    expires_at TIMESTAMP,
    account_id VARCHAR(100), -- Ad Account ID
    account_name VARCHAR(255),
    metadata JSONB DEFAULT '{}', -- Extra info like page_ids, scopes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, provider)
);

-- Index for fast lookup
CREATE INDEX idx_integrations_client_provider ON integrations(client_id, provider);
