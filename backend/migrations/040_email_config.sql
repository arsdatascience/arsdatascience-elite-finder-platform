-- Email Configuration Table
-- Stores SMTP settings per user (supports multiple configs)

CREATE TABLE IF NOT EXISTS email_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Principal',
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port VARCHAR(10) DEFAULT '587',
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    smtp_from VARCHAR(255),
    smtp_from_name VARCHAR(255),
    smtp_secure BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    use_for VARCHAR(50) DEFAULT 'all', -- 'all', 'alerts', 'reports', 'marketing'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_config_user_id ON email_config(user_id);

-- Ensure only one default per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_config_default ON email_config(user_id, is_default) WHERE is_default = true;
