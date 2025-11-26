-- 004_add_integrations_to_chatbots.sql

-- Adicionar coluna integrations do tipo JSONB na tabela chatbots
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}';

-- Criar índice para buscas rápidas dentro das integrações (ex: buscar por número de telefone conectado)
CREATE INDEX IF NOT EXISTS idx_chatbots_integrations ON chatbots USING gin (integrations);
