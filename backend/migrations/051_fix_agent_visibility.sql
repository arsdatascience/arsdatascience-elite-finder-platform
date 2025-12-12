
-- ==============================================================================
-- MIGRATION 051: Fix Agent Visibility (Swap System vs Templates)
-- ==============================================================================

-- 1. MAKE TEMPLATES PUBLIC (is_system = false)
UPDATE chatbots SET is_system = false WHERE name IN (
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

-- 2. MAKE SYSTEM AGENTS PRIVATE/ADMIN ONLY (is_system = true)
UPDATE chatbots SET is_system = true WHERE name IN (
    'Agente de Vendas', -- Generic/Old one
    'Sales Coaching Master',
    'Creative Studio Director',
    'Elite Assistant',
    'Audio Analyst',
    'System Brain (Orchestrator)',
    'Chat AI Generalist'
);
