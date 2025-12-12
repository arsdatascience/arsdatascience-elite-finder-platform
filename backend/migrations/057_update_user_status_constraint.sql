-- Migration: Update Users Status Constraint
-- Purpose: Allow 'deleted' as a valid status for users to support soft deletion persistence.
-- Created at: 2025-12-12

-- 1. Drop the existing constraint (if it exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- 2. Add the new constraint with the expanded list of allowed statuses
ALTER TABLE users ADD CONSTRAINT users_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));
