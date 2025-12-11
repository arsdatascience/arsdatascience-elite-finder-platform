-- Migration: Enhance Clients Table for PF/PJ and Compliance
-- Created at: 2025-12-05

-- Access & Compliance
ALTER TABLE clients ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_consent BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS marketing_optin BOOLEAN DEFAULT false;

-- PF Specific
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rg VARCHAR(30);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);

-- PJ Specific
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fantasy_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state_registration VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS municipal_registration VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cnae VARCHAR(100);

-- PJ Legal Representative
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_cpf VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_role VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_email VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_phone VARCHAR(50);

-- Banking Information
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100);

-- Additional Info
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referral_source VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_references TEXT;

-- Address Expansion (Ensuring we have all needed fields)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_district VARCHAR(100);
-- (address_street, address_number, address_complement, address_city, address_state, address_zip already exist in schema.sql)
