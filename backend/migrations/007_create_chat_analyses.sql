-- NOTE: client_id references clients.id in crossover database (no FK possible across DBs)
CREATE TABLE IF NOT EXISTS chat_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    client_id INTEGER, -- References clients(id) in crossover DB
    messages JSONB NOT NULL,
    analysis JSONB NOT NULL,
    provider VARCHAR(50),
    model VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
