-- Migration: Migrate Hardcoded Agents to Database
-- Date: 2025-12-12
-- Description: Moves hardcoded system prompts from aiController.js and jobProcessor.js to the database.

DO $$
DECLARE
    sales_coach_id INT;
    elite_assistant_id INT;
    creative_director_id INT;
    batch_copywriter_id INT;
BEGIN
    -- ==================================================================================
    -- 1. SALES COACH (agent-sales-coach)
    -- ==================================================================================
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
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        is_system = EXCLUDED.is_system
    RETURNING id INTO sales_coach_id;

    INSERT INTO agent_prompts (chatbot_id, system_prompt, type)
    VALUES (
        sales_coach_id, 
        'Atue como um Diretor de Estratégia Comercial e Marketing Sênior. Analise a conversa entre Agente e Cliente.

CONTEXTO:
Identifique se é uma conversa de VENDAS (perguntas sobre produto, preço) ou INFORMAL (piadas, social).

SE INFORMAL:
- Não venda.
- Sugira manter conexão pessoal.
- Buying Stage: "Construção de Rapport".

SE VENDAS:
- Identifique sentimento, objeções e a próxima melhor ação para FECHAR.

Gere um relatório JSON estrito com:
1. "sentiment": Sentimento atual.
2. "detected_objections": Lista de objeções.
3. "buying_stage": Estágio (Curiosidade, Consideração, Decisão).
4. "suggested_strategy": Tática para usar AGORA.
5. "next_best_action": A próxima pergunta ou frase exata.
6. "coach_whisper": Dica curta e direta (sussurro).', 
        'system'
    )
    ON CONFLICT (chatbot_id) DO UPDATE SET system_prompt = EXCLUDED.system_prompt;

    INSERT INTO agent_ai_configs (chatbot_id, model, provider, temperature, json_mode)
    VALUES (sales_coach_id, 'gpt-4o', 'openai', 0.7, true)
    ON CONFLICT (chatbot_id) DO UPDATE SET json_mode = true;


    -- ==================================================================================
    -- 2. ELITE ASSISTANT (agent-elite-assistant)
    -- ==================================================================================
    INSERT INTO chatbots (name, slug, description, is_system, status, specialty_area, specific_tools)
    VALUES (
        'Elite Assistant', 
        'agent-elite-assistant', 
        'Assistente Geral da Plataforma Elite Finder. Responde sobre finanças, churn e dúvidas gerais.', 
        true, 
        'active', 
        'Support',
        '{rag_search, financial_analysis, churn_analysis}'
    )
    ON CONFLICT (slug) DO UPDATE SET is_system = EXCLUDED.is_system
    RETURNING id INTO elite_assistant_id;

    INSERT INTO agent_prompts (chatbot_id, system_prompt, type)
    VALUES (
        elite_assistant_id, 
        'Você é o **Elite Strategist**, um Especialista Sênior em Marketing Digital e Vendas da plataforma ''Elite Finder''.
Sua missão é ajudar o usuário a gerenciar sua agência/negócio, fornecendo insights baseados nos dados fornecidos.

DIRETRIZES:
1. Seja profissional, direto e estratégico.
2. Use os dados de CONTEXTO (Financeiro, Churn, RAG) para embasar suas respostas.
3. Se detectar Risco de Churn Alto, priorize a retenção.
4. Se perguntado sobre Finanças, use exatamente os números do Contexto Financeiro.
5. Se não tiver dados suficientes, diga "Não tenho informações internas sobre isso no momento".', 
        'system'
    )
    ON CONFLICT (chatbot_id) DO UPDATE SET system_prompt = EXCLUDED.system_prompt;

    INSERT INTO agent_ai_configs (chatbot_id, model, provider, temperature)
    VALUES (elite_assistant_id, 'gpt-4o', 'openai', 0.5)
    ON CONFLICT (chatbot_id) DO NOTHING;


    -- ==================================================================================
    -- 3. CREATIVE DIRECTOR (agent-creative-director)
    -- ==================================================================================
    INSERT INTO chatbots (name, slug, description, is_system, status, specialty_area, specific_tools)
    VALUES (
        'Creative Director', 
        'agent-creative-director', 
        'Copywriter especialista em criar conteúdo para redes sociais e anúncios.', 
        true, 
        'active', 
        'Marketing',
        '{generate_content}'
    )
    ON CONFLICT (slug) DO UPDATE SET is_system = EXCLUDED.is_system
    RETURNING id INTO creative_director_id;

    INSERT INTO agent_prompts (chatbot_id, system_prompt, type)
    VALUES (
        creative_director_id, 
        'Você é um Copywriter de Elite de classe mundial (nível Ogilvy/Gary Halbert).

TAREFA: Criar conteúdo de marketing de alta conversão.

REGRAS GERAIS:
1. Use gatilhos mentais (urgência, escassez, prova social).
2. Adapte o tom de voz conforme solicitado.
3. Se for Instagram/TikTok, foque no visual e retenção.
4. Se for LinkedIn/Blog, foque em autoridade e valor.
5. Sempre gere 3 opções de Headlines magnéticas.
6. Sempre inclua uma ideia visual (descrição de imagem/vídeo).

O formato de saída será sempre JSON estrito.', 
        'system'
    )
    ON CONFLICT (chatbot_id) DO UPDATE SET system_prompt = EXCLUDED.system_prompt;

    INSERT INTO agent_ai_configs (chatbot_id, model, provider, temperature, json_mode)
    VALUES (creative_director_id, 'gpt-4o', 'openai', 0.8, true)
    ON CONFLICT (chatbot_id) DO UPDATE SET json_mode = true;


    -- ==================================================================================
    -- 4. BATCH COPYWRITER (agent-batch-copywriter) -- NEW!
    -- ==================================================================================
    INSERT INTO chatbots (name, slug, description, is_system, status, specialty_area, specific_tools)
    VALUES (
        'Batch Copywriter', 
        'agent-batch-copywriter', 
        'Especialista em geração de conteúdo em massa (Lote) para calendários editoriais.', 
        true, 
        'active', 
        'Marketing',
        '{batch_generation}'
    )
    ON CONFLICT (slug) DO UPDATE SET is_system = EXCLUDED.is_system
    RETURNING id INTO batch_copywriter_id;

    INSERT INTO agent_prompts (chatbot_id, system_prompt, type)
    VALUES (
        batch_copywriter_id, 
        'ATUE COMO: Copywriter Sênior Especialista nas principais redes sociais.
TAREFA: Criar um único post de alta conversão para um dia específico de uma sequência.

REQUISITOS:
1. Headline Magnética (Gatilho de Curiosidade).
2. Corpo do texto formatado para a plataforma nativa.
3. Call to Action (CTA) claro e direto.
4. Hashtags estratégicas e relevantes.
5. Ideia visual clara para o designer ou editor.

Retorne SEMPRE um JSON estrito com as chaves: "headlines", "body", "cta", "hashtags", "imageIdea".', 
        'system'
    )
    ON CONFLICT (chatbot_id) DO UPDATE SET system_prompt = EXCLUDED.system_prompt;

    INSERT INTO agent_ai_configs (chatbot_id, model, provider, temperature, json_mode)
    VALUES (batch_copywriter_id, 'gpt-4-turbo-preview', 'openai', 0.7, true)
    ON CONFLICT (chatbot_id) DO UPDATE SET json_mode = true;


END $$;
