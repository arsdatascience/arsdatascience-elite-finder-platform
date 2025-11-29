
-- Adicionar client_id em device_stats se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='device_stats' AND column_name='client_id') THEN 
        ALTER TABLE device_stats ADD COLUMN client_id INTEGER REFERENCES clients(id);
    END IF;
END $$;

-- Criar tabela conversion_sources se não existir
CREATE TABLE IF NOT EXISTS conversion_sources (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    source_name VARCHAR(50),
    percentage NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Limpar dados antigos para evitar duplicatas ao rodar múltiplas vezes (opcional, cuidado em prod)
DELETE FROM device_stats;
DELETE FROM conversion_sources;

-- Inserir dados para Cliente 1 (TechSolutions)
INSERT INTO device_stats (client_id, device_type, percentage) VALUES 
(1, 'Mobile', 45), (1, 'Desktop', 50), (1, 'Tablet', 5);

INSERT INTO conversion_sources (client_id, source_name, percentage) VALUES
(1, 'Google Ads', 40), (1, 'Meta Ads', 35), (1, 'Busca Orgânica', 15), (1, 'Direto', 10);

-- Inserir dados para Cliente 2 (Dr. Silva)
INSERT INTO device_stats (client_id, device_type, percentage) VALUES 
(2, 'Mobile', 80), (2, 'Desktop', 15), (2, 'Tablet', 5);

INSERT INTO conversion_sources (client_id, source_name, percentage) VALUES
(2, 'Google Ads', 20), (2, 'Meta Ads', 60), (2, 'Indicação', 20);

-- Inserir dados para Cliente 3 (Moda & Estilo)
INSERT INTO device_stats (client_id, device_type, percentage) VALUES 
(3, 'Mobile', 90), (3, 'Desktop', 10), (3, 'Tablet', 0);

INSERT INTO conversion_sources (client_id, source_name, percentage) VALUES
(3, 'Instagram', 70), (3, 'Google Shopping', 20), (3, 'Influencers', 10);

-- Inserir Leads para Receita (Garantir que existam leads com status 'won'/'venda')
INSERT INTO leads (client_id, name, email, phone, status, value, created_at) VALUES
(1, 'Empresa A', 'contato@a.com', '1199999999', 'won', 15000, NOW() - INTERVAL '2 days'),
(1, 'Empresa B', 'contato@b.com', '1199999999', 'won', 8500, NOW() - INTERVAL '5 days'),
(1, 'Empresa C', 'contato@c.com', '1199999999', 'closed', 12000, NOW() - INTERVAL '10 days'),
(2, 'Paciente X', 'p@x.com', '1199999999', 'venda', 2500, NOW() - INTERVAL '1 day'),
(2, 'Paciente Y', 'p@y.com', '1199999999', 'venda', 4000, NOW() - INTERVAL '3 days'),
(3, 'Cliente Fashion', 'c@f.com', '1199999999', 'venda', 850, NOW() - INTERVAL '1 day'),
(3, 'Cliente Style', 'c@s.com', '1199999999', 'venda', 1200, NOW() - INTERVAL '2 days');
