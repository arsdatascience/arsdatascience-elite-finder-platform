-- ============================================
-- TENANTS (Multi-tenancy)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_id INTEGER, -- FK adicionada posteriormente se necessário
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    
    -- Campos extras de perfil
    username VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zip VARCHAR(10),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL
);

-- Índices
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

CREATE TABLE IF NOT EXISTS prompt_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    category VARCHAR(50) NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);

-- ============================================
-- AUDIO ANALYSIS
-- ============================================
CREATE TABLE IF NOT EXISTS audio_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    summary TEXT,
    global_sentiment JSONB,
    speakers JSONB,
    segments JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_analyses_user_id ON audio_analyses(user_id);

-- ============================================
-- FINANCIAL MODULE
-- ============================================

-- 1. Categorias Financeiras
CREATE TABLE IF NOT EXISTS financial_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    color VARCHAR(20) DEFAULT '#cbd5e1',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    service_type VARCHAR(100),
    tax_id VARCHAR(50),
    pix_key VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Transações Financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    category_id INTEGER REFERENCES financial_categories(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(50),
    recurrence VARCHAR(20) DEFAULT 'none',
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices Financeiros
CREATE INDEX IF NOT EXISTS idx_fin_trans_tenant ON financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_fin_trans_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fin_trans_type ON financial_transactions(type);

-- Inserção de Categorias Padrão (Idempotente)
INSERT INTO financial_categories (name, type, color, is_default) 
SELECT 'Receita de Serviços', 'income', '#22c55e', true
WHERE NOT EXISTS (SELECT 1 FROM financial_categories WHERE name = 'Receita de Serviços');

INSERT INTO financial_categories (name, type, color, is_default) 
SELECT 'Mídia Paga (Ads)', 'expense', '#ef4444', true
WHERE NOT EXISTS (SELECT 1 FROM financial_categories WHERE name = 'Mídia Paga (Ads)');

INSERT INTO financial_categories (name, type, color, is_default) 
SELECT 'Ferramentas & Software', 'expense', '#3b82f6', true
WHERE NOT EXISTS (SELECT 1 FROM financial_categories WHERE name = 'Ferramentas & Software');

INSERT INTO financial_categories (name, type, color, is_default) 
SELECT 'Pessoal & Salários', 'expense', '#eab308', true
WHERE NOT EXISTS (SELECT 1 FROM financial_categories WHERE name = 'Pessoal & Salários');

INSERT INTO financial_categories (name, type, color, is_default) 
SELECT 'Impostos', 'expense', '#64748b', true
WHERE NOT EXISTS (SELECT 1 FROM financial_categories WHERE name = 'Impostos');