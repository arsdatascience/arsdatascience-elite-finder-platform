-- ============================================
-- ELITE FINDER - COMPLETE DATABASE SCHEMA
-- ============================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- CREATE EXTENSION IF NOT EXISTS vector; -- Desativado temporariamente pois a imagem do Railway não tem suporte nativo

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Garantir que a coluna 'role' exista (correção para erro de migração anterior)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;
END $$;

-- Adicionar colunas extras para membros da equipe
DO $$
BEGIN
    -- Username
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
    END IF;
    
    -- First Name e Last Name (separados do campo name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
    END IF;
    
    -- Telefone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- CPF
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='cpf') THEN
        ALTER TABLE users ADD COLUMN cpf VARCHAR(14) UNIQUE;
    END IF;
    
    -- Data de Registro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='registration_date') THEN
        ALTER TABLE users ADD COLUMN registration_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    -- Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    END IF;
    
    -- Endereço
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address_street') THEN
        ALTER TABLE users ADD COLUMN address_street VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address_number') THEN
        ALTER TABLE users ADD COLUMN address_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address_complement') THEN
        ALTER TABLE users ADD COLUMN address_complement VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address_district') THEN
        ALTER TABLE users ADD COLUMN address_district VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address_city') THEN
        ALTER TABLE users ADD COLUMN address_city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address_state') THEN
        ALTER TABLE users ADD COLUMN address_state CHAR(2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address_zip') THEN
        ALTER TABLE users ADD COLUMN address_zip VARCHAR(10);
    END IF;
    
    -- Permissões (JSON)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='permissions') THEN
        ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Updated At
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- LEADS
-- ============================================
-- Tenta criar a tabela leads se não existir
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    source VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new',
    value DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CAMPAIGNS
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50),
    status VARCHAR(50),
    budget DECIMAL(10, 2),
    spent DECIMAL(10, 2),
    ctr DECIMAL(5, 2),
    roas DECIMAL(5, 2),
    conversions INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CHATBOTS & AI AGENTS
-- ============================================
CREATE TABLE IF NOT EXISTS chatbots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    class VARCHAR(100),
    specialization_level INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    ai_config JSONB DEFAULT '{}',
    vector_config JSONB DEFAULT '{}',
    prompts JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHAT SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    external_id VARCHAR(255),
    channel VARCHAR(50) DEFAULT 'web',
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Correção robusta para lead_id em chat_messages
DO $$
BEGIN
    -- 1. Se a coluna existe mas não é UUID, dropamos para recriar corretamente
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='chat_messages' AND column_name='lead_id' AND data_type != 'uuid'
    ) THEN
        ALTER TABLE chat_messages DROP COLUMN lead_id;
    END IF;

    -- 2. Se a coluna não existe (ou foi dropada acima), criamos como UUID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='chat_messages' AND column_name='lead_id'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN lead_id UUID;
    END IF;
END $$;

-- Tentar adicionar a FK.
DO $$
BEGIN
    -- Remove constraint antiga se existir para evitar conflito
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chat_messages_lead_id_fkey') THEN
        ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_lead_id_fkey;
    END IF;

    BEGIN
        ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível adicionar FK chat_messages_lead_id_fkey: %', SQLERRM;
    END;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_lead_id ON chat_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- ============================================
-- INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected',
    access_token TEXT,
    refresh_token TEXT,
    config JSONB DEFAULT '{}',
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AUTOMATION WORKFLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS automation_workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    triggers TEXT,
    steps_count INTEGER DEFAULT 0,
    enrolled_count INTEGER DEFAULT 0,
    conversion_rate VARCHAR(50),
    flow_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_workflow_steps (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES automation_workflows(id) ON DELETE CASCADE,
    type VARCHAR(50),
    value TEXT,
    step_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SOCIAL POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS social_posts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    platform VARCHAR(50),
    scheduled_date TIMESTAMP,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TRAINING
-- ============================================
CREATE TABLE IF NOT EXISTS training_modules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    duration INTEGER,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES training_modules(id) ON DELETE CASCADE,
    status VARCHAR(50),
    progress INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- KPIS & ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS kpis (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    label VARCHAR(100),
    value VARCHAR(100),
    change DECIMAL(5, 2),
    trend VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_stats (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    device_type VARCHAR(50),
    percentage DECIMAL(5, 2),
    conversions INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- AGENT TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS agent_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    template_version VARCHAR(50) DEFAULT '1.0.0',
    category VARCHAR(100),
    base_config JSONB NOT NULL,
    default_parameters JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_parameter_groups (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(100) NOT NULL,
    group_label VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    chatbot_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_custom_parameters (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER,
    parameter_key VARCHAR(100) NOT NULL,
    parameter_value TEXT,
    parameter_type VARCHAR(50) DEFAULT 'text',
    category VARCHAR(100),
    display_label VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    helper_text TEXT,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
C R E A T E   T A B L E   I F   N O T   E X I S T S   p r o m p t _ t e m p l a t e s   (  
         i d   S E R I A L   P R I M A R Y   K E Y ,  
         u s e r _ i d   I N T E G E R   R E F E R E N C E S   u s e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
         n a m e   V A R C H A R ( 2 5 5 )   N O T   N U L L ,  
         d e s c r i p t i o n   T E X T ,  
         p r o m p t   T E X T   N O T   N U L L ,  
         n e g a t i v e _ p r o m p t   T E X T ,  
         c a t e g o r y   V A R C H A R ( 5 0 )   N O T   N U L L ,  
         i s _ p u b l i c   B O O L E A N   D E F A U L T   f a l s e ,  
         c r e a t e d _ a t   T I M E S T A M P   D E F A U L T   N O W ( ) ,  
         u p d a t e d _ a t   T I M E S T A M P   D E F A U L T   N O W ( )  
 ) ;  
  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ p r o m p t _ t e m p l a t e s _ u s e r _ i d   O N   p r o m p t _ t e m p l a t e s ( u s e r _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ p r o m p t _ t e m p l a t e s _ c a t e g o r y   O N   p r o m p t _ t e m p l a t e s ( c a t e g o r y ) ;  
 