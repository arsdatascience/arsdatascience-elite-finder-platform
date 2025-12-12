
-- ==============================================================================
-- MIGRATION 049: Seed Default Agents (Templates)
-- ==============================================================================

DO $$
DECLARE
    new_agent_id INTEGER;
    v_config_id INTEGER;
BEGIN

    -- 1. WhatsApp Intelligence Spy
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'WhatsApp Intelligence Spy') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('WhatsApp Intelligence Spy', 'Analisa conversas de WhatsApp em tempo real para extrair insights de vendas.', 'analytics', 'SaaS', 5, 'active', '{}', 'whatsapp-intelligence-spy')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature, top_p)
        VALUES (new_agent_id, 'openai', 'gpt-4o', 0.2, 0.1); -- Analytical/Precise

        INSERT INTO agent_vector_configs (chatbot_id, chunking_mode) VALUES (new_agent_id, 'semantic') RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt, script_content)
        VALUES (new_agent_id, 'Você é um especialista em inteligência de dados de conversas. Sua função é analisar logs de chat e extrair intenção de compra, objeções e perfil do cliente.', '');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 2. CRM Autopilot
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'CRM Autopilot') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('CRM Autopilot', 'Gestão automática de pipeline, qualificação de leads e follow-up.', 'automation', 'SaaS', 5, 'active', '{}', 'crm-autopilot')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.5);

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um gerente de CRM autônomo. Sua função é classificar leads, atualizar status de pipeline e sugerir próximos passos.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 3. Assistente Jurídico (Compliance)
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'Assistente Jurídico (Compliance)') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('Assistente Jurídico (Compliance)', 'Agente para triagem jurídica e análise preliminar de contratos.', 'legal', 'Legal', 5, 'active', '{}', 'assistente-juridico-compliance')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.1); -- Very precise

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um assistente jurídico sênior. Analise documentos com extremo rigor técnico e aponte riscos de compliance.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 4. Agente de Vendas Elite
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'Agente de Vendas Elite') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('Agente de Vendas Elite', 'Especialista em vendas consultivas de alta performance com estratégias psicológicas e fechamento.', 'sales', 'Sales', 5, 'active', '{}', 'agente-vendas-elite')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.8); -- Creative/Persuasive

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um vendedor de elite. Utilize técnicas de persuasão, PNL e gatilhos mentais para conduzir o lead ao fechamento.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 5. Recuperação de Carrinho
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'Recuperação de Carrinho') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('Recuperação de Carrinho', 'Especialista em converter carrinhos abandonados com ofertas persuasivas e gatilhos mentais de urgência.', 'sales', 'E-commerce', 5, 'active', '{}', 'recuperacao-carrinho')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.9); -- Highly persuasive

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é especialista em recuperação de vendas perdidas. Crie senso de urgência e escassez para converter carrinhos abandonados.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 6. Vendas Inteligentes (Upsell/Cross-sell)
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'Vendas Inteligentes (Upsell/Cross-sell)') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('Vendas Inteligentes (Upsell/Cross-sell)', 'Analisa o perfil e histórico do cliente para sugerir produtos complementares ou upgrades.', 'sales', 'E-commerce', 5, 'active', '{}', 'vendas-inteligentes-upsell')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.6);

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um consultor de expansão de conta. Identifique oportunidades de Upsell e Cross-sell baseadas no histórico do cliente.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 7. Elite Sales Coach
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'Elite Sales Coach') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('Elite Sales Coach', 'Assistente especializado em vendas consultivas. Analisa conversas e sugere estratégias de fechamento.', 'Sales', 'Coaching', 5, 'active', '{}', 'elite-sales-coach')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.5);

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um treinador de vendas experiente (SPIN Selling, Sandler). Analise a performance do vendedor e dê feedbacks construtivos.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 8. FAQ Dinâmico Inteligente
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'FAQ Dinâmico Inteligente') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('FAQ Dinâmico Inteligente', 'Transforma documentos estáticos em um especialista de Tira-Dúvidas.', 'support', 'Support', 5, 'active', '{}', 'faq-dinamico-inteligente')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-3.5-turbo', 0.3);

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é uma base de conhecimento interativa. Responda dúvidas estritamente com base nos documentos fornecidos.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 9. SAC Humanizado 24/7
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'SAC Humanizado 24/7') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('SAC Humanizado 24/7', 'Atendimento empático e resolutivo com escalação inteligente.', 'support', 'Support', 5, 'active', '{}', 'sac-humanizado-247')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.7);

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um atendente de SAC extremamente empático e paciente. Resolva o problema do cliente ou escale se necessário.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 10. Suporte Multi-canal
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'Suporte Multi-canal') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('Suporte Multi-canal', 'Atendimento unificado para WhatsApp, Webchat e Telegram, mantendo o contexto entre canais.', 'support', 'Support', 5, 'active', '{}', 'suporte-multi-canal')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.5);

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um agente de suporte omnichannel. Mantenha o contexto da conversa independente do canal de origem.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

    -- 11. Suporte Técnico Avançado
    IF NOT EXISTS (SELECT 1 FROM chatbots WHERE name = 'Suporte Técnico Avançado') THEN
        INSERT INTO chatbots (name, description, category, class, specialization_level, status, advanced_settings, slug)
        VALUES ('Suporte Técnico Avançado', 'Diagnóstico técnico, troubleshooting e resolução passo-a-passo.', 'technical', 'Support', 5, 'active', '{}', 'suporte-tecnico-avancado')
        RETURNING id INTO new_agent_id;

        INSERT INTO agent_ai_configs (chatbot_id, provider, model, temperature) VALUES (new_agent_id, 'openai', 'gpt-4o', 0.2);

        INSERT INTO agent_vector_configs (chatbot_id) VALUES (new_agent_id) RETURNING id INTO v_config_id;

        INSERT INTO agent_prompts (chatbot_id, system_prompt)
        VALUES (new_agent_id, 'Você é um engenheiro de suporte técnico nível 2. Guie o usuário em passos de troubleshooting lógicos e técnicos.');
        
        INSERT INTO agent_whatsapp_configs (chatbot_id, enabled, provider) VALUES (new_agent_id, false, 'evolution_api');
    END IF;

END $$;
