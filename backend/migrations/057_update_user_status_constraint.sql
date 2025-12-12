-- Migration: Update Users Status Constraint
-- Purpose: Allow 'deleted' as a valid status for users to support soft deletion persistence.
-- Created at: 2025-12-12

DO $$
BEGIN
    -- 1. Drop the existing constraint (if it exists) to remove old restrictions
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_status_check' AND table_name = 'users') THEN
        ALTER TABLE users DROP CONSTRAINT users_status_check;
    END IF;

    -- 2. Add the new constraint with the expanded list of allowed statuses
    ALTER TABLE users ADD CONSTRAINT users_status_check 
    CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));
END $$;
