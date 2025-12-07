-- Email Configuration Table
-- Stores SMTP settings per user

CREATE TABLE IF NOT EXISTS email_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port VARCHAR(10) DEFAULT '587',
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    smtp_from VARCHAR(255),
    smtp_from_name VARCHAR(255),
    smtp_secure BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_config_user_id ON email_config(user_id);
