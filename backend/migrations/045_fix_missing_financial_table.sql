
-- Fix missing financial_transactions table with CORRECT TYPES
DROP TABLE IF EXISTS financial_transactions;

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INTEGER, -- Changed from UUID to INTEGER to match tenants table
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- paid, pending, overdue
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    category VARCHAR(100),
    client_id INTEGER, -- Changed from UUID to INTEGER to match clients table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_financial_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_tenant ON financial_transactions(tenant_id);
