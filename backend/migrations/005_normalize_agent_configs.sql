-- 005_normalize_agent_configs.sql

-- Tabela de Configurações de IA
CREATE TABLE IF NOT EXISTS agent_ai_configs (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    provider VARCHAR(50),
    model VARCHAR(100),
    temperature DECIMAL(3, 2),
    top_p DECIMAL(3, 2),
    top_k INTEGER,
    max_tokens INTEGER,
    timeout INTEGER,
    retries INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações Vetoriais (RAG)
CREATE TABLE IF NOT EXISTS agent_vector_configs (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    chunking_mode VARCHAR(50),
    chunk_size INTEGER,
    sensitivity INTEGER,
    context_window INTEGER,
    relevance_threshold DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Filtros Vetoriais (1:N)
CREATE TABLE IF NOT EXISTS agent_vector_filters (
    id SERIAL PRIMARY KEY,
    vector_config_id INTEGER REFERENCES agent_vector_configs(id) ON DELETE CASCADE,
    filter_tag VARCHAR(100)
);

-- Tabela de Prompts
CREATE TABLE IF NOT EXISTS agent_prompts (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    system_prompt TEXT,
    response_structure_prompt TEXT,
    vector_search_prompt TEXT,
    analysis_prompt TEXT,
    complex_cases_prompt TEXT,
    validation_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações de WhatsApp
CREATE TABLE IF NOT EXISTS agent_whatsapp_configs (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT FALSE,
    provider VARCHAR(50), -- 'official', 'evolution_api'
    
    -- Campos Evolution API
    evolution_base_url VARCHAR(255),
    evolution_api_key VARCHAR(255),
    evolution_instance_name VARCHAR(100),
    
    -- Campos WhatsApp Cloud API
    official_phone_number_id VARCHAR(100),
    official_access_token TEXT,
    official_verify_token VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance nas chaves estrangeiras
CREATE INDEX IF NOT EXISTS idx_agent_ai_configs_chatbot_id ON agent_ai_configs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_agent_vector_configs_chatbot_id ON agent_vector_configs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_agent_vector_filters_config_id ON agent_vector_filters(vector_config_id);
CREATE INDEX IF NOT EXISTS idx_agent_prompts_chatbot_id ON agent_prompts(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_configs_chatbot_id ON agent_whatsapp_configs(chatbot_id);
