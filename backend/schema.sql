-- ============================================
-- TENANTS (Multi-tenancy)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_zip VARCHAR(10),
    
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
    document VARCHAR(20), -- CPF ou CNPJ
    foundation_date DATE,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    
    -- Endereço
    address_zip VARCHAR(10),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    address_district VARCHAR(100),

    -- Compliance & Access
    username VARCHAR(100),
    password_hash TEXT,
    terms_accepted BOOLEAN DEFAULT false,
    privacy_accepted BOOLEAN DEFAULT false,
    data_consent BOOLEAN DEFAULT false,
    marketing_optin BOOLEAN DEFAULT false,

    -- PF Specific
    rg VARCHAR(30),
    birth_date DATE,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    nationality VARCHAR(100),
    mother_name VARCHAR(255),

    -- PJ Specific
    fantasy_name VARCHAR(255),
    state_registration VARCHAR(50),
    municipal_registration VARCHAR(50),
    company_size VARCHAR(50),
    cnae VARCHAR(100),

    -- PJ Legal Representative
    legal_rep_name VARCHAR(255),
    legal_rep_cpf VARCHAR(20),
    legal_rep_role VARCHAR(100),
    legal_rep_email VARCHAR(255),
    legal_rep_phone VARCHAR(50),

    -- Banking Information
    bank_name VARCHAR(100),
    bank_agency VARCHAR(50),
    bank_account VARCHAR(50),
    bank_account_type VARCHAR(50),
    pix_key VARCHAR(100),

    -- Additional Info
    notes TEXT,
    referral_source VARCHAR(100),
    client_references TEXT,
    
    triggers TEXT,
    steps_count INTEGER DEFAULT 0,
    enrolled_count INTEGER DEFAULT 0,
    conversion_rate VARCHAR(50),
    flow_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AUTOMATION WORKFLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS automation_workflows (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
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
-- LEADS
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(50),
    product_interest VARCHAR(100),
    value DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'new',
    assigned_to VARCHAR(100),
    tags TEXT[],
    last_contact TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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
    status VARCHAR(20) DEFAULT 'scheduled',
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
    template_id INTEGER REFERENCES agent_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_parameters (
    id SERIAL PRIMARY KEY,
    parameter_id VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    default_value TEXT,
    options JSONB,
    required BOOLEAN DEFAULT false,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    group_id INTEGER REFERENCES agent_parameter_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FINANCIAL MODULE
-- ============================================
CREATE TABLE IF NOT EXISTS financial_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(20) DEFAULT '#cbd5e1',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category_id INTEGER REFERENCES financial_categories(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);