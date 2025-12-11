-- Adicionar coluna template_id se não existir
ALTER TABLE agent_parameter_groups ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES agent_templates(id) ON DELETE CASCADE;

-- Inserir Template de Sales Coach
INSERT INTO agent_templates (template_id, template_name, template_description, category, base_config, default_parameters)
VALUES (
    'sales_coach_v1',
    'Elite Sales Coach',
    'Assistente especializado em vendas consultivas. Analisa conversas em tempo real, identifica objeções e sugere estratégias de fechamento baseadas em metodologias como SPIN Selling e Sandler.',
    'Sales',
    '{"system_prompt": "Você é um Coach de Vendas de Elite. Sua função é analisar a conversa entre um vendedor e um cliente, identificar o estágio da compra, detectar objeções ocultas e sugerir a próxima melhor ação. Use técnicas de SPIN Selling e Gatilhos Mentais. Seja conciso e estratégico.", "model": "gpt-4o"}'::jsonb,
    '[]'::jsonb
) ON CONFLICT (template_id) DO NOTHING;

-- Recuperar ID do Template
DO $$
DECLARE
    t_id INTEGER;
    g_strategy_id INTEGER;
    g_product_id INTEGER;
BEGIN
    SELECT id INTO t_id FROM agent_templates WHERE template_id = 'sales_coach_v1';

    -- Grupo: Estratégia de Vendas
    INSERT INTO agent_parameter_groups (group_id, group_label, display_order, template_id)
    VALUES ('strategy_config', 'Estratégia de Vendas', 1, t_id)
    RETURNING id INTO g_strategy_id;

    -- Parâmetros de Estratégia
    INSERT INTO agent_parameters (parameter_id, label, type, default_value, options, required, description, display_order, group_id)
    VALUES 
    (
        'methodology', 
        'Metodologia de Vendas', 
        'select', 
        'spin_selling', 
        '[{"label": "SPIN Selling", "value": "spin_selling"}, {"label": "Sandler Training", "value": "sandler"}, {"label": "Challenger Sale", "value": "challenger"}, {"label": "Venda Consultiva", "value": "consultative"}]'::jsonb, 
        true, 
        'A metodologia que o coach deve priorizar nas sugestões.', 
        1, 
        g_strategy_id
    ),
    (
        'tone', 
        'Tom de Voz', 
        'select', 
        'assertive', 
        '[{"label": "Consultivo & Empático", "value": "consultative"}, {"label": "Assertivo & Confidente", "value": "assertive"}, {"label": "Urgente & Direto (Closer)", "value": "closer"}]'::jsonb, 
        true, 
        'O tom das sugestões de resposta.', 
        2, 
        g_strategy_id
    );

    -- Grupo: Produto e Oferta
    INSERT INTO agent_parameter_groups (group_id, group_label, display_order, template_id)
    VALUES ('product_config', 'Produto e Oferta', 2, t_id)
    RETURNING id INTO g_product_id;

    -- Parâmetros de Produto
    INSERT INTO agent_parameters (parameter_id, label, type, default_value, options, required, description, display_order, group_id)
    VALUES 
    (
        'product_name', 
        'Nome do Produto/Serviço', 
        'text', 
        '', 
        null, 
        true, 
        'O nome do produto principal sendo vendido.', 
        1, 
        g_product_id
    ),
    (
        'key_benefits', 
        'Principais Benefícios', 
        'textarea', 
        '', 
        null, 
        true, 
        'Liste os 3-5 principais benefícios e diferenciais do produto.', 
        2, 
        g_product_id
    ),
    (
        'price_objection', 
        'Argumento de Preço', 
        'textarea', 
        '', 
        null, 
        false, 
        'Como justificar o preço ou lidar com pedidos de desconto?', 
        3, 
        g_product_id
    );

END $$;
