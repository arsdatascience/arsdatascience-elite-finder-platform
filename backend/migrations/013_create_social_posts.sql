-- NOTE: client_id references clients.id in crossover database (no FK possible across DBs)
DROP TABLE IF EXISTS social_posts;

CREATE TABLE social_posts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER, -- References clients(id) in crossover DB
    content TEXT,
    platform VARCHAR(50),
    status VARCHAR(20), -- scheduled, published, draft
    scheduled_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed inicial
INSERT INTO social_posts (client_id, content, platform, status, scheduled_date) VALUES
(1, 'Lançamento Verão 2025', 'instagram', 'scheduled', NOW() + INTERVAL '2 days'),
(1, 'Promoção Relâmpago', 'facebook', 'published', NOW() - INTERVAL '1 day'),
(2, 'Dica de Saúde Bucal', 'instagram', 'scheduled', NOW() + INTERVAL '1 day'),
(2, 'Antes e Depois: Clareamento', 'instagram', 'draft', NOW() + INTERVAL '5 days'),
(3, 'Tendências Outono/Inverno', 'pinterest', 'scheduled', NOW() + INTERVAL '3 days');
