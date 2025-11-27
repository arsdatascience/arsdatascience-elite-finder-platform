-- Migração 006: Parâmetros Avançados para Agentes (Genérico e Configurável)
-- Adiciona campos de configuração avançada aplicáveis a qualquer tipo de agente

-- 1. Estender ai_configs com parâmetros avançados de IA
DO $$
BEGIN
    -- Frequência de penalidade (evitar repetições)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_ai_configs' AND column_name='frequency_penalty') THEN
        ALTER TABLE agent_ai_configs ADD COLUMN frequency_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (frequency_penalty BETWEEN 0 AND 2);
    END IF;

    -- Penalidade de presença (diversidade de vocabulário)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_ai_configs' AND column_name='presence_penalty') THEN
        ALTER TABLE agent_ai_configs ADD COLUMN presence_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (presence_penalty BETWEEN 0 AND 2);
    END IF;

    -- Stop sequences (palavras que param a geração)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_ai_configs' AND column_name='stop_sequences') THEN
        ALTER TABLE agent_ai_configs ADD COLUMN stop_sequences TEXT[];
    END IF;

    -- Modo de resposta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_ai_configs' AND column_name='response_mode') THEN
        ALTER TABLE agent_ai_configs ADD COLUMN response_mode VARCHAR(50) DEFAULT 'balanced';
        -- Valores sugeridos: 'concise', 'balanced', 'detailed', 'comprehensive'
    END IF;

    -- Candidate count (número de candidatos gerados)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_ai_configs' AND column_name='candidate_count') THEN
        ALTER TABLE agent_ai_configs ADD COLUMN candidate_count INTEGER DEFAULT 1 CHECK (candidate_count BETWEEN 1 AND 8);
    END IF;
END $$;

-- 2. Estender vector_configs com parâmetros de RAG avançado
DO $$
BEGIN
    -- Habilitar RAG
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='enable_rag') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN enable_rag BOOLEAN DEFAULT false;
    END IF;

    -- ID da base de conhecimento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='knowledge_base_id') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN knowledge_base_id VARCHAR(100);
    END IF;

    -- Estratégia de chunking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='chunking_strategy') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN chunking_strategy VARCHAR(50) DEFAULT 'semantic';
        -- Valores: 'fixed', 'semantic', 'recursive', 'adaptive'
    END IF;

    -- Overlap entre chunks (%)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='chunk_overlap_percent') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN chunk_overlap_percent INTEGER DEFAULT 10 CHECK (chunk_overlap_percent BETWEEN 0 AND 50);
    END IF;

    -- Número máximo de chunks recuperados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='max_retrieved_chunks') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN max_retrieved_chunks INTEGER DEFAULT 5 CHECK (max_retrieved_chunks BETWEEN 1 AND 20);
    END IF;

    -- Modo de busca vetorial
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='search_mode') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN search_mode VARCHAR(50) DEFAULT 'hybrid';
        -- Valores: 'semantic', 'keyword', 'hybrid'
    END IF;

    -- Reranking habilitado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='enable_reranking') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN enable_reranking BOOLEAN DEFAULT true;
    END IF;

    -- Distância mínima para considerar relevante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_vector_configs' AND column_name='min_relevance_score') THEN
        ALTER TABLE agent_vector_configs ADD COLUMN min_relevance_score DECIMAL(3,2) DEFAULT 0.70 CHECK (min_relevance_score BETWEEN 0 AND 1);
    END IF;
END $$;

-- 3. Criar tabela de Parâmetros Customizados (flexível para qualquer campo)
CREATE TABLE IF NOT EXISTS agent_custom_parameters (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    parameter_key VARCHAR(100) NOT NULL,
    parameter_value TEXT,
    parameter_type VARCHAR(50) DEFAULT 'string',
    -- Tipos: 'string', 'number', 'boolean', 'json', 'array', 'select'
    category VARCHAR(100),
    -- Categoria do parâmetro (ex: 'behavior', 'formatting', 'advanced')
    display_label VARCHAR(255),
    -- Label amigável para interface
    display_order INTEGER DEFAULT 0,
    -- Ordem de exibição
    helper_text TEXT,
    -- Texto de ajuda
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    is_editable BOOLEAN DEFAULT true,
    validation_rules JSONB,
    -- Regras de validação em formato JSON
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chatbot_id, parameter_key)
);

CREATE INDEX IF NOT EXISTS idx_custom_params_chatbot ON agent_custom_parameters(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_custom_params_category ON agent_custom_parameters(category);

-- 4. Criar tabela de Opções de Parâmetros (para campos select/multi-select)
CREATE TABLE IF NOT EXISTS agent_parameter_options (
    id SERIAL PRIMARY KEY,
    custom_parameter_id INTEGER REFERENCES agent_custom_parameters(id) ON DELETE CASCADE,
    option_value VARCHAR(255) NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    option_description TEXT,
    is_default BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_param_options_parameter ON agent_parameter_options(custom_parameter_id);

-- 5. Criar tabela de Grupos de Parâmetros (para organização na UI)
CREATE TABLE IF NOT EXISTS agent_parameter_groups (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    group_id VARCHAR(100) NOT NULL,
    group_label VARCHAR(255) NOT NULL,
    group_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_collapsed BOOLEAN DEFAULT false,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chatbot_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_param_groups_chatbot ON agent_parameter_groups(chatbot_id);

-- 6. Criar tabela de Regras de Validação
CREATE TABLE IF NOT EXISTS agent_validation_rules (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    -- Tipos: 'required', 'min', 'max', 'pattern', 'custom', 'dependency'
    target_parameter VARCHAR(100),
    -- Nome do parâmetro que esta regra valida
    rule_config JSONB,
    -- Configuração da regra (ex: {"min": 0, "max": 100})
    error_message TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_rules_chatbot ON agent_validation_rules(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_param ON agent_validation_rules(target_parameter);

-- 7. Criar tabela de Templates de Agentes
CREATE TABLE IF NOT EXISTS agent_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    template_version VARCHAR(20) DEFAULT '1.0.0',
    base_config JSONB,
    -- Configuração base do template (JSON completo do agente)
    default_parameters JSONB,
    -- Parâmetros padrão
    required_parameters TEXT[],
    -- Lista de parâmetros obrigatórios
    category VARCHAR(100),
    -- Categoria do template
    tags TEXT[],
    -- Tags para busca
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON agent_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON agent_templates(is_active);
