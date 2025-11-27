-- 003_create_chatbots_fix.sql

-- Forçar a criação da tabela chat_messages se ela foi criada incorretamente ou parcialmente
DROP TABLE IF EXISTS chat_messages;

-- Recriar Tabela de Mensagens
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    role VARCHAR(50) NOT NULL, -- user, assistant, system, function
    content TEXT NOT NULL,
    
    metadata JSONB DEFAULT '{}', -- Tokens usados, latência, documentos recuperados (RAG), etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recriar o índice problemático
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
