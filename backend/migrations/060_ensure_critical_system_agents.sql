-- Migration: Ensure Critical System Agents Exist
-- Date: 2025-12-12
-- Description: Explicitly ensures 'system-brain' and 'agent-sales-coach' exist to prevent 404 errors in Public Chat.

DO $$
DECLARE
    brain_id UUID;
    sales_coach_id INT;
BEGIN
    -- 1. Ensure SYSTEM BRAIN (system-brain)
    INSERT INTO chatbots (name, slug, description, category, status, created_at, updated_at)
    VALUES (
        'System Brain (Orchestrator)',
        'system-brain',
        'The central nervous system of the platform. Observes, analyzes, and optimizes all agent interactions in real-time.',
        'system',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET status = 'active'
    RETURNING id INTO brain_id;

    -- Ensure Brain Prompt
    INSERT INTO agent_prompts (chatbot_id, system_prompt, created_at, updated_at)
    SELECT brain_id, 'You are the SYSTEM ORCHESTRATOR...', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM agent_prompts WHERE chatbot_id = brain_id);

    -- Ensure Brain AI Config
    INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature, created_at, updated_at)
    SELECT brain_id, 'openai', 'gpt-4o', 0.2, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM agent_ai_configs WHERE chatbot_id = brain_id);


    -- 2. Ensure SALES COACH (agent-sales-coach)
    INSERT INTO chatbots (name, slug, description, is_system, status, specialty_area, specific_tools)
    VALUES (
        'Sales Coach', 
        'agent-sales-coach', 
        'Diretor de Estratégia Comercial focado em analisar conversas e sugerir táticas de fechamento.', 
        true, 
        'active', 
        'Sales',
        '{analyze_conversation}'
    )
    ON CONFLICT (slug) DO UPDATE SET status = 'active'
    RETURNING id INTO sales_coach_id;

    -- Ensure Sales Coach Prompt
    INSERT INTO agent_prompts (chatbot_id, system_prompt, type)
    VALUES (
        sales_coach_id, 
        'Atue como um Diretor de Estratégia Comercial e Marketing Sênior. Analise a conversa entre Agente e Cliente.
CONTEXTO:
Identifique se é uma conversa de VENDAS (perguntas sobre produto, preço) ou INFORMAL (piadas, social).
SE VENDAS: Identifique sentimento, objeções e a próxima melhor ação para FECHAR.
Gere um relatório JSON estrito.', 
        'system'
    )
    ON CONFLICT (chatbot_id) DO NOTHING;

    -- Ensure Sales Coach Config
    INSERT INTO agent_ai_configs (chatbot_id, model, provider, temperature, json_mode)
    VALUES (sales_coach_id, 'gpt-4o', 'openai', 0.7, true)
    ON CONFLICT (chatbot_id) DO UPDATE SET json_mode = true;

    RAISE NOTICE 'Critical System Agents (Brain, Sales Coach) Verified.';
END $$;
