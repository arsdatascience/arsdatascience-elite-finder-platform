-- Create data_sources table
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- postgres, qdrant, google_drive, etc
    connection_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Access Layers (Future use for permissions)
CREATE TABLE IF NOT EXISTS data_source_permissions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES data_sources(id) ON DELETE CASCADE,
    allowed_items TEXT[], -- specific tables or collections
    access_level VARCHAR(20) DEFAULT 'read', -- read, write
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed Data Sources provided by User
-- Idempotent approach: Delete first, then Insert
DELETE FROM data_sources WHERE name IN ('Crossover Protocol (App DB)', 'Tramway/Maglev (Ops DB)', 'Neural Memory (Qdrant)');

INSERT INTO data_sources (name, type, connection_config) VALUES 
('Crossover Protocol (App DB)', 'postgres', '{"connectionString": "postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway"}'),
('Neural Memory (Qdrant)', 'qdrant', '{"url": "https://e9459d08-5654-4794-a278-b3251bfbce21.us-east4-0.gcp.cloud.qdrant.io:6333", "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.GVIPFCWOEbpQlYdhK4i0aOEZCuXIv3tNO5ALBZFjx0Q"}');
