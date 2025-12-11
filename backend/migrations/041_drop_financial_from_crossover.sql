-- Migration to drop financial tables from Crossover DB (they now live in Maglev/OPS DB)
-- This migration should ONLY be run on Crossover database

-- Drop foreign keys first if they exist
ALTER TABLE IF EXISTS financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_client_id_fkey;
ALTER TABLE IF EXISTS financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_user_id_fkey;
ALTER TABLE IF EXISTS financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_category_id_fkey;

-- Drop tables (they are now in Maglev DB)
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS financial_categories CASCADE;

-- Note: These tables should exist in Maglev (OPS) database instead
-- The backend code now uses db.opsPool for all financial operations
