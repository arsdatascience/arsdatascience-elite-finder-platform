
-- ==============================================================================
-- MIGRATION 050: Hide System Agents from Store
-- ==============================================================================

-- 1. Add is_system column
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 2. Mark specific agents as system
UPDATE chatbots SET is_system = true WHERE name IN (
    'WhatsApp Intelligence Spy',
    'CRM Autopilot',
    'Assistente Jurídico (Compliance)',
    'Agente de Vendas Elite',
    'Recuperação de Carrinho',
    'Vendas Inteligentes (Upsell/Cross-sell)',
    'Elite Sales Coach',
    'FAQ Dinâmico Inteligente',
    'SAC Humanizado 24/7',
    'Suporte Multi-canal',
    'Suporte Técnico Avançado'
);
