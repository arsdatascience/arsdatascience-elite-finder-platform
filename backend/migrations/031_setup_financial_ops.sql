
-- Migration: Setup Financial & Services in Ops (Maglev)
-- Recreating schema from Core but without cross-DB FKs to Users/Clients/Tenants

-- 1. SERVICES (from 024_create_services_table.sql)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    features TEXT[] DEFAULT '{}',
    category VARCHAR(50),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. FINANCIAL CATEGORIES
CREATE TABLE IF NOT EXISTS financial_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- income, expense
    color VARCHAR(20) DEFAULT '#000000',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    service_type VARCHAR(100),
    tax_id VARCHAR(50), -- CNPJ/CPF
    pix_key VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. FINANCIAL TRANSACTIONS
CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core
    
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- income, expense
    
    category_id INTEGER REFERENCES financial_categories(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    
    campaign_id INTEGER, -- Ref Core (Marketing)
    client_id INTEGER,   -- Ref Core
    user_id INTEGER,     -- Ref Core (related user)
    
    date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    payment_method VARCHAR(50),
    
    notes TEXT,
    created_by INTEGER, -- Ref Core (User)
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_trans_tenant ON financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_fin_trans_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fin_trans_client ON financial_transactions(client_id);
