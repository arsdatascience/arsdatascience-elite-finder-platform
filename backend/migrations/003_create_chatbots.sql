-- 003_create_chatbots.sql

-- Tabela de Chatbots / Agentes
CREATE TABLE IF NOT EXISTS chatbots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- juridico, vendas, suporte, etc.
    class VARCHAR(100), -- AgentePenalPadrao, etc.
    specialization_level INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, draft
    
    -- Configurações JSONB para flexibilidade
    ai_config JSONB DEFAULT '{}', -- provider, model, temperature, topP, etc.
    vector_config JSONB DEFAULT '{}', -- chunkingMode, sensitivity, filters, etc.
    prompts JSONB DEFAULT '{}', -- system, responseStructure, vectorSearch, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sessões de Conversa
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Opcional, se for usuário logado
    
    external_id VARCHAR(255), -- ID externo (ex: telefone WhatsApp, session_id do widget)
    channel VARCHAR(50) DEFAULT 'web', -- web, whatsapp, api
    status VARCHAR(50) DEFAULT 'active', -- active, closed, archived
    
    metadata JSONB DEFAULT '{}', -- Dados adicionais da sessão (origem, tags, etc.)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    role VARCHAR(50) NOT NULL, -- user, assistant, system, function
    content TEXT NOT NULL,
    
    metadata JSONB DEFAULT '{}', -- Tokens usados, latência, documentos recuperados (RAG), etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chatbots_status ON chatbots(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chatbot_id ON chat_sessions(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_external_id ON chat_sessions(external_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
