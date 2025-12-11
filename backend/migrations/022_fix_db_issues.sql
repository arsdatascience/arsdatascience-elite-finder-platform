-- Migration: Fix Database Issues & Constraints
-- Created at: 2025-12-05

-- 1. Ensure 'document' column exists in clients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'document') THEN
        ALTER TABLE clients ADD COLUMN document VARCHAR(20);
    END IF;
END $$;

-- 2. Increase column lengths for clients to avoid "value too long" errors
ALTER TABLE clients ALTER COLUMN state_registration TYPE VARCHAR(100);
ALTER TABLE clients ALTER COLUMN municipal_registration TYPE VARCHAR(100);
ALTER TABLE clients ALTER COLUMN fantasy_name TYPE VARCHAR(255);
ALTER TABLE clients ALTER COLUMN legal_rep_email TYPE VARCHAR(255);

-- 3. Ensure User ID 1 exists (for automated jobs/system actions)
INSERT INTO users (id, name, email, password_hash, role, status)
VALUES (1, 'System User', 'system@elitefinder.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'super_admin', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Fix sequences if manual insert caused drift
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
